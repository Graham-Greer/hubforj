# Event Multi-Attendee Booking Implementation Plan

Date: 2026-05-13
Owner: Hub Platform
Scope: `apps/hub-platform`
Status: Proposed implementation plan

## 1. Objective

Upgrade the event booking system so a single hub member can create one booking that contains multiple attendees, while keeping the booking owned by that member's hub account.

Primary example:
- A member books an event for:
  - themselves
  - their spouse
  - their child
- The booking appears once in the member account
- Admin reporting counts:
  - 1 booking
  - 3 attendees
  - total booking revenue
- Capacity is reduced by attendee count, not booking count
- Attendance is recorded per attendee, not just per booking

This plan covers:
- admin event configuration
- public event booking flow
- member account flow
- event payment flow
- registration and attendance operations
- payment ledger and reporting
- migration strategy
- rollout strategy
- testing and acceptance criteria

This plan does not implement code. It defines the design and delivery plan in full detail.

## 1.1 Locked Product Decisions

The following decisions are locked in:

- every booking must be created by a signed-in member
- one member can only hold one active booking for a given event
- `members-only` means:
  - only a member may place the booking
  - the booking may contain only that member as the single attendee
  - the member cannot add guest attendees
- group booking means:
  - the booking owner is still a member
  - the booking may include additional attendees
  - guest attendee emails are not required in v1
  - guest attendee first name and last name are required in v1
- only member-created group bookings are in scope
- group bookings are limited to the Growth package tier only
- Free and Starter hubs can only create events that behave as members-only single-attendee bookings
- we do not need to preserve legacy behavior as a long-term runtime model
- the implementation should be clean rather than compatibility-first
- guest attendee data must be stored for attendance and reporting
- partial attendee cancellation is required
- refunds must correctly account for partial attendee cancellation where eligible
- the product must be production-grade and marketplace-sound, not merely the simplest v1
- the implementation must provide explicit idempotency guarantees for:
  - repeated `checkout.session.completed`
  - async success/failure webhooks
  - refund events
  - booking cancellation while checkout is still open

These decisions supersede any earlier provisional wording elsewhere in this plan.

## 2. Current-State Audit

### 2.1 Core event registration model today

The current event registration system is built around one active registration per member user.

Relevant files:
- [`src/lib/data/event-registration-mutations.js`](/mnt/c/local/community-app/apps/hub-platform/src/lib/data/event-registration-mutations.js)
- [`src/lib/data/event-registration-queries.js`](/mnt/c/local/community-app/apps/hub-platform/src/lib/data/event-registration-queries.js)
- [`src/lib/data/event-registration-shared.js`](/mnt/c/local/community-app/apps/hub-platform/src/lib/data/event-registration-shared.js)
- [`src/lib/domain/registrations.js`](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/registrations.js)

Current behavior:
- `createEventRegistrationForMember(hubId, eventId, userId, actorId)` creates one registration document
- the registration is keyed to one `userId`
- duplicate active registration is blocked by `getEventRegistrationByUser(...)`
- capacity counts active registrations, not people
- attendance and payment state are attached directly to the registration row

Current write model fields include:
- `hubId`
- `eventId`
- `userId`
- `status`
- `paymentStatus`
- `attendanceStatus`
- `nativePaymentTransactionId`
- `nativePaymentStatus`
- `nativePaymentCheckoutUrl`
- `nativePaymentSessionId`
- timestamps and notes

This model assumes:
- one registration row = one attendee
- one registration row = one payment unit
- one registration row = one attendance unit

### 2.2 Public event booking flow today

Relevant files:
- [`src/app/(hub)/[hubSlug]/events/[eventSlug]/actions.js`](/mnt/c/local/community-app/apps/hub-platform/src/app/(hub)/[hubSlug]/events/[eventSlug]/actions.js)
- [`src/lib/domain/public-events.js`](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/public-events.js)
- [`src/components/sections/event-details-section/EventDetailsSection.jsx`](/mnt/c/local/community-app/apps/hub-platform/src/components/sections/event-details-section/EventDetailsSection.jsx)
- [`src/lib/domain/public-offering-next-steps.js`](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/public-offering-next-steps.js)

Current behavior:
- the public CTA decides whether the member should:
  - sign in
  - book now
  - join waitlist
  - view booking
- submitting the booking action:
  - requires a member session
  - creates one registration row for that member
  - redirects to Stripe checkout for internal paid events
  - otherwise redirects to event booking next steps

Key limitation:
- the booking action receives only:
  - `hubSlug`
  - `eventId`
  - `eventSlug`
- there is no attendee quantity
- there is no attendee detail collection
- there is no guest roster concept

### 2.3 Event payment model today

Relevant files:
- [`src/lib/server/event-registration-checkout.js`](/mnt/c/local/community-app/apps/hub-platform/src/lib/server/event-registration-checkout.js)
- [`src/lib/server/hub-payment-webhooks.js`](/mnt/c/local/community-app/apps/hub-platform/src/lib/server/hub-payment-webhooks.js)
- [`src/lib/data/native-payment-transactions.js`](/mnt/c/local/community-app/apps/hub-platform/src/lib/data/native-payment-transactions.js)
- [`src/lib/data/payment-records.js`](/mnt/c/local/community-app/apps/hub-platform/src/lib/data/payment-records.js)
- [`src/lib/data/hub-payments.js`](/mnt/c/local/community-app/apps/hub-platform/src/lib/data/hub-payments.js)

Current behavior:
- event checkout only supports one paid unit
- Stripe line items use `quantity: 1`
- metadata ties payment to one `registrationId`
- webhook reconciliation updates:
  - one native payment transaction
  - one registration payment state
  - one payment record

Current coupling:
- native transaction stores `registrationId`
- payment record stores `eventRegistrationId`
- Stripe webhook expects one `registrationId` for event booking reconciliation

This means the current payment model is registration-centric, not booking-centric.

### 2.4 Admin registrations and attendance today

Relevant files:
- [`src/components/patterns/event-registration-workspace/EventRegistrationWorkspace.jsx`](/mnt/c/local/community-app/apps/hub-platform/src/components/patterns/event-registration-workspace/EventRegistrationWorkspace.jsx)
- [`src/components/patterns/event-attendance-workspace/EventAttendanceWorkspace.jsx`](/mnt/c/local/community-app/apps/hub-platform/src/components/patterns/event-attendance-workspace/EventAttendanceWorkspace.jsx)
- [`src/lib/domain/registrations.js`](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/registrations.js)

Current behavior:
- admin registrations table renders one row per registration
- row identity is the member/user tied to the registration
- attendance transitions apply to registration rows
- registration summary cards count row totals:
  - total
  - registered
  - waitlisted
  - cancelled
  - payment attention
- attendance assumes a registration row represents one attendee

Key limitation:
- there is no concept of:
  - a booking owner separate from attendees
  - multiple attendees within one booking
  - attendee-level attendance under a shared booking

### 2.5 Member account and payment history today

Relevant files:
- [`src/components/patterns/member-bookings-workspace/MemberBookingsWorkspace.jsx`](/mnt/c/local/community-app/apps/hub-platform/src/components/patterns/member-bookings-workspace/MemberBookingsWorkspace.jsx)
- [`src/lib/domain/member-account.js`](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/member-account.js)
- [`src/lib/data/member-payments.js`](/mnt/c/local/community-app/apps/hub-platform/src/lib/data/member-payments.js)
- [`src/app/(hub)/[hubSlug]/account/bookings/actions.js`](/mnt/c/local/community-app/apps/hub-platform/src/app/(hub)/[hubSlug]/account/bookings/actions.js)

Current behavior:
- member bookings are built from registration rows
- each booking card assumes a single event or course registration
- cancellation is performed against a single registration id
- payment rollups assume one registration row per payable unit

This means any group-booking solution must change:
- the booking identity in member account
- the cancellation surface
- the payment rendering
- the booking summaries

### 2.6 Admin event creation/configuration today

Relevant files:
- [`src/components/patterns/event-form-fields/EventFormFields.jsx`](/mnt/c/local/community-app/apps/hub-platform/src/components/patterns/event-form-fields/EventFormFields.jsx)
- [`src/components/patterns/event-form-fields/event-form-config.js`](/mnt/c/local/community-app/apps/hub-platform/src/components/patterns/event-form-fields/event-form-config.js)
- [`src/app/(admin)/[hubSlug]/admin/events/create/actions.js`](/mnt/c/local/community-app/apps/hub-platform/src/app/(admin)/[hubSlug]/admin/events/create/actions.js)
- [`src/lib/data/event-mutations.js`](/mnt/c/local/community-app/apps/hub-platform/src/lib/data/event-mutations.js)
- [`src/lib/domain/events.js`](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/events.js)

Current behavior:
- admin can configure:
  - capacity
  - registration eligibility
  - pricing
  - waitlist
  - visibility
  - refund rules
- `registrationEligibility` supports:
  - `members-only`
  - `guests-allowed`

Important product gap:
- `guests-allowed` currently exists only as model vocabulary and display labeling
- it does not currently grant a real guest-booking capability
- the booking system still creates only one member-tied registration

## 3. Product Diagnosis

The current system uses the term "guests allowed", but the actual implementation is still "single member registration allowed".

That mismatch should be corrected as part of this upgrade.

There are two distinct business concerns that should not be merged into one field:
- who is allowed to place the booking
- how many attendees one booking may contain

These are separate product decisions.

Recommended separation:
- `registrationEligibility`
  - whether the event is:
    - members-only single-attendee
    - member-booked guest/group-eligible
- `bookingMode`
  - whether the event is single-attendee or group-booking enabled
- `maxAttendeesPerBooking`
  - the allowed attendee count ceiling for group-booking mode

Locked interpretation:
- `members-only` means the member cannot book guests
- therefore a `members-only` event always behaves as single-attendee booking

## 4. Recommended Target Product Model

### 4.1 Core principle

Use a two-layer model:
- **Booking** = the commercial/account object
- **Attendee** = the operational/person object

That means:
- the member account owns the booking
- the booking can contain multiple attendees
- capacity counts attendees
- payments are attached to the booking
- attendance is attached to attendees

### 4.2 Why this is the correct model

This model cleanly supports:
- group/family bookings
- one payment covering multiple attendees
- attendee-level attendance
- member-owned booking history
- future attendee management features
- clearer admin reporting
- safer partial-extension paths later

This model avoids the common mistake of storing only:
- `ticketQuantity`
- `guestNames[]`
on the existing registration row

That simpler approach would create long-term problems with:
- attendance
- refunds
- waitlist handling
- admin exports
- attendee editing
- potential future guest-to-member linking

## 5. Recommended Target Data Model

### 5.1 Event booking collection

Create a new child collection under an event:

- `hubs/{hubId}/events/{eventId}/bookings/{bookingId}`

Suggested booking fields:
- `id`
- `hubId`
- `eventId`
- `bookerUserId`
- `bookerNameSnapshot`
- `bookerEmailSnapshot`
- `bookingPolicySnapshot`
- `status`
  - `active`
  - `waitlisted`
  - `cancelled`
- `paymentStatus`
  - `not_required`
  - `pending`
  - `paid`
  - `failed`
  - `partially_refunded`
  - `refunded`
- `attendeeCount`
- `activeAttendeeCount`
- `waitlistedAttendeeCount`
- `cancelledAttendeeCount`
- `amountMinor`
- `amountDisplay`
- `currency`
- `pricingMode`
- `nativePaymentTransactionId`
- `nativePaymentStatus`
- `nativePaymentCheckoutUrl`
- `nativePaymentSessionId`
- `paymentCompletedAt`
- `notes`
- `createdAt`
- `updatedAt`
- `createdBy`
- `updatedBy`
- `cancelledAt`
- `cancelledByUserId`

Recommended snapshot fields on booking:
- `eventTitleSnapshot`
- `eventStartAtSnapshot`
- `eventEndAtSnapshot`
- `eventLocationSnapshot`
- `eventSlugSnapshot`
- `refundPolicySnapshot`
- `refundWindowModeSnapshot`
- `refundWindowHoursSnapshot`
- `pricingModeSnapshot`
- `priceSnapshot`
- `currencySnapshot`

Reason:
- member account and payment history should remain readable even if event content changes later
- commercial and support logic must not drift when event records are edited after booking creation

### 5.2 Event attendee subcollection

Create a child collection under each booking:

- `hubs/{hubId}/events/{eventId}/bookings/{bookingId}/attendees/{attendeeId}`

Suggested attendee fields:
- `id`
- `hubId`
- `eventId`
- `bookingId`
- `firstName`
- `lastName`
- `displayName`
- `email`
- `memberUserId`
- `relationshipLabel` optional
- `status`
  - `registered`
  - `waitlisted`
  - `cancelled`
- `attendanceStatus`
  - `pending`
  - `present`
  - `absent`
- `attendanceMarkedAt`
- `isPrimaryBooker`
- `unitAmountMinorSnapshot`
- `unitAmountDisplaySnapshot`
- `currencySnapshot`
- `refundPolicySnapshot`
- `refundWindowModeSnapshot`
- `refundWindowHoursSnapshot`
- `refundStatus`
  - `not_applicable`
  - `pending`
  - `refunded`
  - `not_refunded`
- `refundAmountMinor`
- `refundAmountDisplay`
- `refundedAt`
- `createdAt`
- `updatedAt`
- `cancelledAt`
- `cancelledByUserId`

Notes:
- `memberUserId` is optional
  - the spouse/child may not have hub member accounts
- `firstName` and `lastName` should be required
- `displayName` should be derived from first and last name
- `email` should remain optional and is not required for v1
- `isPrimaryBooker` should identify the booking owner attendee row when the owner is also attending
- guest identity data is required for attendance and reporting, so attendee records are not optional metadata
- for `members-only` events, the sole attendee must be the member booker and `isPrimaryBooker = true`
- for group-booking events, the booker may attend or may book only for other attendees

### 5.3 Event model additions

Add fields to event records:
- `bookingMode`
  - `single_attendee`
  - `multi_attendee`
- `maxAttendeesPerBooking`
  - integer
  - default `1`
- `guestDetailsMode`
  - `name_only`
  - `name_and_email`

Recommended defaults:
- `bookingMode = "single_attendee"`
- `maxAttendeesPerBooking = 1`
- `guestDetailsMode = "name_only"`

Package gating additions:
- `groupBookingsEnabled`
  - derived capability
  - true only on Growth

Required product rules:
- if hub package tier is Free or Starter:
  - force single-attendee member-only event booking behavior
- if hub package tier is Growth:
  - allow group booking configuration

Package-tier rule to apply consistently throughout this plan:
- `group booking` is a Growth-only capability
- `single attendee` / `members-only` booking is available on all tiers
- any reference to `multi-attendee` in this document should be interpreted as `group booking`, which is only valid on Growth

### 5.4 Clean implementation posture

Because the product is still in development, this upgrade should be implemented cleanly rather than preserving legacy event registration behavior.

Required implementation posture:
- stop treating the old registration-first event flow as the target architecture
- build new event booking behavior on the booking plus attendee model directly
- migrate or replace old event registration reads as part of the implementation
- do not design the new system around long-lived dual-model compatibility

The old registration structure may still exist temporarily during implementation, but it is not the intended runtime model once this upgrade lands.

## 6. Domain Rules and Invariants

### 6.1 Booking invariants

Required invariants:
- one booking belongs to one `bookerUserId`
- one booking belongs to one event
- one booking belongs to one active member account
- one booking has one or more attendees at creation time
- `attendeeCount` must equal the count of attendee rows created for the booking
- `activeAttendeeCount` must equal attendee rows not cancelled
- booking `status` must reflect attendee/commercial state, not one person's state only
- one member may have at most one active booking per event

Member uniqueness rule:
- active booking uniqueness should be enforced on:
  - `hubId`
  - `eventId`
  - `bookerUserId`
- an `active` or `waitlisted` booking for the same member and event blocks creation of another active booking
- a fully cancelled booking may allow a fresh booking later, depending on event timing and availability rules

Recommended booking status rules:
- `active`
  - at least one active registered attendee exists
- `waitlisted`
  - all attendees are waitlisted
- `cancelled`
  - all attendees are cancelled

Production requirement:
- mixed attendee lifecycle states must be supported where required by partial cancellation and partial refund flows
- however, waitlist promotion should still operate on coherent booking rules, not ad hoc mixed-party admission

### 6.2 Capacity rules

Capacity must be counted by active attendees, not bookings.

Replace logic equivalent to:
- count active registration rows

With:
- count active attendee rows

Waitlist decisions must use attendee count:
- if remaining capacity is 2 and party size is 3:
  - recommended behavior: entire booking goes to waitlist

Do not split one booking between registered and waitlisted attendees unless a later product phase explicitly supports split-party handling.

### 6.2.1 Capacity strategy and transaction boundaries

Recommended strategy:
- store attendee rows as the source of truth
- maintain event-level materialized attendee counts for performance and UX
- use Firestore transactions to keep write-time counters synchronized
- provide repair tooling to recompute counts from attendee rows if drift ever occurs

Why this is the best option:
- deriving all capacity live from attendee rows is conceptually clean, but expensive and awkward for high-frequency UI checks and operational summaries
- maintaining counts only as stored aggregates without a repair path is risky
- the best production approach is:
  - attendee rows are authoritative
  - materialized counts are optimized read helpers
  - repair tooling exists to reconcile drift

Recommended event-level derived counters:
- `registeredAttendeeCount`
- `waitlistedAttendeeCount`
- `cancelledAttendeeCount`
- `activeBookingCount`

Transaction boundary for booking creation:
- read event document
- validate package capability and booking policy
- validate no existing active booking for `(eventId, bookerUserId)`
- validate capacity against current materialized attendee counts
- create booking record
- create attendee records
- update event-level counters
- create uniqueness sentinel for `(eventId, bookerUserId)`
- commit in one transaction

Recommended uniqueness sentinel:
- `hubs/{hubId}/events/{eventId}/bookingBookers/{bookerUserId}`

Why:
- avoids query-based uniqueness races
- makes one-active-booking-per-member-per-event enforceable in a transaction

Transaction boundary for attendee cancellation:
- read booking
- read attendee
- read event counters
- validate cancellation state
- evaluate refund eligibility against attendee and booking snapshot fields
- update attendee lifecycle and refund state
- recompute booking aggregates
- update event counters delta
- if no active attendees remain:
  - update booking status to cancelled
  - release member uniqueness lock if product rules permit later rebooking
- commit in one transaction

Transaction boundary for admin/manual attendee status changes:
- read booking
- read targeted attendee
- mutate attendee status
- recompute booking aggregate counters/status
- update event aggregate counters if lifecycle state changed
- commit in one transaction

Repair tooling requirement:
- add an admin-safe reconciliation task that recomputes:
  - event attendee counts
  - booking aggregate counts
  - member uniqueness sentinel validity
from attendee and booking rows

### 6.3 Payment rules

Payment must be booking-based:
- one booking
- one total amount
- one checkout transaction
- one payment record

Formula:
- total = unit event price × attendee count

Refund formula requirement:
- refund calculations must support attendee-level partial refund totals
- booking payment records must support:
  - full refund
  - partial refund
- attendee-level refund state must roll up cleanly to booking-level refund state

For free events:
- booking `paymentStatus = not_required`

For external paid events:
- booking still records amount and attendee count
- member is guided to external payment/instructions as today
- admin sees one booking with attendee count and one payment-follow-up state
- attendee-level cancellation is still supported
- capacity is still released per cancelled attendee immediately
- external refunds are not executed automatically by Hubforj
- admin must record the refund outcome operationally against the cancelled attendee(s) and booking
- booking financial state for external payments should therefore support:
  - cancelled with no refund
  - cancelled with partial refund recorded
  - cancelled with full refund recorded
- member-facing booking screens must clearly explain that refund handling is managed by the organiser for external payments

For internal paid events:
- Stripe checkout uses booking amount
- Stripe metadata references booking id, not attendee id

### 6.4 Attendance rules

Attendance must be attendee-based:
- admin marks each attendee present/absent/pending

Do not attach final attendance outcome only at booking level.

Booking-level attendance summaries may be derived:
- 3 attendees
- 2 present
- 1 absent

### 6.5 Cancellation and refund rules

Production requirement:
- partial attendee cancellation is supported
- capacity is released per cancelled attendee
- refund logic is evaluated per cancelled attendee
- booking aggregates and payment state roll up from attendee outcomes

Required behaviors:
- cancelling one attendee should:
  - mark that attendee cancelled
  - release exactly one attendee space
  - evaluate refund eligibility against the attendee's booking/payment context
  - update booking totals and statuses
- cancelling all attendees should:
  - cancel the booking
  - release all remaining attendee spaces
  - mark booking refund/payment state appropriately

Recommended booking payment status model:
- `not_required`
- `pending`
- `paid`
- `failed`
- `partially_refunded`
- `refunded`

Do not introduce a second booking-level refund enum unless a later implementation phase proves it is necessary.

Recommended rule:
- booking payment state plus stored money totals should be treated as the commercial source of truth:
  - `amountMinor`
  - `paidTotalMinor`
  - `refundTotalMinor`
  - `outstandingTotalMinor`

Attendee-level refund state may still exist for operational clarity, but booking-level reporting and ledger interpretation should be driven by payment status plus amounts.

Late payment rule:
- cancellation wins over any later payment callback once cancellation is committed in platform state
- if checkout completes after a booking or all remaining attendees were cancelled:
  - do not reactivate the booking automatically
  - do not reactivate cancelled attendees automatically
  - mark the payment outcome as a reconciliation-required anomaly
  - create or require refund follow-up where money was captured against a no-longer-valid booking

This is materially more complex than whole-booking cancellation only, but it is the correct marketplace-grade behavior and should be treated as a requirement.

## 7. Admin Product Changes

### 7.1 Event create/edit form

Add a new section or subsection under registration/payment:

Fields to add:
- `bookingMode`
  - label: `Booking mode`
  - options:
    - `Single attendee only`
    - `Allow multiple attendees in one booking`
- `maxAttendeesPerBooking`
  - label: `Maximum attendees per booking`
  - shown only when group-booking mode is selected
  - integer, min `2`
- optional future:
  - `Guest details required`
    - `Name only`
    - `Name and email`

Field relationships:
- if `bookingMode = single_attendee`
  - force `maxAttendeesPerBooking = 1`
- if `registrationEligibility = members-only`
  - force `bookingMode = single_attendee`
  - force `maxAttendeesPerBooking = 1`
- if hub package tier is not Growth
  - hide or disable group-booking options
  - enforce member-only single-attendee configuration server-side

### 7.2 Rename/reframe current eligibility language

The current labels:
- `Members only`
- `Guests allowed`

are too ambiguous relative to actual booking behavior.

Recommended replacement labels:
- `Only members may place bookings`
- `Members may place bookings for guests`

Internal values may remain if migration pressure is high, but user-facing copy should become clearer.

### 7.3 Admin event registrations workspace

Current view is registration-row based.

Target booking workspace should include:
- one row per booking
- columns:
  - Booker
  - Attendees
  - Booking status
  - Payment status
  - Amount
  - Created on
- expandable details panel or drill-in view showing:
  - attendee names
  - attendee statuses
  - attendee attendance states
  - attendee refund states where relevant

Summary cards should change from:
- total registrations
- registered
- waitlisted
- cancelled

To:
- total bookings
- total attendees
- confirmed attendees
- waitlisted attendees
- cancelled attendees
- payment attention bookings

### 7.4 Admin attendance workspace

Attendance should become attendee-first.

Columns:
- Attendee name
- Booker name
- Attendance status
- Booking/payment context if useful

Summary cards:
- total attendees
- present
- absent
- pending

Do not make attendance cards booking-count based once group booking is live.

## 8. Member Product Changes

### 8.1 Public event detail CTA flow

When group booking is enabled:
- CTA still begins from the event page
- CTA routes into a booking form instead of immediately creating one attendee row

Form inputs:
- attendee quantity
- attendee first names
- attendee last names
- whether the booker is included as one of the attendees

Rules:
- for `members-only` events:
  - do not show group-booking inputs
  - do not show guest attendee rows
  - do not ask whether the booker is attending
  - create exactly one attendee, which is the member booker
- for group-booking events:
  - allow the booker to indicate whether they are one of the attendees
  - if the booker is attending, create one attendee row for the booker plus any additional attendee rows
  - if the booker is not attending, allow all attendee rows to be guest attendees
  - do not require guest email collection in v1; collect guest first and last name only

Recommended UX:
1. member chooses quantity
2. system renders attendee rows
3. member enters attendee details
4. system shows total price and summary
5. member confirms booking
6. booking is created
7. if internal paid event, checkout starts for total amount
8. next steps page reflects booking-level status

### 8.2 Member My Bookings view

Current view is one row/card per registration.

Target view should become one card per booking.

Card content:
- event title
- date/location
- booking status
- payment status
- attendee count
- attendee preview list
- total amount
- partial refund status where applicable
- primary action:
  - view booking details
  - complete payment
  - restart checkout
- secondary action:
  - manage attendees
  - cancel attendee
  - cancel booking if all attendees are being cancelled

### 8.3 Member booking detail / next steps

The next steps page should become booking-specific.

It should show:
- booking owner
- attendee count
- attendee names
- attendee lifecycle statuses
- total price
- payment state
- payment instructions or checkout action

Do not model this page as one attendee booking once group booking support exists.

## 9. Payment and Stripe Upgrade Design

### 9.1 Native payment transaction model

Current native transaction stores:
- `registrationId`

Target event booking payment transaction should store:
- `bookingId`
- `attendeeCount`
- `unitAmountMinor`
- `unitAmountDisplay`
- `refundableAttendeeCount`

Retain:
- `eventId`
- `eventTitle`
- `userId`
- `paymentRecordId`

### 9.2 Payment record model

Current payment record stores:
- `eventRegistrationId`

Target:
- add `eventBookingId`
- retain `eventId`
- remove direct dependency on `eventRegistrationId` for new writes

Suggested additions:
- `eventBookingId`
- `attendeeCount`
- `unitAmountMinor`
- `unitAmountDisplay`
- `refundedAttendeeCount`

### 9.3 Checkout behavior

Current Stripe event checkout:
- line items quantity = 1
- metadata includes `registrationId`

Target checkout:
- one booking checkout
- line item quantity should equal attendee count using one per-ticket line item

Recommended pattern:
- one line item
- `quantity = attendeeCount`
- `unit_amount = event ticket price`

Reason:
- better Stripe-side commercial semantics
- easier downstream reasoning if itemization matters later

Checkout metadata should include:
- `kind = event_booking`
- `hubId`
- `hubSlug`
- `bookerUserId`
- `eventId`
- `eventSlug`
- `bookingId`
- `attendeeCount`
- `nativePaymentTransactionId`

### 9.4 Webhook reconciliation

Current webhook expects:
- `registrationId`

Target webhook must reconcile:
- booking transaction
- booking payment status
- payment record

Attendee rows should not each receive separate Stripe states.

Recommended rule:
- booking owns payment state
- attendee rows inherit booking payment context operationally

### 9.5 Explicit idempotency guarantees

The implementation must provide explicit idempotency guarantees for all payment and cancellation paths.

Required guarantees:
- repeated `checkout.session.completed`
  - must not duplicate booking payment transitions
  - must not duplicate ledger updates
  - must not duplicate refund eligibility changes
  - must not recreate attendee rows
  - must not revive cancelled attendees or cancelled bookings
- async success/failure events
  - must preserve final transaction state correctly
  - must not regress a completed payment to a weaker state after a later duplicate event
  - must respect booking-state precedence rules when cancellation has already committed
- refund events
  - must be safe to replay
  - must not double-apply refund totals
  - must not double-cancel attendee or booking financial state
- booking cancellation while checkout is still open
  - must either:
    - expire/close the checkout cleanly and mark the transaction cancelled
    - or safely reconcile a late webhook if Stripe completes after cancellation intent
  - cancellation must win over late payment success
  - late successful payment after committed cancellation must route into refund/reconciliation handling, not booking reactivation

Implementation requirements:
- every native transaction update must be monotonic
- every webhook handler must be replay-safe
- every refund mutation must persist external refund identifiers
- booking and attendee refund application must be guarded against duplicate application

Recommended technical approach:
- use transaction status precedence rules
- persist Stripe object ids:
  - checkout session id
  - payment intent id
  - refund id
- maintain idempotent update guards on payment-record writes
- ensure cancellation services and webhooks both consult current transaction and booking state before mutating

## 10. Capacity, Waitlist, and Availability Rules

### 10.1 Availability decision

Capacity must consider party size.

Example:
- capacity remaining: 2
- requested attendees: 3
- if waitlist allowed:
  - whole booking becomes waitlisted
- if waitlist not allowed:
  - booking is blocked

Do not partially register a party and partially waitlist the rest unless a later product phase explicitly supports split-party handling.

This is an intentional product rule:
- preserve booking-party integrity over maximum seat utilisation
- avoid mixed confirmed/waitlisted attendee states inside one booking
- accept that a party larger than remaining capacity may leave some spaces temporarily unsold rather than splitting the group automatically

### 10.2 Public availability labels

Current labels like:
- `1 space left`
- `7 spaces left`

should continue to reflect attendee spaces, not bookings.

### 10.3 Admin summaries

Admin summaries must report both:
- booking counts
- attendee counts

These are no longer interchangeable metrics.

## 11. Read Model and Query Changes

### 11.1 Event booking queries to add

Add booking query layer equivalents:
- `listEventBookings(hubId, eventId)`
- `getEventBookingById(hubId, eventId, bookingId)`
- `listEventBookingsByBooker(hubId, userId)`
- `countRegisteredEventAttendees(hubId, eventId)`
- `listEventAttendees(hubId, eventId)`

### 11.2 Aggregation helpers to add

Add domain helpers:
- `summarizeBookings(bookings)`
- `summarizeAttendees(attendees)`
- `countActiveAttendees(bookings|attendees)`
- `resolveInitialEventBookingStatus(event, activeAttendeeCount, requestedAttendeeCount)`

### 11.3 Member account adapters

Replace direct registration-row assumptions with booking read models:
- one member booking item per booking
- event booking card can render attendee preview and total amount

## 12. Migration and Implementation Posture

### 12.1 Recommended implementation posture

Implement the new event booking architecture cleanly and directly.

Required approach:
- new event bookings should use booking and attendee records only
- event capacity, payment, member bookings, admin registrations, and attendance should move to the new model
- do not preserve a long-term registration-first runtime

### 12.2 Transitional development reality

During implementation there may be temporary transitional code, but the target shipped model should be:
- booking-first
- attendee-based capacity and attendance
- booking-based payment and member history

### 12.3 Historical data treatment

Because the product is still in development:
- historical registration data does not need a permanent compatibility adapter strategy
- if lightweight migration is needed for local/dev verification, that is acceptable
- do not let historical-registration preservation drive core design complexity

## 13. Rollout Plan

### Phase 1. Data-contract groundwork

Implement:
- event schema additions
- booking and attendee domain models
- booking query/mutation layer
- transaction and idempotency primitives

No UI rollout yet.

### Phase 2. Admin configuration

Implement:
- booking mode fields on event create/edit
- clearer eligibility wording
- validation for `maxAttendeesPerBooking`
- Growth-only package gating

Keep booking experience unchanged until public flow is ready.

### Phase 3. Public booking flow

Implement:
- group-booking form
- booking creation service
- booking-based external payment flow
- booking-based internal Stripe checkout

### Phase 4. Member account flow

Implement:
- booking-centric member bookings
- booking next steps
- partial attendee cancellation
- booking-level cancellation when all attendees are removed

### Phase 5. Admin registrations and attendance

Implement:
- booking-centric registrations workspace
- attendee-centric attendance workspace

### Phase 6. Payment/reporting consolidation

Implement:
- payment ledger alignment
- admin payments detail support for event bookings
- revenue and attendee summaries
- partial refund accounting

### Phase 7. Cleanup

Implement:
- remove old registration-first assumptions where no longer required
- optional historical registration cleanup if still present in local/dev data

## 14. Validation and Test Plan

### 14.1 Domain tests

Add tests for:
- attendee-based capacity counting
- booking status derivation
- waitlist whole-party behavior
- booking total calculation
- cancellation rules
- partial attendee cancellation deltas
- booking uniqueness by member and event

### 14.2 Data-layer tests

Add tests for:
- create event booking with attendees
- count active attendees correctly
- list member bookings by booker
- update booking aggregates correctly after attendee cancellation
- enforce one active booking per member per event

### 14.3 Payment tests

Add tests for:
- Stripe checkout metadata uses `bookingId`
- line item quantity equals attendee count
- webhook reconciliation updates booking payment state
- payment record uses `eventBookingId`
- refund path updates booking and ledger correctly
- repeated `checkout.session.completed` is replay-safe
- async success/failure webhooks preserve final transaction precedence
- refund webhooks are replay-safe
- booking cancellation while checkout is open resolves safely

### 14.4 Member UX tests

Add tests for:
- member can create a group booking on Growth
- member cannot create a group booking on Free or Starter
- member sees one booking with attendee count
- next steps page is booking-based
- member can cancel one attendee
- member can cancel all attendees

### 14.5 Admin UX tests

Add tests for:
- event form surfaces booking mode fields correctly
- package gating prevents non-Growth group booking configuration
- admin registrations show bookings and attendee counts
- admin attendance shows attendee rows
- admin summaries distinguish bookings from attendees

### 14.6 Regression tests

Protect:
- free events
- paid external events
- paid internal Stripe events
- waitlist flow
- cancellation flow
- member payment history
- admin payment detail views

## 15. Reporting Model Changes

The system must distinguish at least these metrics:
- total bookings
- total attendees
- registered attendees
- waitlisted attendees
- cancelled attendees
- gross booking revenue
- paid booking revenue
- refunded booking revenue
- partially refunded booking revenue
- average attendees per booking

Admin event dashboards should not conflate:
- booking count
- attendee count

Member account should show:
- booking total
- not attendee unit price only

## 16. Production-Grade V1 Scope

V1 should include:
- member-owned group bookings
- attendee first and last names
- attendee-based capacity
- booking-based payment
- attendee-based attendance
- partial attendee cancellation
- attendee-level refund handling
- booking-level rolled-up refund state

V1 should not include:
- split-payment bookings
- transferring one attendee to another booker
- booking editing after payment
- guest self-management without the booker

## 17. Naming Recommendation

To reduce confusion in code and product copy:

Use:
- `eventBooking`
- `eventBookingAttendee`

Do not continue to use `registration` as the primary write model for new group-booking event flows.

Reason:
- "registration" in the current codebase semantically means:
  - one user
  - one attendee
  - one payment unit
- introducing party booking under the same name will create avoidable confusion

## 18. Engineering Recommendation

From a senior software engineer perspective, the best path is:

1. Do not extend the current registration row with only quantity or guest arrays
2. Introduce a proper booking plus attendee model
3. Make payment booking-based
4. Make capacity and attendance attendee-based
5. Remove dependence on long-term legacy registration compatibility
6. Support partial attendee cancellation and refund handling as a production-grade requirement
7. Treat attendee rows as the source of truth and materialized counters as optimized projections with repair tooling

This gives the system a stable long-term foundation while still meeting marketplace-grade booking expectations.

## 19. Concrete File Areas Likely Impacted In Implementation

Data/domain:
- `src/lib/data/event-registration-*`
- `src/lib/domain/registrations.js`
- `src/lib/domain/public-events.js`
- `src/lib/domain/public-offering-next-steps.js`
- `src/lib/domain/member-account.js`
- `src/lib/data/member-payments.js`
- `src/lib/data/hub-payments.js`
- `src/lib/data/payment-records.js`
- `src/lib/data/native-payment-transactions.js`
- `src/lib/server/event-registration-checkout.js`
- `src/lib/server/hub-payment-webhooks.js`
- `src/lib/server/event-registration-cancellation.js`

Admin surfaces:
- `src/components/patterns/event-form-fields/*`
- `src/app/(admin)/[hubSlug]/admin/events/create/*`
- `src/app/(admin)/[hubSlug]/admin/events/[eventId]/*`
- `src/components/patterns/event-registration-workspace/*`
- `src/components/patterns/event-attendance-workspace/*`

Public/member surfaces:
- `src/app/(hub)/[hubSlug]/events/[eventSlug]/*`
- `src/components/sections/event-details-section/*`
- `src/components/patterns/offering-next-steps-workspace/*`
- `src/app/(hub)/[hubSlug]/account/bookings/*`
- `src/components/patterns/member-bookings-workspace/*`

Tests:
- `tests/unit/event-*`
- `tests/unit/registrations-*`
- `tests/unit/member-bookings-*`
- `tests/unit/payments-*`

## 20. Delivery Readiness Gate

Do not ship until all of the following are true:
- one member can create one booking with multiple attendees
- one member cannot create more than one active booking for the same event
- capacity decrements by attendee count
- admin registrations distinguish bookings from attendees
- attendance works per attendee
- internal paid events charge the correct total
- external paid events preserve correct booking totals and follow-up state
- member bookings show one booking row, not one attendee row
- cancellation behavior is clear and safe at both attendee and booking levels
- payment and revenue reporting remain coherent
- event edits do not create drift between:
  - member next steps
  - admin exports
  - refunds
  - support screens
- webhook replay and late-event scenarios are idempotent and safe

## 21. Snapshot Versus Live Data Strategy

This plan must explicitly prevent drift when events are edited after bookings exist.

### 21.1 Principle

Use a hybrid model:
- commercial and audit-critical fields are snapshotted at booking and attendee creation time
- operational presentation fields may remain live where that improves customer communication without corrupting audit history

### 21.2 Fields that should be snapshotted

The following should be snapshotted because they affect payments, refunds, reporting, or support reconciliation:
- event title at booking time
- event slug at booking time
- event location at booking time
- event scheduled start and end timestamps at booking time
- pricing mode at booking time
- unit price at booking time
- currency at booking time
- refund policy at booking time
- refund window mode at booking time
- refund window hours at booking time
- booking policy at booking time
- registration eligibility mode at booking time
- whether the event was members-only or group-booking-enabled at booking time
- max attendees per booking at booking time
- attendee unit pricing context

These snapshots should drive:
- refunds
- payment record interpretation
- support investigation
- exports intended as historical records

### 21.3 Fields that may remain live

The following may remain live for customer-facing operational clarity:
- event long description
- hero/public marketing copy
- cover image
- public logistical notes intentionally updated before the event
- joining instructions
- operational reminders
- facilitator/speaker updates

These should inform:
- current public event page
- current reminder/support context

### 21.4 Read model rules

Member booking details should clearly separate:
- booked details
  - the details in effect when the booking was made
- current event details
  - the latest live details for attending

Product rule:
- commercial, refund, ledger, support-investigation, and historical export flows must always use snapshot values
- operational next-steps, reminder, and attendance-preparation flows may use current live event values where helpful
- if a live operational field that matters to attendance changes after booking, the member and admin experience should indicate that details were updated after booking

Admin support views should show both where useful:
- snapshot values for audit and refund reasoning
- live values for current event operations

Exports should be explicit:
- historical finance/export rows should use snapshot values
- operational attendance lists may use live event headings plus attendee rows
- default attendee exports should include:
  - attendee first name
  - attendee last name
  - display name
  - booker name
  - attendee status
  - attendance status
- guest email should not be required for v1 and should not appear in default exports unless explicitly present and the export use case specifically needs it

This is the safest approach because it avoids:
- refund logic drifting when event pricing or refund policy changes later
- support confusion when titles or locations are edited
- member next steps becoming historically misleading

## 22. Final Implementation Decisions Locked For Build

The following decisions are now locked and should not be re-opened during implementation without an explicit product review:

- `members-only` events always create exactly one attendee, which is the member booker
- group-booking events may be booked by a member who is or is not one of the attendees
- one member may have only one active or waitlisted booking per event
- attendee rows are the operational source of truth
- materialized event counters are performance projections and must be maintained transactionally with repair tooling available
- booking payment state plus stored money amounts are the commercial source of truth
- late successful payment after committed cancellation never reactivates a booking automatically
- whole-party integrity is preserved; the platform does not split one booking across registered and waitlisted states
- guest first name and last name are required for guest attendees
- guest email is optional in v1 and excluded from default exports unless explicitly needed
- commercial and audit-critical event fields are snapshotted at booking time
- operational event fields may remain live, with updated-after-booking signalling where relevant

Implementation choices that still need build-time design, but not product re-decision:

- whether attendee uniqueness inside one booking is enforced only by row identity or also by duplicate-name heuristics
- whether a cancelled attendee can be reactivated inside the same booking or must be re-added through a booking edit flow
- whether waitlisted group bookings preserve original attendee ordering for promotion logic
