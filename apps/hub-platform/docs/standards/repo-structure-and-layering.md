# Repo Structure And Layering

## Purpose

This document defines how code is allowed to be organized in `apps/hub-platform`.

The goal is not academic purity. The goal is practical control. The codebase must remain easy to reason about as features grow across public, member, hub-admin, and platform surfaces.

## Top-level app structure

The app should use this shape:

- `src/app`
  - App Router route files and route-local presentation modules only
- `src/components`
  - reusable visual modules
- `src/lib`
  - non-visual logic, domain rules, repositories, configuration, and integrations
- `src/hooks`
  - narrowly scoped reusable client hooks
- `tests`
  - app-local automated tests
- `docs`
  - app-local standards, roadmap, audits, and component governance

## Component layering

The allowed component stack is:

1. `primitives`
2. `ui`
3. `patterns`
4. `sections`
5. `routes`

### Primitives

Primitives are low-level structural or behavioral building blocks.

Examples:

- `Surface`
- `ThemeScope`

Primitives must:

- be visually generic
- have stable semantics
- avoid domain assumptions
- avoid route assumptions

### UI

UI components are reusable controls or small visual objects.

Examples:

- `Button`
- `Input`
- `Select`
- `Badge`
- `NavItem`

UI components must:

- express one clear responsibility
- expose deliberate variants rather than unbounded prop sprawl
- never fetch data directly
- never own business workflow logic

### Patterns

Patterns compose primitives and UI into meaningful product structures.

Examples:

- shells
- page headers
- empty states
- list patterns
- workspace sections

Patterns may:

- compose multiple UI components
- define layout and information hierarchy
- reflect audience-specific UX

Patterns must not:

- become route controllers
- own persistence logic
- become informal domain layers

### Sections

Sections exist for public-site assembly.

Sections are not generic admin content blocks. They are intentionally designed site composition modules used by developers to build branded public experiences.

Sections must:

- be route-agnostic within the public site family
- consume structured props only
- remain presentation-oriented

### Routes

Route files are thin composition shells.

They may:

- load data
- resolve params
- handle `notFound()` and redirect rules
- compose approved patterns and sections

They must not:

- contain large rendering trees that belong in patterns or sections
- perform inline business-rule normalization that belongs in `src/lib`
- become ad hoc state machines

## Import direction

Allowed direction:

- `primitives -> ui -> patterns -> sections -> routes`
- `lib` may be imported by routes, hooks, and components where appropriate
- `hooks` may be imported by client components in `ui`, `patterns`, or `sections`

Forbidden direction:

- `primitives` importing from `ui`, `patterns`, `sections`, or routes
- `ui` importing from `patterns`, `sections`, or routes
- route files importing from other route files
- data modules importing visual components

## Route ownership rules

Each route family owns a specific audience:

- `(platform)` for internal operator/provisioning/support workflows
- `(admin)` for hub admin operations
- `(hub)` for shared public + member-facing hub routes

Within `(hub)`:
- public routes remain open
- member account routes remain protected below the shared hub layout boundary

Do not mix route-family behavior.

Examples of forbidden mixing:

- platform-specific support controls inside hub-admin shell by default
- member-only flows bypassing the shared hub shell boundary
- admin operational controls appearing in public route components

## File size and responsibility thresholds

These are early-warning thresholds, not hard mechanical limits:

- reusable component file over 150 lines: review responsibility
- route file over 120 lines: likely extract composition
- data/repository file over 220 lines: likely split by query vs mutation or by domain concern
- global stylesheet over 200 lines: likely split by concern

If a file exceeds a threshold, the correct question is not “can this stay?” The correct question is “has this file started doing more than one job?”

## Placeholders and scaffolds

Scaffolds are permitted only under strict rules:

- they must preserve approved route authority
- they must be obviously identified as temporary
- they must correspond to a roadmap slice
- they must not pretend to be complete
- they must not become a substitute for real data or workflow design

Do not add new placeholder routes casually.

## Empty directories and future layers

`sections` and `hooks` may remain light or empty during early implementation if the domain does not yet require them.

Do not create abstractions only because a folder exists.

The correct principle is:

Introduce a layer when it removes real duplication or enforces real clarity.
