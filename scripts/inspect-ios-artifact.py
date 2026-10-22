#!/usr/bin/env python3
"""Inspect an EAS iOS archive without extracting it; verify its privacy manifest."""

import argparse
import json
import plistlib
import sys
import tarfile
import zipfile


MAX_PLIST_BYTES = 4 * 1024 * 1024


class InspectionError(Exception):
    pass


def fail(message):
    raise InspectionError(message)


def safe_member_name(name):
    """Normalize archive names while refusing absolute paths and traversal."""
    if not isinstance(name, str) or "\\" in name or name.startswith("/"):
        fail("Archive contains an unsafe path")
    parts = [part for part in name.split("/") if part not in ("", ".")]
    if any(part == ".." for part in parts):
        fail("Archive contains an unsafe path")
    return "/".join(parts)


def read_bounded(stream, size):
    if size < 0 or size > MAX_PLIST_BYTES:
        fail("Archive plist exceeds the allowed size")
    data = stream.read(MAX_PLIST_BYTES + 1)
    if len(data) > MAX_PLIST_BYTES:
        fail("Archive plist exceeds the allowed size")
    return data


def archive_plists(path):
    """Read the main app plist and every PrivacyInfo.xcprivacy without extraction."""
    info_plists = {}
    privacy_plists = {}

    def add(name, data, kind):
        if kind == "info":
            target = info_plists
        else:
            target = privacy_plists
        if name in target:
            fail("Archive contains duplicate plist entries")
        target[name] = data

    if zipfile.is_zipfile(path):
        with zipfile.ZipFile(path) as archive:
            for item in archive.infolist():
                name = safe_member_name(item.filename)
                is_symlink = ((item.external_attr >> 16) & 0o170000) == 0o120000
                if is_symlink and name.endswith("PrivacyInfo.xcprivacy"):
                    fail("Archive privacy manifest cannot be a symlink")
                if is_symlink:
                    continue
                if item.is_dir():
                    if name.endswith("PrivacyInfo.xcprivacy"):
                        fail("Archive privacy manifest is not a regular file")
                    continue
                is_info = name.endswith(".app/Info.plist")
                is_privacy = name.endswith("PrivacyInfo.xcprivacy")
                if is_info or is_privacy:
                    if item.file_size > MAX_PLIST_BYTES:
                        fail("Archive plist exceeds the allowed size")
                    with archive.open(item) as stream:
                        data = read_bounded(stream, item.file_size)
                    if is_info:
                        add(name, data, "info")
                    else:
                        add(name, data, "privacy")
    else:
        try:
            archive = tarfile.open(path, mode="r:gz")
        except (tarfile.TarError, OSError):
            fail("Artifact is not a supported zip or gzip tar archive")
        with archive:
            for item in archive:
                name = safe_member_name(item.name)
                if (item.issym() or item.islnk()) and name.endswith("PrivacyInfo.xcprivacy"):
                    fail("Archive privacy manifest cannot be a symlink")
                if not item.isfile():
                    if name.endswith("PrivacyInfo.xcprivacy"):
                        fail("Archive privacy manifest is not a regular file")
                    continue
                is_info = name.endswith(".app/Info.plist")
                is_privacy = name.endswith("PrivacyInfo.xcprivacy")
                if is_info or is_privacy:
                    if item.size > MAX_PLIST_BYTES:
                        fail("Archive plist exceeds the allowed size")
                    stream = archive.extractfile(item)
                    if stream is None:
                        fail("Could not read plist from artifact")
                    with stream:
                        data = read_bounded(stream, item.size)
                    if is_info:
                        add(name, data, "info")
                    else:
                        add(name, data, "privacy")

    main_info_names = [name for name in info_plists if name.endswith(".app/Info.plist")]
    if len(main_info_names) != 1:
        fail("Artifact must contain exactly one app bundle Info.plist")
    info_name = main_info_names[0]
    app_root = info_name[: -len("/Info.plist")]
    main_privacy_name = app_root + "/PrivacyInfo.xcprivacy"
    if main_privacy_name not in privacy_plists:
        fail("Main app privacy manifest is missing")
    try:
        info = plistlib.loads(info_plists[info_name])
        privacy = {
            name: plistlib.loads(data) for name, data in privacy_plists.items()
        }
    except plistlib.InvalidFileException:
        fail("Artifact contains an invalid plist")
    return info, main_privacy_name, privacy


def normalized_collected_types(manifest):
    entries = manifest.get("NSPrivacyCollectedDataTypes", [])
    if not isinstance(entries, list):
        fail("Privacy manifest collected-data list is missing")
    normalized = []
    for entry in entries:
        if not isinstance(entry, dict):
            fail("Privacy manifest contains an invalid collected-data entry")
        data_type = entry.get("NSPrivacyCollectedDataType")
        purposes = entry.get("NSPrivacyCollectedDataTypePurposes", [])
        linked = entry.get("NSPrivacyCollectedDataTypeLinked")
        tracking = entry.get("NSPrivacyCollectedDataTypeTracking", False)
        if not isinstance(data_type, str) or not isinstance(purposes, list):
            fail("Privacy manifest contains an incomplete collected-data entry")
        if not all(isinstance(purpose, str) for purpose in purposes):
            fail("Privacy manifest contains an invalid purpose")
        normalized.append({
            "type": data_type,
            "linked": linked,
            "tracking": tracking,
            "purposes": sorted(purposes),
        })
    if len({entry["type"] for entry in normalized}) != len(normalized):
        fail("Privacy manifest contains duplicate collected-data categories")
    return sorted(normalized, key=lambda entry: entry["type"])


def required_reason_map(manifest):
    entries = manifest.get("NSPrivacyAccessedAPITypes", [])
    if not isinstance(entries, list):
        fail("Required-reason API declarations are missing")
    result = {}
    for entry in entries:
        if not isinstance(entry, dict):
            fail("Required-reason API declaration is invalid")
        api = entry.get("NSPrivacyAccessedAPIType")
        reasons = entry.get("NSPrivacyAccessedAPITypeReasons")
        if not isinstance(api, str) or not isinstance(reasons, list) or not reasons:
            fail("Required-reason API declaration is incomplete")
        if not all(isinstance(reason, str) and reason for reason in reasons):
            fail("Required-reason API declaration contains an invalid reason")
        if api in result:
            fail("Required-reason API declaration is duplicated")
        result[api] = sorted(reasons)
    return {api: result[api] for api in sorted(result)}


def load_json(path):
    try:
        with open(path, "r", encoding="utf-8") as stream:
            return json.load(stream)
    except (OSError, json.JSONDecodeError):
        fail("Could not read app configuration")


def inspect(args):
    app = load_json(args.config).get("expo", {})
    ios = app.get("ios", {})
    expected = {
        "bundleIdentifier": ios.get("bundleIdentifier"),
        "version": app.get("version"),
        "buildNumber": str(ios.get("buildNumber", "")),
    }
    if not all(expected.values()):
        fail("App configuration is missing expected iOS metadata")

    info, main_privacy_path, archived_manifests = archive_plists(args.artifact)
    manifest = archived_manifests[main_privacy_path]
    observed = {
        "bundleIdentifier": info.get("CFBundleIdentifier"),
        "version": info.get("CFBundleShortVersionString"),
        "buildNumber": str(info.get("CFBundleVersion", "")),
        "sdk": info.get("DTSDKName"),
    }
    for field in ("bundleIdentifier", "version", "buildNumber"):
        if str(observed[field] or "") != str(expected[field]):
            fail("Native artifact metadata does not match app.json")
    if not isinstance(observed["sdk"], str) or not observed["sdk"]:
        fail("Native artifact SDK metadata is missing")

    configured_manifest = ios.get("privacyManifests")
    if not isinstance(configured_manifest, dict):
        fail("App configuration privacy manifest is missing")
    configured_types = normalized_collected_types(configured_manifest)
    observed_types = normalized_collected_types(manifest)
    if configured_types != observed_types:
        fail("Native privacy categories, linkage, tracking, or purposes differ from app.json")
    if configured_manifest.get("NSPrivacyTracking") is not False:
        fail("App configuration must disable tracking")
    if configured_manifest.get("NSPrivacyTrackingDomains") != []:
        fail("App configuration tracking domains must be empty")
    if manifest.get("NSPrivacyTracking") is not False:
        fail("Native privacy manifest must disable tracking")
    if manifest.get("NSPrivacyTrackingDomains") != []:
        fail("Native privacy manifest tracking domains must be empty")
    if any(entry["tracking"] is not False for entry in observed_types):
        fail("Native collected-data entries must all disable tracking")
    if any(entry["linked"] is not True for entry in observed_types):
        fail("Native collected-data entries must all be linked")
    if any(not entry["purposes"] or entry["purposes"] != ["NSPrivacyCollectedDataTypePurposeAppFunctionality"] for entry in observed_types):
        fail("Native collected-data purposes must be app functionality")

    reasons = required_reason_map(manifest)
    baseline = load_json(args.required_reason_apis)
    if reasons != required_reason_map(baseline):
        fail("Native required-reason API declarations differ from the audited baseline")

    allowed_data_types = {entry["type"] for entry in configured_types}
    embedded_reports = []
    for manifest_path, embedded_manifest in sorted(archived_manifests.items()):
        if manifest_path == main_privacy_path:
            continue
        tracking = embedded_manifest.get("NSPrivacyTracking", False)
        tracking_domains = embedded_manifest.get("NSPrivacyTrackingDomains", [])
        if tracking is not False or not isinstance(tracking_domains, list) or tracking_domains:
            fail("Embedded SDK privacy manifest declares tracking")
        categories = normalized_collected_types(embedded_manifest)
        if any(entry["type"] not in allowed_data_types for entry in categories):
            fail("Embedded SDK privacy manifest declares an unexpected data category")
        if any(entry["tracking"] is not False for entry in categories):
            fail("Embedded SDK collected-data entry declares tracking")
        if any(
            not entry["purposes"]
            or entry["purposes"] != ["NSPrivacyCollectedDataTypePurposeAppFunctionality"]
            for entry in categories
        ):
            fail("Embedded SDK data purposes differ from the disclosed app functionality")
        embedded_reasons = required_reason_map(embedded_manifest)
        if any(
            api not in reasons or not set(values).issubset(reasons[api])
            for api, values in embedded_reasons.items()
        ):
            fail("Embedded SDK required reasons are missing from the app manifest")
        embedded_reports.append({
            "path": manifest_path,
            "tracking": tracking,
            "trackingDomains": tracking_domains,
            "collectedDataCategories": categories,
            "requiredReasonApis": [
                {"api": api, "reasons": embedded_reasons[api]}
                for api in sorted(embedded_reasons)
            ],
        })

    report = {
        "status": "passed",
        "profile": args.profile,
        "app": observed,
        "privacy": {
            "mainManifestPath": main_privacy_path,
            "tracking": manifest["NSPrivacyTracking"],
            "trackingDomains": manifest["NSPrivacyTrackingDomains"],
            "collectedDataCategories": observed_types,
            "requiredReasonApis": [
                {"api": api, "reasons": reasons[api]} for api in sorted(reasons)
            ],
            "embeddedManifests": embedded_reports,
        },
    }
    with open(args.report, "w", encoding="utf-8") as stream:
        json.dump(report, stream, indent=2, sort_keys=True)
        stream.write("\n")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--artifact", required=True)
    parser.add_argument("--profile", choices=("production", "app-store", "app-store-simulator"), required=True)
    parser.add_argument("--config", default="app.json")
    parser.add_argument("--required-reason-apis", default="docs/app-store/required-reason-apis.json")
    parser.add_argument("--report", default="native-privacy-report.json")
    args = parser.parse_args()
    try:
        expected_suffix = ".tar.gz" if args.profile == "app-store-simulator" else ".ipa"
        if not args.artifact.endswith(expected_suffix):
            fail("Artifact extension does not match the selected build profile")
        inspect(args)
    except Exception:
        try:
            with open(args.report, "w", encoding="utf-8") as stream:
                json.dump({
                    "status": "failed",
                    "profile": args.profile,
                    "error": "Artifact metadata or privacy validation did not pass",
                }, stream, indent=2, sort_keys=True)
                stream.write("\n")
        except OSError:
            pass
        print("Artifact inspection failed: metadata or privacy validation did not pass", file=sys.stderr)
        return 1
    print("Native artifact metadata and privacy manifest validated")
    return 0


if __name__ == "__main__":
    sys.exit(main())
