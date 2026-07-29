# Offering Next-Steps Pages Plan

Status:
- Locked
- Source of truth for post-booking and post-enrolment next-step pages

Date:
- 2026-04-09

Related:
- [Monetisation Tier And External Payments Model](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/monetisation-tier-and-external-payments-model-2026-04-08.md)
- [Member Account V1 Proposal](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/member-account-dashboard-and-profile-plan.md)
- [Membership Plan Visibility And Upgrade Operations](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/membership-plan-visibility-and-upgrade-operations-2026-04-08.md)

## Purpose

This document locks the product and implementation direction for dedicated post-booking and post-enrolment next-step pages in `hub-platform`.

These pages exist to answer the most important member questions immediately after they complete a registration action:

- did my booking/enrolment go through?
- is my place confirmed yet?
- how do I pay, if payment is required?
- what happens after I pay?
- where do I track this later?

The current jump straight into `My Bookings` is not sufficient for production-grade UX because it turns a guided next-step moment into a generic tracking screen.

## Executive Summary

For events and courses, the platform should use dedicated next-step pages that stay close to the offering route:

- event:
  - `/{hubSlug}/events/{eventSlug}/booking/next-steps`
- course:
  - `/{hubSlug}/courses/{courseSlug}/enrolment/next-steps`

These routes should:

- not use a hero layout
- focus on the primary next action
- present payment and confirmation state clearly
- adapt by package tier and offering pricing mode
- be implemented with a shared page pattern plus event/course-specific adapters

## Why Dedicated Pages Are The Correct Choice

### 1. The state is operationally important

This is not a small success moment. It is a real operational checkpoint:

- booking/enrolment recorded
- payment may still be required
- confirmation may still be pending

That deserves its own stable page state.

### 2. External and manual payment flows need stable instructions

Starter hubs may rely on:

- external checkout links
- bank transfer details
- payment references
- manual confirmation instructions
- or any combination of the above

Members may need to:

- read carefully
- copy details
- open another payment surface
- return later

A dedicated page handles this much better than a modal.

### 3. My Bookings is a tracking surface, not the best immediate confirmation surface

`My Bookings` should remain where the member goes later to check status.

The next-steps page should be where the member first learns:

- what happened
- what is still needed
- what to do next

## Route Structure

### Event next-steps route

- `/{hubSlug}/events/{eventSlug}/booking/next-steps`

### Course next-steps route

- `/{hubSlug}/courses/{courseSlug}/enrolment/next-steps`

These routes are intentionally close to the offering rather than unified under account routes.

Benefits:

- preserves context
- keeps copy tailored to the offering type
- simplifies linking back to the offering
- avoids inventing a generic abstraction that feels detached from the member action they just took

## Shared Implementation Pattern

The routes should be separate, but the page pattern should be reusable.

Recommended structure:

- one shared next-steps page composition component
- one shared domain adapter pattern for next-step content
- event-specific data adapter
- course-specific data adapter

This keeps:

- the routes contextual
- the code coherent
- the status model reusable

## Page Anatomy

These pages should not use a hero.

They should follow the structure of focused operational pages already present in the product:

- compact page header
- one primary state panel
- one supporting details/instructions panel
- one tracking/reassurance panel

### 1. Compact page header

Purpose:
- orient the member quickly

Contains:
- eyebrow:
  - `Booking`
  - or `Enrolment`
- short title
- one-sentence explanation

Examples:
- `Booking next steps`
- `Enrolment next steps`

### 2. Primary state panel

Purpose:
- explain what just happened
- explain the current state
- present the main action clearly

Contains:
- offering title
- current booking/enrolment state
- one-line explanation of what remains true right now
- primary CTA

### 3. Payment and instruction panel

Purpose:
- present payment details and next-step guidance clearly

Contains:
- payment status or payment expectation
- external checkout link if present
- payment instructions if present
- confirmation expectations

### 4. Reassurance and tracking panel

Purpose:
- tell the member where to monitor the status later

Contains:
- explanation of what changes after payment/confirmation
- CTA to `My Bookings`
- optional secondary CTA back to the offering

## Required Data Handling

The page must handle all required data for the offering and current registration state.

At minimum:

- offering title
- offering slug
- offering date/schedule summary
- pricing mode
- price and currency when relevant
- current registration/enrolment status
- current payment status
- payment processing mode
- external payment URL when present
- payment instructions when present
- waitlist/capacity implications if relevant

## Tier And Pricing Behavior

## 1. Free tier and free offerings

Even when the flow is free, the member still needs a clear confirmation state.

The page should not be treated as “only for paid offerings”.

### Free hub / free event / free course UX

Required behavior:

- clearly confirm the booking or enrolment was recorded
- clearly state that no payment is required
- give the member confidence that the booking is effectively settled

Good messaging shape:

- `Your booking is confirmed`
- `No payment is required for this event`
- `You can review this in My Bookings at any time`

This matters because “free” still needs a success state, not an empty state.

## 2. Starter paid offerings

Starter next-steps pages should support:

- external payment URL only
- payment instructions only
- both together

This is now aligned with the shared external-payment model already in the product.

### Starter UX requirements

Required behavior:

- clearly state that the booking/enrolment is not fully confirmed yet if payment is still outstanding
- clearly state that payment happens outside the platform
- show the payment CTA when a URL exists
- show the payment instructions when instructions exist
- show both when both exist
- tell the member that the hub confirms the place after payment

Good messaging shape:

- `Your booking request has been recorded`
- `Complete payment to continue`
- `Your place will be confirmed once the hub verifies payment`

### Starter payment data handling

#### External link only

Show:
- `Continue to payment`
- supporting text about confirmation after payment

#### Instructions only

Show:
- no missing-link error state
- clear manual instructions panel
- text explaining how to pay and what reference/details to use

#### Link and instructions

Show:
- primary CTA
- instructions beneath it

## 3. Growth paid offerings

Growth should be handled explicitly even if native next-step payment is still being introduced progressively.

The page should not assume that because Growth is native, the next-step page is useless.

### Growth UX requirements

Required behavior:

- clearly confirm the booking/enrolment intent
- explain whether payment is already completed in-flow or still requires confirmation
- reflect the actual implemented payment state rather than idealized future behavior

If Growth booking/enrolment becomes fully native and synchronous:

- the next-steps page can act more like a confirmation page
- it should still link to `My Bookings`

Good messaging shape:

- `Your booking is confirmed`
- `Payment was completed in the platform`
- `You can review the latest status in My Bookings`

If Growth remains partially asynchronous for a period:

- the page should reflect that truthfully

## Offering-Type Differences

The page pattern should be shared, but event and course copy should adapt.

### Event-specific differences

Use language like:

- booking
- place
- event booking
- event date
- location

### Course-specific differences

Use language like:

- enrolment
- place on the course
- course schedule
- session/course timing

## Status Model Guidance

These pages should avoid shallow labels that do not explain the state.

Recommended member-facing meanings:

### Free confirmed

- `Confirmed`
- `No payment required`

### Starter paid pending

- `Booking request received`
- `Payment pending`
- `Awaiting confirmation`

### Growth confirmed

- `Confirmed`
- `Payment completed`

The exact internal data model can differ, but the page copy must make the journey obvious.

## Relationship To My Bookings

These pages do not replace `My Bookings`.

They complement it.

### Role of next-steps page

- immediate post-action guidance
- primary next action
- clear payment/confirmation expectations

### Role of My Bookings

- later tracking
- ongoing status visibility
- cancellation where allowed
- history

This distinction is important and should be preserved in the UX.

## Reusable Design Principles

The reusable page pattern must:

- feel like an operational page, not a marketing page
- avoid unnecessary decoration
- keep the primary action visible
- keep status, payment expectations, and next step tightly grouped

The page should not:

- use a large hero
- bury the CTA under long explanatory text
- force the member to infer whether they are confirmed

## Implementation Sequence

### Step 1: Shared page contract

Deliver:

- shared next-step page component contract
- shared status/content adapter interface

Acceptance criteria:

- event and course routes can render from the same layout system
- page shape stays consistent across offering types

### Step 2: Event next-steps page

Deliver:

- event route
- event-specific content adapter
- Free, Starter, and Growth handling

Acceptance criteria:

- free event bookings clearly confirm success and free payment state
- Starter paid event bookings clearly show external payment requirements
- Growth event bookings reflect implemented payment behavior truthfully

### Step 3: Course next-steps page

Deliver:

- course route
- course-specific content adapter
- Free, Starter, and Growth handling

Acceptance criteria:

- free course enrolments clearly confirm success and free payment state
- Starter paid course enrolments clearly show external/manual payment requirements
- Growth course enrolments reflect implemented payment behavior truthfully

### Step 4: Redirect integration from booking/enrolment actions

Deliver:

- offering actions redirect to the correct next-steps route instead of sending the member directly to generic `My Bookings`

Acceptance criteria:

- event booking flows land on the event next-steps page
- course enrolment flows land on the course next-steps page
- `My Bookings` remains the follow-up tracking destination

### Step 5: My Bookings follow-up polish

Deliver:

- ensure `My Bookings` still shows actionable status clearly after the member leaves the next-steps page

Acceptance criteria:

- pending-payment items remain understandable
- confirmed free items remain understandable
- members can still recover their place in the journey later

## Out Of Scope

This document does not introduce:

- Stripe implementation details
- recurring billing
- refund orchestration
- invoice workflows
- unified generic next-step routes
- modal-based confirmation flows

## Final Position

Dedicated event and course next-steps pages are the right solution.

They should:

- stay close to the offering
- avoid hero-heavy layouts
- focus on the primary next action
- handle Free, Starter, and Growth honestly
- support external payment links, payment instructions, or both on Starter
- send members to `My Bookings` only after the immediate next-step guidance has been handled
