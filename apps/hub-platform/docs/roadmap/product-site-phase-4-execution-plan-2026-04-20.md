# Product Site Phase 4 Execution Plan

Status:
- Proposed
- Execution-ready delivery breakdown

Date:
- 2026-04-20

Purpose:
- Turn Phase 4 of the product-site/commercial-platform work into an implementation-ready plan
- Define the package-management surface that sits between initial provisioning and full Stripe lifecycle work
- Replace placeholder package-management UX with a coherent commercial account experience while keeping billing claims honest

Authority:
- [Product Site And Commercial Platform Implementation Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-and-commercial-platform-implementation-plan-2026-04-20.md)
- [Product Site Phase 1 Execution Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-phase-1-execution-plan-2026-04-20.md)
- [Product Site Phase 2 Execution Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-phase-2-execution-plan-2026-04-20.md)
- [Product Site Phase 3 Execution Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-phase-3-execution-plan-2026-04-20.md)
- [Roadmap Docs README](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/README.md)
- app-local standards in `docs/standards/*`

Related:
- [Admin Account Settings Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/admin-account-settings-plan-2026-03-31.md)
- [Product-Site Package Authority Contract](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-package-authority-contract-2026-03-31.md)

## 1) Phase 4 Goal

Phase 4 exists to create the real package-management surface on the product site and the live cross-app handoff from `hub-platform` into that commercial account area.

This phase does **not** yet implement Stripe checkout or webhooks.

It creates the truthful commercial account experience for:

- current package visibility
- upgrade intent
- downgrade intent design
- package-management destinations
- billing/account placeholders that are real routes rather than disabled buttons

## 2) Locked Delivery Position

These decisions should be treated as fixed for Phase 4.

### 2.1 Package management belongs to the product site

`hub-platform` should not own package or billing management flows.

It may show package state and usage pressure, but package changes belong to the commercial product site.

### 2.2 `hub-platform` must hand off, not simulate

The current placeholder buttons in admin account settings should be replaced with real destinations into the product site.

They should not become local operational forms inside `hub-platform`.

### 2.3 Phase 4 should be truthful before Stripe exists

The product site may present package management and billing destinations before live Stripe is attached, but it must not pretend that subscription automation already exists.

### 2.4 Package changes must still respect the canonical authority model

Any upgrade or downgrade intent captured in Phase 4 must remain compatible with the Phase 1 package-authority contract and the Phase 5 Stripe lifecycle model.

## 3) Phase 4 Scope

Phase 4 includes:

1. implement live `Manage package` and `Upgrade to Growth` destinations on the product site
2. implement the product-site package account surface
3. implement product-site billing/account placeholder routes that are honest and navigable
4. wire `hub-platform` account settings into the product-site handoff resolver
5. define upgrade and downgrade intent flows prior to Stripe
6. define return-path handling between `hub-platform` and product site
7. keep package messaging consistent across both apps

Phase 4 excludes:

- Stripe checkout
- subscription automation
- webhook-driven package updates
- automatic invoicing or billing history
- recovery tooling for failed Stripe events

## 4) Core Deliverables

At the end of Phase 4, the repo must provide:

### 4.1 A real package-management area on the product site

The product site must have a coherent account area for:

- current package
- upgrade path
- downgrade/change guidance
- billing destination

### 4.2 Live cross-app handoff from `hub-platform`

Admin account settings in `hub-platform` must be able to send a user into the correct product-site destination with the correct hub context and action intent.

### 4.3 Honest pre-Stripe commercial UX

The commercial site must make it clear what can happen now and what will become automated later once billing is live.

### 4.4 Stable route contracts for later Stripe work

The package and billing routes created in Phase 4 must become the stable destinations that Phase 5 layers payment lifecycle logic onto.

## 5) Recommended Flow Model

Phase 4 should lock the following commercial account flow.

### 5.1 From `hub-platform` into the commercial site

1. Hub admin opens account settings in `hub-platform`
2. Hub admin chooses `Manage package` or `Upgrade to Growth`
3. `hub-platform` resolves the product-site destination through the handoff resolver
4. Product site opens the correct package-management route with the intended hub context

### 5.2 Inside the product-site account area

The customer should be able to:

- view their current package
- understand feature differences between plans
- initiate an upgrade path
- understand downgrade consequences
- see where billing history or payment management will live later

### 5.3 Return-path rule

Cross-app flows should preserve a clear return path back into `hub-platform`, especially when the customer starts from operational account settings.

## 6) Recommended Code Touch Points

Phase 4 should primarily extend the product-site account surface and complete the `hub-platform` handoff seam.

### 6.1 Product-site account routes

Expected new or expanded areas inside `apps/product-site`:

- `/account`
- `/account/package`
- `/account/billing`
- `/account/upgrade`

Expected responsibilities:

- package visibility
- package comparison
- upgrade/downgrade intent capture
- billing/account guidance

### 6.2 Handoff resolution in `hub-platform`

Relevant current file:

- [account/page.jsx](/mnt/c/local/community-app/apps/hub-platform/src/app/(admin)/[hubSlug]/admin/settings/account/page.jsx)

Relevant Phase 1 seam:

- package-management handoff resolver module

Phase 4 should consume that resolver and replace disabled placeholder actions with live destinations.

### 6.3 Shared package vocabulary and route intent handling

Expected shared touch points:

- package tier labels and vocabulary
- package status labels where appropriate
- handoff intent helpers if they are extracted into shared, app-agnostic modules

## 7) Execution Tracks

Phase 4 should be delivered in five tracks.

### Track A: Product-site package account experience

Outcome:
- the commercial account area shows the customer’s current package and available next actions

Primary outputs:

- current package page
- package comparison view or section
- package action entry points

### Track B: Upgrade and downgrade intent design

Outcome:
- customers can express package-change intent before Stripe exists

Primary outputs:

- upgrade route behavior
- downgrade/change guidance
- package consequence messaging

### Track C: Billing/account placeholder completion

Outcome:
- the billing area is a real commercial destination even before automated billing is attached

Primary outputs:

- billing route
- honest placeholder or preparatory billing UX
- clear expectations about upcoming payment automation

### Track D: Cross-app handoff completion

Outcome:
- `hub-platform` can send admins to the correct product-site destination

Primary outputs:

- live manage-package link
- live upgrade link
- return-path support

### Track E: Verification and documentation

Outcome:
- package management is now a production-ready destination layer for Phase 5

Primary outputs:

- route and handoff coverage
- doc updates

## 8) Execution-Ready Backlog

This backlog is ordered so destination clarity lands before payment automation.

### Slice 1: Implement current package surface

Implementation tasks:

1. Build `/account/package`
2. Show current package tier, status, and key capability summary
3. Show package comparison or upgrade context without requiring Stripe
4. Keep copy aligned to the actual package model already enforced by `hub-platform`

Review checklist:

- package messaging matches current entitlement logic
- the page is useful even before billing automation exists

### Slice 2: Implement upgrade and change routes

Implementation tasks:

1. Build `/account/upgrade`
2. Define upgrade selection flow
3. Define downgrade/change guidance and consequences
4. Keep all flows honest about what Phase 4 can and cannot finalize yet

Review checklist:

- upgrade intent is clear
- downgrade messaging is explicit about operational consequences
- no fake checkout is implied

### Slice 3: Implement billing destination

Implementation tasks:

1. Build `/account/billing`
2. Present billing as the destination for payment-management capabilities
3. Use truthful placeholder states if automation is not yet live
4. Keep the route stable so Phase 5 can attach Stripe without redesigning the route model

Review checklist:

- the billing page is a real destination, not a dead end
- the UX stays honest about the current implementation stage

### Slice 4: Complete `hub-platform` handoff wiring

Implementation tasks:

1. Replace disabled `Manage package` and `Upgrade to Growth` actions in [account/page.jsx](/mnt/c/local/community-app/apps/hub-platform/src/app/(admin)/[hubSlug]/admin/settings/account/page.jsx)
2. Use the handoff resolver from Phase 1
3. Pass hub context and action intent
4. Include return-path support where useful

Review checklist:

- `hub-platform` no longer pretends package management is unavailable
- the operational app links out cleanly to the commercial surface

### Slice 5: Add coverage and docs

Implementation tasks:

1. Add route and handoff tests
2. Add source/UX tests for account settings handoff behavior
3. Update roadmap docs once route contracts are final
4. Document the live commercial destinations now replacing placeholders

Review checklist:

- cross-app navigation is covered
- package-management copy is consistent across both apps

## 9) File-By-File Touch Point Map

### Product-site additions

- `apps/product-site/src/app/(account)/*`
- `apps/product-site/src/components/*` for package-management views
- `apps/product-site/src/lib/*` for route intent and handoff resolution helpers local to the product site

### `hub-platform` touch points

- [account/page.jsx](/mnt/c/local/community-app/apps/hub-platform/src/app/(admin)/[hubSlug]/admin/settings/account/page.jsx)
- any Phase 1 handoff resolver module created for package-management destinations

### Docs likely to update

- [product-site-and-commercial-platform-implementation-plan-2026-04-20.md](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-and-commercial-platform-implementation-plan-2026-04-20.md)
- [product-site-phase-1-execution-plan-2026-04-20.md](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-phase-1-execution-plan-2026-04-20.md)
- [product-site-phase-2-execution-plan-2026-04-20.md](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-phase-2-execution-plan-2026-04-20.md)
- [product-site-phase-3-execution-plan-2026-04-20.md](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-phase-3-execution-plan-2026-04-20.md)

## 10) PR Sequencing Recommendation

### PR 1: Product-site package account routes

Scope:

- `/account/package`
- `/account/upgrade`
- `/account/billing`

Success condition:

- the commercial account surface is real and navigable

### PR 2: Cross-app handoff from `hub-platform`

Scope:

- account settings link wiring
- handoff intent handling
- return-path behavior

Success condition:

- admins can move from operational account settings to product-site package management cleanly

### PR 3: Documentation and closeout

Scope:

- roadmap updates
- handoff behavior notes
- placeholder retirement notes

Success condition:

- the repo clearly documents that package management now lives on the product site

## 11) Engineering Standards For This Phase

### 11.1 Keep package management commercial

Do not move plan-change forms into `hub-platform`.

### 11.2 Keep the product-site account area honest

Before Stripe exists, package/account routes should guide and prepare, not simulate completed billing behavior.

### 11.3 Preserve the canonical package model

Do not let commercial copy drift away from the capability and entitlement logic already implemented in `hub-platform`.

### 11.4 Keep handoff generation centralized

`hub-platform` route files should consume one resolver for product-site destinations.

### 11.5 Keep route contracts stable for Phase 5

The goal is to create durable package and billing destinations that Stripe can attach to later without structural churn.

## 12) Test Plan

Minimum required checks:

### Route checks

- `/account/package` renders correctly
- `/account/upgrade` renders correctly
- `/account/billing` renders correctly

### Handoff checks

- `hub-platform` account settings uses live product-site destinations
- hub context and action intent are preserved
- return-path behavior is deterministic

### UX/source checks

- no disabled placeholder package-management actions remain where live routes now exist
- package messaging remains consistent across product site and `hub-platform`
- billing pages remain honest about pre-Stripe status

## 13) Risk Register And Controls

### Risk: Phase 4 drifts into pseudo-billing logic

Control:

- keep payment automation out of scope
- reserve actual billing state transitions for Phase 5

### Risk: `hub-platform` keeps stale placeholder language

Control:

- replace disabled buttons with live handoff routes
- align copy in account settings to the new commercial surface

### Risk: package-change routes become unstable before Stripe

Control:

- keep route contracts simple and durable
- attach automation later rather than rebuilding routes twice

### Risk: downgrade implications are under-communicated

Control:

- make downgrade/change guidance explicit
- keep operational consequences visible in commercial copy

## 14) Definition Of Done

Phase 4 is done when:

1. the product site has real package, upgrade, and billing account routes
2. `hub-platform` account settings links to those routes cleanly
3. placeholder package-management buttons are retired
4. route contracts are stable enough for later Stripe integration
5. package messaging is consistent across both apps
6. lint and route/handoff checks are clean

## 15) Recommended Immediate Coding Slice

When coding begins for Phase 4, the first implementation slice should be:

1. build `/account/package`
2. build `/account/upgrade`
3. wire live `Manage package` and `Upgrade to Growth` links from `hub-platform`
4. add the billing destination as a truthful placeholder route
5. add handoff tests

This is the highest-leverage first slice because it turns package management from a roadmap promise into a real cross-app customer path without prematurely entangling Stripe.

## 16) Final Recommendation

Phase 4 should be treated as the commercial account-surface milestone.

If implemented well, it will ensure that:

- provisioning leads into a coherent commercial account area
- `hub-platform` no longer owns fake package-management UI
- Stripe later plugs into stable routes rather than redesigning the whole package-management surface
