# Public Template Architecture Refactor Plan

Date: 2026-05-09
Owner: Codex
Status: Proposed

## Goal

Refactor the public template system in `hub-platform` so that:

- `Civic` remains the stable baseline and is not visually regressed
- `Editorial` and `Studio` are rebuilt cleanly on top of the template architecture
- template files select variants only
- template CSS files override tokens only
- responsive behavior is owned by shared component variants, not template-specific CSS patches

This plan replaces the current hybrid approach where some structural behavior is controlled by:

- template config
- component variants
- ad hoc `:global([data-template="..."])` CSS overrides inside shared section modules

## Target Architecture

### 1. Template config owns variant selection

Each template definition should only decide which variant to use.

Examples:

- `landingPage.hero.variant`
- `landingPage.info.variant`
- `landingPage.whatWeDo.variant`
- `eventsPage.listing.variant`
- `eventDetailPage.detail.variant`

Template files should not imply custom layout behavior beyond selecting one of the supported variants.

### 2. Template stylesheet owns token identity

Each template stylesheet should only set template-scoped visual tokens such as:

- type family
- shell background
- radius language
- shadow strength
- surface treatment
- accent usage
- header/footer token overrides

Template CSS should not:

- change structural layout
- move content ordering
- alter component grid behavior directly
- patch breakpoints for one template only

### 3. Shared component variants own structure and responsiveness

Every public-facing section variant must define:

- desktop layout
- tablet collapse behavior
- mobile stack behavior
- text hierarchy behavior
- spacing behavior

This logic should live inside the shared component and its CSS module.

## What Stays

Keep the following:

- current template contract expansion in:
  - `src/lib/templates/template-types.js`
  - `src/lib/templates/template-contract.js`
- template file mapping approach in:
  - `src/lib/templates/templates/civic.js`
  - `src/lib/templates/templates/editorial.js`
  - `src/lib/templates/templates/studio.js`
- template scope isolation fixes:
  - no root-level `data-template`
  - no admin/platform template leakage

These are good foundations and should not be rolled back.

## What Must Be Removed

Remove template-specific structural overrides from shared section CSS modules.

Primary examples to eliminate:

- `:global([data-template="editorial"])` layout behavior inside:
  - `HeroSection.module.css`
  - `InfoSection.module.css`
  - `GridSection.module.css`
  - `TestimonialsSection.module.css`
  - `CTASection.module.css`
  - `EventsListingSection.module.css`
  - `CoursesListingSection.module.css`
  - `EventDetailsSection.module.css`
  - `CourseDetailsSection.module.css`

The only acceptable template-specific styling inside shared modules after refactor is token consumption already inherited from template scope. Structural overrides should move into explicit variant classes.

## Refactor Strategy

### Phase 1. Freeze Civic as reference

Objective:

- treat `Civic` as the baseline implementation
- do not change its chosen variant mappings unless required by shared API cleanup

Actions:

- confirm `civic.js` uses only stable default variants
- ensure all default variant behavior remains visually equivalent before and after refactor

Success condition:

- `Civic` pages render the same or near-identical after architectural cleanup

### Phase 2. Normalize variant API surface

Objective:

- ensure every template-specific layout currently achieved through patches becomes an explicit variant

Required variant families:

- `HeroSection`
  - `centered`
  - `split`
  - `panel`
- `InfoSection`
  - `default`
  - `story`
  - `feature`
- `GridSection`
  - `default`
  - `step`
  - `showcase`
- `TestimonialsSection`
  - `cards`
  - `spotlight-plus-rail`
  - `showcase`
- `CTASection`
  - `band`
  - `split`
  - `block`
- `EventsListingSection`
  - `default`
  - `editorial`
  - `studio`
- `CoursesListingSection`
  - `default`
  - `editorial`
  - `studio`
- `EventDetailsSection`
  - `default`
  - `editorial`
  - `studio`
- `CourseDetailsSection`
  - `default`
  - `editorial`
  - `studio`

Success condition:

- no template needs secret CSS overrides to get its intended layout

### Phase 3. Define responsive contract per variant

Objective:

- make every variant explicitly responsive across desktop, tablet, and mobile

For each variant, document and implement:

- desktop column structure
- tablet breakpoint collapse
- mobile stack order
- media ordering rule
- heading scale rule
- summary/body width behavior
- card density adjustments

Required policy:

- content order should generally remain copy-first then media on smaller screens unless the variant intentionally requires otherwise
- media should not jump unpredictably because of isolated `order` hacks
- typography should use `clamp()` consistently where appropriate

Success condition:

- responsiveness is predictable from the variant alone

### Phase 4. Rebuild Editorial cleanly

Objective:

- re-implement `Editorial` entirely through variant selection plus token overrides

Editorial design direction:

- sharper, quieter, more authored
- less card-like
- lighter surfaces
- stronger reading rhythm
- accent as punctuation, not fill

Editorial should map to:

- hero: `split`
- info: `story`
- what we do: `step`
- testimonials: `spotlight-plus-rail`
- cta: `split`
- event listing: `editorial`
- course listing: `editorial`
- event detail: `editorial`
- course detail: `editorial`

Editorial stylesheet responsibilities:

- typography family
- radius reduction
- shadow reduction
- border tone
- shell background
- header/footer token identity

Editorial stylesheet must not:

- reorder sections
- collapse grids
- change stack behavior
- override variant layouts directly

Success condition:

- removing all template-specific structural overrides still leaves Editorial fully distinct

### Phase 5. Rebuild Studio cleanly

Objective:

- re-implement `Studio` entirely through variant selection plus token overrides

Studio design direction:

- bolder, sculpted, showcase-oriented
- stronger shadows
- larger radius vocabulary
- more dramatic surface framing
- stronger accent presence

Studio should map to:

- hero: `panel`
- info: `feature`
- what we do: `showcase`
- testimonials: `showcase`
- cta: `block`
- event listing: `studio`
- course listing: `studio`
- event detail: `studio`
- course detail: `studio`

Studio stylesheet responsibilities:

- display font choice
- larger surface radii
- stronger shadows
- header/footer token identity
- accent-forward surfaces

Studio stylesheet must not:

- encode unique layout logic outside variant classes

Success condition:

- Studio feels materially different from Civic and Editorial using tokens plus clean variant structure only

### Phase 6. Remove hybrid leftovers

Objective:

- delete remaining template-targeted layout patches from shared section CSS

Checklist:

- no structural `:global([data-template="editorial"])` overrides remain
- no structural `:global([data-template="studio"])` overrides remain
- any remaining `:global([data-template=...])` usage should be token-visual only and ideally unnecessary

Success condition:

- design system returns to a clean layering model

## File-Level Work Plan

### Template layer

- `src/lib/templates/template-types.js`
- `src/lib/templates/template-contract.js`
- `src/lib/templates/templates/civic.js`
- `src/lib/templates/templates/editorial.js`
- `src/lib/templates/templates/studio.js`

### Shared public sections

- `src/components/sections/hero-section/*`
- `src/components/sections/info-section/*`
- `src/components/sections/grid-section/*`
- `src/components/sections/testimonials-section/*`
- `src/components/sections/cta-section/*`
- `src/components/sections/events-listing-section/*`
- `src/components/sections/courses-listing-section/*`
- `src/components/sections/event-details-section/*`
- `src/components/sections/course-details-section/*`

### Template token styles

- `src/app/styles/templates/civic.css`
- `src/app/styles/templates/editorial.css`
- `src/app/styles/templates/studio.css`

### Public composition routes

- `src/components/patterns/public-landing-page/PublicLandingPage.jsx`
- `src/app/(hub)/[hubSlug]/events/page.jsx`
- `src/app/(hub)/[hubSlug]/courses/page.jsx`
- `src/app/(hub)/[hubSlug]/events/[eventSlug]/page.jsx`
- `src/app/(hub)/[hubSlug]/courses/[courseSlug]/page.jsx`

## Testing Strategy

### Source-contract coverage

Add or update unit tests that verify:

- template files map to explicit variants only
- shared components expose the intended variant options
- template scope does not leak into admin/platform
- public route components continue reading variant choice from template registry

### Manual QA matrix

For each template:

- homepage
- events listing
- courses listing
- event detail
- course detail

At each viewport:

- desktop
- tablet
- mobile

Check:

- copy/media order
- grid collapse
- heading scale
- line length
- CTA spacing
- card padding
- no squeezed media
- no overlapping media/copy

### Regression rule

Always compare against `Civic` first.

If a shared change improves Editorial/Studio but regresses Civic, stop and isolate the change into a variant instead.

## Definition of Done

This refactor is complete when:

- `Civic` remains stable
- `Editorial` and `Studio` feel materially distinct
- template files only select variants
- template CSS files only express token identity
- responsive behavior is consistent and variant-owned
- no ad hoc structural template patches remain in shared CSS modules

## Recommendation

Implement this refactor in place.

Do not restore the repo backup unless:

- Civic can no longer be preserved as a stable baseline, or
- the working tree becomes too tangled to separate variant logic from template overrides safely

At the current stage, the codebase is still recoverable through controlled refactor and should not be reset.
