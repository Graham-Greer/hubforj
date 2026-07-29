# Product Site And Commercial Platform Implementation Plan

Status:
- Proposed
- Canonical next-step implementation plan
- Historical sequencing baseline only as of 2026-05-01 for product-site current-state claims

Date:
- 2026-04-20

Purpose:
- Record the repo-audited current state after the latest `hub-platform` delivery work
- Define the production-grade implementation sequence for the product site, package authority integration, and Stripe
- Replace outdated “next steps” guidance that no longer reflects the current repo

Authority:
- [Roadmap Docs README](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/README.md)
- [SaaS Package Authority And Enforcement Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/saas-package-authority-and-enforcement-plan-2026-03-29.md)
- [SaaS Package Tier And Entitlement Model](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/saas-package-tier-and-entitlement-model-2026-03-29.md)
- [Product-Site Package Authority Contract](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-package-authority-contract-2026-03-31.md)
- [Stripe Two-Domain Architecture Note](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/stripe-two-domain-architecture-note-2026-04-20.md)
- app-local standards in `docs/standards/*`

Related:
- [Product Site Current-State Audit And Next Steps (2026-05-01)](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-current-state-audit-and-next-steps-2026-05-01.md)
- [Current Delivery Status And Next Steps (2026-03-09)](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/current-delivery-status-and-next-steps-2026-03-09.md)
- [Monetisation Tier Implementation Sequence](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/monetisation-tier-implementation-sequence-2026-04-08.md)
- [Admin Account Settings Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/admin-account-settings-plan-2026-03-31.md)
- [Product Site Phase 1 Execution Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-phase-1-execution-plan-2026-04-20.md)
- [Product Site Phase 2 Execution Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-phase-2-execution-plan-2026-04-20.md)
- [Product Site Phase 3 Execution Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-phase-3-execution-plan-2026-04-20.md)
- [Product Site Phase 4 Execution Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-phase-4-execution-plan-2026-04-20.md)
- [Product Site Phase 5 Execution Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-phase-5-execution-plan-2026-04-20.md)
- [Product Site Phase 6 Execution Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-phase-6-execution-plan-2026-04-20.md)

## 1) Executive Summary

Current-state note:

This document remains useful for sequencing and delivery intent, but parts of its April 2026 product-site status description are now outdated.

In particular, `apps/product-site` now already has:

- real signup and provisioning
- commercial account auth/session handling
- account/package/billing/upgrade routes
- Stripe checkout and billing-portal flows
- Stripe webhook handling
- package-authority sync back into `hub-platform`
- owner-admin activation handoff into `hub-platform`

Use the linked 2026-05-01 audit for current-state truth whenever this document still describes those capabilities as missing.

The repo is now ahead of several older roadmap status documents.

In particular, `hub-platform` already has:

- explicit hub package authority fields on hub records
- package-tier normalization and labeling
- a canonical entitlement resolver
- package-aware provisioning
- package-aware admin account settings
- package-aware public/admin/member UX adaptation
- package-domain unit coverage

What the repo still does not have is:

- production-closed verification of the product-site billing lifecycle
- final hardening/runbooks for cross-app onboarding and package-authority sync
- complete rollout confidence for live Stripe and package-management operations across environments

This means the next product-level initiative is no longer “invent the package model.”

The next initiative is:

1. harden the already-implemented commercial and package-authority flows
2. verify the product site as the live commercial front door across real environments
3. close the remaining support, recovery, and rollout gaps around Stripe-backed lifecycle operations

This sequence is the most defensible production path because it preserves a clean ownership split:

- `hub-platform` owns operational consumption and enforcement
- the product site owns marketing, signup, package sales, billing, and Stripe-backed lifecycle

## 2) Repo-Audited Current State

This section intentionally references real code rather than planning assumptions.

### 2.1 Package authority is already implemented in `hub-platform`

Authoritative package modeling already exists in:

- [package-tiers.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/package-tiers.js)
- [package-entitlements.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/package-entitlements.js)
- [hub-package.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/hub-package.js)
- [site-settings-capabilities.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/site-settings-capabilities.js)

What is already true in code:

- hubs can carry `packageTier`, `packageStatus`, `packageSource`, `packageAssignedAt`, `packageUpdatedAt`, and `packageOverrides`
- entitlements resolve `paymentProcessingMode`
- entitlements expose capabilities for:
  - courses
  - paid memberships
  - paid events
  - paid courses
  - native/internal payments
  - reporting
  - branding removal
  - custom-domain eligibility
- legacy feature flags are now a compatibility layer, not the primary model

### 2.2 Package-aware provisioning already exists

Relevant files:

- [hubs.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/hubs.js)
- [hub-mutations.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/data/hub-mutations.js)
- [CreateHubForm.jsx](/mnt/c/local/community-app/apps/hub-platform/src/app/(platform)/platform/hubs/create/CreateHubForm.jsx)
- [create/actions.js](/mnt/c/local/community-app/apps/hub-platform/src/app/(platform)/platform/hubs/create/actions.js)

What is already true:

- package tier is explicit during provisioning
- custom-domain allowance is enforced during provisioning
- created hub records store package authority fields and derived legacy compatibility flags

### 2.3 Package visibility already exists in admin

Relevant files:

- [account/page.jsx](/mnt/c/local/community-app/apps/hub-platform/src/app/(admin)/[hubSlug]/admin/settings/account/page.jsx)
- [data/hubs.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/data/hubs.js)
- [platform hub detail page](/mnt/c/local/community-app/apps/hub-platform/src/app/(platform)/platform/hubs/[hubId]/page.jsx)

What is already true:

- admins can see current package
- admins can see package status
- admins can see usage against package limits
- admins can manage custom domains operationally inside `hub-platform`
- package-management actions exist as placeholders

### 2.4 Product-site ownership is not yet implemented

What is now true:

- a dedicated `apps/product-site` app boundary now exists

What is still missing:

- no live package-management destination exists outside `hub-platform` yet
- no first-class external package update flow exists yet
- no Stripe integration exists yet

This commercial-platform plan addresses the product-site SaaS billing domain first.

It does not yet cover the separate Growth native-payments domain inside `hub-platform` where communities would take payments from their own members.

Exploratory code exists in:

- [apps/client-site-starter/README.md](/mnt/c/local/community-app/apps/client-site-starter/README.md)

But that app is still exploratory and explicitly not the authoritative commercial surface.

## 3) Locked Delivery Position

The following should now be treated as locked for implementation sequencing.

### 3.1 Do not implement Stripe inside `hub-platform` first

Reasons:

- it violates the package-ownership boundary already locked in the roadmap
- it would make `hub-platform` the commercial source of truth by accident
- it would create migration debt once the product site exists

### 3.2 Do not build a “marketing-only” product site disconnected from provisioning

Reasons:

- it creates a polished shell without a reliable package-authority write path
- it delays the hardest integration decisions until after front-end work is committed
- it increases the chance of duplicated or conflicting onboarding logic

### 3.3 Build the product site on top of a strong upstream contract

That contract should support:

- hub provisioning with explicit package authority
- package updates after commercial changes
- handoff routes for package management
- later Stripe-backed lifecycle events

## 4) Production Goals

The implementation must deliver these outcomes.

### 4.1 Commercial-system clarity

Users must be able to understand:

- where they choose a plan
- where they sign up
- where they manage billing
- where they operate the hub after purchase

### 4.2 Operational-system clarity

Hub admins inside `hub-platform` must be able to:

- see their package and usage state
- understand upgrade pressure
- move to the product site for package changes
- continue to manage operational custom-domain setup inside `hub-platform`

### 4.3 Durable authority model

The system must have one reliable commercial input:

- package authority written by the product site

And one reliable operational consumer:

- `hub-platform`

### 4.4 Production-grade payment architecture

Stripe must be introduced only when:

- package authority is stable
- provisioning and package update contracts are explicit
- product-site account and billing routes exist

## 5) Non-Goals

This implementation should not attempt to deliver:

- a full bespoke marketing CMS
- a billing portal inside `hub-platform`
- one-off package logic scattered across UI routes
- Stripe-led entitlement design
- custom-domain setup UX on the product site

## 6) Recommended Workstreams

The work should be delivered in five workstreams.

## 6.1 Workstream A: Upstream Contract Hardening In `hub-platform`

Goal:
- make `hub-platform` a clean consumer of externally written package authority

### Required deliverables

1. Formalize the hub provisioning contract
2. Formalize the package authority update contract
3. Centralize contract validation
4. Expose stable programmatic entry points for upstream callers
5. Replace disabled package-management placeholders with configurable handoff targets

### Touch points

Domain and normalization:

- [hubs.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/hubs.js)
- [hub-package.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/hub-package.js)
- [package-entitlements.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/package-entitlements.js)
- [package-tiers.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/package-tiers.js)

Data mutations:

- [hub-mutations.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/data/hub-mutations.js)

Current admin handoff surface:

- [account/page.jsx](/mnt/c/local/community-app/apps/hub-platform/src/app/(admin)/[hubSlug]/admin/settings/account/page.jsx)

### Recommended implementation details

Add or formalize:

- `normalizeCreateHubPayload` as the canonical provisioning payload validator
- a dedicated package-authority update normalizer, for example:
  - `normalizeUpdateHubPackageAuthorityPayload`
- a dedicated mutation, for example:
  - `updateHubPackageAuthorityById`
- explicit server-side contract modules rather than embedding update semantics ad hoc in UI actions

### Acceptance criteria

- a product site can provision a hub without depending on platform-operator-only UI code
- a product site can update package authority without mutating unrelated hub fields
- `hub-platform` package reads stay backward-compatible where required
- package-management buttons can point to real product-site destinations through one integration layer

## 6.2 Workstream B: Product Site Foundation

Goal:
- create the commercial front door for acquisition, signup, and package management

### Recommended new app boundary

Create a dedicated app, for example:

- `apps/product-site`

This app should not be folded into `client-site-starter`.

`client-site-starter` remains historical/exploratory work and should not become the commercial product boundary by drift.

### Required route groups

Recommended V1 route model:

- `/`
  - marketing homepage
- `/pricing`
  - package ladder and comparison
- `/signup`
  - account and initial hub creation
- `/account/package`
  - current package
- `/account/billing`
  - billing overview
- `/account/upgrade`
  - upgrade/downgrade flow entry

### Required product-site capabilities

1. Marketing homepage
2. Pricing page
3. Signup/account creation shell
4. Package selection
5. Hub provisioning flow using the shared contract
6. Authenticated business-account shell
7. Placeholder package-management pages if Stripe is not yet attached

### Architectural standards

- server-first route design
- shared token/theming discipline
- thin route files
- explicit boundary between product marketing, authenticated business account, and `hub-platform` handoff
- no freeform CMS dependency for launch

### Acceptance criteria

- a new customer can understand packages clearly
- a new customer can start signup and choose a package
- the product site can provision a hub record with authoritative package input
- the resulting hub can later be activated correctly in `hub-platform` through the dedicated onboarding/admin-handoff work

## 6.3 Workstream C: Shared Auth And Ownership Model

Goal:
- define the authenticated relationship between the commercial account and the hub

### Required decisions

1. What is the business-account identity model?
2. How does a business account own one or more hubs?
3. How does product-site auth relate to hub admin auth?
4. How do package-management handoffs identify the target hub?
5. How is owner email verification enforced before high-trust actions?
6. How is the first operational admin provisioned and activated?

### Recommended implementation rule

Do not try to unify every session model immediately.

Use a clean handoff contract first:

- product site owns business-account authentication
- `hub-platform` owns hub-admin/member authentication
- handoff links carry `hubId` and action intent
- each app resolves the rest from its own session model

### Acceptance criteria

- a business account can manage package state for the intended hub
- `hub-platform` can initiate handoff without becoming the billing authority
- no route depends on implicit session cross-over assumptions
- onboarding trust rules are explicit enough to prevent “commercial signup complete” being confused with “admin portal ready”

## 6.4 Workstream D: Stripe Integration In The Product Site

Goal:
- make the product site the authoritative billing and subscription system

### Required Stripe scope

1. customer creation
2. package checkout
3. subscription creation
4. upgrade/downgrade lifecycle handling
5. package cancellation and recovery state
6. webhook-driven package authority updates into the shared hub record

### Recommended Stripe rule

Stripe must write package authority outcomes, not define entitlement logic itself.

The entitlement model stays in code under `hub-platform` and shared domain logic.

Stripe simply becomes the commercial event source that changes:

- `packageTier`
- `packageStatus`
- `packageUpdatedAt`
- optional override state when explicitly approved

### Acceptance criteria

- successful checkout provisions or updates package authority
- webhook failures are observable and recoverable
- `hub-platform` reflects package changes without manual intervention
- Stripe lifecycle events do not bypass domain validation

## 6.5 Workstream E: Package-Management Handoff Completion

Goal:
- replace placeholders with live production-grade cross-app flows

### Required deliverables

1. real `Manage package` destination
2. real `Upgrade to Growth` destination
3. explicit return-path strategy
4. visible lifecycle messaging when commercial changes are pending

### Touch points

- [account/page.jsx](/mnt/c/local/community-app/apps/hub-platform/src/app/(admin)/[hubSlug]/admin/settings/account/page.jsx)
- any future package-management link helpers in `hub-platform`

### Acceptance criteria

- hub admins can move from operational account settings to the commercial package system cleanly
- custom-domain operations remain in `hub-platform`
- package/billing changes remain on the product site

## 7) Detailed Implementation Sequence

This is the recommended order.

### Phase 1: Contract-first hardening in `hub-platform`

Deliver:

- formal provisioning contract
- formal package update contract
- package-management handoff config
- tests for both creation and update contract paths

Do not start:

- product-site UI implementation before the contract is explicit
- Stripe work

### Phase 2: Product-site shell and pricing architecture

Deliver:

- new app shell
- pricing page
- signup shell
- business account shell
- route structure and auth boundary

### Phase 3: Package-aware hub provisioning from product site

Deliver:

- package selection
- hub creation
- write-through to shared hub authority
- successful redirect/entry into `hub-platform`

### Phase 4: Package-management surface

Deliver:

- current package view
- upgrade path
- downgrade path design
- account/billing destinations

Stripe may still be absent at this point if placeholders are clearly honest.

### Phase 5: Stripe billing lifecycle

Deliver:

- checkout
- subscription lifecycle
- webhook handling
- package state updates
- handoff completion from `hub-platform`

### Phase 6: Release hardening

Deliver:

- regression coverage
- recovery tooling for failed package updates
- support/operator playbooks
- downgrade/domain consequence verification

## 8) Testing And Quality Gates

The implementation must include:

### Contract tests

- provisioning payload normalization
- package update payload normalization
- invalid tier/status combinations
- custom-domain entitlement restrictions

### Integration tests

- product-site provisioning creates a valid hub
- Stripe lifecycle event updates hub package authority
- `hub-platform` reflects new package state correctly

### UX tests

- disabled placeholders are removed once live destinations exist
- package-management handoff routes are correct
- package messaging stays consistent across product site and `hub-platform`

### Operational tests

- downgrade off Growth preserves the subdomain fallback path
- custom-domain disconnect consequences remain correct
- stale package state is detectable and recoverable

## 9) Documentation Changes Required During Delivery

This plan should drive accompanying documentation changes.

### Update during implementation

- product-site route map
- provisioning contract shape
- package update contract shape
- handoff route contract
- Stripe webhook event handling notes

### Retire or mark historical where appropriate

- older status docs that still imply package authority is mostly future work
- any note that positions `client-site-starter` as the preferred commercial path

## 10) Recommended Immediate Next Slice

The immediate next slice should be:

1. formalize external provisioning and package update contracts in `hub-platform`
2. define the new product-site app boundary and route map
3. implement the product-site shell and pricing/package pages

Only after that should Stripe work begin.

Execution-ready breakdown:

- [Product Site Phase 1 Execution Plan (2026-04-20)](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-phase-1-execution-plan-2026-04-20.md)

## 11) Final Recommendation

The repo is now mature enough that the correct next step is no longer another large `hub-platform` UX-only sweep.

The correct next step is to establish the commercial layer properly.

The production-grade sequence is:

1. contract-first `hub-platform` hardening
2. product-site foundation
3. Stripe on the product site
4. cross-app package-management completion

This preserves a clean SaaS ownership boundary, minimizes rework, and gives the product the strongest path to a high-quality commercial launch.
