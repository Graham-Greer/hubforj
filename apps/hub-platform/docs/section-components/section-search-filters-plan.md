# SectionSearchFilters Plan

## Status

Proposed

## Purpose

Define a reusable, neutrally named public discovery-controls primitive:

- `SectionSearchFilters`

This primitive should support public listing and discovery surfaces without becoming tied to a single domain such as events.

The initial consumer will be:

- `EventsListingSection`

But the primitive should be designed so it can later support:

- courses
- FAQs
- future public discovery routes

## Why This Primitive Exists

The newer public-site architecture now has:

- route-level section composition
- shared card/grid primitives
- shared public shell/footer/header

What it does not yet have is a reusable, public-facing discovery-controls primitive for:

- search input
- lightweight filtering
- subtle results context

We do not want each public listing route to invent its own local controls block.

We also do not want to reuse admin controls visually, even if some interaction ideas come from admin surfaces such as `/admin/payments`.

So we need a dedicated public primitive that is:

- reusable
- token-driven
- template-aware
- appropriately calm for the public site

## Naming

Locked name:

- `SectionSearchFilters`

Why:

- neutral rather than event-specific
- usable across multiple public discovery surfaces
- still clearly communicates its role inside section/route composition

## Primitive Responsibility Boundary

`SectionSearchFilters` should own:

- search input
- lightweight filter controls
- responsive layout of those controls
- optional results/context line

It should not own:

- the listing cards
- the empty state
- route hero behavior
- domain-specific result rendering
- domain-specific copy beyond passed configuration
- outer section spacing or section width ownership

That keeps the primitive reusable and bounded.

## Initial Consumer

### `EventsListingSection`

For the events route, the primitive should support:

- a search bar on the left
- a compact filter trigger on the right
- a subtle system-driven context line

This should sit above the event cards grid inside `EventsListingSection`, which remains responsible for:

- `SectionShell`
- `SectionContainer`
- section spacing
- listing layout ownership

## V1 Scope

### Search

The primitive should support:

- a single search input

The primitive should not assume the search target fields itself; it should accept value/state from the consuming section.

The consuming section can then decide what fields are searched.

### Filtering

The primitive should support:

- a bounded set of filter options

For the initial events use case, this means:

- `All`
- category options such as:
  - `Class / Training`
  - `Workshop`
  - `Meet up`
  - `Social / Gathering`
  - `Competition / Match`
  - `Outreach / Community Service`
  - `Special Event`

The primitive should not assume event-specific category names internally.

### Locked v1 filter interaction model

We are explicitly **not** using visible chips, pills, or segmented category controls for the events route.

Reason:

- the category list is expected to grow
- a visible chip row would not scale cleanly
- it would create wrapping, density, and responsiveness problems too early

Instead, the v1 filter interaction should use:

- a compact filter trigger with an icon
- a small menu or popover style list of filter options

This interaction direction may borrow from the structural behavior used on `/admin/payments`, but the public version must remain fully aligned with the public token/template system rather than admin styling.

### Context line

The primitive should optionally support a subtle context line such as:

- `12 upcoming events`
- `Showing all events`
- `Showing workshops`
- `3 results for "wellbeing"`

This should be passed in by the consuming section.

## Explicit Non-Goals For V1

`SectionSearchFilters` should not support in v1:

- advanced faceting
- multiple simultaneous filter groups
- sort dropdowns
- date range pickers
- price filtering
- availability filtering
- tag clouds
- map/list toggles

The primitive should start small and defensible.

## Layout Direction

### Desktop

The preferred layout is:

- search input on the left
- a compact filter trigger on the right

The results/context line may sit:

- above the controls
- below the controls
- or integrated between them depending on final implementation

But it should remain compact and visually secondary.

### Tablet

The controls should still feel intentional, not collapsed into a visually broken stack.

A likely direction is:

- search input full-width first
- compact filter trigger retained without expanding into a full visible category row

### Mobile

The primitive should collapse gracefully to:

- search input first
- compact filter trigger retained in the controls area
- context line still readable and not cramped

The primitive should not rely on a desktop-only control bar.

Its placement should be provided by the consuming section rather than by the primitive itself taking ownership of outer section structure.

## Filter Control Direction

The filter controls should feel public-facing and template-aware.

Locked v1 interaction direction:

- icon-triggered filter menu

The primitive should support a compact public-facing menu listing the available filter options rather than rendering those options as always-visible chips or segmented controls.

What matters architecturally is:

- the primitive owns the control row behavior
- the styling remains token-driven
- the active/inactive states remain template-aware
- the menu treatment remains public-facing rather than admin-looking

## Search Input Direction

The search field should:

- feel like part of the public site, not an admin form
- use the field token system where appropriate
- remain visually calm and brand-consistent

It may support:

- leading search icon if appropriate
- placeholder text passed by the consuming section

The primitive should not hardcode event-specific placeholder copy.

## Token And Template Design-System Contract

`SectionSearchFilters` must be fully aligned with the current public design system.

That includes:

- surface/background handling
- border treatment
- radius
- spacing
- typography
- input sizing
- control sizing
- hover states
- active states
- focus states
- filter-trigger states
- filter-menu states
- filter-option states

We should introduce semantic tokens where needed rather than hardcoding values locally.

Potential semantic needs may include:

- `--section-search-filters-gap`
- `--section-search-filters-surface`
- `--section-search-filters-border`
- `--section-search-filters-radius`
- `--section-search-filters-title-font` if a context line style needs it
- `--section-search-filter-trigger-size`
- `--section-search-filter-trigger-radius`
- `--section-search-filter-menu-surface`
- `--section-search-filter-menu-border`
- `--section-search-filter-menu-shadow`
- `--section-search-filter-menu-radius`
- `--section-search-filter-option-active-bg`

These names are directional, not final. The important point is that the primitive must not bypass the token/template system.

## Reuse Expectations

The primitive should be built for reuse, but not over-generalized in v1.

That means:

- use neutral prop naming where possible
- allow the consuming section to provide:
  - search value
  - search handler
  - filter options
  - active filter
  - filter handler
  - optional context line

But avoid a bloated API that tries to model every future use case immediately.

## Accessibility Expectations

The primitive should support:

- accessible labeling for the search input
- clear active-state indication for filters
- keyboard-accessible filter controls
- visible focus states

If the filter controls are implemented as buttons rather than links, they should behave like proper stateful controls.

## Relationship To Admin Reference Surfaces

The `/admin/payments` search/filter experience can be used as an interaction reference only.

What we should borrow:

- the idea of combined search + filter controls
- the practical arrangement of controls

What we should not borrow:

- admin visual styling
- admin density
- admin operational tone

This primitive belongs to the public site.

## Implementation Guidance

The primitive should likely live under:

- `src/components/sections/primitives/section-search-filters/`

Expected files:

- `SectionSearchFilters.jsx`
- `SectionSearchFilters.module.css`

## Initial Events-Specific Usage Contract

For `EventsListingSection`, the primitive should be able to support a shape like:

- search placeholder such as `Search events`
- category filter options
- active category
- current search query
- system-generated context line

The primitive itself should not know what an “event” is. It should only know it is rendering:

- search controls
- filter controls
- optional context text

The consuming section remains responsible for:

- `SectionShell`
- `SectionContainer`
- cards grid
- empty states

## Open Questions

1. Should the filter trigger use icon-only treatment or icon-plus-label treatment in v1?
2. Should the context line be rendered above the controls, below the controls, or inline on larger viewports?
3. Do we need a dedicated semantic token set for this primitive immediately, or can it be composed from existing field/control tokens plus a small number of new semantic tokens?

## Recommendation

Implement `SectionSearchFilters` as a new public primitive that:

- is neutral in name and responsibility
- supports search + lightweight filtering
- remains reusable for future public listing routes
- is fully token-driven and template-aware
- stays deliberately narrow in v1

Then use it first in `EventsListingSection`.
