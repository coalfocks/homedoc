# App Store release checklist

## Evidence already recorded

- App name, bundle identifier, version, and iOS build number are configured in `app.json`; EAS has production build and App Store Connect submission profiles in `eas.json`.
- Source includes in-app privacy policy access and account deletion. The public privacy page was recorded as HTTP 200.
- Web, iOS, and Android exports, TypeScript/ESLint, Jest, Edge handler regressions, and isolated database permission suites passed through PR #23, as recorded in `docs/public-beta-verification.md`.
- An installed iPhone build verified passwordless email-link sign-in, record sync, note editing, todo creation/status, archive/restore, and AI follow-up on `1.1.10`. These checks do not verify the current release profile or current native build.
- A billing migration and isolated PGlite test cover beta backfill, Apple/Stripe entitlement priority, access control, and free owned-home limits. This is local test evidence, not a live Supabase or App Store verification.

## Proposed release configuration

The new App Store release profile is intended to use RevenueCat SDK 10.15. Proposed access is one home and four AI requests per month for free; Pro includes 300 AI requests per month and additional homes. Monthly price is pending. The release profile, RevenueCat product setup, and purchase flow have not been verified live; do not describe them as approved, tested in production, or available until the exact binary and App Store Connect products are checked.

## Open blockers and checks

- **Apple account:** Resolve the required agreement issue in App Store Connect. Recorded October 13, 2026 uploads stopped before upload with `FORBIDDEN.REQUIRED_AGREEMENTS_MISSING_OR_EXPIRED`; successful processing is not recorded.
- **Current binary:** Build and upload the latest source, then verify processing and test that exact build on a physical iPhone. `1.1.11 (202610130001)` built, but upload/acceptance is unconfirmed and later changes are absent.
- **Reviewer access:** Create/designate a dedicated email/password account, enter credentials securely in App Store Connect, and confirm sign-in on the submitted build. Do not rely on an inaccessible magic-link mailbox.
- **Billing and pricing:** Decide the Pro monthly price and finalize App Store products before submission. Verify RevenueCat 10.15 configuration, sandbox purchase and restore, transaction verification, expiry/refund behavior, Beta fallback, monthly AI limits, and the one-home/additional-home rules on the release profile. Confirm the displayed price and entitlement behavior match App Store Connect. No live verification is recorded.
- **Destructive flow:** Test account deletion on a disposable account and verify promised record/image cleanup and transferred shared data. Production deletion remains untested in recorded beta checks.
- **Photos:** Verify permission text and current-build upload, view, and save/download behavior, including interrupted-upload recovery.
- **Sharing:** Test share, contractor access/revocation, transfer, and deletion with two disposable accounts.
- **Store listing:** Capture screenshots from the submitted iOS build, choose category and age rating, enter final listing text and keywords, and provide support and privacy URLs.
- **Privacy labels:** Resolve questions in `privacy-data-inventory.md`, review third-party SDK collection and provider settings, then publish matching App Privacy answers.
- **Due-date copy:** Keep listing and screenshots clear that due dates are stored but notifications are not sent.

## Apple rule references checked October 20, 2026

- [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/): submitted builds should be complete, login apps should provide a demo account, metadata should match the product, and digital features unlocked in an iOS app generally require In-App Purchase subject to listed exceptions and storefront terms.
- [Account deletion guideline 5.1.1(v)](https://developer.apple.com/help/app-review/guideline-reference/5-1-1-account-deletion): apps that support account creation must let users initiate deletion within the app.
- [App privacy requirements](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy): publish a privacy policy URL and disclose collection by the app and third-party partners.
- [Product page metadata limits](https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information): description 4,000 characters, promotional text 170 characters, keywords 100 bytes; screenshots and support URL are product-page requirements.

## October 20/21 submission preparation

- Implemented native Apple purchases, localized monthly pricing, restore, and Apple subscription management through pinned RevenueCat 10.15.0. iOS does not invoke Stripe checkout.
- Added server-to-server verification and authenticated webhooks with separate Apple/Stripe entitlements, expiry/refund checks, and sandbox access limited to dedicated reviewer/QA UUIDs.
- Preserved existing beta accounts in the migration; no cutoff or price was invented. The live backend and existing web beta were not changed.
- Added explicit OpenAI sharing consent before planning/chat requests, public `/support`, accessible Account privacy/deletion controls, and standard Apple terms links.
- Local Release simulator binary 1.2.0 (202610210251) built successfully with Xcode 27 after pod deployment-target and fmt compatibility repairs. It installed and the simulator started its app process. Native screen inspection is blocked by the locked Mac; no screenshot, signed-device, or purchase QA is claimed.
- TypeScript and ESLint pass; 41 Jest tests plus App Store/AI handler checks, four Apple-readiness tests, all isolated billing/quota/record permission suites, and all-platform exports pass. Re-run on the final commit in CI.
- Paid-build preflight correctly rejects a missing Apple SDK key. Listing fields pass their length checks.

Remaining release work: decide monthly price; configure the Apple product, RevenueCat project/keys/restore policy and authenticated webhook; deploy and verify the backend before the paid build; establish reviewer credentials and allowed sandbox UUIDs; resolve Apple agreement/account access; complete real-device QA and capture store screenshots from the final signed build. The listing and privacy labels are drafts until those facts are verified.
