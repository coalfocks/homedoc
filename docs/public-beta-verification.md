# Public beta verification

October 13, 2026. Observed results from a new beta account using synthetic home data. Automated checks do not certify every production workflow.

## Published fixes

- [PR #20](https://github.com/coalfocks/homedoc/pull/20): browser alerts and confirmations, accurate deletion warning, public privacy policy and in-app links, email callback route, and validation before Expo publishing.
- [PR #21](https://github.com/coalfocks/homedoc/pull/21): forwards old email callbacks from the marketing host to the app, with fixed origins and whitelisted auth fields. Vercel validates before publishing too.
- [PR #22](https://github.com/coalfocks/homedoc/pull/22) is merged at `dee88a2dfb4cc914d0ec3c1272c938a0e897f281`. Vercel status and [Expo deployment](https://github.com/coalfocks/homedoc/actions/runs/38442021898) passed. Correct due-date copy and the area counter were verified live.
- [PR #23](https://github.com/coalfocks/homedoc/pull/23) is merged at `d06c147725b889d3c5c7ac594d1e5213171c7336`. Vercel production status and [Expo deployment](https://github.com/coalfocks/homedoc/actions/runs/38444351313) passed, including the Edge handler regressions.
- Supabase Auth's site URL is now `https://app.homedocumentation.com`, with the exact web callback allowed. Existing native callbacks were preserved. A newly delivered email reached the correct app and signed in successfully.

## Follow-up changes

Stored timestamps are now called **due dates**, with explicit notice that notifications are not sent. The Properties dashboard requests an aggregate area count instead of displaying a missing field as zero; it does not load area contents, and existing RLS applies.

The manual `repair-ios-submission.yml` checks App Store Connect before uploading an existing EAS IPA, validates app/version/build metadata, avoids duplicate uploads, and verifies processing. It uses existing CI secrets without changing credentials. Its first run stopped on Apple's HTTP 403 before uploading anything. The follow-up aligns key identifiers with the existing EAS submission profile and adds safe error context; it does not change credentials or bypass a denied status check.

Live testing also found `plan-todo` version 9 calling the deployed GPT-5.6 Luna with obsolete `max_tokens`. Version **10** is now **ACTIVE**, with `verify_jwt=true`; read-back matched the reviewed patch. The function retains the live model, uses `max_completion_tokens`, explicitly selects no reasoning within its small output budgets, omits temperature, and pins a compatible SDK. All three phases passed the live retest. See the [model documentation](https://developers.openai.com/api/docs/models/gpt-5.6-luna) and [Chat Completions parameter reference](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create).

## Completed checks

| Check                                 | Observed result                                                                                        |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| TypeScript and ESLint                 | Pass                                                                                                   |
| Jest                                  | 30 tests, 10 suites pass                                                                               |
| Edge handler regression               | Seven offline cases pass: questions, plan, chat, missing/invalid auth, inaccessible todo, quota denial |
| Database quota and record permissions | Both isolated PostgreSQL suites pass through PR #23                                                    |
| Web, iOS, Android exports             | Pass through PR #23                                                                                    |
| Public privacy route                  | HTTP 200 and correct policy rendered in Chrome                                                         |
| Signup/account privacy links          | Policy opens; closing returns to app                                                                   |
| Empty email validation                | Inline error, no request sent                                                                          |
| Real beta account and email sign-in   | Email delivered; magic link signed in a new account                                                    |
| Session restoration                   | Reload and a new tab remain authenticated                                                              |
| Sign-out and repeat sign-in           | Both tabs hide records on sign-out; fresh email link signs back in, with callback credentials cleared  |
| Property and area                     | Created and edited synthetic home and Kitchen QA; persisted after reload                               |
| Area counter                          | Dashboard shows 01 Known areas for the saved test area                                                 |
| Photo note                            | Synthetic PNG uploaded/rendered; note edited without losing image; reopened in another tab             |
| Due date storage                      | Date and default 9:00 AM saved and displayed; no notification delivery                                 |
| Todo                                  | Created, edited description/priority, changed status to In Progress                                    |
| Archive/restore                       | Todo disappeared from active area, appeared under Archived, returned to active list after Restore      |
| Account deletion Cancel               | Accurate browser warning; Escape cancelled; account remained signed in                                 |
| Mobile web                            | 390 × 844 layout, bottom tabs, note/photo and full-screen viewer checked                               |
| AI questions, plan, and chat          | Generated questions and a cabinet-knob plan; answered a synthetic follow-up                            |
| AI persistence                        | Saved plan and both chat messages still present after reload and reopening                             |
| Sharing/transfer forms                | Empty recipient disables submission; Cancel returns to property; no access or ownership changed        |

Two GPT-6 Luna workers handled separate UI and release-workflow tasks. The coordinator reviewed and integrated changes, ran checks, and performed live browser tests.

## Open checks and limitations

- Photo viewing passed. Save produced no app error, but automation did not observe a completed download; saving remains unverified.
- Actual permanent deletion, sharing, contractor access, transfer/revocation, interrupted uploads, expired sessions, and duplicate taps have not been exercised in production. Database suites cover access regressions but do not replace UI checks.
- Synthetic fixtures and the beta account are retained for continued verification. No customer records or personal photos were used.

## Native status

[iOS workflow](https://github.com/coalfocks/homedoc/actions/runs/38435093204) built `1.1.11 (202610130001)` successfully. EAS build ID: `7bf9ed20-b7c1-4d7f-a9e6-25cc1abcef65`. Submission then failed with a generic error; Apple's acceptance is unconfirmed. Build success does not prove TestFlight availability.

[First repair run](https://github.com/coalfocks/homedoc/actions/runs/38442021861) stopped at an App Store Connect HTTP 403. The [retry with the EAS profile's identifiers](https://github.com/coalfocks/homedoc/actions/runs/38444351156) confirmed the cause: `FORBIDDEN.REQUIRED_AGREEMENTS_MISSING_OR_EXPIRED` — a required Apple agreement is missing or expired. Both runs stopped before upload. This requires the account holder's agreement review; credentials were not changed and no agreement was accepted. Apple's processing status remains unverified. The App Store Connect browser session also requires user sign-in.

The paired iPhone has `1.1.10 (202609232143)` installed. iPhone Mirroring awaits the user's first-use setup. Simulator runtimes exist but the Simulator application is absent. No native UI tests have passed yet. The new IPA contains PR #20's source; later web handoff and copy/count changes are not in that binary.
