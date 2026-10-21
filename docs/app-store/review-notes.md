# App Review notes (en-US)

## Reviewer account

Use the dedicated review account credentials entered in App Store Connect's **App Review Information** fields. The repository intentionally contains no reviewer password or recovery code. Before submission, confirm email/password sign-in works on the exact build submitted and that the account has a property, area, note, and maintenance task with synthetic data. Do not rely on a magic link that requires access to an unprovided mailbox.

## Navigation

1. On sign-in, choose **Password**, enter the review email and password supplied in App Store Connect, then tap **Sign in**.
2. **Properties** is the initial tab. Open the seeded property and an area to review notes and tasks. The **Areas**, **Notes**, and **Todos** tabs show those records across the account.
3. Open a todo and scroll to its AI planning panel. If prompted, accept to review generated questions, a plan, and follow-up chat. Use only synthetic review data.
4. Open **Account** to review the proposed subscription offering and restore-purchases control. Purchase, restore, cancellation, and entitlement behavior must be verified with the submitted build and sandbox account before these notes are treated as final.
5. Open **Account** for the privacy policy and **Delete account** action. Deletion is permanent; cancel the confirmation to preserve the review account. Use a separate disposable account to test deletion.

## Proposed release configuration (not verified live)

The new App Store release profile is intended to use RevenueCat SDK 10.15. The proposed free tier includes one home and four AI requests per month. Pro is proposed to include 300 AI requests per month and additional homes; monthly price is pending a product decision. These values and the purchase flow are proposed implementation details, not claims that a production App Store product or live entitlement has been verified. Update these notes after reviewing the exact release build, App Store Connect products, and sandbox transactions.

Due dates are stored with tasks; the app does not send due-date notifications. Sharing and transfer require another existing HomeDoc account. Photo selection uses the device photo library; current-build photo upload and save flows remain unverified.

## Submission status to update before pasting

The latest recorded native checks are against build `1.1.10 (202609232143)`. Build `1.1.11 (202610130001)` completed an EAS build but has not been accepted or processed by App Store Connect. Submission attempts recorded October 13, 2026 stopped before upload because a required Apple agreement was missing or expired. Replace this status after resolving the agreement, uploading and processing the current build, and checking the exact binary.

## Contact

Support and privacy contact: cfox@skriber.com

Privacy policy: https://homedocumentation.com/privacy

Support URL for the listing: https://homedocumentation.com/support (implemented in this branch; publish and verify before submission). The new 1.2.0 Release build compiles locally and starts a simulator process; the locked Mac prevented screen inspection. This does not verify a signed device build, purchases, or App Store processing.
