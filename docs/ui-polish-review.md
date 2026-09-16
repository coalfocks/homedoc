# UI polish review

Branch: `codex/ui-polish`  
Base: `codex/week-one-foundation` ([PR #17](https://github.com/coalfocks/homedoc/pull/17))

This is an exploratory presentation pass over the existing React Native app for web, iOS, and Android. Existing screens, data, and workflows remain the basis of the app.

## What changed

- Calmer typography, neutral borders, smaller radii, and lighter shadows; the forest-green and warm-cream identity remains.
- Properties, Areas, Notes, Todos, and Beta stay in the main navigation. Desktop uses a sidebar; phones use bottom tabs.
- Records appear ahead of beta and upgrade messaging. Counts are compact, duplicate headings are removed, and empty photo placeholders take less space.
- Creation and editing forms use consistent labels and input sizes. Decorative completion meters and repeated coaching are removed. Contractor access scope and account requirements remain visible.
- Todo titles have more room on phones. Filters and status controls retain their existing behavior with larger touch targets.
- AI plans use plain headings, keeping warnings, materials, steps, tools, professional help, checkpoints, chat, and consent controls.

## Suggested walkthrough

1. Sign in and compare Properties on a desktop and phone-width window.
2. Open a property, then an area. Check photos, Notes, Todos, editing, and contractor access.
3. Open Todos from the main navigation. Try the status filters and open a task with a longer title.
4. Inspect priority, reminder, location, and the saved plan. Open Edit to check all fields.
5. Open the add-property, add-area, add-note, and add-todo forms and compare their density.

The hosted branch preview uses the app's configured backend and your existing account. Saved changes there affect those records. Local visual QA used synthetic sample records on a separate, read-only fixture server; that fixture is not part of the deployed app.

## Validation and limits

- Passed TypeScript, ESLint, and all 7 Jest suites / 18 tests.
- Passed Expo exports for web, iOS, and Android using the repository lockfile.
- Browser review covered 1280px desktop and 390px/360px phone widths, signed-out and signed-in sample screens, todo filters/details/plans, area navigation, and creation/edit fields.
- Source parity review compares navigation, actions, fields, validation, permissions, and backend calls against the base branch.
- Responsive browser review and native exports do not replace hands-on iPhone/Android testing. Native keyboard, photo permissions, and device-specific behavior still need that pass before release.
