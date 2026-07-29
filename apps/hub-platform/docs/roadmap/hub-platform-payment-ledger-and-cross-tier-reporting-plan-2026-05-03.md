# Hub-Platform Payment Ledger And Cross-Tier Reporting Plan

Status:
- Proposed production-grade finance architecture
- Supersedes ad hoc assumptions that current operational records can double as a full reporting ledger

Date:
- 2026-05-03

Purpose:
- define the target production-grade payment architecture for `hub-platform`
- unify finance/reporting truth across memberships, events, and courses
- preserve continuity when a community moves between package tiers such as Starter and Growth

Authority:
- [Stripe Two-Domain Architecture Note](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/stripe-two-domain-architecture-note-2026-04-20.md)
- [Hub-Platform Native Payments Support And Finance Runbook](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/hub-platform-native-payments-support-and-finance-runbook-2026-05-01.md)
- [Hub-Platform Native Payments Rollout And Verification Runbook](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/hub-platform-native-payments-rollout-and-verification-runbook-2026-05-01.md)

## 1) Problem statement

`hub-platform` currently stores payment-relevant state across multiple collections:

- `hubs/{hubId}/membershipPayments`
- `hubs/{hubId}/nativePaymentTransactions`
- `hubs/{hubId}/memberships`
- `hubs/{hubId}/membershipUpgradeRequests`
- `hubs/{hubId}/events/{eventId}/registrations`
- `hubs/{hubId}/courses/{courseId}/registrations`

This is serviceable for feature delivery, but it is not ideal for production-grade finance operations because:

- there is no single authoritative "all community payments" ledger
- workflow state and finance state are partially mixed together
- reporting can drift when records are interpreted differently by different surfaces
- package-tier transitions can fragment a community's financial history

## 2) Production-grade target

The target architecture is:

- one canonical payment ledger for all community payment/reporting truth
- separate workflow records for memberships, upgrade requests, event registrations, and course registrations
- finance surfaces and reporting derived from the ledger, not from mutable workflow documents

In this target model:

- `memberships` answers "what plan does this member currently have?"
- `membershipUpgradeRequests` answers "is a membership change awaiting approval?"
- `registrations` answer "what booking/enrolment exists?"
- `paymentRecords` answers "what commercial event happened and what is its financial outcome?"

## 3) Canonical ledger collection

Introduce:

- `hubs/{hubId}/paymentRecords/{paymentRecordId}`

Each `paymentRecord` represents one commercial/payment unit, for example:

- a membership cycle payment
- a membership upgrade payment
- an event booking payment
- a course enrolment payment

### 3.1 Suggested record shape

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

  currency: "GBP",
  amountMinor: 1500,
  amountDisplay: "15.00",

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

  nativeTransactionId: "...",
  stripeCheckoutSessionId: "...",
  stripePaymentIntentId: "...",
  stripeRefundId: "...",

  membershipId: "...",
  membershipUpgradeRequestId: "...",
  eventId: "...",
  eventRegistrationId: "...",
  courseId: "...",
  courseRegistrationId: "...",

  supersedesPaymentRecordId: "",
  replacedByPaymentRecordId: "",

  packageTierAtTime: "starter" | "growth" | "free",
  paymentProcessingModeAtTime: "none" | "external" | "internal",
  sourceConfidence: "authoritative" | "declared" | "migrated",
  reportingEligibility: "count_in_revenue" | "informational_only",

  createdAt: "ISO date",
  updatedAt: "ISO date",
  createdBy: "...",
  updatedBy: "..."
}
```

## 4) Package-tier transition requirement

This is a core production requirement.

A community can move between package tiers over time:

- Free
- Starter
- Growth

That means payment processing behavior can also change over time:

- Free: non-chargeable/default flows only
- Starter: external/manual paid flows
- Growth: native Stripe paid flows

If the ledger does not snapshot the payment context at the time of the transaction, reporting continuity breaks.

### 4.1 Required invariants

1. Historical payment records must not be rewritten when a hub changes package tier.
2. Every payment record must snapshot:
   - `packageTierAtTime`
   - `paymentProcessingModeAtTime`
   - `provider`
3. Reporting must be able to show:
   - total recorded community revenue
   - native Stripe collected revenue
   - manual/external confirmed revenue
4. A downgrade from Growth to Starter must not erase or distort Growth-era finance history.
5. A future upgrade from Starter to Growth must not make earlier external/manual revenue invisible.

### 4.2 Confidence model

Not all sources carry the same trust level.

Recommended interpretation:

- `authoritative`
  - webhook-backed native Stripe records
- `declared`
  - admin-confirmed manual/external records
- `migrated`
  - backfilled legacy records where exact historical certainty is lower

This allows unified reporting without pretending every record has the same provenance.

## 5) Finance rules

### 5.1 Revenue must come from the ledger only

Do not derive reporting revenue from:

- current membership state
- visible payment queue rows
- upgrade request status
- event/course registration operational state alone

Revenue and refund reporting must come from `paymentRecords`.

### 5.2 Workflow status and finance status must remain separate

Example:

- `operationalStatus: pending_confirmation`
- `financialStatus: paid`

This is required for cases where:

- member completed payment
- hub admin has not yet approved the upgrade

The workflow may still be pending, but the money event has already happened.

### 5.3 Historical meaning must never be overwritten

If a member:

- upgrades
- downgrades
- reverts to default
- re-enrols
- rebooks

the historical paid record must remain distinct.

Any new state should create:

- a new ledger row
- or a new linked non-chargeable informational row

It must not reuse a previous chargeable payment record for a different business meaning.

### 5.4 Free/default records

Free/default membership records may still exist in the ledger when useful for continuity, but:

- they should use `financialStatus: not_required`
- they should default to `reportingEligibility: informational_only`
- they should normally be excluded from the main admin payments list unless specifically needed

## 6) Role of current collections after ledger introduction

### 6.1 `nativePaymentTransactions`

Keep this as the provider event ledger for native Stripe.

Use it to store:

- provider identifiers
- webhook-driven state changes
- refund event details

But do not treat it as the long-term admin/reporting surface directly.

### 6.2 `membershipPayments`

This should be treated as transitional history during migration.

Long term:

- migrate its business meaning into `paymentRecords`
- stop using it as the admin finance source of truth

### 6.3 Memberships and registrations

These remain valuable workflow records, but they should reference `paymentRecordId` rather than act as the primary payment history themselves.

## 7) Read-path target

### 7.1 `/admin`

Revenue cards should be computed from `paymentRecords`.

They may later expose:

- total recorded revenue
- native collected revenue
- refunded amount
- net revenue

### 7.2 `/admin/payments`

The queue should read from `paymentRecords`.

This route should show:

- chargeable records by default
- payment state and amount from the ledger
- linked workflow context by reference

### 7.3 Member detail payment history

Member history should also read from `paymentRecords` so historical paid cycles survive membership changes cleanly.

## 8) Migration strategy

### Phase 1: Introduce the ledger

1. Add `paymentRecords`.
2. Start writing new native membership upgrade payments to it.
3. Start reading admin revenue cards and `/admin/payments` from it where practical.

### Phase 2: Membership normalization

1. Backfill `membershipPayments` into `paymentRecords`.
2. Route membership payment history through the ledger.
3. Remove reliance on mutable membership assignments for finance reporting.

### Phase 3: Events and courses

1. Project event and course payment flows into `paymentRecords`.
2. Project refunds into the same ledger model.
3. Keep registrations as workflow state, not as the ledger itself.

### Phase 4: Reporting and support hardening

1. Add ledger-backed finance summaries.
2. Add export/reconciliation support.
3. Add operator-facing inspection tools backed by the ledger.

## 9) Production rollout gates for the ledger

Do not call the payment/reporting layer production-grade until:

1. a hub can move from Starter to Growth without losing historical reporting continuity
2. a hub can move from Growth to Starter without corrupting earlier native revenue truth
3. paid membership upgrades remain visible after reversion to default
4. event/course refunds reconcile in the same ledger used by revenue reporting
5. admin payment records and admin revenue summaries are derived from the same source

## 10) Recommended immediate next implementation step

The next implementation step should be:

1. add `paymentRecords`
2. write new membership upgrade flows into it
3. switch `/admin` revenue cards to it
4. switch `/admin/payments` to it
5. preserve current collections as secondary context during migration

This provides the fastest path from the current workable model to a production-grade reporting source of truth.
