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

Status: implemented and user-verified in production-like route testing.

Verification notes:

- User confirmed the event/course route-family changes look as planned after testing.
- Course list/detail counts now agree after the course registration summary projection repair and display-semantics fix.
- Read-only event/course detail routes no longer show the previously observed edit-only media/payment work.
- Event/course route-family navigation no longer intentionally emits slug-prefixed admin hrefs on host-mode URLs.

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
- Payments ledger projection:
  - projection adds `hubs/{hubId}/paymentItems/{paymentItemId}` as a query-optimized read model
  - existing `paymentRecords` remain canonical during migration
  - `paymentItems` use deterministic ids derived from canonical payment records
  - `createPaymentRecord`, `upsertPaymentRecordBySource`, and `updatePaymentRecord` now maintain the projection
  - manual ledger sync now backfills `paymentItems` after existing membership/native payment normalization
  - the payment item page helper uses stable `sortAt` + document id cursors and currently allows one indexed secondary filter at a time
  - `sortAt` orders by paid/refunded/recorded activity before future `dueAt`, so the admin payments route is naturally ordered by latest paid activity without future event/renewal dates floating above actual payments
  - support-only reconciliation now checks `paymentRecords` to `paymentItems` projection parity
  - projection parity includes lifecycle fields (`occurredAt`, `paidAt`, `dueAt`) so the optimized admin ledger cannot silently display a renewal/event date as a paid date
  - live payment item writes hydrate denormalized member `displayName`/`email` from the hub user record when `userId` exists, preventing active members from appearing as former members in the payments table
  - Firebase `paymentItems` indexes must finish building before admin/member payment UI read paths are cut over
  - admin payments has an opt-in projection-backed report path behind `HUB_PLATFORM_PAYMENT_ITEMS_READ_MODEL_ENABLED=true`
  - in read-model mode, admin payments status/type filters are URL-driven server queries and pagination uses opaque cursor tokens
  - admin payments summary cards now read `hubs/{hubId}/system/paymentSummary` instead of scanning all `paymentItems` during each page load
  - payment summary buckets are rebuilt after canonical payment record writes and once at the end of the support-only ledger sync
  - support diagnostics now expose payment summary reportable/source counts and the summary rebuild timestamp
  - expected steady-state Network/server result: `/admin/payments?view=payments` performs a bounded `paymentItems` page query plus one small `paymentSummary` document read for stat cards
  - migration safety net: if `paymentSummary` is absent, the route can temporarily fall back to deriving the summary from `paymentItems`, but production rollout should run ledger sync so this fallback is not used
  - global search/date filtering and CSV export remain separate Phase 5 follow-up work and must not fall back to broad reads as the permanent enterprise path
  - production has been synced and verified with the read-model flag enabled; the legacy report builder now exists as rollback rather than the intended steady-state path
- Member billing read-model:
  - `/account/billing` uses the projection-backed `listMemberPaymentItems` path when `HUB_PLATFORM_PAYMENT_ITEMS_READ_MODEL_ENABLED=true`
  - member billing is scoped to the authenticated member user id through the indexed `paymentItems` helper
  - `/account` overview requests a smaller bounded member payment slice for recent billing/attention state
  - event/course payment record writes now include `sourceSlug` for future precise member-facing billing actions
  - older projected rows without `sourceSlug` intentionally fall back to `/events` or `/courses` rather than adding per-row public content reads
  - member billing includes informational-only/free rows because it is a member activity/payment-history surface, not an admin revenue report
  - historical free/not-required event bookings and course registrations are backfilled into canonical `paymentRecords`/`paymentItems` by the support-only ledger sync
  - member billing no longer performs a runtime legacy-source merge when the read-model flag is enabled
  - member account nav and billing item action links disable prefetch so sibling account routes and event/course pages are not fetched before navigation
  - expected Network/server result: member billing reads user-scoped `paymentItems` only when the read-model flag is enabled and support sync has completed
  - production verification after ledger sync showed the member billing route using the bounded user-scoped read path, with historical free/not-required records present in the ledger
- Member account bookings/registrations:
  - optimized member activity reads are available behind `HUB_PLATFORM_MEMBER_ACCOUNT_COLLECTION_GROUP_ENABLED=true`
  - event bookings use a collection-group query scoped by `hubId`, `bookerUserId`, and `createdAt desc`
  - course registrations use a collection-group query scoped by `hubId`, `userId`, and `createdAt desc`
  - `/account` requests smaller bounded slices for overview cards, while `/account/bookings` requests a larger bounded slice for the dedicated workspace
  - admin member detail and public recurring-series member booking checks pass explicit bounded limits through the same helpers
  - parent event/course display data is hydrated only for returned rows
  - member-facing reads derive the member id from `requireCurrentMemberSessionForHub`; submitted user ids are not trusted for account route data access
  - legacy fan-out remains as rollout fallback until indexes are built and production verification is complete
  - required Firebase indexes must be deployed before enabling `HUB_PLATFORM_MEMBER_ACCOUNT_COLLECTION_GROUP_ENABLED=true`
  - `hubs/{hubId}/memberActivity/{kind}_{recordId}` now provides the next-stage projection for heavy member histories
  - projection reads are separately gated by `HUB_PLATFORM_MEMBER_ACTIVITY_READ_MODEL_ENABLED=true`
  - required Firebase index: `memberActivity` collection scope with `hubId`, `userId`, `sortAt desc`
  - deploy code and index with the projection read flag disabled first, run support diagnostics **Sync payment ledger**, then confirm the diagnostics `Member activity` synced/scanned counts before enabling the read flag
  - keep `HUB_PLATFORM_MEMBER_ACCOUNT_COLLECTION_GROUP_ENABLED=true` enabled as the safe fallback underneath the projection path
  - live member activity maintenance covers event bookings, course registrations, status/payment/attendance changes, waitlist promotion, member cancellation, and parent event/course edits
  - expected steady-state Network/server result: `/account` and `/account/bookings` read one bounded user-scoped `memberActivity` query instead of hydrating parent event/course records for each returned item
- Member sign-in/account handoff:
  - Firebase ID tokens continue using revoked-token verification during session creation for security-sensitive member/admin access
  - client sign-in uses the token returned by Firebase sign-in without forcing an additional client token refresh
  - session creation uses `getHubCoreBySlug`, not the full operational `getHubBySlug`, because login only needs identity/routing hub fields and must not derive admin counts
  - hub core lookup and revoked-token verification run in parallel where possible
  - `lastSignedInAt` is updated after the response as best-effort audit metadata, so the login response is not blocked by a non-critical write
  - member-directory repair after sign-in is scheduled after the session response instead of blocking the login request
  - successful member sign-in uses a single `router.replace` navigation and does not force a second `router.refresh`
  - the public header receives a lightweight signed-in viewer payload after successful session creation, so the shared public shell can switch from `Join`/`Sign in` to the member/admin utility menu without a full layout refresh
  - sign-in page join CTA disables prefetch so the auth route does not warm the join page before navigation
  - temporary timing diagnostics are available behind `HUB_PLATFORM_PERFORMANCE_TIMING_ENABLED=true`
  - timing diagnostics cover `/api/auth/member/session`, post-response member-directory repair, `/account` shell loading, and `/account` overview data loading
  - expected Network/server result: one `/api/auth/member/session` response followed by one account RSC/navigation request
- Member account route shell:
  - account layout and account child pages use `requireHubCoreBySlug` because member account UI does not need operational hub counts
  - this avoids count hydration scans over users, invites, and events before rendering the account title/shell
  - hub operational count hydration remains available through `requireHubBySlug` for admin/platform surfaces that need it
  - user identity lookups are request-cached so layout/page authorization checks share the same member record load
  - current membership reads use a bounded user-scoped query and request-cached plan hydration
- Payments reconciliation and repair:
  - support diagnostics include a safe repair action for payment reconciliation issues
  - safe repair upserts canonical `paymentRecords` into `paymentItems`, deletes orphan payment item projections, repairs missing native transaction back-links when an unambiguous payment record already exists, repairs paid records missing `paidAt` only from unambiguous source timestamps, hydrates projected member identity, and rebuilds `paymentSummary`
  - safe repair intentionally does not overwrite ambiguous financial state, workflow status drift, or paid dates that can only be guessed from future due dates; those issues remain diagnostics/manual-review items
  - expected support workflow: run ledger sync first for source normalization, then run safe reconciliation repair if projection/back-link drift remains
  - after deploying payment paid-date/member-identity hardening, rerun payment reconciliation; old records may newly flag because the diagnostics now check stricter enterprise ledger invariants
- Admin members directory:
  - `hubs/{hubId}/memberDirectory/{userId}` is the query-optimized read model for `/admin/members`
  - the route uses the read model only when `HUB_PLATFORM_MEMBER_DIRECTORY_READ_MODEL_ENABLED=true`
  - support-only payment ledger sync now rebuilds member-directory rows once after payment ledger/payment summary sync
  - payment attention state is sourced from `paymentItems`, not legacy event/course payment scans
  - summary cards read `hubs/{hubId}/system/memberDirectorySummary`; count queries are rollout fallback only when the summary has not been built
  - expected steady-state Network/server result: `/admin/members` performs one bounded `memberDirectory` page query plus one small `memberDirectorySummary` document read
  - CSV export is a dedicated authorized route and must remain outside normal page load
  - support-only reconciliation detects missing, stale, and orphaned projection rows; safe repair rebuilds the projection and summary

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
