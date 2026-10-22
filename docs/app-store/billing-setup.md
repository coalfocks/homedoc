# Direct Apple subscription setup

Approved October 21, 2026: Apple StoreKit 2 directly, with **no third-party subscription-management account**. Basic records remain free. Source preparation does not enable paid sales.

## App Store Connect

App **6779373725**, bundle **com.coalfocks.homedoc**. Group **HomeDoc Pro** (ID **22501802**) and both products below have been created. The account holder resolved the previous agreement blocker; the agent did not accept an agreement.

Both products are saved at service level 1, available only in the U.S., with Family Sharing off and individual App Store purchase enabled. Annual Apple ID is **6825527261**; monthly is **6825528603**. Both products and their group were submitted with version 1.2.0 on October 22, 2026 at 3:44 PM America/Denver and are **Waiting for Review** ([submission](https://appstoreconnect.apple.com/apps/6779373725/distribution/reviewsubmissions/details/5ad1a8cf-ad80-4b54-ac27-3386d42d7ac4)). Release remains manual:

| Product ID                          | Duration | U.S. price | Localized name      | Description                                     |
| ----------------------------------- | -------- | ---------- | ------------------- | ----------------------------------------------- |
| `com.coalfocks.homedoc.pro.annual`  | 1 year   | $14.99     | HomeDoc Pro Yearly  | Additional homes and 50 AI requests each month. |
| `com.coalfocks.homedoc.pro.monthly` | 1 month  | $2.99      | HomeDoc Pro Monthly | Additional homes and 50 AI requests each month. |

Exact metadata is in [subscriptions.json](subscriptions.json). U.S. prices and availability were verified after saving. User also confirmed the physical TestFlight build displays $14.99/year and $2.99/month. Do not create another group, duplicate these product IDs, or enable Family Sharing without a separate identity policy. Annual is the default purchase selection; both options grant 50 AI requests per UTC calendar month, not a yearly pool.

The local Expo module `HomeDocStoreKit` calls Apple's StoreKit 2 APIs. The app supplies the authenticated Supabase UUID as `appAccountToken` when purchasing. It displays Apple's localized price and exact subscription period. Transactions finish only after server verification. Manual restore uses `AppStore.sync`; quiet Account focus checks do not prompt the user. Existing-record access does not depend on a subscription.

Optional SKU overrides must align exactly:

| App public setting                            | Backend setting                   |
| --------------------------------------------- | --------------------------------- |
| `EXPO_PUBLIC_APP_STORE_PRO_PRODUCT_ID`        | `APP_STORE_PRO_PRODUCT_ID`        |
| `EXPO_PUBLIC_APP_STORE_PRO_ANNUAL_PRODUCT_ID` | `APP_STORE_PRO_ANNUAL_PRODUCT_ID` |

Prefer the default IDs. The first pair is monthly, the second annual. No private key belongs in the client, public environment, app configuration, repository, or build logs.

## Apple server credentials

Cole explicitly approved creating **HomeDoc Server Verification**, an App Store Server API **In-App Purchase key**, and storing it in HomeDoc's Supabase server secrets. That one key is created and its three required secrets are saved. It is separate from the build/upload API key. Never reproduce private key material in source, the app, chat, or build logs. A new or expanded credential requires separate action-time approval; do not create another key for this setup.

Required Supabase function secrets:

| Setting                           | Purpose                                             |
| --------------------------------- | --------------------------------------------------- |
| `APP_STORE_PRIVATE_KEY`           | Apple In-App Purchase API signing private key (PEM) |
| `APP_STORE_KEY_ID`                | Key identifier matching that key                    |
| `APP_STORE_ISSUER_ID`             | Issuer ID from App Store Connect                    |
| `APP_STORE_ALLOW_SANDBOX=true`    | Allow review/testing only with the UUID allowlist   |
| `APP_STORE_SANDBOX_USER_IDS`      | Comma-separated dedicated QA/reviewer UUIDs         |
| `APP_STORE_PRO_PRODUCT_ID`        | Optional monthly ID override                        |
| `APP_STORE_PRO_ANNUAL_PRODUCT_ID` | Optional yearly ID override                         |

The official Apple App Store Server Library is pinned server-side. Root certificates come from Apple's official PKI, with provenance and SHA-256 evidence beside their source. The deployed compatibility path runs on Deno 2.1.4 and retains signed-data signature, certificate identity and validity-date, and online OCSP revocation checks. A genuine Apple sandbox test notification passed those checks and reached the hosted webhook, which returned HTTP 200. This verifies notification delivery and signed webhook handling, not a purchase transaction.

## HomeDoc backend

Target only **nismvycjiobjbaozjwih**. Authenticated Dashboard access to this project is currently restored; the connector still has the wrong account. Migration `20261021024941_app_store_billing_access.sql` is applied and recorded once in migration history. Verification preserved all 39 existing users as beta accounts and all 16 properties belonging to 15 owners; new billing tables have RLS and deny authenticated writes. Create dedicated non-beta QA/reviewer accounts after this backfill.

Deployed through the authenticated HomeDoc Dashboard, with source/bundle hashes and sanitized evidence saved outside the repo in `beta-outreach-results/app-store/deployment/`:

- `sync-app-store-entitlement`: authenticated `POST { "transactionId": "..." }`; server fetches canonical Apple subscription status, verifies signed transaction/renewal data, requires the account token to match the authenticated UUID, and recognizes only configured Pro products. Client-supplied plan/user flags never grant access.
- `app-store-webhook`: App Store Server Notifications **V2**. `verify_jwt=false` is needed because Apple does not send a Supabase JWT. The handler must verify Apple's signed outer/nested data and refetch canonical status before writing; unsigned webhooks cannot grant access.
- `plan-todo`: authoritative monthly limits are free 4, preserved beta 20, and Pro 50.
- Web billing functions only if enabling paid web checkout. See [Stripe setup](../stripe-billing-setup.md).

Production and sandbox notification URLs are saved in App Store Connect as:

`https://nismvycjiobjbaozjwih.supabase.co/functions/v1/app-store-webhook`

Anonymous sync and AI calls return 401, and a webhook without signed payload returns 400. Apple's sandbox test notification reports SUCCESS, and the genuine signed notification returned 200 from the hosted webhook. The production test API still returns 401, so canonical production API access is unresolved. The user confirmed a yearly Sandbox purchase on physical TestFlight build 202610221728 and a successful cold-start plus Restore in the original reviewer account. Read-only SQL in the correct HomeDoc project independently confirms matching reviewer identity, active `app_store`/Pro status, no beta access, annual SKU, Sandbox environment, and a row update at 2026-10-22 20:20:07.74 UTC after Restore. The purchase-time webhook POST returned 200 two seconds after purchase; seven sync POSTs returned 200, including Restore-time calls. Payloads and notification type were not retained. Current usage is two calls; quota exhaustion/reset was not exercised. Monthly purchase and renewal, cancellation, expiry, refund, and alternate-account behavior remain public-release validation items. Guarded legacy-table migration `20261021224500` is applied and verified. Four empty unused singular tables now deny client access; service privileges, 39 accounts, and 16 properties are preserved. Supabase reports zero security errors; 33 existing helper/trigger advisories remain for case-by-case review. Check database security advisors, own-row access, service-only writes, preserved beta access, and expired-subscriber record access. A server outage must leave existing verified state intact rather than invent or erase access.

## Exact signed-build acceptance

Candidate 1.2.0 (202610221728), source `219be299d336cf42d244e4fee0f7fcd2debec410`, is installed on the physical iPhone and selected in App Store Connect. Physical TestFlight prices were confirmed at $14.99/year and $2.99/month. The user reports a yearly Sandbox purchase activated Pro for the dedicated reviewer. The read-only backend association is independently verified for the annual Sandbox purchase and Restore. This does not verify monthly purchase or exercise real lifecycle transitions and quota exhaustion/reset.

Automated coverage meaningfully exercises both SKUs, account mismatch, active/expired/revoked/unknown states, and canonical server refetch for notifications. The annual purchase, original-account cold-start/Restore, and backend association are verified on the signed TestFlight build. Remaining validation before public release is live monthly purchase, renewal/cancellation/expiry/refund/alternate-account behavior, and quota exhaustion/reset. Production App Store Server API access also remains unresolved (401) and should be checked after release. These public-release checks do not negate the current review-preparation evidence.

- Confirm one free owned home, free basic records/sharing/transfer, and preserved beta fallback. After Pro ends, existing records remain accessible; additional-home creation and AI follow current free limits.
- Verify the 50-request quota exhaustion and UTC monthly reset; current reviewer usage is two calls. A question set plus generated plan uses two requests; each follow-up uses one.
- Test current-build photos, sharing/revocation/transfer using two synthetic accounts, and account deletion with a disposable account.
- Native listing and subscription review screenshots are captured and processed. The exact build/source and sanitized evidence are saved; both initial subscriptions and their group were submitted with version 1.2.0 and are Waiting for Review.

## References

- [Apple subscriptions](https://developer.apple.com/help/app-store-connect/manage-subscriptions/offer-auto-renewable-subscriptions/)
- [Apple App Store Server Library](https://github.com/apple/app-store-server-library-node)
- [Expo local native modules](https://docs.expo.dev/modules/get-started/)
- [TestFlight deployment](../testflight-deployment.md)
