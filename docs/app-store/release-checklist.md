# App Store release checklist

## Approved release — October 21, 2026

HomeDoc Pro is **US$14.99/year** or **US$2.99/month**, with yearly selected by default. Both periods include additional owned homes and **50 AI requests per UTC calendar month**. Basic records for one home remain free, including photos, notes, areas, tasks, sharing, and transfer, plus four monthly AI requests. A question set, plan, or follow-up consumes one request. Existing records remain accessible after cancellation. Existing beta accounts retain the preserved 20-request allowance until an announced transition.

Exact product IDs, store copy, and limits are recorded in [subscriptions.json](subscriptions.json). Candidate version is **1.2.0 (202610212048)**. Store configuration and purchase QA are not yet verified.

## Source preparation

- Native iOS purchases use Apple StoreKit 2 through a local Expo module, with live localized prices, annual/monthly selection, exact SKU and period validation, restore, and Apple subscription management. iOS does not invoke Stripe checkout.
- The backend verifies purchases directly with Apple using the official App Store Server Library, checks account-token binding, signed data, expiry/refund/environment, and restricts sandbox access to named QA/reviewer account UUIDs. Unknown products fail closed. Apple, Stripe, and preserved beta access remain separate.
- Stripe web checkout validates the configured recurring price against the selected approved USD amount and period. Existing body-less checkout clients retain the monthly default. Android purchase initiation remains disabled.
- The billing migration preserves existing beta accounts and enforces one free owned home at insertion. Existing record access, sharing, and transfers remain available.
- Explicit consent precedes OpenAI data sharing. Account includes privacy policy, support, permanent account deletion, and Apple cancellation guidance. Public support/privacy routes and listing copy are prepared in this branch.
- Listing metadata, subscription setup, privacy inventory, reviewer instructions, and screenshot capture plan are saved in this directory. CI runs metadata, Apple readiness unit tests, application checks, isolated database permission suites, and all-platform exports.

## External gates — still required

1. **Account access:** Apple is signed in. The connected Supabase account/browser cannot access HomeDoc project `nismvycjiobjbaozjwih`; switch to its owning account. No RevenueCat account is needed or used.
2. **Apple agreement:** The signed-in App Store Connect page explicitly blocks creating subscription products with **Agreement Update**: the Apple Developer Program License Agreement needs account-holder review. A screenshot and the exact state are saved in `beta-outreach-results/app-store/` outside the repository. No agreement was accepted.
3. **Products and Apple server setup:** Created subscription group **HomeDoc Pro**, ID **22501802**. No subscription product was created: the agreement dialog blocked that action. After the agreement is resolved, configure monthly/yearly at the same service level and verify Apple prices, App Store Server API credentials, and Notifications V2. See [billing-setup.md](billing-setup.md).
4. **Backend deployment:** Apply the pending billing migration and deploy the purchase/AI functions to the correct HomeDoc project. Check auth/RLS, free limits, beta preservation, and canonical entitlement refresh in that live environment. This has not been deployed.
5. **Reviewer access:** Create/designate a dedicated email/password review account after beta backfill; seed synthetic property/area/note/task data and ensure it has no beta bypass. Store credentials securely in App Store Connect. Allow only dedicated reviewer/QA UUIDs to verify sandbox purchases.
6. **Exact binary and transactions:** Build the final `app-store` profile after configuration; upload, confirm Apple processing, and test monthly/annual purchase, cancel, restore, expiry/refund, account switching, and free/beta behavior on the exact signed build.
7. **Native flows:** Verify current-build photos (including interruption), two-account sharing/revocation/transfer, and account deletion with a disposable account. The Mac is unlocked; current native app control cannot locate Simulator, so no new native screen or transaction QA is claimed.
8. **Listing:** Capture actual iPhone/iPad screenshots from the configured final build. Enter final text, category, age rating, support/privacy URLs, and reviewed App Privacy answers. Due dates must not imply notifications. Include both initial subscriptions with the new app version for review.

## Existing build evidence

The direct-Apple source candidate passed a local **Xcode 27.1 Release simulator build** on October 21, 2026, including the new `HomeDocStoreKit` Swift module. TypeScript, ESLint, 51 Jest tests, server billing/AI handler checks, four Apple-readiness tests, isolated database permission suites, Deno checks, metadata checks, and all-platform Expo exports passed. A second all-platform export explicitly disabled the free-beta bypass. These are source/build checks; this simulator build is unsigned and does not verify purchases, native screens, Apple processing, or live backend deployment. See [local-verification.json](local-verification.json).

[Build-only workflow](https://github.com/coalfocks/homedoc/actions/runs/39536941286) completed EAS build `a5ae0a28-b3ce-4753-aa29-669d912519d8`, version 1.2.0 (202610210251), source `e188b3c`. It used the existing **free-beta production profile**, and was not submitted. It is a signing baseline, not the final paid candidate. See [build-evidence.json](build-evidence.json).

Earlier local Xcode 27 evidence recorded a Release simulator build, installation, and process launch for the older candidate. That evidence does not verify these new pricing changes, the signed paid build, or App Store processing.

## References checked October 21, 2026

- [Apple subscriptions](https://developer.apple.com/help/app-store-connect/manage-subscriptions/offer-auto-renewable-subscriptions/): use one group for variants of the same service; initial subscriptions accompany a new app version.
- [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/): complete app, accessible reviewer account, accurate metadata, and appropriate In-App Purchase.
- [Account deletion](https://developer.apple.com/help/app-review/guideline-reference/5-1-1-account-deletion) and [App Privacy](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy).
- [Apple App Store Server Library](https://github.com/apple/app-store-server-library-node): signed-data verification and App Store Server API access.
