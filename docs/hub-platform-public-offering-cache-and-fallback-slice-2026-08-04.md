# Hub Platform Public Offering Cache And Fallback Slice - 2026-08-04

## Purpose

This slice improves perceived and repeat-load performance for anonymous public `/events` and `/courses` routes after the bounded Firestore query slice.

The route shell already returns independently from the data-heavy listing sections. This slice completes that shape by:

- caching anonymous public events deferred listing data;
- caching anonymous public courses deferred listing data, including displayed enrolment counts;
- preserving dynamic member-specific visibility for signed-in members;
- replacing empty Suspense fallbacks with route-specific public listing skeletons;
- wiring cache invalidation to the mutation surfaces that change public listing output.

## Implemented Scope

### Cached Anonymous Events

File:

- `apps/hub-platform/src/lib/data/public-site.js`

Anonymous event deferred data now uses `unstable_cache` through `createPublicContentCache`.

Cache key:

- `hub-public-events-deferred`
- `hub.id`
- `hub.locale || "default"`

Cache tags:

- `hub:{hubId}`
- `hub:{hubId}:events`
- `hub:{hubId}:media`

The cached payload contains the grouped public event listing data returned to the route.

Signed-in members do not use this anonymous cache. Member requests still resolve `getCurrentMemberSessionForHub` and use the member-aware visibility path so members-only events remain available only to members.

### Cached Anonymous Courses

File:

- `apps/hub-platform/src/lib/data/public-site.js`

Anonymous course deferred data now uses `unstable_cache` through `createPublicContentCache`.

Cache key:

- `hub-public-courses-deferred`
- `hub.id`
- `hub.locale || "default"`

Cache tags:

- `hub:{hubId}`
- `hub:{hubId}:courses`
- `hub:{hubId}:media`

The cached payload contains public course records plus displayed `enrolledCount` values. This is intentionally cached only for anonymous requests and invalidated when course registration status can change capacity labels.

Signed-in members do not use this anonymous cache. Member requests still use the member-aware visibility path and calculate counts dynamically.

## Invalidation

### Shared Cache API

File:

- `apps/hub-platform/src/lib/cache/public-content.js`

Added:

- `revalidatePublicEventsCache(hubId)`
- `revalidatePublicCoursesCache(hubId)`

Updated:

- `revalidatePublicMediaCache(hubId)` now also invalidates public `events` and `courses` tags because offering listing cards can display media assets.

### Events

Files:

- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/events/create/actions.js`
- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/events/[eventId]/actions.js`
- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/events/series/[seriesId]/actions.js`

Public event cache invalidates after:

- single event creation;
- recurring event series creation;
- event update;
- event delete;
- recurring event series update.

### Courses

Files:

- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/courses/create/actions.js`
- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/courses/[courseId]/actions.js`
- `apps/hub-platform/src/lib/data/course-registration-mutations.js`

Public course cache invalidates after:

- course creation;
- course update;
- course delete;
- course registration creation;
- course registration status changes.

Course registration invalidation is required because the public course listing displays available-space labels derived from enrolled counts.

## Loading UI

Files:

- `apps/hub-platform/src/components/patterns/public-offering-fallbacks/PublicOfferingFallbacks.jsx`
- `apps/hub-platform/src/components/patterns/public-offering-fallbacks/PublicOfferingFallbacks.module.css`
- `apps/hub-platform/src/components/patterns/public-offering-fallbacks/index.js`
- `apps/hub-platform/src/app/(hub)/[hubSlug]/events/page.jsx`
- `apps/hub-platform/src/app/(hub)/[hubSlug]/courses/page.jsx`

Added `PublicOfferingListingFallback`, a public-token skeleton for data-heavy offering listing sections.

The fallback reserves:

- search/filter toolbar;
- listing context line;
- featured/card layout for default and studio variants;
- card grid for editorial variant;
- media blocks, title blocks, body copy, and metadata rows.

The fallback intentionally does not replace the route hero. The hero remains part of the fast shell.

## Guardrails

- Do not cache member-specific offering data.
- Do not remove the existing bounded Firestore query feature flag.
- Do not rely on TTL for freshness; use tag invalidation for admin/public mutations.
- Course registration status changes must continue to invalidate courses because available-space labels are user-facing.
- Media edits must continue to invalidate public events/courses because card images can be reused by offerings.
- Package/capability updates are covered by the `hub:{hubId}` tag on anonymous offering caches.

## Verification Checklist

- Load `/events` anonymously twice in production; second load should benefit from the anonymous listing cache.
- Load `/courses` anonymously twice in production; second load should benefit from the anonymous listing cache.
- Confirm signed-in members can still see members-only offerings that anonymous visitors cannot.
- Create, edit, unpublish, and delete an event; confirm anonymous `/events` reflects the change after the action.
- Create, edit, unpublish, and delete a course; confirm anonymous `/courses` reflects the change after the action.
- Enrol in a course and cancel/change registration status; confirm the public course available-space label refreshes.
- Change an offering image in media/admin; confirm the public card image refreshes.
- Compare network waterfalls for `/events` and `/courses` after deployment.
