# TestFlight Deployment

HomeDoc uses Expo EAS for TestFlight builds.

## Current Flow

1. Push app changes to `main`.
2. Run the GitHub Actions workflow `iOS TestFlight`.
3. The workflow restores local iOS signing credentials from GitHub Actions secrets.
4. EAS builds with the `production` profile, waits for completion, and auto-submits to App Store Connect.

The `production` profile in `eas.json` intentionally uses:

```json
"credentialsSource": "local",
"ios": {
  "image": "macos-sequoia-15.6-xcode-26.0"
}
```

This bypasses stale remote credentials on Expo's servers.

The iOS image is pinned because App Store Connect now rejects builds made with the iOS 18.5 SDK / Xcode 16.4. Expo documents `macos-sequoia-15.6-xcode-26.0` as the Xcode 26 image, and EAS's default `auto` image for this Expo SDK can otherwise select Xcode 16.4.

The submit profile includes the App Store Connect app ID:

```json
"ascAppId": "6779373725",
"ascApiKeyPath": "ios/certs/AuthKey.p8",
"ascApiKeyId": "2D56H437CR",
"ascApiKeyIssuerId": "69a6de96-5186-47e3-e053-5b8c7c11a4d1"
```

## Required GitHub Secrets

- `EAS_TOKEN`
- `ASC_API_KEY_P8`
- `ASC_KEY_ID`
- `ASC_ISSUER_ID`
- `APPLE_TEAM_ID`
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `IOS_DIST_CERT_P12_BASE64`
- `IOS_DIST_CERT_PASSWORD`
- `IOS_PROVISIONING_PROFILE_BASE64`

The iOS signing files are restored at workflow runtime into:

- `ios/certs/dist-cert.p12`
- `ios/certs/profile.mobileprovision`
- `credentials.json`

These files must stay gitignored.

## Bert Jr Repair Path

Bert Jr has the App Store Connect API key at:

```bash
~/private_keys/AuthKey_2D56H437CR.p8
```

If signing breaks again:

1. SSH into Bert Jr.
2. Create a fresh Apple Distribution certificate and App Store provisioning profile for `com.coalfocks.homedoc`.
3. Export the distribution certificate as a password-protected p12 using Apple-compatible legacy encryption. OpenSSL 3's default p12 encryption can be readable by OpenSSL but fail macOS `security import` inside EAS.
4. From the Linux workspace, pipe the files back from Bert Jr into GitHub secrets:

```bash
ssh bertjr 'base64 -i ~/projects/homedoc/ios/certs/homedoc-dist-legacy.p12' | gh secret set IOS_DIST_CERT_P12_BASE64 --repo coalfocks/homedoc
ssh bertjr 'base64 -i ~/projects/homedoc/ios/certs/profile.mobileprovision' | gh secret set IOS_PROVISIONING_PROFILE_BASE64 --repo coalfocks/homedoc
printf '%s' '<p12-password>' | gh secret set IOS_DIST_CERT_PASSWORD --repo coalfocks/homedoc
```

5. Rerun `iOS TestFlight`.

## Why This Exists

On July 9, 2026, EAS remote credentials were stale: the App Store provisioning profile had expired, and Expo tried to update it with a distribution certificate Apple no longer had. CI failed with:

```text
No certificate exists with serial number "263FD85F8D020952E3F1E71388667E8F"
```

Local credentials make CI deterministic and avoid relying on Expo's stale remote credential record.

After signing was repaired, EAS produced a valid IPA but App Store Connect rejected submission with:

```text
SDK version issue. This app was built with the iOS 18.5 SDK. All iOS and iPadOS apps must be built with the iOS 26 SDK or later, included in Xcode 26 or later, in order to be uploaded to App Store Connect or submitted for distribution.
```

The fix is the pinned Xcode 26 EAS image in `eas.json`.

Expo's remote builder also needs the repository `.npmrc`:

```ini
legacy-peer-deps=true
```

GitHub CI already installs with `--legacy-peer-deps`. The `.npmrc` makes EAS use the same dependency resolution, which is required while the React Native Elements release candidates declare a mismatched peer dependency between `@rneui/themed` and `@rneui/base`.
