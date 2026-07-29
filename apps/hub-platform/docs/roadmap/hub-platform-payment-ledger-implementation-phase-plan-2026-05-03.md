# Hub-Platform Payment Ledger Implementation Phase Plan

Status:
- Proposed implementation-phase plan
- Companion to the production-grade payment-ledger architecture note

Date:
- 2026-05-03

Purpose:
- translate the payment-ledger architecture into an actionable engineering sequence
- define the initial Firestore schema, write-path ownership, backfill order, and rollout path
- keep implementation incremental so reporting correctness improves without destabilizing shipped flows

Authority:
- [Hub-Platform Payment Ledger And Cross-Tier Reporting Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/hub-platform-payment-ledger-and-cross-tier-reporting-plan-2026-05-03.md)
- [Hub-Platform Native Payments Support And Finance Runbook](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/hub-platform-native-payments-support-and-finance-runbook-2026-05-01.md)
- [Hub-Platform Native Payments Rollout And Verification Runbook](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/hub-platform-native-payments-rollout-and-verification-runbook-2026-05-01.md)

## 1) Executive implementation position

The ledger should be introduced in phases, not as a big-bang rewrite.

The safest path is:

1. add `paymentRecords`
2. start writing all new membership upgrade payments into it
3. switch `/admin` revenue and `/admin/payments` to ledger-backed reads
4. backfill and migrate legacy membership history
5. extend the ledger to event and course flows

This approach gives the biggest production-value improvement first:

- one source for revenue reporting
- one source for admin payment records
- better continuity across Starter and Growth transitions

## 1.1 Production hardening requirements before sign-off

The first implementation wave is not complete until the ledger/runtime also satisfies these operational requirements:

- Stripe webhook processing must claim event ids atomically before applying side effects
- failed webhook attempts must be retryable without leaving permanently claimed event ids behind
- `payment_intent.payment_failed` must reconcile payment state, not only checkout-session events
- refund reconciliation must distinguish `refunded` from `partially_refunded`
- mixed-currency and zero-decimal-currency revenue summaries must remain mathematically correct
- request-time read surfaces must not remain the long-term owner of ledger backfill work
- source-backed ledger records should use deterministic document ids derived from `sourceType` and `sourceId`
- hub-admin payment setup should stay simple, with ledger maintenance and reconciliation diagnostics reserved for support-mode inspection

## 2) Initial schema contract

Introduce:

- `hubs/{hubId}/paymentRecords/{paymentRecordId}`

### 2.1 Required fields for Phase 1

These are the minimum fields needed to move admin revenue/reporting onto the ledger safely.

```js
{
  id: "pay_...",
  hubId: "hub_...",
  userId: "user_...",

  kind: "membership" | "membership_upgrade" | "event_registration" | "course_registration",
  sourceType: "membership" | "membershipUpgradeRequest" | "eventRegistration" | "courseRegistration",
  sourceId: "...",

  title: "Growth Membership",
  description: "Membership upgrade",

  amountMinor: 1500,
  amountDisplay: "15.00",
  currency: "GBP",

  paymentMode: "native" | "external" | "manual" | "none",
  provider: "stripe" | "external" | "manual" | "internal",

  operationalStatus: "open" | "pending_confirmation" | "completed" | "cancelled",
  financialStatus: "not_required" | "unpaid" | "paid" | "failed" | "overdue" | "refunded" | "partially_refunded",

  occurredAt: "ISO date",
  dueAt: "ISO date",
  paidAt: "ISO date",
  refundedAt: "ISO date",

  refundAmountMinor: 0,
  refundDisplay: "0.00",

  nativeTransactionId: "",
  stripeCheckoutSessionId: "",
  stripePaymentIntentId: "",
  stripeRefundId: "",

  membershipId: "",
  membershipUpgradeRequestId: "",
  eventId: "",
  eventRegistrationId: "",
  courseId: "",
  courseRegistrationId: "",

  packageTierAtTime: "free" | "starter" | "growth",
  paymentProcessingModeAtTime: "none" | "external" | "internal",
  sourceConfidence: "authoritative" | "declared" | "migrated",
  reportingEligibility: "count_in_revenue" | "informational_only",

  createdAt: "ISO date",
  updatedAt: "ISO date",
  createdBy: "...",
  updatedBy: "..."
}
```

### 2.2 Optional fields for later phases

These can be added after the first ledger-backed reads are stable:

- `supersedesPaymentRecordId`
- `replacedByPaymentRecordId`
- `metadata`
- `notes`
- `operatorAudit`
- `refundReason`
- `failureReason`

## 3) Write-path ownership

The implementation must be explicit about which code path owns ledger creation and updates.

### 3.1 Membership upgrade native Stripe flow

Primary Phase 1 write owner:

- `membership-upgrade-checkout.js`
- `hub-payment-webhooks.js`

Responsibilities:

1. On upgrade-request checkout start:
   - create `nativePaymentTransaction`
   - create `paymentRecord`
   - link them together

2. On checkout return or webhook success:
   - update `paymentRecord.financialStatus` to `paid`
   - set `paidAt`
   - preserve `operationalStatus` separately if approval is still pending

3. On admin approval:
   - update workflow state in `memberships` and `membershipUpgradeRequests`
   - do not redefine the financial meaning of the payment record

### 3.2 Membership external/manual Starter flow

Phase 2 write owner:

- membership admin/manual confirmation actions
- membership provisioning/update actions

Responsibilities:

1. When an external/manual paid membership is confirmed:
   - create a `paymentRecord`
   - set:
     - `paymentMode: external` or `manual`
     - `provider: external` or `manual`
     - `sourceConfidence: declared`

2. If the current phase does not yet support automatic creation for all manual flows:
   - add explicit guardrails so reporting can distinguish migrated/manual records from authoritative native ones

### 3.3 Event native Stripe flow

Phase 3 write owner:

- event registration checkout server logic
- event Stripe webhook reconciliation
- event cancellation/refund flow

Responsibilities:

1. Create a `paymentRecord` when a paid event checkout starts.
2. Move it to `paid` only when the Stripe-backed transaction is actually settled.
3. Update it to `refunded` when a refund is processed.
4. Preserve the event registration as workflow context, not as the finance record.

### 3.4 Course native Stripe flow

Phase 3 write owner:

- course registration checkout server logic
- course Stripe webhook reconciliation
- course cancellation/refund flow

Responsibilities mirror the event path.

### 3.5 Free/default membership flow

Phase 2 rule:

- free/default membership changes may create `paymentRecords` when useful for continuity
- they must use:
  - `financialStatus: not_required`
  - `reportingEligibility: informational_only`

Default admin payment list behavior:

- exclude these records unless an explicit future filter asks for them

## 4) Read-path migration sequence

### 4.1 First read switch

Switch first:

- `/admin` revenue cards
- `/admin/payments`

Reason:

- these are where source-of-truth drift is most visible
- this is where finance/support reliability matters most

### 4.2 Second read switch

Switch next:

- admin member payment history
- payment detail route

Reason:

- historical membership changes must stop depending on mutable membership assignments

### 4.3 Later read switch

Switch later:

- member-facing payment history where relevant
- export/reconciliation views
- support/operator finance screens

Product UX rule:

- do not let finance-maintenance internals leak into the default hub-admin experience
- keep normal hub-admin payments setup focused on Stripe readiness and straightforward next actions
- place ledger sync diagnostics, reconciliation detail, and repair tooling behind platform support context

## 5) Phase-by-phase implementation plan

## Phase 1: Ledger foundation and membership-upgrade writes

Goal:

- create the new ledger
- make new native membership upgrades write into it
- make `/admin` and `/admin/payments` consume it for membership-upgrade records and revenue

Work:

1. Add `paymentRecords` data access module.
2. Add normalization helpers and record factories.
3. Create ledger write on native membership-upgrade checkout creation.
4. Update ledger on:
   - checkout return
   - webhook success
   - webhook failure
   - refund path when applicable later
5. Switch:
   - revenue card source
   - payments list membership-upgrade source

Acceptance:

- a paid native membership upgrade appears in the ledger
- `/admin` revenue matches `/admin/payments`
- pending approval does not hide a paid payment

## Phase 2: Membership history normalization

Goal:

- move membership payment history and membership-cycle records onto the ledger
- eliminate dependence on `membershipPayments` as the admin finance source

Work:

1. Backfill `membershipPayments` to `paymentRecords`.
2. Add ledger records for manual/external confirmed membership payments where possible.
3. Migrate member payment history to ledger reads.
4. Ensure:
   - paid membership record survives reversion to default
   - free/default records are informational only

Acceptance:

- historical paid membership records are not overwritten by later free/default state
- admin payment list excludes informational-only free records by default

## Phase 3: Event and course ledger projection

Goal:

- unify event and course payments with membership in the same ledger

Work:

1. Create ledger records for paid event checkout start.
2. Reconcile event payment success/failure/refund into ledger.
3. Create ledger records for paid course checkout start.
4. Reconcile course payment success/failure/refund into ledger.
5. Keep event/course registrations linked by reference.

Acceptance:

- event/course revenue and refund reporting uses the same ledger as membership
- event/course cancellations do not erase paid financial history

## Phase 4: Reporting, exports, and support tooling

Goal:

- finish the production-grade finance surface on top of the ledger

Work:

1. Add ledger-backed finance summaries.
2. Add export-ready views.
3. Add support/operator detail and reconciliation aids.
4. Add confidence-aware reporting slices:
   - native authoritative
   - external/manual declared
   - migrated historical

Acceptance:

- finance/support can inspect one canonical record stream
- reporting survives tier transitions honestly

## 6) Backfill order

Backfill should be staged in this exact order.

### 6.1 First backfill

- `nativePaymentTransactions`

Reason:

- highest confidence
- already refund-aware
- best source for authoritative native revenue

### 6.2 Second backfill

- `membershipPayments`

Reason:

- already closer to historical membership finance than mutable memberships
- lower operational risk than event/course backfill

### 6.3 Third backfill

- event registrations
- course registrations

Reason:

- more workflow nuance
- refund/cancellation shape must be interpreted carefully

### 6.4 Last backfill

- manual/external Starter-era records that require admin-declared interpretation

Reason:

- lowest confidence
- likely needs explicit `sourceConfidence: migrated` or `declared`

### 6.5 Backfill execution rule

Backfill is a migration concern, not a permanent read-path concern.

Production target:

- admin read routes may temporarily tolerate a transitional shim during implementation
- production-grade sign-off requires backfill to move into an explicit operator job, script, or migration task
- `/admin` and `/admin/payments` should become ledger-backed read paths without hidden write side effects
- the current implementation path should expose that maintenance action from the payments setup workspace only in platform support mode
- the maintenance action should record last-run status so operators can see whether sync completed, failed, or has never run
- after the first successful historical sync, the maintenance path should prefer incremental replay based on the last successful sync checkpoint
- the payments setup workspace should also expose reconciliation diagnostics for missing native links, ledger mismatches, and workflow-status drift only during platform support inspection

## 7) Data-migration rules

### 7.1 Never delete source collections during initial migration

Keep:

- `nativePaymentTransactions`
- `membershipPayments`
- `memberships`
- registrations

until:

- ledger parity is proven
- support and finance reads have been switched safely

### 7.2 Never infer package tier from current hub state during backfill

Backfill must use the best historical evidence available.

If exact tier/mode cannot be proven:

- use the most defensible inferred value
- set `sourceConfidence: migrated`
- document the assumption

### 7.3 Never merge unrelated commercial events

Examples:

- paid upgrade
- later free/default revert
- re-enrolment after cancellation
- rebooking after refund

Each must remain separate in the ledger.

## 8) Index and query strategy

Recommended initial indexes:

1. `paymentRecords` by `hubId`, `paidAt desc`
2. `paymentRecords` by `hubId`, `financialStatus`, `updatedAt desc`
3. `paymentRecords` by `hubId`, `userId`, `updatedAt desc`
4. `paymentRecords` by `hubId`, `kind`, `updatedAt desc`
5. `paymentRecords` by `hubId`, `reportingEligibility`, `paidAt desc`

Recommended list filters:

- kind
- financial status
- provider
- payment mode
- reporting eligibility

## 9) UI rollout sequence

### 9.1 First rollout

- `/admin` summary cards
- `/admin/payments`

### 9.2 Second rollout

- `/admin/payments/[paymentItemId]`
- member payment history in admin detail

### 9.3 Third rollout

- exports/reconciliation views
- support/operator finance tools

## 10) Validation and sign-off checklist

Do not mark the ledger phase production-ready until all are true:

1. `/admin` revenue and `/admin/payments` revenue are ledger-backed and match
2. paid membership upgrades remain visible before admin approval
3. paid membership history survives reversion to default
4. free/default records do not pollute the main payments list
5. a Starter-era manual/external payment can still appear in unified reporting with clear lower confidence
6. a Growth-era native Stripe payment appears with authoritative confidence
7. a package-tier transition does not change historical reporting outcomes

## 11) Immediate implementation recommendation

The next engineering task should be:

1. add `paymentRecords` data module and schema
2. wire native membership upgrade writes into it
3. switch `/admin` revenue calculation to ledger reads
4. switch `/admin/payments` membership records to ledger reads
5. add a temporary parity comparison mode for local/staging verification

That is the shortest credible path from the current state to a production-grade finance foundation.
