# Direct Apple subscription setup

Approved October 21, 2026: Apple StoreKit 2 directly, with **no third-party subscription-management account**. Basic records remain free. Source preparation does not enable paid sales.

## App Store Connect

App **6779373725**, bundle **com.coalfocks.homedoc**. Group **HomeDoc Pro** (ID **22501802**) and both products below have been created. The account holder resolved the previous agreement blocker; the agent did not accept an agreement.

Both products are saved at service level 1, available only in the U.S., with Family Sharing off and individual App Store purchase enabled. Annual Apple ID is **6825527261**; monthly is **6825528603**. Both remain Prepare for Submission:

| Product ID                          | Duration | U.S. price | Localized name      | Description                                     |
| ----------------------------------- | -------- | ---------- | ------------------- | ----------------------------------------------- |
| `com.coalfocks.homedoc.pro.annual`  | 1 year   | $14.99     | HomeDoc Pro Yearly  | Additional homes and 50 AI requests each month. |
| `com.coalfocks.homedoc.pro.monthly` | 1 month  | $2.99      | HomeDoc Pro Monthly | Additional homes and 50 AI requests each month. |

Exact metadata is in [subscriptions.json](subscriptions.json). U.S. prices and availability were verified after saving. Do not create another group, duplicate these product IDs, or enable Family Sharing without a separate identity policy. Annual is the default purchase selection; both options grant 50 AI requests per UTC calendar month, not a yearly pool.

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

The official Apple App Store Server Library is pinned server-side. Root certificates come from Apple's official PKI, with provenance and SHA-256 evidence beside their source. Verify certificate deployment, Node-compatible Deno runtime, online certificate checking, and Apple API access in the live Edge environment.

## HomeDoc backend

Target only **nismvycjiobjbaozjwih**. Its authenticated Dashboard browser access is verified; the connector still has the wrong account. Migration `20261021024941_app_store_billing_access.sql` is applied and recorded once in migration history. Verification preserved all 39 existing users as beta accounts and all 16 properties belonging to 15 owners; new billing tables have RLS and deny authenticated writes. Create dedicated non-beta QA/reviewer accounts after this backfill.

Deployed through the authenticated HomeDoc Dashboard, with source/bundle hashes and sanitized evidence saved outside the repo in `beta-outreach-results/app-store/deployment/`:

- `sync-app-store-entitlement`: authenticated `POST { "transactionId": "..." }`; server fetches canonical Apple subscription status, verifies signed transaction/renewal data, requires the account token to match the authenticated UUID, and recognizes only configured Pro products. Client-supplied plan/user flags never grant access.
- `app-store-webhook`: App Store Server Notifications **V2**. `verify_jwt=false` is needed because Apple does not send a Supabase JWT. The handler must verify Apple's signed outer/nested data and refetch canonical status before writing; unsigned webhooks cannot grant access.
- `plan-todo`: authoritative monthly limits are free 4, preserved beta 20, and Pro 50.
- Web billing functions only if enabling paid web checkout. See [Stripe setup](../stripe-billing-setup.md).

Production and sandbox notification URLs are saved in App Store Connect as:

`https://nismvycjiobjbaozjwih.supabase.co/functions/v1/app-store-webhook`

Anonymous sync and AI calls return 401, and a webhook without signed payload returns 400. These verify deployment/auth boundaries, not real purchases. Initial Apple test-notification API attempts returned production 401 and sandbox 4040007 immediately after URL setup; delivery remains unverified. Retry after configuration propagation and investigate persistent errors before release. Verify Notifications V2 signatures and canonical API access in the live Edge runtime, then real purchase, renewal, cancellation, expiry, and refund events. Check database security advisors, own-row access, service-only writes, preserved beta access, and expired-subscriber record access. A server outage must leave existing verified state intact rather than invent or erase access.

## Exact signed-build acceptance

Build the `app-store` profile after backend/product configuration. The existing `production` profile retains free-beta behavior and is not the paid release.

- Purchase annual and monthly with dedicated non-beta HomeDoc accounts. Confirm localized amount/period, Apple confirmation, provider `app_store`, and 50 monthly requests.
- Cancel the purchase sheet: no charge or entitlement change. A pending/Ask to Buy result must not grant Pro. Cancel renewal: access continues through paid expiry.
- Restore in the original HomeDoc account after reinstall. Another HomeDoc account must not inherit that purchase. Finish only server-verified transactions.
- Verify renewal while the app is closed, signed notification delivery, Account-focus recovery, expiry/refund removal, and blocked sandbox access for ordinary users.
- Confirm one free owned home, free basic records/sharing/transfer, and preserved beta fallback. After Pro ends, existing records remain accessible; additional-home creation and AI follow current free limits.
- Verify annual AI allowance resets monthly. A question set plus generated plan uses two requests; each follow-up uses one.
- Test current-build photos, sharing/revocation/transfer using two synthetic accounts, and account deletion with a disposable account.
- Capture genuine native iPhone/iPad screenshots; record exact EAS build/source, Apple processing state, and sanitized results. Initial subscriptions accompany the new app version for review.

## References

- [Apple subscriptions](https://developer.apple.com/help/app-store-connect/manage-subscriptions/offer-auto-renewable-subscriptions/)
- [Apple App Store Server Library](https://github.com/apple/app-store-server-library-node)
- [Expo local native modules](https://docs.expo.dev/modules/get-started/)
- [TestFlight deployment](../testflight-deployment.md)
