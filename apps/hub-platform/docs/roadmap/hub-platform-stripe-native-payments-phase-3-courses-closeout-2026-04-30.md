# Hub-Platform Stripe Native Payments Phase 3 Courses Closeout

Status:
- Implemented locally
- Hardening pass complete for local development
- Staging and production verification deferred

Date:
- 2026-04-30

Purpose:
- Record what Phase 3 course payments actually delivered in `hub-platform`
- Separate implemented local truth from the earlier planning document
- Define the remaining deferred work before this slice can be treated as production-complete

Authority:
- [Hub-Platform Stripe Native Payments Phase 3 Courses Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/hub-platform-stripe-native-payments-phase-3-courses-plan-2026-04-30.md)
- [Hub-Platform Stripe Native Payments Phase 2 Events Closeout](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/hub-platform-stripe-native-payments-phase-2-events-closeout-2026-04-30.md)
- [Stripe Two-Domain Architecture Note](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/stripe-two-domain-architecture-note-2026-04-20.md)

## 1) Executive Closeout

Phase 3 course payments are now complete at the local implementation level.

The delivered slice is:

1. Growth-only native paid course checkout
2. course refund-policy fields and admin course-payment configuration
3. webhook-driven course payment reconciliation
4. member and admin course cancellation with refund-window enforcement
5. Stripe-backed refund execution and refund webhook reconciliation
6. course re-enrolment after cancellation with separate enrolment records
7. admin and member state cleanup so cancelled enrolments remain visible without being treated as active payment debt

This means courses now follow the same production-grade lifecycle shape as events:

- native checkout
- truthful next steps
- cancellation/refund handling
- webhook reconciliation
- historical cancelled records
- fresh re-enrolment records

## 2) What Is Implemented

### 2.1 Growth-only native course checkout

Implemented:

- Growth paid courses can create native Stripe Checkout sessions
- Starter paid courses remain on the existing external/manual payment path
- course checkout return is route-mode aware for:
  - local path mode
  - hosted-hub host mode
- course next-steps state reflects open checkout, paid, failed, and cancelled paths truthfully

Operational meaning:

- Growth is now the only tier with built-in course payments
- Starter remains clearly outside the native course checkout flow

### 2.2 Course payment-policy fields

Implemented:

- course-level refund window hours
- course-level refund policy
- Growth course create/edit forms expose those controls directly
- the policy model remains:
  - `full_refund_before_window`
  - `non_refundable`

Operational meaning:

- refund behavior is explicit per course
- course pricing and cancellation expectations are no longer ambiguous

### 2.3 Course-native transaction and webhook reconciliation

Implemented:

- native transaction linkage for course registrations
- course checkout-session reconciliation from Stripe webhook events
- browser-return finalization when Stripe already marks checkout as paid
- refund reconciliation for course-native transactions through the shared Stripe webhook path

Operational meaning:

- course payment truth is maintained from server-side Stripe events
- the browser return path is resilient enough to avoid obviously stale `unpaid` state if webhook timing drifts locally

### 2.4 Course cancellation and refunds

Implemented:

- member cancellation before refund cutoff can issue full Stripe refund
- admin cancellation follows the same refund-aware path
- application-fee refund handling is only requested when a fee actually exists
- non-refundable or outside-window cancellations still cancel the enrolment without automatic reimbursement
- refund webhook deliveries now reconcile course-native transactions cleanly

Operational meaning:

- course refund handling now matches the event slice structurally
- admin and member flows are no longer diverging on cancellation outcomes

### 2.5 Enrolment history and re-enrolment model

Implemented:

- cancelled course enrolments remain visible in member history
- re-enrolment after cancellation creates a new enrolment record
- the old cancelled enrolment is not overwritten
- active course enrolment lookups and public CTAs now distinguish current enrolment from historical enrolment

Operational meaning:

- support/admin now have a much cleaner narrative for:
  - original enrolment
  - cancellation
  - refund
  - re-enrolment

### 2.6 Admin and member operational cleanup

Implemented:

- cancelled unpaid course items no longer count as active payment debt
- member booking summaries now explain:
  - refundable course cancellations
  - non-refundable course cancellations
  - refunded course cancellations
- admin event registration payment UI was also tightened during this phase so refunded event bookings remain visibly `Refunded` rather than collapsing back to `Unpaid`
- payment detail drill-down route exists at `/admin/payments/[paymentItemId]`
- payment detail workspace now gives the admin a clearer view of:
  - payment summary
  - member context
  - linked membership/event/course context
  - lifecycle and refund timeline

Operational meaning:

- the course-payment slice is now integrated into the operational admin and member experience more cleanly
- finance/support visibility is less misleading for refunded records

## 3) What Phase 3 Explicitly Does Not Yet Deliver

Still out of scope:

- staging verification
- production verification
- production Stripe refund runbook
- hub-level default refund settings
- partial refunds
- mid-course pro-rating
- dispute/chargeback workflow
- payout/export reporting

These omissions are intentional and should not be treated as accidental gaps in the delivered course slice.

## 4) Hardening Pass Outcome

The most important hardening outcomes in this phase were:

1. course refund webhook reconciliation now completes cleanly
2. admin and member cancellation both use the same refund-aware service
3. cancelled course enrolments remain visible without blocking re-enrolment
4. re-enrolment creates a separate record instead of mutating the cancelled one
5. admin/member payment state now stays truthful through paid, refunded, and cancelled outcomes

The biggest conceptual correction in this phase was:

- course enrolment history and course payment truth should not be conflated into one mutable current-state record

The current model is still operationally simple, but much more supportable than the earlier single-record blocking approach.

## 5) Deferred Production-Grade Work

The following work is still required before this Phase 3 slice can be called production-complete.

### 5.1 Environment and rollout

- staging Connect environment for course refunds and checkout
- production webhook registration and secret management for refund events
- production connected-account and refund verification
- support/operator runbook for course refund troubleshooting and manual follow-up

Current follow-up authority:

- [Hub-Platform Native Payments Rollout And Verification Runbook](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/hub-platform-native-payments-rollout-and-verification-runbook-2026-05-01.md)
- [Hub-Platform Native Payments Support And Finance Runbook](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/hub-platform-native-payments-support-and-finance-runbook-2026-05-01.md)

### 5.2 Finance operations

- explicit refunded-course transaction visibility in `/admin/payments`
- finance/support guidance for late webhook or reconciliation drift scenarios
- reporting/export visibility once finance operations expand further

Current-state note:

- the admin payment queue and detail drill-down are now implemented and already provide:
  - baseline refunded-state visibility
  - native transaction status context
  - lifecycle context
  - recent webhook activity visibility on the payment detail route
- the remaining gap is richer finance reporting and reconciliation tooling, not the absence of payment drill-down itself

### 5.3 Product-model follow-up

- decide whether to add a hub-level default course refund policy
- decide whether partial refunds are needed
- decide whether richer course enrolment lifecycle history is required beyond current separate enrolment records

## 6) Recommendation Gate After Phase 3

The platform now has three locally proven native-payment surfaces:

1. membership upgrades
2. events
3. courses

The next work should therefore shift from “can Stripe checkout be made to work?” toward:

- reporting/admin finance visibility
- support and refund operations
- reconciliation and payout tooling
- production rollout readiness

That is now the better use of effort than continuing to treat checkout itself as the primary unknown.
