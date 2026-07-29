# Hub-Platform Native Payments Support And Finance Runbook

Status:
- Current-state runbook
- Based on shipped `hub-platform` payment/admin flows

Date:
- 2026-05-01

Purpose:
- define how operators and admins should triage native-payment issues in the current product
- document what finance/support visibility already exists
- make the remaining support gaps explicit so they are not confused with missing operator process

Authority:
- [Hub-Platform Stripe Native Payments Phase 3 Courses Closeout](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/hub-platform-stripe-native-payments-phase-3-courses-closeout-2026-04-30.md)
- [Stripe Two-Domain Architecture Note](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/stripe-two-domain-architecture-note-2026-04-20.md)
- [Product-Site Current State Audit And Next Steps](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-current-state-audit-and-next-steps-2026-05-01.md)
- [Hub-Platform Payment Ledger And Cross-Tier Reporting Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/hub-platform-payment-ledger-and-cross-tier-reporting-plan-2026-05-03.md)

## Current-state boundary

This runbook documents the supportable current product surface.

It is not the long-term production-grade finance architecture.

For the target canonical ledger model, cross-tier reporting continuity, and package-transition-safe source-of-truth rules, use:

- [Hub-Platform Payment Ledger And Cross-Tier Reporting Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/hub-platform-payment-ledger-and-cross-tier-reporting-plan-2026-05-03.md)

## 1) Current supportable payment surfaces

The app already gives support/admin a meaningful payment operations surface.

### 1.1 Hub admin payment routes

Primary route:

- `/{hubSlug}/admin/payments`

Views already supported:

- `?view=setup`
  - connected-account setup state
  - charges/payouts/details-submitted visibility
  - embedded onboarding entry when Stripe is configured
- `?view=plans`
  - membership plan management
  - pending membership upgrade requests
- `?view=payments`
  - searchable/filterable payment queue across:
    - memberships
    - Stripe-backed membership upgrades
    - event registrations
    - course registrations

Detail drill-down route:

- `/{hubSlug}/admin/payments/{paymentItemId}`

That detail page already exposes:

- payment summary
- member identity context
- linked membership/event/course context
- lifecycle timeline
- transaction/refund badges where available
- provider references for native Stripe transactions
- recent processed webhook events for the payment where available

### 1.2 Stripe setup and sync surfaces

Shipped setup/sync surfaces:

- admin setup page in `/admin/payments?view=setup`
- server action to create the connected account
- server action to refresh Stripe status
- sync API route:
  - `/api/admin/hubs/[hubSlug]/payments/sync`

Visible setup facts already include:

- Stripe account id
- charges enabled
- payouts enabled
- details submitted
- outstanding requirements

Operator boundary:

- normal hub admins should only see the simple Stripe setup experience
- ledger sync internals and reconciliation diagnostics should only appear when the hub is being inspected in platform support mode
- this keeps the day-to-day admin experience focused on setup readiness, not finance-maintenance mechanics

### 1.3 Webhook processing and audit trail

Shipped webhook route:

- `/api/stripe/webhooks`

Current webhook behavior:

- verifies Stripe signature
- rejects requests when webhook env is incomplete
- records and deduplicates processed events by Stripe event id
- records processed events in `stripeWebhookEvents`
- reconciles:
  - membership upgrade checkout
  - event registration checkout
  - course registration checkout
  - payment-intent failure state
  - refund updates
  - connected-account updates

Current-state caution:

- support should assume duplicate webhook delivery is operationally possible until concurrency-safe event claiming is verified in the target environment
- partial refunds should be treated as a finance-review case rather than assumed to be equivalent to a full cancellation/refund path

### 1.4 Support-mode operator boundary

Shipped support boundary:

- operator entry route: `/platform/support/[hubId]`
- support-mode cookie session
- support banner in hub admin
- redirect boundary so a superadmin deliberately enters hub admin in support mode

This matters operationally because payment intervention should be performed inside explicit support context rather than through invisible cross-tenant access.

### 1.5 Ledger maintenance boundary

Historical membership-payment projection into the canonical ledger is now a deliberate maintenance action.

Operator rule:

- hub admins should not see finance-maintenance internals during normal day-to-day administration
- ledger sync and reconciliation diagnostics belong to platform support mode, not the default hub-admin experience
- if older membership finance history looks incomplete during a support investigation, use the payments setup workspace maintenance action to sync the payment ledger
- do not expect `/admin` or `/admin/payments` reads to perform hidden ledger backfills
- check the setup workspace sync status fields after running maintenance so support has a visible last-run outcome and timestamp
- after the first successful historical sync, routine follow-up sync runs should normally be incremental rather than full-history rescans
- review the reconciliation panel in the payments setup workspace for missing links or status drift before escalating to manual data repair

## 2) What finance/support visibility already tells us

The current payment queue is not just a billing list. It already supports first-line triage.

What is visible today:

- payment item type
- member name
- amount
- due/renewal date
- operational status
- native transaction status where applicable
- refund confirmation signal where applicable
- record-specific detail route

Statuses already usable in filters or drill-down:

- paid
- unpaid
- overdue
- failed
- refunded

Operational meaning:

- first-line support can already answer "what is stuck?"
- admins can already see whether the issue is membership, event, or course related
- refunded records are no longer invisible to admin operations

## 3) First-response support workflow

Use this workflow whenever a hub reports a payment issue.

### 3.1 Confirm operator boundary

1. Enter `/platform/support/{hubId}`.
2. Confirm support mode.
3. Continue into `/{hubSlug}/admin`.

Do not start by editing records directly from lower-level tools unless the UI path is blocked or the situation is an emergency recovery case.

### 3.2 Identify the affected record

Start in:

- `/{hubSlug}/admin/payments?view=payments`

Then:

1. Search by member name.
2. Filter by status if the issue is known:
   - `Failed`
   - `Overdue`
   - `Refunded`
3. Filter by type if the issue is known:
   - membership
   - event
   - course
4. Open the payment detail route.

### 3.3 Read the payment detail page in this order

1. `Payment summary`
   - confirm amount
   - confirm current operational state
2. `Badges`
   - note whether the issue is operational status, transaction status, refund status, or all three
3. `Who and what this payment belongs to`
   - verify the member
   - verify the linked event/course/membership
4. `Timeline`
   - identify whether the problem is:
     - missing payment completion
     - failed payment
     - cancelled checkout
     - refund delay
     - stale state after a Stripe event

## 4) Triage playbooks by issue type

### 4.1 Checkout still looks unpaid

Symptoms:

- member says they paid
- admin queue still shows `Unpaid`
- detail timeline may show checkout started but not payment received

Check:

1. open the payment detail route
2. look for:
   - `Checkout completed`
   - `Payment received`
   - transaction badge differences
3. refresh payment setup state only if the issue is account-onboarding related, not a single payment issue

Interpretation:

- if `Payment received` is present, the record may already be reconciled and the queue should be rechecked
- if checkout completed exists without payment received, webhook timing or settlement may still be incomplete
- if neither exists, the member may still be in an abandoned or cancelled checkout path

Current limitation:

- there is no admin-side "replay this single payment reconciliation" control yet
- deeper reconciliation still requires engineering/operator intervention if Stripe and app state diverge

### 4.2 Payment failed

Symptoms:

- queue shows `Failed`
- detail badges may show failed transaction status

Action:

1. confirm the linked record and member
2. confirm whether a replacement attempt or new checkout path exists
3. if the user needs a clean retry path, direct the hub admin to the relevant membership/event/course flow instead of manually forcing success

Use manual status updates cautiously. They are for operational correction, not as a substitute for actual funds receipt.

### 4.3 Refunded payment

Symptoms:

- queue filter can show `Refunded`
- detail page can show refund badge and refunded timeline row

Check:

1. confirm whether the linked record is event or course
2. confirm whether cancellation already occurred
3. confirm refund timeline entry exists

Interpretation:

- refunded and cancelled is the expected end state for a successful refund/cancellation path
- refunded without a clear cancellation narrative may need engineering review

### 4.4 Stripe setup blocked

Symptoms:

- setup page shows blocked charges/payouts
- onboarding panel does not render
- setup page shows missing environment variables

Check:

1. open `/{hubSlug}/admin/payments?view=setup`
2. inspect:
   - Connected account
   - Charges
   - Payouts
   - Details submitted
   - Outstanding requirements
3. if the environment banner reports missing keys, treat this as environment misconfiguration, not a hub-specific support case

Relevant environment requirements:

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

## 5) When to escalate beyond admin support

Escalate to engineering/operator follow-up when:

- Stripe reports payment success but the app still lacks `Payment received`
- Stripe refund activity exists but the app record does not show refund state
- webhook delivery appears to have failed or never been processed
- the connected account cannot be matched back to a hub
- a support case requires record-level correction outside supported admin actions

Useful evidence to capture before escalation:

- hub slug
- payment item id
- member name/email
- linked record type and id
- visible status badges
- relevant timeline rows
- whether the issue is setup, checkout, refund, or reconciliation

## 6) Known current gaps

These are still real product gaps, not support misunderstandings.

Not yet delivered:

- explicit payout reporting
- export/reconciliation reporting
- dispute/chargeback workflow
- partial refund tooling
- one-click per-payment reconciliation replay

The current runbook should therefore be read as:

- strong enough for current first-line admin/support operations
- not yet a full finance-ops console

## 7) Recommended next implementation tasks after this runbook

1. Add richer hub-level webhook/event inspection and filtering beyond the per-payment detail view.
2. Add export/reporting visibility for settled vs refunded totals and payout-adjacent reconciliation.
3. Add operator-facing reconciliation actions for safe replay or re-sync of a single payment when Stripe and app state drift.
