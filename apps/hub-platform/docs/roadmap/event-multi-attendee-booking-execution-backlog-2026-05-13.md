# Event Multi-Attendee Booking Execution Backlog

Status:
- Proposed execution backlog
- Companion to the production-grade event booking architecture plan

Date:
- 2026-05-13

Authority:
- [Event Multi-Attendee Booking Implementation Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/event-multi-attendee-booking-implementation-plan-2026-05-13.md)

Purpose:
- convert the approved product/architecture plan into an executable engineering backlog
- define the safest implementation order
- make write ownership, read ownership, and rollout boundaries explicit before code changes begin

## 1) Executive delivery position

This upgrade should be delivered in deliberate phases, with the domain model and write rules landing before any booking UI changes.

The safest sequence is:

1. introduce the new event booking domain model and data contracts
2. implement transactional write services and aggregate maintenance
3. implement payment/idempotency primitives around the new booking model
4. add Growth-only admin configuration for group booking
5. switch public member booking to the booking-plus-attendee flow
6. switch member account, admin registrations, and attendance to booking/attendee reads
7. complete reporting, exports, refunds, and cleanup

This avoids designing screens on top of unstable behavior and reduces the risk of oversell, duplicate payment handling, and inconsistent reporting.

## 2) Non-negotiable implementation rules

These rules are already locked by the implementation plan and should be treated as delivery constraints:

- every booking is placed by a signed-in member
- `members-only` means exactly one attendee, and that attendee is the member booker
- group booking is Growth-only
- Free and Starter hubs can only use members-only single-attendee event booking
- one member can only hold one active or waitlisted booking per event
- attendee rows are the operational source of truth
- booking payment state plus money totals are the commercial source of truth
- event aggregate counters are optimized projections maintained transactionally and repairable
- cancellation wins over late payment success
- whole-party integrity is preserved; the platform does not split one booking into mixed confirmed/waitlisted states
- guest first name and last name are required for guest attendees
- guest email is not required in v1

## 3) Phase-by-phase backlog

## Phase 1. Domain model and schema foundation

Objective:
- establish the new write model cleanly before any UI or payment migration work begins

Primary outputs:
- booking schema contract
- attendee schema contract
- event schema additions
- shared status enums and derived-state helpers
- deterministic path and id conventions

Implementation tasks:

1. Define booking document contract
- add code-level contract/normalizer for:
  - `eventBooking`
  - booking status
  - booking payment status
  - booking snapshot fields
  - booking aggregate counters

2. Define attendee document contract
- add code-level contract/normalizer for:
  - `eventBookingAttendee`
  - attendee lifecycle status
  - attendance status
  - attendee-level refund fields

3. Extend event contract
- add:
  - `bookingMode`
  - `maxAttendeesPerBooking`
  - `guestDetailsMode`
  - package-aware eligibility helpers

4. Define package gating contract
- add one clear package capability helper for:
  - whether group booking is allowed for the hub
- make this reusable by:
  - event create/edit validation
  - public booking actions
  - member booking reads

5. Define snapshot contract
- codify which event fields are snapshotted at booking time
- codify which fields remain live

Likely file impact:
- `src/lib/domain/events.js`
- `src/lib/domain/public-events.js`
- `src/lib/domain/registrations.js`
- `src/lib/domain/member-account.js`
- new files under `src/lib/domain/` or `src/lib/data/` for `event-bookings`
- `src/components/patterns/event-form-fields/event-form-config.js`

Definition of done:
- new domain objects and enums exist in code
- package gating is representable without UI logic branching ad hoc
- no write path yet depends on legacy registration-first assumptions for the new model

## Phase 2. Transactional data-layer services

Objective:
- build the Firestore write/read services that own booking state and capacity safely

Primary outputs:
- create booking transaction
- cancel attendee transaction
- cancel booking transaction
- waitlist booking transaction
- aggregate counter maintenance
- uniqueness sentinel handling

Implementation tasks:

1. Create booking repository/service layer
- create read/write primitives for:
  - create booking
  - create attendees
  - fetch booking by id
  - fetch active booking by `(eventId, bookerUserId)`
  - list attendees by booking

2. Implement create-booking transaction
- transaction must:
  - validate event eligibility and package rules
  - validate one active/waitlisted booking per member per event
  - validate party size against booking mode
  - compute whether booking is active, waitlisted, or blocked
  - create uniqueness sentinel
  - create booking doc
  - create attendee docs
  - update event aggregate counters

3. Implement attendee-cancellation transaction
- transaction must:
  - validate attendee belongs to target booking
  - change attendee status
  - release capacity
  - recalculate booking counters
  - recalculate booking totals/refund eligibility
  - cancel booking when no active/waitlisted attendees remain
  - update event aggregate counters

4. Implement booking-cancellation transaction
- transaction must:
  - cancel all active/waitlisted attendees
  - cancel booking
  - release all capacity
  - preserve idempotency if already cancelled

5. Implement waitlist and promotion logic
- whole booking joins waitlist or is blocked
- promotion acts at booking level, not attendee fragment level

6. Implement repair/reconciliation support
- add service utilities to:
  - recalc booking counters from attendee rows
  - recalc event counters from booking/attendee rows

Likely file impact:
- new files under `src/lib/data/`:
  - `event-booking-mutations.js`
  - `event-booking-queries.js`
  - `event-booking-shared.js`
  - `event-booking-aggregates.js`
- possible replacement/deprecation path for:
  - `src/lib/data/event-registration-mutations.js`
  - `src/lib/data/event-registration-queries.js`
  - `src/lib/data/event-registration-shared.js`

Definition of done:
- one service layer owns booking writes
- capacity, waitlist, and uniqueness are transactionally enforced
- attendee rows are the operational truth
- aggregate drift can be repaired from source rows

## Phase 3. Payment and idempotency primitives

Objective:
- make the new booking model safe under Stripe/external payment realities before exposing it publicly

Primary outputs:
- booking-based native payment checkout
- booking-based transaction linkage
- replay-safe webhook handling
- attendee-aware refund rollups

Implementation tasks:

1. Replace registration-centric checkout ownership
- checkout creation must target `bookingId`, not `registrationId`
- Stripe metadata must carry:
  - `hubId`
  - `eventId`
  - `bookingId`
  - payment intent/session identifiers as needed

2. Update native transaction model
- ensure native payment transactions can represent:
  - pending booking checkout
  - successful payment
  - failed payment
  - partial refund
  - full refund
  - reconciliation-required anomaly after late payment

3. Implement webhook precedence rules
- repeated `checkout.session.completed` is replay-safe
- async failures do not regress a stronger terminal state
- refund events do not double-apply money or status transitions
- cancellation after checkout initiation but before success remains authoritative

4. Implement booking-level financial rollups
- booking `paymentStatus` and money totals must update from:
  - payment success
  - attendee cancellation
  - refund application

5. Implement external payment operational model
- external payments do not auto-refund
- attendee cancellation still releases capacity
- admin-recorded refund outcomes update booking financial interpretation

Likely file impact:
- `src/lib/server/event-registration-checkout.js` or replacement booking-centric module
- `src/lib/server/hub-payment-webhooks.js`
- `src/lib/data/native-payment-transactions.js`
- `src/lib/data/payment-records.js`
- `src/lib/data/hub-payments.js`
- any event next-steps or booking-payment helpers

Definition of done:
- payments are booking-owned
- webhook retries are safe
- cancellation beats late payment success
- booking financial state remains internally consistent after attendee-level changes

## Phase 4. Admin event configuration

Objective:
- expose the correct event-booking controls to admins with package-aware enforcement

Primary outputs:
- event form booking controls
- validation rules
- Growth-only gating

Implementation tasks:

1. Add booking configuration fields to event create/edit
- `bookingMode`
- `maxAttendeesPerBooking`
- `guestDetailsMode`

2. Apply eligibility/booking coupling
- `members-only` forces:
  - `bookingMode = single_attendee`
  - `maxAttendeesPerBooking = 1`

3. Apply package gating
- if package is not Growth:
  - hide/disable group-booking controls
  - enforce server-side rejection if bypass attempted

4. Update admin copy
- make the difference between:
  - who may book
  - how many attendees a booking may contain
  explicit in form labels and helper text

Likely file impact:
- `src/components/patterns/event-form-fields/EventFormFields.jsx`
- `src/components/patterns/event-form-fields/event-form-config.js`
- `src/app/(admin)/[hubSlug]/admin/events/create/actions.js`
- `src/lib/data/event-mutations.js`
- `src/lib/domain/events.js`

Definition of done:
- Growth-only group booking is enforceable from both UI and server
- Free/Starter cannot create guest/group-bookable events

## Phase 5. Public member booking flow

Objective:
- replace the single-registration public event flow with booking-plus-attendee creation

Primary outputs:
- booking form for Growth group-booking events
- single-attendee members-only flow on all tiers
- booking creation action
- booking-aware next steps

Implementation tasks:

1. Replace event booking action ownership
- public event booking actions should call new booking services
- old registration creation path should no longer be the primary owner for event booking

2. Build members-only booking path
- signed-in member books exactly one attendee: self
- free, external paid, and internal paid must all use the new booking record

3. Build group-booking form path
- only available on Growth when event config allows it
- collect attendee quantity and guest first/last name
- optionally include or exclude booker as attendee
- show pricing summary from attendee count

4. Wire booking-based payment continuation
- free events complete immediately
- internal paid events launch checkout
- external paid events route to external instructions/payment flow

5. Update next steps/read model
- member sees booking-centric status, attendee list, and payment context

Likely file impact:
- `src/app/(hub)/[hubSlug]/events/[eventSlug]/actions.js`
- event booking form components under `src/components/patterns/`
- `src/lib/domain/public-events.js`
- `src/lib/domain/public-offering-next-steps.js`

Definition of done:
- public event booking no longer creates direct registration rows as the primary model
- all new event bookings are booking-owned and attendee-backed

## Phase 6. Member account migration to booking reads

Objective:
- make member-facing booking history align with the new domain model

Primary outputs:
- one booking card per event booking
- attendee-aware booking detail
- attendee-level cancellation controls

Implementation tasks:

1. Replace member booking queries
- member bookings must be listed by `bookerUserId`
- member booking detail must load attendees and rolled-up payment state

2. Replace member cancellation actions
- allow cancel one attendee
- allow cancel all attendees through booking-wide result
- reflect refund and capacity consequences correctly

3. Update booking summaries
- attendee count
- attendee names preview
- payment/refund state
- current operational event details vs booked snapshot details

Likely file impact:
- `src/lib/domain/member-account.js`
- `src/lib/data/member-payments.js`
- `src/app/(hub)/[hubSlug]/account/bookings/actions.js`
- `src/components/patterns/member-bookings-workspace/`

Definition of done:
- member account no longer models event booking as one registration row
- attendee-level cancellation works from the member side

## Phase 7. Admin registrations and attendance migration

Objective:
- move admin operations onto booking/attendee reads cleanly

Primary outputs:
- booking-centric registrations workspace
- attendee-centric attendance workspace

Implementation tasks:

1. Replace admin registrations workspace
- one row per booking
- attendee counts and attendee drill-in
- booking/payment status surfaced clearly

2. Replace admin attendance workspace
- attendee rows are first-class
- booker context visible
- attendance marking is attendee-based

3. Update admin summary cards
- bookings and attendees counted separately
- waitlisted/cancelled attendee totals visible

Likely file impact:
- `src/components/patterns/event-registration-workspace/EventRegistrationWorkspace.jsx`
- `src/components/patterns/event-attendance-workspace/EventAttendanceWorkspace.jsx`
- `src/lib/domain/registrations.js`

Definition of done:
- admin can manage event operations without relying on one-registration-equals-one-person assumptions

## Phase 8. Reporting, exports, and support tooling

Objective:
- finish the product as a trustworthy operational system, not just a new booking form

Primary outputs:
- booking-aware payment/reporting reads
- attendee-aware exports
- support/audit surfaces for snapshot vs live event data

Implementation tasks:

1. Update payment/reporting reads
- ensure event revenue and attendee counts align with booking + attendee model
- ensure booking totals and refund totals reconcile with payment records

2. Update exports
- default export fields:
  - attendee first/last name
  - display name
  - booker name
  - attendee status
  - attendance status
- guest email excluded by default unless explicitly present and needed

3. Update support views
- show booked snapshot values
- show current live event operational values
- highlight updated-after-booking operational changes when relevant

Likely file impact:
- `src/lib/data/hub-payments.js`
- `src/lib/data/payment-records.js`
- admin/export/support-related view models and workspaces

Definition of done:
- reporting, exports, and support screens do not drift from booking truth

## Phase 9. Cleanup and legacy removal

Objective:
- remove ambiguity and reduce the chance of future regression into the old model

Implementation tasks:

1. Remove old registration-first write ownership
- event registration creation should no longer be the primary runtime path for new bookings

2. Decommission or isolate legacy helpers
- mark old registration-specific event helpers as deprecated or remove them where safe

3. Remove hybrid read paths
- capacity
- member bookings
- admin registrations
- attendance
- payment/reporting
should no longer read from mixed legacy/new sources

4. Add final documentation updates
- architecture notes
- support runbooks
- QA checklist

Definition of done:
- there is one clear event booking runtime model
- no core read surface depends on legacy registration behavior for correctness

## 4) Cross-cutting backlog items

These cut across multiple phases and should be tracked explicitly.

### 4.1 Testing backlog

Required test areas:
- one active/waitlisted booking per member per event
- attendee-based capacity counting
- whole-party waitlist/block behavior
- booking aggregate recomputation after attendee cancellation
- booking payment rollup after refund
- replay-safe checkout success handling
- replay-safe refund handling
- cancellation-while-checkout-open precedence
- Growth-only group-booking enforcement
- Free/Starter forced members-only behavior
- snapshot vs live event detail rendering

### 4.2 Operational tooling backlog

Required support/admin tooling:
- repair event aggregate counters from attendee rows
- repair booking counters from attendee rows
- inspect booking/payment reconciliation anomalies
- inspect late-payment-after-cancellation anomalies

### 4.3 Documentation backlog

Required updates after implementation:
- payment runbooks
- support runbooks
- admin help/copy
- package-tier documentation

## 5) Recommended implementation ticket groups

Use these as the first engineering backlog buckets:

1. `EB-1` Domain contracts and enums
2. `EB-2` Event booking Firestore repositories
3. `EB-3` Create-booking transaction
4. `EB-4` Attendee cancellation and aggregate recomputation
5. `EB-5` Waitlist and promotion logic
6. `EB-6` Booking-based Stripe checkout and transaction linkage
7. `EB-7` Webhook idempotency and cancellation precedence
8. `EB-8` Admin event form booking controls and Growth gating
9. `EB-9` Public members-only booking migration
10. `EB-10` Public Growth group-booking flow
11. `EB-11` Member bookings workspace migration
12. `EB-12` Admin registrations workspace migration
13. `EB-13` Admin attendance workspace migration
14. `EB-14` Reporting, exports, and support views
15. `EB-15` Legacy registration cleanup

## 6) Immediate next implementation step

Begin with:

- `EB-1` Domain contracts and enums
- `EB-2` Event booking Firestore repositories
- `EB-3` Create-booking transaction

Do not begin UI implementation before these are in place.

That is the highest-signal starting point because it establishes:
- the canonical data model
- the write boundary
- the capacity and uniqueness rules
- the backbone that every later UI and payment path depends on
