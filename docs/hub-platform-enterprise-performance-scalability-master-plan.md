# Hub Platform Enterprise Performance And Scalability Master Plan

## Purpose

This document is the control plan for the performance and scalability work identified in the repository audit. It splits the work into focused implementation plans so each concern can be delivered, reviewed, verified, and rolled back independently.

The target standard is an enterprise-grade HubForJ platform that remains fast and predictable when an individual hub has 1,000+ users and when the platform has many hubs active at the same time.

## Source Audit Summary

The audit found that the application has made strong progress on perceived performance through route shells, Suspense boundaries, route-specific skeletons, and deferred rendering. The remaining risk is mostly backend and data-shape scalability:

- Public site content is mostly fetched from Firestore on demand and uses request-scoped React cache, not durable shared caching.
- Public routes are dynamic because they read request headers and often check session state for personalized header behavior.
- Several public listing queries fetch whole hub collections and sort or filter in memory.
- Admin summary and deferred dashboard data still read large collections and rebuild derived values per request.
- Members and payments routes have improved perceived performance. Payments now use the ledger projection/read model for the main admin and member billing journeys, including URL-driven status/type/date/search filters, cursor pagination, aggregate summary cards, and projection-backed CSV export.
- Payment reporting has been moved from multi-collection reconstruction to a canonical `paymentRecords` source with queryable `paymentItems` and aggregate `paymentSummary` projections.
- Member account bookings and registrations now have collection-group and member-activity projection paths, with legacy fan-out preserved as a fallback.
- Media usage reporting now has lazy projected usage and support reconciliation, with scheduled/internal maintenance added as the fleet-level hardening path.
- Firestore indexes have been expanded for the major projection query shapes; every future query shape must still be documented before use.

## Implementation Documents

0. Execution checklist, baseline capture, and rollout gates:
   [hub-platform-enterprise-performance-execution-checklist.md](hub-platform-enterprise-performance-execution-checklist.md)

1. Public anonymous content caching and invalidation:
   [hub-platform-public-content-cache-implementation-plan.md](hub-platform-public-content-cache-implementation-plan.md)

2. Bounded public Firestore listing queries and indexes:
   [hub-platform-public-firestore-query-optimization-plan.md](hub-platform-public-firestore-query-optimization-plan.md)

3. Member account collection-group and account data optimization:
   [hub-platform-member-account-data-optimization-plan.md](hub-platform-member-account-data-optimization-plan.md)

4. Admin dashboard counters and summary projections:
   [hub-platform-admin-dashboard-counters-implementation-plan.md](hub-platform-admin-dashboard-counters-implementation-plan.md)

5. Payments ledger projection and paginated reporting:
   [hub-platform-payments-ledger-projection-implementation-plan.md](hub-platform-payments-ledger-projection-implementation-plan.md)

6. Admin members server-side pagination and search:
   [hub-platform-admin-members-directory-optimization-plan.md](hub-platform-admin-members-directory-optimization-plan.md)

7. Media usage projection and lazy media hydration:
   [hub-platform-media-usage-performance-implementation-plan.md](hub-platform-media-usage-performance-implementation-plan.md)

## Recommended Execution Order

### Phase 0: Migration Governance And Measurement

This phase must happen before any production-impacting implementation work. The purpose is to make every later optimization measurable, reversible, and safe for live hubs.

Deliver:

- Use the execution checklist:
  [hub-platform-enterprise-performance-execution-checklist.md](hub-platform-enterprise-performance-execution-checklist.md)
- A shared performance baseline for representative routes:
  - Public home: `/`
  - Public events: `/events`
  - Public courses: `/courses`
  - Member account: `/account`
  - Member bookings: `/account/bookings`
  - Member billing: `/account/billing`
  - Admin overview: `/admin`
  - Admin members: `/admin/members`
  - Admin payments: `/admin/payments`
  - Admin media: `/admin/media`
- A lightweight instrumentation convention for server data helpers:
  - Helper name.
  - Route name.
  - Hub id.
  - Query count where practical.
  - Fallback path used or not used.
  - Projection read used or legacy read used.
- Feature flags for risky migrations:
  - Public durable cache enabled.
  - Public bounded queries enabled.
  - Member account collection-group queries enabled.
  - Admin stats projection enabled.
  - Payments ledger projection enabled.
  - Members directory projection enabled.
  - Media usage projection enabled.
- Rollback rules for each feature flag.
- A release checklist that confirms indexes are deployed before code paths requiring them are enabled.

Success metrics:

- Public anonymous repeat views should avoid repeated Firestore reads for cacheable shell/content data.
- Public home above-the-fold content should not wait for testimonials, what-we-do, full event lists, or full course lists.
- Public events and courses first page should use bounded queries and should not read entire published collections.
- Member bookings should not scan every event and course for the hub.
- Admin overview summary cards should not call full payment report assembly.
- Admin members first render should not fetch all members for normal browsing.
- Admin payments first render should not reconstruct a full payment report for normal browsing.
- Media library first render should not calculate full media usage across the content graph.

Rollback conditions:

- Any cache feature must be disabled if unpublished/private content appears publicly, stale public content persists after a verified mutation, or signed-in header state is cached globally.
- Any projection feature must be disabled if it produces incorrect totals, duplicate rows, missing records, or authorization leakage.
- Any bounded query feature must be disabled if legacy published content disappears because required fields were missing.
- Any route-level optimization must be reverted or disabled if the title shell/skeleton strategy regresses to a blank or generic loading experience.

### Phase 1: Public Site Speed Foundation

Start with public content caching and bounded public queries. These changes give the highest visitor-facing return and reduce repeated Firestore reads for anonymous traffic.

Deliver:

- Public anonymous content cache wrappers.
- Tag-based invalidation from admin mutations.
- Bounded public events, courses, testimonials, and what-we-do queries.
- Required Firestore composite indexes.

### Phase 2: Member Account Scalability

Move member account bookings and registrations away from nested fan-out scans. This protects logged-in member routes as hubs grow.

Deliver:

- Collection-group or denormalized index queries for member bookings and registrations.
- Route-specific account query limits.
- Explicit index definitions.

### Phase 3: Admin Operational Data Shape

Replace expensive admin dashboard summaries and payments reporting with maintained projections.

Deliver:

- `hubs/{hubId}/stats/current` counters.
- Payment ledger/projection documents.
- Summary routes using small bounded reads.
- Backfill scripts and reconciliation checks.

Progress:

- Payment ledger/projection documents are implemented for admin payments and member billing.
- Admin dashboard summary strip now prefers `hubs/{hubId}/stats/current` with explicit legacy fallback while hubs are being synced.
- Dashboard stats rebuild is available through support maintenance and is also rebuilt after payment ledger sync.
- Deferred admin dashboard panels now prefer `hubs/{hubId}/stats/dashboardOverview` for recent events, top courses, attention required, and newest members, with explicit fallback during rollout.
- Dashboard projection reconciliation reporting is available in support diagnostics and can detect missing projection documents, schema drift, missing reconciliation metadata, and source-derived data drift.
- Dashboard projections are now maintained after key member, payment, invite, event, course, booking, registration, event-series, and payment-configuration mutations using safe exact projection rebuilds.
- Remaining dashboard work is scheduled/multi-hub maintenance and, if production write volume requires it, queued/debounced or granular incremental updates.

Dependency note:

- Payment-related dashboard counters should prefer the payments ledger once it exists.
- If dashboard counters are implemented before the payments ledger, payment counters must either remain legacy-computed behind a fallback or be marked as transitional so they are not duplicated later.

### Phase 4: Large Admin Lists

Move members and payments list views to server-side pagination, filtering, and search.

Deliver:

- Cursor-based reads.
- URL-driven filter/search state.
- Separate export workflows.
- No full collection fetch for the default view.

### Phase 5: Media Usage

Make media usage reporting lazy or projected so the media library does not scan the whole hub content graph on every visit.

Deliver:

- Usage projection model or on-demand usage hydration.
- Admin mutation invalidation.
- Clear stale-state handling.

### Phase 6: Projection Operations Hardening

Once read models are live, protect correctness through bounded internal maintenance rather than relying only on manual support actions.

Deliver:

- Secured internal projection maintenance endpoint.
- Dry-run reconciliation mode for one hub or a small bounded hub page.
- Repair mode that reuses existing projection sync/rebuild helpers.
- Cron/manual invocation guidance using `INTERNAL_AUTOMATION_SECRET`.
- Documentation for paging through hubs with `nextCursor` instead of running unbounded fleet work.

Progress:

- `/api/internal/projections/reconcile` supports `GET` and `POST`.
- Default mode is dry-run with `limit=1`.
- Repair mode reuses the payment ledger sync chain for payment items, payment summary, member directory, member activity, dashboard stats, and dashboard overview.
- Repair mode also rebuilds media usage projections.
- The route is protected by the same internal automation secret pattern as the existing scheduled processors.

## Shared Engineering Rules

- Keep existing route shells and skeleton strategy intact.
- Do not move data-rich reads back above title/header rendering.
- Prefer server-side bounded Firestore queries over broad reads plus in-memory filtering.
- Use durable cache only for anonymous or safely shared content.
- Keep personalized/session-specific data outside shared public caches.
- Every new query shape must have an index plan before code is merged.
- Every projection must have an initial backfill path, a live update path, and a reconciliation path.
- Add feature flags or compatibility fallbacks where a projection migration affects live data.
- Keep writes idempotent where webhooks, retries, or admin actions can repeat.
- Use dual-read verification before replacing legacy projection consumers:
  - Read projection and legacy source.
  - Compare counts/totals in logs for a limited period.
  - Cut over only when differences are understood.
- Use dual-write only where the projection must stay live during migration.
- Keep projection document ids deterministic so retries overwrite the same document.
- Include `schemaVersion`, `updatedAt`, and where useful `sourceUpdatedAt` on projection documents.
- Do not duplicate sensitive data into projections unless the UI needs it.
- Keep Firestore security rules aligned with every new collection, collection group, and projection.
- Prefer subcollection-scoped projections under `hubs/{hubId}` unless collection-group querying is explicitly required.
- Keep route search/filter state in URL search params for admin list pages.
- Do not make CSV/export readiness part of normal page-load data.

## Global Acceptance Criteria

- Public hub home, events, and courses routes return above-the-fold content without waiting for non-critical listings.
- Anonymous public content reads are cached across requests and invalidated when corresponding admin content changes.
- Public listing routes do not fetch unbounded collections for standard views.
- Member account pages do not scan every event/course and all nested booking/registration documents.
- Admin dashboard summary cards do not depend on full payment report reconstruction.
- Payments reports can render a first page from a single bounded query or small set of projections.
- Members directory default load does not require all members, memberships, upgrade requests, and payment attention items before rendering.
- Firestore indexes required by production query shapes are documented and deployable.
- Existing user journeys continue to work for anonymous visitors, members, hub admins, custom domains, and platform subdomains.
- Feature flags can return each migrated route to its current legacy data path.
- Backfill scripts can be rerun without creating duplicate projection records.
- Projection reconciliation has a documented owner and trigger.
- Authorization behavior is verified for anonymous visitors, members, hub admins, platform admins, and custom-domain traffic.

## Dependency Map

### Independent Or Low-Coupling Work

- Public anonymous content caching can start before projections, provided it only caches already-public data and has a bypass flag.
- Public bounded queries can start early, provided legacy field backfill and indexes are handled first.
- Media usage lazy loading can start before a projection by simply removing usage scans from initial route data.

### Coupled Work

- Admin dashboard payment counters depend on the payments ledger for the cleanest final state.
- Admin members `paymentAttentionCount` should depend on the payments ledger rather than continuing to scan event/course payment items.
- Member account billing should converge on the payments ledger for user-scoped billing history.
- Public cache invalidation depends on all admin mutation paths being identified.
- Media public cache invalidation depends on knowing which media references affect public pages.

### Sequencing Guardrails

- Do not remove legacy report builders until projections have passed dual-read verification.
- Do not enable a new Firestore query shape in production until its index is deployed.
- Do not switch public queries to strict field filters until legacy documents have missing fields backfilled or compatibility behavior is implemented.
- Do not enable shared caching for a helper that reads cookies, headers, sessions, draft state, or user-specific permissions.

## Verification Strategy

For each focused plan:

- Capture before and after network waterfalls for representative routes.
- Confirm no route regresses to a generic loading screen where a route-specific shell exists.
- Confirm Firestore reads are bounded using code inspection and, where possible, emulator or production metrics.
- Run scoped static checks where available.
- Run `git diff --check` on touched files.
- Update the relevant implementation plan with completed steps and any discovered follow-up risks.

Route verification matrix:

- Anonymous public:
  - Platform subdomain.
  - Custom domain.
  - Missing hub.
  - Draft/unpublished content.
  - Published content update.
- Member account:
  - No bookings or registrations.
  - Event bookings only.
  - Course registrations only.
  - Mixed paid/free records.
  - Cancelled/refunded records.
- Admin:
  - New hub with sparse data.
  - Established hub with many users.
  - Hub with many events/courses.
  - Hub with failed payments/attention states.
  - Hub with large media library.
- Product-to-hub flows:
  - New owner handoff.
  - Existing owner handoff.
  - Growth custom domain hub.
  - Platform subdomain hub.
