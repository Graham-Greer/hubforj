# Current State Audit

Date: 2026-03-08
App: `apps/hub-platform`
Scope: Architecture, layering, route authority, theming system, Firebase/data boundaries, quality gates, and implementation debt.

## Executive Summary

The greenfield app is materially healthier than the legacy codebase. The direction is correct. The current implementation has a clean enough foundation to continue, but it is not yet governed strongly enough to prevent future drift.

The strongest parts of the app today are:

- Clear route-family separation across platform, public, member, and hub-admin surfaces.
- A usable first-pass token system with light/dark and template concepts already present.
- Reasonable separation of route shells, reusable UI, and Firebase-backed data modules.
- Early write flows already implemented through server actions rather than client-side mutations.

The weakest parts of the app today are:

- Production-facing data modules still contain mock fallbacks.
- Placeholder route debt is widespread and not yet governed by a formal replacement rule.
- Global styling concerns are concentrated in a single `globals.css` file.
- The app has no local test suite and no proven quality-gate execution path.
- Some domain/status contracts are not yet formally locked in code or docs.

The app is viable. It is not yet safe to scale indiscriminately.

## Findings

### 1. High: Production data modules still contain mock fallback behavior

Files:

- `apps/hub-platform/src/lib/data/hubs.js`
- `apps/hub-platform/src/lib/data/users.js`
- `apps/hub-platform/src/lib/data/invites.js`

Issue:

The current data layer falls back to mock data when Firebase environment variables or admin credentials are missing. That is useful during bootstrap, but it is dangerous once real product behavior exists.

Why this matters:

- Silent fallback hides environment/setup failures.
- It allows routes to appear healthy while talking to fake data.
- It creates ambiguity about whether a page is production-ready or only scaffolded.
- It encourages mixed development states instead of explicit readiness.

Recommendation:

- Remove mock fallback from production data modules.
- If local bootstrap requires seed data, use explicit seed scripts or a dedicated development repository implementation selected by environment.
- Make setup failures fail hard and visibly.

### 2. High: Placeholder route debt is broad and currently under-governed

Representative files:

- `apps/hub-platform/src/app/(public)/[hubSlug]/events/page.jsx`
- `apps/hub-platform/src/app/(public)/[hubSlug]/courses/page.jsx`
- `apps/hub-platform/src/app/(member)/[hubSlug]/account/membership/page.jsx`
- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/events/[eventId]/page.jsx`
- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/settings/branding/page.jsx`
- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/courses/create/page.jsx`

Issue:

The route map has been scaffolded correctly, but many routes are still implemented as placeholders or mock-driven module overviews.

Measured state:

- `46` route `page.jsx` files currently exist in the app.
- A significant subset still resolves through placeholder patterns or mock module definitions.

Why this matters:

- Route authority is good, but implementation readiness is uneven.
- Placeholder routes can quietly persist and become a permanent maintenance burden.
- User-facing routes should not be discoverable in production unless they provide real value.

Recommendation:

- Introduce a strict placeholder policy.
- A placeholder route may exist only if it is:
  - explicitly linked to a roadmap item,
  - tracked in an audit/remediation list,
  - inaccessible to external users in production if it is not yet usable.
- No new placeholder routes should be added without simultaneously logging their replacement slice.

### 3. Medium: `globals.css` currently carries too much responsibility

File:

- `apps/hub-platform/src/app/globals.css`

Issue:

`globals.css` currently contains:

- raw palette tokens,
- typography tokens,
- spacing/radius/motion tokens,
- semantic surface/text/border contracts,
- component contract variables,
- theme selectors,
- template selectors,
- reset rules,
- base element rules.

Why this matters:

- The token system is conceptually good, but the file is acting as a catch-all.
- It makes future maintenance harder as themes/templates become richer.
- It weakens the distinction between foundational tokens and runtime semantic application.

Recommendation:

- Split global styling into dedicated concerns:
  - `tokens.css` for raw scales,
  - `semantic.css` for semantic contracts,
  - `theme-modes.css` for non-template light/dark selectors,
  - `src/app/styles/templates/*.css` for per-template selectors,
  - `base.css` for reset/base element rules.
- Keep the import surface simple through a single `globals.css` that composes these files.

### 4. Medium: No app-local tests are present yet

Path:

- `apps/hub-platform/tests`

Issue:

The directory exists, but it currently contains no test files.

Why this matters:

- Core data modules already perform validation and mutations.
- Route authority and shell behavior are becoming important enough to regress.
- Without tests, architecture decisions are documented but not enforced.

Recommendation:

Start with three test categories:

- Data contract tests for `src/lib/data/*`
- Route authority tests for canonical route families and prohibited patterns
- Theme/token contract tests for template and theme normalization

### 5. Medium: Domain contracts are not fully centralized yet

Representative files:

- `apps/hub-platform/src/lib/data/hubs.js`
- `apps/hub-platform/src/lib/data/hub-mutations.js`
- `apps/hub-platform/src/lib/data/events.js`

Issue:

Status enums, support states, and event property contracts are embedded directly in data modules.

Why this matters:

- Domain rules are starting to spread across multiple files.
- This becomes brittle once features like payments, attendance, course delivery, and member lifecycle get richer.

Recommendation:

- Introduce explicit domain contract modules under `src/lib/domain/*` or `src/lib/contracts/*`.
- Centralize enums, normalization rules, and transition rules there.
- Keep repository/data modules focused on persistence and mapping.

### 6. Medium: Root layout still hardcodes default theme/template at document level

File:

- `apps/hub-platform/src/app/layout.jsx`

Issue:

The root document still applies default theme/template attributes even though shell-level hub theming has already been introduced through `ThemeScope`.

Why this matters:

- It is acceptable as a bootstrap default, but it blurs where theme authority truly lives.
- Document-level defaults should exist only as safe fallbacks, not as the real source of hub presentation.

Recommendation:

- Keep document-level defaults minimal.
- Treat hub shell boundaries as the real theme/template authority.
- Document the precedence model explicitly.

### 7. Low: Existing file sizes are healthy, but a few files are early warning candidates

Largest files today:

- `src/app/globals.css` at 261 lines
- `src/lib/data/events.js` at 233 lines
- `src/lib/data/hubs.js` at 182 lines
- `src/lib/data/hub-mutations.js` at 137 lines
- `src/lib/data/invites.js` at 132 lines

Assessment:

These are still manageable. None are yet unacceptably large. `events.js` and `globals.css` should be watched closely because they are most likely to absorb unrelated responsibility.

Recommendation:

- Put extraction thresholds in the standards docs now.
- Split by responsibility before files become painful rather than after.

## Strengths Worth Preserving

- Route files are generally thin.
- Styling is colocated in CSS modules for reusable components.
- No inline styles were observed in the new app surface.
- The app is server-first by default and is using server actions for current write flows.
- The design system direction is stronger than the legacy app and worth protecting aggressively.

## Immediate Remediation Priorities

1. Remove mock fallback from production data modules and replace it with explicit development-only seed or fixture strategy.
2. Introduce app-local standards, component registry, and build-order governance.
3. Introduce a formal placeholder route policy and replacement tracking.
4. Start the app-local test suite before more operational slices are implemented.
5. Split `globals.css` into smaller global concern files before theme/template complexity expands.

## Audit Conclusion

The new app should continue. It should not be restarted again.

The correct move is to lock governance now, remove the highest-risk shortcuts, and then continue implementation under stricter architecture and quality rules.

## Verification Status

Automated verification from this environment is currently blocked.

Observed issue:

- `npm run lint` from `apps/hub-platform` fails in this environment with:
  - `WSL 1 is not supported. Please upgrade to WSL 2 or above.`
  - `Could not determine Node.js install directory`

Interpretation:

- The audit findings above are based on direct code inspection and structural analysis.
- They are not a substitute for successful app-local lint and test execution.
- The app now needs an executable quality path on a supported Node environment so standards compliance can be proven rather than inferred.

## Remediation Update: 2026-03-08 Pass 1

Completed in this pass:

- Removed silent mock fallback behavior from active data modules:
  - `src/lib/data/hubs.js`
  - `src/lib/data/users.js`
  - `src/lib/data/invites.js`
  - `src/lib/data/events.js`
- Removed now-unused mock data files for hubs, users, and invites.
- Split global styling concerns out of `src/app/globals.css` into:
  - `src/app/styles/tokens.css`
  - `src/app/styles/semantic.css`
  - `src/app/styles/theme-modes.css`
  - `src/app/styles/templates/*.css`
  - `src/app/styles/base.css`

Result:

- Missing Firebase/config authority will now fail explicitly instead of producing fake data.
- The token/theming foundation is now structurally cleaner and easier to evolve.

Remaining priority items after this pass:

1. Placeholder route policy enforcement and reduction.
2. App-local automated tests.
3. Domain contract extraction out of repository files.
4. Theme precedence tightening at the root vs shell boundary.
