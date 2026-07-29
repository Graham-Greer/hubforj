# Member Account V1 Proposal

## Status

Locked V1 planning proposal.

This document defines the recommended V1 member account experience for the hub platform. It is intended to guide product and implementation decisions before code changes begin.

Important rule:
- Current member account routes, current workspaces, and current UI are not the source of truth.
- Existing implementation should be treated as reusable input only.
- V1 should favor simplicity, clarity, speed to launch, low cognitive load, straightforward Stripe integration, and scalable-but-not-overbuilt architecture.

## Core Objective

Reduce the member account experience to the smallest set of high-value features that members actually need, while preserving a strong UX.

V1 should help members answer these questions quickly:
- Do I have an active membership?
- What am I booked onto?
- What have I paid for?
- How do I manage my basic account details?
- How do I cancel a booking if allowed?

## V1 Information Architecture

The recommended V1 account area should contain only these primary pages:

- Overview
- My Bookings
- Membership
- Billing
- Profile

This is the complete V1 structure. No other top-level member pages should be considered core to launch.

---

## 1. Overview

### Purpose

Overview is the account landing page. Its job is to orient the member immediately and surface the most important current account information without forcing them to navigate multiple routes.

### Content

Overview should contain:
- membership summary
- upcoming bookings summary
- recent payments summary
- quick links/actions

### Why it belongs in V1

This is the highest-value route because it gives members a fast answer to the most common account questions and reduces the need to hunt through separate pages.

### Defer until later

Do not turn Overview into a dense operational dashboard. Defer:
- deep analytics
- advanced progress reporting
- notification centers
- complex account alerts
- secondary admin-like controls

---

## 2. My Bookings

### Purpose

My Bookings is the member’s single place to review what they are booked onto and what action, if any, is required.

### Content

My Bookings should contain:
- event bookings
- course bookings
- status information
- payment information
- attendance information
- cancellation action when allowed

### Why it belongs in V1

For members, bookings are one of the core reasons the account exists. A unified bookings view reduces confusion and avoids forcing members to understand product-internal distinctions between events and courses.

### Defer until later

Defer:
- rescheduling
- transfer workflows
- detailed attendance history drilldowns
- sophisticated booking management workflows

---

## 3. Membership

### Purpose

Membership is the dedicated page for understanding the current membership relationship and any action directly related to it.

### Content

Membership should contain:
- current plan
- membership status
- renewal date
- price
- payment status if relevant
- manage/cancel action if applicable

### Why it belongs in V1

Membership is a distinct product relationship and should remain a dedicated route even if summary information also appears on Overview.

### Defer until later

Defer:
- benefit catalog presentation
- long-form membership benefits marketing content
- invoices/history on this page if Billing already covers them
- membership upgrades/downgrades unless already essential to launch

---

## 4. Billing

### Purpose

Billing should be the unified payment history surface for the member account.

### Content

Billing should contain all payment records for:
- memberships
- events
- courses

### Why it belongs in V1

Members should not have to infer where a payment record lives based on product type. One billing history surface is clearer, easier to learn, and simpler to support.

### Defer until later

Defer:
- failed payment recovery workflows beyond simple status visibility
- saved payment methods as a standalone area
- tax/invoicing complexity beyond simple receipts/invoices
- refund workflow orchestration

---

## 5. Profile

### Purpose

Profile is the member’s dedicated account details page.

### Content

Profile should contain:
- avatar
- full name
- email
- role
- account created date
- editable name
- editable avatar

### Why it belongs in V1

Members need a stable, predictable place to view and manage basic account identity. This should stay separate from the more operational parts of the account area.

### Defer until later

Defer:
- email editing
- security center
- notification preferences
- advanced identity and privacy tools

---

## Recommended V1 Overview Page

Overview should be a clean, card-based account landing page.

### Recommended layout

Priority order:

1. Account status summary
2. Upcoming bookings summary
3. Recent billing summary
4. Quick links/actions

This page should feel sparse and easy to scan, not like a workspace with many competing sections.

### Recommended cards/widgets

#### Membership summary card

Should contain:
- current plan name
- membership status badge
- renewal date
- payment status if relevant
- primary CTA:
  - `View membership`

Reason:
- membership state is a top-tier account question
- it is one of the first things a member needs confidence on

#### Upcoming bookings summary card

Should contain:
- count of upcoming bookings
- the next upcoming booking if one exists
- type badge
  - event or course
- date/time
- contextual CTA:
  - `View booking`
  - or `View event` / `View course`

Reason:
- upcoming commitments are time-sensitive and should be highly visible

#### Recent payments summary card

Should contain:
- most recent 1-3 payment items
- type badge
  - membership / event / course
- amount
- status
- CTA:
  - `Open billing`

Reason:
- members want reassurance that payments were processed correctly

#### Quick links/actions area

Should contain a small set of links only:
- My Bookings
- Membership
- Billing
- Profile

Reason:
- this preserves fast navigation without cluttering the rest of the dashboard

### How to avoid clutter

- keep the page to a small number of strong sections
- do not duplicate full route content on the dashboard
- use short summaries, not full tables
- prefer one clear action per card
- do not show destructive actions directly on Overview

---

## Recommended V1 My Bookings Experience

### Events and courses in V1

Events and courses should live together in one list in V1.

This is the better V1 UX because:
- members think in terms of “what am I booked onto?”
- not in terms of internal content model distinctions
- a unified list is easier to learn and easier to maintain
- it reduces navigation depth and route sprawl

### Filters and tabs in V1

V1 should keep filtering minimal.

Recommended:
- one lightweight search input
- one lightweight filter for booking type:
  - all
  - events
  - courses
- optional second lightweight filter for status only if needed after testing

Recommended reuse direction:
- reuse the lightweight filter/search interaction pattern already used by [SectionSearchFilters.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/sections/primitives/section-search-filters/SectionSearchFilters.jsx)
- do not invent a heavy account-specific filter system for V1
- do not directly reuse the admin payments filter bar or admin compact menu styling
- reuse the interaction pattern only:
  - search
  - lightweight type filter
  - optional second filter only if proven necessary

Tabs are not required inside My Bookings if the list already groups content clearly.

Preferred V1 grouping:
- upcoming
- past

### Fields each booking item should display

Each booking item should display:
- title
- type badge
  - Event
  - Course
- date/time
- location or online indicator
- booking status
- payment status
- attendance status

Attendance must appear in V1.

Waitlist state must also appear in V1 where relevant.

### Recommended bookings list presentation

My Bookings should adapt the strongest presentation ideas from `/admin/payments?view=payments`, but only from a presentation-pattern perspective.

What should be reused conceptually:
- searchable list behavior
- lightweight filter pattern
- surfaced item presentation
- badge-driven scanning
- responsive structured-to-stacked layout behavior

What should not be reused directly:
- admin workspace framing
- admin table headers
- admin row density
- admin action cells
- admin semantic styling

Recommended item structure:

1. Primary content
- title
- type badge

2. Secondary content
- date/time
- location or online indicator

3. Status cluster
- booking status
- payment status
- attendance
- waitlist state when relevant

4. Action area
- `View event` or `View course`
- cancellation action when allowed

The resulting design should stay within the public/member design system and not look like an admin table transplanted into the member area.

### Interaction model

Clicking a booking should go directly to the public event or course page.

This is the recommended V1 behavior because:
- it avoids creating a second detail surface that duplicates public content
- it keeps implementation simpler
- it preserves a strong connection between account activity and the public-facing content surface

The CTA should be context-aware:
- `View event` for event bookings
- `View course` for course bookings

### Cancellation

Cancellation must be available directly from the bookings list item.

However, it should not execute inline.

Recommended V1 pattern:
- show a clear secondary/destructive action on the item when cancellation is allowed
- clicking it opens a confirmation modal
- use the same underlying destructive confirmation pattern already established elsewhere in the product
- reuse the existing modal approach rather than inventing a new account-only confirmation system

Recommended reuse direction:
- reuse the shared [Modal.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/ui/modal/Modal.jsx) pattern
- mirror the current destructive confirmation conventions used across admin workflows

### Cancellation availability messaging

If cancellation is allowed:
- show the action clearly
- include short supporting text only if needed

If cancellation is no longer allowed:
- hide the actionable cancel button
- show a muted explanatory message such as:
  - `Cancellation window has passed`
  - or `This booking can no longer be cancelled`

### Refund / policy messaging

V1 should keep this basic:
- show short policy-aware copy in the confirmation modal
- example:
  - `Refunds follow the organiser’s cancellation policy.`
  - `This booking can be cancelled, but a refund may not apply.`

Do not build complex refund orchestration UI in V1.

---

## Recommended V1 Membership Page

### Minimum membership information

The member should see:
- current plan
- membership status
- renewal date
- price
- payment status if applicable
- manage/cancel action

### Essential membership functionality

Essential in V1:
- view current membership details
- understand whether the membership is active
- understand when it renews or expires
- understand current price and payment state
- initiate cancel/manage action if supported by business rules

### Optional membership functionality

Optional and not required for V1:
- benefits presentation
- upgrade/downgrade journeys
- deep membership history
- billing history duplication

### Membership benefits in V1

Membership benefits should not be a major part of V1 account design.

If benefits exist, keep them light or omit them from the member account V1. This route should be operational first, not marketing-heavy.

### Invoices/history location

Invoices and payment history should live in Billing, not on Membership.

Membership can still show contextual payment information such as:
- payment status
- next renewal charge date

But Billing should remain the single source of payment history.

---

## Recommended V1 Billing Page

### Unified payment history recommendation

Yes. Membership payments, event payments, and course payments should all appear together in one Billing page for V1.

This is the better V1 UX because:
- members think in terms of “what have I paid for?”
- not “which subsystem owns this payment?”
- one page is easier to understand
- one page is easier to support
- one page is easier to integrate cleanly with Stripe records

### Minimal filters for V1

Recommended:
- no filters initially if the list is small and readable
- add one lightweight type filter only if needed:
  - all
  - membership
  - event
  - course

If filtering is added, reuse the lightweight pattern established by [SectionSearchFilters.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/sections/primitives/section-search-filters/SectionSearchFilters.jsx) rather than introducing a new heavy billing filter framework.

Do not directly reuse the admin payments workspace filter chrome. Billing should stay visually aligned with the public/member account experience.

### Payment item fields

Each payment row/item should show:
- date
- item name
- type badge
  - Membership
  - Event
  - Course
- amount
- status
- receipt/invoice link

Recommended badge reuse:
- use the shared [Badge.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/ui/badge/Badge.jsx) component to signal payment type and status

### Recommended billing list presentation

Billing is the strongest candidate for presentation adaptation from `/admin/payments?view=payments`, but only at the pattern level.

What should be reused conceptually:
- searchable and optionally filterable record list
- surfaced item presentation
- badge-driven scanning
- responsive layout that remains readable on mobile

What should not be reused directly:
- admin workspace framing
- admin table headers
- admin-specific columns such as member identity
- admin action-cell patterns
- admin semantic styling

Recommended billing item structure:

1. Primary line
- item name
- type badge
- status badge

2. Secondary line
- date
- amount

3. Action area
- receipt/invoice link when available

Desktop presentation may use a structured grid, but mobile should collapse cleanly into stacked surfaced items.

### Contextual payment info outside Billing

Even with unified Billing, contextual payment info should still appear in Membership and My Bookings where useful.

Examples:
- Membership page can still show current payment status
- Booking list items can still show payment status

Rule:
- contextual summary belongs where the action is
- full history belongs in Billing

---

## V1 Payment Flow Recommendations

### Core recommendation

Favor immediate payment for paid items in V1.

This means:
- memberships should be paid immediately when the member signs up for a membership
- event bookings should be paid immediately when the booking is created
- course bookings should be paid immediately when the booking/enrolment is created

### Why immediate payment is better for V1

- easier mental model for members
- fewer unpaid states to explain
- simpler billing history
- simpler booking confirmation logic
- cleaner Stripe integration path
- fewer follow-up payment recovery edge cases

### Free items

If an event or course is free:
- booking should complete immediately
- payment status should resolve to a simple non-payment state such as:
  - `Free`
  - or `No payment required`

### Membership-included bookings

If a booking is fully included in membership:
- allow booking without payment collection
- show clear payment status such as:
  - `Included in membership`
  - or `No payment required`

V1 should avoid hybrid partial-payment complexity unless already essential.

### Stripe scope

Stripe payment handling is planned but not yet implemented.

V1 account and billing structure should therefore assume:
- Stripe is the single payments provider
- payment records will ultimately need a clean mapping to a unified member billing history

---

## V1 Cancellation Flow

### Where cancellation should live

Cancellation should be available directly from:
- the membership page for membership cancellation if supported
- the My Bookings list for event/course booking cancellation

This keeps the action close to the thing being managed and reduces friction.

### Interaction pattern

Recommended V1 pattern:
- show cancellation in the list/action area
- require confirmation via modal
- never execute cancellation on first click

This is the cleanest and safest pattern because:
- it keeps management actions discoverable
- it prevents accidental destructive actions
- it reuses existing modal/destructive interaction patterns already present in the product

Recommended reuse direction:
- reuse the shared [Modal.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/ui/modal/Modal.jsx) pattern
- mirror the current destructive confirmation conventions used across admin workflows
- do not create a second bespoke confirmation pattern for member actions

### Availability communication

If cancellation is allowed:
- show the action clearly

If cancellation is not allowed:
- do not present a live destructive action
- show brief explanatory text or muted status instead

Examples:
- `Cancellation available until 24 hours before start`
- `Cancellation window has passed`
- `This membership can no longer be cancelled online`

### Refund / policy messaging

V1 should use short, explicit policy copy in the modal and item state.

Recommended V1 approach:
- one short policy note
- no complex branching refund UI
- no embedded customer support workflow

---

## Waitlisting

Waitlisting must not be deferred.

Events and courses already have waitlisting logic on the admin side, so V1 member experience should expose waitlist status where relevant.

Recommended V1 behavior:
- booking records should clearly indicate waitlist state via status badge
- waitlisted items should still appear in My Bookings
- attendance and payment state should remain visible if relevant to the record state

Do not overbuild waitlist actions in V1. Priority is visibility and clarity.

---

## Intentionally Not Part Of V1

The following should be explicitly deferred:

- advanced notification preferences
- rescheduling workflows
- booking transfers
- advanced failed payment recovery flows
- saved payment methods as a standalone account area
- security center
- support workflow tooling
- advanced attendance tools
- deep course progress tracking
- detailed benefits portals
- rich refund workflow orchestration
- complex membership upgrades/downgrades

These are valid future features, but they do not belong in a lean, high-confidence V1.

---

## Implementation-Minded UX Guidance

### General

- keep layouts sparse
- keep navigation shallow
- prioritize clarity on mobile
- use strong headings and short explanatory copy
- use status badges consistently
- keep destructive actions explicit and deliberate
- keep reusable list and filter patterns aligned with the public/member design system, not admin workspace styling

### Overview

- use summary cards, not full tables
- keep each card focused on one question
- avoid duplicate data blocks

### My Bookings

- use a clean list or card-list layout
- avoid too many inline actions
- keep the primary action as contextual content access
- keep destructive actions secondary and confirmed via modal
- adapt the strongest scanability patterns from the admin payments list without inheriting admin visual chrome
- prefer one shared list presentation model for events and courses

### Membership

- keep the page operational, not marketing-heavy
- surface plan, status, renewal, and action clearly
- avoid mixing payment history into the main layout

### Billing

- keep one unified payment history
- use clear type badges
- keep status readable at a glance
- ensure receipt/invoice access is obvious when available
- adapt the scanability of the admin payments list without carrying over admin table chrome
- prefer a member-friendly surfaced list over an operational back-office table

### Profile

- keep it narrow and reassuring
- separate identity summary from editable form
- avoid exposing unsupported fields as editable

---

## Route And Naming Recommendations

### Recommended V1 route model

Recommended route structure:
- `/account`
- `/account/bookings`
- `/account/membership`
- `/account/billing`
- `/account/profile`

### Route naming recommendation

For V1, the product should prefer member-facing language over implementation-facing language.

Recommended route naming direction:
- `Overview` instead of `Account`
- `My Bookings` instead of `Registrations`
- `Billing` instead of `Payments`

### Transitional implementation recommendation

To avoid unnecessary churn during initial delivery:
- existing routes may remain in place temporarily at the file-system level
- but page titles, navigation labels, and internal product language should move to:
  - Overview
  - My Bookings
  - Membership
  - Billing
  - Profile

Recommended practical transition:
- keep `/account/registrations` as an implementation route only if needed temporarily
- keep `/account/payments` as an implementation route only if needed temporarily
- introduce `/account/bookings` and `/account/billing` once the member UX is stable

The user-facing experience should not be shaped by legacy internal route naming.

---

## Shared Member List Pattern

Bookings and Billing should not become two independently designed list systems.

V1 should establish one shared member-facing list presentation pattern with page-specific content rules layered on top.

### Purpose

This shared pattern should provide:
- scanable surfaced items
- lightweight search/filter support
- strong mobile readability
- clear badge/status language
- compact but trustworthy action areas

### Shared structural rules

Every member list item should follow the same high-level structure:

1. Primary block
- title / item name
- key supporting identity marker if relevant

2. Metadata block
- date or date/time
- location / online / schedule summary
- amount where relevant

3. Badge cluster
- type
- state/status badges

4. Action block
- one primary contextual action
- one secondary/destructive action only where justified

### Shared visual rules

- each item should sit inside a surfaced container
- spacing should be generous enough to read comfortably on mobile
- badges should cluster cleanly without overwhelming the item
- metadata should use a quieter text tier than the title
- actions should remain visually subordinate to the core content

### Shared responsive rules

Desktop:
- structured layout with clear alignment
- not a dense operational table

Mobile:
- stacked surfaced cards/items
- actions move below content
- badges remain easy to scan without wrapping into visual noise

### Shared component direction

Preferred reuse:
- [Badge.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/ui/badge/Badge.jsx)
- [Button.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/ui/button/Button.jsx)
- [Modal.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/ui/modal/Modal.jsx)
- [SectionSearchFilters.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/sections/primitives/section-search-filters/SectionSearchFilters.jsx) as interaction reference for search/filter behavior

Do not reuse:
- admin workspace sections
- admin payments table layout directly
- admin table headers or admin action-cell presentation

### Token guidance for the shared list pattern

If new tokens are required, they should support a reusable public/member list contract only.

Examples of acceptable new shared tokens:
- account list item surface
- account list item border
- account list item gap
- account list item metadata color
- account list badge cluster gap

Avoid:
- page-specific token families for Bookings only
- page-specific token families for Billing only
- admin/member mixed token contracts

---

## Data And Interaction Model Decisions

### Overview

Overview should use summary data only.

It should not become:
- a full bookings list
- a full payments list
- a second membership page

### My Bookings

My Bookings should be backed by a unified member booking view model that merges:
- event bookings
- course bookings

Each normalized record should support:
- type
- title
- href
- date/time
- location or schedule summary
- booking status
- payment status
- attendance state
- waitlist state
- cancellation eligibility

### Billing

Billing should be backed by a unified member billing view model that merges:
- membership payments
- event payments
- course payments

Each normalized record should support:
- date
- title
- type
- amount
- status
- receipt/invoice href if available

### Cancellation interaction

Cancellation should be represented at the record level as:
- allowed
- not allowed

This should drive both:
- action visibility
- explanatory messaging

### Stripe alignment

The data model should assume Stripe becomes the single payments provider for V1.

That means:
- billing records should be designed to map cleanly to Stripe-backed payment history later
- bookings and membership pages should display contextual payment status without owning payment-history logic

---

## Recommended Implementation Sequence

### Phase 1: Shared account structure and naming

Goal:
- establish the member account information architecture clearly

Scope:
- member account nav / shell
- page titles and route labels
- Overview / My Bookings / Membership / Billing / Profile naming direction

Outputs:
- shared account shell or local subnav
- updated member-facing IA

### Phase 2: Overview and shared list foundation

Goal:
- deliver the highest-value member account experience first

Scope:
- redesign `/account` as Overview
- implement shared member list presentation pattern
- implement summary cards:
  - membership
  - upcoming bookings
  - recent billing

Outputs:
- new Overview experience
- reusable member list presentation primitives/contracts

### Phase 3: My Bookings

Goal:
- make bookings the first fully operational member route

Scope:
- unified event + course bookings
- lightweight search/filter behavior
- attendance visibility
- waitlist visibility
- direct contextual CTA to public event/course page
- cancellation with modal confirmation

Outputs:
- full My Bookings route
- unified booking view model

### Phase 4: Billing

Goal:
- provide one clean financial history surface

Scope:
- unified membership/event/course billing history
- lightweight filtering only if needed
- receipt/invoice links
- strong badge-driven status scanning

Outputs:
- full Billing route
- unified billing view model

### Phase 5: Membership

Goal:
- tighten membership into a clear operational route

Scope:
- current plan
- status
- renewal date
- price
- payment context
- manage/cancel interaction if supported

Outputs:
- focused Membership route

### Phase 6: Profile and avatar

Goal:
- complete the basic member identity area

Scope:
- avatar support stored on the user record
- avatar upload pattern
- editable full name
- read-only email, role, and created date

Outputs:
- completed Profile route
- avatar persistence path

### Why this sequence

This order is recommended because it:
- delivers the most visible UX improvement first
- establishes shared presentation patterns before route proliferation
- avoids blocking early work on avatar or auth-sensitive profile changes
- keeps Billing and Bookings aligned under one presentation model

---

## Detailed UI Specification

This section translates the V1 direction into a more execution-ready UI specification for Overview, My Bookings, and Billing.

The goal is to reduce ambiguity before implementation and keep visual and interaction patterns aligned across the member account area.

### Overview Page UI Specification

#### Page purpose

Overview should feel like a calm account home, not a dashboard overloaded with operational detail.

It should answer the member’s top questions quickly and route them into the right deeper page when necessary.

#### Recommended page structure

1. Page header
2. Summary card row
3. Two-column primary content area on desktop
4. Quick links section

On mobile, the entire page should collapse to a single-column stack.

#### 1. Page header

Recommended content:
- title:
  - `Overview`
- short supporting sentence:
  - one sentence only
  - should set expectations without repeating card content

Recommended behavior:
- no dense action bar
- no destructive actions
- no secondary metrics in the header

#### 2. Summary card row

Recommended count:
- 3 cards

Recommended cards:

##### Membership summary card

Content:
- card title:
  - `Membership`
- current plan name
- membership status badge
- renewal date
- optional payment-state note if relevant
- CTA:
  - `View membership`

Fallback if no membership exists:
- concise empty-state message
- CTA:
  - `View membership`

##### Upcoming bookings summary card

Content:
- card title:
  - `Upcoming bookings`
- count of upcoming items
- next upcoming booking title
- next upcoming booking type badge
- next upcoming booking date/time
- CTA:
  - `Open bookings`

Fallback if no upcoming bookings:
- concise empty-state message
- CTA:
  - `Browse events`
  - optionally `Browse courses` later if needed, but not both in the same card in V1

##### Recent billing summary card

Content:
- card title:
  - `Recent billing`
- 1-2 latest billing items only
- type badge
- amount
- status badge
- CTA:
  - `Open billing`

Fallback if no billing items exist:
- concise empty-state message
- CTA:
  - `Open billing`

#### 3. Primary content area

Recommended desktop structure:
- left column:
  - upcoming bookings preview
- right column:
  - payment attention / recent billing preview

Recommended mobile structure:
- stack in this order:
  - upcoming bookings preview
  - recent billing preview

##### Upcoming bookings preview section

Purpose:
- provide slightly more detail than the summary card without becoming a full bookings page

Recommended content:
- up to 3 upcoming items
- compact surfaced item presentation
- title
- type badge
- date/time
- attendance status if relevant
- CTA:
  - `View event` / `View course`

If the member has more than 3 records:
- end with `View all bookings`

##### Recent billing preview section

Purpose:
- reassure members that payment records exist and are understandable

Recommended content:
- up to 3 recent items
- title
- type badge
- amount
- status badge
- `View receipt` if available

If more records exist:
- end with `View all billing`

#### 4. Quick links section

Purpose:
- provide simple navigation without crowding the summary areas

Recommended links:
- My Bookings
- Membership
- Billing
- Profile

Recommended visual treatment:
- compact surfaced navigation cards or a restrained horizontal link row
- do not make this section visually louder than the summary cards

#### Overview anti-patterns to avoid

- do not embed full bookings lists
- do not embed full billing history
- do not duplicate profile content
- do not show cancellation actions here
- do not show too many badges or metrics at once

---

### Shared Member List Pattern Specification

This specification should govern both:
- My Bookings
- Billing

The content differs by route, but the structural and interaction model should remain closely aligned.

#### Core pattern principles

- surfaced list items
- strong title and metadata hierarchy
- small number of clear badges
- one primary action
- optional secondary action only when justified
- mobile-first readability

#### List shell structure

Recommended structure per route:

1. section header
- page title
- short description
- optional top-level page CTA only if it supports the route

2. controls row
- search
- lightweight filter(s)

3. grouped list content
- group title
- list of surfaced items

4. empty state
- contextual empty state when the current filter/search has no results

#### Controls row specification

Recommended controls:
- one search input
- one lightweight filter by type

Optional later:
- one status filter, only if testing shows genuine need

Recommended interaction behavior:
- search updates list immediately
- filters are lightweight and non-modal
- avoid multi-filter density or advanced combinations in V1

Recommended reuse direction:
- follow [SectionSearchFilters.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/sections/primitives/section-search-filters/SectionSearchFilters.jsx) interaction shape
- adapt styling to the public/member design system

#### Grouping rules

Recommended default grouping:
- upcoming / current
- past / completed

Reason:
- it is more understandable than grouping primarily by content type
- members care most about time relevance

For Billing:
- use simple chronological ordering
- consider optional grouping such as:
  - recent
  - earlier
only if needed later

#### Item container specification

Each item should:
- sit inside a surfaced container
- have clear separation from adjacent items
- use a single visual border/surface treatment
- avoid nested chrome conflicts

Recommended content layout inside each item:

1. title row
- item title
- compact type badge

2. metadata row
- date/date-time
- location / online / schedule or amount depending on route

3. status row
- 1 to 4 badges maximum in V1

4. action row
- primary contextual CTA
- optional destructive or secondary action

#### Badge usage rules

Badges should communicate:
- type
- status
- payment state
- attendance
- waitlist

Do not use badges for decorative emphasis.

Badges should be:
- semantically meaningful
- concise
- visually consistent

#### Action hierarchy rules

Each item should have one clearly dominant action.

Examples:
- Bookings:
  - `View event`
  - `View course`
- Billing:
  - `View receipt`
  - `View invoice`

Secondary actions:
- should remain visually quieter
- should only appear if important to the route

Destructive actions:
- never execute on first click
- always confirm via modal

#### Mobile behavior

On mobile:
- items should stack vertically
- metadata should wrap cleanly
- action row should move beneath content
- badges should wrap without causing the card to feel chaotic

Do not rely on a true table layout on mobile.

---

### My Bookings UI Specification

#### Page structure

Recommended structure:

1. page header
2. controls row
3. upcoming/current group
4. past group

#### Header

Title:
- `My Bookings`

Description:
- one short sentence
- explain that events and courses are shown together

Optional page-level CTA:
- none by default
- if needed, use one quiet CTA such as `Browse events`

#### Booking item fields

Every booking item should show:
- title
- type badge
- date/time
- location or online indicator
- booking status badge
- payment status badge
- attendance badge
- waitlist badge when relevant

#### Booking action rules

Primary action:
- `View event` or `View course`

Secondary action:
- `Cancel booking` if cancellation is allowed

If cancellation is not allowed:
- replace action with muted explanatory text

#### Empty states

If no bookings exist:
- show a single clean empty state
- CTA:
  - `Browse events`

If filtered results are empty:
- explain that no bookings match the current filters

#### Design notes

- avoid making event and course items look like two different components
- they should be one list pattern with small metadata differences

---

### Billing UI Specification

#### Page structure

Recommended structure:

1. page header
2. optional compact summary row
3. controls row
4. unified billing list

#### Header

Title:
- `Billing`

Description:
- one short sentence clarifying that all membership, event, and course payments appear here

#### Optional summary row

Recommended only if it stays small:
- total payment items
- action required count
- settled count

If these metrics make the page feel administrative, remove them.

#### Billing item fields

Every billing item should show:
- date
- item name
- type badge
- amount
- status badge
- receipt/invoice link

#### Billing item action rules

Primary action:
- `View receipt` or `View invoice`

No destructive action is expected on billing items in V1.

#### Empty states

If there is no billing history:
- show a single clean empty state
- explain that billing records will appear here as memberships or paid bookings are created

If filtered results are empty:
- explain that no billing records match the current filters

#### Design notes

- Billing is the closest presentation match to the admin payments list, but it must still feel member-facing
- row density should be lower than admin
- the member should never have to parse an operational table

---

### Membership UI Specification

#### Page structure

Recommended structure:

1. page header
2. primary membership summary card
3. optional secondary contextual block

#### Primary membership summary card

Should include:
- plan name
- membership status badge
- renewal date
- price
- payment status
- primary membership action

#### Membership actions

Primary action examples:
- `Manage membership`
- `Cancel membership`

Cancellation, if supported:
- must confirm via modal
- must show basic policy copy

#### Secondary contextual block

May include:
- brief explanatory note
- next billing date
- simple membership context

Do not include:
- full billing history
- long benefits marketing

---

### Profile UI Specification

#### Page structure

Recommended structure:

1. page header
2. identity summary block
3. editable profile form

#### Identity summary block

Should include:
- avatar
- full name
- email
- role
- account created date

#### Editable form

V1 editable fields:
- avatar
- full name

Read-only fields:
- email
- role
- account created date

#### Avatar UX

Recommended V1 avatar interactions:
- upload avatar
- replace avatar
- remove avatar and fall back to initials

Do not expose the full media library interface here.

Reuse the upload/storage pattern only.

---

## Unified View Model Specification

The member account V1 should not assemble page UIs directly from raw membership, event registration, course registration, and payment records in each route.

That approach would create:
- duplicated transformation logic
- route-specific branching
- inconsistent status wording
- unnecessary UI complexity

Instead, V1 should introduce a small unified view-model layer for:
- Overview
- My Bookings
- Billing

This keeps the route components simpler and makes the UI implementation more stable.

### Guiding principles

- raw records stay domain-owned
- member account pages consume normalized member-facing records
- derived copy and status labels should be resolved before rendering where practical
- the UI should not need to infer business meaning from raw backend fields

---

## Unified Booking Record

### Purpose

The unified booking record should let the product render events and courses through one shared member-facing list pattern.

It should support:
- Overview previews
- My Bookings list
- future shallow reuse in other member account surfaces

### Source records

This record should normalize from:
- event registrations
- course registrations

### Recommended normalized shape

Each unified booking record should include:

- `id`
- `kind`
  - `event`
  - `course`
- `title`
- `href`
- `typeLabel`
  - `Event`
  - `Course`
- `dateLabel`
- `dateSortValue`
- `locationLabel`
- `deliveryLabel`
  - optional normalized delivery summary if useful
- `scheduleLabel`
  - especially useful for courses
- `status`
  - raw normalized registration state
- `statusLabel`
- `statusTone`
- `paymentStatus`
- `paymentStatusLabel`
- `paymentStatusTone`
- `attendanceStatus`
- `attendanceStatusLabel`
- `attendanceStatusTone`
- `waitlistStatus`
  - nullable
- `waitlistStatusLabel`
  - nullable
- `waitlistStatusTone`
  - nullable
- `isUpcoming`
- `isPast`
- `canCancel`
- `cancelBlockedReason`
  - nullable
- `primaryAction`
  - label + href
- `secondaryAction`
  - nullable, for example cancellation

### Field intent

#### `kind`

Purpose:
- determines routing and subtle content differences

This should not force a different component. It should only adjust:
- badge label
- CTA label
- supporting metadata fields

#### `title`

Human-readable member-facing title.

Examples:
- event title
- course title

#### `href`

Should link directly to the public event or course detail page.

This keeps the member journey simple and avoids a duplicate booking-detail route in V1.

#### `dateLabel`

Should be fully formatted for display.

The UI should not need to rebuild date presentation logic.

#### `locationLabel`

Should provide a member-facing location summary.

Examples:
- venue/location
- `Online`
- `Location to be confirmed`

#### `scheduleLabel`

Useful for courses where date ranges and repeating schedules may need a clearer summary.

This should not always be rendered if redundant with `dateLabel`.

#### Status fields

All status-like fields should expose:
- machine-oriented value
- member-facing label
- tone for badge rendering

This keeps badge rendering straightforward and avoids duplicating translation logic in the UI.

#### `isUpcoming` / `isPast`

These support list grouping and overview prioritization.

The page should not need to recalculate timeline grouping from raw dates every time.

#### `canCancel`

This is a key V1 field.

The UI should not determine cancellation eligibility itself.
It should simply respond to:
- `canCancel: true`
- `canCancel: false`

#### `cancelBlockedReason`

If cancellation is not available, the view model should provide a short member-facing reason.

Examples:
- `Cancellation window has passed`
- `This booking can no longer be cancelled`
- `Waitlisted bookings cannot be cancelled online`

This keeps policy messaging centralized and consistent.

#### `primaryAction`

Should be explicit and already contextualized.

Examples:
- `{ label: "View event", href: "/hub/events/..." }`
- `{ label: "View course", href: "/hub/courses/..." }`

#### `secondaryAction`

Should only exist when it is genuinely valid.

Example:
- cancellation action descriptor

This keeps the UI from scattering action eligibility logic.

### Grouping rules

The view model layer should expose:
- upcoming/current bookings
- past bookings

This grouping should be reusable by:
- Overview preview
- My Bookings page

### Waitlist handling

Waitlist must be part of the unified booking model.

Recommended approach:
- treat waitlist as a first-class booking state
- expose it through explicit waitlist fields rather than forcing the UI to derive it indirectly

### Attendance handling

Attendance must also be part of the unified booking record.

The record should resolve:
- attendance label
- attendance tone

This supports consistent badge rendering in both previews and the full bookings page.

---

## Unified Billing Record

### Purpose

The unified billing record should let the member account render one coherent financial history across:
- memberships
- event bookings
- course bookings

It should support:
- Overview recent billing preview
- Billing page full history

### Source records

This record should normalize from:
- membership payment items
- event payment items
- course payment items

### Recommended normalized shape

Each unified billing record should include:

- `id`
- `kind`
  - `membership`
  - `event`
  - `course`
- `title`
- `typeLabel`
  - `Membership`
  - `Event`
  - `Course`
- `typeTone`
  - if we want type badges to be visually distinct
- `dateLabel`
- `dateSortValue`
- `amountLabel`
- `amountValue`
  - nullable if needed for sorting
- `currency`
- `status`
- `statusLabel`
- `statusTone`
- `detail`
  - optional short supporting context
- `receiptHref`
  - nullable
- `invoiceHref`
  - nullable
- `relatedHref`
  - optional link back to related public content
- `isActionRequired`

### Field intent

#### `kind`

Used for:
- type badge
- light filtering
- downstream analytics if needed later

#### `title`

Should be the member-facing display name of the charged item.

Examples:
- membership plan title
- event title
- course title

#### `dateLabel`

Should be a fully formatted display string.

#### `amountLabel`

Should already be formatted for locale and currency.

This keeps billing UI simple and consistent.

#### `status` fields

Like booking records, billing records should expose:
- raw normalized value
- member-facing label
- badge tone

Examples:
- paid
- pending
- overdue
- refunded
- not required

#### `receiptHref` / `invoiceHref`

At least one should be available where the payment provider supports it.

The UI should not need to guess whether to show:
- `View receipt`
- `View invoice`

The view model should make that clear.

#### `relatedHref`

Optional, but useful for future linking back to:
- membership
- event
- course

Not required to be surfaced in V1 UI if it adds clutter.

#### `isActionRequired`

Supports both:
- Overview summary
- Billing attention indicators

The UI should not re-derive this from raw status each time.

### Ordering

Billing records should be sorted newest first by default.

The unified view model should provide that ordering before rendering.

### Filtering support

The billing view model should support lightweight filtering by:
- all
- membership
- event
- course

Search support should be based on:
- title
- optionally supporting context if helpful

---

## Overview Aggregate View Model

### Purpose

Overview should not query the UI from several independent raw sources and assemble them ad hoc.

Instead, Overview should consume a small aggregate view model built from the unified booking and billing layers plus membership state.

### Recommended shape

The overview aggregate should include:

- `membershipSummary`
- `bookingSummary`
- `billingSummary`
- `quickLinks`

#### `membershipSummary`

Should include:
- current plan
- status label/tone
- renewal date label
- payment status label/tone if relevant
- primary CTA

#### `bookingSummary`

Should include:
- upcoming count
- next upcoming booking
- preview list
  - maximum 3 items
- primary CTA

#### `billingSummary`

Should include:
- recent item count if useful
- preview list
  - maximum 3 items
- action required count
- primary CTA

#### `quickLinks`

Should be a fixed and intentional list:
- My Bookings
- Membership
- Billing
- Profile

This should not become dynamic personalization in V1.

---

## Route Ownership And Data Responsibilities

### Overview route

Should own:
- overview aggregate view model assembly

Should not own:
- raw booking-type-specific UI logic
- raw payment normalization logic

### My Bookings route

Should own:
- search/filter state
- list grouping display
- cancellation interaction state

Should not own:
- event/course normalization logic
- cancellation policy derivation

### Billing route

Should own:
- search/filter state
- list rendering

Should not own:
- billing record normalization
- payment badge label logic

### Membership route

Should own:
- membership-specific operational presentation

Should not become:
- a billing history route

### Profile route

Should own:
- identity summary rendering
- editable profile form
- avatar upload/change/remove flow

Should not own:
- auth identity changes such as email mutation in V1

---

## Acceptance Criteria For The Unified View Model Layer

The view-model work should be considered successful when:

- Bookings UI does not need to branch heavily by raw event vs course record shape
- Billing UI does not need to branch heavily by raw membership vs event vs course record shape
- Overview can render summaries without duplicating formatting and status logic
- cancellation availability and blocked messaging come from normalized data
- waitlist and attendance are visible through the same booking item model
- the same item presentation pattern can be reused across Bookings and Billing without awkward route-specific hacks

---

## Phase-By-Phase Delivery Plan

This section converts the V1 proposal into a practical execution sequence.

The intent is to:
- keep implementation incremental
- deliver the highest-value UX improvements first
- avoid cross-cutting rework
- separate low-risk IA and presentation work from higher-risk data/profile work

Each phase includes:
- goal
- scope
- key implementation tasks
- dependencies
- out-of-scope items
- definition of done

---

## Phase 1: Member Account IA And Shell

### Goal

Establish the correct member account structure and user-facing language before rebuilding the internal pages.

### Scope

- lock member-facing page labels
- establish shared account navigation/shell
- align account entry points with the V1 structure

### Key implementation tasks

1. Add a shared member account shell
- define the outer layout for member account routes
- provide shallow navigation across:
  - Overview
  - My Bookings
  - Membership
  - Billing
  - Profile

2. Update member-facing route language
- use member-facing titles and labels
- stop exposing implementation-centric language such as:
  - Registrations
  - Payments
when the product-facing term should be:
  - My Bookings
  - Billing

3. Decide route transition handling
- determine whether:
  - `/account/registrations` remains temporarily
  - `/account/payments` remains temporarily
- if retained temporarily, ensure navigation and page labels still use:
  - My Bookings
  - Billing

4. Align the member shell with the current public design system
- use the current public/member surface and spacing direction
- do not borrow admin shell patterns

### Dependencies

- none beyond the existing authenticated account routes

### Out of scope

- new unified list views
- avatar upload
- booking cancellation behavior
- billing data unification

### Definition of done

- every member account page lives inside a coherent member shell
- member-facing labels reflect the target IA
- navigation is shallow and consistent
- no admin/workspace framing leaks into the member shell

---

## Phase 2: Shared Member List Foundation

### Goal

Build the reusable presentation and normalization foundation needed by both My Bookings and Billing.

### Scope

- shared member list presentation pattern
- lightweight search/filter pattern for member pages
- unified booking record
- unified billing record
- overview aggregate model foundation

### Key implementation tasks

1. Implement unified booking normalization
- normalize event registrations and course registrations into one member-facing booking record shape
- expose:
  - status labels/tones
  - payment state
  - attendance
  - waitlist
  - cancellation eligibility
  - contextual CTA

2. Implement unified billing normalization
- normalize membership, event, and course payment records into one billing record shape
- expose:
  - type labels
  - status labels/tones
  - formatted date and amount
  - receipt/invoice links
  - action-required flag

3. Implement shared member list presentation primitives
- define the surfaced item presentation used by both:
  - My Bookings
  - Billing
- keep it public/member facing
- avoid admin table chrome

4. Implement lightweight member filter/search controls
- use [SectionSearchFilters.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/sections/primitives/section-search-filters/SectionSearchFilters.jsx) as the interaction reference
- adapt styling for the member account surface

5. Add minimal reusable tokens only if needed
- create shared public/member list tokens only if repeated usage proves necessary
- avoid page-specific token families

### Dependencies

- Phase 1 member shell and route naming direction

### Out of scope

- final Overview redesign
- final Bookings page
- final Billing page
- profile/avatar work

### Definition of done

- a single normalized booking shape exists for events and courses
- a single normalized billing shape exists for membership, event, and course payments
- Bookings and Billing can share one list presentation model
- filter/search behavior is lightweight and member-facing
- no admin payments table components are copied directly into member pages

---

## Phase 3: Overview

### Goal

Ship the new account landing page first, using the new shell and unified view-model foundation.

### Scope

- redesign `/account` as Overview
- add summary cards
- add lightweight previews for bookings and billing

### Key implementation tasks

1. Build overview aggregate view model
- membership summary
- booking summary
- billing summary
- quick links

2. Implement Overview page header and structure
- clean title and supporting sentence
- sparse layout

3. Implement summary cards
- membership summary card
- upcoming bookings summary card
- recent billing summary card

4. Implement preview sections
- upcoming bookings preview
- recent billing preview

5. Implement quick links area
- My Bookings
- Membership
- Billing
- Profile

### Dependencies

- Phase 2 unified booking and billing view-models

### Out of scope

- full bookings list experience
- full billing history
- cancellation interactions
- profile editing changes

### Definition of done

- `/account` reads as a true Overview page
- the page answers the top member questions quickly
- previews are concise and do not duplicate full-route functionality
- Overview is visually aligned with the public/member design system

---

## Phase 4: My Bookings

### Goal

Deliver the highest-value operational member route with unified event/course visibility and safe cancellation behavior.

### Scope

- full My Bookings route
- event + course bookings in one list
- cancellation flow
- waitlist visibility
- attendance visibility

### Key implementation tasks

1. Implement page-level My Bookings route
- page header
- controls row
- grouped content

2. Render unified booking records using the shared list pattern
- upcoming/current group
- past group

3. Add lightweight search and type filtering
- search
- all / events / courses
- only add extra status filtering if needed

4. Implement contextual CTA behavior
- `View event`
- `View course`
- route directly to the public event/course page

5. Implement cancellation action behavior
- show cancellation only when `canCancel` is true
- open confirmation modal on click
- reuse shared modal/destructive conventions

6. Implement blocked cancellation messaging
- show short blocked reason when cancellation is not available

7. Implement waitlist and attendance display
- both must be visible within booking items

### Dependencies

- Phase 2 shared list foundation
- normalized booking records

### Out of scope

- rescheduling
- booking transfer
- booking detail route
- complex refund orchestration

### Definition of done

- members can see events and courses together in one clear list
- attendance and waitlist state are visible
- the CTA is context-aware
- cancellation is available safely where allowed
- the route feels modern, sparse, and member-facing

---

## Phase 5: Billing

### Goal

Deliver a single, simple billing history surface that unifies all member payment records.

### Scope

- full Billing route
- unified membership/event/course payment history
- badge-driven scanning
- receipt/invoice access

### Key implementation tasks

1. Implement page-level Billing route
- page header
- optional compact summary row if it improves clarity
- controls row
- unified billing list

2. Render unified billing records using the shared list pattern
- keep the list member-friendly
- avoid admin-like table density

3. Add lightweight type filtering only if needed
- all
- membership
- event
- course

4. Implement receipt/invoice links
- use record-provided receipt or invoice href where available

5. Ensure contextual consistency
- Billing is the full history source
- membership and bookings may still show lightweight payment context

### Dependencies

- Phase 2 unified billing records
- shared member list presentation pattern

### Out of scope

- failed payment recovery workflow
- saved payment methods area
- refund management workflows

### Definition of done

- one Billing route shows all membership/event/course payment records together
- status and type are easy to scan
- receipt/invoice access is clear
- the route does not feel like an admin payment queue

---

## Phase 6: Membership

### Goal

Refine Membership into a focused operational route aligned with the rest of the member account.

### Scope

- current plan summary
- status and renewal
- payment context
- manage/cancel behavior

### Key implementation tasks

1. Rework Membership page structure
- member-facing page header
- primary membership summary card
- minimal secondary contextual content

2. Surface the minimum essential membership information
- plan
- status
- renewal date
- price
- payment state

3. Implement membership action area
- manage action if applicable
- cancellation action if applicable
- use modal confirmation for destructive action

4. Keep payment history out of the main page
- show contextual payment info only
- route the member to Billing for full history

### Dependencies

- Phase 1 member shell
- current membership data access

### Out of scope

- benefits portal
- upgrades/downgrades
- deep membership history

### Definition of done

- the Membership page is clear, focused, and operational
- it does not duplicate Billing
- destructive action behavior is safe and consistent

---

## Phase 7: Profile And Avatar

### Goal

Finish the V1 member account area with a credible profile surface and avatar support.

### Scope

- richer profile presentation
- avatar support
- editable name
- read-only email/role/created date

### Key implementation tasks

1. Extend the user record to support avatar persistence
- add avatar asset reference on the user record
- follow existing asset storage conventions

2. Implement avatar upload flow
- reuse file upload/storage pattern
- do not expose the full media library UI

3. Implement profile identity summary
- avatar
- name
- email
- role
- account created date

4. Implement editable profile form
- avatar upload/change/remove
- full name edit

5. Preserve read-only identity boundaries
- no email editing in V1
- no auth identity mutation here

### Dependencies

- existing asset storage conventions
- current profile update route/action

### Out of scope

- email editing
- security center
- notification preferences

### Definition of done

- members can view a complete profile summary
- members can upload, replace, or remove avatar
- members can edit full name
- profile stays simple and trustworthy

---

## Release Strategy Recommendation

### Recommended first implementation slice

Start with:
- Phase 1
- Phase 2
- Phase 3

Reason:
- this gives the most visible UX improvement early
- it establishes the correct architecture before list-heavy routes are rebuilt
- it keeps the first slice away from avatar and auth-sensitive work

### Recommended second implementation slice

Follow with:
- Phase 4
- Phase 5

Reason:
- Bookings and Billing both depend on the shared list foundation
- implementing them together helps keep the presentation and interaction model aligned

### Recommended final V1 slice

Finish with:
- Phase 6
- Phase 7

Reason:
- Membership can be tightened once Overview and Billing conventions are established
- Profile/avatar is the highest-risk identity-adjacent slice in V1 and should come after the rest of the member account surface is stable

---

## Final Recommended V1 Structure

### Final page list

- `/account` — Overview
- `/account/bookings` or `/account/registrations` renamed to My Bookings
- `/account/membership`
- `/account/billing` or `/account/payments` renamed to Billing
- `/account/profile`

Recommended naming direction:
- prefer member-facing names in navigation and page headers:
  - `Overview`
  - `My Bookings`
  - `Membership`
  - `Billing`
  - `Profile`

### Critical data shown on each page

#### Overview
- membership summary
- upcoming bookings summary
- recent payments summary
- quick links

#### My Bookings
- unified event and course bookings
- title
- type
- date/time
- location/online
- booking status
- payment status
- attendance
- waitlist state where relevant
- contextual CTA
- cancellation action when allowed

#### Membership
- current plan
- status
- renewal date
- price
- payment status
- manage/cancel action

#### Billing
- unified membership/event/course payment history
- date
- item name
- type
- amount
- status
- receipt/invoice link

### Locked presentation guidance

For both My Bookings and Billing:
- reuse the strongest presentation principles from the admin payments list
- do not reuse the admin workspace presentation directly
- keep the final result within the public/member design system
- create new tokens only if they represent a genuinely reusable public/member list contract
- avoid page-specific token bloat

If new tokens are needed, they should be minimal and reusable across both pages, for example:
- shared account list item spacing
- shared account list item border/surface treatment
- shared account metadata text tier

They should not become page-specific token families unless repeated usage clearly justifies that abstraction.

#### Profile
- avatar
- full name
- email
- role
- account created date
- editable avatar
- editable full name

### Simplest recommended member journey

Recommended V1 journey:

1. Member signs up or books
2. If payment is required, payment is taken immediately through Stripe
3. Member lands in account context with clear confirmation
4. Overview shows current membership, bookings, and recent billing summary
5. Member uses My Bookings to review upcoming events/courses and cancel if allowed
6. Member uses Billing to review all payment history in one place
7. Member uses Profile to manage basic account identity details

## Conclusion

The recommended V1 member account should be deliberately small, coherent, and operational.

It should not try to solve every possible member lifecycle problem. It should solve the most common and highest-value tasks with a clean structure:

- know your membership
- know your bookings
- know your payments
- manage your profile
- cancel safely when allowed

That is the right V1 scope for launch quality, implementation confidence, and future extensibility.
