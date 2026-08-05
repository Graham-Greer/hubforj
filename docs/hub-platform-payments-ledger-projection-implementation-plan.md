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

### Current Phase Status

- Phase 1, ledger contract: implemented for canonical `paymentRecords` projected into deterministic `paymentItems`.
- Phase 2, indexes: committed in `firestore.indexes.json`; Firebase indexes have been built for the current planned payment item query shapes.
- Phase 3, backfill: implemented through the support-only payment ledger sync action, including historical membership, native payment, event booking, and course registration normalization.
- Phase 4, maintain on writes: implemented for `createPaymentRecord`, `upsertPaymentRecordBySource`, and `updatePaymentRecord`.
- Phase 5, replace admin payments report reads: implemented behind `HUB_PLATFORM_PAYMENT_ITEMS_READ_MODEL_ENABLED=true` with URL-driven status/type filters, cursor pagination, and an aggregate `paymentSummary` read model for summary cards. Production has been synced and verified by route testing.
- Phase 6, replace member billing reads: implemented behind `HUB_PLATFORM_PAYMENT_ITEMS_READ_MODEL_ENABLED=true`; production has been synced and verified after historical free/not-required member activity backfill.
- Phase 7, reconciliation and repair: support-only diagnostics and safe repair mode are implemented for projection drift, orphan projection cleanup, missing native transaction back-links, missing projected member identity, and paid records/items missing actual `paidAt` timestamps. Current production diagnostics should be rerun after deploying this paid-date/member-identity hardening pass.

Current migration rule:

- Keep member payment UI on the legacy report builder only when `HUB_PLATFORM_PAYMENT_ITEMS_READ_MODEL_ENABLED` is unset or false as an emergency rollback path.
- With `HUB_PLATFORM_PAYMENT_ITEMS_READ_MODEL_ENABLED=true`, member billing reads use the user-scoped `paymentItems` read model.
- Keep admin payment UI on the projection-backed read model after all `paymentItems` indexes are enabled, ledger sync has populated payment items, payment summary diagnostics are present, and support diagnostics show no unresolved projection parity issues.
- `HUB_PLATFORM_PAYMENT_ITEMS_READ_MODEL_ENABLED=true` is the intended production mode after those checks pass.

Payment ledger hardening rule:

- The admin payments table remains an actual payment ledger and the date column must represent a real paid date for paid rows.
- `sortAt` is an ordering cursor only. It must not be used as the primary display date for paid rows because it can legally fall back to future `dueAt` values such as event dates or membership renewal dates.
- `paymentItems` must carry `displayName` and `email` whenever `userId` points to an existing hub user. Live payment-record writes should hydrate those values centrally rather than relying on a later manual sync.
- Historical paid rows that predate the read-model rollout may be missing `paidAt`; reconciliation must flag them and safe repair may infer `paidAt` only from unambiguous source fields such as native transaction `paymentReceivedAt`, event/course workflow `paymentCompletedAt`, or membership payment `occurredAt`.
- Safe repair must not invent paid dates from event start dates, course dates, or membership renewal dates.

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

Implementation note:

- The repo already has `hubs/{hubId}/paymentRecords`, which is the canonical payment record layer used by Stripe/native payment flows and existing reporting. The new `hubs/{hubId}/paymentItems` collection is the query-optimized read model from this plan.
- `paymentRecords` remain the source of truth during migration.
- `paymentItems` use deterministic ids derived from the source payment record: `payment_record_{paymentRecordId}`.
- A `paymentRecord` can represent membership cycles, membership upgrades, event bookings/registrations, course registrations, and native Stripe-backed outcomes.
- Native transaction-only records are first normalized into `paymentRecords` by the existing sync/backfill process, then projected into `paymentItems`.
- Rollout history: the first implementation slice created and maintained the read model before UI cutover. The current production-ready path uses `paymentItems` for the admin payments and member billing journeys when `HUB_PLATFORM_PAYMENT_ITEMS_READ_MODEL_ENABLED=true`.

Current projection contract:

- Collection: `hubs/{hubId}/paymentItems/{paymentItemId}`.
- `schemaVersion`: `1`.
- `type` values:
  - `membership`
  - `eventBooking`
  - `courseRegistration`
  - `upgradeRequest`
- `sourceCollection`: currently `paymentRecords`.
- `sourceId`: the canonical payment record source id where available, otherwise the payment record id.
- `paymentRecordId`: the canonical `paymentRecords` document id.
- `sourceParentId`:
  - event id for event bookings
  - course id for course registrations
  - membership id or upgrade request id for memberships/upgrades
- `status`: canonical operational status from the payment record.
- `paymentStatus`: canonical financial status from the payment record.
- `attentionStatus`:
  - `action_required` for unpaid, overdue, or failed reportable items that are not cancelled
  - `none` for settled, cancelled, or informational-only items
- `sortAt` precedence:
  - paid date
  - refunded date
  - due date
  - occurrence date
  - updated date
  - created date
- PII copied into the projection is limited to `displayName` and `email`.
- Ledger sync/backfill hydrates `displayName` and `email` from existing hub users where available.
- Later payment status updates preserve existing projected `displayName` and `email` unless the caller explicitly supplies a replacement user.

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

Implementation note:

- Phase 2 index definitions have been added for `paymentItems`.
- UI reads remain on the legacy report path until these indexes are deployed and a dual-read comparison slice verifies parity.
- The first `listPaymentItemPageByHubId` helper uses stable cursor pagination with `sortAt` plus document id ordering.
- The helper intentionally supports only one secondary indexed filter at a time in this slice: `status`, `paymentStatus`, `attentionStatus`, `type`, `userId`, or `memberId`.
- Do not add combined filter UI until the corresponding composite index and helper contract have been added deliberately.

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

Implementation note:

- The first backfill slice projects existing `paymentRecords` into `paymentItems`.
- Existing `syncHubPaymentLedger` now runs the previous membership/native normalization first, then projects all eligible `paymentRecords` into `paymentItems`.
- Sync status now records `paymentItemsTotal`, `paymentItemsScanned`, `paymentItemsSynced`, `paymentItemsSkipped`, and `paymentItemsLatestSourceTimestamp`.
- Support diagnostics on the payments setup screen now display the payment item sync counters alongside the existing membership/native sync counters.
- Event/course fallback payment items that do not yet have canonical `paymentRecords` remain on the legacy report path until their write paths are fully normalized into payment records or a later compatibility mapper is added.

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

Implementation note:

- `createPaymentRecord`, `upsertPaymentRecordBySource`, and `updatePaymentRecord` now project to `paymentItems` after the canonical `paymentRecords` write.
- Projection document ids are deterministic, so webhook retries and repeated admin actions overwrite the same read-model document.
- This first slice does not yet move all source writes into a single Firestore transaction with the projection write. Because `paymentRecords` remain canonical and projection writes are idempotent/rebuildable, temporary projection lag is acceptable during the migration window.

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
- Use the projection helper rather than composing Firestore queries inside the route/page component.
- First cutover should support one indexed filter at a time. Combined filters must either be applied client-side within a bounded result set for a clearly documented temporary slice, or added with explicit composite indexes before production use.

Acceptance criteria:

- Default payments route does not assemble a full report.
- Filtering by status/type/attention uses indexed queries.
- First page loads from a bounded query.
- Legacy and ledger totals match within explicitly documented rules.

Implementation note:

- The first admin payments read-model slice adds `getHubPaymentProjectionReportByHub`.
- The admin payments route now chooses the projection-backed report only when `HUB_PLATFORM_PAYMENT_ITEMS_READ_MODEL_ENABLED=true`.
- With the flag unset or false, the route continues using the legacy `getHubPaymentReportByHub` report builder.
- In read-model mode, payment status and payment type filters are URL-driven and executed on the server through indexed `paymentItems` queries.
- In read-model mode, pagination uses opaque cursor tokens and does not require loading the full report.
- Pagination affects table rows only; financial/stat summary cards are calculated separately from the full relevant projection set for the selected server filter.
- Summary duplicate suppression must run across the full relevant projection set, not just the current cursor page.
- Summary cards now read `hubs/{hubId}/system/paymentSummary` instead of scanning all `paymentItems` on each admin payments load.
- The `paymentSummary` aggregate stores buckets for:
  - all reportable payment items
  - admin payment type: `membership`, `event`, `course`
  - payment status: `paid`, `unpaid`, `overdue`, `failed`, `refunded`, `partially_refunded`, `not_required`
- Each bucket stores counts, overdue count, record status counts, collected revenue minor totals by currency, and refunded revenue minor totals by currency.
- Currency totals are stored in minor units and formatted at read time with the hub locale/currency context.
- Aggregate construction applies informational-only exclusion and paid membership upgrade versus membership-cycle duplicate suppression before bucket totals are calculated.
- If the aggregate document is missing during rollout, the admin payments route temporarily falls back to rebuilding the summary shape from `paymentItems` in-memory for correctness. This fallback is a migration safety net only and should not be treated as the steady-state enterprise path.
- The membership type filter queries both `membership` and `upgradeRequest` projection types so membership upgrades remain visible in the membership view.
- To avoid unplanned composite indexes, the read-model UI allows one indexed server filter at a time: choosing a type clears payment status, and choosing payment status clears type.
- Search and date inputs currently filter within the returned bounded page only. Global search/date filtering remains a follow-up because it needs a deliberate indexing/export strategy.
- The projection-backed route maps a bounded projection page into the existing UI item shape.
- The projection-backed report applies the same paid membership upgrade versus membership-cycle duplicate suppression used by the legacy report, so collected revenue does not double-count a paid upgrade and its matching generated membership payment row.
- Row display must not apply revenue-summary duplicate suppression or informational-only exclusion after fetching a bounded page. Those rules belong to summary/reporting aggregates; applying them to page rows can collapse a normal page to one visible record when recent records are mostly free/not-required or duplicate-suppressed rows.
- CSV export amount display must use the same normalized formatting rules as the admin payments table: `not_required` and zero-value membership rows display as `Free`, minor-unit values are formatted with the record currency and hub locale, and missing amounts display as `Amount to be confirmed`.
- The default CSV export is an admin-facing operational export, not a raw ledger reconciliation dump. It should expose only the fields admins need in day-to-day use, with one readable `Amount` column and the record `Currency`.
- Payment export dates are admin-facing display values, not raw ISO timestamps. `Paid Date` uses the hub locale/country formatting context so exported CSVs are readable for non-technical operators.
- `createPaymentRecord`, `upsertPaymentRecordBySource`, and `updatePaymentRecord` rebuild the aggregate after updating the canonical record and projected payment item.
- The support-only `Sync payment ledger` action rebuilds the aggregate once after payment records have been projected into `paymentItems`.
- Support diagnostics display payment summary reportable/source counts and the last summary rebuild timestamp.
- Remaining Phase 5 work is the export/global search/date strategy. Do not reintroduce broad report assembly for those paths; add explicit query/index support or a background export job.

Rollout order:

1. Confirm Firebase `paymentItems` indexes are enabled.
2. Run support-only payment ledger sync.
3. Confirm `Payment items` sync counts are populated.
4. Confirm `Payment summary` diagnostics show a rebuilt timestamp and expected reportable/source counts.
5. Confirm support-only reconciliation has no unresolved projection parity issues.
6. Set `HUB_PLATFORM_PAYMENT_ITEMS_READ_MODEL_ENABLED=true` in the target environment.
7. Verify `/admin/payments?view=payments` uses the projection-backed report and still opens existing detail routes via `ledger_{paymentRecordId}` links.
8. Verify summary cards remain stable while moving between cursor pages, and change only when status/type filters change.

### Phase 6: Replace Member Billing Reads

- Member billing should query current user ledger items only.
- Avoid hub-level payment report assembly in member routes.
- Use user/member scoped indexes.
- Ensure billing route cannot infer other members' payment data through pagination cursors.

Acceptance criteria:

- `/account/billing` uses bounded user-scoped reads.
- Member cannot access another member's ledger items.

Implementation note:

- `listMemberPaymentItems` now chooses the projection-backed path when `HUB_PLATFORM_PAYMENT_ITEMS_READ_MODEL_ENABLED=true`.
- Projection-backed member billing queries `hubs/{hubId}/paymentItems` with:
  - `hubId == current hub id`
  - `userId == current authenticated member user id`
  - `orderBy sortAt desc`
  - stable document id ordering through the shared payment item page helper
- The member account overview calls the same helper with a smaller limit because it renders only recent billing and an attention count.
- The full `/account/billing` route remains bounded and currently loads the first 100 user-scoped ledger items, matching the existing client-side search/filter workspace without introducing broad hub reads.
- The projection mapper preserves the existing member billing UI shape:
  - membership, event, and course `kind`
  - title
  - payment status
  - amount/currency
  - billing date
  - contextual detail text
  - event/course source ids where available
- `sourceSlug` has been added to the payment record and payment item projection contract for future precise member-facing event/course links.
- New event/course checkout and payment-sync writes populate `sourceSlug`.
- Existing projected records created before this slice may not have `sourceSlug`; those member billing actions safely fall back to `/events` or `/courses` instead of performing extra per-row lookup reads.
- Duplicate paid membership upgrade versus membership-cycle suppression is applied to the user-scoped projection list before rendering.
- Informational-only payment items are included in member billing because member billing is an account activity/payment-history view, not an admin revenue report.
- Admin revenue/reporting paths continue to exclude informational-only rows where appropriate.
- Historical event bookings and course registrations are backfilled into canonical `paymentRecords` by the support-only ledger sync before `paymentItems` are rebuilt.
- The projection-backed member helper no longer performs a runtime legacy-source merge; production member billing should be served from the user-scoped `paymentItems` read model once sync has run.
- Event/course `not_required` source records are preserved as `financialStatus: not_required` and `reportingEligibility: informational_only`, so member billing can display them while admin revenue reporting can continue excluding them.
- If the read-model flag is false, the legacy composer remains available as rollback and still reads membership, event bookings, course registrations, and payment records.

Remaining Phase 6 follow-up:

- Add cursor pagination to the member billing UI before the route needs to show more than the bounded first-page result set.
- Backfill `sourceSlug` for existing event/course payment records if precise historical “View event/course” links become important enough to justify the migration.
- Continue confirming support diagnostics show event booking and course registration sync counts after future production syncs.
- If any historical source family is later found missing from `paymentItems`, add it to the support-only backfill rather than reintroducing runtime fallback reads.
- Consider a small member billing summary aggregate only if individual members regularly exceed the bounded result size.

### Phase 7: Reconciliation And Repair

- Add reconciliation that compares ledger items with source collections and Stripe/provider data where available.
- Detect missing ledger rows, duplicate ledger rows, stale status, amount mismatch, and orphaned source references.
- Provide a repair mode that can safely rewrite ledger rows.

Acceptance criteria:

- Finance/admin reporting can be trusted after drift checks.
- Support can repair ledger drift without hand-editing Firestore records.

Implementation note:

- The support-only payment reconciliation report now compares canonical `paymentRecords` with projected `paymentItems`.
- It flags:
  - missing projected payment items for canonical payment records
  - stale or mismatched projection fields
  - orphaned payment items whose canonical payment record no longer exists
- This diagnostic intentionally runs only in the support diagnostics path, not on normal admin/member payment routes.
- Safe repair mode has been added to the support diagnostics path.
- Safe repair does:
  - upsert every `paymentRecord` into its deterministic `paymentItems` projection
  - delete orphan `paymentItems` that point to missing canonical `paymentRecords`
  - repair missing `nativePaymentTransactions.paymentRecordId` back-links when exactly one canonical payment record already references that transaction
  - rebuild `paymentSummary` once after repair
- Safe repair deliberately does not auto-resolve ambiguous financial conflicts, such as transaction/payment-record mismatch where both sides point at different records, missing native transactions, or workflow/payment status drift. Those remain visible diagnostics for manual review or a more specific source-of-truth repair.
- If workflow records are missing canonical ledger records, run the support-only payment ledger sync first, because sync is the source-normalization repair path for historical membership/event/course/native records.

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
