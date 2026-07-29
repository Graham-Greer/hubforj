# Hub-Platform Native Payments Rollout And Verification Runbook

Status:
- Pre-production rollout runbook
- Grounded in shipped local code paths

Date:
- 2026-05-01

Purpose:
- define the verification steps required before calling native payments production-ready
- separate environment readiness from workflow correctness
- provide a repeatable rollout checklist for staging and production

Authority:
- [Hub-Platform Stripe Native Payments Phase 1 Closeout](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/hub-platform-stripe-native-payments-phase-1-closeout-2026-04-29.md)
- [Hub-Platform Stripe Native Payments Phase 2 Events Closeout](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/hub-platform-stripe-native-payments-phase-2-events-closeout-2026-04-30.md)
- [Hub-Platform Stripe Native Payments Phase 3 Courses Closeout](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/hub-platform-stripe-native-payments-phase-3-courses-closeout-2026-04-30.md)
- [Hub-Platform Native Payments Support And Finance Runbook](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/hub-platform-native-payments-support-and-finance-runbook-2026-05-01.md)
- [Hub-Platform Payment Ledger And Cross-Tier Reporting Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/hub-platform-payment-ledger-and-cross-tier-reporting-plan-2026-05-03.md)

## 1) Scope of this rollout

This runbook covers the shipped native-payment flows inside `hub-platform`:

1. connected-account setup for Growth hubs
2. membership upgrade checkout
3. paid event registration checkout
4. paid course registration checkout
5. refund reconciliation for event/course cancellation flows
6. support-mode and admin visibility checks needed to operate the system safely

It does not certify:

- commercial SaaS billing in `product-site`
- disputes/chargebacks
- payout reporting/export
- partial refunds
- cross-tier canonical ledger completion

## 1.1 Production-grade reporting note

This rollout runbook verifies the shipped native-payment behavior.

It does not by itself make the finance model production-grade across package transitions.

For the target ledger model that preserves reporting continuity when a hub moves between Starter and Growth, use:

- [Hub-Platform Payment Ledger And Cross-Tier Reporting Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/hub-platform-payment-ledger-and-cross-tier-reporting-plan-2026-05-03.md)

## 2) Environment readiness gate

Do not attempt staging or production verification until these are present.

Required for checkout/onboarding:

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`

Required for webhook verification:

- `STRIPE_WEBHOOK_SECRET`

Current app behavior:

- missing checkout env blocks meaningful setup/onboarding
- missing webhook env makes `/api/stripe/webhooks` return `503`

Release gate:

- `getStripeConnectEnvironmentState()` must report checkout configured
- webhook configuration must also be complete before any production launch

## 3) Pre-rollout data and package gate

Before verification:

1. pick at least one Growth hub
2. confirm the hub actually has `paymentsEnabled`
3. confirm the hub owner/admin can access:
   - `/{hubSlug}/admin/payments?view=setup`
   - `/{hubSlug}/admin/payments?view=plans`
   - `/{hubSlug}/admin/payments?view=payments`
4. prepare at least:
   - one membership upgrade path
   - one paid event
   - one paid course

Important package truth:

- built-in payments are Growth-only
- Starter and Free should continue to remain outside native payment flows

## 4) Connected-account verification

For each verification environment:

1. Open `/{hubSlug}/admin/payments?view=setup`.
2. If no account exists, create the Stripe account from the setup action.
3. Complete embedded onboarding.
4. Refresh Stripe status.

Expected verification outcome:

- connected account id is present
- charges are enabled
- payouts are enabled
- details submitted is true
- outstanding requirements are clear

If this does not hold, stop rollout for that hub. Checkout verification on a partially onboarded account is not sufficient evidence of production readiness.

## 5) Membership upgrade verification

Run a real end-to-end test:

1. create or identify a pending membership upgrade request
2. enter the Stripe checkout flow
3. complete payment
4. confirm webhook reconciliation
5. return to admin payments

Expected outcome:

- queue reflects the item as paid
- payment detail route shows:
  - payment received
  - coherent status badges
- membership upgrade request is approved
- the upgraded membership state is reflected in the hub

Negative-path verification:

- verify a failed/abandoned checkout does not get promoted to paid

## 6) Event payment verification

Run a paid event booking test:

1. register a member for a paid event
2. complete checkout
3. confirm payment queue entry appears
4. open payment detail

Expected paid outcome:

- payment item shows `Paid`
- detail timeline shows checkout completion and payment received
- linked record points to event registrations

Refund-path verification:

1. cancel inside the allowed refund window
2. confirm refund execution
3. confirm webhook reconciliation

Expected refund outcome:

- registration/payment state remains understandable
- refunded status remains visible to admin
- timeline shows refunded activity

## 7) Course payment verification

Run a paid course enrolment test:

1. enrol in a paid course
2. complete checkout
3. confirm admin payment queue entry
4. confirm detail route correctness

Expected paid outcome:

- payment item shows `Paid`
- linked record points to course registrations
- timeline shows payment received

Refund/cancellation verification:

1. cancel inside refund window
2. verify Stripe refund execution
3. verify refunded state in admin detail
4. verify cancelled enrolment remains historical
5. verify re-enrolment creates a fresh record

## 8) Webhook verification

This is a release gate, not a nice-to-have.

For each tested flow confirm:

1. the webhook endpoint receives the relevant Stripe event
2. the event processes successfully
3. duplicate delivery does not create duplicate state changes

Current implementation facts:

- processed events are recorded in `stripeWebhookEvents`
- event id is the dedupe key
- production-grade rollout requires an atomic event-claim step before side effects, not only a best-effort duplicate check
- connected-account updates are also reconciled through the webhook layer

Minimum event types to verify in staging/production:

- checkout completion success
- async payment success if used
- payment failure
- `payment_intent.payment_failed`
- checkout expiration/cancellation path
- refund event path
- `account.updated`

Production-hardening note:

- treat duplicate-delivery verification as a concurrency test, not only a sequential replay test
- verify partial refunds remain truthful in ledger/reporting state if Stripe sends a refund amount lower than the original charge
- do not sign off request-time backfill on `/admin` payment reads as a permanent production architecture

## 9) Admin/support visibility verification

Before rollout sign-off, verify the operational surfaces, not just the checkout mechanics.

Check:

1. payment queue search/filter works for a tested record
2. payment detail route is reachable from the queue
3. detail route shows coherent:
   - member context
   - linked record context
   - lifecycle timeline
4. support-mode entry works through `/platform/support/[hubId]`
5. support banner is visible after entry

If support cannot clearly inspect a live payment case, rollout is not truly ready even if checkout succeeds technically.

## 10) Rollback and stop-ship conditions

Stop rollout immediately if any of the following occurs:

- webhook signature verification fails in the target environment
- successful Stripe payments remain unreconciled in app state
- refund events do not update admin visibility truthfully
- connected-account status cannot be refreshed reliably
- Growth gating leaks native payment functionality into non-Growth hubs

Rollback posture:

- do not expand hub access further
- keep Growth native flows disabled for new hubs if environment trust is uncertain
- preserve evidence from:
  - payment item id
  - Stripe event id
  - hub slug
  - visible admin state

## 11) Production sign-off checklist

A production rollout should not be signed off until all are true:

- environment variables are complete
- webhook deliveries are verified
- connected-account onboarding is verified
- membership upgrade paid path is verified
- event paid and refunded paths are verified
- course paid and refunded paths are verified
- admin payment queue is usable
- payment detail drill-down is usable
- support-mode operational entry is verified
- known gaps are accepted explicitly:
  - no payout/export console
  - no dispute tooling
  - no partial refunds

## 12) Next work after rollout readiness

After these checks are formalized, the next finance-ops work should move toward:

1. reconciliation/export visibility
2. refunded/failed totals and finance summaries
3. operator-facing webhook inspection
4. payout-adjacent reporting and support tooling
