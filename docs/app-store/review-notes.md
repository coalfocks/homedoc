# App Review notes (en-US)

Reviewer-facing guidance is saved in App Store Connect. Complete the remaining live configuration and exact-build QA in [release-checklist.md](release-checklist.md) before submission.

## Reviewer account

Use the dedicated review email and password entered in App Store Connect's **App Review Information** fields. Keep credentials out of the repository. Confirm password sign-in on the submitted binary, with synthetic property, area, note, and task data. The dedicated reviewer account was created after beta backfill, has no beta bypass, and is the only sandbox-allowlisted account. Its fictional Maple House contains three areas, four notes, and two tasks.

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

## Internal verification status — do not paste

Candidate **1.2.0 (202610221728)** from source `219be299d336cf42d244e4fee0f7fcd2debec410` completed signed and simulator builds on SDK 26. Both exact artifact privacy inspections passed with nine collected categories, no tracking, and five embedded SDK manifests. Upload workflow 39825012334 succeeded; Apple reports VALID (build `944a9276-935b-44ba-b7f3-a11b4de96921`, 2026-10-22 17:46:08 UTC). CI and Vercel passed. It is selected on version 1.2.0; Save was clicked and the disabled Save/checkmark state observed. The build selection and both screenshot sets persisted after reopening the version through Apps. It is in internal testing with Cole as an existing tester. No review submission was made.

The dedicated reviewer account is confirmed, seeded, has no beta bypass, and is the only sandbox-allowlisted account. Its password and Cole's contact details are saved privately in App Store Connect. A transaction-local authenticated-role check verified read-only access to exactly one home, three areas, four notes, and two tasks, with free billing and no beta access. Logged-out native launch and safe-area layout passed on iPhone 18 Pro Max, iPhone 18 Pro, and iPad 13; on medium iPhone, Sign in remained reachable with the software keyboard open, and iPad showed only its hardware-keyboard bar. Reviewer login is now verified on iPhone 18 Pro and iPad 13. On iPad, Maple House opened with three areas; Kitchen showed two notes and one task. On iPhone, Todos showed two tasks. AI consent, four clarifying questions, and generation of a saved filter plan succeeded, using two free AI requests. Plan persistence was verified after terminating and relaunching iPhone 18 Pro: the saved plan remained in the filter todo and appeared on iPad 13. Installing candidate 202610221728 over 202610220235 preserved reviewer sessions; updated free-account copy, sample records (one home, three areas, four notes, two tasks), and the saved plan were verified on iPhone 18 Pro and iPad Pro 13-inch (M5), with no additional AI requests. Layouts were visually checked; keyboard QA was not repeated because AuthScreen is unchanged. Three screenshots per device were uploaded and processed into the 1206x2622 iPhone and 2064x2752 iPad slots. Native purchase/restore/lifecycle QA and subscription review images remain open.

Both products and approved U.S. prices are saved at service level 1 in HomeDoc Pro (22501802); App Store Connect shows English (U.S.) localization and U.S. availability for sale. The Paid Apps Agreement is Active. The listing has manual release, free download price ($0.00 USD), U.S.-only availability on app release, Mac/Vision Pro disabled, Lifestyle/Productivity categories, subtitle, 4+ age rating, and content rights saved. App Privacy is published with the approved nine-category declaration. The public Apple-aware privacy policy and support page are live at /privacy and /support; support PR #28 merged as `842d9d717d5093d8bf247a2a4bad842fcfe24e04`. The full billing PR #26 remains a draft and Stripe annual pricing is not configured. Guarded legacy migration `20261021224500` is applied and verified with zero security-advisor errors; existing warnings remain.

Apple's sandbox TEST notification reports SUCCESS and genuine signed webhook handling returns HTTP 200. App Review uses Sandbox. Production API HTTP 401 remains unverified; [Apple staff describes production API access as gated until release](https://developer.apple.com/forums/thread/806452). Retry production delivery after public release. The sandbox TEST does not prove purchases work. Canonical verification may retry Sandbox after production 401/4040010 only for the designated review account, while requiring valid Apple signatures and matching account identity. See [Apple review sandbox guidance](https://developer.apple.com/help/app-review/before-submitting-for-review/configure-in-app-purchases/).

The full billing PR remains a draft; web Stripe annual configuration is not deployed. Do not claim purchase QA or overall submission readiness. Candidate 202610221728 is VALID and selected on version 1.2.0; Save-disabled/checkmark state was observed, and the selection and both screenshot sets persisted after reopening the version through Apps. No review submission was made. Earlier simulator Account screens failed to load localized Apple products; no purchase was attempted and the cause was not established. Read-only devicectl lookup found the connected physical iPhone 15 Pro still on build 202610220235; reviewer sessions are verified on both Mac simulators, but TestFlight build 202610221728 has not been confirmed on hardware. The Mac is locked pending user unlock; the physical iPhone needs the TestFlight update before pricing and transaction checks. Actual TestFlight prices and purchase/restore/lifecycle remain unverified. The yearly subscription could not be added to the draft because App Store Connect requires its missing Review Information screenshot; it remains Prepare for Submission. Monthly was not attempted, and neither subscription nor the group is attached. Add both product review screenshots, then add both subscriptions to the existing app-version draft (and the group if it is still unapproved). Apple requires the first auto-renewable subscription to accompany a new app version and an unapproved subscription group to accompany at least one subscription ([Apple submission guide](https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-an-in-app-purchase/)). Ready for Review is the draft stage; final Submit for Review starts review ([app submission guide](https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-an-app/)). Do not submit until actual TestFlight purchase QA is complete.
