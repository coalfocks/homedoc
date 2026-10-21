# TestFlight deployment

The **iOS TestFlight** workflow is manual. It always runs typecheck, lint,
application tests, database permission tests, and submission preflight before
building. Choose one of the two EAS profiles:

- `production` retains the existing production configuration, including its
  current beta-access setting.
- `app-store` is the paid-build candidate. It disables the global beta bypass
  and requires a valid RevenueCat Apple public SDK key before build.

The workflow builds with the selected profile and does not submit by default.
Select **Submit to App Store Connect** only when the completed build should be
uploaded. Submission is blocked unless the read-only App Store Connect API
check succeeds and confirms bundle ID `com.coalfocks.homedoc` for app ID
`6779373725`. The check does not change Apple account state. It records only
HTTP status, Apple error code, and bundle match in the sanitized build
metadata. A failed check does not block a build-only run.

The workflow pins EAS CLI to `25.3.0` and uses the existing local iOS signing
credentials. Build metadata is uploaded for 14 days; signed artifact URLs,
credentials, tokens, and raw EAS/API error bodies are excluded.

## Required GitHub Actions secrets

- `EAS_TOKEN`
- `ASC_API_KEY_P8` (readiness check; the key file is materialized only for a
  requested submission)
- `ASC_KEY_ID`
- `ASC_ISSUER_ID`
- `APPLE_TEAM_ID`
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `IOS_DIST_CERT_P12_BASE64`
- `IOS_DIST_CERT_PASSWORD`
- `IOS_PROVISIONING_PROFILE_BASE64`
- `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` (required by the `app-store` profile)

The RevenueCat key is a public Apple SDK key, not a secret RevenueCat API key.
It must also be configured in the EAS `production` environment used by remote
builds. GitHub Actions secrets passed to the local preflight do not propagate
into the EAS remote build environment. The EAS app-store profile is configured
with `EXPO_PUBLIC_HOMEDOC_FREE_BETA=false`; do not change the existing
`production` profile's beta setting until release activation is intended.

The native subscription product identifier is
`com.coalfocks.homedoc.pro.monthly`. RevenueCat must have that product attached
to the current offering's monthly package and the `pro` entitlement. The final
subscription price has not been set yet, so customer-facing pricing and the
App Store product configuration remain release work.

The backend App Store entitlement migration, Edge Functions, webhook, and
required server secrets/configuration have not been deployed. A successful
build or Apple API readiness response does not mean paid access is ready for
production. Complete and verify backend deployment and native purchase/restore
device QA before enabling paid sales.

## Local signing files

The workflow restores signing material at runtime into `ios/certs/` and
`credentials.json`, with restrictive file permissions. These generated files
must remain gitignored. The Apple API key file is created only after a
submission is explicitly requested and the readiness gate passes.

The EAS iOS image is pinned in `eas.json` to Xcode 26 because App Store Connect
requires the iOS 26 SDK. The local timestamp-style iOS build number is retained;
do not switch `cli.appVersionSource` to `remote` unless the remote counter is
first moved above the highest build already uploaded to App Store Connect.

Sandbox verification also requires `APP_STORE_SANDBOX_USER_IDS`, a comma-separated list of dedicated QA/reviewer HomeDoc user UUIDs. Only those accounts may receive production-backend access from sandbox purchases when `APP_STORE_ALLOW_SANDBOX=true`. Keep RevenueCat restore behavior set to **Keep with original App User ID**; do not enable purchase transfers between unrelated signed-in HomeDoc accounts without separately designing that policy.
