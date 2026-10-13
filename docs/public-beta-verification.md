# Public beta verification

October 13, 2026. Observed results from a new beta account using synthetic home data. Automated checks do not certify every production workflow.

## Published fixes

- [PR #20](https://github.com/coalfocks/homedoc/pull/20): browser alerts and confirmations, accurate deletion warning, public privacy policy and in-app links, email callback route, and validation before Expo publishing.
- [PR #21](https://github.com/coalfocks/homedoc/pull/21): forwards old email callbacks from the marketing host to the app, with fixed origins and whitelisted auth fields. Vercel validates before publishing too.
- PR #21 production source: `eccc279a63b644c6a4ad916756c8e116ecb86b9e`. Vercel status and [Expo deployment](https://github.com/coalfocks/homedoc/actions/runs/38438608207) passed.
- Supabase Auth's site URL is now `https://app.homedocumentation.com`, with the exact web callback allowed. Existing native callbacks were preserved. A newly delivered email reached the correct app and signed in successfully.

## Follow-up changes

Stored timestamps are now called **due dates**, with explicit notice that notifications are not sent. The Properties dashboard requests an aggregate area count instead of displaying a missing field as zero; it does not load area contents, and existing RLS applies.

The manual `repair-ios-submission.yml` checks App Store Connect before uploading an existing EAS IPA, validates app/version/build metadata, avoids duplicate uploads, and verifies processing. It uses existing CI secrets without changing credentials. Live execution is pending at this report revision.

## Completed checks

| Check                                 | Observed result                                                                                   |
| ------------------------------------- | ------------------------------------------------------------------------------------------------- |
| TypeScript and ESLint                 | Pass                                                                                              |
| Jest                                  | 30 tests, 10 suites pass                                                                          |
| Database quota and record permissions | Both isolated PostgreSQL suites pass for PRs #20 and #21                                          |
| Web, iOS, Android exports             | Pass for PRs #20 and #21                                                                          |
| Public privacy route                  | HTTP 200 and correct policy rendered in Chrome                                                    |
| Signup/account privacy links          | Policy opens; closing returns to app                                                              |
| Empty email validation                | Inline error, no request sent                                                                     |
| Real beta account and email sign-in   | Email delivered; magic link signed in a new account                                               |
| Session restoration                   | Reload and a new tab remain authenticated                                                         |
| Property and area                     | Synthetic home and Kitchen QA created; persisted after reload                                     |
| Photo note                            | Synthetic PNG uploaded/rendered; note edited without losing image; reopened in another tab        |
| Due date storage                      | Date and default 9:00 AM saved and displayed; no notification delivery                            |
| Todo                                  | Created, edited description/priority, changed status to In Progress                               |
| Archive/restore                       | Todo disappeared from active area, appeared under Archived, returned to active list after Restore |
| Account deletion Cancel               | Accurate browser warning; Escape cancelled; account remained signed in                            |
| Mobile web                            | 390 × 844 layout, bottom tabs, note/photo and full-screen viewer checked                          |

Two GPT-6 Luna workers handled separate UI and release-workflow tasks. The coordinator reviewed and integrated changes, ran checks, and performed live browser tests.

## Open checks and limitations

- **AI planning currently fails in production:** asking for questions returned `400 Unsupported parameter: max_tokens is not supported with this model`. Deployed source must be inspected and repaired before questions, plans, or chat can pass. Local source uses a different model from the behavior implied by this error; do not overwrite live changes blindly.
- Photo viewing passed. Save produced no app error, but automation did not observe a completed download; saving remains unverified.
- Actual permanent deletion, sharing, contractor access, transfer/revocation, interrupted uploads, expired sessions, and duplicate taps have not been exercised in production. Database suites cover access regressions but do not replace UI checks.
- Synthetic fixtures and the beta account are retained for continued verification. No customer records or personal photos were used.

## Native status

[iOS workflow](https://github.com/coalfocks/homedoc/actions/runs/38435093204) built `1.1.11 (202610130001)` successfully. EAS build ID: `7bf9ed20-b7c1-4d7f-a9e6-25cc1abcef65`. Submission then failed with a generic error; Apple's acceptance is unconfirmed. Build success does not prove TestFlight availability.

The paired iPhone has `1.1.10 (202609232143)` installed. iPhone Mirroring awaits the user's first-use setup. Simulator runtimes exist but the Simulator application is absent. No native UI tests have passed yet. The new IPA contains PR #20's source; later web handoff and copy/count changes are not in that binary.
