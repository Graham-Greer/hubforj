# Hub-Platform Stripe Native Payments Phase 2 Events Closeout

Status:
- Implemented locally
- Hardening pass complete for local development
- Staging and production verification deferred

Date:
- 2026-04-30

Purpose:
- Record what Phase 2 event payments actually delivered in `hub-platform`
- Separate implemented local truth from the earlier planning document
- Define the remaining deferred work before this slice can be treated as production-complete

Authority:
- [Hub-Platform Stripe Native Payments Phase 2 Events Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/hub-platform-stripe-native-payments-phase-2-events-plan-2026-04-29.md)
- [Hub-Platform Stripe Native Payments Phase 1 Closeout](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/hub-platform-stripe-native-payments-phase-1-closeout-2026-04-29.md)
- [Stripe Two-Domain Architecture Note](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/stripe-two-domain-architecture-note-2026-04-20.md)

## 1) Executive Closeout

Phase 2 event payments are now complete at the local implementation level.

The delivered slice is:

1. Growth-only native paid event checkout
2. event refund-policy fields and admin event-payment configuration
3. webhook-driven event payment reconciliation
4. member event cancellation with refund-window enforcement
5. Stripe-backed refund execution and refund webhook reconciliation
6. event rebooking after cancellation with separate booking records
7. admin and member state cleanup so cancelled bookings remain visible without being treated as active payment debt

This is no longer just an extension idea after memberships. It is a real, locally working event payment and refund slice.

## 2) What Is Implemented

### 2.1 Growth-only native event checkout

Implemented:

- Growth paid events can create native Stripe Checkout sessions
- Starter paid events remain on the existing external/manual payment path
- event checkout return is route-mode aware for:
  - local path mode
  - hosted-hub host mode
- event next-steps state reflects open checkout, paid, failed, and cancelled paths truthfully

Operational meaning:

- Growth is now the only tier with built-in event payments
- Starter remains clearly outside the native event checkout flow

### 2.2 Event payment-policy fields

Implemented:

- event-level refund window hours
- event-level refund policy
- Growth event create/edit forms expose those controls directly
- misleading “hub default” event refund UI was removed because no real hub-level default exists yet

Operational meaning:

- refund behavior is explicit per event
- event forms no longer imply configuration that the product does not actually support yet

### 2.3 Event-native transaction and webhook reconciliation

Implemented:

- native transaction linkage for event registrations
- event checkout-session reconciliation from Stripe webhook events
- fallback browser-return finalization when Stripe has already marked checkout as paid
- refund reconciliation for:
  - `refund.created`
  - `refund.updated`
  - `charge.refunded`
- metadata-first refund correlation to avoid unnecessary Stripe-account lookup failures

Operational meaning:

- event payment truth is primarily maintained from server-side Stripe events
- the browser return path is resilient enough to avoid obviously stale `unpaid` state if webhook timing drifts locally

### 2.4 Event cancellation and refunds

Implemented:

- cancellation before refund cutoff can issue full Stripe refund
- application-fee refund handling is only requested when a fee actually exists
- non-refundable or outside-window cancellations still cancel the booking without automatic reimbursement
- refund webhook deliveries now complete without server-side failures

Operational meaning:

- the local event refund path is now production-grade in structure, not just synchronous best effort
- refund logic no longer breaks when `HUBFORJ_PLATFORM_FEE_BPS=0`

### 2.5 Booking history and rebooking model

Implemented:

- cancelled event bookings remain visible in member history
- rebooking after cancellation creates a new registration record
- the old cancelled booking is not overwritten
- active booking lookups and public CTAs now distinguish current registration from historical registration

Operational meaning:

- support/admin now have a much cleaner narrative for:
  - original booking
  - cancellation
  - refund
  - rebooking

### 2.6 Admin and member operational cleanup

Implemented:

- cancelled unpaid event/course items no longer count as active “payment attention”
- member action-required stats no longer treat cancelled bookings as live debt
- admin members triage no longer shows payment-attention solely because of cancelled bookings
- long activity and list views now support paginated card lists with the shared pagination control pattern
- search-driven router sync on routed admin lists is now debounced
- payment detail drill-down route exists at `/admin/payments/[paymentItemId]`
- payment detail workspace now gives admin/support a clearer view of:
  - payment status
  - member context
  - linked booking context
  - lifecycle/refund timeline

Operational meaning:

- the event-payment slice is now integrated into the operational admin experience more cleanly
- admin triage is less noisy and more truthful

## 3) What Phase 2 Explicitly Does Not Yet Deliver

Still out of scope:

- staging verification
- production verification
- production Stripe refund runbook
- hub-level default refund settings
- partial refunds
- dispute/chargeback workflow
- payout/export reporting
- course payments

These omissions are intentional and should not be treated as accidental gaps in the delivered event slice.

## 4) Hardening Pass Outcome

The most important hardening outcomes in this phase were:

1. refund webhook reconciliation now completes cleanly
2. cancelled bookings remain visible without blocking rebooking
3. rebooking creates a separate record instead of mutating the cancelled one
4. cancelled unpaid bookings no longer create false “payment attention”
5. routed admin search now causes less server churn

The biggest conceptual correction in this phase was:

- event registration history and event payment truth should not be conflated into one mutable current-state record

The current model is still operationally simple, but much more supportable than the earlier reactivation approach.

## 5) Deferred Production-Grade Work

The following work is still required before this Phase 2 slice can be called production-complete.

### 5.1 Environment and rollout

- staging Connect environment for event refunds and checkout
- production webhook registration and secret management for refund events
- production connected-account and refund verification
- support/operator runbook for refund troubleshooting and manual follow-up

### 5.2 Finance operations

- explicit refunded-event transaction visibility in `/admin/payments`
- finance/support guidance for late webhook or reconciliation drift scenarios
- reporting/export visibility once finance operations expand further

### 5.3 Product-model follow-up

- decide whether to add a hub-level default event refund policy
- decide whether partial refunds are needed
- decide whether richer registration lifecycle history is required beyond current separate booking records

## 6) Recommendation Gate Before Phase 3

Phase 3 should proceed from this locked baseline:

1. Growth remains the only native-payments tier
2. Starter remains external/manual
3. event refund logic is now a proven pattern
4. separate booking records are the chosen rebooking model
5. webhook-driven reconciliation remains the authoritative direction

The next implementation surface should therefore reuse:

- the connected-account model
- the native transaction model
- the checkout and refund reconciliation contract
- the admin payments ownership model

and extend them into course payments deliberately rather than inventing a new payment architecture for courses.
