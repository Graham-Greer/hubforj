# CourseDetailsSection Plan

## Status

Proposed

## Purpose

Define the canonical public course detail surface for:

- `/{hubSlug}/courses/[courseSlug]`

This section should become the primary public course-detail experience for `hub-platform`, built on the current section/primitives system and aligned with the strengthened course domain model in:

- `docs/content-models/course-domain-model-refactor-plan.md`

This document is intentionally detailed so implementation can proceed without re-deciding layout, metadata, CTA behavior, or primitive boundaries mid-build.

## Role In The Route

`CourseDetailsSection` is the main content and conversion surface on the public course detail route.

It should:

- present the course clearly
- help the learner understand commitment, delivery, and enrolment conditions
- make the enrolment next step obvious
- keep conversion context visible without overwhelming the reading experience

Like the event detail route, this route should not lead with a separate `HeroSection` in v1.

## Locked Route Direction

### No separate `HeroSection`

The course detail route should not use a route hero in v1.

Reason:

- the course record already supplies the leading content the user needs:
  - media
  - title
  - summary
  - delivery/schedule facts
  - enrolment/payment context
- a separate hero would risk repeating the same content
- a separate hero would make the route feel overly stacked
- the page should feel editorial and decision-focused, not like a marketing landing page

### Route composition

The route should be composed as:

1. `CourseDetailsSection`

The media should not sit outside the section as a separate route block.

Instead, `CourseDetailsSection` itself should own:

- the full-width media lead at the top of the section
- the article layout beneath it

This keeps the route aligned with the section system and ensures the media remains governed by:

- `SectionShell`
- `SectionContainer`

## Structural Ownership

`CourseDetailsSection` should internally own:

- `SectionShell`
- `SectionContainer`
- top media lead
- `SectionArticleLayout`
- primary course content column
- sticky enrolment/CTA aside on larger screens
- collapsed CTA flow on smaller screens

It should not own:

- a separate route hero
- public course listing/search behavior
- admin editing behavior
- route-level promotional blocks unrelated to the course record

## Why This Is A Section And Not A One-Off Page Block

Although this is a route detail surface, it should still be implemented as a section-level pattern because:

- it must follow the current public section spacing and width contracts
- it should stay token-driven and template-aware
- it should build on reusable structural primitives
- the article/aside layout is already useful beyond one course route

This should be a domain-specific route section built on shared public primitives, not a bespoke page-local layout.

## High-Level Page Structure

`CourseDetailsSection` should internally be composed as:

1. one-column media lead
2. two-column article layout

### 1. Media lead

The course media should appear first inside `CourseDetailsSection`, spanning the section content width as a single column above the article layout.

Requirements:

- full-width within the public content container rhythm
- intentional aspect ratio
- should work whether real media exists or a fallback is required
- should align with the template-driven design system

This media lead replaces the need for a separate hero surface while still remaining part of the section itself.

### 2. Detail layout beneath media

Beneath the media, the page should shift into a two-column article layout:

- left / main column:
  - course type label
  - course level cue
  - title
  - summary
  - metadata group
  - structured rich-text description
  - optional access instructions section
- right / aside column:
  - enrolment card
  - enrolment heading
  - reinforced pricing / availability facts
  - CTA button

## Shared Primitive Direction

`CourseDetailsSection` should reuse:

- `SectionArticleLayout`
- `SectionRichText`
- shared public card/surface primitives where appropriate

It should not invent a course-only page skeleton when the required article/aside primitive already exists.

## Content Order

The locked content order inside `CourseDetailsSection` should be:

1. media lead
2. article layout
3. main column:
   - course type / subtype label
   - course level cue
   - course title
   - course summary
   - metadata group
   - structured rich-text description
   - access instructions, if present
4. aside column:
   - enrolment card

So the section behaves as:

- one-column media
- then two-column content

## Course Type, Level, Title, And Summary

### Course type label

The first textual indicator in the main column should be the course type label.

Display rule:

- `subtypeLabel` when present
- otherwise a presentational label derived from `courseType`

This should behave like a light contextual eyebrow rather than a competing heading.

### Course level cue

The course level should appear as a second compact contextual cue near the type label.

Display rule:

- `customLevelLabel` when present and `courseLevel = custom`
- otherwise a presentational label derived from `courseLevel`

Examples:

- `Beginner`
- `Intermediate`
- `Advanced`
- `All levels`
- `Black belt`

This level cue should help learners assess fit quickly without turning the top of the page into a dense badge cluster.

### Title

The course title is the primary heading in the main column.

It should be:

- prominent
- visually subordinate to the media lead rather than fighting it
- token-driven and template-aware

### Summary

The summary is the short-form supporting paragraph directly beneath the title.

It should:

- stay concise
- reinforce what the course is about
- bridge from the course identity into schedule/delivery facts and the fuller description

This summary should come from the dedicated summary field rather than the rich-text body.

## Metadata Group

The metadata group should appear beneath the summary in the main column.

This group is especially important for courses because users need to understand:

- when it happens
- how it is delivered
- what sort of commitment it implies

### Locked metadata priorities

The main column metadata should prioritize:

- schedule
- delivery
- timezone
- optional session count

### Metadata display rules

#### Schedule

The schedule row should use the canonical course scheduling fields:

- `startDate`
- `endDate`
- `startTime`
- `endTime`

It should be formatted in the same spirit as the updated event scheduling rules:

- single-day with time range when present
- date range when multi-day
- time shown only when actually provided

The schedule row should not expose raw `startAt` / `endAt` formatting.

#### Delivery

The delivery row should use the locked delivery-slot rule from `CoursesListingSection`.

That means:

- if `format = in-person`, show `location`
- if `format = online`, show `Online`
- if `format = hybrid`, show `Hybrid`

This keeps the detail surface aligned with the browse-card mental model.

If a hybrid course also has a meaningful location, that fuller nuance can appear later in the page if needed, but the primary metadata row should still use the simple `Hybrid` label.

#### Timezone

Timezone should appear as its own metadata row when:

- a timezone exists
- and it adds real interpretive value to the schedule

For online and hybrid courses, timezone is especially important.

For in-person courses, timezone may still be shown for consistency, but it should remain visually secondary.

#### Session count

`sessionCount` should be treated as supporting metadata, not the primary schedule model.

If shown in the main metadata group, it should be:

- secondary
- brief
- useful for learner commitment scanning

It should not displace schedule or delivery.

### Metadata grouping guidance

Recommended grouping in the main column:

- row/group 1:
  - schedule
- row/group 2:
  - delivery
- row/group 3:
  - timezone
  - optional session count

Locked clarification:

- `price/free` should not sit in the main metadata group
- `spaces left` should not sit in the main metadata group
- registration-window facts should not crowd the main metadata group in v1

Those facts belong in the enrolment card because they are strongest when paired directly with the CTA.

## Description

The main body content should come from the structured rich-text course description.

It should be rendered through:

- `SectionRichText`

The body should support:

- paragraphs
- unordered lists

This body is editorial and explanatory, not operational.

It should sit beneath the summary and metadata in the main column.

## Access Instructions

`accessInstructions` should be treated as a secondary but important course-detail block when present.

Examples:

- parking guidance
- what to bring
- access requirements
- arrival notes
- online joining expectations

### Placement

This content should appear beneath the main description in the primary column.

### Presentation

It should be presented as a distinct subsection rather than merged indistinguishably into the main description.

Recommended treatment:

- small subsection heading such as `What to know before attending`
- `SectionRichText` body beneath it

Reason:

- these instructions are operationally important
- they deserve more clarity than simply appending them to the descriptive body
- separating them improves scanability and trust

## Enrolment Aside

### Role

The aside exists to convert intent into action without interrupting reading.

It should contain:

- a heading such as `Enrol on this course`
- a compact supporting facts area
- CTA button

It should feel like:

- a decision card
- not an advert
- not a dense admin summary

### Supporting facts in the aside

The aside should reinforce the facts most relevant to conversion:

- price/free
- spaces left / remaining availability

These should appear adjacent to the CTA region rather than buried below it.

Locked clarification:

- `price/free` and `spaces left` should sit together in the aside card
- they should not use verbose labels if the raw values are already clear

Examples of the intended data style:

- `Free`
- `£45.00`
- `6 spaces left`
- `Sold out`
- `Waitlist available`

### Registration-window support

If registration windows are active, the aside may also need to reflect:

- registration not yet open
- registration closed

These states are more important to the action area than to the reading column.

So registration-window messaging belongs in the aside state logic, not the main metadata group.

### What should not go in the aside

The aside should not become a dumping ground for every operational field.

Do not include in the default aside:

- raw visibility labels
- eligibility policy prose
- timezone
- long access instructions
- online meeting links
- admin-facing internal states

## CTA State Model

The course CTA should be auth-aware and course-state-aware in the same spirit as the event detail route, but course-specific in wording and lifecycle.

### Core CTA states

Expected v1 states include:

- signed out and publicly viewable:
  - `Sign in to enrol`
- signed-in member and course available:
  - `Enrol now`
- signed-in member and capacity full with waitlist enabled:
  - `Join waitlist`
- signed-in member and sold out with waitlist disabled:
  - `Sold out`
- signed-in member already enrolled:
  - `View your enrolment`
- signed-in member already waitlisted:
  - `View your enrolment`

Additional state handling likely needed:

- registration not open yet
- registration closed

### Language rule

This route should use course-specific language:

- `Enrol`
- `Enrolment`
- `Join waitlist`

It should not reuse event booking language like:

- `Book now`
- `Register for this event`

## Sticky Aside Behavior

### Larger screens

On larger screens, the enrolment aside should support sticky behavior.

It should remain visible as the user scrolls the main content once it approaches the header offset.

This should be implemented through the shared article-layout primitive and token-aware spacing rules rather than route-local hacks.

### Smaller screens

On smaller screens, the aside should collapse back into normal document flow.

Locked v1 decision:

- do not introduce a sticky mobile bottom CTA bar in the first implementation

Reason:

- it adds significant interaction and viewport complexity
- it can easily become intrusive
- the normal flow CTA is sufficient for v1 if the layout remains clean and readable

This can be revisited later if product behavior proves it necessary.

## Online Meeting Link Handling

The public detail route should not expose the raw `onlineMeetingLink` openly in the v1 detail page.

Reason:

- it is typically access-controlled operational information
- it is more appropriate for confirmed learners or authenticated follow-up flows
- exposing it publicly weakens the enrolment boundary

So the public detail page should communicate:

- that the course is online

without directly revealing the meeting URL.

## Visibility Implications

The course detail route must respect the strengthened course visibility model.

At minimum, signed-out users should only receive publicly viewable courses.

This route must not rely on explanatory copy in the CTA card to compensate for visibility leakage.

Data access rules should do the real enforcement.

## Empty / Fallback Scenarios

`CourseDetailsSection` must support sensible fallback behavior when:

- media is absent
- summary is absent or thin
- access instructions are absent
- session count is absent
- timezone is absent

The section should degrade gracefully without inventing filler UI.

General rule:

- if a block is not meaningful, omit it cleanly

Do not render placeholder labels for missing information.

## Primitive And Design-System Requirements

`CourseDetailsSection` must remain aligned with the current section and primitive system.

That means:

- layout should be driven through `SectionShell`, `SectionContainer`, and `SectionArticleLayout`
- rich text should render through `SectionRichText`
- surfaces should use existing shared tokens and public primitives where possible
- spacing, typography, radius, borders, and shadows must remain token-driven

This should not become a one-off page design that sidesteps the template-aware system.

## What This Section Must Not Do

`CourseDetailsSection` should not:

- invent its own search/filter behavior
- introduce a second hero system
- expose admin-only operational detail
- mix enrolment management UI into the public reading column
- overload the aside with every possible course field
- drift away from the shared section/primitives architecture

## Locked v1 Implementation Direction

The locked v1 structure is:

1. `CourseDetailsSection`
2. media lead inside the section
3. `SectionArticleLayout` beneath it
4. main column:
   - type/subtype label
   - title
   - summary
   - schedule metadata
   - delivery metadata
   - timezone / optional session count metadata
   - rich description
   - access instructions subsection when present
5. aside column:
   - enrolment heading
   - price/free
   - spaces left / waitlist / sold-out summary
   - CTA state appropriate to auth and course availability

This should give the learner:

- immediate orientation
- clear understanding of the course
- a clean decision path
- a CTA that remains visible and contextually reinforced

## Follow-On Planning / Implementation Notes

This detail section will likely require:

- public course detail data helpers equivalent in spirit to the event detail helpers
- course-specific public CTA state derivation
- course-specific schedule formatting helpers
- enrolment availability derivation that respects:
  - capacity
  - waitlist rules
  - registration open/close dates
  - current learner enrolment state

These should be implemented at the data/domain layer rather than invented inside the section component.
