# Booking Email Notifications Production Implementation Plan

## Objective

Implement a production-grade booking notification system for `hub-platform` that covers:

- booking and enrolment confirmation emails
- waitlist emails
- member/admin cancellation confirmation emails
- whole event/course cancellation emails sent to affected members
- scheduled reminder emails for upcoming events and courses

The end result must be reliable, idempotent, observable, and safe across:

- free flows
- externally paid flows
- Stripe-native paid flows
- recurring event occurrences
- member-initiated and admin-initiated changes

This plan is intentionally designed around an `outbox + scheduled processor` model rather than direct one-off email calls from mutations.

## Current audited state

### What already exists

1. `hub-platform` already has:
- Resend environment support in [env.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/config/env.js)
- one working transactional email path for admin invites in [admin-invite-email.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/server/admin-invite-email.js)
- clear booking and registration mutation paths for:
  - event booking creation
  - course registration creation
  - member cancellation
  - admin cancellation
- rich booking/registration data access layers with user email lookups

2. `product-site` already has:
- separate Resend usage for SaaS owner verification and password reset
- no direct role in member booking notifications

### What does not exist yet

1. No generic hub-platform email service for member-facing transactional booking emails.
2. No booking notification templates.
3. No notification outbox / delivery log / dedupe layer.
4. No scheduled reminder processor.
5. No internal cron route / protected scheduled execution entrypoint.
6. No whole-offering cancellation fan-out when an admin marks an event or course as cancelled.
7. No notification-preference model for members.
8. No reconciliation between the currently exposed `emailRemindersEnabled` entitlement and actual implementation.

## Locked product decisions

1. We will implement `outbox + scheduled processor`.
- do not send reminder emails by scanning inline in request handlers
- do not rely on ad hoc direct email calls spread across unrelated actions

2. Waitlist emails are in scope for v1 of this notification system.

3. Reminder scheduling for recurring events must target the specific occurrence record, not the parent series.

4. Admin-cancelled offering emails must avoid guessed refund language.
- emails may confirm cancellation
- refund wording must reflect actual known refund outcome or avoid claiming one

5. The entitlement/legal mismatch around reminders must be corrected as part of implementation.

6. Launch language remains English-only.
- all booking emails are English-only
- formatting stays consistent with the English-only launch locale policy already adopted elsewhere

7. Booking notifications in this plan are transactional service emails.
- confirmations
- waitlist notices
- payment-state follow-up notices
- reminders
- cancellation notices
- these are tied to a member's booking activity, not marketing consent

## Notification scope for launch

### In scope

#### Immediate transactional emails

1. Event booking confirmed
2. Event waitlisted
3. Course enrolment confirmed
4. Course waitlisted
5. Member cancelled booking confirmation
6. Member cancelled enrolment confirmation
7. Admin cancelled event booking confirmation
8. Admin cancelled course enrolment confirmation
9. Admin cancelled whole event notification
10. Admin cancelled whole course notification

#### Scheduled emails

11. Event reminder email
12. Course reminder email

### Out of scope for initial implementation

1. SMS / push notifications
2. Multi-language email content
3. Marketing-style campaign preferences
4. Automatic “spot opened up from waitlist” promotion emails unless explicitly added in a later phase
5. Multi-step reminder cadences like `7 days + 2 days + 2 hours` unless intentionally added later

## Launch behavioral rules

### Event and course creation outcomes

#### Free event booking

- create booking
- if status becomes `active`, queue `event_booking_confirmed`
- if status becomes `waitlisted`, queue `event_booking_waitlisted`

#### Free course enrolment

- create registration
- if status becomes `enrolled`, queue `course_enrolment_confirmed`
- if status becomes `waitlisted`, queue `course_enrolment_waitlisted`

#### External-payment event booking

- create booking
- if status becomes `active`, queue `event_booking_recorded_pending_payment`
- do not imply payment has been received
- wording should reflect:
  - booking recorded
  - payment still handled externally / by instructions
  - the hub will confirm once payment has been verified
- when the admin later marks the booking as paid, queue the true confirmation email

#### External-payment course enrolment

- if status becomes `enrolled`, queue `course_enrolment_recorded_pending_payment`
- do not imply payment has been received
- when the admin later marks the registration as paid, queue the true confirmation email

#### Native Stripe event booking

- do not send a misleading “confirmed and paid” email at booking creation time when payment is still incomplete
- recommended launch behavior:
  - if checkout is required and payment is not yet complete, queue `event_booking_recorded_pending_payment`
  - after Stripe confirms payment success, queue `event_booking_confirmed`

#### Native Stripe course enrolment

- same rule as native Stripe event booking

### Payment-state notification model

For launch, the notification model should be explicit:

#### Free flows

- `active` / `enrolled` -> `confirmed`
- `waitlisted` -> `waitlisted`

#### External-payment flows

- first successful booking/enrolment record -> `recorded_pending_payment`
- later admin payment confirmation -> `confirmed`
- waitlisted -> `waitlisted`

#### Native Stripe flows

- first successful booking/enrolment record requiring checkout -> `recorded_pending_payment`
- Stripe-confirmed payment success -> `confirmed`
- waitlisted -> `waitlisted`

### Waitlist behavior

Waitlist emails should:

- confirm that the person is not yet fully confirmed
- avoid payment instructions unless the business rule truly requires them
- avoid reminder scheduling until the booking/registration becomes active/enrolled

### Reminder behavior

Launch rule:

- send one reminder email `24 hours before start`

If a shorter lead time exists:

- if the booking/registration is created after the normal reminder window but still before the event/course starts, send no reminder unless a later fallback window is explicitly introduced

Recommended simple launch policy:

- one reminder window only
- no catch-up reminder if created too late

This keeps behavior deterministic and avoids unexpected noise.

### Reminder eligibility by payment mode

To keep reminder behavior operationally truthful:

- confirmed free bookings/enrolments are reminder-eligible
- waitlisted bookings/enrolments are not reminder-eligible
- externally paid bookings/enrolments should only become reminder-eligible once the hub has operationally confirmed payment / place readiness
- native Stripe paid bookings/enrolments should only become reminder-eligible once payment success is actually confirmed

### Cancellation behavior

#### Member-initiated cancellation

- send cancellation confirmation to the affected member
- if refund occurred:
  - email may say refund was initiated or recorded
- if refund did not occur:
  - email should state cancellation clearly without inventing refund outcomes

#### Admin-initiated single booking / registration cancellation

- send cancellation notice to the affected member
- same refund wording rule as above

#### Admin-initiated whole event / course cancellation

- send cancellation notice to all non-cancelled affected people
- this must be a fan-out operation driven from current registrations/bookings
- email wording must not promise refunds unless the system has actually executed or explicitly determined that outcome

#### Waitlisted whole-offering cancellation

- waitlisted recipients should still be notified that the offering was cancelled
- their email must not imply that a confirmed place existed
- their email must not include refund language unless the platform truly knows payment/refund facts for that specific person

## Architectural approach

## Core principle

Separate:

1. domain mutation
2. notification scheduling
3. notification delivery

This avoids coupling user-facing writes to provider-specific email execution.

### Recommended layers

#### 1. Notification domain

Responsibilities:

- define notification kinds
- define scheduling rules
- define dedupe rules
- define recipient resolution rules
- define payload contracts

Suggested location:

- `apps/hub-platform/src/lib/domain/booking-notifications.js`

#### 2. Notification data layer

Responsibilities:

- create outbox records
- list due notifications
- mark sent / failed / cancelled
- enforce dedupe keys
- persist provider response ids and timestamps

Suggested location:

- `apps/hub-platform/src/lib/data/notification-outbox.js`

#### 3. Email rendering / provider layer

Responsibilities:

- render subject/text/html
- send via Resend
- normalize provider result

Suggested location:

- `apps/hub-platform/src/lib/server/booking-notification-email.js`

#### 4. Scheduled processor

Responsibilities:

- fetch due unsent jobs
- build message payloads
- attempt delivery
- mark outcome
- remain idempotent across retries

Suggested location:

- `apps/hub-platform/src/lib/server/booking-notification-processor.js`
- protected route:
  - `apps/hub-platform/src/app/api/internal/booking-notifications/process/route.js`

#### 5. Trigger integration layer

Responsibilities:

- queue immediate notifications after successful lifecycle changes
- cancel or suppress obsolete reminder jobs when records become cancelled

Suggested integration points:

- booking creation
- registration creation
- payment success paths
- cancellation paths
- whole-offering status transitions

## Data model

### New outbox collection

Recommended Firestore collection:

- `hubs/{hubId}/notificationOutbox/{notificationId}`

Suggested shape:

```js
{
  kind: "event_booking_confirmed",
  sourceType: "eventBooking",
  sourceId: "booking_123",
  parentType: "event",
  parentId: "event_123",
  recipientUserId: "user_123",
  recipientEmail: "member@example.com",
  recipientRole: "member",
  status: "pending" | "scheduled" | "processing" | "sent" | "failed" | "cancelled" | "suppressed",
  scheduledFor: "2026-06-08T09:00:00.000Z",
  sentAt: "",
  cancelledAt: "",
  failedAt: "",
  provider: "resend",
  providerMessageId: "",
  dedupeKey: "event_booking_confirmed:eventBooking:booking_123:member@example.com",
  payloadVersion: 1,
  payload: {
    hubId: "hub_123",
    hubSlug: "example-hub",
    eventId: "event_123",
    eventSlug: "summer-meetup",
    bookingId: "booking_123"
  },
  attemptCount: 0,
  lastAttemptAt: "",
  lastError: "",
  processingStartedAt: "",
  processorRunId: "",
  createdAt: "2026-06-05T09:00:00.000Z",
  updatedAt: "2026-06-05T09:00:00.000Z",
  createdBy: "system",
  updatedBy: "system"
}
```

### Why an outbox is required

It gives us:

- idempotency
- retry visibility
- auditability
- decoupling from request lifecycle
- a safe place to store future reminders before they are due

## Notification kinds

Recommended launch set:

### Immediate

- `event_booking_confirmed`
- `event_booking_waitlisted`
- `event_booking_recorded_pending_payment`
- `course_enrolment_confirmed`
- `course_enrolment_waitlisted`
- `course_enrolment_recorded_pending_payment`
- `event_booking_cancelled_by_member`
- `course_enrolment_cancelled_by_member`
- `event_booking_cancelled_by_admin`
- `course_enrolment_cancelled_by_admin`
- `event_cancelled_by_admin`
- `course_cancelled_by_admin`

### Scheduled

- `event_booking_reminder`
- `course_enrolment_reminder`

## Dedupe and idempotency rules

### Immediate notifications

Only one notification of the same kind should be sent per:

- kind
- source record
- recipient email

Unless we intentionally version/resend later.

### Reminder notifications

Only one reminder per:

- occurrence / course instance
- booking/registration
- reminder window
- recipient email

Recurring events must use occurrence identity, not series identity.

### Retry behavior

- failed notifications stay in outbox with `failed`
- processor can retry failed jobs up to a bounded count
- after max retry threshold, leave as failed for operator review

### Processor claim and concurrency rules

The processor must use an explicit claim model to avoid duplicate sends:

1. select only jobs eligible for work
2. transactionally move each claimed job to `processing`
3. stamp:
  - `processingStartedAt`
  - `processorRunId`
4. only the claiming processor may finalize that job outcome

Stale processing recovery rule:

- if a notification is stuck in `processing` beyond a defined timeout, it becomes retriable

## Recipient resolution rules

### Events

#### Primary rule

- always notify the primary booker

#### Guests

For launch:

- only notify guests directly if an email address was actually captured
- otherwise treat the primary booker as the operational recipient

This is important because group bookings often use `name_only` guest mode today.

### Courses

- notify the registered member only

## Template design requirements

Each template should have:

- subject
- HTML body
- text body

Each should include:

- hub name
- offering title
- date/time
- location or online details where appropriate
- booking/enrolment status
- payment/refund wording only when factually known
- link back into the member’s bookings/account area where appropriate

### Template-specific notes

#### Confirmation

- state whether the place is confirmed or waitlisted
- for paid-but-not-complete flows, clearly state payment is still pending

#### Recorded pending payment

- confirm the booking/enrolment was received
- clearly state payment is not yet confirmed
- for external payment, explain that the hub will confirm payment manually
- for native Stripe, explain that payment completion/confirmation is still in progress when applicable

#### Reminder

- remind only for still-active bookings/registrations
- include start date/time and location or meeting instructions
- recurring event reminders must reflect the actual occurrence date

#### Cancellation by member

- confirm cancellation succeeded
- if refund initiated, say so
- if not refunded, do not speculate

#### Cancellation by admin

- confirm that the offering or booking was cancelled by the organizer
- if refund handling is unresolved or manual, avoid overpromising

## Payment and refund wording rules

This is a critical launch-quality area.

### Safe wording matrix

#### If refund has definitely been initiated or recorded

Allowed:

- `A refund has been initiated.`
- `Your refund has been recorded.`

#### If payment was not refundable or no refund was due

Allowed:

- `Your booking has been cancelled.`
- `No automatic refund was issued for this cancellation.`

#### If the system does not know final refund outcome yet

Allowed:

- `Your booking has been cancelled. Contact the hub if you have payment questions.`

Not allowed:

- `You will be refunded shortly`
- `A refund is on the way`

unless that is truly guaranteed by the executed backend path.

## Reminder scheduling rules

### Event reminders

- schedule from the actual event `startAt`
- for recurring series, use the occurrence record `startAt`
- only queue reminders for bookings with active/confirmed status

### Course reminders

- schedule from the course `startAt`
- only queue reminders for enrolled/confirmed registrations

### Cancellation suppression

If a booking/registration becomes cancelled before `scheduledFor`:

- mark future reminder notifications as `cancelled` or `suppressed`

If an entire event/course becomes cancelled:

- suppress all future reminder jobs tied to that offering
- queue the whole-offering cancellation notification instead

If a booking/registration moves from `waitlisted` to confirmed:

- suppress obsolete waitlist-only pending notifications where relevant
- queue the correct next notification for the new operational state

## Execution model

### Immediate lifecycle trigger

When a qualifying mutation succeeds:

1. commit domain change
2. queue notification records
3. optionally deliver immediate notifications inline or via fast processor call

Recommended launch behavior:

- immediate notifications should always be written to the outbox first
- after the domain write commits successfully, the application may attempt same-request delivery for immediate notifications when safe
- if delivery fails, do not fail the user-facing booking/cancellation action purely because of email delivery
- the source of truth remains the outbox record, not the provider call

### Scheduled processor

The processor should:

1. authenticate internal access
2. fetch due jobs where:
  - `status` in `pending`, `scheduled`, maybe retriable `failed`
  - `scheduledFor <= now`
3. mark selected jobs `processing`
4. rehydrate source records
5. suppress obsolete jobs
6. send via provider
7. mark sent/failed with message id and attempt data

## Hosting model

Recommended target:

- Vercel-compatible protected internal route
- also host-agnostic enough to run from another scheduler later

Suggested route:

- `POST /api/internal/booking-notifications/process`

Suggested auth:

- dedicated internal cron secret env var

Recommended env additions:

- `INTERNAL_AUTOMATION_SECRET`

Optional future addition:

- a smaller processor batch size env var

## Module-by-module execution checklist

## Phase 1: Foundation and contracts

### Domain

Create:

- `apps/hub-platform/src/lib/domain/booking-notifications.js`

Responsibilities:

- notification kind constants
- dedupe key builders
- scheduling calculators
- reminder eligibility rules
- recipient resolution helpers
- suppression rules

### Data

Create:

- `apps/hub-platform/src/lib/data/notification-outbox.js`

Responsibilities:

- create notification
- upsert by dedupe key
- list due notifications
- mark processing
- mark sent
- mark failed
- mark cancelled/suppressed
- list by source record for cleanup

### Config

Update:

- [env.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/config/env.js)

Add:

- `internalAutomationSecret`

### Tests

Add unit coverage for:

- dedupe key behavior
- reminder scheduling
- recurring occurrence handling
- suppression logic

## Phase 2: Shared email service and templates

### Server email module

Create:

- `apps/hub-platform/src/lib/server/booking-notification-email.js`

Responsibilities:

- shared `sendResendEmail`
- template dispatch by notification kind
- HTML/text rendering
- provider normalization

### Templates

Recommended file split:

- `apps/hub-platform/src/lib/server/email-templates/booking-confirmed.js`
- `apps/hub-platform/src/lib/server/email-templates/booking-recorded-pending-payment.js`
- `apps/hub-platform/src/lib/server/email-templates/booking-waitlisted.js`
- `apps/hub-platform/src/lib/server/email-templates/booking-cancelled.js`
- `apps/hub-platform/src/lib/server/email-templates/offering-cancelled.js`
- `apps/hub-platform/src/lib/server/email-templates/booking-reminder.js`

### Shared formatting

Use existing English-only launch formatting helpers and money formatters.

Do not hand-roll locale/date behavior inside templates.

## Phase 3: Immediate trigger integration

### Public event booking

Wire after successful booking creation in:

- [actions.js](</mnt/c/local/community-app/apps/hub-platform/src/app/(hub)/[hubSlug]/events/[eventSlug]/actions.js>)

Rules:

- queue `confirmed`, `waitlisted`, or `pending_payment` according to final state

### Public course enrolment

Wire after successful registration creation in:

- [actions.js](</mnt/c/local/community-app/apps/hub-platform/src/app/(hub)/[hubSlug]/courses/[courseSlug]/actions.js>)

### Stripe-native payment success follow-up

Review and integrate into:

- `event-booking-checkout`
- `course-registration-checkout`
- Stripe webhook completion paths

Purpose:

- transition from `pending_payment` communication to true `confirmed` communication when payment is actually complete

### External-payment admin confirmation follow-up

Wire into the admin payment-status update flows so that:

- when an external-payment event booking is moved into a paid/confirmed payment state, queue `event_booking_confirmed`
- when an external-payment course registration is moved into a paid/confirmed payment state, queue `course_enrolment_confirmed`
- only queue those notifications on the actual state transition into the confirmed/paid state, not on every later re-save of an already-paid record

Primary integration points:

- [event registration actions](</mnt/c/local/community-app/apps/hub-platform/src/app/(admin)/[hubSlug]/admin/events/[eventId]/registrations/actions.js>)
- [course registration actions](</mnt/c/local/community-app/apps/hub-platform/src/app/(admin)/[hubSlug]/admin/courses/[courseId]/registrations/actions.js>)

### Member cancellations

Wire into:

- [account bookings actions](</mnt/c/local/community-app/apps/hub-platform/src/app/(hub)/[hubSlug]/account/bookings/actions.js>)
- [event-booking-cancellation.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/server/event-booking-cancellation.js)
- [course-registration-cancellation.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/server/course-registration-cancellation.js)

### Admin single-booking cancellations

Wire into:

- [event registration actions](</mnt/c/local/community-app/apps/hub-platform/src/app/(admin)/[hubSlug]/admin/events/[eventId]/registrations/actions.js>)
- [course registration actions](</mnt/c/local/community-app/apps/hub-platform/src/app/(admin)/[hubSlug]/admin/courses/[courseId]/registrations/actions.js>)

## Phase 4: Whole-offering cancellation fan-out

### Event cancellation

When event status becomes `cancelled` through:

- [event actions](</mnt/c/local/community-app/apps/hub-platform/src/app/(admin)/[hubSlug]/admin/events/[eventId]/actions.js>)

Implement:

- detect transition into cancelled state
- fetch active/waitlisted relevant bookings
- queue `event_cancelled_by_admin` notifications
- cancel future reminder jobs for that event occurrence

### Course cancellation

When course status becomes `cancelled` through:

- [course actions](</mnt/c/local/community-app/apps/hub-platform/src/app/(admin)/[hubSlug]/admin/courses/[courseId]/actions.js>)

Implement equivalent fan-out.

Important:

- status transition detection must distinguish:
  - already cancelled
  - newly cancelled

We should only fan out notifications on the transition edge, not on every re-save.

## Phase 5: Reminder scheduling and processor

### Reminder creation

When a booking/registration is truly confirmed and reminder-eligible:

- queue reminder for `startAt - 24h`

### Processor

Create:

- `apps/hub-platform/src/lib/server/booking-notification-processor.js`

Responsibilities:

- claim jobs safely
- rehydrate source state
- suppress invalid/obsolete jobs
- send and persist results

### Protected route

Create:

- `apps/hub-platform/src/app/api/internal/booking-notifications/process/route.js`

Rules:

- require secret auth
- process bounded batch
- return operational summary

### Future scheduler readiness

Design so that:

- Vercel cron can call it later
- another host’s scheduler can call it later
- local/manual ops can trigger it for testing if authorized

## Phase 6: Entitlements, legal, and UX alignment

### Entitlements mismatch

Current mismatch:

- `emailRemindersEnabled` is exposed before functionality exists

Implement:

- either temporarily disable it until notification system lands
- or complete the feature and make the capability truthful by the time this work ships

Recommended path:

- keep the capability but make sure it only ships once the reminder system is actually functional

### Legal/data-use summary alignment

Review:

- [buildHubDataUseSummary.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/legal/buildHubDataUseSummary.js)

Make sure the notifications/reminders copy reflects reality:

- enabled only when real reminder capability is live

### Optional admin visibility

Recommended but not required for first merge:

- surface notification health later in admin payments or admin overview
- not necessary to block launch if outbox records are inspectable in data

### Minimum operational visibility requirement

Even if no admin UI ships in the first merge:

- failed notifications must be queryable in Firestore by:
  - `status`
  - `kind`
  - `parentId`
  - `recipientEmail`
- server logs should include:
  - `notificationId`
  - `dedupeKey`
  - `processorRunId`
  - `providerMessageId`

## Phase 7: Hardening and verification

### Required tests

#### Unit tests

- notification kind derivation
- dedupe keys
- reminder timing
- recurring occurrence targeting
- suppression on cancellation
- suppression on waitlist -> confirmed transitions
- refund wording selection
- payment-mode-based reminder eligibility
- external-payment admin-confirmation follow-up logic

#### Source/contract tests

- internal processor route auth
- env contract for internal secret
- entitlement/legal alignment

#### Integration-style tests

- booking create -> outbox queued
- cancellation -> outbox queued
- whole-offering cancel -> fan-out queued
- processor send path marks sent
- processor retry path marks failed
- cancelled reminder gets suppressed
- stale `processing` recovery is safe
- duplicate processor claims do not send duplicate emails under normal operational conditions

### Manual QA scenarios

1. Free event booking
- booking created
- confirmation email queued and sent

2. Free event waitlist
- waitlist email queued and sent

3. Free course enrolment
- confirmation email queued and sent

4. External-payment event/course
- “recorded / pending payment” email content is truthful
- admin later marks payment as paid and the true confirmation email sends once

5. Native Stripe event/course
- no false “paid” email on initial record
- confirmation email after payment success

6. Member cancellation
- cancellation email sent
- refund wording matches actual result

7. Admin single-booking cancellation
- email sent to affected member

8. Admin whole event cancellation
- all current affected members notified once
- reminder jobs suppressed

9. Admin whole course cancellation
- same as above

10. Recurring event occurrence
- reminder tied to the occurrence start timestamp, not series base record

11. Guest booking without guest emails
- primary booker still receives the operational email

12. Guest booking with guest emails
- direct guest behavior works only if explicitly supported by the chosen launch rule

13. Waitlisted whole-offering cancellation
- waitlisted recipients are notified with correct non-confirmed wording

14. Waitlisted -> confirmed promotion
- a waitlist email may already have been sent
- obsolete waitlist-only pending notifications are suppressed
- the correct next-state notification is queued once the person is promoted

## Rollout order recommendation

Recommended implementation sequence:

1. Foundation contracts and outbox persistence
2. Shared email sender + templates
3. Immediate confirmation/waitlist notifications
4. Cancellation notifications
5. Whole-offering cancellation fan-out
6. Reminder scheduling
7. Scheduled processor route
8. Entitlement/legal cleanup
9. Full verification pass

## Key tradeoffs and decisions

### Why not direct-send inside actions only

That approach is faster, but weaker:

- duplicate risk
- poor retry behavior
- no durable reminder storage
- hard to audit
- weak operability

### Why not implement multiple reminder cadences now

Multiple reminders add:

- more suppression complexity
- more dedupe logic
- more admin expectations
- more potential noise

One reminder is the right launch compromise.

### Why not auto-email all guest attendees by default

Because event guest email capture is optional today.

The safe launch posture is:

- primary booker always
- guest attendee only when an explicit email exists

## Acceptance criteria

This work is complete only when all of the following are true:

1. `hub-platform` has a shared member-facing booking email service.
2. Event/course create-booking flows queue and deliver the correct immediate transactional emails.
3. Waitlist emails are implemented and distinct from confirmed emails.
4. Member and admin booking cancellations send the correct cancellation emails.
5. Whole event/course cancellation sends one notification to each affected current recipient.
6. Reminder jobs are stored durably in an outbox.
7. A protected scheduled processor can deliver due reminders.
8. Recurring event reminders are based on occurrence timestamps.
9. Reminder/cancellation jobs are suppressed correctly when the booking or offering is cancelled.
10. Refund wording is factual and never speculative.
11. Entitlement/legal reminder capability matches reality.
12. The system is idempotent enough to survive retries without duplicate sends under normal operational conditions.
13. External-payment flows send `recorded_pending_payment` first and only send `confirmed` after admin payment confirmation.
14. Reminder eligibility does not treat unpaid external/native bookings as fully reminder-ready unless operationally confirmed.

## Recommended next step after planning

Before coding, convert this plan into an execution checklist and implement in the same phase order:

1. outbox foundation
2. shared email sender/templates
3. immediate trigger integration
4. cancellation fan-out
5. reminder processor
6. entitlement/legal cleanup
