# Design Token Reset And Semantic Rebuild Plan

## Status

This plan supersedes incremental token cleanup as the primary path forward.

The current implementation has accumulated too much drift between:

- `tokens.css`
- `theme-modes.css`
- `semantic.css`
- template stylesheets
- runtime branding overrides
- public shell contracts
- admin/operator surfaces

The result is that local fixes can improve one surface while regressing another.

## Critical Rule

**Current token usage in the codebase is not the source of truth for this reset.**

That means:

- existing token assignments are evidence of current behavior
- existing token assignments are not authoritative design decisions
- we do not preserve current usage just because a component already depends on it
- we rebuild the contract from first principles, then migrate components to that contract

Existing code is therefore used for:

- audit input
- migration sequencing
- regression checks

Existing code is not used for:

- deciding final token ownership
- deciding final semantic hierarchy
- deciding whether a token belongs in a given file

## Additional Rule

**`color-mix(...)` is not allowed in the rebuilt design-token system.**

That means:

- token foundations must use explicit values or explicit token references
- semantic and component contracts must not generate new values by blending other tokens
- if a derived state is needed, it must have an explicitly named token

Examples:

- acceptable:
  - `--public-nav-item-bg-hover: var(--surface-secondary)`
  - `--footer-social-border-hover: var(--accent-primary)`
- not acceptable:
  - `--public-nav-item-bg-hover: color-mix(...)`
  - `--footer-surface: color-mix(...)`

This rule exists to keep the system:

- inspectable
- predictable
- easier to debug
- easier to migrate across public and admin domains

## Objectives

1. Re-establish a clean token architecture with clear ownership by file.
2. Separate public and admin/operator semantics so they cannot regress each other.
3. Build light and dark mode foundations deliberately from token ramps.
4. Reapply semantic contracts in a controlled outside-in order.
5. Keep templates and branding as controlled override layers, not alternate semantic systems.

## Target Ownership Model

### 1. `tokens.css`

Purpose:

- raw design primitives only

Allowed here:

- neutral ramps
- brand ramps
- accent ramps
- success/warning/danger ramps
- white/black primitives
- typography scale
- spacing scale
- radius scale
- shadow scale
- motion values
- layout scales

Not allowed here:

- semantic roles
- component contracts
- public-shell tokens
- admin-shell tokens
- template-specific overrides

### 2. `theme-modes.css`

Purpose:

- mode-specific semantic foundations only

Allowed here:

- light/dark semantic foundations for:
  - backgrounds
  - surfaces
  - text
  - borders
  - accent roots
  - status roots

Examples:

- `--bg-canvas`
- `--surface-primary`
- `--text-primary`
- `--border-subtle`
- `--accent-primary`

Not allowed here:

- component-specific contracts
- header/footer/nav-specific tokens
- section-specific tokens
- form-specific tokens
- placeholder/badge/card-specific tokens

Rule:

- `theme-modes.css` defines only semantic mode roots
- all component-level semantics must derive from those roots elsewhere

### 3. `semantic.css`

Purpose:

- shared semantic aliases and component/system contracts

Allowed here:

- component contracts derived from semantic roots
- shared interaction tiers
- shared text hierarchy
- shared border hierarchy
- shared section primitives

Examples:

- field tokens
- panel tokens
- section shell tokens
- section card tokens
- shared nav/control interaction tokens

Not allowed here:

- raw palette hex values
- template-specific styling decisions
- admin-only shell semantics if they should be separated from public semantics

### 4. Public semantic layer

Purpose:

- public-site-specific semantic contracts only

Target:

- move public-only semantic contracts out of shared `semantic.css` into a dedicated public semantic file

Examples:

- public header
- public nav
- public mobile nav
- public footer
- public placeholder page chrome

Reason:

- public shell tokens should not be allowed to influence admin/operator surfaces

### 5. Admin/operator semantic layer

Purpose:

- admin and platform shell semantics only

Target:

- create a dedicated admin/operator semantic file

Examples:

- platform shell panels
- admin shell chrome
- workspace cards
- workspace nav
- operator alerts/banners

Reason:

- admin/operator styling should not inherit public-shell semantic assumptions

### 6. `templates/*.css`

Purpose:

- template expression only

Allowed here:

- template typography personality
- spacing/radius adjustments
- shell atmosphere
- approved public template personality overrides

Not allowed here:

- raw semantic root definitions
- admin/operator overrides
- direct component-specific one-offs unless they are truly template-owned

### 7. Runtime branding resolver

Purpose:

- tenant-specific semantic root overrides only

Allowed here:

- tenant branding values mapped into semantic roots such as:
  - primary accent
  - secondary accent
  - background primary
  - background accent

Not allowed here:

- direct injection of public header tokens
- direct injection of footer tokens
- direct injection of grid/card/placeholder/component tokens

Rule:

- branding resolver overrides roots
- component and public/admin semantics derive from those roots

## Semantic Rebuild Order

Implementation must happen in this exact order.

### Phase 1. Freeze and audit

Actions:

- stop ad hoc token patches
- treat current implementation as audit input only
- record current token ownership issues

Deliverables:

- this plan
- audit notes by surface

### Phase 2. Rebuild raw token primitives

Files:

- `tokens.css`

Actions:

- confirm all raw ramps and scales
- define abstract ramp aliases where needed:
  - neutral
  - brand
  - accent
- classify every existing token as:
  - keep in `tokens.css`
  - keep but document as transitional
  - move out of `tokens.css`

#### `tokens.css` Initial Audit

Current file review:

- `/apps/hub-platform/src/app/styles/tokens.css`

The current file is closer to the target than the rest of the stack. The main task is to tighten its contract and document what is transitional versus canonical.

##### Keep As Canonical Primitive Tokens

These belong in `tokens.css` and should remain the source of truth:

- palette ramps
  - `--palette-accent-50` to `--palette-accent-900`
  - `--palette-brand-50` to `--palette-brand-900`
  - `--color-slate-50` to `--color-slate-900`
  - `--palette-neutral-50` to `--palette-neutral-900`
- primitive constants
  - `--color-white`
  - `--color-black`
  - `--color-emerald-500`
  - `--color-amber-500`
  - `--color-crimson-500`
- typography primitives
  - font families
  - font sizes
  - font weights
  - line heights
  - composed font shorthands
- spacing scale
  - `--space-*`
- radius scale
  - `--radius-*`
- motion primitives
  - `--motion-*`
  - `--ease-standard`
- elevation primitives
  - `--shadow-*`
- layout primitives
  - `--layout-*`
  - `--section-width-*`
  - `--section-header-width-*`
  - `--shell-*`
  - `--content-gutter`

##### Keep Temporarily But Mark As Transitional

These are acceptable in `tokens.css` for migration safety, but they are not the preferred long-term primitive naming model:

- legacy palette aliases
  - `--color-sand-*`
  - `--color-sky-*`

Reason:

- these are compatibility aliases for older usage
- they should not be expanded further
- new semantic work should prefer `--palette-accent-*`, `--palette-brand-*`, and `--palette-neutral-*`

##### Do Not Add More Of This Kind

The following categories do not currently exist in `tokens.css` in a problematic way, and that is good. We should explicitly protect that boundary:

- semantic usage tokens
  - example: `--text-primary`, `--surface-primary`
- component contract tokens
  - example: `--button-radius`, `--section-card-surface`
- public shell tokens
  - example: `--public-header-surface`, `--footer-text`
- admin shell tokens
  - example: workspace panel or admin nav tokens
- template-owned expression tokens
  - example: `--template-shell-bg`, template-specific card chrome

##### Improvements Required In `tokens.css`

1. Add a clear contract comment at the top of the file.

Recommended guidance:

- primitive tokens only
- components must not consume `tokens.css` directly unless using raw scales by design
- semantic roots belong in `theme-modes.css`
- component and shell contracts belong in semantic layers

2. Treat `--palette-neutral-*` as the preferred neutral ramp abstraction.

Reason:

- it preserves the ability for templates to later remap the neutral family without forcing semantic layers to bind directly to `--color-slate-*`

3. Freeze legacy aliases.

Rule:

- `--color-sand-*` and `--color-sky-*` remain only for migration compatibility
- no new work should target them

4. Keep typography and layout primitives here, but do not let them become semantic indirection.

Examples:

- `--font-heading-lg` is acceptable as a primitive/composed type token
- `--section-width-default` is acceptable as a layout primitive
- but tokens like `--footer-title-font` should not be introduced here

##### `tokens.css` Target Outcome

After Phase 2, `tokens.css` should be trusted as:

- the only source of raw ramps and scales
- the only place where raw color values are authored
- a file with no public/admin/template/component ownership ambiguity

It should not be trusted as:

- a semantic layer
- a component contract layer
- a place to solve styling regressions directly
  - brand
  - accent

Deliverables:

- stable raw token layer

### Phase 3. Rebuild semantic mode foundations

Files:

- `theme-modes.css`

Actions:

- define semantic roots from token ramps for light and dark mode
- start with:
  - backgrounds
  - surfaces
  - text
  - borders
  - accent/status roots

Deliverables:

- comprehensive semantic mode foundation

### Phase 4. Rebuild shared semantic contracts

Files:

- `semantic.css`

Actions:

- define shared semantic tiers:
  - text hierarchy
  - border hierarchy
  - interaction hierarchy
  - panel/field/card contracts
  - shared section primitive contracts

Deliverables:

- stable shared semantic contract

### Phase 5. Split public and admin semantics

Files to introduce:

- `public-semantic.css` or equivalent
- `admin-semantic.css` or equivalent

Actions:

- move public-only contracts out of shared semantics
- create admin/operator-only semantic contracts

Deliverables:

- hard boundary between public and admin/operator semantic layers

### Phase 6. Rebuild public site outside-in

Order:

1. body / root
2. public shell
3. public sections
4. public section primitives
5. public UI primitives

Rule:

- each layer must consume the contract from the correct file
- no local token invention during migration

### Phase 7. Rebuild admin/operator outside-in

Order:

1. admin/platform body / root
2. admin/operator shell
3. workspace surfaces
4. admin forms
5. admin UI primitives

Rule:

- admin surfaces must use admin/operator semantic contracts
- no public-shell semantic leakage

### Phase 8. Reintroduce template expression

Files:

- `templates/*.css`

Actions:

- reapply template differences carefully
- ensure templates affect expression, not semantic ownership

### Phase 9. Reapply branding root overrides

Files:

- runtime branding resolver

Actions:

- limit branding to semantic root overrides only
- verify public surfaces inherit correctly

## Outside-In Audit Order

This is the mandatory order for reviewing and migrating surfaces.

### Public

1. body/root
2. header
3. nav/mobile nav
4. footer
5. section shell
6. section header
7. section rich text
8. section card
9. section families
10. public UI primitives

### Admin/operator

1. body/root
2. platform/admin shell
3. panel/card surfaces
4. forms and fields
5. workspace pages
6. admin UI primitives

## Semantic Tier Definitions To Lock

### Surface tiers

- canvas
- subtle background
- primary surface
- secondary surface
- tertiary surface
- inverse surface

### Border tiers

- subtle UI border
- strong UI border
- hover interactive border
- active interactive border

### Text tiers

- primary
- secondary
- muted
- inverse
- accent

### Interaction tiers

- default
- hover
- active
- selected
- inverse

## Guardrails

Do not:

- patch components before the semantic contract is defined
- use current component token usage as architectural truth
- let runtime branding inject component-level tokens
- let public semantic tokens affect admin/operator styling
- let template files redefine semantic roots

Do:

- rebuild root semantics first
- migrate outside-in
- document each semantic tier before large migrations
- verify public and admin separately

## Review Gates

We do not proceed from one phase to the next until:

1. token ownership for that phase is explicit
2. the affected surfaces are audited
3. regressions are checked in both light and dark mode
4. public and admin are verified independently when relevant

## First Implementation Pass After This Plan

The first concrete implementation pass should be:

1. finalize raw ramps in `tokens.css`
2. rebuild comprehensive light/dark semantic mode roots in `theme-modes.css`
3. define shared semantic tiers in `semantic.css`
4. introduce separate public and admin semantic files

Only after that should we migrate actual components again.
