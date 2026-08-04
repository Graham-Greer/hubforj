# Hub Platform Enterprise Performance Execution Checklist

## Purpose

This document is the final execution control layer for the hub platform performance and scalability plans. It exists so implementation can proceed in small, measurable, reversible slices rather than broad speculative changes.

Use this checklist before, during, and after every implementation phase in the enterprise performance plan set.

Related plans:

- [hub-platform-enterprise-performance-scalability-master-plan.md](hub-platform-enterprise-performance-scalability-master-plan.md)
- [hub-platform-public-content-cache-implementation-plan.md](hub-platform-public-content-cache-implementation-plan.md)
- [hub-platform-public-firestore-query-optimization-plan.md](hub-platform-public-firestore-query-optimization-plan.md)
- [hub-platform-member-account-data-optimization-plan.md](hub-platform-member-account-data-optimization-plan.md)
- [hub-platform-admin-dashboard-counters-implementation-plan.md](hub-platform-admin-dashboard-counters-implementation-plan.md)
- [hub-platform-payments-ledger-projection-implementation-plan.md](hub-platform-payments-ledger-projection-implementation-plan.md)
- [hub-platform-admin-members-directory-optimization-plan.md](hub-platform-admin-members-directory-optimization-plan.md)
- [hub-platform-media-usage-performance-implementation-plan.md](hub-platform-media-usage-performance-implementation-plan.md)

## Phase 0 Baseline Capture

Before changing code for a route or data domain, capture the current behavior.

### Required Baseline Fields

Record:

- Date tested.
- Environment:
  - Local.
  - Vercel preview.
  - Production.
- Route tested.
- Host model:
  - Platform subdomain.
  - Custom domain.
  - Path-mode compatibility route, if relevant.
- Authentication state:
  - Anonymous.
  - Member.
  - Hub admin.
  - Platform admin.
- Screenshot or network capture file name.
- Document load time.
- Largest RSC/document requests.
- Slowest API/server requests.
- Number of unexpected route prefetches, redirects, or duplicate requests.
- Known Firestore-heavy helpers involved.
- Current skeleton/loading behavior.
- Current perceived UX issue.
- Target improvement.

### Baseline Route Matrix

Capture these representative routes before each relevant workstream.

Public anonymous:

- `/`
- `/events`
- `/courses`
- `/testimonials`
- `/what-we-do`

Member account:

- `/account`
- `/account/bookings`
- `/account/membership`
- `/account/billing`
- `/account/profile`

Admin:

- `/admin`
- `/admin/members`
- `/admin/payments`
- `/admin/media`
- `/admin/events`
- `/admin/courses`
- `/admin/settings`

Special flows:

- Product-site owner admin handoff.
- Hub platform onboarding redirect.
- Growth-plan custom domain route.
- Platform subdomain route.

### Baseline Template

Copy this block into the relevant implementation notes before starting a slice.

```md
## Baseline

- Date:
- Environment:
- Route:
- Host model:
- Auth state:
- Screenshot/network file:
- Document load time:
- Slowest requests:
- Unexpected prefetch/redirect/duplicate requests:
- Known Firestore-heavy helpers:
- Current skeleton/loading behavior:
- Current UX issue:
- Target improvement:
```

### Current Admin Detail Slice Notes

- Event detail/edit route:
  - sibling `registrations`, `attendance`, and `export` route prefetches have been disabled on the detail action buttons
  - the detail/edit shell no longer calls `listEventAdminAttendanceRows`
  - summary attendance now uses the event registration counter unless a future verified attendance count is explicitly loaded
  - read-only event detail no longer fetches media folders or payment setup just to prepare the edit form; those dependencies are loaded only for `?mode=edit`
  - read-only recurring event series detail no longer fetches media folders just to prepare the edit form; those dependencies are loaded only for `?mode=edit`
  - event list/detail/series action hrefs and create/delete redirects are built with the current host/path route mode, so subdomain admin navigation does not intentionally hit slug-prefixed URLs that middleware must strip
  - expected Network result: no attendance/registrations/export requests before the admin selects those actions
- Course detail route:
  - sibling registrations, attendance, export, and edit route prefetches have been disabled on detail action buttons
  - course detail now uses course-level registration summary counters for enrolled and active attendance counts
  - read-only course detail no longer fetches media folders or payment setup just to prepare the edit form; those dependencies are loaded only for `?mode=edit`
  - course registration create/status/attendance mutations maintain the summary counters
  - course registration summary projections are trusted only when `registrationSummarySchemaVersion` matches the current projection schema and `registrationSummaryUpdatedAt` is present
  - existing courses with missing or legacy summary metadata perform one lightweight status-only repair read, then subsequent detail/list loads use the course document counters
  - the admin course list uses the same resolved course registration summary projection as course detail, so list badges and detail capacity/attendance counts share one source of truth
  - course list/detail action hrefs and create/delete redirects are built with the current host/path route mode, so subdomain admin navigation does not intentionally hit slug-prefixed URLs that middleware must strip
  - counter maintenance updates `registrationSummaryUpdatedAt` and does not mutate normal course content `updatedAt`
  - expected Network/server behavior: `/admin/courses/[courseId]` should not call `listCourseRegistrations` or hydrate member records for summary counts
  - expected data behavior: course list and course detail counts must match after the first repair load for legacy courses
- Admin onboarding:
  - route-scoped onboarding state is reused per hub once loaded
  - full checklist hydration still occurs only where the checklist is relevant
  - expected Network result: route/query changes such as `?mode=edit` should not produce repeated `onboarding?scope=route` fetches for the same hub

## Per-Slice Rollout Checklist

Every implementation slice must satisfy these gates.

### Before Coding

- Confirm the relevant implementation plan section.
- Confirm the route/data domain is in scope.
- Confirm existing behavior and user journey.
- Capture baseline.
- Identify all source-of-truth documents.
- Identify all read helpers being changed.
- Identify all mutation paths affected by invalidation, counters, or projections.
- Identify required Firestore indexes.
- Decide whether a feature flag is required.
- Decide whether dual-read or dual-write is required.
- Decide rollback behavior.

### During Coding

- Keep route title/shell rendering fast.
- Keep skeleton UI route-specific and token-correct.
- Keep data-heavy reads below Suspense boundaries where applicable.
- Keep shared cache free of auth/session/request data.
- Keep Firestore reads bounded where the slice requires query optimization.
- Preserve legacy fallback until migration is verified.
- Add deterministic projection ids for projection writes.
- Add `schemaVersion`, `updatedAt`, and reconciliation metadata for projections.
- Add cache invalidation through shared helpers, not ad hoc repeated logic.
- Keep exports/background-heavy work out of initial page loads.
- Update the relevant implementation document as decisions are finalized.

### Before Enabling In Production

- Deploy required Firestore indexes.
- Run backfill if required.
- Run reconciliation/dry-run comparison if required.
- Confirm feature flag default.
- Confirm rollback path.
- Confirm authorization and security rules for any new collection or collection group.
- Confirm no unpublished/private/user-specific content can leak through cache or projections.
- Confirm representative routes still render route-specific loading states.

### Verification

- Compare before/after network captures.
- Confirm document load time improvement or Firestore read reduction.
- Confirm route does not trigger unrelated route fetches.
- Confirm redirects did not regress.
- Confirm pagination/search/filter state works.
- Confirm empty, sparse, and populated hub states.
- Confirm custom domain and platform subdomain behavior.
- Confirm member/admin authorization.
- Run scoped static checks where available.
- Run `git diff --check` on touched files.

### Rollback

Rollback must be possible without data loss.

- Disable feature flag.
- Return reads to legacy helper.
- Keep newly written projection documents in place unless they are harmful.
- Do not delete backfilled data during emergency rollback.
- If cache invalidation fails, disable the affected cache helper.
- If indexes are missing, keep optimized query path disabled.
- If projection parity fails, keep dual-read logging and legacy UI output.

## First Implementation Slice

The first implementation should be intentionally narrow.

### Scope

Implement the public anonymous cache foundation for one safe route slice before expanding.

Recommended first route:

- Public hub home route.

Recommended first cached data:

- Hub public core after hub identity is resolved.
- Public site settings needed by the home shell.
- Public header/footer anonymous config.
- Public home shell content that is already visible to anonymous users.

Explicitly out of scope for the first slice:

- Signed-in member/admin header state.
- Events listing pagination.
- Courses listing pagination.
- Payments.
- Members directory.
- Media usage projection.
- Admin dashboard counters.

### First Slice Required Controls

- Public cache utility module.
- Cache feature flag or bypass helper.
- Cache keys based on `hubId`, not hostname.
- Cache tags documented beside helpers.
- Viewer/session overlay kept dynamic.
- Invalidation hook for the exact admin mutation that edits cached home/site settings content.
- Manual verification on platform subdomain and custom domain.
- Manual verification as anonymous visitor and signed-in member/admin.

### First Slice Acceptance Criteria

- Anonymous public home can reuse cached shell content across requests.
- Signed-in state still renders correctly and is not cached globally.
- Updating cached home/site settings content invalidates the cache.
- Unpublished/private content does not appear in cached payloads.
- Route shell and public skeleton behavior do not regress.
- Feature flag can disable durable cache and return to legacy reads.

## Documentation Update Rules

After every implementation slice:

- Mark completed steps in the relevant plan.
- Add any discovered edge cases.
- Add any new required indexes.
- Add any changed rollout or rollback rules.
- Add verification notes.
- Keep this checklist current if the implementation pattern changes.
