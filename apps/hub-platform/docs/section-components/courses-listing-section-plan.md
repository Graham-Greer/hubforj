# CoursesListingSection Plan

## Status

Proposed

## Purpose

Define the canonical listing surface for the public courses route:

- `/{hubSlug}/courses`

This component should become the canonical SaaS course-discovery section for the public site, built on the current section/primitives system and aligned with the strengthened course domain model in:

- `docs/content-models/course-domain-model-refactor-plan.md`

This document is intentionally detailed so implementation can proceed without re-deciding the same structural, UX, and design-system questions mid-build.

## Role In The Route

`CoursesListingSection` is the main discovery surface on the `/courses` route.

It should sit beneath a route-level hero in the same way the events listing route does.

The route composition should be:

1. `HeroSection`
2. `CoursesListingSection`

This section should not try to absorb the route hero role and should not behave like a homepage promo section.

## Structural Ownership

`CoursesListingSection` should internally own:

- `SectionShell`
- `SectionContainer`
- `SectionSearchFilters`
- system-driven results/context line
- course cards grid
- empty states

It should not own:

- route hero behavior
- course detail behavior
- enrolment detail behavior
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

`CoursesListingSection` should **not** render a `SectionHeader` in v1.

Reason:

- the route hero should already introduce the page
- another header block would create visual repetition
- another header block would add unnecessary content-management pressure
- this is a browse/discovery surface, not a stacked marketing section

Any context needed at the top of the listing should instead come from:

- `SectionSearchFilters`
- the subtle system-driven results/context line

## Data Contract

`CoursesListingSection` should receive a normalized set of public course records suitable for public listing.

At minimum, each course item should expose what the listing card needs:

- `id`
- `slug`
- `title`
- `summary`
- `courseType`
- `subtypeLabel`
- `courseLevel`
- `customLevelLabel`
- `format`
- `location`
- `startDate`
- `endDate`
- `startTime`
- `endTime`
- `startAt`
- `endAt`
- `pricingMode`
- `price`
- `currency`
- `capacity`
- waitlist/availability information if already derived
- image/media fields if present

The section should not be responsible for inventing missing core course data.

## Search And Filter Inputs

The section should own the actual search/filter state and result derivation.

It should pass the control UI responsibilities into:

- `SectionSearchFilters`

### Search scope

Locked v1 direction:

- search should be simple and useful

Reasonable fields to search:

- title
- summary
- subtype label
- course type
- custom level label
- location

Do not search rich description in v1 unless we deliberately want very broad result matching.

Reason:

- listing search should feel precise and predictable
- long-form rich description is too noisy a source for first-pass browse search

### Filter scope

Locked v1 direction:

- course type only

Reason:

- `courseType` is the clearest first discovery axis
- it is stable and intentional
- it aligns with the strengthened course model

Do not introduce multiple simultaneous filter dimensions in v1 unless we prove the browse experience needs them.

Possible later filters:

- format
- pricing
- availability

But those should not be front-loaded into the first listing implementation.

## Course Type Handling

The type set should come from the course model rather than route-local hardcoded labels.

The course admin flow now treats `courseType` as required, which is the correct direction for reliable filtering and clear browse organization.

The section should therefore:

- trust course type as a real field
- expose type filtering via `SectionSearchFilters`
- keep the course-type logic at the listing level, not the primitive level

### Display rule for type on the card

The card should display:

- `subtypeLabel` when present
- otherwise `courseType`

This gives us:

- internal consistency in the data model
- flexible public-facing labeling
- reliable filtering while still allowing clearer course branding

## Results/Context Line

Because the section does not render a `SectionHeader`, it still needs a small amount of operational orientation within the listing area.

That should be system-driven.

Examples of the kinds of states the section may produce:

- `8 upcoming courses`
- `Showing all courses`
- `Showing programmes`
- `3 results for "leadership"`

This line should be:

- compact
- secondary in hierarchy
- token-driven
- not content-authored

## Course Level Handling

Course level is a separate concept from course type.

It answers:

- how advanced the course is
- who it is appropriate for

It should not be collapsed into:

- `courseType`
- `subtypeLabel`

### Display rule for level on the card

The card should display a secondary course-level cue using:

- `customLevelLabel` when present and `courseLevel = custom`
- otherwise the presentational label for `courseLevel`

Examples:

- `Beginner`
- `Intermediate`
- `Advanced`
- `All levels`
- `Black belt`

This level cue should remain visually secondary to:

- the title
- the summary
- the primary metadata rows

But it is still useful in listing because it helps users quickly decide whether a course is appropriate for them.

## Empty-State Requirements

`CoursesListingSection` must support two distinct empty-state modes:

### 1. No public courses exist

This state should communicate something like:

- there are currently no courses available

The tone should remain public-facing and calm.

This state is about the data source itself being empty.

### 2. Filters/search return no matches

This state should communicate:

- courses do exist
- but the current search/filter combination returned no results

This state should feel different from the “no public courses exist” case.

The section should not collapse both situations into one generic empty message.

## Listing Card Direction

### Locked card model

The listing should use cards in v1.

The cards should be:

- fully clickable
- route-linked to `/{hubSlug}/courses/[courseSlug]`
- built from the shared public card system

### No repeated CTA button

The whole card acts as the click target.

Therefore:

- do not add a repeated enrolment button inside each card in v1

This avoids visual noise and keeps the listing cleaner.

## Course Card Content Contract

Each card should contain, in order:

1. media
2. course type/subtype label
3. course level cue
4. title
5. clamped summary
6. date and time
7. delivery slot
8. price / free state
9. spaces left / availability state

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

This should follow the same media-fallback discipline established for event cards.

### Type / subtype label

This should appear as a compact eyebrow or kicker above the course title.

Display rule:

- `subtypeLabel` when present
- otherwise `courseType`

Reason:

- this gives scan value immediately
- it improves browse quality
- it helps courses feel more structured than generic content cards

### Course level cue

This should appear as a compact secondary cue near the type/subtype label rather than as a heavy metadata row.

Reason:

- it helps learners self-qualify quickly
- it is useful identity/supporting information
- it should not compete with the main schedule / delivery / price / availability rows

### Title

The title is the primary text element in the card body.

### Summary

The summary should be:

- plain text only
- clamped
- intentionally shorter than the detail-page body

The card should never attempt to render the full rich description.

If summary is unexpectedly absent in older data, a transitional fallback may derive plain text from rich body content, but that should be treated as compatibility support rather than the intended steady-state contract.

## Date And Time Row

The date/time line should show the primary course schedule summary for browse purposes.

It should use the strengthened course schedule formatting rules rather than legacy `scheduleSummary`.

Requirements:

- single-day and multi-day courses should format cleanly
- optional time ranges should be supported
- the value should feel scannable, not verbose

This should be a single metadata row, not a detailed timetable.

## Delivery Slot Rule

This is a locked decision.

The card should use one consistent delivery metadata slot, but the displayed value should adapt by course format.

Display rules:

- if `format = in-person`
  - show the location value
- if `format = online`
  - show `Online`
- if `format = hybrid`
  - show `Hybrid`

Reason:

- card structure stays consistent
- in-person cards show the more useful real-world information
- online and hybrid cards still communicate delivery clearly

The slot should not redundantly display `In person` when the venue is the more useful browse signal.

## Price Row

The card should show:

- `Free`
- or the formatted paid price

This should use the shared course price formatting rules.

Do not show deposit/payment deadline in the listing card.

Reason:

- those are operational details better suited to the detail page
- they would overload the listing surface

## Availability Row

The card should show one enrolment availability line.

Preferred v1 output:

- `Open enrolment`
- `12 spaces left`
- `Waitlist only`
- `Sold out`

Reason:

- this is more decision-driving than session count on the card
- it helps users understand whether the course is realistically available

If the availability layer is not fully implemented at the moment the listing section lands, the fallback can temporarily show capacity, but the intended contract should be availability-oriented.

## What Should Not Be On The Default Card

Do not include the following in the default v1 course card:

- visibility
- registration eligibility
- timezone
- registration window
- payment deadline
- deposit details
- access instructions
- full location + format duplication

These are too operational or too dense for first-pass browse cards.

## Session Count Decision

`sessionCount` should **not** be part of the default v1 standard card metadata set.

Reason:

- the card already needs to communicate title, summary, schedule, delivery, price, and availability
- session count is less decision-driving than availability
- the current course model still treats session count as transitional rather than a fully trusted canonical concept

If a future featured-course treatment needs more depth, session count can be reconsidered there.

## Featured Course Decision

Do **not** introduce featured-course treatment in v1 by default.

Reason:

- the course browse journey should first prove its standard card contract
- courses are already denser than events
- adding a featured treatment too early would create unnecessary layout complexity

This should stay simpler than the events listing initially.

## Grid Direction

The listing should align with the existing `SectionItemsGrid` direction rather than inventing a course-specific grid contract.

Locked layout direction:

- desktop: 3 columns
- tablet: 2 columns
- mobile: 1 column

Single-item handling should remain consistent with the bounded single-card treatment already introduced for the public grid system.

## Primitive Usage

`CoursesListingSection` should be built from the existing public section stack wherever possible:

- `SectionShell`
- `SectionContainer`
- `SectionSearchFilters`
- `SectionItemsGrid`
- `SectionCard`
- `SectionCardMedia`
- `SectionCardBody`

It should not introduce ad-hoc route-local layout primitives unless the card contract genuinely requires something new.

## Theming And Token Requirements

This section must remain:

- token-aware
- template-aware
- consistent with the broader public section system

Requirements:

- card styling must use the shared section-card semantic contract
- media and body spacing must come through the established card/media/body primitives
- search/filter controls must continue using the section-search-filters token contract
- route-local hardcoded visual values should be avoided

The listing should feel like a true member of the public section family, not a custom page block.

## Accessibility Requirements

The listing should support:

- fully clickable cards with correct link semantics
- searchable/filterable controls that remain keyboard reachable
- clear empty-state messaging
- readable metadata hierarchy

The type label, title, summary, and metadata should remain understandable in a sensible reading order.

## Implementation Guardrails

Do not let the course listing drift into:

- an event-list clone with renamed labels
- an overloaded operational dashboard card
- a one-off route layout outside the section system
- a card that tries to preview the full course detail experience

The listing card should help users answer:

- what is this course
- is it right for my level
- when does it happen
- how is it delivered
- what does it cost
- can I realistically still join

That is the correct browse-level information boundary.

## Recommended Next Step After This Doc

Once this plan is accepted, the next step should be:

1. plan `CourseDetailsSection`
2. then implement the public course data helper layer needed to support both:
   - listing availability/delivery formatting
   - detail-page enrolment/CTA behavior

That keeps the public course journey moving in the same disciplined sequence used for events.
