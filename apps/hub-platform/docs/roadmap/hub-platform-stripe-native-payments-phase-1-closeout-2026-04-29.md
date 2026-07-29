# Hub-Platform Stripe Native Payments Phase 1 Closeout

Status:
- Implemented locally
- Hardening pass complete for local development
- Staging and production verification deferred

Date:
- 2026-04-29

Purpose:
- Record what Phase 1 actually delivered in `hub-platform`
- Separate implemented local truth from the earlier planning document
- Define the remaining deferred work before this slice can be treated as production-complete

Authority:
- [Hub-Platform Stripe Native Payments Phase 1 Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/hub-platform-stripe-native-payments-phase-1-plan-2026-04-29.md)
- [Stripe Two-Domain Architecture Note](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/stripe-two-domain-architecture-note-2026-04-20.md)
- app-local standards in `docs/standards/*`

## 1) Executive Closeout

Phase 1 is now complete at the local implementation level.

The delivered slice is:

1. Growth-only Stripe setup inside `/{hubSlug}/admin/payments?view=setup`
2. Stripe Express connected-account creation plus embedded onboarding
3. one self-serve native payment flow:
   - paid membership upgrade on Growth
4. webhook-driven payment reconciliation
5. admin and member visibility that truthfully reflects the implemented state
6. member and admin lifecycle cleanup so paid membership cancellation means:
   - return to the default plan
   - not account suspension

This is no longer just a planning seam. It is a real, locally working product slice.

## 2) What Is Implemented

### 2.1 Connected-account setup

Implemented:

- payment configuration lifecycle record
- connected-account creation from Hubforj
- embedded onboarding inside Hubforj
- Stripe readiness/status refresh
- finance navigation split into:
  - `Stripe setup`
  - `Payments`
  - `Membership plans`

Operational meaning:

- Hubforj creates the Stripe connected account record
- the client still completes Stripe onboarding and verification
- native payments remain unavailable until the connected account is ready

### 2.2 Native membership-upgrade checkout

Implemented:

- Growth-only paid membership upgrades can initiate Stripe Checkout
- Starter keeps the external/manual flow
- return URLs are route-mode aware for:
  - local path mode
  - hosted-hub host mode
- member-facing pending-upgrade states are truthful

Operational meaning:

- browser return is not treated as final payment truth
- Stripe webhook events remain authoritative

### 2.3 Webhook reconciliation

Implemented:

- dedicated `hub-platform` Stripe webhook endpoint
- signature verification
- idempotent webhook event recording
- checkout-session reconciliation into native transaction state
- automatic membership-upgrade application after confirmed payment
- connected-account status synchronization from Stripe events

Operational meaning:

- payment state no longer depends on the browser returning successfully
- the membership upgrade is only applied after server-side confirmation

### 2.4 Admin and member lifecycle cleanup

Implemented:

- redundant membership payment-status control removed from member detail
- admin `Revert to default plan` action added
- member self-serve `Return to default membership` action added
- default membership can no longer be set inactive
- suspension remains the actual access-control mechanism

Operational meaning:

- `Suspend member` means block access
- ending a paid membership means revert to the default plan
- these are now distinct actions instead of blurred status meanings

### 2.5 Payments queue cleanup

Implemented:

- `/admin/payments?view=payments` now behaves as an operational queue
- stale completed/cancelled Stripe upgrade rows are hidden unless they still belong to a live pending upgrade
- native Stripe rows are labelled clearly
- payment queue rows now show more context inline:
  - member email
  - transaction detail text
- payment detail drill-down route exists at `/admin/payments/[paymentItemId]`
- payment detail workspace now shows:
  - payment summary
  - member context
  - linked membership/event/course context
  - lifecycle timeline

Operational meaning:

- admin payments no longer reads like a misleading historical ledger
- member detail remains the richer history surface

## 3) What Phase 1 Explicitly Does Not Yet Deliver

Still out of scope:

- staging verification
- production verification
- production webhook registration/runbook
- recurring subscriptions
- event payments
- course payments
- native refunds/disputes flow
- payout reporting
- finance exports

These omissions are intentional and should not be treated as accidental gaps in the delivered membership-upgrade slice.

## 4) Hardening Pass Outcome

The hardening pass completed in this phase focused on:

1. payment queue clarity
2. membership lifecycle correctness
3. member/admin action clarity
4. local Stripe setup and webhook operability

The most important product correction was this:

- membership `inactive` is not the same as suspension
- default membership remains the baseline entitlement
- paid membership cancellation returns the member to that baseline

That resolves the biggest conceptual mismatch in the original membership-status model.

## 5) Deferred Production-Grade Work

The following work is still required before this Phase 1 slice can be called production-complete.

### 5.1 Environment and rollout

- staging Stripe Connect environment
- production webhook endpoint and secret management
- production embedded-onboarding verification
- support/operator runbook for connected-account troubleshooting
- rollback and retry guidance for webhook failures

### 5.2 Finance operations

- failed-payment retry/restart guidance
- clearer payment-list surfacing for refunded/failed states at a glance
- reconciliation views and support signals
- explicit reporting on refunded/partially refunded native transactions once refunds are introduced

### 5.3 Testing and QA

- documented local Stripe CLI workflow
- repeatable test-data guidance for connected-account onboarding
- end-to-end regression checklist across:
  - Stripe setup
  - membership upgrade checkout
  - webhook reconciliation
  - member return to default plan
  - admin queue behavior

## 6) Recommendation Gate Before Phase 2

Phase 2 should proceed from this locked baseline:

1. Growth-only native payments remain the only native-payment tier
2. Starter remains external/manual
3. connected accounts are client-owned
4. Hubforj remains the operational source of truth
5. Stripe remains the payment rail

The next implementation surface should therefore reuse:

- the connected-account model
- the native transaction model
- the webhook contract
- the admin payments setup/queue ownership

and extend them into event payments rather than inventing a parallel payments architecture.
