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

The source candidate is 1.2.0 (202610212048). Both products and approved U.S. prices are saved at service level 1 in HomeDoc Pro (22501802), with U.S. availability. The agreement blocker is resolved. The billing migration, purchase/webhook/AI functions, and approved Apple server secrets are deployed to the correct HomeDoc backend. Apple notification URLs are saved, but test delivery is not verified. The listing is saved with manual release. A dedicated reviewer account/contact, signed paid build, native purchase/restore QA, public privacy-policy update, App Privacy/category/age-rating setup, and final screenshots remain required. The older EAS build in build-evidence.json uses the free-beta profile and was not submitted. Do not claim upload, Apple processing, or real-purchase verification until observed.
