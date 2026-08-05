# Hub Platform Skeleton Loading Performance Implementation Plan

## Objective

Create an enterprise-grade loading and skeleton strategy for `hub-platform` across admin, public hub, member account, platform operator, and auth routes.

The goal is not to make more placeholders. The goal is to make unavoidable waits feel stable, intentional, and fast while continuing to remove avoidable server work.

The central product rule is:

- shells should load quickly
- route title/header areas should load quickly
- skeleton UI belongs mainly in the data-rich main content area
- slow sections should be deferred behind route-shaped or panel-shaped skeletons

This plan should be implemented separately from the product-site skeleton work, but it should learn from the same discipline:

- route-by-route anatomy first
- shared primitives before one-off skeletons
- fast shell before skeleton polish
- no skeletons masking bad data boundaries

## Product Standard

Hub-platform serves several audiences and route families. A single generic skeleton will not be enterprise-grade.

The finished implementation should:

- keep permanent shell chrome stable and fast
- render route identity quickly wherever possible
- reserve final layout footprints during loading
- avoid full white interstitials after the user is already inside a route family
- use token-based skeleton primitives
- use CSS-only motion with reduced-motion support
- avoid third-party skeleton packages
- avoid data imports in loading components
- separate route-level loading from panel-level deferred loading
- reduce perceived route jumpiness on mobile and desktop
- keep public site, member account, admin, and platform operator skeletons visually appropriate to their shells

## Locked Decisions

1. Shell-first loading is mandatory.
- public hub shell owns public header/footer
- admin shell owns admin sidebar/topbar
- member account shell owns account navigation
- platform shell owns platform operator nav
- loading states should not replace shell chrome with a generic blank page when a shell can stream first
- route-family loading states must apply the same theme scope and persisted theme source as the final shell to avoid light/dark flashes
- the root loading boundary must use request-level route-family hints for protected workspaces so the generic root loader does not appear during high-latency admin/member/platform entry
- parent protected-workspace loading boundaries must remain shell-only or absent; they must not render generic content placeholders or route-specific titles because client-side transitions can briefly show parent fallbacks before the destination route fallback

2. Route title sections should render before data-rich content.
- route eyebrow/title/description should come from static route copy where possible
- if a title depends on data, split static route identity from data-rich details below it
- skeletons should start below the route title section unless the title itself truly depends on missing entity data
- route-level loading titles should minimize text changes into the final state; when tenant-specific titles are unavailable, use stable neutral copy and keep the rest of the route anatomy accurate

3. Skeletons must mirror route anatomy.
- table routes need table/list skeletons
- form routes need form-field skeletons
- dashboard routes need metric and panel skeletons
- media routes need library/grid skeletons
- public content routes need public-section skeletons
- dashboard loading must reserve package/status rows, metric grids, and downstream panels in the same order as the final route
- visual groups must reveal as complete groups; do not mix real and skeleton siblings within the same stat row, table row set, form section, or panel group

4. Skeletons must not hide avoidable data work.
- inspect route data first
- move redirects and permission guards before heavy fetches
- use core tenant records for route identity, links, locale, and IDs when full operational hub hydration is not required
- defer lower-priority panels with `Suspense`
- add skeletons only around unavoidable or intentionally deferred waits
- optional sections must not reserve large skeleton space while their final visibility is unknown
- if an optional section may be dismissed or absent, show no skeleton by default; reserve space only when there is an explicit user intent or server-known visible state

5. Shared primitives come first.
- create reusable hub-platform skeleton primitives before broad route rollout
- do not duplicate shimmer/pulse code across route CSS modules
- primitives should be server components and CSS modules unless interactivity is unavoidable
- skeleton primitives must use surface/background tokens, not text-muted/content color tokens, so loading UI matches the actual admin/public/member shells

6. Loading states must be accessible.
- avoid noisy repeated announcements
- use `aria-hidden` for decorative skeleton blocks
- use a single calm `role="status"` message where useful
- respect `prefers-reduced-motion`
- preserve readable contrast in light/dark contexts

7. Loading UI must not add meaningful JavaScript.
- route `loading.jsx` files and skeleton components should remain server-rendered
- no Firebase, Stripe, auth, or repository imports in loading UI
- no client state just to animate skeletons

8. Route loading and panel loading solve different problems.
- `loading.jsx` handles route transitions
- `Suspense` fallback handles sections that can stream after the shell/title
- route skeletons should not duplicate panel skeletons if the final route can stream quickly
- avoid stacked loading phases where a global loader, route loader, optional-section skeleton, and panel skeleton appear sequentially for the same navigation
- every route should aim for one stable shell state plus one accurate content skeleton state
- if a route has multiple intentional zones, such as dashboard summary and lower dashboard panels, each zone should have one boundary and reveal atomically
- exact route skeletons belong in the route segment `loading.jsx` or in page-level `Suspense` fallbacks where params/searchParams are known; parent segment fallbacks must not guess the destination route or display generic content skeletons above child routes

9. Protected route loading must not leak private content.
- admin/member/platform loading states may show shell-shaped placeholders
- they must not show real protected data before auth/session checks pass
- if a shell cannot safely render before auth, loading UI should use neutral placeholders rather than hub/user-specific details
- correctness and access control take priority over perceived speed
- protected route families should provide neutral shell-shaped parent loading states so users do not see the generic root loader during normal in-family navigation
- protected shell-shaped fallbacks may read non-sensitive presentation cookies, such as the operator theme preference, but must not fetch tenant/private records solely for loading UI
- middleware may pass non-sensitive route-family/path hints, such as `admin`, to loading boundaries; it must not pass private tenant data for loading decoration

10. Link-only props must not leak into DOM fallbacks.
- shared CTA primitives such as `Button` may render `next/link`, `<a>`, or `<button>`
- props like `prefetch` are valid for `next/link` but invalid on raw DOM anchors
- route/loading work that changes navigation behavior, such as opening public/admin launch CTAs in a new tab, must preserve clean DOM output and avoid hydration/console warnings

## Current State Audit

### Existing Loading Surfaces

Current loading files:

- `apps/hub-platform/src/app/loading.jsx`
- `apps/hub-platform/src/app/(admin)/loading.jsx`
- `apps/hub-platform/src/app/(admin)/[hubSlug]/loading.jsx`
- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/loading.jsx`

Current improvements already completed:

- global raw `Loading application...` was replaced with branded loading UI
- admin segment has a neutral shell-shaped loading state before protected hub/session checks finish
- admin route has a first admin-shaped loading shell
- product-to-hub handoff now avoids the unnecessary `/admin` to `/admin/onboarding` hop
- onboarding route uses core hub data
- admin checklist no longer reserves large skeleton space on normal `/admin` loads while dismissed/visible state is unknown
- admin checklist only shows hydrate skeleton when the user explicitly requested the checklist
- admin onboarding client state is now reused per hub/scope so ordinary admin route or query changes do not repeatedly fetch `onboarding?scope=route`
- event detail/edit shell no longer loads full attendance rows only to render summary counts
- event edit shell now skips the active-upcoming publish-limit count unless the current event is unpublished/non-active and the hub has a finite active-event limit
- event and course detail action links opt out of automatic sibling-route prefetching for bookings, attendance, export, and edit destinations
- read-only event/course detail routes no longer fetch media folders or payment setup for edit forms; those edit-only dependencies load only on `?mode=edit`
- read-only recurring event series detail no longer fetches media folders for the edit form; that dependency loads only on `?mode=edit`
- event/course list, detail, create-back, edit-cancel, create/delete redirects, and recurring-series action hrefs now use the current host/path route mode to avoid avoidable middleware slug-stripping redirects on subdomain admin URLs
- course detail/edit shell now uses course registration summary counters instead of loading full registration rows and member records
- course registration status and attendance mutations now maintain course-level summary counters
- course registration summary projections now include a schema version; legacy or incomplete projections perform one lightweight status-only summary repair before being trusted
- admin course list badges now use the same resolved summary projection as course detail, avoiding per-course live enrolment count fan-out and preventing list/detail count drift

Verified progress:

- Event/course admin route-family performance slice is implemented and user-verified.
- Course detail uses enrolled registrations for upcoming `Attending` display and switches to marked attendance after the course has happened.
- Read-only event/course detail routes avoid edit-only media/payment dependencies.
- Event/course route-family links and create/delete redirects use host/path-aware admin URLs, reducing avoidable middleware slug-stripping redirects on subdomain hubs.

Known gaps:

- hub-platform-wide skeleton primitive layer exists for the first admin slice, but broader route rollout is still pending
- route-family-specific skeleton contracts exist for the first audited admin slice, but need expansion per route family
- most routes do not have route-specific `loading.jsx`
- many routes still await full data before rendering title/content shell
- course payment/reporting scans still need separate bounded query/projection work
- public hub routes need a separate strategy from admin routes
- member account routes need account-shell-specific loading
- platform operator routes need dense operational skeletons

## Route Family Audit

### Admin Routes

Source family:

- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/*`

Shell:

- `HubAdminShell`
- desktop sidebar
- mobile topbar/nav
- admin content frame
- `AdminOnboardingProvider`

Route examples:

- `/admin`
- `/admin/onboarding`
- `/admin/payments`
- `/admin/members`
- `/admin/admins`
- `/admin/events`
- `/admin/courses`
- `/admin/media`
- `/admin/settings`
- `/admin/settings/*`

Fast shell expectation:

- admin shell should render once auth/hub core checks pass
- route title should render from static route copy or core hub data
- data-heavy panels should skeletonize below title

Skeleton families needed:

- admin dashboard summary card skeleton
- admin dashboard deferred panel skeleton
- onboarding form skeleton
- payments workspace skeleton
- members directory skeleton
- member detail skeleton
- admins access list skeleton
- events/courses list skeleton
- event/course editor form skeleton
- media library skeleton
- settings overview skeleton
- settings form skeleton

Priority admin routes:

1. `/admin/onboarding`
2. `/admin`
3. `/admin/payments`
4. `/admin/members`
5. `/admin/events`
6. `/admin/courses`
7. `/admin/settings`
8. `/admin/media`

### Public Hub Routes

Source family:

- `apps/hub-platform/src/app/(hub)/[hubSlug]/*`

Shell:

- public hub layout
- public header/navigation
- public footer
- hub theme/template tokens

Route examples:

- `/`
- `/about`
- `/events`
- `/events/[eventSlug]`
- `/courses`
- `/courses/[courseSlug]`
- `/testimonials`
- `/join`
- `/sign-in`
- `/terms`
- `/privacy`
- `/cookies`

Fast shell expectation:

- public header/footer should appear quickly once hub core/site settings are available
- hero/title sections should render early
- data-heavy public sections should skeletonize below the fold or below title

Skeleton families needed:

- public page section skeleton
- public event listing skeleton
- public event detail skeleton
- public course listing skeleton
- public course detail skeleton
- testimonials section skeleton
- auth/join form skeleton
- legal page content skeleton

Priority public routes:

1. `/`
2. `/events`
3. `/events/[eventSlug]`
4. `/courses`
5. `/courses/[courseSlug]`
6. `/join`
7. `/sign-in`

### Member Account Routes

Source family:

- `apps/hub-platform/src/app/(hub)/[hubSlug]/account/*`

Shell:

- public/member hub layout
- member account layout/nav
- protected member session

Route examples:

- `/account`
- `/account/profile`
- `/account/membership`
- `/account/billing`
- `/account/bookings`
- `/account/courses` compatibility redirect to `/account/bookings`

Fast shell expectation:

- member account route identity and account nav should render quickly after session validation
- booking/course/membership lists should skeletonize below the header

Skeleton families needed:

- member account overview skeleton
- profile form skeleton
- membership status skeleton
- billing records skeleton
- bookings list skeleton

Implementation rules for the audited member account slice:

- Use dedicated member/public skeleton primitives under `components/patterns/member-account-fallbacks`.
- Do not reuse admin/operator skeleton primitives or admin surface tokens on public member pages.
- Skeleton color, border, and surface treatment must resolve from public site tokens such as `--surface-primary`, `--surface-secondary`, and `--public-card-border` so light and dark themes stay aligned with the public site.
- Route title sections remain real content outside Suspense.
- Only data-rich sections below the title skeletonize.
- Do not add a parent `account/loading.jsx` for these routes; page-level Suspense boundaries are required so the account nav and route title stay stable.
- Because the account layout already guards member access, route pages should avoid duplicate pre-title member data loading where possible and place the member/session-specific payload inside the Suspense content.

Audited member account route anatomy:

- `/account`: title `Overview`; data-rich skeleton covers three summary cards, membership panel, upcoming bookings preview, and recent billing preview.
- `/account/bookings`: title `My Bookings`; data-rich skeleton covers current/history toggle, a full-width search input plus separate filter trigger, result count, and public-surface booking cards with media, badges, and actions.
- `/account/membership`: title `Membership`; data-rich skeleton covers current membership panel, status badges, fact tiles, and available upgrade plan card.
- `/account/billing`: title `Billing`; data-rich skeleton covers three payment summary cards, a full-width search input plus separate filter trigger, result count, and public-surface billing item cards.
- `/account/profile`: title `Profile`; data-rich skeleton covers the identity card, avatar area, edit action position, badges, and detail rows.
- `/account/courses`: legacy compatibility route; redirects to `/account/bookings` because course enrolments are now part of the unified bookings journey.

Priority member routes:

1. `/account`
2. `/account/membership`
3. `/account/bookings`
4. `/account/billing`
5. `/account/profile`

### Platform Operator Routes

Source family:

- `apps/hub-platform/src/app/(platform)/platform/*`

Shell:

- platform operator layout/nav
- internal operator workflows

Route examples:

- `/platform`
- `/platform/hubs`
- `/platform/hubs/[hubId]`
- `/platform/hubs/create`
- `/platform/support/[hubId]`

Fast shell expectation:

- operator shell/nav should load quickly after platform session validation
- hub lists/detail panels should skeletonize below title

Skeleton families needed:

- platform dashboard skeleton
- hub table/list skeleton
- hub detail summary skeleton
- create hub form skeleton
- support mode detail skeleton

Priority platform routes:

1. `/platform/hubs`
2. `/platform/hubs/[hubId]`
3. `/platform`
4. `/platform/support/[hubId]`

## Skeleton Primitive Architecture

Create a shared skeleton primitive layer for hub-platform.

Recommended location:

- `apps/hub-platform/src/components/patterns/loading-skeleton/LoadingSkeleton.jsx`
- `apps/hub-platform/src/components/patterns/loading-skeleton/LoadingSkeleton.module.css`

Primitive components:

- `SkeletonBlock`
- `SkeletonText`
- `SkeletonHeading`
- `SkeletonButtonRow`
- `SkeletonMetricGrid`
- `SkeletonPanel`
- `SkeletonList`
- `SkeletonTable`
- `SkeletonForm`
- `SkeletonMediaGrid`
- `SkeletonRouteSection`

Primitive rules:

- server components by default
- CSS-only shimmer
- reduced-motion support
- token-based colors based on surface/background semantics
- stable dimensions through props/classes
- `aria-hidden="true"` for decorative blocks
- no data imports
- no route-specific business logic

### Proposed Primitive API

The first implementation should define the primitive API before route rollout so route skeletons compose consistently.

Recommended component shape:

```jsx
<SkeletonRouteSection
  eyebrow
  title
  description
  actions={2}
>
  <SkeletonMetricGrid count={4} />
  <SkeletonPanel variant="list" rows={5} />
</SkeletonRouteSection>
```

Recommended primitive props:

- `className`
- `variant`
- `count`
- `rows`
- `columns`
- `lines`
- `actions`
- `compact`
- `ariaLabel`

Recommended CSS contract:

- one base `.block` skeleton class
- one shimmer implementation
- one reduced-motion override
- primitive-local semantic variables such as skeleton fill, highlight, border, and surface tokens
- skeleton blocks should be derived from `--admin-surface-*`, `--surface-*`, `--panel-*`, or route-family equivalents
- skeleton blocks should not be derived primarily from `--text-muted`, `--color-text-muted`, or other content color tokens
- shape classes for text, buttons, chips, fields, rows, media, and panels
- responsive container classes for common grids
- no route-specific selectors in the primitive CSS module

Do not implement route skeletons by copying raw `<span>` shimmer blocks into every page. That was acceptable as an interim fix, but not for the hub-platform-wide strategy.

## Route Copy And Fast Header Strategy

Create route metadata/copy helpers where needed so titles can render without full data.

Potential locations:

- `apps/hub-platform/src/lib/navigation/hub-admin-route-copy.js`
- `apps/hub-platform/src/lib/navigation/member-account-route-copy.js`
- `apps/hub-platform/src/lib/navigation/platform-route-copy.js`

Rules:

- route title/eyebrow/description should be available before data-heavy sections
- do not derive common route titles from loaded tables or reports
- entity detail routes may need entity names, but they can still render a stable generic title first if necessary

Examples:

- `/admin/payments`: title `Payments`
- `/admin/members`: title `Members`
- `/admin/onboarding`: title `Set up your community region`
- `/account/bookings`: title `Bookings`
- `/platform/hubs`: title `Hubs`

## Route Audit Tracker

Use this tracker to avoid guessing and to prevent missed routes during rollout.

### Audited For First Implementation Slice

These routes have enough anatomy detail in this plan to begin skeleton implementation after shared primitives exist:

- `/(admin)/[hubSlug]/admin/onboarding`
- `/(admin)/[hubSlug]/admin`
- `/(admin)/[hubSlug]/admin/payments`
- `/(admin)/[hubSlug]/admin/members`
- `/(admin)/[hubSlug]/admin/events`
- `/(admin)/[hubSlug]/admin/courses`
- `/(admin)/[hubSlug]/admin/media`
- `/(admin)/[hubSlug]/admin/what-we-do`
- `/(admin)/[hubSlug]/admin/testimonials`
- `/(admin)/[hubSlug]/admin/settings`
- `/(admin)/[hubSlug]/admin/settings/pages`
- `/(admin)/[hubSlug]/admin/settings/legal`
- `/(admin)/[hubSlug]/admin/settings/account`
- `/(admin)/[hubSlug]/admin/admins`
- `/(admin)/[hubSlug]/admin/events/create`
- `/(admin)/[hubSlug]/admin/events/[eventId]`
- `/(admin)/[hubSlug]/admin/courses/create`
- `/(admin)/[hubSlug]/admin/courses/[courseId]`
- `/(admin)/[hubSlug]/admin/settings/branding`
- `/(admin)/[hubSlug]/admin/settings/site`
- `/(admin)/[hubSlug]/admin/what-we-do/create`
- `/(admin)/[hubSlug]/admin/what-we-do/[itemId]`
- `/(admin)/[hubSlug]/admin/testimonials/create`
- `/(admin)/[hubSlug]/admin/testimonials/[testimonialId]`
- `/(admin)/[hubSlug]/admin/admins/invite`
- `/(admin)/[hubSlug]/admin/events/[eventId]/attendance`
- `/(admin)/[hubSlug]/admin/events/[eventId]/registrations`
- `/(admin)/[hubSlug]/admin/courses/[courseId]/attendance`
- `/(admin)/[hubSlug]/admin/courses/[courseId]/registrations`
- `/(admin)/[hubSlug]/admin/members/[memberId]`
- `/(admin)/[hubSlug]/admin/payments/[paymentItemId]`
- `/(admin)/[hubSlug]/admin/settings/pages/home`
- `/(admin)/[hubSlug]/admin/settings/pages/events`
- `/(admin)/[hubSlug]/admin/settings/pages/courses`
- `/(admin)/[hubSlug]/admin/settings/pages/testimonials`
- `/(hub)/[hubSlug]/account`
- `/(hub)/[hubSlug]/account/bookings`
- `/(hub)/[hubSlug]/account/membership`
- `/(hub)/[hubSlug]/account/billing`
- `/(hub)/[hubSlug]/account/profile`

### Identified But Not Fully Audited

These routes are recognized in the route-family audit but still need detailed DOM/layout anatomy before implementation:

- `/(hub)/[hubSlug]`
- `/(hub)/[hubSlug]/about`
- `/(hub)/[hubSlug]/events`
- `/(hub)/[hubSlug]/events/[eventSlug]`
- `/(hub)/[hubSlug]/courses`
- `/(hub)/[hubSlug]/courses/[courseSlug]`
- `/(hub)/[hubSlug]/testimonials`
- `/(hub)/[hubSlug]/join`
- `/(hub)/[hubSlug]/sign-in`
- `/(hub)/[hubSlug]/terms`
- `/(hub)/[hubSlug]/privacy`
- `/(hub)/[hubSlug]/cookies`
- `/(platform)/platform`
- `/(platform)/platform/hubs`
- `/(platform)/platform/hubs/[hubId]`
- `/(platform)/platform/hubs/create`
- `/(platform)/platform/support/[hubId]`

### Audit Rule For Future Routes

Before adding skeletons to any route in the not-fully-audited list, add:

- current source files
- fast shell/title content
- blocking data calls
- data-rich skeleton areas
- route-level versus panel-level loading decision
- desktop layout shape
- mobile layout shape
- layout-shift risks
- final acceptance criteria

## Route Loading Boundary Rules

Next.js route loading boundaries are segment-scoped. Treat every `loading.jsx` as visible to child routes unless the segment is a true leaf.

Rules:

- parent admin loading boundaries must stay route-neutral and shell-shaped
- route-specific skeletons belong in leaf routes when the segment has no children
- list pages that have child routes must use page-level `Suspense` fallbacks instead of parent segment `loading.jsx`
- detail pages that have child operational routes must use page-level `Suspense` fallbacks instead of `[id]/loading.jsx`
- never place a list skeleton in a segment that also owns create, detail, attendance, registration, invite, export, or other child routes
- before adding any new `loading.jsx`, audit the route tree below that segment and document whether the loader can leak into child routes

Current admin examples:

- `/admin/events`, `/admin/courses`, `/admin/what-we-do`, `/admin/testimonials`, `/admin/admins`, `/admin/members`, and `/admin/payments` must not have broad segment `loading.jsx` files because they own child routes
- `/admin/events/[eventId]` and `/admin/courses/[courseId]` must not have segment `loading.jsx` files because they own attendance and registration child routes
- `/admin/settings` and `/admin/settings/pages` must not have segment `loading.jsx` files because they own child editor routes
- `/admin/events/create`, `/admin/courses/create`, `/admin/settings/branding`, `/admin/settings/site`, `/admin/settings/legal`, `/admin/settings/account`, `/admin/what-we-do/create`, `/admin/what-we-do/[itemId]`, `/admin/testimonials/create`, and `/admin/testimonials/[testimonialId]` may use leaf `loading.jsx` files because their skeletons match the exact route segment
- `/admin/admins/invite`, `/admin/events/[eventId]/registrations`, `/admin/courses/[courseId]/registrations`, `/admin/members/[memberId]`, `/admin/payments/[paymentItemId]`, `/admin/settings/pages/home`, `/admin/settings/pages/events`, `/admin/settings/pages/courses`, and `/admin/settings/pages/testimonials` may use leaf `loading.jsx` files because their skeletons match the exact route segment
- `/admin/events/[eventId]/attendance` and `/admin/courses/[courseId]/attendance` must use page-level `Suspense` fallbacks because each owns an export child route

## First Slice Route Anatomy Audit

This section is the implementation source of truth for the first admin skeleton pass. Do not implement the first slice from generic route-family assumptions.

### Admin `/admin/onboarding`

Current source:

- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/onboarding/page.jsx`
- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/onboarding/RegionalSetupForm.jsx`
- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/settings/settings.module.css`
- `apps/hub-platform/src/components/patterns/workspace-section/WorkspaceSection.jsx`

Current rendered structure:

- admin layout/shell from parent
- `div.settings.layout`
- `WorkspaceSection`
  - header:
    - eyebrow `Onboarding`
    - title `Set up your community region`
    - description paragraph
  - body:
    - `form.settings.form`
    - hidden `hubSlug` input
    - `AdminFormSection` titled `Regional setup`
    - `div.settings.grid`
      - four `AdminSelect` controls:
        - country
        - locale/date-number format
        - timezone
        - default currency
    - `AdminFormFooter`
    - submit button

Current blocking data:

- `requireHubCoreBySlug(hubSlug)`
- `headers()` for route mode
- regional defaults derived in memory
- redirect if setup already complete

Fast shell/title content:

- admin shell after parent auth/core hub check
- route title/description are static and can be represented immediately

Skeleton target:

- keep admin shell/topbar/sidebar outside the form skeleton once shell is available
- render the `WorkspaceSection` title area immediately if possible
- skeleton only the data-rich form body:
  - one section title line
  - four field groups in a 2-column grid on desktop
  - field label line, select box block, hint line for each field
  - footer feedback area reserve
  - one primary button block

Desktop shape:

- form grid: `repeat(2, minmax(0, 1fr))`
- gap: `var(--space-4)`
- section/body gaps from `WorkspaceSection` and settings form

Mobile shape:

- form grid collapses to one column below `56rem`
- skeleton fields must stack one per row

Route-level versus panel-level decision:

- first pass can use route-level `loading.jsx` for `/admin/onboarding`
- longer-term ideal is route shell/title first with form body behind panel-level fallback if server boundary permits

Layout-shift risks:

- skeleton field heights must approximate `AdminSelect` including hint text
- button/footer area must reserve enough height for action and feedback
- title area should not be replaced by a shorter generic skeleton

Acceptance criteria:

- no full white interstitial after admin shell is ready
- form skeleton resembles the regional setup form
- four-field desktop grid does not jump when real selects render
- mobile one-column form does not change order or spacing

### Admin `/admin`

Current source:

- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/page.jsx`
- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/page.module.css`
- `DashboardPanel.jsx`
- `DashboardSection.jsx`
- `DashboardAttentionPanel.jsx`
- `DashboardMembersPanel.jsx`
- `AdminOnboardingChecklist.jsx`

Current rendered structure:

- admin layout/shell from parent
- `div.page.layout`
- optional success `FormMessage`
- `PageHeader`
  - eyebrow `Overview`
  - title hub name or `Hub overview`
  - description
- `AdminOnboardingChecklist`
- optional package bar with badges
- summary stat grid:
  - starter/growth: members, events, courses, revenue
  - other tiers: active members, upcoming events, pending invites
- deferred panels:
  - recent events
  - top courses when courses enabled
  - attention required
  - newest members

Current blocking data:

- `requireHubCoreBySlug(hubSlug)` for setup guard
- redirect to `/admin/onboarding` before summary when incomplete
- `getHubAdminDashboardSummaryBySlug(hubSlug)` before header/card render
- deferred overview promise for revenue/course cards and lower panels
- owner legal settings loaded in deferred panel path

Fast shell/title content:

- route identity `Overview` can be static
- hub name title currently waits for summary/hub data
- route could use core hub name from the guard to render title sooner

Skeleton target:

- do not skeletonize admin shell
- keep `PageHeader` visible quickly using core hub title
- skeleton checklist only while full checklist facts hydrate
- skeleton package bar if package state is not yet available
- skeleton summary stat grid:
  - 4 compact metric cards for starter/growth shape
  - 3 compact metric cards for other tiers if tier is known
  - if tier unknown, use 4-card layout to reserve maximum common footprint
- skeleton deferred panels:
  - two-column grid on desktop
  - recent events panel
  - top courses panel when likely enabled or unknown
  - attention required panel
  - newest members panel

Desktop shape:

- summary grid: 4 columns, collapses to 2 below `72rem`
- panels grid: 2 columns, collapses to 1 below `56rem`

Mobile shape:

- summary cards stack to one column below `56rem`
- panels stack one per row

Route-level versus panel-level decision:

- route-level `loading.jsx` should reserve header, summary, and panel layout for full admin navigation waits
- panel-level `Suspense` should remain for revenue/courses/deferred lower panels
- future optimization should render header from core hub before dashboard summary where possible

Layout-shift risks:

- package bar appearing after skeleton can push summary down if not reserved
- checklist may appear/disappear based on dismissed state; skeleton should reserve only while hydrating base checklist facts
- summary card count can vary by package tier
- top courses panel can appear/disappear by capability

Acceptance criteria:

- no dashboard summary fetch occurs for incomplete hubs
- overview header does not wait on deferred panel data
- summary grid skeleton matches final card count as closely as available data allows
- deferred panels do not shift columns when content arrives

### Admin `/admin/payments`

Current source:

- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/payments/page.jsx`
- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/payments/page.module.css`
- `HubPaymentsWorkspace.jsx`
- `HubPaymentsWorkspace.module.css`
- `PaymentSetupWorkspace.jsx`
- `MembershipPlanManager.jsx`
- `PaymentItemsTable.jsx`

Current rendered structure:

- admin layout/shell from parent
- `div.payments.layout`
- for `view=payments` only:
  - `PageHeader` with `Payments and reporting`
- `Suspense` around `PaymentsWorkspaceLoader`
- inside `HubPaymentsWorkspace`:
  - messages for errors/success/export
  - `view=setup`:
    - `PaymentSetupWorkspace`
    - setup hero panel
    - setup status/action rows
    - setup guidance panel
    - optional Stripe embedded onboarding panel
    - optional support diagnostics
  - `view=plans`:
    - `MembershipPlanManager`
    - plan stats/panels/accordion list
    - pending upgrade requests
    - create/update/delete plan forms
  - `view=payments`:
    - four stat cards
    - toolbar with date filters, search, menus, export
    - payment records table/list
    - pagination controls

Current blocking data:

- `headers()` and route mode
- `requireHubCoreBySlug(hubSlug)`
- payments capability check
- `PaymentsWorkspaceLoader` conditionally loads:
  - payment report for records view
  - membership plans and pending upgrades for plans view
  - payment configuration for setup/plans
  - support diagnostics only in setup support mode
  - Stripe environment state for setup

Fast shell/title content:

- route title is only shown for `view=payments`
- setup/plans view title is mostly inside the client workspace, so route identity is less stable
- plan should introduce route copy for all views:
  - setup: `Payment setup`
  - plans: `Membership plans`
  - payments: `Payments and reporting`

Skeleton target:

- route-level loading should include `PageHeader` for the selected view when possible
- setup skeleton:
  - hero/setup panel with heading, status chips, action button area
  - two-column facts grid
  - guidance panel
  - embedded onboarding panel block with fixed minimum height around `16rem`
- plans skeleton:
  - summary stat cards or guidance strip
  - plan accordion rows
  - create-plan action area
  - pending requests list area
- payments skeleton:
  - four stat cards
  - toolbar controls row with date fields, search, filter buttons, export button
  - table header/rows matching `PaymentItemsTable`
  - pagination area

Desktop shape:

- payment stats: 4 columns, 2 columns below `900px`, 1 column below `640px`
- table header/row columns match:
  - member/item
  - offering/context
  - type
  - status
  - amount
  - date
  - action

Mobile shape:

- stats stack to one column below `640px`
- toolbar wraps
- table/list skeleton should avoid horizontal overflow and mimic whatever final responsive table/list behavior is used

Route-level versus panel-level decision:

- keep `PaymentsWorkspaceLoader` behind `Suspense`
- replace current generic `PaymentsWorkspaceFallback` with view-specific skeleton composed from shared primitives
- add route copy so title area is not hidden inside slow workspace load

Layout-shift risks:

- setup/plans currently lack a route-level `PageHeader`, so adding one must match final desired route structure
- Stripe embedded onboarding minimum height must be reserved
- table skeleton column widths must match final table columns
- support diagnostics should not cause large shift for non-support users

Acceptance criteria:

- selected payments view shows title/header before workspace data
- setup/plans/payments loading states are visually distinct
- payments records view no longer uses a generic loading panel
- Stripe setup area reserves enough height before Stripe embed initializes

### Admin `/admin/members`

Current source:

- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/members/page.jsx`
- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/members/page.module.css`
- `MembersWorkspace.jsx`
- `MembersWorkspace.module.css`

Current rendered structure:

- admin layout/shell from parent
- `div.members.page.layout`
- `PageHeader`
  - eyebrow `Members`
  - title `Member directory`
  - description
- if members exist:
  - `MembersWorkspace`
  - stats grid with 4 stat cards
  - toolbar:
    - search field
    - filter menus
    - export button
  - list section:
    - pagination controls
    - member row cards
- if no members:
  - `EmptyState`

Current blocking data:

- `headers()` and route mode
- `requireHubCoreBySlug(hubSlug)`
- parallel reads:
  - `listUserDirectoryRowsByHub`
  - `listMembershipDirectorySummariesByHub`
  - `listPendingMembershipUpgradeRequestUserIdsByHub`
  - `listEventBookingPaymentAttentionUserIdsByHub`
  - `listCourseRegistrationPaymentAttentionUserIdsByHub`
- mapping/aggregation before render

Fast shell/title content:

- `PageHeader` copy is static and should render before member datasets
- filter definitions are static and can render before member data

Skeleton target:

- route title should appear quickly
- stats grid skeleton:
  - 4 stat cards
- toolbar skeleton:
  - search field block
  - 4 compact filter button blocks
  - export button block
- list skeleton:
  - pagination controls row
  - 8-10 member row cards
  - each row: name line, membership summary line, 2-3 badge blocks
- empty state should not be shown until data resolves

Desktop shape:

- stats grid: 4 columns, 2 columns below `72rem`
- toolbar uses flexible row with search left and menus right
- member rows are full-width cards with flex row content

Mobile shape:

- stats grid stacks to one column below `56rem`
- toolbar controls stretch/wrap
- member row badges can wrap below identity text

Route-level versus panel-level decision:

- first pass can add route-level loading for full members route waits
- stronger implementation should split static header/filter shell from data-heavy member list using `Suspense`
- avoid rendering empty state before data resolves

Layout-shift risks:

- jumping between list and empty state if fallback guesses wrong
- toolbar wrapping must match final responsive behavior
- pagination area should be reserved above list
- stat-card count fixed at 4, which is straightforward to skeletonize

Acceptance criteria:

- member title/header appears quickly
- no empty-state flash before members data resolves
- stats/toolbar/list skeleton footprint matches final layout on desktop/mobile
- member row skeleton heights approximate final row cards

## Implementation Phases

### Phase 0: Baseline And Route Timing Audit

Goal:

- establish which routes are slow because of route data, shell data, client hydration, or missing loading UI

Tasks:

1. Capture Network screenshots/timings for priority admin routes.
2. Capture Network screenshots/timings for priority public routes.
3. Capture Network screenshots/timings for member account routes.
4. Identify routes that fetch large unrelated datasets before title render.
5. Identify routes with duplicated server/client fetches.
6. Identify routes where parent layout blocks route `loading.jsx`.

Required findings:

- does the parent shell block child route `loading.jsx` while auth/session resolves?
- does the route fetch hydrated hub records where core hub records are enough?
- does the route await data that belongs below the title?
- does the route perform redirects after expensive reads?
- does a client provider fetch duplicate data already loaded by the server?
- does route prefetch trigger unrelated RSC requests?

Required architecture decision per route:

- route-level loading only
- panel-level `Suspense` only
- both route-level loading and panel-level `Suspense`
- no skeleton needed after data-boundary cleanup

The decision must be written into the route anatomy audit before implementation.

Acceptance criteria:

- route-by-route timing notes exist
- each priority route has a known first bottleneck
- implementation order is based on evidence
- streaming boundaries are proven rather than assumed

### Phase 1: Shared Skeleton Primitive Layer

Goal:

- create reusable skeleton building blocks before route rollout

Tasks:

1. Add shared skeleton component module.
2. Add shared skeleton CSS module.
3. Include reduced-motion handling.
4. Include layout primitives for text, panels, forms, tables, lists, metrics, and media grids.
5. Document usage rules in the component file or docs.

Acceptance criteria:

- no third-party package
- no client JavaScript
- no hard-coded route-specific colors
- primitives can compose route-specific skeletons
- primitive API is documented before route-specific loading files are expanded

### Phase 2: Admin Route Skeleton Strategy

Goal:

- make admin transitions feel stable while keeping shell and title fast

Tasks:

1. Audit each priority admin route for blocking data before title render.
2. Move redirects, entitlement checks, and setup guards before heavy fetches.
3. Replace hydrated hub loaders with core hub loaders where counts are not needed.
4. Replace generic admin `loading.jsx` with composed admin shell/content skeleton.
5. Add dedicated loading for `/admin/onboarding`.
6. Add dedicated loading for `/admin/payments`.
7. Add dedicated loading for `/admin/members`.
8. Add dedicated loading for events/courses list routes.
9. Add panel-level `Suspense` where routes can stream summary/title before heavier sections.

Acceptance criteria:

- admin shell remains stable
- route title appears before data-heavy panels where possible
- redirect-only routes do not fetch data they throw away
- onboarding skeleton resembles regional setup form
- members skeleton resembles directory/table
- payments skeleton resembles payments workspace
- no route imports data solely to render skeletons
- protected admin data is not visible before session/role checks pass

### Phase 3: Public Hub Route Skeleton Strategy

Goal:

- make public hub routes feel fast without compromising branded public site presentation

Tasks:

1. Audit public layout data boundary.
2. Confirm public header/footer data is shell-critical and not page-specific bloat.
3. Move route redirects/not-found checks before heavy public listing/detail fetches.
4. Add public section skeleton primitives.
5. Add route loading for event/course listings.
6. Add detail skeletons for event/course detail pages.
7. Consider panel-level deferred sections for homepage and public pages.

Acceptance criteria:

- public header and hero/title appear quickly where possible
- heavy event/course/testimonial lists skeletonize below title
- public site does not show admin-style skeletons
- mobile public loading remains polished

### Phase 4: Member Account Route Skeleton Strategy

Goal:

- stabilize protected member account route transitions

Tasks:

1. Audit member account layout/session boundary.
2. Move member redirects/session checks before route-specific heavy reads.
3. Add account route copy constants.
4. Add member account route loading files.
5. Add list/form skeletons for bookings, courses, billing, membership, and profile.
6. Defer data-heavy panels with `Suspense` where safe.

Acceptance criteria:

- member account nav/title renders before list data where possible
- protected session behavior remains correct
- member lists do not cause large layout jumps

### Phase 5: Platform Operator Route Skeleton Strategy

Goal:

- improve internal operator route perceived speed without over-investing in lower-frequency surfaces

Tasks:

1. Add platform route copy constants.
2. Audit operator routes for list/detail overfetching.
3. Add platform table/list skeletons.
4. Add loading states for hub list/detail routes.
5. Keep create/support forms stable.

Acceptance criteria:

- operator shell remains stable
- hub list/detail routes avoid blank panels
- no platform support workflow regression

### Phase 6: Cross-Route Consistency And Cleanup

Goal:

- remove inconsistencies after route-family rollout and prevent repeated skeleton debt

Tasks:

1. Deduplicate skeleton compositions that emerged during route rollout.
2. Ensure all route-family skeletons use shared primitives.
3. Remove obsolete one-off loading CSS where shared primitives replaced it.
4. Confirm summary/deferred panel data boundaries are consistent across route families.
5. Reduce duplicate page-level Firestore reads discovered during rollout.
6. Keep lower-priority route sections behind `Suspense`.

Acceptance criteria:

- no broad duplicated shimmer CSS remains
- data boundary rules are applied consistently
- skeletons represent intentional deferral, not avoidable delay across all priority routes

### Phase 7: Verification And Visual Regression

Goal:

- prove the skeleton strategy improves perceived speed without introducing layout instability

Tasks:

1. Capture before/after desktop screenshots.
2. Capture before/after mobile screenshots.
3. Compare Network waterfalls.
4. Confirm no route prefetch regression.
5. Confirm reduced-motion behavior.
6. Confirm contrast in light/dark/operator/public themes.
7. Verify auth/session behavior for protected routes.
8. Verify loading components do not import data/auth modules.

Acceptance criteria:

- route title/header is visible quickly
- main content skeleton matches final layout
- no obvious layout shift from skeleton to ready state
- no new unrelated route fetches
- no skeleton accessibility regressions
- no unauthorized private content flash appears

## Route-Specific Skeleton Contracts

### Admin `/admin/onboarding`

Fast content:

- admin shell
- route title/description

Skeleton content:

- regional setup form fields
- save button area

Do not skeletonize:

- admin sidebar/topbar once shell is available

### Admin `/admin`

Fast content:

- admin shell
- overview title

Skeleton content:

- summary cards
- setup checklist if full checklist facts are loading
- recent events/top courses/attention/newest members panels

### Admin `/admin/payments`

Fast content:

- admin shell
- payments title
- tab/view shell where possible

Skeleton content:

- setup hero panel
- Stripe onboarding panel
- records table/list
- membership plan manager panels

### Admin `/admin/members`

Fast content:

- admin shell
- members title
- toolbar/search/filter shell where possible

Skeleton content:

- members table/list rows
- pagination controls
- summary/attention side panels

### Public `/events` And `/courses`

Fast content:

- public shell
- listing title/hero
- filter/search shell where possible

Skeleton content:

- event/course card grid
- empty-state space when query resolves

### Member `/account/*`

Fast content:

- member shell
- route title
- account nav

Skeleton content:

- bookings/courses/billing/membership panels
- profile form fields

## First Slice Route Acceptance Checklist

Use this checklist during implementation and review for the audited admin routes.

### `/admin/onboarding`

- admin shell appears as soon as auth/core hub checks allow
- title section remains stable:
  - eyebrow `Onboarding`
  - title `Set up your community region`
  - description text
- form skeleton uses a 2-column desktop grid and 1-column mobile grid
- four field skeletons reserve label, select/control, and hint space
- footer/action skeleton reserves feedback and submit button area
- no hydrated hub count data is loaded for the onboarding page
- completed setup still redirects route-mode correctly to `/admin`

### `/admin`

- incomplete hubs redirect to `/admin/onboarding` before dashboard summary reads
- overview title can render from core hub data where possible
- checklist skeleton only appears while full checklist facts hydrate
- package bar area is reserved or rendered before summary shift
- summary skeleton matches expected card count as closely as package data allows
- deferred panels remain under `Suspense`
- no legal/attention/member/event/course detail data blocks title render

### `/admin/payments`

- selected view has a visible route title/header:
  - setup: `Payment setup`
  - plans: `Membership plans`
  - payments: `Payments and reporting`
- setup skeleton reserves hero, action, guidance, and embedded Stripe panel areas
- plans skeleton reserves plan accordion/list and pending request areas
- payments skeleton reserves 4 stat cards, toolbar, pagination, and table/list rows
- locked payment feature state still renders directly when payments are unavailable
- no Stripe/report/list data is imported by loading components
- Stripe setup skeleton mirrors the ready/setup panel shown in production: status badges, primary setup copy, and six payment facts
- membership plans skeleton mirrors the compact action-plus-accordion-list layout and must not show large generic panels
- payments loading boundaries must read the non-sensitive `x-hubforj-search` route hint so `?view=setup`, `?view=payments`, and `?view=plans` render the correct skeleton
- parent admin loading boundaries must stay route-neutral; payment-specific skeletons belong in `/admin/payments/loading.jsx` and the payments page `Suspense` fallback

### `/admin/members`

- title section renders before member directory datasets where possible
- stats skeleton reserves 4 cards
- toolbar skeleton reserves search, filter menus, and export button
- list skeleton reserves pagination and 8-10 member row cards
- empty state does not flash before member data resolves
- row skeleton height approximates final member row card
- filtering/search client behavior remains unchanged after data resolves

### `/admin/events`

- title section renders from hub core data before event and event-series datasets resolve
- route uses the core hub record for header/workspace identity and does not hydrate operational hub counts for list rendering
- workspace skeleton reserves search, three filter menus, pagination controls, and stacked event cards
- event cards reserve title, status/count badges, media thumbnail, schedule line, and summary copy
- event list reveals as one complete list workspace; no mixed real/skeleton event rows
- route-level loading mirrors the final events page instead of the generic admin overview loader
- parent admin loading boundaries must stay route-neutral; programme-specific skeletons belong in the route segment `loading.jsx` and the page-level `Suspense` fallback
- delete/menu and onboarding behavior remains unchanged after data resolves

### `/admin/courses`

- title section renders from hub core data before course datasets and enrolment-count fan-out resolve
- route uses the core hub record for header/workspace identity and does not hydrate operational hub counts for list rendering
- workspace skeleton reserves search, three filter menus, pagination controls, and stacked course cards
- course cards reserve title, status/count badges, media thumbnail, schedule line, and summary copy
- course list reveals as one complete list workspace; no mixed real/skeleton course rows
- route-level loading mirrors the final courses page instead of the generic admin overview loader
- parent admin loading boundaries must stay route-neutral; programme-specific skeletons belong in the route segment `loading.jsx` and the page-level `Suspense` fallback
- enrolment-count work remains deferred behind the programme-list skeleton

### `/admin/media`

- route-level loading mirrors media library anatomy: title, search, tabs, folder row, asset grid, and details panel
- route uses the core hub record for media IDs/links/actions and does not hydrate operational hub counts for asset library rendering
- media route currently keeps the final functional header inside the client workspace because folder/upload actions are coupled to workspace modal state
- future media enhancement should split media workspace state before moving those action buttons into a streamed server title area
- loading component contains no media repository imports
- skeleton reserves the right-hand details panel on desktop and collapses cleanly on narrower screens

### `/admin/what-we-do`

- title section renders from hub core data before What we do records resolve
- route uses the core hub record for header/workspace identity and does not hydrate operational hub counts for content-list rendering
- stats strip and item list reveal as one content workspace below the title
- stats skeleton reserves Total, Published, and Drafts cards
- list skeleton reserves repeated content cards with title, sort/order copy, status/menu controls, and description copy
- route-level loading mirrors the final page anatomy
- empty-state behavior remains inside the resolved workspace and must not flash before data resolves

### `/admin/testimonials`

- title section renders from hub core data before testimonial records resolve
- route uses the core hub record for header/workspace identity and does not hydrate operational hub counts for content-list rendering
- stats strip and testimonial list reveal as one content workspace below the title
- stats skeleton reserves Total, Published, and Featured cards
- list skeleton reserves avatar, identity copy, status/featured/menu controls, and quote copy
- route-level loading mirrors the final page anatomy
- empty-state behavior remains inside the resolved workspace and must not flash before data resolves

### `/admin/settings`

- title section renders from hub core data before site, legal, and payment configuration datasets resolve
- settings overview fallback mirrors three stat cards followed by two-column settings cards
- fallback cards reserve heading, status badge, body copy, meta line, and action button
- route uses page-level `Suspense`; no parent `settings/loading.jsx` should exist because it would affect child settings routes
- resolved settings cards reveal as one complete overview region below the title

### `/admin/settings/pages`

- title section renders from hub core data before site-settings page content resolves
- page settings fallback mirrors the four public-page cards in a two-column grid
- cards reserve heading, status badge, body copy, meta line, and action button
- route uses page-level `Suspense`; no parent `settings/pages/loading.jsx` should exist because it would affect page editor child routes
- resolved page cards reveal as one complete grid below the title

### `/admin/settings/legal`

- route loading mirrors the framed legal settings workspace, including header/back action, status bar, tabs, editor column, and guidance column
- page-level fallback inside `WorkspaceSection` uses the editor body skeleton only and must not duplicate the framed title/header
- legal title/back action renders from hub core data before access/legal/settings datasets resolve
- editor and guidance reveal as one legal workspace body
- loading components contain no auth, legal repository, or site-settings imports

### `/admin/settings/account`

- title section renders immediately before the account overview datasets resolve
- account fallback mirrors package panel, three stat cards, and custom-domain management panels
- fallback reserves package action, package badges, usage cards, hosted address card, domain status panel, and domain setup form panel
- resolved package/domain content reveals as one account workspace body below the title
- existing package-management and domain form actions remain unchanged

### `/admin/admins`

- route title should appear before admin user and invite lists resolve
- invite action should reserve its button slot while access permissions resolve
- admin access skeleton mirrors at least one admin row with role/status badges and timestamp metadata
- pending access skeleton mirrors the framed pending-invites/empty-state panel below the admin list
- resolved admin access and pending invite regions should reveal as one access workspace below the title
- loading component must not import invite-token, env, users, invites, or access repositories

### `/admin/events/create`

- route loading and page fallback mirror the framed event creation workspace, not the event-list skeleton
- title/back action renders from hub core data before media library and payment configuration resolve
- form skeleton reserves the event wizard stepper, current-step copy, media selector row, two-column fields, full-width summary/description fields, and footer actions
- limit-reached package notice remains inside the resolved content path and must not flash as an empty state before the limit check resolves
- publishing guidance may load after the main form, but the main editor should reveal as one complete region
- loading component must not import media, payment, event count, or package repositories

### `/admin/events/[eventId]`

- route loading mirrors the event detail workspace, not the event-list skeleton
- generic event-detail skeleton is acceptable until the event record resolves because the final title is entity-derived
- fallback reserves title/back area, status badges, management action buttons, media preview, fact tiles, metadata rows, and description copy
- edit mode should use the same route-specific detail/editor skeleton while the event, media, payment, and attendance datasets resolve
- resolved detail content reveals as one coherent workspace; no mixed real/skeleton fact rows
- loading component must not import event, media, payment, attendance, or package repositories

### `/admin/courses/create`

- route loading and page fallback mirror the framed course creation workspace, not the course-list skeleton
- title/back action renders from hub core data before media library and payment configuration resolve
- form skeleton reserves the five-step course wizard, current-step copy, media selector row, two-column course fields, full-width summary/description fields, and footer actions
- publishing guidance may load after the main form, but the main editor should reveal as one complete region
- loading component must not import media, payment, or package repositories

### `/admin/courses/[courseId]`

- route loading mirrors the course detail workspace, not the course-list skeleton
- generic course-detail skeleton is acceptable until the course record resolves because the final title is entity-derived
- fallback reserves title/back area, status/type badges, management action buttons, media preview, schedule/delivery/pricing/capacity fact tiles, metadata rows, and description copy
- edit mode should use the same route-specific detail/editor skeleton while the course, media, payment, and registration datasets resolve
- resolved detail content reveals as one coherent workspace; no mixed real/skeleton fact rows
- loading component must not import course, media, payment, registration, or package repositories

### `/admin/settings/branding`

- route loading and page fallback mirror the framed Brand and appearance workspace
- title/back action renders from hub core data before branding values and media library resolve
- form skeleton reserves logo media field, alt text field, presentation selects, brand color fields, header CTA fields, and footer actions
- existing dirty-form runtime and media picker behavior remain unchanged
- loading component must not import site-settings or media repositories

### `/admin/settings/site`

- route loading and page fallback mirror the framed Site details workspace
- title/back action renders from hub core data before site defaults and payment configuration resolve
- form skeleton reserves identity/contact fields, regional default selects, Stripe setup notice space, SEO/contact sections, and footer actions
- country-lock and Stripe setup notice logic remains in the resolved content path
- loading component must not import site-settings or payment repositories

### `/admin/what-we-do/create`

- route loading mirrors the framed New item workspace
- form skeleton reserves title/sort-order two-column row, status select, large description textarea, and footer create action
- route should use core hub data only; no full operational hub hydration is required just to render the create form
- resolved form should replace the skeleton as one compact editor region

### `/admin/what-we-do/[itemId]`

- route loading mirrors the What we do detail editor, not the What we do list skeleton
- generic item-detail skeleton is acceptable until the item record resolves because the final title/status badge is entity-derived
- fallback reserves page title/status/back area and the framed item content editor
- form skeleton reserves title/sort-order row, status select, description textarea, cancel/save actions
- resolved detail content reveals as one coherent editor region
- loading component must not import What we do repositories

### `/admin/testimonials/create`

- route loading and page fallback mirror the framed New testimonial workspace
- title/back action renders from hub core data before media library resolves
- form skeleton reserves quote textarea, author fields, status/featured controls, author image media row, alt text, and footer actions
- existing media picker behavior remains unchanged
- loading component must not import media repositories

### `/admin/testimonials/[testimonialId]`

- route loading mirrors the testimonial detail editor, not the testimonial list skeleton
- generic testimonial-detail skeleton is acceptable until the testimonial record resolves because the final title/status badges are entity-derived
- fallback reserves page title/status/back area, content card heading/copy, author image area, quote textarea, attribution fields, status/featured controls, media row, and footer actions
- resolved detail content reveals as one coherent editor region
- loading component must not import testimonial or media repositories

### `/admin/admins/invite`

- route loading mirrors the framed Invite admin workspace
- fallback reserves email field, role select, helper text, and submit action
- permission-gated no-invite state remains inside the resolved content path
- loading component must not import access, user-domain, or hub repositories

### Event And Course Operational Tables

Routes:

- `/admin/events/[eventId]/registrations`
- `/admin/events/[eventId]/attendance`
- `/admin/courses/[courseId]/registrations`
- `/admin/courses/[courseId]/attendance`

Acceptance criteria:

- route loading mirrors the operational dashboard: title, four stat cards, framed activity/list workspace, search, filters, pagination, and table rows
- attendance pages use page-level `Suspense` rather than segment `loading.jsx` because they own export child routes
- generic title copy is acceptable until the event/course record resolves because the final description includes the entity title
- table row skeletons reserve identity columns, status/payment/progress badges, menu buttons, dates, and pagination controls
- event booking and attendance variants use the same operational-table fallback with route-specific copy
- course registration and attendance variants use the same operational-table fallback with route-specific copy
- loading components must not import event, course, booking, registration, attendance, or hub repositories

### `/admin/members/[memberId]`

- route loading mirrors the member detail dashboard
- generic member title is acceptable until the member record resolves because the final title is entity-derived
- fallback reserves header actions, identity/status panel, three stat cards, member state/admin controls, current membership panel, participation/payment context sections
- resolved member detail content reveals as one coherent dashboard region
- loading component must not import member-detail, membership, hub, header, or action repositories

### `/admin/payments/[paymentItemId]`

- route loading mirrors the payment detail page
- generic payment title is acceptable until the payment record resolves
- fallback reserves back action, payment summary card, amount area, status/type badges, four fact cards, primary member action, and linked-record context panel
- resolved payment detail content reveals as one coherent detail region
- loading component must not import payment, hub-host, runtime-path, header, or repository modules

### Page Settings Editors

Routes:

- `/admin/settings/pages/home`
- `/admin/settings/pages/events`
- `/admin/settings/pages/courses`
- `/admin/settings/pages/testimonials`

Acceptance criteria:

- route loading mirrors the framed page-settings editor workspace
- page header/back action renders from hub core data before site-settings and media library datasets resolve
- homepage and testimonials fallbacks reserve the tab strip before the form fields
- events and courses fallbacks reserve the single hero editor form
- form skeleton reserves media selector, alt text, hero eyebrow/title, hero description textarea, CTA fields where present, and footer save action
- dirty-form runtime and media picker behavior remain unchanged
- loading components must not import site-settings, media, or hub repositories

## Measurement And Network Verification

The product-site plan included explicit verification. Hub-platform needs the same discipline because this route tree is broader and more sensitive.

### Local/CI Checks

- `git diff --check`
- hub-platform lint when local Node/WSL environment allows
- hub-platform build when local Node/WSL environment allows
- route loading components contain no Firebase/Stripe/auth/data imports
- reduced-motion CSS exists for shimmer animation

### Browser Verification

For each first-slice route, capture desktop and mobile screenshots for:

- loading state
- final ready state
- reduced-motion loading state if practical

For each first-slice route, inspect Chrome Network for:

- document request timing
- RSC waterfall
- duplicate route data reads
- unrelated prefetches
- redirect churn

### What To Prove

- shell and route title are visible as early as technically possible
- skeletons are concentrated in main data-rich content
- skeleton dimensions match final layout closely
- no obvious cumulative layout shift
- no unauthorized content flash
- no unrelated route fetches introduced by loading components
- no client bundle growth from skeleton-only components

## Out Of Scope

This plan does not include:

- redesigning the admin portal
- replacing existing route architecture
- changing auth/session models
- changing product-site skeletons
- building perfect skeletons for every low-frequency detail route in the first pass
- adding third-party loading libraries

## Risks And Mitigations

### Risk: Skeletons Become Decorative Debt

Mitigation:

- build shared primitives first
- require route contracts
- review skeleton-to-final layout screenshots

### Risk: Loading UI Masks Slow Routes

Mitigation:

- complete route timing audit
- move guards before heavy fetches
- split data into blocking summary and deferred panels

### Risk: Shells Still Block Loading

Mitigation:

- inspect parent layouts before adding child loading files
- keep layout data light
- avoid route-irrelevant data in shells

### Risk: One Skeleton Style Feels Wrong Across Route Families

Mitigation:

- primitives stay shared
- route-family compositions differ
- public skeletons use public section patterns
- admin skeletons use admin workspace patterns

### Risk: Accessibility Regression

Mitigation:

- decorative skeletons are `aria-hidden`
- only one polite status message where useful
- reduced motion disables shimmer
- color contrast is checked in each theme context

## Implementation Order

1. Phase 0: baseline and route timing audit
2. Phase 1: shared skeleton primitive layer
3. Phase 2: admin priority routes
4. Phase 3: public hub priority routes
5. Phase 4: member account routes
6. Phase 5: platform operator routes
7. Phase 6: cross-route consistency and cleanup
8. Phase 7: verification and visual regression

## Recommended First Implementation Slice

Start with admin routes before public/member/platform routes.

Rationale:

- admin routes are currently the most operationally important for new clients
- recent work already exposed the admin loading and onboarding boundaries
- admin routes share one shell, so primitive quality can be proven in a contained area
- payments and members have already shown measurable performance concerns

First slice:

1. Build shared skeleton primitives.
2. Replace current admin loading CSS with shared primitives.
3. Implement route-specific skeletons for:
- `/admin/onboarding`
- `/admin`
- `/admin/payments`
- `/admin/members`
4. Add route copy constants for these admin routes.
5. Audit and fix blocking data boundaries only for those routes.
6. Verify desktop/mobile screenshots and Network waterfalls.

Do not start public/member/platform skeleton rollout until the admin slice proves:

- shared primitives are expressive enough
- route titles can render quickly
- skeleton-to-final layout shift is acceptable
- no accidental data imports entered loading components

## Definition Of Done

The hub-platform skeleton strategy is complete when:

- shared skeleton primitives exist
- route-family contracts are implemented for priority routes
- route shells and titles render as early as technically possible
- skeletons are concentrated in data-rich main content areas
- loading components are server-rendered and token-based
- reduced-motion and accessibility requirements are met
- before/after Network waterfalls show fewer blocking waits or better progressive rendering
- mobile and desktop transitions are visually stable
- no broad one-off skeleton CSS has been scattered through unrelated routes

## Implementation Progress

### 2026-08-04 - Public Events/Courses Listing Fallbacks

Status: implemented and runtime visually verified.

Completed:

- Added `PublicOfferingListingFallback` for public `/events` and `/courses` deferred listing sections.
- Used public section/card surface tokens instead of admin skeleton tokens.
- Kept the public hero/title shell outside the skeleton boundary so above-the-fold content can render quickly.
- Reserved search/filter toolbar space before the card area.
- Reserved card media, title, description, and metadata row space to reduce layout jumping.
- Matched default, studio, and editorial listing variants closely enough for first-pass route stability.
- Replaced the previous empty `fallback={null}` public offering boundaries.

Locked Behaviour:

- Public offering skeletons must be route-specific and public-token based.
- Public offering skeletons should sit only around the data-rich listing/FAQ area below the fast hero shell.
- Future public route skeletons should reuse the same public fallback family where possible instead of introducing route-local one-off skeleton styling.

Runtime Verification:

- User confirmed events and courses skeleton UI is present and barely visible even with heavy throttling.

### 2026-08-04 - Public Root Loading Cleanup

Status: implemented and runtime visually verified.

Completed:

- Replaced the public root loading progress-card experience with a neutral public shell skeleton.
- Preserved the existing admin branch so admin routes continue to use admin-specific loading.
- Removed the public progress bar that felt jarring on hard refresh.
- Used public/system surface tokens and reduced-motion support.

Locked Behaviour:

- Root public loading must remain a calm shell approximation, not a branded progress-card interstitial.
- Route-specific public skeletons should take over once the route starts streaming.
- Admin root loading should remain admin-specific.

Runtime Verification:

- User confirmed the revised public root loading state is better.

### 2026-08-04 - Public Testimonials Listing Fallback

Status: implemented and runtime visually verified.

Completed:

- Added `PublicTestimonialsSectionFallback` for public `/testimonials`.
- Used public section/card surface tokens.
- Kept public hero and CTA outside the testimonial Suspense boundary.
- Reserved heading, testimonial card, quote, and attribution structure.
- Covered cards, spotlight-plus-rail, and showcase variants.
- Added implementation note:
  [hub-platform-public-testimonials-shell-deferred-slice-2026-08-04.md](hub-platform-public-testimonials-shell-deferred-slice-2026-08-04.md)

Locked Behaviour:

- Public testimonials skeletons must stay below the hero and focus on testimonial listing content.
- Future public content routes should split shell and deferred content before adding decorative loading states.

Runtime Verification:

- Production `/testimonials` screenshot showed a clean document load around 416 ms.
- Testimonial RSC refresh/navigation requests were around 157-173 ms.
- User confirmed the broader public root loading experience is improved after replacing the progress-card fallback.
