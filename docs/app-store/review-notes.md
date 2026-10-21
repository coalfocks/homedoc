# App Review notes (en-US)

Draft: complete the live configuration and exact-build QA in [release-checklist.md](release-checklist.md) before pasting these notes into App Store Connect.

## Reviewer account

Use the dedicated review email and password entered in App Store Connect's **App Review Information** fields. Keep credentials out of the repository. Confirm password sign-in on the submitted binary, with synthetic property, area, note, and task data. Create this account after the beta backfill and confirm it has no preserved beta bypass. Add only dedicated QA/reviewer UUIDs to the server sandbox allowlist.

## Navigation

1. On sign-in, choose **Password**, enter the supplied review email/password, and tap **Sign in**.
2. **Properties** is the initial tab. Open the seeded property and area for notes and tasks. **Areas**, **Notes**, and **Todos** show records across the account.
3. Open a todo and its AI panel. After the explicit data-sharing consent, request questions, generate a plan, and send follow-up questions using synthetic data. Each question set, plan, or follow-up counts as one AI request.
4. Open **Account** for yearly/monthly Pro, localized Apple pricing, **Restore purchases**, and Apple subscription management. The annual option is selected by default; the two options provide identical features.
5. **Account** also provides privacy, support, and **Delete account**. Deletion is permanent and does not cancel Apple billing. Cancel the deletion confirmation to preserve the reviewer account; test deletion using a separate disposable account.

## Release access

Basic records for one owned home are free: areas, notes, photos, maintenance tasks, sharing, and home transfer. Free accounts have four AI requests per UTC calendar month. HomeDoc Pro adds owned homes and 50 AI requests each month, at US$14.99/year or US$2.99/month. Both subscriptions renew automatically; actual localized Apple prices appear before purchase. Annual billing does not grant a yearly AI pool. Existing records remain accessible after cancellation. Existing beta accounts keep their previously granted beta access.

Purchases use Apple StoreKit 2 with the HomeDoc account UUID as the app account token. The server fetches canonical subscription status from Apple and verifies Apple signatures using the official App Store Server Library; client purchase data cannot grant access. The server separates Apple, Stripe, and beta access. App Store sandbox verification is restricted to designated review/QA accounts. iOS does not launch Stripe checkout.

Due dates are stored; the app does not send due-date notifications. Sharing and transfer require an existing recipient HomeDoc account. AI guidance can be inaccurate and is not a substitute for a qualified professional.

## Contact and links

Support/privacy: cfox@skriber.com

Support: https://homedocumentation.com/support

Privacy: https://homedocumentation.com/privacy

Terms: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/

## Internal verification status — remove before pasting

The current source candidate is 1.2.0 (202610212224), with the updated nine-category, app-functionality-linked, non-tracking privacy manifest. Both products and approved U.S. prices are saved at service level 1 in HomeDoc Pro (22501802), with U.S. availability. Apple's sandbox test notification reports SUCCESS and the genuine signed notification reached the hosted webhook with HTTP 200. Production test API access returns 401, and actual purchase lifecycle QA remains unverified. The listing is saved with manual release; subtitle, Lifestyle/Productivity categories, and 4+ age rating are saved and verified. The App Privacy draft and policy URL are saved, but the public policy is not published pending the final binary. Prior signed EAS build `4f88a5b5-e0b4-4c4a-a41e-9f4c6bb50a90` (source `e5cc6f1`, build 202610212048) is TestFlight Ready to Submit; its upload workflow 39684837111 succeeded. That build predates the privacy manifest and is superseded. The SDK 26 simulator workflow 39685625733 is still running for `eaae477` with the prior build number and is for UI QA only. The new candidate has no signed build or Apple processing result yet. A dedicated reviewer account/contact, purchase/restore QA, public privacy-policy publication, and final native screenshots remain required. Guarded legacy-table migration `20261021224500` passed source tests, but its live apply is unconfirmed. Do not claim purchase QA or final-binary readiness.

Dedicated reviewer login: `appreview@homedoc.invalid`. Its password is saved privately in App Store Connect, never in source. The confirmed account is separate from preserved beta accounts, has one fictional Maple House with three areas, four notes, and two tasks, and is explicitly allowlisted for Apple sandbox verification. Reviewer contact is saved in App Store Connect. The public October 21 Apple-aware privacy policy is live.

App Review uses Apple Sandbox. Production API HTTP 401 is still unverified; Apple staff describes production API access as gated until release ([Apple forum response](https://developer.apple.com/forums/thread/806452)). Retry production notification delivery after public release; do not treat the sandbox TEST as proof of production purchases. Canonical verification may retry Sandbox after production 401/4040010 only for the designated review account, and still requires valid Apple signatures and matching account identity. [Apple review sandbox guidance](https://developer.apple.com/help/app-review/before-submitting-for-review/configure-in-app-purchases/).
