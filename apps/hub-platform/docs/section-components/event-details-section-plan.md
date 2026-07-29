# EventDetailsSection Plan

## Status

Proposed

## Purpose

Define the canonical public event detail surface for:

- `/{hubSlug}/events/[eventSlug]`

This section should become the first true SaaS public event-detail section for `hub-platform`, built on the current section/primitives system and aligned with the route-level events journey.

This document is intentionally detailed so implementation can proceed without re-deciding layout, metadata, CTA behavior, or primitive boundaries mid-build.

## Role In The Route

`EventDetailsSection` is the main content and conversion surface on the public event detail route.

It should:

- present the event clearly
- support reading and orientation
- make the booking next step obvious
- keep booking context visible without overpowering the content

Unlike the `/events` route, this detail route should not lead with a separate `HeroSection`.

## Locked Route Direction

### No separate `HeroSection`

The event detail route should not use a route hero in v1.

Reason:

- the event record already supplies the essential leading content:
  - media
  - title
  - summary
  - metadata
- a separate hero would risk repeating the same content
- a separate hero would make the page feel top-heavy and overly stacked
- the route should feel editorial and decision-focused, not like a marketing landing page

### Route composition

The route should be composed as:

1. `EventDetailsSection`

The media should not sit outside the section as a separate route block.

Instead, `EventDetailsSection` itself should own:

- the full-width media lead at the top of the section
- the article layout beneath it

This keeps the route aligned with the section system and ensures the media remains governed by:

- `SectionShell`
- `SectionContainer`

## Structural Ownership

`EventDetailsSection` should internally own:

- `SectionShell`
- `SectionContainer`
- top media lead
- new article-style two-column layout primitive
- primary event content column
- sticky booking/CTA aside on larger screens
- collapsed CTA flow on smaller screens

It should not own:

- a separate route hero
- listing behavior
- route-level search/filter concerns

## Why This Is A Section And Not A One-Off Page Block

Although this is a route detail surface, it should still be implemented as a section-level pattern because:

- it must follow the current public section spacing and width contracts
- it should remain token-driven and template-aware
- it should build on reusable structural primitives
- the article/aside layout is likely reusable beyond events

This should be a domain-specific route section built on shared public primitives, not a bespoke page-local layout.

## High-Level Page Structure

`EventDetailsSection` should internally be composed as:

1. one-column media lead
2. two-column article layout

### 1. Media lead

The event media should appear first inside `EventDetailsSection`, spanning the section content width as a single column above the article layout.

Requirements:

- full-width within the public content container rhythm
- intentional aspect ratio
- should work whether real media exists or a fallback is required
- should align with the template-driven design system

This media lead replaces the need for a separate hero surface while still remaining part of the section itself.

### 2. Detail layout beneath media

Beneath the media, the detail page should shift into a two-column article layout:

- left / main column:
  - title
  - summary
  - metadata group
  - structured rich-text description
- right / aside column:
  - booking card
  - booking heading
  - reinforced pricing / capacity facts
  - CTA button

## Proposed New Primitive

### `SectionArticleLayout`

This route likely warrants a new structural primitive:

- `SectionArticleLayout`

This primitive should remain neutral and reusable rather than event-named.

Responsibilities:

- provide a main content column
- provide an aside column
- support a sticky aside mode on larger screens
- collapse gracefully to one column on smaller screens
- remain token-driven and template-aware

It should not be event-specific.

Likely future reuse:

- event detail pages
- course detail pages
- richer editorial/public detail surfaces

## Content Order

The locked content order inside `EventDetailsSection` should be:

1. media lead
2. article layout
3. main column:
   - event title
   - event summary
   - metadata group
   - structured rich-text description
4. aside column:
   - booking card

So the section behaves as:

- one-column media
- then two-column content

## Title And Summary

### Title

The event title is the first textual element in the primary column.

It should be:

- prominent
- clearly subordinate to the media lead, not visually fighting it
- token-driven and template-aware

### Summary

The summary is the short-form supporting paragraph directly beneath the title.

It should:

- stay concise
- reinforce what the event is about
- bridge from title into the operational metadata and fuller description

This summary should come from the dedicated summary field rather than trying to repurpose the rich-text body.

## Metadata Group

The metadata group should appear beneath the summary in the main column.

Locked metadata priorities:

- location
- date/time

These should remain in the reading column because they help the user understand the event before deciding whether to book.

### Metadata layout

The metadata should be presented as a structured grouped set rather than loose text.

Recommended grouping in the main column:

- row/group 1:
  - location
- row/group 2:
  - date/time

Locked clarification:

- `price/free` should not sit in the main metadata group
- `spaces left` should not sit in the main metadata group

Those two facts belong in the booking card because they are strongest when paired directly with the CTA.

## Description

The main body content should come from the structured rich-text event description.

It should be rendered through:

- `SectionRichText`

The body should support:

- paragraphs
- unordered lists

This body is editorial and explanatory, not operational.

It should sit beneath the summary and metadata in the main column.

## Booking Aside

### Role

The aside exists to convert intent into action without interrupting reading.

It should contain:

- a heading such as `Register for this event`
- a compact supporting facts row with:
  - price/free
  - spaces left
- CTA button:
  - `Book now`

Optional later additions:

- eligibility note
- booking state
- sign-in / member-state messaging

These are not required for the first planning lock.

### Booking card internal layout

Inside the booking card, `price/free` and `spaces left` should sit to the left of the CTA button.

This is now the locked direction.

Why:

- it keeps the strongest booking facts next to the action
- it reduces ambiguity about whether those items belong in the reading column
- it keeps the card concise and decision-focused

### Sticky behavior on larger screens

On larger screens, the booking aside should become sticky once it reaches the page-header offset.

This is the preferred direction because:

- it keeps the next action visible as the user reads
- it avoids forcing the user to scroll back upward
- it matches the kind of editorial + conversion detail surface this route should become

Requirements:

- sticky behavior must respect the page header
- it must not overlap or clip other content
- it must remain token-driven and template-aware

## Mobile CTA Behavior

### Locked direction

The aside must collapse back into normal document flow on smaller screens.

This is non-negotiable for readability and layout stability.

### Sticky-on-mobile decision

We should explicitly **not** lock a sticky mobile CTA into v1 by default.

Reason:

- sticky mobile CTAs can easily reduce usable viewport space
- they can compete with reading, metadata, and media
- they can feel too aggressive if introduced before the booking journey is fully implemented

Recommended v1 mobile behavior:

- CTA card returns to normal document flow
- it remains visually clear and well sized
- it does not pin to the top or bottom of the viewport

Possible future enhancement:

- evaluate a sticky mobile CTA later if real user behavior shows it is needed

This keeps the initial detail page calmer and more defensible from a UX perspective.

## CTA Reinforcement Rules

The booking aside should reinforce the highest-value booking facts closest to the CTA:

- price / free
- spaces left

Those values should live inside the booking card itself rather than being repeated elsewhere.

Location and date/time remain in the main reading flow.

## Media Fallback

If an event has no media:

- the route must still render cleanly
- the media lead should use a deliberate fallback treatment
- the fallback should be template-aware and token-driven
- it must not look broken or empty by accident

This fallback should align with the existing public media fallback direction already used in event cards where possible.

## Sharing

A share primitive is desirable, but it should not block the first implementation of `EventDetailsSection`.

Recommended plan:

- note sharing as a follow-up primitive candidate
- likely names:
  - `SectionShareActions`
  - `ShareActions`
- do not make it a v1 blocker unless the route scope expands immediately

This keeps the first implementation focused on content clarity and booking UX.

## Primitive Dependencies

Expected current dependencies:

- `SectionShell`
- `SectionContainer`
- `SectionRichText`
- existing CTA/button primitives
- existing media handling primitives where applicable

Expected new dependency:

- `SectionArticleLayout`

## Design-System Requirements

Everything in this route must remain:

- token-driven
- template-aware
- aligned with the public section/primitives system

This includes:

- media sizing
- article-layout spacing
- sticky aside spacing
- booking card styling
- metadata typography
- title hierarchy

The route must not introduce ad-hoc page-local styling that bypasses the template system.

## Accessibility Requirements

The route should ensure:

- clear heading hierarchy
- readable metadata group structure
- CTA remains discoverable without being visually overwhelming
- sticky aside does not trap keyboard flow
- mobile collapse order remains logical and readable

## Empty/Fallback Considerations

The route should plan for missing or partial event data:

- no media
- no summary
- no price
- no capacity limit
- no location yet

The detail layout should remain calm and coherent even if some optional fields are missing.

## Out Of Scope For First Implementation

The following should not block the initial detail-page implementation:

- sticky mobile CTA
- share primitive implementation
- advanced booking state logic
- social proof or attendee avatars
- related events surfaces

These can be planned later once the core detail surface is in place.

## Implementation Sequence Recommendation

1. define `SectionArticleLayout`
2. implement `EventDetailsSection`
3. wire `/{hubSlug}/events/[eventSlug]` to the new section
4. evaluate whether sharing should enter the next slice
