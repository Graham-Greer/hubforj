# Public Events Journey Plan

## Status

Proposed

## Purpose

Define the canonical SaaS public events journey for `hub-platform` from a clean route-placeholder baseline.

This plan governs:

- `/{hubSlug}/events`
- `/{hubSlug}/events/[eventSlug]`
- the public discovery-to-detail flow
- the relationship between the homepage and the events route

This document is intentionally detailed so the next implementation slice has a clear architectural, product, and design-system contract before code is written.

## Current Route State

The old pre-SaaS public event route implementation has already been removed from the active public route layer.

That means:

- `/{hubSlug}/events` is currently a placeholder route
- `/{hubSlug}/events/[eventSlug]` is currently a placeholder route
- the next implementation should be treated as the first canonical SaaS event journey for these routes

This is important because we are no longer adapting an older discovery page. We are defining the route structure fresh using the current public-site architecture.

## Why The Events Route Comes Next

The homepage public stack is now in a much healthier position:

- `HeroSection`
- `InfoSection`
- `GridSection`
- `TestimonialsSection`
- `CTASection`
- public shell/footer/header

The next strongest product move is not to keep expanding homepage content. It is to give the `Events` route a proper public discovery experience.

Why:

- events are usually the clearest next public action
- the nav item already exists in the public shell
- admins can already guide users toward `/events` from homepage sections like `InfoSection` or `CTASection`
- a route-first events journey prevents the homepage from becoming overloaded

## Locked Product Direction

### The homepage is not the main event-discovery surface

The homepage may later include a small event preview, but that is not the focus of this slice.

The canonical discovery surface for events should be:

- `/{hubSlug}/events`

### Events and courses do not share one listing section

Events and courses should share lower-level primitives and design-system contracts, but they should not share a single domain-level listing section.

Why:

- event metadata priorities differ from course metadata priorities
- event browsing intent differs from course evaluation intent
- forcing one shared listing surface too early would create an over-generalized component

Recommended architectural boundary:

- shared primitives:
  - `SectionShell`
  - `SectionContainer`
  - `SectionHeader` where appropriate
  - `SectionCard`
  - `SectionItemsGrid`
  - `SectionSearchFilters`
- domain-specific route sections:
  - `EventsListingSection`
  - `EventDetailsSection`

## Public Events Journey

The public events journey should be understood as a structured sequence:

1. homepage orientation
2. `/events` discovery route
3. `/events/[eventSlug]` detail route
4. registration action / booking understanding

### 1. Homepage orientation

The homepage should:

- explain what the community is about
- build trust
- guide users toward the right next route

It should not attempt to carry the full event-discovery burden.

### 2. Events discovery route

Route:

- `/{hubSlug}/events`

This route should:

- serve as the main public discovery surface for events
- help users browse multiple upcoming opportunities
- support scanning and filtering
- move users from curiosity to specific event selection

### 3. Event detail route

Route:

- `/{hubSlug}/events/[eventSlug]`

This route should:

- clarify what the event is
- support a decision to register
- surface timing, location, and price clearly
- make the next step calm and obvious

### 4. Registration layer

Registration guidance should sit naturally after the detail page is clear.

The route should later support:

- registration state
- eligibility clarity
- booking guidance
- “what happens next” support

This is where a later `GridSection` `step` variant may become useful. It is not required for `/events` v1.

## Route Architecture

### `/events`

Primary route surfaces:

- `HeroSection`
- `EventsListingSection`

The route should not use the older public page-header pattern.

The route should feel like a real public discovery page, not a static marketing page and not an admin-derived listing.

### `/events/[eventSlug]`

Primary route surface:

- `EventDetailsSection`

This document focuses mainly on `/{hubSlug}/events`, but the route architecture should still anticipate the detail route as the next step in the same journey.

## Locked Direction For `/{hubSlug}/events`

### High-level route layout

The `/events` route should be composed as:

1. `HeroSection`
2. `EventsListingSection`

The `EventsListingSection` should internally own:

- `SectionShell`
- `SectionContainer`
- `SectionSearchFilters`
- system-driven results/context line
- event cards grid
- empty state

### Why no `SectionHeader` inside `EventsListingSection`

We explicitly do **not** want to introduce another admin-authored or content-authored section intro between the route hero and the listing controls.

Reasons:

- the route hero already introduces the page
- another header block would add visual repetition
- another header block would create unnecessary content-management burden
- the listing route should feel like a discovery surface, not a stacked marketing page

So `EventsListingSection` should not render a full `SectionHeader` in v1.

Instead, the route should use:

- a route-level `HeroSection`
- `SectionShell`
- `SectionContainer`
- `SectionSearchFilters`
- a subtle system-driven results/context line around the controls area

## `HeroSection` Role On `/events`

The `/events` hero should:

- establish route identity
- provide calm orientation
- avoid overloading the page with marketing actions

The hero should not attempt to duplicate listing information.

Recommended hero behavior:

- use system-driven content in v1
- no additional admin-authored copy required
- no large multi-action button cluster required

The hero can remain modest and route-focused.

Examples of the kind of role it should play:

- title that frames the route as upcoming opportunities
- short supportive line about browsing workshops, meetups, and community events

The hero must remain token-driven and template-aware, exactly like the rest of the section system.

## `EventsListingSection` Responsibilities

`EventsListingSection` should own:

- `SectionShell`
- `SectionContainer`
- search/filter controls
- filtered results presentation
- event cards grid
- empty state when no public events exist
- empty state when filters/search return no matches

It should not own:

- route hero behavior
- homepage-preview concerns
- event detail layout
- registration detail

This keeps the route architecture clean and prevents listing concerns from leaking into other route layers.

## `SectionSearchFilters` Primitive

### Purpose

Introduce a new neutral primitive:

- `SectionSearchFilters`

This primitive should support route-level discovery surfaces without being event-specific.

It is intentionally named neutrally because it should be reusable later for:

- courses
- possibly FAQs
- future public discovery/listing surfaces

### V1 responsibilities

For the events route, `SectionSearchFilters` should support:

- search input
- category filtering

It should not support in v1:

- date pickers
- price filters
- availability filters
- sort menus
- advanced multi-filter logic

We are intentionally keeping v1 narrow.

### Interaction direction

The interaction reference may borrow from the admin `/admin/payments` search/filter behavior structurally, but the public implementation must not inherit admin styling.

The public primitive must instead be:

- token-driven
- template-aware
- calmer
- brand-aligned
- visually appropriate for the public site

## System-Driven Context Line

Because we are not rendering a `SectionHeader` inside the listing section, the route still needs a small amount of orientation within the controls area.

That orientation should be system-driven.

Examples of acceptable responsibilities:

- show total result count
- show the current filter context
- show search state context

Examples of the type of copy this layer may support:

- `12 upcoming events`
- `Showing all events`
- `Showing workshops`
- `3 results for "wellbeing"`

This should be subtle and operational, not marketing-heavy.

It should be treated as discovery context, not authored content.

## Listing Card Direction

### Locked decision

`EventsListingSection` should use cards in v1.

This is the right choice because cards:

- support scanning multiple events naturally
- work well across desktop and mobile
- align with the shared public card system
- provide enough structure for media and event metadata without forcing a denser list layout too early

### Entire card should be clickable

The whole event card should act as the click target to the detail route.

Why:

- repeated CTA buttons on every card would be noisy
- the listing should feel clean and browseable
- a whole-card click target is the better public-site interaction here

We may later add subtle affordances such as:

- hover elevation
- title treatment on hover
- quiet trailing affordance if necessary

But v1 should avoid a repeated internal button per card.

## Event Card Content Contract

### Locked v1 card anatomy

Each event card should contain, in order:

1. media
2. title
3. clamped description
4. date and time
5. location
6. price / free state

### Media

Media should appear at the top of the card.

Requirements:

- if event media exists, render it
- if event media does not exist, render a placeholder fallback
- cards must still feel intentional and balanced without uploaded media

The placeholder must:

- align with the token/template-driven design system
- avoid looking like a broken/missing asset state
- feel like a deliberate public-site fallback

### Title

The event title should be visually dominant within the card body.

It should remain easy to scan when cards are viewed in a grid.

### Description

Description should be included in v1, but clamped.

Guidance:

- use a short summary/description excerpt
- clamp to a bounded number of lines
- avoid letting long descriptions make the grid visually unstable
- if there is no useful summary, the card should still work without filler content

### Date and time

Date and time are essential and should appear clearly in the card body.

Examples of the intended format direction:

- `22 Apr, 10:00`
- `22-24 Apr, 10:00-16:00`

The final formatting implementation should follow the platform’s existing date/time utilities where appropriate, but the visual presentation should be intentionally public-facing.

### Location

Location should be included.

This is important for decision-making and helps users quickly judge relevance.

### Price / Free

Price or free state should be included.

This is a high-value piece of browse information and belongs in the listing card.

### Explicit exclusions for v1 card

We are deliberately **not** including these in the initial card:

- raw capacity display
- `Spaces left`
- repeated CTA button

Why:

- they increase noise
- they can make the card feel more like an operational record than a public browse surface
- capacity/availability treatment needs stronger product confidence before it is surfaced broadly

## Card Layout Primitive Expectations

The event cards should be built using the shared public-site primitives and design-system contracts.

Expected base pieces:

- `SectionShell`
- `SectionContainer`
- `SectionCard`
- `SectionItemsGrid`
- shared semantic card tokens
- shared media tokens

The listing should not introduce a new bespoke card shell outside that system.

## Grid Layout Direction

### Desired layout

The preferred direction discussed was:

- desktop: 4 columns
- tablet: 2 columns
- mobile: 1 column

### Locked engineering constraint

We do **not** want to distort `SectionItemsGrid` just to satisfy a single route preference if the primitive is currently more bounded by design.

So the locked rule is:

- if `SectionItemsGrid` already supports a sound 4-column contract cleanly, we may use it
- if not, do **not** force a one-off primitive change for the events route
- in that case, preserve the existing primitive contract and use the current shared behavior instead

This protects the design system from route-specific drift.

### Current pragmatic recommendation

If no clean 4-column primitive contract exists, the acceptable v1 layout remains:

- desktop: 3 columns
- tablet: 2 columns
- mobile: 1 column

This is still strong and should not be treated as a compromise that justifies weakening the primitive boundary.

## Search And Filtering Scope

### Locked v1 filter model

For v1, filtering should be limited to category only.

Examples:

- `All`
- `Class / Training`
- `Workshop`
- `Meet up`
- `Social / Gathering`
- `Competition / Match`
- `Outreach / Community Service`
- `Special Event`

The filtering interaction should use the new neutral `SectionSearchFilters` primitive with:

- a compact filter icon trigger
- a small menu/popover style category list

We are explicitly not using visible chip rows, pill groups, or segmented category controls in v1.

Why:

- the category set is expected to grow
- a visible row of categories will not scale as cleanly
- the route should preserve a calmer, more compact discovery-controls area

### Search scope

Search should remain simple and useful.

Reasonable v1 search targets:

- title
- summary/description excerpt
- location

We should avoid feature creep here. The goal is to make the route meaningfully browseable, not to build a full discovery engine in the first pass.

## Empty-State Direction

`EventsListingSection` must support at least two empty-state modes:

1. no public events exist
2. events exist, but the current filter/search returns no matches

These states should be:

- calm
- public-facing
- token-driven
- consistent with the current public design system

They should not feel like admin empty states.

## Data And Ordering Principles

The route should respect the existing public event data model.

Do not create a second public-route-only ordering system unless a real business need appears.

Prefer:

- existing publication rules
- existing upcoming/public event ordering
- existing category assignment if categories exist in the event model
- existing registration eligibility model where needed later

This keeps admin expectations aligned with the operational model they already manage.

## Token And Template Design-System Expectations

Everything in the events route must reinforce the public token/template system.

That includes:

- hero spacing and surface treatment
- search/filter control styling
- card radius
- card surface
- card shadow/elevation
- media radius/treatment
- listing gaps
- typography hierarchy
- hover/focus states
- placeholder media treatment

The route must not fall back into:

- local one-off styling values
- route-specific visual hacks
- admin-surface styling patterns
- hardcoded colors or radii

The new events route should clearly read as part of the same public-site system as:

- homepage sections
- public shell/header/footer
- current token/template architecture

## Implementation Sequence For `/events`

1. lock this route plan
2. lock the `SectionSearchFilters` primitive plan
3. define the `EventsListingSection` implementation plan if further component-level detail is needed
4. build `SectionSearchFilters`
5. build `EventsListingSection`
6. implement the new `/events` route composition with:
   - `HeroSection`
   - `EventsListingSection`
7. validate layout, search/filter behavior, empty states, and token/template compliance

## Follow-On Relationship To `/events/[eventSlug]`

Once `/events` is strong, the next route slice should be:

- `EventDetailsSection`

That route should then connect cleanly with the listing cards users are already clicking.

The listing route should not try to absorb event-detail concerns prematurely.

## Open Questions That Remain After This Lock

1. What is the exact hero copy contract for `/events` in v1 if it is fully system-driven?
2. How should category values be modeled and exposed if the event model currently has limited category structure?
3. Should placeholder media for missing event assets use one shared fallback or multiple template-sensitive treatments?
4. If `SectionItemsGrid` later evolves to support 4 columns, is that a general public-site need or only a route-listing need?

## Recommendation

Proceed with `/{hubSlug}/events` as a route composed from:

- `HeroSection`
- `EventsListingSection`

Within `EventsListingSection`, build:

- `SectionShell`
- `SectionContainer`
- `SectionSearchFilters`
- system-driven results/context line
- clickable event cards grid
- empty states

Lock the card content to:

- media with placeholder fallback
- title
- clamped description
- date and time
- location
- price / free state

And keep the whole route strictly aligned with the token/template-driven public design system.
