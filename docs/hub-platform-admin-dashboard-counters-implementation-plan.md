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

Counter ownership table:

| Counter | Source of truth | Current projection source | Accuracy | Maintenance rule |
| --- | --- | --- | --- | --- |
| `memberCount` | `users` where `hubId` and `role=member` | `stats/current` rebuilt from Firestore count aggregation | Exact at rebuild time | Rebuild during dashboard stats sync; future incremental maintenance can follow user create/delete/status mutation paths. |
| `activeMemberCount` | `users` where `hubId`, `role=member`, `status=active` | `stats/current` rebuilt from Firestore count aggregation | Exact at rebuild time | Rebuild during dashboard stats sync; user status changes remain authoritative until incremental maintenance is added. |
| `pendingInviteCount` | `hubs/{hubId}/invites` where `status=pending` | `stats/current` rebuilt from Firestore count aggregation | Exact at rebuild time | Rebuild during dashboard stats sync; invite create/accept/revoke can incrementally update later. |
| `pendingUpgradeRequestCount` | `hubs/{hubId}/membershipUpgradeRequests` pending rows | `memberDirectorySummary.upgradeRequests` into `stats/current` | Exact when member directory is synced | Payment ledger/member directory sync rebuilds this before dashboard stats; support dashboard stats sync can repair after member directory repair. |
| `suspendedMemberCount` | `users` member status | `memberDirectorySummary.suspended` into `stats/current` | Exact when member directory is synced | Rebuild via member directory sync/dashboard stats sync. |
| `openPaymentAttentionCount` | `paymentItems`/member payment attention state | `memberDirectorySummary.paymentAttention` into `stats/current` | Exact when payment ledger and member directory are synced | Ledger sync rebuilds payment items, payment summary, member directory, then dashboard stats. |
| `activeUpcomingPublishedEventCount` | `hubs/{hubId}/events` published rows and date fields | `stats/current` rebuilt from selected `startAt/endAt` fields | Exact at rebuild time | Rebuild during dashboard stats sync; event publish/date mutations can be added later. |
| `activeUpcomingPublishedCourseCount` | `hubs/{hubId}/courses` published rows and date fields | `stats/current` rebuilt from selected `startAt/endAt` fields | Exact at rebuild time | Rebuild during dashboard stats sync; course publish/date mutations can be added later. |
| `totalRevenue` | canonical payment ledger/projection | `paymentSummary.byAdminType.all.collectedRevenueMinorByCurrency` into `stats/current` | Exact when payment summary is synced | Ledger sync rebuilds payment summary before dashboard stats. |

### Phase 2: Add Read Helpers With Fallbacks

- Add `getHubAdminStatsByHubId`.
- Preserve a fallback path to compute stats from existing data if the stats document is missing.
- Make fallback explicit and observable in logs.
- Keep fallback output shape identical to projection output.
- Include stale-state information for admin display or debug logging.

Status: implemented for the dashboard summary strip.

Implementation notes:

- Added `apps/hub-platform/src/lib/data/hub-dashboard-stats.js`.
- Added `getHubAdminStatsByHubId`.
- Added `getHubAdminDashboardStatsWithFallback`.
- `/admin` summary strip now prefers `hubs/{hubId}/stats/current`.
- Missing or old-schema stats fall back to explicit source computation and log a warning.
- The fallback is for rollout safety only; it should not be treated as the steady-state enterprise path.
- Summary strip revenue now reads from `paymentSummary` via dashboard stats instead of rebuilding the full payment report.
- Lower dashboard panels are intentionally unchanged in this pass and remain the next projection target.

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

Status: implemented as a support-only per-hub maintenance action.

Implementation notes:

- Added `rebuildHubAdminDashboardStats`.
- `stats/current` is deterministic and can be safely overwritten.
- Existing support ledger sync now rebuilds dashboard stats after payment summary and member directory sync complete.
- Added a support-only **Sync dashboard stats** action in payment setup diagnostics for targeted repair.
- Added the same support-only **Sync dashboard stats** action in member directory diagnostics so non-Growth hubs have a universal dashboard stats maintenance path.
- The support-only dashboard stats sync now rebuilds both `stats/current` and `stats/dashboardOverview`.
- Sync records `schemaVersion`, `updatedAt`, `reconciledAt`, `reconciliationStatus`, `rebuiltBy`, and `counterSources`.
- The current slice is per-hub by design. A multi-hub script/job remains future work if production operations require bulk migration.

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

Status: implemented for dashboard summary cards and deferred dashboard panels.

Completed:

- Summary strip now uses `stats/current` when present.
- Summary strip missing-stats fallback is explicit and shape-compatible.
- Dashboard no longer needs full payment report assembly for summary-card revenue once stats are synced.
- Existing Suspense and skeleton behavior is preserved.
- Added `hubs/{hubId}/stats/dashboardOverview` as the bounded companion projection for the deferred dashboard panels.
- Deferred dashboard overview now prefers the single overview projection document for:
  - recent event cards
  - top course cards
  - attention required items
  - newest members
- Overview projection stores compact panel payloads and `adminPath` values. Runtime reads map those paths through the current hub route mode so custom-domain and Hubforj-hosted URLs stay correct.
- Overview projection rebuild uses source scans only inside explicit support/sync maintenance, not during the normal projected `/admin` render.
- If the overview projection is missing or old-schema during rollout, the helper performs an explicit logged fallback that returns the same shape.

Remaining:

- Add a formal reconciliation report for `stats/current` and `stats/dashboardOverview`.
- Add incremental or scheduled maintenance after the projected source of truth has been verified in production.
- Consider a multi-hub support job before operating large production fleets.

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
