# Product Site Skeleton Loading Performance Implementation Plan

## Objective

Create an enterprise-grade loading strategy for the `product-site` so account, billing, package, upgrade, signup, and auth transitions feel stable, fast, and intentional.

This plan focuses on perceived performance and layout stability after the recent server-side performance work:

- route prefetch noise has been reduced
- sign-in session work has been shortened
- ordinary account page renders avoid unnecessary live Stripe refreshes

The next step is to make all remaining unavoidable loading states feel polished and predictable.

## Product Standard

Skeleton loading must be treated as part of the product design system, not as one-off grey placeholders.

The finished implementation should:

- reserve the same major layout footprint as the final route
- avoid page jumpiness during account and billing transitions
- keep above-the-fold content stable
- use existing product-site tokens for color, spacing, border, radius, and typography rhythm
- avoid noisy animation or overly decorative loading effects
- support route-level loading and panel-level loading separately
- make slow server sections feel progressive rather than broken

## Locked Decisions

1. Skeletons must mirror final route structure.
- the number of major panels should match the destination route
- card width, grid columns, heading area, status rows, and action rows must preserve layout
- no generic full-page spinner should be used for account routes

2. Shared skeleton primitives must be created before route-specific skeletons.
- do not duplicate placeholder markup across every loading file
- route skeletons should compose primitives and route-specific shell components

3. Route-level loading and panel-level loading solve different problems.
- `loading.jsx` handles navigation between routes
- `Suspense` panel skeletons handle sections that can be deferred after the route shell renders

4. Skeletons should not hide avoidable server work.
- if a route is slow because it fetches too much up front, fix the fetch boundary first
- skeletons are for unavoidable or intentionally deferred loading

5. Account and billing logic must remain correct.
- billing-changing actions can continue to use fresh Stripe state
- ordinary page renders should prefer stored webhook-backed state
- skeleton work must not change package, checkout, or provisioning business rules

6. Route title sections must render as fast shell content.
- account topbar, route eyebrow, route title, and route description should not be replaced by skeletons
- these elements should come from static route copy or route constants wherever possible
- skeletons should begin below the route title section and map the data-rich panels
- a user should know which route they are on before account, billing, package, or Stripe data finishes loading
- full-page skeletons that hide the route title are not acceptable for account routes

7. Skeletons must not add meaningful JavaScript cost.
- skeleton primitives should be server components with CSS-only visuals by default
- do not add `use client` to skeleton primitives unless a specific interaction requires it
- do not introduce a third-party skeleton, animation, or loading-state package
- shimmer/pulse effects must be CSS-only and disabled for reduced-motion users
- loading UI must not import Firebase, Stripe, package calculation helpers, or data-fetching utilities

8. Streaming boundaries must be proven, not assumed.
- if a parent layout awaits session or account data, verify whether route `loading.jsx` can actually show before that await resolves
- if a page awaits `requireCommercialAccountContext()` before rendering its shell, refactor the route into a static shell plus async data panels
- route shells must be returned before secondary panel data is awaited
- implementation must avoid moving slow work behind a skeleton while still blocking the whole route at the top of the tree

## Current State

### Existing behavior

- `/account` has a first loading state at `apps/product-site/src/app/(account)/account/loading.jsx`
- account route prefetching has been reduced with `prefetch={false}`
- sign-in redirects now feel faster, but `/account` still needs a more accurate loading layout
- `/account/package`, `/account/billing`, and `/account/upgrade` do not yet have route-specific skeletons
- account page panels are still mostly route-level rather than panel-level `Suspense` boundaries
- account pages currently call `requireCommercialAccountContext()` before rendering `AccountShell`, so the final route shell may still be blocked unless the route is refactored into static shell plus async panels
- `apps/product-site/src/app/(account)/layout.jsx` performs a session requirement; implementation must confirm whether this parent layout blocks child route loading UI

### Known gaps

- skeletons are not yet a reusable design-system layer
- billing/package/upgrade routes do not have route-accurate skeletons
- current account loading state is serviceable but not detailed enough
- no shared CSS for skeleton shimmer/pulse, dimensions, or accessibility behavior
- no documented route-by-route loading acceptance criteria
- no explicit route metadata constants for fast account headings
- no explicit streaming-boundary proof for account route loading behavior

## Route Anatomy Audit

This section maps the current production route markup to the skeletons that must be built. Use this as the implementation source of truth before writing route loading components.

### Shared Account Route Shell

Current source:

- `apps/product-site/src/components/patterns/account-shell/AccountShell.jsx`
- `apps/product-site/src/components/patterns/account-header/AccountHeader.jsx`

All account routes render:

- `main.page-shell`
- `header.marketing-header.account-header`
- account topbar with logo, account nav, owner identity, sign-out action
- `section.marketing-hero-section`
- `page-section page-section--wide content-stack account-page-stack`
- `section-heading section-heading--wide`
- route children

Skeleton implication:

- route skeletons must preserve the account topbar and heading footprint, but the preferred implementation is to render the real topbar shell and route title immediately
- account identity and sign-out areas should reserve space without pretending actions are ready
- all route-level skeletons should use the same account loading shell
- the shared account loading shell should accept static route copy so it can render real eyebrow, title, and description while data-rich sections load below

### Fast Shell Versus Data-Rich Sections

The loading strategy must separate route chrome from data panels.

Fast shell content:

- account topbar structure
- product logo
- route eyebrow
- route title
- route description
- stable page spacing

Data-rich sections:

- account status banners
- billing/payment banners
- workspace cards
- metric strips
- side summary panels
- package grid cards
- upgrade action panels
- Stripe-dependent actions
- checkout or pending-package notices

Implementation implication:

- `loading.jsx` files should render real route title copy immediately
- skeleton primitives should start where data-rich content starts
- `Suspense` fallbacks should be panel-shaped, not whole-page-shaped
- route components should avoid deriving static route title copy from account data
- if a title truly depends on server data, split it into a static title plus a data-rich subtitle or panel below

### `/account` Current Layout

Current source:

- `apps/product-site/src/app/(account)/account/page.jsx`

Rendered structure:

- optional `AccountStatusBanner`
- `section.account-workspace-layout`
- main column:
  - `article.route-card.account-focus-panel`
  - workspace heading
  - lede paragraph
  - `status-row.account-focus-panel__status`
  - `account-metric-strip` with 3 metric items:
    - current package
    - billing
    - next move
  - `button-row` with package/billing links
- side column:
  - `article.route-card.account-side-panel`
  - "At a glance" heading
  - `account-side-list` with 3 rows:
    - account email
    - package
    - billing
  - `button-row` with upgrade/checkout/scheduled-change action

Skeleton implication:

- account overview skeleton must have one optional banner placeholder only when route-level context cannot know banner state
- real route title copy should render before skeleton panels:
  - eyebrow: `Your account`
  - title: `Account overview`
  - description: `See your package, billing, and next steps as your community grows.`
- main focus panel must include:
  - heading block
  - two to three text lines
  - two to four chip placeholders
  - three metric placeholder blocks
  - two button placeholders
- side panel must include:
  - heading block
  - three compact list rows
  - one primary button placeholder

### `/account/billing` Current Layout

Current source:

- `apps/product-site/src/app/(account)/account/billing/page.jsx`

Rendered structure:

- `BillingRouteStateNotice`
- optional `AccountStatusBanner`
- `section.account-workspace-layout`
- main column:
  - `article.route-card.account-focus-panel`
  - billing heading
  - lede paragraph
  - `status-row.account-focus-panel__status`
  - `account-metric-strip` with 3 metric items:
    - current package
    - billing provider
    - scheduled change or next step
  - `button-row` with one conditional primary action and one package link
- side column:
  - `article.route-card.account-side-panel`
  - "Billing snapshot" heading
  - `account-side-list` with at least 4 rows:
    - current package
    - current monthly price
    - current status
    - billing cycle
  - optional scheduled package row
  - optional plan ending row

Skeleton implication:

- billing skeleton must reserve a route notice area
- real route title copy should render before skeleton panels:
  - eyebrow: `Billing`
  - title: `Billing`
  - description: `Manage your plan payments here. Member payments inside your community stay in your admin area.`
- billing skeleton must reserve an optional banner-sized area only if the route later defers that decision
- main focus panel must include three metric blocks and a stable action row
- side panel must reserve four baseline rows plus space for one optional row without causing major shift
- Stripe-dependent action availability should render as neutral button placeholders until resolved

### `/account/package` Current Layout

Current source:

- `apps/product-site/src/app/(account)/account/package/page.jsx`
- `apps/product-site/src/components/patterns/package-catalog/PackageCatalog.jsx`
- `apps/product-site/src/components/patterns/account-surfaces/AccountSurfaces.jsx`

Rendered structure:

- `AccountActionPanel`
  - title and description
  - chip row with price/status
  - `detail-grid`
  - first detail block:
    - "Included"
    - feature list
  - second detail block:
    - "Best next action"
    - two paragraphs
  - action row with upgrade/checkout CTA
- `PackageCatalog`
  - `div.package-grid`
  - one `article.package-card` per package
  - package title
  - package price
  - package summary
  - "Included" feature list
  - package action row or current package chip
- optional final `article.route-card`
  - "Selected package" or "When to move up"
  - explanatory paragraph
  - optional action button

Skeleton implication:

- package skeleton must not use the account workspace main/sidebar layout
- real route title copy should render before skeleton panels:
  - eyebrow: `Package`
  - title: `Package`
  - description: `See what is included in your current package and compare it with the next options as your community grows.`
- first skeleton card must mirror `AccountActionPanel`
- package grid skeleton must render three package-card placeholders
- each package-card placeholder must reserve:
  - title
  - price line
  - summary lines
  - feature list area
  - action row
- optional final route-card placeholder should be included to avoid bottom-of-page shift

### `/account/billing` and `/account` Shared Workspace Pattern

Current CSS/layout source:

- `.account-workspace-layout`
- `.account-workspace-main`
- `.account-workspace-side`
- `.account-focus-panel`
- `.account-side-panel`
- `.account-metric-strip`

Skeleton implication:

- create a reusable `AccountWorkspaceSkeleton` or composition helper
- use it for `/account` and `/account/billing`
- do not force `/account/package` or `/account/upgrade` into this layout when their final markup does not use it

### `/account/upgrade` Current Layout

Current source:

- `apps/product-site/src/app/(account)/account/upgrade/page.jsx`
- `apps/product-site/src/components/patterns/account-surfaces/AccountSurfaces.jsx`
- `apps/product-site/src/components/patterns/package-catalog/PackageCatalog.jsx`

Rendered structure:

- `UpgradeRouteStateNotice`
- optional payment-attention `AccountStatusBanner`
- first `AccountActionPanel`
  - title: selected package
  - selected package summary
  - chip row:
    - selected tier
    - selected price
    - selected action
  - `detail-grid`
  - included feature list
  - next-step description
  - conditional action area:
    - checkout confirmation
    - subscription update confirmation
    - billing portal form
    - subscription cancellation confirmation
    - subscription schedule confirmation
    - current package link
    - scheduled-change cancellation
    - unavailable billing link
- second `AccountActionPanel`
  - title: current position
  - description of current/pending position
  - chip row:
    - current tier
    - current price
    - billing status
    - optional pending tier
- `PackageCatalog`
  - same three-card package grid as package route

Skeleton implication:

- upgrade skeleton must reserve:
  - route notice area
  - optional banner area only if deferred
  - selected package action panel
  - current position action panel
  - three-card package grid
- real route title copy should render before skeleton panels:
  - eyebrow: `Upgrade`
  - title: `Upgrade or change package`
  - description: `Review your options, then upgrade directly here or use billing for subscription management when needed.`
- action placeholders must be neutral because the actual enabled action depends on account, Stripe, and selected tier state
- do not show a fake primary checkout action before data resolves

### Auth and Signup Current Layouts

Current sources:

- `apps/product-site/src/app/(marketing)/sign-in/page.jsx`
- `apps/product-site/src/app/(marketing)/sign-in/SignInForm.jsx`
- `apps/product-site/src/app/(marketing)/signup/page.jsx`
- `apps/product-site/src/app/(marketing)/signup/SignupProvisionForm.jsx`
- `apps/product-site/src/app/(marketing)/forgot-password/page.jsx`
- `apps/product-site/src/app/(marketing)/reset-password/page.jsx`
- `apps/product-site/src/app/(marketing)/verify-email/page.jsx`

Skeleton implication:

- sign-in should remain form-pending first, because Firebase client auth is fast and route skeleton belongs to the destination `/account`
- signup should use provisioning-progress states rather than generic skeletons
- forgot/reset/verify should use stable message/card states, not full route skeletons unless trace data proves route navigation is slow

## Implementation Phases

## Phase 0: Streaming Boundary and Critical Path Audit

### Goal

Before building skeleton components, prove where the account route can actually stream and where current awaits block rendering.

### Files to inspect first

- `apps/product-site/src/app/(account)/layout.jsx`
- `apps/product-site/src/app/(account)/account/page.jsx`
- `apps/product-site/src/app/(account)/account/package/page.jsx`
- `apps/product-site/src/app/(account)/account/billing/page.jsx`
- `apps/product-site/src/app/(account)/account/upgrade/page.jsx`
- `apps/product-site/src/lib/server/commercial-account-context.js`
- `apps/product-site/src/components/patterns/account-shell/AccountShell.jsx`

### Required findings

Document or implement answers to:

- does `(account)/layout.jsx` block child `loading.jsx` while `requireCommercialAccountSession()` resolves?
- does each account page currently block the route title by awaiting account context before returning JSX?
- can `AccountShell` render with static title copy and placeholder identity before `accountContext` resolves?
- which panels need account context, billing model, checkout state, or Stripe-derived state?

### Required architecture decision

If the route title is blocked by top-level data awaits, refactor toward:

```jsx
export default function AccountOverviewPage() {
  return (
    <AccountRouteShell {...ACCOUNT_OVERVIEW_ROUTE_COPY}>
      <Suspense fallback={<AccountOverviewPanelsSkeleton />}>
        <AccountOverviewPanels />
      </Suspense>
    </AccountRouteShell>
  );
}
```

Where:

- `AccountRouteShell` is fast shell content
- `AccountOverviewPanels` performs `requireCommercialAccountContext()`
- the skeleton fallback maps only the panels below the route title
- server actions continue to perform their own authorization and fresh billing checks where needed

### Required implementation solution

The account routes should move from a page-level data-await pattern to a fast shell plus async panels pattern.

Avoid this pattern for account routes:

```jsx
export default async function AccountOverviewPage() {
  const accountContext = await requireCommercialAccountContext();

  return (
    <AccountShell accountContext={accountContext} {...accountRouteCopy.overview}>
      <AccountOverviewContent accountContext={accountContext} />
    </AccountShell>
  );
}
```

Because it blocks the route title and shell until account context resolves.

Use this pattern instead:

```jsx
export default function AccountOverviewPage() {
  return (
    <AccountRouteShell {...accountRouteCopy.overview}>
      <Suspense fallback={<AccountOverviewPanelsSkeleton />}>
        <AccountOverviewPanels />
      </Suspense>
    </AccountRouteShell>
  );
}

async function AccountOverviewPanels() {
  const accountContext = await requireCommercialAccountContext();

  return <AccountOverviewContent accountContext={accountContext} />;
}
```

This means:

- `AccountRouteShell` renders immediately from static route copy
- `AccountRouteShell` must not require `accountContext`
- `AccountRouteShell` must not fetch account, billing, package, Firebase, Firestore, or Stripe data
- `AccountOverviewPanels` owns the account-context fetch
- the `Suspense` fallback mirrors the final data-rich panels below the title
- route title, route description, and stable page spacing render before panel data resolves

### Required components

Create a fast account route shell:

- `apps/product-site/src/components/patterns/account-route-shell/AccountRouteShell.jsx`

Responsibilities:

- render `main.page-shell`
- render account topbar shell
- render product logo
- render static route eyebrow/title/description
- render children below the title section
- accept optional placeholder identity text such as `Loading account`

Non-responsibilities:

- no account context fetch
- no billing model creation
- no package model creation
- no Stripe calls
- no Firebase Admin calls
- no client-side interactivity unless later proven necessary

Create per-route async panel components, either colocated in route files or extracted once they become large:

- `AccountOverviewPanels`
- `AccountPackagePanels`
- `AccountBillingPanels`
- `AccountUpgradePanels`

Responsibilities:

- call `requireCommercialAccountContext()` or the route-appropriate cached context helper
- build account, billing, package, and checkout models
- render the real data-rich panels

Non-responsibilities:

- do not render the route title section
- do not duplicate account shell markup
- do not make server actions less authoritative

### Per-route split target

`/account`:

- page component renders `AccountRouteShell` with `accountRouteCopy.overview`
- async panel renders optional status banner, workspace focus panel, metric strip, side summary panel
- fallback renders `AccountOverviewPanelsSkeleton`

`/account/package`:

- page component renders `AccountRouteShell` with `accountRouteCopy.package`
- async panel renders current package `AccountActionPanel`, `PackageCatalog`, optional next-action card
- fallback renders `AccountPackagePanelsSkeleton`

`/account/billing`:

- page component renders `AccountRouteShell` with `accountRouteCopy.billing`
- async panel renders route notice, optional status banner, billing focus panel, side billing snapshot
- fallback renders `AccountBillingPanelsSkeleton`

`/account/upgrade`:

- page component renders `AccountRouteShell` with `accountRouteCopy.upgrade`
- async panel renders route notice, optional payment banner, selected package action panel, current position panel, package catalog
- fallback renders `AccountUpgradePanelsSkeleton`

### Authorization and correctness constraints

Fast shell rendering does not authorize sensitive account operations.

Rules:

- account data must only render inside async panels after `requireCommercialAccountContext()` succeeds
- server actions must continue to call `requireCommercialAccountContext()` themselves
- billing-changing server actions must continue to call `requireCommercialAccountContext({ refreshSubscription: true })`
- fast shell must not expose account email, owner name, package, billing status, or admin links before context resolves
- if session is missing, the async panel may redirect, but the shell must never expose protected data before that redirect
- if unauthorized shell flash is considered unacceptable after browser testing, move only the minimal session cookie check into a parent boundary while keeping account/billing/hub data below Suspense

### Acceptance Criteria

- route title copy is not blocked by `requireCommercialAccountContext()`
- parent layout does not accidentally prevent route loading UI from appearing
- slow account, billing, package, and checkout work is isolated to async panel components
- no business-critical server action logic is weakened by streaming changes
- route shell renders no protected account data before async context succeeds
- each account route follows the fast shell plus async panels pattern or documents why it safely cannot
- focused `git diff --check -- apps/product-site/src` passes

## Phase 1: Skeleton Design-System Foundation

### Goal

Create reusable skeleton primitives and styles that every product-site loading state can use.

### Files to inspect first

- `apps/product-site/src/app/styles/semantic.css`
- `apps/product-site/src/components/patterns/account-surfaces/AccountSurfaces.jsx`
- `apps/product-site/src/components/patterns/account-shell/AccountShell.jsx`
- `apps/product-site/src/components/patterns/account-header/AccountHeader.jsx`
- `apps/product-site/src/components/patterns/marketing-shell/MarketingShell.jsx`

### Proposed new component

Create:

- `apps/product-site/src/components/patterns/skeleton/Skeleton.jsx`

Suggested primitives:

```jsx
export function SkeletonBlock({ className = "", style = {}, ...props }) {}
export function SkeletonText({ lines = 1, className = "", ...props }) {}
export function SkeletonButtonRow({ count = 1, ...props }) {}
export function SkeletonStatusRow({ count = 2, ...props }) {}
export function SkeletonCard({ eyebrow = true, title = true, lines = 2, actions = 0, ...props }) {}
export function SkeletonMetricStrip({ count = 3, ...props }) {}
export function SkeletonSideList({ rows = 3, ...props }) {}
export function SkeletonPackageGrid({ count = 3, ...props }) {}
```

Do not create `SkeletonPageHeading` for account routes because route headings should render as real fast-shell copy, not skeleton placeholders.

### Proposed CSS

Add token-based styles to:

- `apps/product-site/src/app/styles/semantic.css`

Required classes:

- `.skeleton-block`
- `.skeleton-text`
- `.skeleton-text-line`
- `.skeleton-card`
- `.skeleton-chip`
- `.skeleton-button`
- `.skeleton-status-row`
- `.skeleton-action-row`

Style requirements:

- use existing neutral surface and border tokens
- use `@media (prefers-reduced-motion: reduce)` to disable shimmer animation
- do not introduce a purple-only or grey-only visual system
- make heights explicit enough to avoid layout shift
- keep border radius aligned with existing route cards
- ensure skeleton CSS does not require client-side JavaScript
- use stable dimensions with responsive constraints for cards, grids, chips, and button rows
- mark purely visual skeleton blocks as `aria-hidden="true"` and place `aria-busy="true"` on the containing panel where useful

### Acceptance Criteria

- skeleton primitives are reusable across all product-site routes
- no route-specific skeleton file contains large repeated placeholder markup
- skeleton styles use existing product-site tokens
- reduced-motion users do not get shimmer animation
- skeleton primitives are server components or plain CSS-backed components
- skeleton components do not import Firebase, Stripe, or data utilities
- focused `git diff --check -- apps/product-site/src` passes

## Phase 2: Shared Account Loading Shell

### Goal

Create a reusable account loading shell that mirrors the authenticated account area while rendering route title copy immediately.

### Proposed route metadata constants

Create route copy constants close to the account route implementation, for example:

- `apps/product-site/src/lib/navigation/account-route-copy.js`

Suggested shape:

```js
export const accountRouteCopy = {
  overview: {
    eyebrow: "Your account",
    title: "Account overview",
    description: "See your package, billing, and next steps as your community grows.",
  },
  package: {
    eyebrow: "Package",
    title: "Package",
    description: "See what is included in your current package and compare it with the next options as your community grows.",
  },
  billing: {
    eyebrow: "Billing",
    title: "Billing",
    description: "Manage your plan payments here. Member payments inside your community stay in your admin area.",
  },
  upgrade: {
    eyebrow: "Upgrade",
    title: "Upgrade or change package",
    description: "Review your options, then upgrade directly here or use billing for subscription management when needed.",
  },
};
```

Both final routes and loading states should use these constants so title copy cannot drift.

### Proposed new component

Create:

- `apps/product-site/src/components/patterns/account-loading/AccountLoadingShell.jsx`

Suggested API:

```jsx
export default function AccountLoadingShell({
  eyebrow,
  title,
  description,
  identityLabel = "Loading account",
  children,
}) {}
```

This component should render:

- account topbar with logo area
- account identity placeholder
- page heading area
- route-specific children

Implementation details:

- `eyebrow`, `title`, and `description` should be real route copy, not skeleton placeholders
- `identityLabel` can remain a placeholder because owner identity is account-data dependent
- topbar nav can be omitted or rendered as disabled/static placeholders in `loading.jsx`; do not render clickable account nav before account session validation has completed
- children should contain only route-specific data-panel skeletons
- shell component should not require `accountContext`
- shell component should not import account, billing, package, Firebase, or Stripe data helpers

### Replace Existing Route Loading

Update:

- `apps/product-site/src/app/(account)/account/loading.jsx`

So it uses:

- `AccountLoadingShell`
- skeleton primitives
- account overview skeleton composition

### Acceptance Criteria

- `/account` loading state visually matches the final account overview layout
- header area does not shift when real account content arrives
- heading area does not shift when real account content arrives
- route eyebrow, title, and description are visible immediately during navigation
- no account route uses a full-page skeleton that hides the route title
- main/sidebar columns reserve the same layout structure as final content

## Phase 3: Route-Level Account Skeletons

### Goal

Add route-accurate `loading.jsx` files for the account subroutes.

### Routes

Create:

- `apps/product-site/src/app/(account)/account/package/loading.jsx`
- `apps/product-site/src/app/(account)/account/billing/loading.jsx`
- `apps/product-site/src/app/(account)/account/upgrade/loading.jsx`

### `/account` Skeleton

Must show:

- account topbar shell
- real route heading copy
- primary workspace/status card
- status chips
- main action row
- side next-step card
- secondary details grid footprint if present in final page

### `/account/package` Skeleton

Must show:

- account topbar shell
- real package route heading copy
- current package summary card
- package comparison grid footprint
- next-action card

Specific requirements:

- package cards should reserve final card heights
- action button areas should reserve space
- package grid must respond like the final package catalog

### `/account/billing` Skeleton

Must show:

- account topbar shell
- real billing route heading copy
- billing overview card
- status chip row
- billing action/portal area
- scheduled change/cancellation area if the final layout reserves one
- side billing details panel

Specific requirements:

- Stripe-dependent panels must be represented as panel-level skeleton candidates
- payment action rows must not jump when real buttons arrive

### `/account/upgrade` Skeleton

Must show:

- account topbar shell
- real upgrade route heading copy
- route notice area footprint
- package option/comparison area
- selected package/action confirmation panel
- secondary billing/package navigation actions

Specific requirements:

- do not render skeletons that imply an upgrade is available before data confirms it
- use neutral placeholders for decision panels
- preserve final action panel dimensions

### Acceptance Criteria

- navigating between account routes never shows a blank page
- account route title sections appear before data-rich skeleton panels
- each account route loading state looks like the route being loaded
- no route loading file duplicates large amounts of layout code
- all route skeletons are responsive across mobile and desktop

## Phase 4: Panel-Level Suspense Boundaries

### Goal

Move expensive or less-critical sections behind `Suspense` so routes can render stable above-the-fold content quickly.

### Candidate panels

`/account`:

- billing summary panel
- package recommendation/next move panel
- checkout state dependent banner

`/account/billing`:

- Stripe billing status detail
- scheduled cancellation/change controls
- billing portal availability/action panel

`/account/package`:

- package comparison grid if it depends on account context
- pending package explanation panel

`/account/upgrade`:

- checkout state notice
- package change confirmation panel
- Stripe action decision panel

### Implementation Pattern

Preferred pattern:

```jsx
import { Suspense } from "react";

<Suspense fallback={<BillingPanelSkeleton />}>
  <BillingPanel />
</Suspense>
```

The async panel should fetch what it owns:

```jsx
async function BillingPanel() {
  const accountContext = await requireCommercialAccountContext();
  // build billing model and render panel
}
```

Guidelines:

- keep critical auth/session checks outside Suspense
- keep route heading and primary shell outside Suspense
- render route title copy from route constants before awaiting secondary panel data
- only defer panels that can safely load after first paint
- never defer business-critical validation for server actions
- use React request-level caching only where it avoids duplicate reads inside the same render
- do not split panels so aggressively that the same account context is fetched multiple times in parallel
- if multiple panels need the same account context, prefer one async route data component with sectional skeletons inside it, or a cached context helper

### Acceptance Criteria

- route shell and heading render before slower secondary panels
- visible skeletons map only the data-rich sections below the title
- panel fallbacks match final panel dimensions
- no duplicated Firestore or Stripe work is introduced by Suspense boundaries
- no user action appears enabled before required data is known
- Chrome Network traces do not show duplicate account RSC requests caused by panel splitting

## Phase 5: Signup and Auth Loading Strategy

### Goal

Improve perceived performance for signup, sign-in, forgot-password, reset-password, and verification without overusing route skeletons.

### `/sign-in`

Current strategy should remain mostly form-level:

- button pending state
- disabled submit button
- error message region

Add only if needed:

- account redirect transition messaging after successful sign-in
- avoid full-route skeleton on the sign-in form itself unless route navigation is slow

### `/signup`

Focus on provisioning-progress state, not generic skeletons:

- submitting state
- account creation progress text
- package checkout handoff progress
- clear failure recovery state

### `/forgot-password` and `/reset-password`

Use form-level pending states:

- no large route skeletons unless route navigation traces show delays
- keep response messages stable in height where possible

### `/verify-email`

Use card-level loading:

- verifying email state
- success/error state
- continue action state

### Acceptance Criteria

- auth forms do not jump when messages appear
- submit buttons have clear pending states
- sign-in transition to `/account` is covered by account route loading
- no auth route prefetch noise returns

## Phase 6: Measurement and Network Verification

### Goal

Verify skeleton work improves perceived performance without hiding new regressions.

### Local checks

Run when local Node environment supports it:

```bash
npm run lint --workspace apps/product-site
```

Current known local blocker:

```text
WSL 1 is not supported. Please upgrade to WSL 2 or above.
Could not determine Node.js install directory
```

Always run:

```bash
git diff --check -- apps/product-site/src
```

### Browser verification

Use Chrome DevTools Network and Performance screenshots for:

- `https://www.hubforj.com/`
- click `Sign in`
- submit sign-in form
- redirected `/account`
- navigate `/account/package`
- navigate `/account/billing`
- navigate `/account/upgrade`

### What to verify

Network:

- root page should not prefetch unrelated routes automatically
- sign-in should not prefetch forgot-password until intended
- account page should not prefetch package/billing/upgrade automatically
- `/api/auth/commercial/session` should remain materially faster than the previous `2.96s`
- `/account?_rsc` should not be multiplied by sibling route prefetches
- route-to-route account navigation should request only the destination route RSC payload
- route loading UI must appear before slower data-rich panels finish
- no new skeleton component should increase client JS chunks in a meaningful way

Visual:

- no blank page between route transitions
- no major layout shift when account content arrives
- skeletons match route layout
- mobile and desktop both look intentional
- reduced-motion behavior works

Performance budget targets:

- account route title shell appears quickly after navigation starts
- no automatic unrelated route prefetches return in the tested flow
- no avoidable Stripe calls occur during ordinary account page render
- Cumulative Layout Shift should remain negligible during skeleton-to-content replacement
- skeleton-to-content replacement should not move the route title, topbar, or primary page spacing

## Route Acceptance Checklist

### `/account`

- [ ] route-level skeleton uses shared account loading shell
- [ ] route title copy renders from shared route constants
- [ ] route title is not blocked by account context fetch
- [ ] primary workspace panel footprint matches final layout
- [ ] side panel footprint matches final layout
- [ ] status/action rows reserve final space
- [ ] no background prefetch of package/billing/upgrade
- [ ] no live Stripe refresh on ordinary render

### `/account/package`

- [ ] route-level skeleton exists
- [ ] route title copy renders from shared route constants
- [ ] route title is not blocked by account context fetch
- [ ] current package card skeleton exists
- [ ] package grid skeleton exists
- [ ] next-action panel skeleton exists
- [ ] package card heights are stable
- [ ] no automatic prefetch of upgrade route from visible CTAs

### `/account/billing`

- [ ] route-level skeleton exists
- [ ] route title copy renders from shared route constants
- [ ] route title is not blocked by account context fetch
- [ ] billing overview skeleton exists
- [ ] billing side panel skeleton exists
- [ ] Stripe-dependent panels have matching fallbacks where deferred
- [ ] payment action areas do not jump
- [ ] billing-changing actions still request fresh Stripe state

### `/account/upgrade`

- [ ] route-level skeleton exists
- [ ] route title copy renders from shared route constants
- [ ] route title is not blocked by account context fetch
- [ ] route notice skeleton exists
- [ ] package decision skeleton exists
- [ ] confirmation/action panel skeleton exists
- [ ] actions are not shown as available before data confirms availability
- [ ] billing-changing actions still request fresh Stripe state

### Auth and Signup Routes

- [ ] sign-in uses button-level pending state
- [ ] sign-in redirect lands into account route loading state
- [ ] signup uses provisioning-progress states
- [ ] forgot/reset/verify forms have stable message areas
- [ ] no unnecessary auth route prefetches

## Non-Goals

This implementation should not:

- change package pricing behavior
- change Stripe webhook behavior
- change Stripe billing action correctness
- change Firebase Auth semantics
- change hub provisioning behavior
- introduce a third-party skeleton/loading library
- add decorative loading effects that do not improve clarity

## Final Definition of Done

The skeleton loading strategy is complete only when:

1. Shared skeleton primitives exist and are used by route skeletons.
2. `/account`, `/account/package`, `/account/billing`, and `/account/upgrade` each have route-accurate loading states.
3. Expensive secondary panels have Suspense fallbacks where useful.
4. Auth/signup routes use stable form/provisioning pending states.
5. Chrome Network traces show no return of automatic unrelated route prefetch storms.
6. Visual inspection confirms no major layout jumps on desktop or mobile.
7. Focused product-site whitespace checks pass.
8. Product-site lint passes in an environment where Node is available.
