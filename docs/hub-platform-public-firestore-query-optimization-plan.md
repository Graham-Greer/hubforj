# Hub Platform Public Firestore Query Optimization Plan

## Objective

Replace unbounded public listing reads with indexed, bounded Firestore queries so public site pages remain fast as hubs grow.

## Audit Findings

The public site currently has several read patterns that work for small hubs but become expensive as content volume grows.

Relevant audited files:

- `apps/hub-platform/src/lib/data/public-site.js`
- `apps/hub-platform/src/lib/data/event-queries.js`
- `apps/hub-platform/src/lib/data/course-queries.js`
- `apps/hub-platform/src/lib/data/testimonials.js`
- `apps/hub-platform/src/lib/data/what-we-do.js`
- `firestore.indexes.json`

Current high-risk patterns:

- Published events are fetched broadly and sorted in memory.
- Active upcoming event counts read published event start dates and filter in memory.
- Published courses are fetched broadly and sorted in memory.
- Testimonials are fetched broadly, sorted in memory, and media hydrated.
- What-we-do items are fetched broadly, sorted in memory, then sliced.
- Firestore index file only contains a small subset of needed composite indexes.

## Target Query Model

Public pages should query exactly what they need:

- Home featured events: published, visible, upcoming, ordered by start date, limited.
- Events listing: published, visible, ordered by start date or configured sort, paginated.
- Courses listing: published, visible, ordered by configured sort/start date, paginated.
- Testimonials: published, ordered by sort/display priority, limited where appropriate.
- What-we-do: published, ordered by sort/display priority, limited.
- Counts: use aggregate counters or bounded count strategy, not full collection scans.

## Required Data Contract Decisions

Before implementation, confirm or encode:

- Event visibility/status fields that define public visibility.
- Course visibility/status fields that define public visibility.
- Whether event listing should show only upcoming events by default.
- Whether past events require a separate archive query.
- Course sort precedence: featured, start date, manual sort, created date, or title.
- Testimonial sort precedence.
- What-we-do sort precedence.

Legacy field policy:

- If a query will require `visibility`, every legacy document must be backfilled or the query must use a compatibility path.
- If a query will order by `sortOrder`, legacy missing values must receive deterministic defaults.
- If a query will order by `startAt`, missing or invalid dates must be excluded intentionally or migrated.
- If recurring event instances are represented separately from parent series, public listing queries must define whether they query instances, parent events, or both.
- If cancelled events remain published, listing behavior must explicitly include or exclude them.
- If archived/past content is still visible, it must have a separate query path from upcoming content.

Compatibility rule:

- The first implementation may keep a feature flag for bounded query reads.
- During rollout, compare bounded query results against legacy output for a representative hub.
- Do not permanently hide legacy published content because a newly required field is absent.

## Implementation Phases

### Phase 1: Inventory Current Query Shapes

- List every public route that consumes events, courses, testimonials, and what-we-do.
- Record the fields used for filtering, ordering, and pagination.
- Record current fallback behavior for missing fields.
- Identify route-specific page sizes and featured item limits.
- Identify whether each consumer requires hydrated media.
- Identify whether each consumer needs total count, has-more state, or both.

Acceptance criteria:

- No public listing query is changed without knowing its consumer.
- Missing legacy field behavior is documented before query constraints are tightened.
- Every route consumer has an expected output order documented.

### Phase 1.5: Backfill Or Normalize Query Fields

- Add a data migration plan for missing `visibility`, `sortOrder`, `startAt`, `featured`, and status fields.
- Make defaults explicit:
  - Published but missing visibility should default only if that matches current public behavior.
  - Missing sort order should use a stable fallback such as created date plus document id.
  - Missing dates should not silently move content to the top of listings.
- Keep migration idempotent.

Acceptance criteria:

- Legacy content remains visible where it was visible before.
- New query constraints have the fields they need.
- Migration can be rerun safely.

### Phase 2: Add Composite Indexes

Add Firestore indexes for planned query shapes.

Likely indexes:

- Events by `hubId`, `status`, `visibility`, `startAt`.
- Events by `hubId`, `status`, `startAt` if `visibility` is not consistently present.
- Courses by `hubId`, `status`, `visibility`, `startAt` or `sortOrder`.
- Courses by `hubId`, `status`, `sortOrder`.
- Testimonials by `hubId`, `status`, `sortOrder`.
- What-we-do items by `hubId`, `status`, `sortOrder`.
- Add secondary deterministic ordering where Firestore query constraints allow it.
- Add collection group indexes only if public data is queried across subcollections.

Acceptance criteria:

- Indexes are committed in `firestore.indexes.json`.
- Deployment instructions are included in the implementation PR or notes.
- Local code does not require console-created indexes that are absent from source control.
- Code paths that require new indexes stay behind a flag until indexes are deployed.

### Phase 3: Replace In-Memory Sorting With Indexed Queries

- Update event helpers to use `where`, `orderBy`, and `limit`.
- Update course helpers to use `where`, `orderBy`, and `limit`.
- Update testimonials and what-we-do helpers to query in display order.
- Keep legacy fallback handling scoped and measurable.
- Preserve existing route data shapes so UI components do not need broad changes.
- Hydrate media only for returned documents, not for the entire collection.

Acceptance criteria:

- Standard public routes do not fetch entire published collections.
- Route output matches existing user-facing ordering rules.
- Query errors from missing indexes are resolved through committed index definitions.
- Any fallback path logs route, hub id, helper, and reason.

### Phase 4: Add Cursor Pagination For Listings

- Events and courses listing pages should support cursor-based pagination.
- Avoid client-side filtering over large fetched arrays.
- Preserve current URL/search parameter behavior.
- Encode cursors safely so users cannot request another hub's data.
- Handle invalid, expired, or deleted cursor documents gracefully.
- Use stable sort plus a tie-breaker to avoid duplicate/missing items between pages.

Acceptance criteria:

- First page load is bounded.
- Next page load is bounded.
- Search/filter state remains shareable via URL where applicable.
- Pagination works after an item is unpublished between page requests.

### Phase 5: Replace Full Count Reads

- Move active upcoming published event counts to `hubStats/current` or a small aggregate document.
- Avoid full reads solely to compute dashboard/public counts.
- If exact counts are expensive, prefer `hasMore` over exact totals on public listing pages.
- Keep exact public counts only where they materially improve UX.

Acceptance criteria:

- Count display does not scan all public documents.
- Counter updates have a reconciliation path.

### Phase 6: Add Query Observability

- Add development/debug logging for query mode:
  - Legacy broad read.
  - Bounded indexed read.
  - Cache hit where applicable.
- Capture before/after route waterfalls and Firestore read counts where possible.

Acceptance criteria:

- Engineers can verify the bounded path is active in production without guessing.
- Regressions to broad reads are visible during review.

## Edge Cases

- Legacy published content missing new query fields.
- Event starts exactly at the current time.
- Timezone differences for upcoming/past event boundaries.
- Recurring event parent versus instance ordering.
- Cancelled but published events.
- Sold-out events that are still public.
- Draft event with a public slug collision.
- Course with no start date but manually sorted.
- Featured item ordering versus chronological ordering.
- Testimonials/what-we-do items with identical sort order.
- Deleted media referenced by a public listing item.
- Invalid pagination cursor.

## Verification Checklist

- Compare public home network and server logs before/after.
- Confirm events listing first page reads only the configured page size plus small metadata.
- Confirm courses listing first page reads only the configured page size plus small metadata.
- Publish, unpublish, and edit events/courses and verify listing order.
- Deploy Firestore indexes before relying on production query shapes.
- Verify legacy content after migration/backfill.
- Verify pagination under create/update/delete between page loads.
- Run scoped static checks and `git diff --check`.

## Implementation Progress

### 2026-08-04 - Public Events/Courses Bounded Query Foundation

Status: implemented at source level behind feature flag, pending index deployment and runtime verification.

Completed:

- Added bounded public event listing reads using `status + startAt` and `status + endAt`.
- Added bounded public course listing reads using `status + startAt` and `status + endAt`.
- Replaced the public events route's full event-series read with referenced-series reads using public media hydration.
- Kept optimized path disabled by default with `HUB_PLATFORM_PUBLIC_BOUNDED_OFFERING_QUERIES_ENABLED=false`.
- Added required Firestore indexes to `firestore.indexes.json`.
- Preserved existing domain visibility filters for legacy compatibility.
- Preserved exact event count helper for admin/package enforcement.
- Added implementation note:
  [hub-platform-public-offering-bounded-query-slice-2026-08-04.md](hub-platform-public-offering-bounded-query-slice-2026-08-04.md)

Pending:

- Deploy Firestore indexes.
- Enable feature flag in preview/non-production.
- Runtime verify public events and courses routes.
- Plan server-side pagination/search/filtering as a later slice.
