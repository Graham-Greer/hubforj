# Product To Hub Admin Handoff Performance And UX Implementation Plan

## Objective

Upgrade the product-site to hub-platform owner admin handoff so a newly signed-in client reaches their hub admin portal quickly, confidently, and without confusing blank or generic loading screens.

The desired user journey is:

1. The owner signs into `https://www.hubforj.com`.
2. The owner clicks `Open admin area` from the product-site account route.
3. A new tab opens with a polished, intentional transition.
4. Hub-platform provisions or resolves the owner admin account.
5. Hub-platform sets the normal hub admin session cookie.
6. The owner lands directly on the correct first admin destination:
   - `/admin/onboarding` when required regional setup is incomplete
   - `/admin` when regional setup is complete
7. The destination renders stable admin chrome quickly, with route-shaped loading UI for any remaining data.

This plan covers the current issue where the flow works functionally but feels slow and unfinished because the browser visibly passes through:

- `https://www.hubforj.com/account/admin`
- `https://grahamtesthub.hubforj.com/admin`
- `https://grahamtesthub.hubforj.com/admin/onboarding`

and displays a raw global loading fallback:

- white page
- top-left `Loading application...`

## Product Standard

This handoff is a first-run activation experience. It must feel like a controlled enterprise SaaS transition, not a chain of technical redirects.

The finished implementation should:

- avoid unnecessary intermediate route loads
- avoid fetching dashboard data for a page that immediately redirects
- show meaningful visual feedback within the first perceptible moment of a new tab opening
- render branded loading UI during unavoidable cross-origin navigation
- preserve the existing hub admin session model
- preserve the existing owner provisioning and authorization checks
- avoid introducing a parallel authentication system
- keep first-run onboarding logic correct
- use existing design tokens and admin/product UI patterns
- give the user clear reassurance that Hubforj is opening their admin area
- fail safely to a recoverable state when a handoff expires or is invalid
- maintain stable layout dimensions so loading UI does not jump when real content arrives
- provide accessible loading semantics without trapping keyboard or screen reader users

## Locked Decisions

1. The direct handoff remains the correct authentication model.
- product-site does not share its cookies with hub subdomains
- hub-platform issues its own `hub_platform_session` cookie
- the handoff remains short-lived and one-time-use
- the owner should not manually sign in again after signing in to product-site

2. The handoff destination must be destination-aware.
- do not always redirect to `/admin`
- if the hub needs regional setup, redirect directly to `/admin/onboarding`
- if regional setup is complete, redirect directly to `/admin`
- this prevents `/admin` from doing dashboard work just to redirect

3. `/admin` must not be used as a routing guard for first-run onboarding.
- `/admin` can protect itself for direct visits
- handoff should choose the right destination before the browser reaches the admin page
- route guards must be cheap and based on core hub state where possible

4. Loading UI is product surface, not a placeholder.
- no generic text-only `Loading application...` screen should be visible during launch-critical journeys
- global loading can exist, but it must be branded and visually aligned
- admin route loading should reserve the admin shell layout

5. Server work must be reduced before adding prettier skeletons.
- loading UI should not mask avoidable Firestore reads
- if a route awaits heavy data before redirecting, fix the route decision first
- skeletons should cover unavoidable or intentionally deferred data

6. Rollout must remain backward-compatible.
- product-site can prefer `adminHandoffHref`
- product-site should retain `signInHref` fallback until both projects are deployed and stable
- hub-platform should retain existing member/admin sign-in flows

7. Failure states must be clear and recoverable.
- expired handoffs should route to the relevant hub sign-in page or a branded recovery screen
- product-site `/account/admin` failures should return to `/account` with a visible state
- logs should include non-secret identifiers such as `hubSlug`, `hubId`, and failure reason
- handoff tokens must never be logged

8. Loading states must have explicit performance budgets.
- product-site launcher shell should render immediately as static route UI
- hub-platform global loading UI should be visible before route data resolves
- admin route loading should reserve the final shell footprint
- avoid adding client bundles, third-party libraries, or data imports to loading components

9. Loading states must be accessible.
- use `aria-live="polite"` only for short status text that benefits from announcement
- avoid repeated noisy announcements during redirects
- respect `prefers-reduced-motion`
- ensure color contrast meets the same standard as the final UI
- keep focus behavior natural during automatic navigation

## Current State Audit

### Product-Site Launcher

Source:

- `apps/product-site/src/app/(account)/account/admin/route.js`
- `apps/product-site/src/lib/server/provision-owner-admin.js`

Current behavior:

- `/account/admin` is a route handler, not a page
- it performs account context checks
- it calls hub-platform internal owner provisioning
- it redirects to `adminHandoffHref` when present
- it falls back to `signInHref`

Issue:

- because this is a route handler opened in a new tab, the browser can show a blank white tab while the product-site server work completes
- there is no branded transition UI at the product-site handoff step

Risk:

- a route handler is fast when infrastructure is warm, but still feels broken when cold start, network, or Firebase calls take noticeable time

### Hub-Platform Handoff

Sources:

- `apps/hub-platform/src/app/api/internal/provision-owner-admin/route.js`
- `apps/hub-platform/src/lib/auth/owner-admin-handoff.js`
- `apps/hub-platform/src/app/api/auth/owner-handoff/route.js`

Current behavior:

- internal provisioning resolves or creates the owner admin user
- hub-platform creates a one-time handoff
- browser visits `/api/auth/owner-handoff`
- route consumes the handoff, sets `hub_platform_session`, and redirects to `/admin`

Issue:

- the handoff currently redirects to `/admin` regardless of onboarding status
- newly provisioned hubs frequently need regional setup, so `/admin` redirects again to `/admin/onboarding`

Risk:

- this creates a visibly slower journey
- it also triggers avoidable admin dashboard work before redirecting

### Admin Overview Redirect

Source:

- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/page.jsx`

Current behavior:

- loads `getHubAdminDashboardSummaryBySlug(hubSlug)`
- derives `hub`
- checks `isHubRegionalSetupComplete(hub)`
- redirects to `/admin/onboarding` if required

Issue:

- the regional setup redirect happens after the dashboard summary await
- `getHubAdminDashboardSummaryBySlug` performs dashboard-specific work that is irrelevant for first-run onboarding

Risk:

- new hub owners pay for dashboard data before being sent away from the dashboard
- the route waterfall creates a second poor loading phase

### Regional Onboarding Page

Source:

- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/onboarding/page.jsx`

Current behavior:

- uses `requireHubBySlug(hubSlug)`
- redirects back to `/admin` if setup is already complete
- renders `RegionalSetupForm`

Issue:

- `requireHubBySlug` hydrates operational counts
- onboarding only needs core hub regional fields

Risk:

- unnecessary reads delay the first useful admin screen

### Admin Layout

Source:

- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/layout.jsx`

Current behavior:

- resolves route mode
- reads operator theme cookie
- resolves superadmin session
- loads core hub
- checks support mode if operator
- checks admin session if not operator
- renders `HubAdminShell`
- wraps admin sessions in `AdminOnboardingProvider`

Issue:

- this layout is a necessary auth and shell boundary
- however, until it resolves, the global app loading fallback may be visible

Risk:

- for first-run owner activation, even legitimate layout work can feel like a blank app unless the loading fallback matches the admin shell

### Global Loading UI

Source:

- `apps/hub-platform/src/app/loading.jsx`

Current behavior:

```jsx
<main className="appRoot"><p className="eyebrow">Loading application...</p></main>
```

Issue:

- the fallback is visually raw
- it does not reserve admin shell structure
- it does not reassure the user that admin access is being opened

Risk:

- even if backend performance improves, perceived quality remains poor

### Admin Onboarding Client Fetch

Sources:

- `apps/hub-platform/src/components/patterns/admin-onboarding/AdminOnboardingProvider.jsx`
- `apps/hub-platform/src/components/patterns/admin-onboarding/AdminOnboardingChecklist.jsx`
- `apps/hub-platform/src/app/api/admin/hubs/[hubSlug]/onboarding/route.js`

Current behavior:

- admin layout renders `AdminOnboardingProvider`
- provider fetches onboarding state client-side
- checklist only appears once provider state is loaded
- non-admin routes can fetch route-scoped onboarding only

Issue:

- this is not the primary cause of the cross-domain white screens
- it may still cause checklist pop-in after admin shell render

Risk:

- after the main redirect chain is fixed, onboarding state loading may become the next visible source of jumpiness

## Target Architecture

### Handoff Destination Contract

The internal provisioning response should include a canonical destination:

```js
{
  status: "existing" | "provisioned",
  hubId,
  hubSlug,
  handoffPath,
  handoffDestinationPath,
  handoffExpiresAtEpochSeconds,
  signInPath
}
```

`handoffPath` should remain the URL that consumes the one-time token.

`handoffDestinationPath` should describe where the handoff will land after the session cookie is set:

- `/admin/onboarding`
- `/admin`

The product-site does not need to decide hub onboarding state. Hub-platform owns that decision.

### Handoff Creation

Handoff creation should accept an optional destination path:

```js
createOwnerAdminHandoff({
  hub,
  user,
  ownerEmail,
  destinationPath: "/admin/onboarding"
})
```

The stored handoff document should include:

```js
{
  status: "pending",
  tokenHash,
  hubId,
  hubSlug,
  userId,
  authUid,
  ownerEmail,
  destinationPath,
  createdAt,
  expiresAt,
  expiresAtIso,
  expiresAtEpochSeconds
}
```

### Handoff Consumption

The consume endpoint should:

1. validate handoff id and token
2. transactionally mark the handoff consumed
3. validate the user remains active and admin-capable
4. set the standard `hub_platform_session` cookie
5. redirect to the stored `destinationPath` using route-mode aware URLs

For host mode:

- `destinationPath: "/admin/onboarding"` redirects to `/admin/onboarding`

For path mode:

- `destinationPath: "/admin/onboarding"` redirects to `/{hubSlug}/admin/onboarding`

### Admin Route Guard

`/admin` should keep a cheap regional setup guard for direct visits.

However, that guard should happen before dashboard summary work. The route should:

1. load core hub only
2. if regional setup incomplete, redirect to `/admin/onboarding`
3. only then fetch dashboard summary

This keeps direct `/admin` visits correct without penalizing new owner handoffs.

### Onboarding Route Data

`/admin/onboarding` should use `requireHubCoreBySlug`.

It only needs:

- hub id
- slug
- name
- country
- timezone
- locale
- defaultCurrency
- regionalSetupStatus
- package/regional defaults if already in core normalization

It should not hydrate dashboard counts, events, invites, or member data.

### Loading UI Strategy

The loading strategy should have three layers:

1. Product-site launcher loading:
- used if `/account/admin` becomes a page-driven launcher
- branded product-shell style
- message: opening admin area
- no raw white screen

2. Hub-platform global fallback:
- used for unavoidable full document or app-level loading
- branded Hubforj surface
- visually centered and polished
- no top-left generic text

3. Admin route loading:
- used for admin route segment loading
- resembles `HubAdminShell`
- reserves sidebar/topbar/content skeleton structure
- avoids layout jump when final admin shell appears

### Perceived Performance Budgets

Use these budgets to judge the implementation in production-like conditions:

- product launcher visual response: immediate static shell, ideally visible in under 100ms after document paint
- product launcher server continuation: redirect requested as soon as the page hydrates
- hub handoff consume route: minimal server work, target under 500ms when warm
- incomplete hub final destination: no intermediate `/admin` document request
- onboarding first useful paint: admin chrome and onboarding title visible before non-critical onboarding/client help state finishes
- cumulative layout shift during loading-to-ready transition: no obvious shift in header, sidebar, or primary form area

These budgets are directional rather than contractual, because Vercel cold starts and Firebase latency can vary. They should still be used to decide whether a loading state is good enough for launch.

### Route-Specific Loading Contracts

#### Product-Site `/account/admin`

The launcher loading state should include:

- product header or compact product identity
- clear title such as `Opening your admin area`
- short reassurance that the user is being taken to their hub
- stable action area for retry/back-to-account on failure
- no full account dashboard fetch before displaying this shell

It should not include:

- a generic spinner-only experience
- hub identity supplied by client input
- any handoff token in visible text, console output, or error message

#### Hub-Platform Global Loading

The global loading state should include:

- Hubforj identity
- calm status text
- token-based surface/background colors
- CSS-only progress indicator
- reduced-motion fallback

It should not include:

- route-specific admin data
- Firestore, Stripe, Firebase Auth, or session reads
- hardcoded one-off colors outside the token system

#### Hub-Platform Admin Segment Loading

The admin loading state should include:

- desktop sidebar placeholder
- mobile topbar placeholder
- content header skeleton
- primary panel/form skeleton sized like the onboarding form or dashboard panel
- spacing that matches `HubAdminShell`

It should not include:

- live nav item labels requiring hub data
- interactive controls that do not work yet
- large animated areas that compete with page content

## Implementation Phases

### Phase 0: Baseline, Deployment Order, And Rollback Guardrails

Goal:

- make the implementation measurable and reversible before changing runtime behavior

Tasks:

1. Capture a baseline before edits.
- record the current redirect chain for an incomplete hub
- capture Chrome Network timings for `/account/admin`, `/api/auth/owner-handoff`, `/admin`, and `/admin/onboarding`
- capture screenshots of the current product-site blank tab and hub-platform `Loading application...` states
- note whether the hub is regional-setup complete or incomplete

2. Confirm deployment order.
- deploy hub-platform first because it owns the new handoff destination behavior
- deploy product-site after hub-platform is live and returning the expected handoff response
- keep product-site `signInHref` fallback until after production smoke testing confirms direct handoff is stable

3. Define rollback behavior.
- if destination-aware handoff fails, product-site fallback should still be able to use `signInHref`
- if launcher page/API fails, route back to `/account?adminActivation=error`
- if loading UI changes regress visually, they can be reverted independently from auth handoff logic

4. Confirm no schema/index blocker.
- `ownerAdminHandoffs` is read by document id, so no composite index is required
- optional Firestore TTL cleanup can be enabled on `expiresAt` after rollout
- TTL is operational cleanup only; security must still depend on token expiry and transactional consume

Acceptance criteria:

- baseline screenshots and Network observations exist before implementation
- rollout order is explicit
- each phase can be verified independently
- there is a safe fallback path for handoff failures

### Phase 1: Remove The Avoidable `/admin` To `/admin/onboarding` Handoff Hop

Goal:

- first-run owner handoff lands directly on `/admin/onboarding`
- completed hubs continue landing on `/admin`

Tasks:

1. Add destination resolution to hub-platform provisioning.
- use `isHubRegionalSetupComplete(hub)`
- compute destination as:
  - `/admin` if complete
  - `/admin/onboarding` if required
- use core hub data only

2. Extend `createOwnerAdminHandoff`.
- accept `destinationPath`
- sanitize destination so it must be a relative admin path
- store `destinationPath` on the handoff document
- include destination in returned handoff metadata

3. Update `consumeOwnerAdminHandoff`.
- return `destinationPath`
- default defensively to `/admin` if missing
- never trust arbitrary external URLs

4. Update `/api/auth/owner-handoff`.
- redirect to stored destination using `buildHubRuntimeHref`
- preserve host-mode and path-mode behavior

5. Keep backward compatibility.
- keep returning `signInPath`
- keep product-site fallback to `signInHref`

Acceptance criteria:

- incomplete hub handoff ends at `https://hubslug.hubforj.com/admin/onboarding`
- complete hub handoff ends at `https://hubslug.hubforj.com/admin`
- no visible `https://hubslug.hubforj.com/admin` intermediate page for incomplete hubs
- handoff remains single-use
- expired handoff cannot create a session

### Phase 2: Make `/admin` Redirect Guards Cheap

Goal:

- direct `/admin` visits remain correct
- dashboard data is not fetched when redirecting to onboarding

Tasks:

1. Refactor `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/page.jsx`.
- load core hub first with `requireHubCoreBySlug` or equivalent
- perform regional setup redirect before dashboard summary
- fetch dashboard summary only after the guard passes

2. Confirm summary still provides package/card data after guard.
- avoid duplicate hub reads where reasonable
- do not alter summary cards behavior

3. Ensure route-mode redirect remains correct.
- host mode should redirect to `/admin/onboarding`
- path mode should redirect to `/{hubSlug}/admin/onboarding`

Acceptance criteria:

- direct incomplete `/admin` visit redirects quickly
- dashboard summary network/backend work is skipped for incomplete hubs
- complete `/admin` dashboard renders unchanged

### Phase 3: Optimize `/admin/onboarding` Data Requirements

Goal:

- onboarding page renders with minimal server data

Tasks:

1. Replace `requireHubBySlug` with `requireHubCoreBySlug`.
2. Confirm `resolveRegionalDefaults` receives all required fields from core hub.
3. Keep redirect to `/admin` when setup is already complete.
4. Ensure `RegionalSetupForm` only receives fields it needs.

Acceptance criteria:

- onboarding page avoids hydrated operational counts
- regional setup form behavior remains unchanged
- complete hubs still redirect away from onboarding

### Phase 4: Improve Product-Site Launcher Experience

Goal:

- the new tab should not look blank while `/account/admin` performs server work

Tasks:

1. Measure the current launcher route after Phase 1 to Phase 3.
- inspect `/account/admin` TTFB in production or Vercel logs
- observe whether the new tab remains blank for more than roughly 300-500ms
- verify whether cold starts or Firebase calls make the route handler visibly blank

2. If blank-state remains visible, replace the route-handler-only launcher with a page plus API.
- `apps/product-site/src/app/(account)/account/admin/page.jsx` renders a branded transition page immediately
- `apps/product-site/src/app/(account)/account/admin/AdminHandoffLauncher.jsx` performs the client-side continuation
- `apps/product-site/src/app/(account)/account/admin/handoff/route.js` performs the secure server-side account checks and provisioning
- the API returns JSON such as `{ ok: true, redirectTo }`
- the page navigates the current tab to `redirectTo`

3. Preserve the existing server-side security boundary.
- the client must not send hub id, hub slug, owner email, or auth uid
- the API derives those values from `requireCommercialAccountContext`
- the API remains `force-dynamic`
- responses use `cache: no-store`
- the returned redirect URL must come from `provisionOwnerAdminFromProductSite`

Acceptance criteria:

- clicking `Open admin area` opens a polished page immediately when the route is slow
- the launcher page communicates that Hubforj is opening the admin area
- server failures show a helpful recovery UI and link back to `/account`
- successful handoff automatically continues to the hub
- no secrets or handoff tokens are logged
- no client-controlled hub identity is trusted

### Phase 5: Upgrade Hub-Platform Global Loading UI

Goal:

- eliminate raw white `Loading application...` experience

Tasks:

1. Replace `apps/hub-platform/src/app/loading.jsx`.
- use a branded loading layout
- use existing global/admin tokens
- include stable dimensions
- avoid adding client JavaScript

2. Design requirements:
- centered or shell-aligned layout
- visible Hubforj identity
- short reassuring text such as `Opening your workspace`
- CSS-only subtle loading indicator
- respect reduced motion
- no decorative one-off art
- `role="status"` or equivalent only where it improves assistive technology feedback
- loading message must not repeatedly re-announce on route changes

3. Confirm global fallback works across:
- handoff route
- admin route
- public hub routes
- platform routes

4. Confirm visual quality across themes.
- light mode
- dark/operator theme where applicable
- mobile narrow viewport
- desktop viewport

Acceptance criteria:

- no raw white page with top-left text
- loading UI appears intentional
- no layout overlap on mobile/desktop
- no new package dependency
- color contrast is readable in light and dark contexts
- reduced-motion users do not receive shimmer or looping motion

### Phase 6: Add Admin Route Loading Shell

Goal:

- admin route loading resembles the admin portal, not a generic app screen

Tasks:

1. Add `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/loading.jsx`.
2. Build or reuse server-only skeleton primitives.
3. Match the admin shell footprint:
- left sidebar rail on desktop
- topbar row
- content header block
- one or two panel skeletons
4. Keep skeleton token-based.
5. Ensure mobile layout reserves topbar and content panels.
6. Create separate skeleton shapes for:
- base admin dashboard
- regional onboarding form
- generic admin workspace fallback if route cannot be inferred

Acceptance criteria:

- navigating into admin displays an admin-shaped loading state
- no content jumps when real admin shell appears
- route loading does not import data-fetching modules
- onboarding route loading resembles the regional setup form rather than a dashboard
- dashboard route loading resembles summary cards plus deferred dashboard panels

### Phase 7: Tighten Onboarding Client-State Loading

Goal:

- remove secondary checklist/modal jumpiness after admin shell loads

Tasks:

1. Review `AdminOnboardingProvider` fetch behavior after the route chain is fixed.
2. Decide whether `/admin/onboarding` should fetch route-scoped onboarding state only.
3. Consider passing initial onboarding state from the server for the base `/admin` route only.
4. Keep the current route-scoped optimization for non-base admin routes.
5. Add a stable placeholder for checklist if it appears above the fold.

Acceptance criteria:

- checklist does not pop in jarringly
- onboarding journeys still work per route
- base `/admin` checklist behavior remains correct
- non-base admin routes avoid full checklist fetch unless requested

### Phase 8: Observability And Verification

Goal:

- prove the flow is faster and safer

Tasks:

1. Add structured logs around handoff outcomes.
- provisioned versus existing
- destination path
- consumed versus expired/invalid
- no token values

2. Manual test matrix:
- new owner, incomplete regional setup
- existing owner, incomplete regional setup
- existing owner, complete regional setup
- expired handoff link
- reused handoff link
- custom domain route mode if applicable
- path-mode local development
- product-site fallback if hub-platform response lacks `handoffPath`

3. Browser verification:
- Chrome Network should show no `/admin` document before `/admin/onboarding` for incomplete hubs
- no dashboard RSC/doc work should run before onboarding for incomplete hubs
- no raw `Loading application...` screen should be visible
- cookie should be set on hub host

4. Performance checks:
- compare before/after document timings
- inspect redirect chain count
- inspect Firestore reads if available
- verify no new unrelated route prefetching appears

Acceptance criteria:

- redirect chain is reduced
- visible loading states are branded and route-shaped
- owner lands authenticated
- onboarding remains correct
- no regression to ordinary admin sign-in/member sign-in

## Out Of Scope

This plan does not include:

- replacing Firebase Auth
- changing product-site commercial account auth
- changing hub member/admin manual sign-in
- changing SaaS package billing logic
- redesigning the entire admin portal
- solving all admin route data loading beyond the handoff and onboarding path
- removing `community.hubforj.com`

## Risks And Mitigations

### Risk: Handoff Destination Injection

Mitigation:

- destination must be derived server-side by hub-platform
- destination must be sanitized to relative admin paths only
- no external URL should ever be stored or redirected to from handoff state

### Risk: Cookie Set On Wrong Host

Mitigation:

- product-site must build handoff URL against the hub subdomain
- handoff endpoint must be visited on `hubslug.hubforj.com`
- cookie path remains `/`
- do not set a broad domain cookie unless there is a deliberate cross-subdomain auth strategy

### Risk: Breaking Local Path-Mode Development

Mitigation:

- all redirects must use `buildHubRuntimeHref`
- host mode and path mode should both be tested
- handoff path should stay valid under local `HUB_PLATFORM_BASE_URL`

### Risk: Admin Layout Still Blocks Route Loading

Mitigation:

- keep admin layout work minimal and necessary
- add segment-level admin loading UI
- avoid moving expensive page data into layout

### Risk: Better Skeletons Hide Bad Data Boundaries

Mitigation:

- complete Phase 1 to Phase 3 before UI polish
- verify skipped requests in Network/Firestore before accepting the result

### Risk: Handoff Collection Growth

Mitigation:

- store `expiresAt` as Firestore `Timestamp`
- enable Firestore TTL cleanup on `ownerAdminHandoffs.expiresAt` after rollout
- TTL is operational cleanup only; security must rely on expiry validation and one-time consume

## Implementation Order

1. Phase 0: baseline, deployment order, and rollback guardrails
2. Phase 1: destination-aware handoff
3. Phase 2: cheap `/admin` regional guard
4. Phase 3: core onboarding page data
5. Phase 4: product-site launcher experience
6. Phase 5: polished global hub loading UI
7. Phase 6: admin route loading shell
8. Phase 7: onboarding client-state polish
9. Phase 8: verification and observability

This order intentionally removes avoidable server work first, then addresses the two visible transition surfaces:

- product-site new-tab launcher
- hub-platform loading fallback

After that, it tightens admin route loading and onboarding state polish.

## Verification Checklist

### Static Verification

- `git diff --check`
- lint hub-platform
- lint product-site
- build hub-platform if local environment allows
- build product-site if local environment allows

### Functional Verification

- `Open admin area` opens a new tab
- incomplete hub lands directly on `/admin/onboarding`
- complete hub lands directly on `/admin`
- no second hub admin redirect for incomplete hubs
- owner session is present after handoff
- refreshing `/admin/onboarding` keeps access
- refreshing `/admin` after setup completion works
- reused handoff link fails safely
- expired handoff link fails safely

### UX Verification

- no blank white tab on product-site transition where avoidable
- no top-left `Loading application...`
- admin loading shell resembles final admin layout
- onboarding form appears without large layout jump
- mobile loading state is coherent
- desktop loading state is coherent
- loading text and skeleton colors are readable in light mode
- reduced-motion mode disables shimmer/pulse movement
- keyboard focus is not lost into a non-interactive loading surface
- failure recovery UI is clear and actionable

### Network Verification

- incomplete hub handoff does not load dashboard summary before onboarding
- no unrelated admin route prefetches appear during handoff
- no avoidable `/admin` document request appears before `/admin/onboarding`
- handoff token does not appear in console logs
- handoff API returns a redirect and not a rendered page

### Visual Regression Verification

- capture desktop screenshot of product launcher loading state
- capture mobile screenshot of product launcher loading state
- capture desktop screenshot of hub global loading state
- capture mobile screenshot of hub global loading state
- capture desktop screenshot of admin onboarding loading state
- capture mobile screenshot of admin onboarding loading state
- compare loading and final ready states for layout stability

## Self-Audit And Plan Improvements

### Initial Plan Weaknesses Identified

1. A polished loading screen alone would not solve the core issue.
- The key performance problem is the avoidable `/admin` intermediate route.
- This plan therefore prioritizes destination-aware handoff before skeleton/UI work.

2. Moving `/admin` regional guard earlier is still required.
- Even after handoff is fixed, users may visit `/admin` directly.
- The route must remain correct and cheap for direct visits.

3. Product-site launcher polish has a real tradeoff.
- The route-handler-only launcher is technically leaner and may be fastest when warm.
- A branded page plus API adds one browser/API step but prevents a blank new tab under cold starts or slower server-to-server calls.
- The plan now measures after backend fixes, then implements the page/API contract if the blank state remains visible beyond an enterprise-quality threshold.

4. Admin onboarding client fetch is probably not the first bottleneck.
- It can cause pop-in, but it is not the source of the current white page chain.
- The plan defers this until after redirect and server data fixes.

5. Firestore TTL is useful but not security-critical.
- Expiry and transaction consume protect the flow.
- TTL only prevents old handoff documents accumulating.

### Added Improvements After Review

1. Store explicit `destinationPath` in the handoff document.
- This makes the handoff decision auditable and stable.
- The consume endpoint does not need to re-evaluate hub setup state.

2. Sanitize destination paths.
- Only relative admin paths should be accepted.
- This prevents open redirect risk.

3. Keep the product-site fallback path.
- This reduces deployment coupling between product-site and hub-platform.

4. Add path-mode and host-mode acceptance criteria.
- The repo supports both, so the plan must protect both.

5. Add Network-specific success criteria.
- The final result should be proven in DevTools, not judged by feel alone.

6. Separate global loading from admin route loading.
- A single loading component cannot be optimal for every route.
- Admin entry deserves an admin-shaped route fallback.

7. Define a product-site launcher threshold.
- If `/account/admin` remains visibly blank for roughly 300-500ms, the route-handler-only approach is not acceptable for launch polish.
- In that case, a branded page plus server-owned API continuation is the correct UX/security balance.

8. Add explicit loading contracts.
- Each loading surface now has required content, forbidden content, and route-specific shape expectations.
- This prevents generic skeletons from replacing one poor loading state with another.

9. Add accessibility and motion gates.
- Loading UI should be calm, readable, and usable for screen reader, keyboard, and reduced-motion users.
- Enterprise perceived performance includes trust and clarity, not only faster network timing.

## Definition Of Done

The upgrade is complete when:

- new owner handoff goes directly to the correct admin destination
- incomplete hubs do not load dashboard data before onboarding
- onboarding route uses core hub data only
- visible loading states are branded and route-appropriate
- product-site new-tab experience is acceptable under normal and slow conditions
- handoff security remains one-time, short-lived, and server-derived
- loading states meet accessibility, reduced-motion, and contrast expectations
- layout shift is minimal when loading states resolve into final UI
- local or CI validation passes where the environment allows
- production smoke tests confirm the redirect chain and UI behavior
