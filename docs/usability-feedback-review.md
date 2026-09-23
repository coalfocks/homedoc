# Usability feedback review

Branch: `codex/usability-feedback`  
Base: `codex/week-one-foundation` (PR #17)

This pass retains the original visual design: colors, typography, shadows, cards, forms, images, and content hierarchy. The broader visual changes from `codex/ui-polish` are not included.

## Changes

- Magic Link and Password each fill half of the sign-in toggle.
- The Free beta notice has its own top margin, including compact layouts without promotional cards.
- AI planning has concise, provider-neutral permission text. Expandable information explains what is sent and identifies the provider. The permission gate and request allowance remain.
- The desktop sidebar and mobile tabs remain available inside records and forms. Each section keeps its own stack and form state when switching tabs.
- Detail/edit screens have an explicit Back button. Record deletion and property transfer return to the current section's list. Upgrade links select the existing Beta/Pro tab.
- Todos support Archive and Restore. All/Pending/In Progress/Done lists and active counts exclude archived records. Archived filters in global and area todo lists provide access and restore actions. The area page always links to its full todo list and archive, even when no active tasks remain. Archiving preserves status, details, reminders, and saved plans.

## Database deployment

Migration: `supabase/migrations/20260923205328_add_todo_archiving.sql`.

The migration adds a nullable `archived_at` timestamp to the existing todo table. It does not delete records or change RLS policies. Existing rows remain active. The app reads existing rows without requiring the column, but archive/restore writes require the migration.

Live deployment is pending: the connected Supabase account lacks HomeDoc project access, the local CLI is signed out, and Bert's bridge returned an execution error. No production database change was made in this pass.

## Review walkthrough

1. Compare both login modes and the spacing above Free beta at desktop and phone widths.
2. Open Properties → a property. Switch to Todos, then back to Properties: the property stays open.
3. Open an add/edit form, enter a draft, switch sections, and return. Use Back to return one screen.
4. Open a todo and archive it. It disappears from active lists and area previews, and appears under Archived.
5. Restore it from Archived; its previous status, reminder, and plan remain.
6. Open AI planning and expand the information link to inspect data-use details.

## Validation

- TypeScript and ESLint pass.
- All 22 unit tests pass (8 suites), including archive filtering, counts, mutation payloads, and error handling.
- Both PGlite database suites pass, including archive/restore permissions and preservation of status, reminders, plans, and chat.
- Expo exports pass for web, iOS, and Android.
- Browser checks with isolated sample data cover login sizing/spacing, persistent mobile tabs and desktop sidebar, Back buttons, cross-tab form drafts, archive/restore, active counts, and AI disclosure text.
- No real records were archived during QA. The live schema was checked read-only and does not yet contain `archived_at`.
- Physical iPhone/Android testing is still required before release.

Local sample preview: `http://127.0.0.1:8768/`. It uses in-memory sample records only. The normal app preview at `http://127.0.0.1:8769/` uses the configured HomeDoc backend; archive writes show a friendly unavailable message until the migration is applied.
