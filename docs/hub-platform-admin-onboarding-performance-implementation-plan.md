# Hub Platform Admin Onboarding Performance Implementation Plan

## Objective

Upgrade admin onboarding so it remains helpful without becoming a cross-portal performance tax.

The current onboarding runtime is productively integrated across the admin portal, but its client fetch appears in network traces on ordinary admin route loads. This plan separates fast route rendering from onboarding hydration, reduces repeated server reads, and gives the checklist its own deliberate data path.

The finished system should:

- keep admin route shell and main content fast
- avoid blocking route interactivity on onboarding state
- avoid fetching full checklist data outside `/admin`
- avoid repeated onboarding fetches while navigating inside the same hub/admin session
- keep route tours, checklist, and help launcher behavior intact
- preserve first-time onboarding correctness
- avoid broad Firestore source scans during routine route loads
- provide instrumentation so future regressions are measurable

## Current State Audit

### Core Files

Admin layout:

- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/layout.jsx`

Client runtime:

- `apps/hub-platform/src/components/patterns/admin-onboarding/AdminOnboardingProvider.jsx`
- `apps/hub-platform/src/components/patterns/admin-onboarding/AdminOnboardingHelpLauncher.jsx`
- `apps/hub-platform/src/components/patterns/admin-onboarding/AdminOnboardingChecklist.jsx`
- `apps/hub-platform/src/components/patterns/admin-onboarding/AdminOnboardingModal.jsx`
- `apps/hub-platform/src/components/patterns/admin-onboarding/AdminOnboardingSpotlightLayer.jsx`

API route:

- `apps/hub-platform/src/app/api/admin/hubs/[hubSlug]/onboarding/route.js`

Server data layer:

- `apps/hub-platform/src/lib/data/admin-onboarding.js`

Config/routing:

- `apps/hub-platform/src/lib/admin-onboarding/config.js`
- `apps/hub-platform/src/lib/admin-onboarding/routing.js`
- `apps/hub-platform/src/lib/admin-onboarding/selectors.js`
- `apps/hub-platform/src/lib/admin-onboarding/video-assets.js`

Related docs:

- `docs/admin-onboarding-engineering-plan.md`
- `docs/admin-onboarding-product-spec.md`
- `docs/admin-onboarding-map.md`
- `docs/hub-platform-skeleton-loading-performance-implementation-plan.md`

### Current Runtime Flow

`HubAdminLayout` wraps all authenticated admin users in `AdminOnboardingProvider`.

The provider:

- derives the admin base path
- checks whether the current route is the base `/admin`
- treats `/admin` as checklist scope
- treats other admin routes as route scope
- fetches `/api/admin/hubs/{hubSlug}/onboarding`
- uses `?scope=route` when not on `/admin`
- stores state in local React state
- auto-opens eligible route journeys after state loads
- exposes help launcher actions
- pushes users to `/admin?setupChecklist=1` when they select "View setup checklist"

This is good product behavior, but it means onboarding participates in ordinary route load/network timing.

### Current Server Flow

`GET /api/admin/hubs/[hubSlug]/onboarding`:

- calls `requireHubOperatorRouteAccess`
- resolves the hub/access context
- reads the persisted onboarding document for `hubId + actorId`
- resolves package entitlements
- may load Stripe/payment configuration when native payments are enabled
- when checklist is included, checks for existence of records in:
  - `whatWeDoItems`
  - `testimonials`
  - `events`
  - `courses`
  - `mediaAssets`
- builds checklist item completion state
- returns full onboarding state

`PATCH /api/admin/hubs/[hubSlug]/onboarding`:

- validates operator access
- saves the whole normalized onboarding state document
- returns the full normalized state

### Observed Performance Symptoms

Network screenshots have repeatedly shown onboarding fetches as visible route-load cost, commonly around or above one second in production-like conditions.

The problem is most visible because:

- the fetch happens across the admin portal
- it is client-side after the page starts loading
- it runs even when the admin does not open onboarding help
- checklist scope does multiple Firestore existence reads
- route scope still pays auth/access + onboarding document + entitlement/payment setup costs
- the UI can feel like the route is still doing background work even after the main route has improved

### Current Strengths To Preserve

- Onboarding is per hub and per admin user.
- Checklist lives on `/admin`, which is conceptually right.
- Non-`/admin` routes already request smaller `scope=route`.
- "View setup checklist" from other routes routes the user to `/admin`.
- The provider already tracks loaded hub/scope and avoids some repeated same-scope loads.
- Route journeys are config-driven and route-aware.
- Static journey config already lives client-side and does not need to be fetched.
- Persistence is best-effort on the client, which avoids making UI feel broken after a write failure.

### Code Audit Findings Before Implementation

The plan has been checked against the current codebase. The following implementation details must guide the work:

- `AdminOnboardingHelpLauncher` currently returns `null` while `onboarding.loading` is true. If route hydration is delayed, the help launcher will appear later unless we introduce a lightweight non-loaded launcher state.
- `AdminOnboardingChecklist` already supports `checklistHydrating` and renders an accurate checklist-shaped skeleton only when the provider says checklist hydration is happening.
- `AdminOnboardingProvider` currently uses one `loading` flag for both route/bootstrap hydration and checklist hydration. This needs to be split, otherwise route-scope lazy loading and checklist-scope hydration will continue to influence unrelated UI.
- `listRouteJourneyKeys` requires `state.capabilities` for capability-gated route matching. Any bootstrap/route payload must include the capability keys used by onboarding route matching, especially `coursesEnabled`, `paymentsEnabled`, and native-payment related flags.
- `getAdminOnboardingState` already skips checklist record-count reads when `includeChecklist` is false, but it still reads payment configuration when native payments are enabled. Instrumentation must confirm whether payment configuration is a meaningful route-scope cost before we move it behind checklist/payment-route-only logic.
- `AdminOnboardingProvider` currently creates `routeKey` from pathname plus the full query string. Query-only changes can influence checklist reveal behavior. Any caching/scheduling change must preserve `setupChecklist=1` handling without refetching route scope for harmless filter/search query changes.
- The existing performance timing helper is `createPerformanceTimer` in `apps/hub-platform/src/lib/observability/performance-timing.js`. Phase 0 should use this helper rather than adding a second timing system.
- Internal projection maintenance already uses boolean include flags in `apps/hub-platform/src/lib/server/projection-maintenance.js`. If onboarding summary projection is added, it should follow the same pattern as `includeEventAttendance`, for example `includeAdminOnboarding`.
- The projection maintenance normalizer now preserves JSON boolean `false`. New maintenance flags should use the same normalizer path.
- Source mutation coverage for an onboarding summary projection crosses multiple existing data modules and server actions: what-we-do, testimonials, event mutations, course mutations, media upload/delete, regional setup, and payment configuration/webhook changes.

## Enterprise Standard

Admin onboarding should be:

- helpful but not blocking
- lazily hydrated when route work matters more
- exact when the checklist is visible
- safe under slow networks
- resilient when projection data is temporarily stale
- measurable via server timing logs
- compatible with the existing route journey model
- easy to reconcile or repair when checklist/projection state drifts

The core standard is:

- Admin route content should not wait on onboarding.
- Checklist data should be loaded only when the checklist can be shown.
- Route help should be available quickly, but route data should win the first paint.
- Automatic tours should never block page interactivity.

## Target Architecture

Split onboarding into three payload levels.

### 1. Bootstrap State

Purpose:

- enough to render the help launcher
- enough to know if onboarding is enabled for this user/hub
- enough to determine high-level preferences and dismissed/completed route journeys
- no checklist completion source scans

Payload:

- `hubId`
- `actorUserId`
- `actorRole`
- `version`
- `welcomeJourney`
- `routeJourneys`
- `checklist.dismissed`
- `checklist.lastViewedAt`
- `preferences`
- `capabilities`
- `packageTier`
- `paymentProcessingMode`
- optional `paymentSetupStateKey`
- `checklistHydrated: false`

Use:

- normal admin routes
- route-level help launcher
- route journeys
- auto-open decisions

### 2. Checklist State

Purpose:

- exact setup checklist on `/admin`
- visible only when the checklist can render or is explicitly requested

Payload:

- bootstrap state fields
- `checklist.items`
- `checklistHydrated: true`
- checklist data source metadata

Use:

- base `/admin`
- `/admin?setupChecklist=1`
- support/debug verification

### 3. Mutation/Patch State

Purpose:

- persist route journey progress, dismissed/completed state, checklist dismissed state, preferences

Payload:

- ideally patch-shaped updates, not the entire onboarding state

First implementation can keep the existing full-state `PATCH` to reduce risk, but the plan should preserve a path toward narrower patch actions later.

## Key Design Decisions

### Decision 1: Checklist Hydration Only On `/admin`

The checklist belongs to the base admin overview route.

Other routes should not fetch checklist item completion facts. When an admin selects "View setup checklist", route to `/admin?setupChecklist=1`, then hydrate checklist scope there.

Acceptance:

- `/admin/events`, `/admin/courses`, `/admin/payments`, `/admin/members`, settings routes, create routes, edit routes, and detail routes do not fetch checklist source counts during normal load.
- `/admin` can fetch checklist data because the checklist is part of that page experience.

### Decision 2: Route Onboarding Must Not Block Route Perception

Route-level onboarding can load after route content.

Implementation options:

- fetch bootstrap state after first render
- schedule route-scope hydration with `requestIdleCallback` when available
- use a short `setTimeout` fallback
- keep help launcher hidden or minimal until bootstrap state is available

Acceptance:

- route title and main content do not wait for onboarding fetch
- no route skeleton or loading state depends on onboarding state
- auto-open route tours only happen after hydration finishes

### Decision 3: Reuse Client State Across Admin Navigation

Onboarding state should not be refetched on every route navigation for the same hub/admin.

Recommended approach:

- add a module-level in-memory cache in the onboarding provider/runtime
- key by `hubSlug + actorUserId + scope`
- store:
  - state
  - loaded scope
  - loaded timestamp
  - in-flight promise
- use checklist state as satisfying route scope
- use bootstrap/route state immediately while a checklist refresh happens on `/admin`

Acceptance:

- route-to-route admin navigation does not repeatedly fetch `onboarding?scope=route`
- opening `/admin` after route scope can reuse route state immediately and hydrate checklist as an upgrade
- hard refresh may fetch again

### Decision 4: Checklist Record Counts Should Become A Projection

The current checklist completion records use multiple existence queries.

For enterprise scale, checklist facts should come from a small hub-level summary document or existing maintained projections where possible.

Recommended document:

- `hubs/{hubId}/system/adminOnboardingSummary`

Suggested fields:

- `schemaVersion`
- `updatedAt`
- `updatedBy`
- `hasWhatWeDoItems`
- `hasTestimonials`
- `hasEvents`
- `hasCourses`
- `hasMediaAssets`
- `paymentSetupStateKey`
- `paymentSetupHasConnectedAccount`
- `regionalSetupComplete`
- `sourceVersions`

Potential source ownership:

- What we do mutations maintain `hasWhatWeDoItems`
- Testimonial mutations maintain `hasTestimonials`
- Event mutations maintain `hasEvents`
- Course mutations maintain `hasCourses`
- Media mutations maintain `hasMediaAssets`
- Payment configuration mutations/webhooks maintain payment setup fields
- Hub/regional setup mutations maintain regional setup field

First implementation may use read-through fallback:

- prefer projection if current schema exists
- otherwise run existing source checks only on checklist scope
- write/repair projection if safe

Acceptance:

- ordinary route scope never runs checklist source existence checks
- `/admin` checklist can load from one small projection document once backfilled
- source scans remain a support/fallback path, not normal steady state

### Decision 5: Instrument Before Deep Refactor

Add server timing logs around onboarding.

Measurements:

- API access/auth elapsed
- onboarding document read elapsed
- entitlement/package resolution elapsed
- payment configuration elapsed
- checklist record counts elapsed
- projection read elapsed once added
- response build elapsed
- total elapsed
- scope
- hubId
- actorUserId
- actorRole
- checklistHydrated
- cache/projection source

Client measurements:

- provider hydrate start
- provider state loaded
- auto journey opened
- checklist reveal requested

Acceptance:

- production logs can identify whether remaining time is auth/access, Firestore doc read, payment config, checklist counts, or client scheduling

## Implementation Phases

### Phase 0: Measurement And Safety Audit

Status: implemented pending production verification.

Goals:

- add timing instrumentation without behavior changes
- confirm exact fetch count by route
- identify auth/access vs data-layer cost
- validate no route is depending on onboarding before rendering content

Tasks:

- Use `createPerformanceTimer` from `apps/hub-platform/src/lib/observability/performance-timing.js`.
- Add timing helper usage in `apps/hub-platform/src/app/api/admin/hubs/[hubSlug]/onboarding/route.js`.
- Add timing marks inside `getAdminOnboardingState`.
- Include:
  - scope
  - includeChecklist
  - hubId
  - actorUserId
  - elapsed milliseconds
  - checklist source read duration
  - payment configuration duration
- auth/access duration from the API route before calling the data layer
- onboarding document read duration
- response JSON build/return duration where practical
- Add guarded client-side `performance.mark` or console timing only when existing performance logging flag is enabled, if such a flag exists.
- Capture baseline screenshots/logs for:
  - `/admin`
  - `/admin/events`
  - `/admin/courses`
  - `/admin/payments`
  - `/admin/members`
  - a settings route

Acceptance:

- no behavior changes
- timing logs explain the slowest portion of onboarding fetches
- baseline is documented before optimization
- route-scope logs prove whether the remaining cost is auth/access, onboarding doc read, payment configuration, or response handling
- checklist-scope logs prove exactly how expensive the checklist source-count reads are

### Phase 1: Provider Scheduling And Client Cache

Status: implemented and production verified.

Goals:

- stop onboarding route scope from competing with initial route content
- avoid repeated route-scope fetches during same-session navigation

Tasks:

- Add module-level onboarding cache in `AdminOnboardingProvider.jsx`.
- Key cache by `hub.slug`, `actorUserId`, and scope.
- Store in-flight promises so simultaneous consumers share one fetch.
- Split provider state into at least:
  - `routeLoading`
  - `checklistLoading`
  - derived backwards-compatible `loading`
- Avoid using a single `loading` flag to represent both route bootstrap and checklist hydration.
- On mount:
  - use cached state synchronously if present
  - set `loading=false` if cached state satisfies required scope
  - schedule missing route-scope fetch after initial render/idle
- For `/admin`:
  - render from cached route/bootstrap state if available
  - hydrate checklist as a scoped upgrade
- Keep checklist reveal behavior intact.
- Keep journey auto-open behavior after state is available.
- Ensure changing only query params does not repeatedly refetch route scope unless checklist intent requires it.
- Decide explicitly whether `AdminOnboardingHelpLauncher` should:
  - stay hidden until state exists, or
  - render a minimal disabled/loading help trigger.
- If it stays hidden, document that as an intentional perceived-speed tradeoff.

Implementation notes:

- `loadedScopeRef` should still treat `checklist` as satisfying `route`.
- cache state must update after `persistState`.
- cache must reset when hub/admin changes.
- avoid `localStorage` in first pass; module memory is enough and avoids stale cross-session issues.
- cached state must include `capabilities`, because route journey matching depends on them.
- in-flight fetch deduplication must be scoped by requested scope so a checklist request does not race against and get overwritten by an older route request.
- route-scope hydration is scheduled after first render/idle with `requestIdleCallback` where available and a short timeout fallback.
- checklist-scope hydration remains immediate on `/admin` so the checklist can render accurate completion state.
- the provider keeps a derived backwards-compatible `loading` value while exposing separate `routeLoading` and `checklistLoading` values for future UI refinements.
- the help launcher remains hidden until state exists in this phase. This is an intentional perceived-speed tradeoff to avoid showing onboarding controls before permissions/capabilities are known.

Acceptance:

- ordinary admin route navigation reuses onboarding state
- no repeated `onboarding?scope=route` fetches on every admin route change
- route content remains unaffected if onboarding fetch is slow
- help launcher still appears when state is ready
- route auto-tour still opens when eligible
- query-only changes for filters/search do not trigger route-scope onboarding refetches
- `/admin?setupChecklist=1` upgrades to checklist scope even if route scope is already cached
- delayed route-scope hydration must not overwrite newer checklist-scope state
- cache writes after `PATCH` must keep local journey/checklist state consistent after dismiss/restart/complete actions

### Phase 2: Checklist Scope Isolation

Status: verified after Phase 1; no additional code changes required in this pass.

Goals:

- make checklist hydration explicit and only on `/admin`
- avoid checklist work on non-checklist routes

Tasks:

- Confirm `shouldHydrateChecklistForPath` only returns true for exact admin base path.
- Preserve current "View setup checklist" routing to `/admin?setupChecklist=1`.
- On `/admin` without explicit checklist request:
  - do not show large checklist skeleton unless checklist is intended visible
  - allow summary cards/main dashboard to render independently
- Keep using `AdminOnboardingChecklist`'s existing `checklistHydrating` path for explicit checklist hydration only.
- On `/admin?setupChecklist=1`:
  - hydrate checklist
  - reveal checklist after hydration
  - remove query param after state is ready
- Make checklist hydration status separate from route onboarding loading.
- Ensure dismissed checklist behavior remains unchanged:
  - dismissed checklist renders nothing
  - reveal action flips dismissed state back to false
  - hide action persists dismissal

Acceptance:

- `/admin/events` and other routes never request checklist payload
- `/admin?setupChecklist=1` still works from every route
- dismissed checklist does not reserve large layout space
- visible checklist has accurate completion state
- checklist skeleton appears only for explicit checklist hydration, not every `/admin` hard reload if checklist is dismissed

Verification notes:

- `shouldHydrateChecklistForPath` returns true only when the current path equals the admin base path.
- The onboarding API treats `scope=route` as `includeChecklist=false`.
- Route-scope onboarding logs `checklist-record-counts-skipped`.
- The provider sends `?scope=route` for non-`/admin` routes.
- The provider routes "View setup checklist" to `/admin?setupChecklist=1`.
- `AdminOnboardingChecklist` uses its checklist skeleton only when `checklistHydrating` is true.
- `checklistHydrating` is now tied to checklist scope and explicit `setupChecklist=1`, not ordinary route-scope loading.
- The base `/admin` page can hydrate checklist scope because the checklist is part of that page's intentional experience.

### Phase 3: Onboarding Summary Projection

Status: implemented pending production backfill and verification.

Goals:

- replace repeated checklist source existence queries with one small summary read
- keep checklist accuracy through maintained projections and safe repair

Tasks:

- Add `adminOnboardingSummary` data helpers.
- Add schema version and normalization.
- Add read helper:
  - returns projection if current
  - returns null/stale metadata if missing
- Add rebuild helper:
  - intentionally scans source collections
  - writes summary projection
  - returns scanned facts
- Wire projection maintenance into existing support/internal projection route if appropriate:
  - add `includeAdminOnboarding`
  - dry-run report
  - repair rebuild
- Follow the existing `projection-maintenance.js` include-flag pattern used by `includeEventAttendance`.
- Ensure GET query params and POST JSON booleans both work for `includeAdminOnboarding`.
- Update `getAdminOnboardingState` checklist scope:
  - prefer projection
  - fallback to current `getChecklistRecordCounts` only when projection missing/stale
  - optionally repair projection after fallback if safe
- Add mutation maintenance where practical:
  - what we do create/delete/update
  - testimonial create/delete/update
  - event create/delete/update
  - course create/delete/update
  - media upload/delete
  - payment configuration changes
  - regional setup save
- Audit mutation functions before wiring projection maintenance:
  - `apps/hub-platform/src/lib/data/what-we-do.js`
  - `apps/hub-platform/src/lib/data/testimonials.js`
  - `apps/hub-platform/src/lib/data/event-mutations.js`
  - `apps/hub-platform/src/lib/data/event-series-mutations.js`
  - `apps/hub-platform/src/lib/data/course-mutations.js`
  - media data/actions modules
  - `apps/hub-platform/src/lib/data/hub-payment-configurations.js`
  - regional setup actions

Acceptance:

- steady-state checklist scope reads one onboarding document and one summary projection, plus payment config only if not already represented safely
- source existence scans do not run on every `/admin` checklist load after projection exists
- support/internal reconciliation can repair summary drift
- source mutations keep projection fresh enough for normal admin expectations
- ordinary route scope does not read the onboarding summary projection unless it is needed for route matching or help UI

Implementation notes:

- Added `apps/hub-platform/src/lib/data/admin-onboarding-summary.js`.
- The projection document is stored at `hubs/{hubId}/system/adminOnboardingSummary`.
- The projection records the checklist source facts currently required by the checklist:
  - `whatWeDo`
  - `testimonials`
  - `events`
  - `courses`
  - `media`
- The projection now also records saved setup facts for checklist items that should not depend on route-tour state:
  - `siteDetails`
  - `branding`
  - `homepage`
  - `accountReview`
  - `membershipPlans`
- `getAdminOnboardingState` now reads the summary projection during checklist scope and falls back to rebuilding it only when the projection is missing or stale.
- The internal projection maintenance endpoint now supports `includeAdminOnboarding` for GET query params and POST JSON.
- Dry-run reconciliation reports `reports.adminOnboarding`.
- Repair/backfill writes `repairs.adminOnboarding`.
- Source mutation maintenance is wired for:
  - What we do create/delete
  - Testimonials create/delete
  - Events create/delete
  - Event series create/update because series synchronization can create occurrence event records
  - Courses create/delete
  - Media asset upload/delete
- Saved setup fact maintenance is wired for:
  - regional setup completion
  - site details save
  - site branding save
  - homepage settings save
  - membership plan create/update/delete
- Ordinary edits that do not change whether a collection has records do not rebuild the projection.
- Payment setup remains calculated from the live payment configuration, and regional setup remains calculated from the hub record. Moving either into the projection would require a broader consistency contract.
- Checklist items for site details, branding, homepage/page review, account/package review, and membership plans are now fact-based. Route journey state remains available for tours and help guidance, but does not decide checklist completion for those items.
- Site branding completion requires logo, theme, template, and primary brand color. Header CTA and secondary brand color are optional enhancements and do not block checklist completion.
- `adminOnboardingSummary` schema was bumped to version 2 so existing version 1 documents rebuild safely and gain setup facts.

Production rollout:

- Deploy the code.
- Run a dry-run for one hub:
  - `GET /api/internal/projections/reconcile?hubSlug={hubSlug}&dryRun=true&includePayments=false&includeMembers=false&includeDashboard=false&includeMedia=false&includeEventAttendance=false&includeAdminOnboarding=true`
- If `adminOnboarding.totalIssues` is non-zero, run repair with the same include flags and `dryRun=false`.
- Hard refresh `/admin?setupChecklist=1`.
- Confirm checklist scope logs show `summary-read-hit` after repair/backfill.
- Confirm source reads only appear when the summary is missing/stale or during explicit reconciliation.
- Confirm saved setup checklist items do not remain "In progress" merely because their onboarding tour was dismissed or not completed.

### Phase 4: Payload Shaping

Status: not started.

Goals:

- reduce response size and client work
- avoid sending checklist items when route scope only needs journey state

Tasks:

- Introduce explicit response shapes:
  - `scope: "route"` returns route/bootstrap state
  - `scope: "checklist"` returns checklist-hydrated state
- Ensure route scope does not include bulky checklist item arrays.
- Preserve client compatibility during rollout by normalizing missing checklist arrays to `[]`.
- Consider whether `capabilities` can be minimized to only the route-matching capability keys needed client-side.
- Keep `checklist.dismissed` in route/bootstrap payload because the help launcher's checklist reveal flow and checklist visibility logic depend on it.
- Keep `preferences` in route/bootstrap payload because reduced-motion and autoplay behavior are used by the modal/runtime.

Acceptance:

- route-scope response is smaller than checklist response
- help launcher and route journey matching still work
- checklist component handles non-hydrated state gracefully

### Phase 5: Persistence Refinement

Status: future/hardening.

Goals:

- avoid writing/re-returning the full state document for small interactions
- reduce write payload and conflict risk

Tasks:

- Add patch-style server actions/API operations:
  - dismiss journey
  - complete journey
  - advance journey step
  - dismiss/reveal checklist
  - update preferences
- Keep existing full `PATCH` temporarily as fallback.
- Update provider persistence methods gradually.

Acceptance:

- route-tour interactions persist with small patch writes
- client state stays optimistic
- failed writes do not break route UX

### Phase 6: Verification And Rollout

Status: not started.

Verify each route family:

- `/admin`
- `/admin?setupChecklist=1`
- `/admin/events`
- `/admin/events?view=history`
- `/admin/events/create`
- `/admin/events/[eventId]`
- `/admin/courses`
- `/admin/courses?view=history`
- `/admin/courses/create`
- `/admin/courses/[courseId]`
- `/admin/payments`
- `/admin/payments?view=payments`
- `/admin/payments?view=setup`
- `/admin/members`
- `/admin/media`
- `/admin/settings`
- `/admin/settings/site`
- `/admin/settings/branding`
- `/admin/settings/pages`
- `/admin/settings/account`

Network acceptance:

- hard refresh non-`/admin` route:
  - route content loads without waiting for onboarding
  - onboarding fetch is delayed/non-blocking or reused from cache
  - no checklist source-count work
- route-to-route navigation:
  - no repeated `onboarding?scope=route` fetch if state is cached
- query-only client-side state changes:
  - Events/Courses Current/History toggles do not cause onboarding refetches
  - Payments tab/filter/search query changes do not cause onboarding refetches unless the route journey query match genuinely changes
- `/admin?setupChecklist=1`:
  - checklist hydrates intentionally
  - route remains stable
- "View setup checklist":
  - navigates to `/admin?setupChecklist=1`
  - reveals checklist
  - does not break current route history/back behavior

Functional acceptance:

- first-time route journeys still auto-open after hydration
- completed/dismissed journeys stay completed/dismissed
- help launcher still restarts current route journey
- help launcher still opens checklist
- help launcher behavior while route state is still hydrating is intentional and tested
- checklist completion states remain accurate after:
  - creating an event
  - creating a course
  - uploading media
  - adding testimonials
  - adding what-we-do items
  - completing regional setup
  - completing Stripe setup where available

## Edge Cases

### New Admin User

If there is no onboarding document:

- route scope should return default state quickly
- checklist scope should create/return default checklist facts
- auto journey can open after hydration
- cache should not incorrectly reuse another admin user's state

### Existing Admin With Old State Shape

If persisted version is old or missing fields:

- normalizer should fill defaults
- no runtime crash
- no route blocking

### Support Mode / Superadmin

Current layout only wraps `AdminOnboardingProvider` for `adminSession`.

Keep this unless product explicitly wants support users to experience onboarding.

### Regional Setup Incomplete

`/admin` may redirect to `/admin/onboarding` when regional setup is incomplete.

Onboarding performance work must not create a loop where onboarding runtime redirects back to `/admin`.

### Checklist Projection Stale

If `adminOnboardingSummary` is stale:

- checklist may briefly show stale completion state
- support/internal repair should correct it
- source fallback can be used on checklist scope only
- ordinary routes should not pay the fallback scan cost

### Auto-Open Journey Timing

If route state hydrates after content:

- route tour may open slightly later
- this is acceptable and preferable to delaying route content
- avoid opening a tour after the user has already navigated away

### Browser Back/Forward

Checklist reveal query cleanup must not create annoying history entries.

Use `router.replace` when removing `setupChecklist=1` after reveal.

### In-Flight Request Races

If a route-scope fetch is in flight and the user requests checklist scope:

- checklist scope should win
- an older route-scope response must not overwrite a newer checklist-hydrated state
- in-flight promise dedupe should be keyed by scope and hub/admin identity

### Capability-Gated Journeys

Route journey matching depends on capabilities.

If payload shaping removes or minimizes capabilities:

- capability-gated journeys must still match correctly
- locked features must not incorrectly show route tours
- routes such as Courses and Payments need explicit verification under packages where those capabilities are disabled

## Risks And Tradeoffs

### Lazy Route Hydration

Benefit:

- route content feels faster

Tradeoff:

- onboarding help launcher may appear slightly later
- auto journeys may open after a small delay

Mitigation:

- keep delay short
- use cached state immediately after first load

### In-Memory Cache

Benefit:

- avoids repeated fetches during same-session navigation

Tradeoff:

- state can become stale if another tab updates onboarding

Mitigation:

- update cache after local persistence
- hard refresh refetches
- future storage/broadcast sync can be added if needed

### Summary Projection

Benefit:

- checklist avoids repeated source existence scans

Tradeoff:

- projection maintenance adds write-path complexity
- projection can drift

Mitigation:

- support/internal reconciliation
- source fallback only on checklist scope
- safe repair path

### Patch Persistence

Benefit:

- smaller writes and cleaner concurrency

Tradeoff:

- more API actions and validation paths

Mitigation:

- defer to future phase after performance wins land

## Rollback Plan

If lazy hydration causes onboarding UX regressions:

- revert provider scheduling to immediate fetch
- keep timing instrumentation
- keep checklist scope isolation if stable

If in-memory cache behaves incorrectly:

- disable cache usage
- keep delayed route fetch

If summary projection drifts:

- disable projection read preference
- fallback to existing checklist source scans on `/admin`
- keep projection repair tooling for diagnostics

No destructive database rollback should be needed. New projection documents are additive.

## Documentation Progress

### 2026-08-07 - Plan Created

Status: planning complete, implementation not started.

Completed:

- Audited admin onboarding provider/runtime.
- Audited onboarding API route.
- Audited onboarding server data layer.
- Identified checklist source-count reads as a key checklist-scope cost.
- Identified route-scope onboarding fetch as a cross-admin perceived performance cost.
- Defined payload separation: bootstrap/route, checklist, mutation.
- Defined phased implementation plan from instrumentation through projection hardening.
- Defined edge cases, tradeoffs, and rollback approach.

Next step:

- Audit this plan against the actual code once more before implementation.
- Start Phase 0 instrumentation before changing runtime behavior.

### 2026-08-07 - Code Audit Pass

Status: plan audited and tightened against actual code, implementation not started.

Findings:

- The repo already has `createPerformanceTimer`; Phase 0 should use it.
- `AdminOnboardingHelpLauncher` is currently hidden while `onboarding.loading` is true, so delayed route hydration has a visible help-launcher tradeoff.
- `AdminOnboardingChecklist` already has an appropriate `checklistHydrating` skeleton path that should be preserved.
- `AdminOnboardingProvider` currently uses one `loading` flag for route and checklist hydration; implementation needs separate loading states.
- Route journey matching uses `state.capabilities`, so bootstrap/route payloads must retain capability data.
- Query-driven admin routes mean query-only changes must not accidentally refetch onboarding.
- Projection maintenance already has a proven include-flag pattern and boolean normalization; onboarding summary projection should follow it.
- The onboarding summary projection phase will cross multiple data modules and should not be attempted without a mutation-by-mutation audit.

Plan updates made:

- Added code-aware audit findings.
- Updated Phase 0 to use `createPerformanceTimer` and capture auth/access plus data-layer timings.
- Updated Phase 1 to split route/checklist loading states and handle cache/in-flight races.
- Updated Phase 2 to preserve existing checklist skeleton and dismissal behavior.
- Updated Phase 3 to follow the existing projection maintenance include-flag pattern.
- Updated Phase 4 to preserve fields required by route matching, checklist reveal, and preferences.
- Expanded verification for query-only routes, first-time admins, capability-gated journeys, and in-flight request races.

Next step:

- Begin Phase 0 instrumentation only.

### 2026-08-07 - Phase 0 Instrumentation Implemented

Status: implemented, production log review pending.

Completed:

- Added API-level timing to `GET /api/admin/hubs/[hubSlug]/onboarding`.
- Added API-level timing to `PATCH /api/admin/hubs/[hubSlug]/onboarding`.
- Added data-layer timing to `getAdminOnboardingState`.
- Added save timing to `saveAdminOnboardingState`.
- Added individual checklist source-read timing for:
  - `whatWeDoItems`
  - `testimonials`
  - `events`
  - `courses`
  - `mediaAssets`
- Added aggregate checklist record-count timing.
- Added route-scope skip logs for checklist record counts.
- Added native-payment disabled skip logs for payment configuration.
- Used the existing `createPerformanceTimer` helper and `HUB_PLATFORM_PERFORMANCE_TIMING_ENABLED` flag.

Expected log scopes:

- `admin-onboarding-route`
- `admin-onboarding-state`
- `admin-onboarding-save`

Key events to review:

- `access-resolved`
- `onboarding-doc-read`
- `payment-configuration-read`
- `payment-configuration-skipped`
- `checklist-record-counts-skipped`
- `summary-read-hit`
- `summary-read-miss`
- `summary-source-read`
- `checklist-record-counts-loaded`
- `state-loaded`
- `complete`

Verification pending:

- Enable or confirm `HUB_PLATFORM_PERFORMANCE_TIMING_ENABLED=true` in the target environment.
- Hard refresh `/admin` and confirm checklist-scope timings show checklist source reads.
- Hard refresh a non-`/admin` route such as `/admin/events` and confirm `checklist-record-counts-skipped` appears.
- Compare elapsed time for:
  - access/auth
  - onboarding document read
  - payment configuration
  - checklist record counts
- Use the timings to decide whether Phase 1 provider scheduling/cache or Phase 3 checklist projection should be prioritized first.

Initial production observation:

- `/admin` hard refresh and revisit both showed checklist-scope `admin-onboarding-state` completing in roughly 496-497ms.
- The overall onboarding route timing was roughly 990-1061ms.
- This indicates that about half the current endpoint time is inside `getAdminOnboardingState`, and about half is outside it, most likely access/auth/session resolution.
- Added more granular API access duration timing and `parallel-reads-loaded` state timing so the next log capture can separate access/auth cost from Firestore/payment/checklist reads.
- A later `/admin` hard refresh showed `admin-onboarding-state` at roughly 512ms and `admin-onboarding-route` at roughly 1522ms.
- Navigating from `/admin` to `/admin/events` and back to `/admin` after that hard refresh produced no onboarding logs. This confirms the mounted provider/checklist scope is reused during in-admin client navigation.
- Network screenshots for the same journey showed RSC route fetches for `/admin/events` and back to `/admin`, but not repeated onboarding API fetches. Therefore the current onboarding performance issue is primarily hard-refresh/direct-entry cost, not ordinary in-session route-to-route navigation after the provider is loaded.

### 2026-08-07 - Phase 1 Provider Scheduling And Client Cache Implemented

Status: implemented, production verification pending.

Completed:

- Added a module-level onboarding state cache in `AdminOnboardingProvider.jsx`.
- Added in-flight request deduplication keyed by hub slug, actor user id, and requested onboarding scope.
- Split the provider's single loading state into:
  - `routeLoading`
  - `checklistLoading`
  - derived backwards-compatible `loading`
- Added synchronous cache hydration on provider mount when a matching scope is already available.
- Kept `checklist` scope as satisfying `route` scope, so returning from `/admin` to ordinary admin routes can reuse the richer state.
- Deferred missing route-scope onboarding loads until after initial render/idle.
- Kept checklist-scope loading immediate on `/admin` and `/admin?setupChecklist=1`.
- Updated cache after onboarding `PATCH` persistence so journey/checklist actions remain consistent without requiring a refetch.
- Preserved checklist reveal behavior, route journey auto-open behavior, and route matching capability requirements.
- Kept the help launcher hidden until onboarding state exists in this phase.

Verification required:

- Hard refresh `/admin/events`, `/admin/courses`, `/admin/payments`, and `/admin/members`; route content should not wait on route-scope onboarding hydration.
- Confirm non-`/admin` route onboarding requests, if visible, use `?scope=route` and occur after the main route begins rendering.
- Confirm non-`/admin` route logs show `checklist-record-counts-skipped`.
- Hard refresh `/admin`; checklist hydration should remain immediate and should return `checklistHydrated: true`.
- From any non-`/admin` route, select "View setup checklist"; it should route to `/admin?setupChecklist=1`, hydrate checklist scope, and reveal the checklist.
- Navigate across ordinary admin routes after the provider has loaded; onboarding should not repeatedly refetch for every route.
- Apply query/search/filter changes on list routes; query-only changes should not trigger repeated onboarding route-scope fetches.
- Complete, dismiss, restart, and advance an onboarding journey; state should update immediately and remain correct on subsequent navigation.

Next step:

- Review production network traces and timing logs after Phase 1.
- If hard-refresh/direct-entry onboarding still costs too much, move to Phase 2 checklist scope isolation verification and then Phase 3 onboarding summary projection.

Production verification:

- User confirmed route-scope onboarding requests use `?scope=route`.
- User confirmed the other Phase 1 verification steps passed.
- Payments route hard-refresh screenshot showed the document response around 541ms.
- Payments route hard-refresh screenshot showed the deferred `onboarding?scope=route` request around 1.21s.
- The route-scope onboarding request is no longer a blocker for the payments route initial content.
- Clicking "View setup checklist" from payments navigated to `/admin?setupChecklist=1` as intended.
- Checklist reveal screenshot showed the checklist onboarding request around 1.22s and the `/admin?setupChecklist=1` RSC request around 1.12s.
- This confirms the remaining onboarding cost is now concentrated on deliberate checklist reveal/base-admin checklist hydration rather than every ordinary admin route.

Phase 1 outcome:

- Passed.
- The next performance opportunity is no longer provider scheduling; it is reducing checklist-scope server work through the Phase 3 onboarding summary projection.

### 2026-08-07 - Phase 2 Verified And Phase 3 Summary Projection Implemented

Status: implemented, production backfill and verification pending.

Completed:

- Verified Phase 2 checklist scope isolation against code and production behavior.
- Added the `adminOnboardingSummary` projection document under `hubs/{hubId}/system/adminOnboardingSummary`.
- Replaced checklist source existence reads during normal checklist hydration with the summary projection.
- Preserved safe fallback repair when the summary projection is missing or stale.
- Added reconciliation/reporting support through the internal projection maintenance endpoint with `includeAdminOnboarding`.
- Wired create/delete source maintenance for What we do, Testimonials, Events, Courses, and Media assets.
- Wired event series create/update maintenance because occurrence synchronization can create event records.
- Updated production log guidance to look for `summary-read-hit`, `summary-read-miss`, and `summary-source-read`.

Verification required:

- Deploy the code.
- Run dry-run reconciliation for a hub with `includeAdminOnboarding=true` and other include flags disabled.
- Run repair with `dryRun=false` if `reports.adminOnboarding.totalIssues` is greater than zero.
- Hard refresh `/admin?setupChecklist=1` and confirm checklist logs show `summary-read-hit`.
- Confirm ordinary admin routes continue to use `?scope=route` and do not fetch checklist payloads.
- Create and delete one record in a low-risk hub for each source type when practical, then rerun dry-run reconciliation to confirm the summary remains aligned.

### 2026-08-07 - Checklist Completion Semantics Upgraded

Status: implemented, production backfill and verification pending.

Completed:

- Audited the checklist configuration and confirmed several items were using route journey completion as their checklist completion signal.
- Replaced journey-based checklist completion with fact-based completion for:
  - site details
  - site branding
  - homepage/page review
  - account and package review
  - membership plans
- Preserved route journey state for onboarding tours, auto-open behavior, help menu restarts, and analytics.
- Extended `adminOnboardingSummary` with `setupFacts`.
- Bumped `adminOnboardingSummary` schema to version 2 so existing summaries rebuild with the new setup facts.
- Reused existing settings status derivation helpers instead of inventing new completion rules.
- Wired setup-fact summary maintenance after regional setup, site settings, branding settings, homepage settings, and membership plan mutations.

Checklist semantics after this pass:

- `completed` means the saved source data satisfies the established setup rule.
- `in_progress` means saved source data is genuinely partially configured.
- `not_started` means required saved source data is missing.
- Dismissing or partially viewing an onboarding tour no longer causes setup checklist items to remain "In progress".

Verification required:

- Rebuild the `adminOnboardingSummary` projection in production using `includeAdminOnboarding=true`.
- Hard refresh `/admin?setupChecklist=1`.
- Confirm site details, branding, homepage/page review, account/package review, and membership plans reflect saved setup data rather than guide/tour progress.
