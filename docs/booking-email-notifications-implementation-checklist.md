# Booking Email Notifications Implementation Checklist

Use this checklist alongside [booking-email-notifications-production-implementation-plan.md](/mnt/c/local/community-app/docs/booking-email-notifications-production-implementation-plan.md). It converts the finalized plan into an implementation sequence by module and verification gate.

## Completion rule

Do not mark this work complete when templates exist or code compiles.

Only mark it complete when:

- outbox creation works
- immediate notifications are queued correctly
- reminder processing works
- cancellation fan-out works
- external/native payment-state emails are truthful
- recurring occurrence reminders target the occurrence
- entitlement/legal reminder capability matches reality
- end-to-end QA passes

## Phase 1: Foundation and contracts

### Domain

- [ ] Create `apps/hub-platform/src/lib/domain/booking-notifications.js`
- [ ] Add notification kind constants
- [ ] Add dedupe key builders
- [ ] Add payment-mode notification resolution helpers
- [ ] Add recipient resolution helpers
- [ ] Add reminder eligibility rules
- [ ] Add suppression rules for:
  - [ ] cancelled bookings/registrations
  - [ ] cancelled offerings
  - [ ] waitlisted -> confirmed transitions
- [ ] Add recurring occurrence reminder targeting helpers

### Data

- [ ] Create `apps/hub-platform/src/lib/data/notification-outbox.js`
- [ ] Add create/upsert by dedupe key
- [ ] Add list due notifications
- [ ] Add claim-for-processing behavior
- [ ] Add mark sent
- [ ] Add mark failed
- [ ] Add mark cancelled
- [ ] Add mark suppressed
- [ ] Add list by source record
- [ ] Add list by parent offering
- [ ] Add stale-processing recovery helper

### Config

- [ ] Update [env.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/config/env.js)
- [ ] Add `INTERNAL_AUTOMATION_SECRET`
- [ ] Optionally add processor batch-size env support if desired now

### Tests

- [ ] Add unit tests for:
  - [ ] notification kinds
  - [ ] dedupe keys
  - [ ] reminder eligibility
  - [ ] recurring occurrence targeting
  - [ ] suppression rules
  - [ ] stale processing recovery

## Phase 2: Shared email service and templates

### Email sender

- [ ] Create `apps/hub-platform/src/lib/server/booking-notification-email.js`
- [ ] Extract or mirror safe Resend sending behavior from [admin-invite-email.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/server/admin-invite-email.js)
- [ ] Normalize provider response:
  - [ ] status
  - [ ] attemptedAt
  - [ ] sentAt
  - [ ] provider
  - [ ] providerMessageId
  - [ ] error

### Templates

- [ ] Create `apps/hub-platform/src/lib/server/email-templates/booking-confirmed.js`
- [ ] Create `apps/hub-platform/src/lib/server/email-templates/booking-recorded-pending-payment.js`
- [ ] Create `apps/hub-platform/src/lib/server/email-templates/booking-waitlisted.js`
- [ ] Create `apps/hub-platform/src/lib/server/email-templates/booking-cancelled.js`
- [ ] Create `apps/hub-platform/src/lib/server/email-templates/offering-cancelled.js`
- [ ] Create `apps/hub-platform/src/lib/server/email-templates/booking-reminder.js`

### Template behavior

- [ ] Use English-only launch formatting helpers
- [ ] Use shared money/date formatting helpers
- [ ] Ensure refund wording is factual only
- [ ] Ensure waitlist templates do not imply confirmed places
- [ ] Ensure pending-payment templates do not imply successful payment

### Tests

- [ ] Add template/render tests for:
  - [ ] confirmed
  - [ ] waitlisted
  - [ ] recorded_pending_payment
  - [ ] cancellation
  - [ ] reminder

## Phase 3: Immediate trigger integration

### Public event booking flow

- [ ] Update [actions.js](</mnt/c/local/community-app/apps/hub-platform/src/app/(hub)/[hubSlug]/events/[eventSlug]/actions.js>)
- [ ] Queue:
  - [ ] `event_booking_confirmed` for free confirmed bookings
  - [ ] `event_booking_waitlisted` for waitlist outcomes
  - [ ] `event_booking_recorded_pending_payment` for paid bookings awaiting payment
- [ ] Keep outbox creation after successful domain write
- [ ] Do not fail the booking action purely because email delivery fails

### Public course enrolment flow

- [ ] Update [actions.js](</mnt/c/local/community-app/apps/hub-platform/src/app/(hub)/[hubSlug]/courses/[courseSlug]/actions.js>)
- [ ] Queue:
  - [ ] `course_enrolment_confirmed`
  - [ ] `course_enrolment_waitlisted`
  - [ ] `course_enrolment_recorded_pending_payment`

### Native Stripe follow-up

- [ ] Audit event native checkout success path
- [ ] Audit course native checkout success path
- [ ] Audit Stripe webhook payment success path
- [ ] Queue true `confirmed` only after actual payment success
- [ ] Ensure reminder eligibility only starts after payment success

### External payment admin confirmation follow-up

- [ ] Update [event registration actions](</mnt/c/local/community-app/apps/hub-platform/src/app/(admin)/[hubSlug]/admin/events/[eventId]/registrations/actions.js>)
- [ ] Update [course registration actions](</mnt/c/local/community-app/apps/hub-platform/src/app/(admin)/[hubSlug]/admin/courses/[courseId]/registrations/actions.js>)
- [ ] Detect transition into paid/confirmed state
- [ ] Queue `confirmed` only on that transition
- [ ] Do not resend on later edits to already-paid records

### Tests

- [ ] Add integration-style tests for:
  - [ ] free confirmed
  - [ ] waitlisted
  - [ ] external pending payment
  - [ ] native pending payment
  - [ ] external admin payment confirmation transition
  - [ ] native payment success confirmation transition

## Phase 4: Cancellation notifications

### Member cancellations

- [ ] Update [account bookings actions](</mnt/c/local/community-app/apps/hub-platform/src/app/(hub)/[hubSlug]/account/bookings/actions.js>)
- [ ] Integrate outbox queueing after successful cancellation outcome
- [ ] Use actual refund outcome to choose wording

### Admin single-booking / single-registration cancellations

- [ ] Update [event registration actions](</mnt/c/local/community-app/apps/hub-platform/src/app/(admin)/[hubSlug]/admin/events/[eventId]/registrations/actions.js>)
- [ ] Update [course registration actions](</mnt/c/local/community-app/apps/hub-platform/src/app/(admin)/[hubSlug]/admin/courses/[courseId]/registrations/actions.js>)
- [ ] Queue correct admin-cancelled notification

### Tests

- [ ] Member cancellation notification coverage
- [ ] Admin single-cancellation notification coverage
- [ ] Refund wording coverage:
  - [ ] refund initiated
  - [ ] no refund due
  - [ ] unknown/manual payment outcome

## Phase 5: Whole-offering cancellation fan-out

### Event cancellation

- [ ] Update [event actions](</mnt/c/local/community-app/apps/hub-platform/src/app/(admin)/[hubSlug]/admin/events/[eventId]/actions.js>)
- [ ] Detect transition into `cancelled`
- [ ] Fetch affected active/waitlisted bookings
- [ ] Queue `event_cancelled_by_admin` per recipient
- [ ] Suppress future reminder jobs for that occurrence/offering

### Course cancellation

- [ ] Update [course actions](</mnt/c/local/community-app/apps/hub-platform/src/app/(admin)/[hubSlug]/admin/courses/[courseId]/actions.js>)
- [ ] Detect transition into `cancelled`
- [ ] Fetch affected registrations
- [ ] Queue `course_cancelled_by_admin` per recipient
- [ ] Suppress future reminder jobs

### Whole-offering waitlist handling

- [ ] Ensure waitlisted recipients receive offering-cancelled notice
- [ ] Ensure copy does not imply a confirmed place
- [ ] Ensure copy avoids refund language unless facts exist

### Tests

- [ ] Event whole-cancel fan-out test
- [ ] Course whole-cancel fan-out test
- [ ] Transition-edge-only test
- [ ] Waitlisted-recipient wording test

## Phase 6: Reminder scheduling and processor

### Reminder scheduling

- [ ] Queue one reminder at `startAt - 24h`
- [ ] Use occurrence `startAt` for recurring events
- [ ] Use course `startAt` for courses
- [ ] Apply payment-mode eligibility rules
- [ ] Skip bookings created after the reminder window for launch

### Processor

- [ ] Create `apps/hub-platform/src/lib/server/booking-notification-processor.js`
- [ ] Implement internal auth validation
- [ ] Implement due-job lookup
- [ ] Implement transactional claim to `processing`
- [ ] Stamp:
  - [ ] `processingStartedAt`
  - [ ] `processorRunId`
- [ ] Rehydrate source record before send
- [ ] Suppress obsolete jobs
- [ ] Send provider request
- [ ] Mark sent / failed
- [ ] Handle stale `processing` recovery

### Internal route

- [ ] Create `apps/hub-platform/src/app/api/internal/booking-notifications/process/route.js`
- [ ] Require `INTERNAL_AUTOMATION_SECRET`
- [ ] Return operational summary:
  - [ ] claimed
  - [ ] sent
  - [ ] failed
  - [ ] suppressed
  - [ ] retried

### Tests

- [ ] Processor claim test
- [ ] Duplicate-claim protection test
- [ ] Stale-processing recovery test
- [ ] Reminder suppression on cancellation test
- [ ] Recurring occurrence reminder targeting test

## Phase 7: Entitlements, legal, and operational alignment

### Entitlements

- [ ] Review [package-entitlements.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/package-entitlements.js)
- [ ] Ensure `emailRemindersEnabled` is truthful at rollout
- [ ] If rollout is phased, avoid exposing reminder capability before it is live

### Legal/data-use summary

- [ ] Review [buildHubDataUseSummary.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/legal/buildHubDataUseSummary.js)
- [ ] Ensure reminder/notification copy matches reality

### Operational visibility

- [ ] Ensure failed outbox records are queryable by:
  - [ ] `status`
  - [ ] `kind`
  - [ ] `parentId`
  - [ ] `recipientEmail`
- [ ] Ensure logs include:
  - [ ] `notificationId`
  - [ ] `dedupeKey`
  - [ ] `processorRunId`
  - [ ] `providerMessageId`

## Phase 8: Final verification

### Automated verification

- [ ] All unit tests pass
- [ ] All source/contract tests pass
- [ ] All integration-style tests pass

### Manual QA

- [ ] Free event confirmed booking
- [ ] Free event waitlist
- [ ] Free course confirmed enrolment
- [ ] External-payment pending-payment email
- [ ] External-payment admin marks paid -> confirmation sends once
- [ ] Native Stripe pending-payment email
- [ ] Native Stripe payment success -> confirmation sends once
- [ ] Member event cancellation
- [ ] Member course cancellation
- [ ] Admin single event booking cancellation
- [ ] Admin single course registration cancellation
- [ ] Admin whole event cancellation
- [ ] Admin whole course cancellation
- [ ] Recurring event occurrence reminder
- [ ] Guest booking without guest email -> primary booker notified
- [ ] Guest booking with guest email -> behavior matches chosen launch rule
- [ ] Waitlisted whole-offering cancellation
- [ ] Waitlisted -> confirmed promotion lifecycle

## Final acceptance gate

- [ ] Shared member-facing email service exists in `hub-platform`
- [ ] Immediate booking lifecycle emails are correct and truthful
- [ ] Waitlist emails are distinct and correct
- [ ] External-payment flows use `recorded_pending_payment` first
- [ ] External-payment flows only send `confirmed` after admin payment confirmation
- [ ] Native Stripe flows only send `confirmed` after actual payment success
- [ ] Reminder jobs are durable and processor-driven
- [ ] Recurring reminders target occurrences
- [ ] Cancellation fan-out works for whole offerings
- [ ] Refund wording is factual and non-speculative
- [ ] Reminder capability in entitlements/legal surfaces is truthful
- [ ] Outbox/processor behavior is idempotent enough for normal retries and duplicate-trigger resistance
