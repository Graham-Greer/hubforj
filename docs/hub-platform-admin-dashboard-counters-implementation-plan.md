# Hub Platform Admin Dashboard Counters Implementation Plan

## Objective

Replace expensive admin dashboard summary calculations with maintained counter/projection documents so `/admin` remains fast for large hubs.

## Audit Findings

The admin overview has improved perceived speed through Suspense and lazy sections. The remaining issue is that summary and deferred data can still require many broad Firestore reads.

Relevant audited files:

- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/page.jsx`
- `apps/hub-platform/src/lib/data/hub-admin.js`
- `apps/hub-platform/src/lib/data/hub-payments.js`

Current high-risk patterns:

- Dashboard summary can read users, members, invites, memberships, upgrade requests, events, event series, courses, and payment item data.
- Revenue summary can call payment report assembly.
- Deferred dashboard overview repeats several full reads.
- At scale, every admin visit can recalculate values that should be stored operational counters.

## Target Data Model

Add a hub-level stats document:

- `hubs/{hubId}/stats/current`

Potential fields:

- `memberCount`
- `activeMemberCount`
- `pendingInviteCount`
- `pendingUpgradeRequestCount`
- `publishedEventCount`
- `upcomingPublishedEventCount`
- `publishedCourseCount`
- `activeCourseCount`
- `openPaymentAttentionCount`
- `revenueMonthToDate`
- `revenueLast30Days`
- `updatedAt`
- `reconciledAt`
- `schemaVersion`

Use small companion projections where counters alone are not enough:

- Recent events summary.
- Newest members summary.
- Top courses summary.
- Attention required summary.

Counter accuracy model:

- Operational counters should be treated as fast read models, not the only source of truth.
- Source collections remain the authority for domain state.
- Counters must be rebuildable through reconciliation.
- Every counter must declare whether it is exact, eventually consistent, or approximate.
- Admin UI should tolerate missing or stale stats with a clear fallback.

Recommended metadata:

- `schemaVersion`
- `updatedAt`
- `reconciledAt`
- `reconciliationStatus`
- `lastMutationId` where useful
- `counterSources`

## Implementation Phases

### Phase 1: Define Counter Ownership

For each stat, identify:

- Source collection.
- Write paths that mutate it.
- Whether it can be incremented safely.
- Whether it needs scheduled reconciliation.
- Whether webhook retries can duplicate updates.
- Whether the counter depends on another projection such as the payments ledger.
- Whether the counter should be recomputed instead of incremented.

Acceptance criteria:

- Every counter has an owner and reconciliation rule.
- No counter is introduced without identifying all mutation paths.
- A counter ownership table exists in the implementation notes before code changes begin.

### Phase 2: Add Read Helpers With Fallbacks

- Add `getHubAdminStatsByHubId`.
- Preserve a fallback path to compute stats from existing data if the stats document is missing.
- Make fallback explicit and observable in logs.
- Keep fallback output shape identical to projection output.
- Include stale-state information for admin display or debug logging.

Acceptance criteria:

- Existing hubs continue working before backfill.
- New route reads prefer `stats/current`.
- Missing stats do not break `/admin`.

### Phase 3: Backfill Existing Hubs

- Add a controlled backfill script or admin-only maintenance helper.
- Compute stats from current data once.
- Write `stats/current` with `schemaVersion`.
- Use deterministic writes and avoid creating duplicate stats documents.
- Log hub id, source counts, written counters, and reconciliation status.

Acceptance criteria:

- Backfill can be run safely more than once.
- Backfilled stats match current computed values.
- Backfill failures for one hub do not prevent other hubs from being processed.

### Phase 4: Maintain Counters On Writes

Update mutation paths:

- Member create/delete/status changes.
- Invite create/accept/revoke.
- Membership create/update/cancel.
- Upgrade request create/approve/reject.
- Event publish/unpublish/date changes.
- Course publish/unpublish changes.
- Payment item create/update/status changes.

Acceptance criteria:

- Counters update as admin actions occur.
- Stripe/webhook retry paths are idempotent.
- Transactions or batched writes are used where consistency matters.
- Concurrent writes cannot push counters below zero or double-count a retried event.

Implementation rules:

- Use transactions when a counter update depends on current state.
- Use deterministic mutation ids where repeated webhooks/actions can arrive.
- Store enough previous state or compare before/after values so status transitions update counters correctly.
- Prefer recomputing complex counters from projections during reconciliation rather than encoding fragile increment/decrement rules everywhere.

### Phase 5: Replace Dashboard Reads

- Update summary strip to use `stats/current`.
- Update deferred panels to query bounded summary lists instead of rebuilding from all data.
- Keep existing skeleton and Suspense behavior.
- If payment ledger is not live yet, keep payment/revenue summaries on a transitional path rather than inventing a second payment projection.

Acceptance criteria:

- Summary cards render from one small document and minimal hub identity data.
- Deferred panels use bounded queries.
- Dashboard does not call full payment report assembly for summary cards.

### Phase 6: Reconciliation Job

- Add a scheduled or manually triggered reconciliation path.
- Recompute counters from authoritative sources or projections.
- Write reconciliation metadata.
- Log differences before overwriting values.

Acceptance criteria:

- Counter drift can be detected and corrected.
- Reconciliation can be run after incidents, migrations, or webhook outages.

## Edge Cases

- New hub with no members, events, courses, or payments.
- Counter document missing.
- Counter document exists with old `schemaVersion`.
- Stripe webhook retry repeats a payment transition.
- Subscription cancellation is scheduled but not active yet.
- Event date changes from past to future or future to past.
- Published event is unpublished.
- Member status changes from active to inactive and back.
- Upgrade request is created and then cancelled/rejected.
- Payment attention item is resolved manually.
- Backfill runs while live writes are happening.

## Verification Checklist

- Test dashboard for hub with no stats document.
- Run backfill and compare computed values.
- Create/update/delete representative entities and verify counters.
- Confirm `/admin` network waterfall does not wait on broad collection reads.
- Confirm route-specific skeleton behavior remains stable.
- Test stale/missing stats fallback.
- Test reconciliation after deliberate counter drift in a non-production environment.
- Run scoped checks and `git diff --check`.
