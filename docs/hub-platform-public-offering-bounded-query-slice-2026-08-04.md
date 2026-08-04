# Public Offering Bounded Query Slice - 2026-08-04

## Scope

This slice implements the first bounded Firestore query pass for public events and courses.

It targets:

- Public events deferred listing data.
- Public recurring event series data referenced by the returned public event occurrences.
- Public courses deferred listing data.

Explicitly out of scope:

- Server-side search.
- Cursor pagination UI.
- Public event/course detail page lookup optimization.
- Admin event/course list optimization.
- Event/course projection documents.

## Baseline

- Date: 2026-08-04.
- Environment: source-level audit.
- Routes:
  - `/events`
  - `/courses`
- Current behavior:
  - Events query all published events, hydrate public media for all, then filter visibility and activity in memory.
  - Events also queried every event series on the hub before grouping recurring occurrences.
  - Courses query all published courses, hydrate public media for all, then filter visibility and activity in memory.
  - Courses then count enrolled registrations for every returned course.
- Target improvement:
  - Bounded public offering reads using indexed `status + startAt` and `status + endAt` query shapes.
  - Preserve ongoing multi-day offerings and future offerings.
  - Keep existing client-side search/filter UX unchanged for the bounded result set.

## Implementation

Updated:

- `apps/hub-platform/src/lib/data/event-queries.js`
- `apps/hub-platform/src/lib/data/event-series-queries.js`
- `apps/hub-platform/src/lib/data/event-series.js`
- `apps/hub-platform/src/lib/data/public-site.js`
- `apps/hub-platform/src/lib/data/course-queries.js`
- `apps/hub-platform/.env.example`
- `firestore.indexes.json`

## Query Model

Public events use two bounded queries when enabled:

- `status == "published"` and `startAt >= cutoff`, ordered by `startAt`, limited to 120.
- `status == "published"` and `endAt >= cutoff`, ordered by `endAt`, limited to 120.

Public courses use two bounded queries when enabled:

- `status == "published"` and `startAt >= cutoff`, ordered by `startAt`, limited to 120.
- `status == "published"` and `endAt >= cutoff`, ordered by `endAt`, limited to 120.

Results are merged by document id, normalized, media-hydrated only for returned records, and then passed through the existing domain visibility filters.

Public recurring event series are fetched only for the `seriesId` values referenced by the returned event occurrence list. This removes the public route's previous full event-series read and uses public media hydration for series records.

## Feature Flag

The optimized path is disabled by default.

Enable only after Firestore indexes are deployed and built:

```env
HUB_PLATFORM_PUBLIC_BOUNDED_OFFERING_QUERIES_ENABLED=true
```

Rollback:

```env
HUB_PLATFORM_PUBLIC_BOUNDED_OFFERING_QUERIES_ENABLED=false
```

## Required Indexes

Committed in `firestore.indexes.json`:

- `events`: `status ASC`, `startAt ASC`
- `events`: `status ASC`, `endAt ASC`
- `courses`: `status ASC`, `startAt ASC`
- `courses`: `status ASC`, `endAt ASC`

Deploy before enabling the feature flag:

```bash
firebase deploy --only firestore:indexes --project community-app-c2f67
```

## Safety Controls

- The legacy broad-read path remains available while the feature flag is disabled.
- Visibility is intentionally not included in the Firestore query yet because legacy missing `visibility` fields normalize to public in code but would be excluded by a strict Firestore `where("visibility", "==", "public")`.
- Existing member-only visibility behavior is preserved by running `canViewPublishedEvent` and `canViewPublishedCourse` after the bounded query.
- Ongoing multi-day offerings are preserved by querying both `startAt` and `endAt` bounds.
- Existing client-side search/filter UI remains unchanged.
- The event count helper used by admin/package enforcement remains exact and is not capped by the public listing limit.
- The public events route no longer reads every event series before grouping; it fetches only referenced series records.

## Tradeoffs

- The first slice limits public listing payloads to a generous bounded set rather than implementing full cursor pagination.
- Search/filter remains client-side over the returned bounded result set.
- Very large hubs with more than 120 near-term offerings may require the next phase: server-side pagination/search/filtering.
- Legacy documents missing both `startAt` and `endAt` remain excluded from optimized public listing reads. Current create/update flows require and write these fields.

## Verification Completed

- Source inspection confirmed optimized query paths are feature-flagged off by default.
- Source inspection confirmed public events/courses still use existing domain visibility filters.
- Source inspection confirmed public event series are fetched by referenced ids only and use public media hydration.
- Source inspection confirmed public course enrolled-count hydration now receives a bounded course id list when the flag is enabled.
- `firestore.indexes.json` parses as valid JSON.
- `git diff --check` passed for touched implementation files.

## Verification Still Required In Runtime

Before enabling:

- Deploy Firestore indexes.
- Confirm indexes show as built in Firebase.

After enabling in preview/non-production:

- Load `/events` anonymously.
- Load `/events` as a signed-in member if member-only events exist.
- Confirm future public events still appear.
- Confirm ongoing multi-day events still appear.
- Confirm draft/cancelled/past events do not appear.
- Confirm event search/category filters still work over the displayed result set.
- Load `/courses` anonymously.
- Load `/courses` as a signed-in member if member-only courses exist.
- Confirm future public courses still appear.
- Confirm ongoing multi-day courses still appear.
- Confirm draft/cancelled/past/private/invite-only courses do not appear.
- Confirm course search/type filters still work over the displayed result set.
- Compare network waterfall before/after for `/events` and `/courses`.

## Follow-Up

Next phase should implement true server-side cursor pagination and search/filter state for large hubs. That should happen only after route UX requirements are defined because it changes the current client-side filtering model.
