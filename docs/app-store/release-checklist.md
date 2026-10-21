# App Store release checklist

## Approved release — October 21, 2026

HomeDoc Pro is **US$14.99/year** or **US$2.99/month**, with yearly selected by default. Both periods include additional owned homes and **50 AI requests per UTC calendar month**. Basic records for one home remain free, including photos, notes, areas, tasks, sharing, and transfer, plus four monthly AI requests. A question set, plan, or follow-up consumes one request. Existing records remain accessible after cancellation. Existing beta accounts retain the preserved 20-request allowance until an announced transition.

Exact product IDs, store copy, and limits are recorded in [subscriptions.json](subscriptions.json). Candidate version is **1.2.0 (202610212048)**. Both Apple products and U.S. prices are saved and verified; signed-build purchase QA remains required.

## Source preparation

- Native iOS purchases use Apple StoreKit 2 through a local Expo module, with live localized prices, annual/monthly selection, exact SKU and period validation, restore, and Apple subscription management. iOS does not invoke Stripe checkout.
- The backend verifies purchases directly with Apple using the official App Store Server Library, checks account-token binding, signed data, expiry/refund/environment, and restricts sandbox access to named QA/reviewer account UUIDs. Unknown products fail closed. Apple, Stripe, and preserved beta access remain separate.
- Stripe web checkout validates the configured recurring price against the selected approved USD amount and period. Existing body-less checkout clients retain the monthly default. Android purchase initiation remains disabled.
- The billing migration preserves existing beta accounts and enforces one free owned home at insertion. Existing record access, sharing, and transfers remain available.
- Explicit consent precedes OpenAI data sharing. Account includes privacy policy, support, permanent account deletion, and Apple cancellation guidance. Public support/privacy routes and listing copy are prepared in this branch.
- Listing metadata, subscription setup, privacy inventory, reviewer instructions, and screenshot capture plan are saved in this directory. CI runs metadata, Apple readiness unit tests, application checks, isolated database permission suites, and all-platform exports.

## Live configuration completed October 21

- Apple account access and the agreement blocker are resolved. No agreement was accepted by the agent. Authenticated Supabase browser access is verified for HomeDoc `nismvycjiobjbaozjwih`; the connector still uses another account and must not be used for deployment.
- HomeDoc Pro group **22501802** contains yearly **6825527261** at **$14.99** and monthly **6825528603** at **$2.99**. Both are service level 1, U.S. availability only, individual App Store subscriptions, with Family Sharing off. Both remain **Prepare for Submission**.
- Applied billing migration `20261021024941` and verified 39 users/39 preserved beta accounts, 16 properties/15 owners, two new RLS tables, and no authenticated entitlement writes. Deployed `sync-app-store-entitlement`, `app-store-webhook`, and `plan-todo`. Published AI source matches the reviewed candidate; anonymous purchase/AI requests return 401 and unsigned webhook requests are rejected.
- Cole explicitly approved the **HomeDoc Server Verification** IAP key. Its private key is saved in Supabase server secrets; no key material belongs in source or the app. Production and sandbox webhook URLs are saved in Apple. Test delivery is still pending: initial API attempts returned production 401 and sandbox 4040007, so successful notification delivery is not claimed.
- Version **1.2.0** listing description, promotional text, keywords, support/marketing URLs, copyright, and **manual release** are saved. No build is selected, uploaded, or submitted for review.

## External gates — still required

1. **Apple delivery and runtime verification:** Confirm Notifications V2 delivery after Apple configuration propagation and exercise canonical purchase refresh in the live Edge runtime. Check database advisors and own-row/service-only permissions. See [billing-setup.md](billing-setup.md).
2. **Reviewer access:** Create/designate dedicated email/password review and QA accounts after beta backfill; seed synthetic data and ensure they have no beta bypass. Store credentials securely in App Store Connect and allow only those UUIDs to verify sandbox purchases. Reviewer contact phone and final contact details must be supplied accurately.
3. **Exact binary and transactions:** Build the final `app-store` profile, upload, confirm Apple processing, and test monthly/annual purchase, cancel, restore, expiry/refund, account switching, and free/beta behavior on the exact signed build.
4. **Native flows:** Verify current-build photos (including interruption), two-account sharing/revocation/transfer, and account deletion with a disposable account. No new native screen or transaction QA is claimed by the source build alone.
5. **Listing and public policy:** Capture actual iPhone/iPad screenshots. Complete category, age rating, content rights, App Privacy, reviewer credentials/contact, and subscription review assets. Publish the prepared Apple-aware privacy policy; the live policy was still the October 13 beta version when checked. Include both initial subscriptions with the new app version for review. Due dates must not imply notifications.

## Existing build evidence

The direct-Apple source candidate passed a local **Xcode 27.1 Release simulator build** on October 21, 2026, including the new `HomeDocStoreKit` Swift module. TypeScript, ESLint, 51 Jest tests, server billing/AI handler checks, four Apple-readiness tests, isolated database permission suites, Deno checks, metadata checks, and all-platform Expo exports passed. A second all-platform export explicitly disabled the free-beta bypass. These are source/build checks; this simulator build is unsigned and does not verify purchases, native screens, or Apple processing. Live deployment evidence is recorded separately above. See [local-verification.json](local-verification.json).

[Build-only workflow](https://github.com/coalfocks/homedoc/actions/runs/39536941286) completed EAS build `a5ae0a28-b3ce-4753-aa29-669d912519d8`, version 1.2.0 (202610210251), source `e188b3c`. It used the existing **free-beta production profile**, and was not submitted. It is a signing baseline, not the final paid candidate. See [build-evidence.json](build-evidence.json).

Earlier local Xcode 27 evidence recorded a Release simulator build, installation, and process launch for the older candidate. That evidence does not verify these new pricing changes, the signed paid build, or App Store processing.

## References checked October 21, 2026

- [Apple subscriptions](https://developer.apple.com/help/app-store-connect/manage-subscriptions/offer-auto-renewable-subscriptions/): use one group for variants of the same service; initial subscriptions accompany a new app version.
- [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/): complete app, accessible reviewer account, accurate metadata, and appropriate In-App Purchase.
- [Account deletion](https://developer.apple.com/help/app-review/guideline-reference/5-1-1-account-deletion) and [App Privacy](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy).
- [Apple App Store Server Library](https://github.com/apple/app-store-server-library-node): signed-data verification and App Store Server API access.
