# Hub-Platform Stripe Native Payments Phase 3 Courses Plan

Status:
- Proposed
- Execution-ready planning document

Date:
- 2026-04-30

Purpose:
- Define the next production-grade native-payments slice after Growth event payments
- Lock scope to Growth-only course payments
- Establish clear cancellation and refund boundaries before implementation begins

Authority:
- [Hub-Platform Stripe Native Payments Phase 2 Events Closeout](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/hub-platform-stripe-native-payments-phase-2-events-closeout-2026-04-30.md)
- [Hub-Platform Stripe Native Payments Phase 2 Events Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/hub-platform-stripe-native-payments-phase-2-events-plan-2026-04-29.md)
- [Hub-Platform Stripe Native Payments Phase 1 Closeout](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/hub-platform-stripe-native-payments-phase-1-closeout-2026-04-29.md)
- [Stripe Two-Domain Architecture Note](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/stripe-two-domain-architecture-note-2026-04-20.md)

## 1) Executive Position

Phase 3 should be:

1. Growth-only native course payments
2. built on the same connected-account, checkout, webhook, and refund foundation as Phase 2 events
3. deliberate about the fact that courses usually have a more complicated lifecycle than one-off events

Phase 3 should not:

- change Starter behavior
- introduce recurring subscription billing
- overload event refund rules directly onto courses without checking course-specific consequences

## 2) Locked Tier Boundary

### Growth

Growth should support:

- native Stripe checkout for paid courses
- Stripe-backed cancellation/refund operations where policy allows
- admin payment visibility through `/admin/payments`

### Starter

Starter should remain on the existing external/manual course-payment model.

Phase 3 must not blur that distinction in code, UI, or copy.

## 3) Course-Specific Design Questions That Must Be Locked Before Coding

Courses are not just longer events. We should lock the answers to these before implementation hardens.

### 3.1 Refund boundary recommendation

Recommended initial production rule:

- automatic refund eligibility is based on whether the course has started
- once the course has started, there is no automatic self-serve refund
- before the course starts:
  - allow the configured refund policy to decide whether full refund is available

This is simpler and more defensible than trying to model prorated or session-by-session reimbursement in the first course slice.

### 3.2 Recommended initial policy model

Phase 3 should support:

- `refundWindowMode`
  - `default`
  - `custom`
- `refundWindowHours`
  - integer hours before course start
- `refundPolicy`
  - `full_refund_before_window`
  - `non_refundable`

The first course slice should not introduce partial refunds or mid-course pro-rating.

### 3.3 Re-enrolment recommendation

The event slice proved that:

- keeping cancelled bookings visible
- creating a new record on rebooking

is the clearer support model.

The same recommendation should apply to courses:

- cancelled course enrolment remains historical
- re-enrolment creates a new enrolment record
- payment/refund history stays tied to the exact cancelled enrolment

## 4) Locked Stripe Position

Phase 3 should keep the same Stripe position as Phase 2:

- course charges run on the client’s connected account
- Hubforj takes an application fee where configured
- refunds must handle the application fee correctly
- webhook reconciliation remains authoritative

We should not introduce a different funds-flow model for courses.

## 5) Scope For Phase 3

Phase 3 should include:

1. Growth-only course checkout initiation
2. native course payment transaction persistence
3. webhook reconciliation for course purchases
4. member-facing course cancellation flow
5. Stripe-backed refund handling according to the course policy
6. admin visibility of course-native transactions and refunds

Phase 3 should exclude:

- recurring course instalments
- partial refunds
- session-by-session reimbursement logic
- charge disputes/chargebacks workflow
- payout/export reporting

## 6) Repo-Aware Implementation Direction

Phase 3 should build on existing course surfaces rather than inventing new ones.

Primary candidate surfaces:

- course detail CTA flow
- course enrolment / next-steps route
- admin course registrations
- admin payments queue

The same event-payment pattern should be reused:

1. member starts checkout from a truthful course enrolment flow
2. native transaction record is created
3. Stripe Checkout runs on the connected account
4. browser return is not treated as final payment truth
5. webhook reconciliation updates operational records
6. cancellation/refund rules are applied from server-side policy

## 7) Recommended Data Additions

Phase 3 should add explicit course payment-policy fields to the course model, for example:

- `refundWindowMode`
- `refundWindowHours`
- `refundPolicy`

It should also extend the native transaction domain with course-specific linkage where needed, for example:

- `kind = "course_registration"`
- `courseId`
- `courseTitle`
- `registrationId`
- `refundStatus`
- `refundAmount`
- `refundedAt`
- `stripeRefundId`

## 8) Admin UX Ownership

The route ownership should remain:

- `Stripe setup`
  - connected-account readiness only
- `Payments`
  - transaction queue and refund operations
- `Membership plans`
  - membership configuration only

Phase 3 should not move finance ownership into course settings or account settings.

The finance workspace remains the canonical operations surface.

## 9) Member UX Position

Member course UX should be explicit and honest:

- if the course is Starter paid:
  - external/manual flow stays unchanged
- if the course is Growth paid:
  - native card checkout is available
- if cancellation is still eligible for refund:
  - member can cancel and receive the configured refund
- if the course is inside the cutoff or already started:
  - UI should say the payment is no longer automatically refundable

The member should never have to guess whether cancellation still qualifies for reimbursement.

## 10) Delivery Sequence

Recommended sequence:

1. course policy model and field additions
2. course native transaction model additions
3. Growth course checkout initiation
4. webhook reconciliation
5. member cancellation and refund flow
6. admin refund visibility and controls
7. QA and regression sweep

This keeps the course refund model designed before checkout behavior hardens around the wrong assumptions.

## 11) Acceptance Criteria

Phase 3 is complete when:

- Growth paid courses can use native Stripe checkout
- Starter paid courses still use the existing external/manual path
- the course cancellation/refund policy is explicit and enforced
- members can clearly see whether cancellation is still refundable
- Stripe refunds are issued correctly on the connected account
- application fees are refunded appropriately on refunded course payments
- admin payments visibility distinguishes course-native transactions from membership-native and event-native transactions
