# EventsListingSection Plan

## Status

Proposed

## Purpose

Define the canonical listing surface for the public events route:

- `/{hubSlug}/events`

This component should become the first true SaaS event-discovery section for the public site, built on the current section/primitives system and aligned with the route-level plan in:

- `docs/public-site/public-events-journey-plan.md`

This document is intentionally detailed so implementation can proceed without re-deciding the same structural, UX, and design-system questions mid-build.

## Role In The Route

`EventsListingSection` is the main discovery surface on the `/events` route.

It sits beneath the route-level `HeroSection` and owns the actual browse experience.

The route composition should be:

1. `HeroSection`
2. `EventsListingSection`

This section should not try to absorb the route hero role and should not behave like a homepage promo section.

## Structural Ownership

`EventsListingSection` should internally own:

- `SectionShell`
- `SectionContainer`
- `SectionSearchFilters`
- system-driven results/context line
- event cards grid
- empty states

It should not own:

- route hero behavior
- event detail behavior
- registration detail behavior
- admin-authored section intro copy

This keeps the listing surface appropriately bounded.

## Why This Is A Section And Not A One-Off Page Block

Although this lives on a route, it should still be implemented as a proper section-level pattern because:

- it benefits from the current section system
- it should share spacing and width contracts with the public site
- it should consume shared card/grid primitives
- it should stay template-aware rather than inventing local page styling

So this is a domain-specific route section built on shared public primitives.

## Section Composition

### Outer structure

Expected high-level internal structure:

- `SectionShell`
  - `SectionContainer`
    - `SectionSearchFilters`
    - system-driven results/context line
    - cards grid or empty state

This should preserve:

- consistent section spacing
- consistent route width behavior
- consistent token/template alignment

## Section Header Decision

`EventsListingSection` should **not** render a `SectionHeader` in v1.

Reason:

- the route hero already introduces the page
- another header block would create visual repetition
- another header block would add unnecessary content-management pressure
- this is a discovery surface, not a stacked marketing section

Any context needed at the top of the listing should instead come from:

- `SectionSearchFilters`
- the subtle system-driven results/context line

## Data Contract

`EventsListingSection` should receive a normalized set of public event records suitable for public listing.

At minimum, each event item should expose what the listing card needs:

- `id`
- `slug`
- `title`
- `description` or summary source
- `category`
- `startAt`
- `endAt`
- `location`
- `pricingMode`
- `price`
- `currency`
- image/media fields if present

The section should not be responsible for inventing missing core event data.

## Search And Filter Inputs

The section should own the actual search/filter state and result derivation.

It should pass the control UI responsibilities into:

- `SectionSearchFilters`

### Search scope

Locked v1 direction:

- search should be simple and useful

Reasonable fields to search:

- title
- description/summary
- location

### Filter scope

Locked v1 direction:

- category only

The section should derive the available category options from the event data model.

## Category Handling

The category set should come from the event model rather than from route-local hardcoded labels.

The event admin flow now treats category as required, which is the correct direction for reliable filtering.

The section should therefore:

- trust category as a real event field
- expose category filtering via `SectionSearchFilters`
- keep the category logic at the listing level, not the primitive level

## Results/Context Line

Because the section does not render a `SectionHeader`, it still needs a small amount of operational orientation within the listing area.

That should be system-driven.

Examples of the kinds of states the section may produce:

- `12 upcoming events`
- `Showing all events`
- `Showing workshops`
- `3 results for "wellbeing"`

This line should be:

- compact
- secondary in hierarchy
- token-driven
- not content-authored

## Empty-State Requirements

`EventsListingSection` must support two distinct empty-state modes:

### 1. No public events exist

This state should communicate something like:

- there are currently no planned events

The tone should remain public-facing and calm.

This state is about the data source itself being empty.

### 2. Filters/search return no matches

This state should communicate:

- events do exist
- but the current search/filter combination returned no results

This state should feel different from the “no public events exist” case.

The section should not collapse both situations into one generic empty message.

## Listing Card Direction

### Locked card model

The listing should use cards in v1.

The cards should be:

- fully clickable
- route-linked to `/{hubSlug}/events/[eventSlug]`
- built from the shared public card system

### No repeated CTA button

The whole card acts as the click target.

Therefore:

- do not add a repeated button inside each card in v1

This avoids visual noise and keeps the listing cleaner.

## Event Card Content Contract

Each card should contain, in order:

1. media
2. title
3. clamped description
4. date and time
5. location
6. price / free state

### Media

Media should appear at the top of the card.

Behavior:

- if a public image/media asset exists, render it
- if no media asset exists, render a fallback placeholder

### Placeholder fallback

The fallback should be deliberate and token/template-aligned.

Requirements:

- it should not look like a broken image
- it should not feel like an afterthought
- it should inherit the public design system
- it should work across templates

This may eventually warrant a reusable public media fallback treatment if repeated elsewhere.

### Title

The title is the primary text element in the card body.

It should remain highly scannable across a multi-card grid.

### Description

Description should be present in v1 and clamped.

Requirements:

- keep it short
- clamp lines to preserve card rhythm
- do not force filler text if no summary exists

### Date and time

Date and time are essential and should be surfaced clearly.

The section should rely on shared event-formatting utilities where appropriate, while ensuring the final rendered text feels public-facing rather than admin-heavy.

### Location

Location should be included as a key browse decision point.

### Price / Free

Price or free state should be included in the card body.

This is a high-value browse signal and should not be pushed to the detail page only.

### Explicit exclusions

The v1 card should deliberately exclude:

- raw capacity
- spaces-left count
- a repeated CTA button

Those can be revisited later if product need justifies them.

## Card Layout Variants

### Candidate variants discussed

Two possible card layout directions were discussed:

- vertical card:
  - media on top
  - content beneath
- horizontal card:
  - media on left
  - content on right

### Recommended v1 decision

For v1, prefer the vertical card.

Why:

- simpler and more stable within a grid
- more natural with a responsive card grid layout
- better aligned with the existing public card/media rhythm
- less likely to create awkward layout pressure as cards collapse across breakpoints

So the planning assumption for v1 should be:

- one main vertical event card treatment

If a future route or template proves a strong need for a horizontal listing variant, it can be explored later.

## Derived Featured Event Treatment

### Locked direction

`EventsListingSection` should support a derived featured-event treatment when the result set is large enough to support it cleanly.

This is not an admin-authored featured flag.

It is a system-driven listing behavior derived from the currently visible result set.

### Selection rule

The featured event should be:

- the soonest upcoming event
- from the current filtered/search result set

That means:

- on the default listing, the earliest upcoming public event becomes featured
- when filtering by category, the earliest upcoming matching event becomes featured
- when searching, the earliest upcoming matching event becomes featured

This keeps the route behavior relevant and predictable.

### Minimum activation threshold

The featured-card treatment should only activate when there are at least:

- `4` results

Reason:

- 1 featured card plus 3 standard cards creates a balanced composition
- fewer than 4 results produces awkward straggler layouts
- with 1, 2, or 3 results, the cleaner approach is to render the standard vertical-card layout only

### Featured layout behavior

When the derived featured treatment is active:

- the featured event renders first
- on larger screens, it uses a horizontal layout
- the remaining events render beneath it in the standard vertical grid

The remaining events should preserve the normal ordering after the featured item is removed from the list.

### Mobile behavior

On mobile, the featured event should collapse back into the standard vertical card layout.

This keeps the route easier to scan on smaller screens and avoids an awkward horizontal-card treatment in narrow viewports.

### Featured indicator

The featured event should receive a small system-driven badge or chip.

Locked label:

- `Next event`

Reason:

- short
- clear
- accurately reflects the derived logic
- avoids implying manual curation in the way a generic `Featured` label might

This badge/chip should:

- remain subtle
- be token-driven and template-aware
- feel like part of the public design system rather than an admin/status badge

### Architectural boundary

This behavior should remain a listing-layout concern inside `EventsListingSection`.

It should not introduce:

- an admin `featured` field for events in v1
- a second manual homepage-style curation system
- route-local one-off logic that bypasses the shared section system

## Grid Layout Contract

### Locked direction

`EventsListingSection` should not require a 4-column desktop layout.

The section should align with the current shared public grid direction rather than pushing the primitive system into a listing-specific desktop expansion.

### Expected v1 layout

The expected listing grid direction is:

- desktop: 3 columns
- tablet: 2 columns
- mobile: 1 column

This works cleanly with:

- the current `SectionItemsGrid` direction
- the derived featured-event treatment
- the broader public design-system rhythm

### Primitive boundary

The section should adapt to the existing primitive contract rather than forcing a route-specific 4-column requirement.

If a broader product need for 4-column public listing grids appears later, that can be evaluated separately as a system-level primitive change.

## Search/Filter Primitive Contract

`EventsListingSection` should use:

- `SectionSearchFilters`

That primitive should remain neutral in naming and responsibility.

The section should pass to it:

- search value
- search handler
- filter options
- active filter
- filter handler
- optional context line

The section, not the primitive, remains responsible for:

- event-specific filtering logic
- event result derivation
- grid rendering
- empty states

## Filter Interaction Model

Locked v1 interaction:

- compact filter icon trigger
- mini menu/popover-style category list

This section should not render visible chip rows or segmented category controls in v1.

Reason:

- category sets are expected to grow
- always-visible category rows scale poorly
- a compact trigger keeps the route calmer and more maintainable

## Hero Relationship

The listing section sits beneath a route-level hero.

That means:

- no separate section intro copy is needed inside the listing
- no extra admin-authored section title/description should be introduced here

The hero remains system-driven in v1, with future admin-editable page-level hero copy handled through the separate page-settings direction.

## Page Settings Relationship

The broader admin/settings direction now distinguishes:

- `Site settings`
- `Page settings`

For `/events`, page-level hero copy should eventually belong to:

- `Page settings`

But `EventsListingSection` itself should remain system-driven and non-authored.

That means:

- no admin-authored listing section title
- no admin-authored listing section description

## Accessibility Expectations

The section should support:

- fully keyboard-accessible clickable cards
- clear focus indication
- accessible link semantics
- properly labeled search input and filter controls through the primitive
- readable empty states

If the entire card is clickable, we should ensure the implementation remains semantically sound and not rely on non-semantic click handlers alone.

## Design-System Expectations

Everything in `EventsListingSection` must remain aligned with the token/template-driven public system.

That includes:

- section width
- section spacing
- card surface
- card radius
- card shadow/elevation
- card hover/focus behavior
- media treatment
- text hierarchy
- empty-state presentation
- search/filter control styling

It must avoid:

- local hardcoded colors
- local hardcoded radii
- bespoke spacing values that bypass semantic tokens
- admin-surface styling patterns

## Suggested File Shape

Expected implementation location:

- `src/components/sections/events-listing-section/`

Likely files:

- `EventsListingSection.jsx`
- `EventsListingSection.module.css`

This section should then be composed into:

- `src/app/(public)/[hubSlug]/events/page.jsx`

## Implementation Sequence

1. lock this component plan
2. implement `SectionSearchFilters`
3. implement `EventsListingSection`
4. replace the `/events` placeholder route with:
   - `HeroSection`
   - `EventsListingSection`
5. verify:
   - search behavior
   - category filtering
   - empty states
   - missing-media fallback
   - responsive grid behavior
   - token/template compliance

## Open Questions

1. Should the missing-media placeholder for event cards be route-specific or shared with future course cards if the visual need is similar?
2. Should the context line live inside `SectionSearchFilters` or be rendered directly beneath it by `EventsListingSection` if we want stronger flexibility?
3. If 4-column desktop support is desired later, should that be a `SectionItemsGrid` enhancement or a listing-specific layout variant?

## Recommendation

Treat `EventsListingSection` as the implementation-ready public discovery section for `/events`.

Build it as:

- a section-based route surface
- using `SectionShell` and `SectionContainer`
- powered by `SectionSearchFilters`
- rendering fully clickable vertical event cards
- preserving the shared token/template-driven public design system

And keep the section itself system-driven rather than content-authored.
