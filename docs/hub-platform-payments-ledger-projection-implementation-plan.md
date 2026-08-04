# Hub Platform Payments Ledger Projection Implementation Plan

## Objective

Replace broad payment report reconstruction with a queryable payment ledger/projection that supports fast admin reports, member billing, attention states, and exports.

## Audit Findings

Payments are one of the largest scalability risks in the current repo.

Relevant audited files:

- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/payments/page.jsx`
- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/payments/[paymentItemId]/page.jsx`
- `apps/hub-platform/src/lib/data/hub-payments.js`
- `apps/hub-platform/src/lib/data/event-booking-queries.js`
- `apps/hub-platform/src/lib/data/course-registration-queries.js`

Current high-risk patterns:

- `getHubPaymentReportByHub` assembles reports from multiple datasets.
- Payment reporting can involve memberships, payment records, native transactions, pending upgrade requests, users, event payment items, and course payment items.
- Event payment items can scan all events and nested bookings.
- Course payment items can scan all courses and nested registrations.
- The admin payments route improved by loading heavy data only for `view=payments`, but the heavy view remains broad.

## Target Data Model

Create a hub-level ledger/projection:

- `hubs/{hubId}/paymentItems/{paymentItemId}`

Recommended fields:

- `hubId`
- `type`: `membership`, `eventBooking`, `courseRegistration`, `nativeTransaction`, `upgradeRequest`
- `sourceCollection`
- `sourceId`
- `sourceParentId`
- `userId`
- `memberId`
- `displayName`
- `email`
- `title`
- `amount`
- `currency`
- `status`
- `paymentStatus`
- `attentionStatus`
- `provider`
- `stripePaymentIntentId`
- `stripeCheckoutSessionId`
- `createdAt`
- `updatedAt`
- `paidAt`
- `dueAt`
- `sortAt`
- `schemaVersion`

Source-of-truth rule:

- Stripe remains the source of truth for Stripe subscription/payment lifecycle.
- Existing domain documents remain the source of truth for event bookings, course registrations, memberships, and native payment configuration.
- The ledger is a query-optimized read model.
- The ledger must be rebuildable from source documents and Stripe/provider references.
- UI reporting can use the ledger only after backfill and dual-read verification prove parity.

Privacy rule:

- Duplicate only the minimum user fields needed for list display and export.
- Treat `email` and `displayName` as copied PII.
- Keep ledger reads scoped by hub authorization.
- Member billing must additionally scope by current user/member id.

## Implementation Phases

### Phase 1: Define Ledger Contract

- Map every current payment source into one normalized ledger item.
- Define stable ids for idempotent writes.
- Define status mapping rules.
- Define detail page lookup behavior.
- Define status transitions for:
  - Checkout completed.
  - Invoice paid.
  - Invoice payment failed.
  - Subscription created.
  - Subscription updated.
  - Subscription deleted.
  - Cancellation scheduled.
  - Cancellation cancelled.
  - Refund created.
  - Dispute opened/resolved.
  - Native payment marked paid/unpaid.
  - Free item registration.
- Define whether `amount` is gross, net, paid, due, or expected.
- Define `sortAt` precedence for unpaid, paid, failed, and scheduled items.

Acceptance criteria:

- Each existing payment source has a ledger representation.
- Duplicate webhook retries cannot create duplicate ledger entries.
- Every status shown in the current UI has a ledger equivalent.

### Phase 2: Add Indexes

Likely indexes:

- `paymentItems`: `hubId`, `sortAt`.
- `paymentItems`: `hubId`, `status`, `sortAt`.
- `paymentItems`: `hubId`, `paymentStatus`, `sortAt`.
- `paymentItems`: `hubId`, `attentionStatus`, `sortAt`.
- `paymentItems`: `hubId`, `userId`, `sortAt`.
- `paymentItems`: `hubId`, `type`, `sortAt`.
- `paymentItems`: `hubId`, `memberId`, `sortAt` if member ids differ from user ids.
- `paymentItems`: `hubId`, `stripeCheckoutSessionId`.
- `paymentItems`: `hubId`, `stripePaymentIntentId`.

Acceptance criteria:

- Indexes are committed to `firestore.indexes.json`.
- Query shapes are documented in code comments or helper names where useful.
- New query paths are not enabled before indexes are deployed.

### Phase 3: Backfill Ledger

- Build a controlled backfill from existing memberships, payment records, native transactions, event bookings, course registrations, and upgrade requests.
- Write ledger entries idempotently.
- Store a migration marker or schema version.
- Include dry-run mode if practical.
- Log source counts and written ledger counts by type.
- Record unresolvable or ambiguous records for manual review.

Acceptance criteria:

- Backfill can run repeatedly without duplicates.
- Backfilled counts reconcile against existing report output.
- Backfill does not overwrite newer live ledger updates with stale source data.

### Phase 4: Maintain Ledger On Writes

Update write paths:

- Stripe checkout/subscription webhooks.
- Native payment transaction creation/update.
- Event booking payment state updates.
- Course registration payment state updates.
- Membership lifecycle changes.
- Upgrade request lifecycle changes.

Acceptance criteria:

- Ledger updates are transactional or idempotent.
- Webhook retry behavior is safe.
- Ledger remains correct after manual admin actions.
- Out-of-order webhooks do not regress ledger state.

Implementation rules:

- Use deterministic ledger ids such as `{sourceType}:{sourceId}` or a documented equivalent.
- Store provider event ids or mutation ids where needed to detect repeated events.
- Compare incoming provider timestamps before overwriting later state.
- Prefer upsert semantics over create-only writes.
- Keep source document update and ledger update in the same transaction where both are Firestore writes.

### Phase 5: Replace Admin Payments Report Reads

- Update payments list to query `paymentItems` with cursor pagination.
- Move filters/search to server query where possible.
- Keep route-specific skeletons and title shell.
- Move CSV/export to dedicated export path or background job.
- Add dual-read comparison mode before full cutover.
- Keep existing report builder behind a fallback flag during rollout.

Acceptance criteria:

- Default payments route does not assemble a full report.
- Filtering by status/type/attention uses indexed queries.
- First page loads from a bounded query.
- Legacy and ledger totals match within explicitly documented rules.

### Phase 6: Replace Member Billing Reads

- Member billing should query current user ledger items only.
- Avoid hub-level payment report assembly in member routes.
- Use user/member scoped indexes.
- Ensure billing route cannot infer other members' payment data through pagination cursors.

Acceptance criteria:

- `/account/billing` uses bounded user-scoped reads.
- Member cannot access another member's ledger items.

### Phase 7: Reconciliation And Repair

- Add reconciliation that compares ledger items with source collections and Stripe/provider data where available.
- Detect missing ledger rows, duplicate ledger rows, stale status, amount mismatch, and orphaned source references.
- Provide a repair mode that can safely rewrite ledger rows.

Acceptance criteria:

- Finance/admin reporting can be trusted after drift checks.
- Support can repair ledger drift without hand-editing Firestore records.

## Edge Cases

- Stripe webhook arrives twice.
- Stripe webhooks arrive out of order.
- Subscription cancellation is scheduled but the subscription remains active.
- Cancellation schedule is removed before period end.
- Payment fails and is later paid.
- Payment is refunded.
- Partial refund.
- Dispute opened and later won/lost.
- Event booking is free.
- Course registration is free.
- Native/offline payment is manually marked paid.
- Event/course is deleted after payment.
- User email changes after payment.
- Member record is merged or recreated.
- Hub currency changes after old payment records exist.
- Backfill runs while new payments are being created.
- Product-site onboarding payment and hub-platform native payment events both exist for the same hub.

## Verification Checklist

- Compare old report totals with ledger-derived totals during migration.
- Test Stripe live webhook retry idempotency.
- Test event booking payment update.
- Test course registration payment update.
- Test membership subscription change.
- Test admin payments first page, filters, detail page, and export.
- Test member billing.
- Test refunds, failed payments, scheduled cancellations, and cancelled scheduled cancellations.
- Test duplicate and out-of-order webhook replay in a non-production environment where possible.
- Run scoped checks and `git diff --check`.
