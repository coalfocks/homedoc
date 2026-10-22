# TestFlight deployment

The **iOS TestFlight** workflow is manual. It always runs typecheck, lint,
application tests, database permission tests, and submission preflight before
building. Choose one of the two EAS profiles:

- `production` retains the existing production configuration, including its
  current beta-access setting.
- `app-store` is the paid-build candidate. It disables the global beta bypass
  and includes the local Apple StoreKit 2 module. No third-party billing account or client SDK key is required.

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

Apple App Store Server API credentials belong only in Supabase server secrets.
Never place an In-App Purchase private key in `EXPO_PUBLIC_*`, app configuration,
GitHub build output, or a client bundle. The `app-store` EAS profile is configured
with `EXPO_PUBLIC_HOMEDOC_FREE_BETA=false`; preserve the existing `production`
profile's beta setting until release activation is intended.

The approved U.S. subscription options are **$14.99/year** (default selection)
and **$2.99/month**. Configure both at the same service level in a single
**HomeDoc Pro** subscription group. The product IDs are
`com.coalfocks.homedoc.pro.annual` and `com.coalfocks.homedoc.pro.monthly`.
The native app requests both products directly from Apple StoreKit. Exact product metadata is in
`docs/app-store/subscriptions.json`.

The SDK displays Apple's localized prices. Optional public overrides are
`EXPO_PUBLIC_APP_STORE_PRO_PRODUCT_ID` (monthly) and
`EXPO_PUBLIC_APP_STORE_PRO_ANNUAL_PRODUCT_ID` (annual). If overridden, they
must exactly match the server's `APP_STORE_PRO_PRODUCT_ID` and
`APP_STORE_PRO_ANNUAL_PRODUCT_ID`; otherwise a purchase can succeed at Apple
while server verification rejects access. Keep the default IDs where possible.

Both billing periods include **50 AI requests per UTC calendar month** and
additional owned homes. Basic records for one home remain free, with four AI
requests monthly. Question sets, plans, and chat each use one request. Unused
requests do not roll over; the annual payment does not issue a yearly AI pool.
Existing records remain accessible after a subscription expires. Preserved beta
accounts retain the existing 20-request allowance.

The App Store entitlement migration and purchase, webhook, and AI Edge Functions are deployed to HomeDoc. The approved IAP key is saved in Supabase server secrets, and both Apple notification URLs are saved. Both approved U.S. products are configured at the same service level. Apple's sandbox test notification reports SUCCESS, and the genuine signed event returned HTTP 200 from the hosted webhook. The production test API still returns 401 and real purchase lifecycle verification remains pending. Prior paid EAS build `4f88a5b5-e0b4-4c4a-a41e-9f4c6bb50a90` (source `e5cc6f1`, version 1.2.0 / 202610212048) is TestFlight Ready to Submit; upload workflow 39684837111 succeeded. It predates the current privacy-manifest source candidate 202610212224 and is superseded. Build and Apple processing for the current candidate remain pending. Complete exact-build native purchase/restore QA and the remaining release checklist before sales.

## Local signing files

The workflow restores signing material at runtime into `ios/certs/` and
`credentials.json`, with restrictive file permissions. These generated files
must remain gitignored. The Apple API key file is created only after a
submission is explicitly requested and the readiness gate passes.

The EAS iOS image is pinned in `eas.json` to Xcode 26 because App Store Connect
requires the iOS 26 SDK. The local timestamp-style iOS build number is retained;
do not switch `cli.appVersionSource` to `remote` unless the remote counter is
first moved above the highest build already uploaded to App Store Connect.

The local Xcode 27.1 Release simulator build compiled but the app could not
launch because the SDK 27 simulator requires UIScene lifecycle support. SDK 26
simulator workflow 39685625733 is running for source `eaae477` with the prior
build number; it is for UI QA only. Its result does not verify the current
202610212224 candidate or purchases. Simulator rendering can support native
screen QA and screenshot capture; it cannot verify actual App Store sandbox
purchases.

Sandbox verification also requires `APP_STORE_SANDBOX_USER_IDS`, a comma-separated list of dedicated QA/reviewer HomeDoc user UUIDs. Only those accounts may receive production-backend access from sandbox purchases when `APP_STORE_ALLOW_SANDBOX=true`. StoreKit supplies the signed-in Supabase UUID as `appAccountToken`; the server requires an exact token match. Purchases cannot be restored to a different HomeDoc account.
