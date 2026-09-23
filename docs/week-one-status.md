# Week one: web and mobile foundation

Updated September 16, 2026. This is the first implementation batch, not a declaration that the beta release gate has passed.

## Platforms

Web and mobile are equal product targets. The shared Expo app must preserve the same accounts, records, access boundaries, AI permission, and error recovery on all platforms.

- Web: desktop and phone browsers at `app.homedocumentation.com`; public site at `homedocumentation.com`.
- iOS: TestFlight now, App Store release later.
- Android: bundle checked in CI; distribution and physical-device coverage remain unverified. Do not advertise an Android download yet. Android users can use the web beta.

## Delivered in this branch

- **HD-01 — Quota permissions:** migration `20260916154854_restrict_ai_quota_execution.sql` removes client execution of the privileged quota RPC and retains the trusted server role. Isolated PostgreSQL regression reproduces the old default grant, proves client denial without writes, and checks trusted quota limits/month rollover. Production application tracked below.
- **HD-02 — Release inventory:** production/source differences and hosting are recorded below. Model reconciliation remains open; no Edge Function redeployment is included.
- **HD-03/08 — Sign-in and capture:** inline auth validation/errors work on web and native; email confirmation gets an explicit message; startup has a 12-second recovery timeout and retry. Native callback handling is separate from Supabase's browser callback handling. Property/area/note creation retains the same ID during retries, rejects duplicate taps, reuses confirmed photo uploads, and handles picker failures inline. Insert-then-update is intentional: property RLS rejects a new-row UPSERT. A retry must return an authorized row before reporting success.
- **HD-04 — Permissions regression:** every tracked migration runs in isolated PGlite/Postgres with minimal fixtures for Supabase-managed auth/storage schemas. Tests cover owner, property member/admin, assigned contractor, unrelated and anonymous clients, collaborator/contractor revocation, scoped image rows, and record retries. This does not test Storage HTTP/signed-URL expiry or Edge Function transfer behavior.
- **HD-06 — Product promises:** marketing has distinct web and iPhone entry points; unsupported document/packet claims are removed from the edited screens. Beta screens state the current 20-request AI allowance. Shared AI UI requires permission before questions, plans, or chat send context to OpenAI. Consent is scoped to the current user/task view, can be unchecked, and is requested again after remount. Existing plans remain readable without consent. No new server-side consent audit trail is claimed.
- **Release checks:** PR checks run TypeScript, lint, Jest, PostgreSQL permission tests, and exports for web, iOS and Android. GitHub reports `main` is unprotected. Existing deployment workflows still operate independently; configure required branch checks before relying on this as a deployment gate.

## Verification

| Check                                                               | Result                                                                  |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| TypeScript and ESLint                                               | Pass                                                                    |
| Jest                                                                | 7 suites, 18 tests pass                                                 |
| Quota ACL and counter regression                                    | Pass, isolated PostgreSQL                                               |
| Record/RLS/image-row boundaries                                     | Pass, isolated PostgreSQL                                               |
| Web/iOS/Android JS and asset exports                                | Pass on final implementation, including picker error handling           |
| Browser signed-out startup and empty-password/magic-link validation | Pass in local Chromium web build; inline feedback visible               |
| Phone-width browser layout                                          | Checked at 390 × 844; this is responsive web, not native iPhone testing |
| Real signup/email link delivery/session persistence                 | Pending on web and physical iPhone                                      |
| Actual photo upload and reopen on another device                    | Pending                                                                 |
| Camera/library denial, HEIC/large images, background/kill/relaunch  | Pending                                                                 |
| Production deployment of this frontend                              | Not performed                                                           |

Known limits: draft IDs/uploads survive retries only while the form remains mounted. App-kill/offline draft persistence and orphaned uploads after lost Storage responses remain separate work. A property row may exist before its photo succeeds; the form retries that same row. This is not offline sync. Existing dependency audit advisories remain to be triaged; no forced dependency upgrades were made.

## Production/source inventory

Evidence: repository/CI inspection plus Bert's read-only production checks, September 16. No credentials or customer records are included.

| Surface                                      | Observed state                                                                                                                                                                        |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Main source                                  | `coalfocks/homedoc`, `66270d56031e463ef9dfa6a83e938a3537a28f40`                                                                                                                       |
| Branded web                                  | Both branded domains report Vercel; GitHub production deployment `6298897199`, successful at the same SHA, September 6                                                                |
| Parallel web                                 | `homedoc.expo.app`, Expo/EAS Deploy run `34064862330`; separate host/assets, not authoritative for branded-domain verification                                                        |
| App database                                 | Supabase project `nismvycjiobjbaozjwih`; do not assume another similarly named project is staging                                                                                     |
| Tracked applied migrations before this batch | 17, through `20260728000001_add_note_todo_reminders`                                                                                                                                  |
| iOS build                                    | `1.1.10 (202608251717)`, `com.coalfocks.homedoc`; uploaded August 25, valid and unexpired as checked September 16                                                                     |
| Public TestFlight                            | `https://testflight.apple.com/join/WerQXHar`; enabled group limit 100                                                                                                                 |
| Production AI source                         | `plan-todo` v9; `const aiModel = 'gpt-5.6-luna'` used in all three requests; main still uses `gpt-4o-mini`                                                                            |
| AI source fingerprint                        | Downloaded production SHA-256 `9370a6a2c69895a6c27bd4393812db87291168f296d8185fa05d35ee23311930`; main `8816271f7730b35d063e4ceee153b169452c4e68fdbecca3244ca20f2928640c`             |
| Existing model PR                            | [PR 13](https://github.com/coalfocks/homedoc/pull/13); review model availability and run a synthetic request before reconciling/deploying, rather than copying a model string blindly |

Observed Edge Functions all report `verify_jwt=true`: create-checkout v3, customer-portal v3, stripe-webhook v4, plan-todo v9, transfer-property v4, create-checkout-session v2, billing-portal v2, invite-contractor v6, share-property v4, delete-account v2. Billing webhook routing/JWT requirements need a dedicated check before paid launch.

### Production quota repair

Bert confirmed effective EXECUTE at `2026-09-16 16:01:05.567035 UTC`: anon=true, authenticated=true, service_role=true. This is vulnerable; granting service_role alone does not revoke PUBLIC/client access. Bert applied the exact repair transactionally to the app project. At `2026-09-16 16:05:21.77924 UTC`, effective EXECUTE was anon=false, authenticated=false, service_role=true; ACL contained only postgres and service_role. Migration `20260916154854` / `restrict_ai_quota_execution` was recorded and verified at `16:06:11.038588 UTC` through the supported CLI migration-repair workflow. No other migrations, function bodies, app data, billing or auth settings changed. A later duplicate ACL read hit temporary authentication failure; the successful post-repair check is the verification evidence. HD-01 is repaired in production.

## Next week-one work, in order

1. Merge the reviewed source migration to preserve the already-applied production quota repair. Keep source and deployed permissions aligned.
2. Resolve the model/source difference without accidentally redeploying unrelated functions. Record a release manifest with exact frontend SHA, web deployment, mobile build, migration head, and function versions.
3. Run the core journey on desktop web, Safari on iPhone, and native TestFlight: signup → property → area → photo note → close/reopen → open same record on another device. Include weak network, expired session, and image permissions. Android native remains a separate required lane if included in the mobile beta.
4. Extend the permission matrix to household membership, transfer, account deletion, Storage HTTP access, and already-issued signed URLs. Confirm intended access after transfer/revocation; table-level RLS tests alone are insufficient.
5. Implement minimal measurement and diagnostics (HD-05). Proposed events: signup completed, property created, photo note saved, record reopened, invite accepted, AI request completed/failed. Allowed fields: event ID, pseudonymous user ID, platform, build, cohort/test flag, coarse error code and duration. Never send notes, photo contents/URLs, exact address, email, tokens or raw exception payloads. Report activation and record return by platform; do not equate sign-in with usage.
6. Publish reviewed privacy/support pages, test self-service account deletion on web/native, confirm actual AI limits in the UI against server entitlements, and finish the unsupported-promise audit. Current email links are not a substitute for a privacy policy.
7. Prepare a 15-person prospect list and observe the first three participants after P0 checks pass. Initial pilot target is 10, split deliberately across web and mobile; do not treat platform export success as beta readiness. No outreach has been sent.

## Device test record

For each run record tester, exact commit/build, OS/browser, account cohort, scenario, result, and reproduction steps. Use synthetic home details and disposable images. Confirm the deployment points to the intended environment before creating accounts.

| Scenario                                           | Desktop web | iPhone Safari | Native iPhone | Android browser | Native Android |
| -------------------------------------------------- | ----------- | ------------- | ------------- | --------------- | -------------- |
| Signup, confirm email, password and magic link     | Pending     | Pending       | Pending       | Pending         | Pending        |
| Session restore, background/relaunch, expired link | Pending     | Pending       | Pending       | Pending         | Pending        |
| Property → area → photo note → reopen              | Pending     | Pending       | Pending       | Pending         | Pending        |
| Interrupted save, retry, duplicate taps            | Pending     | Pending       | Pending       | Pending         | Pending        |
| Private/shared/revoked image access                | Pending     | Pending       | Pending       | Pending         | Pending        |
| AI consent, cap, failed request recovery           | Pending     | Pending       | Pending       | Pending         | Pending        |

An unavailable device is a pending gate, never a pass. Native builds, responsive web and physical devices provide different evidence.
