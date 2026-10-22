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

Current source candidate: **1.2.0 (202610220235)**. The AuthScreen safe-area fix requires replacement signed and simulator builds. Prior build 202610212224 (source `8dfcb1e`) passed exact SDK 26 metadata and privacy inspection in both artifacts, including nine declared data categories, no tracking, and five embedded SDK manifests. Apple processed that signed build successfully; it is superseded by the layout fix.

The dedicated reviewer account is confirmed, seeded, has no beta bypass, and is the only sandbox-allowlisted account. Its password and Cole's contact details are saved privately in App Store Connect. Native sign-in awaits Cole's direct password entry because automation receives only Apple's redaction. Actual purchase/restore/lifecycle QA and final native screenshots remain unverified.

Both products and approved U.S. prices are saved at service level 1 in HomeDoc Pro (22501802), with U.S. availability. The listing has manual release, Lifestyle/Productivity categories, subtitle, 4+ age rating, and content rights saved. App Privacy has a complete nine-category draft; publishing its final attestation awaits Cole's approval. The public October 21 Apple-aware privacy policy is live. The separate Paid Apps Agreement is still New and requires account-holder business setup. Guarded legacy migration `20261021224500` is applied and verified with zero security-advisor errors; existing warnings remain.

Apple's sandbox TEST notification reports SUCCESS and genuine signed webhook handling returns HTTP 200. App Review uses Sandbox. Production API HTTP 401 remains unverified; [Apple staff describes production API access as gated until release](https://developer.apple.com/forums/thread/806452). Retry production delivery after public release. The sandbox TEST does not prove purchases work. Canonical verification may retry Sandbox after production 401/4040010 only for the designated review account, while requiring valid Apple signatures and matching account identity. See [Apple review sandbox guidance](https://developer.apple.com/help/app-review/before-submitting-for-review/configure-in-app-purchases/).

The full billing PR remains a draft; web Stripe annual configuration is not deployed. Do not claim purchase QA or submission readiness.
