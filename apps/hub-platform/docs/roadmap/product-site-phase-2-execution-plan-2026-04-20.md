# Product Site Phase 2 Execution Plan

Status:
- Proposed
- Execution-ready delivery breakdown

Date:
- 2026-04-20

Purpose:
- Turn Phase 2 of the product-site/commercial-platform work into an implementation-ready plan
- Define the standalone product-site app boundary, route model, frontend architecture, shared-contract strategy, and delivery sequencing
- Ensure the commercial site is built on a clean app boundary rather than drifting into `hub-platform` frontend reuse

Authority:
- [Product Site And Commercial Platform Implementation Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-and-commercial-platform-implementation-plan-2026-04-20.md)
- [Product Site Phase 1 Execution Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-phase-1-execution-plan-2026-04-20.md)
- [Roadmap Docs README](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/README.md)
- app-local standards in `docs/standards/*`

Related:
- [Product-Site Package Authority Contract](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-package-authority-contract-2026-03-31.md)
- [SaaS Package Tier And Entitlement Model](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/saas-package-tier-and-entitlement-model-2026-03-29.md)
- [apps/client-site-starter/README.md](/mnt/c/local/community-app/apps/client-site-starter/README.md)

## 1) Phase 2 Goal

Phase 2 exists to create the standalone product-site application boundary and the commercial frontend foundation that will later drive signup, provisioning, package management, and billing.

This phase does **not** yet implement live provisioning into `hub-platform`.

This phase also does **not** implement Stripe.

It creates the standalone product-site app, route structure, UI architecture, and account-shell foundation that later phases will build on.

## 2) Locked Architectural Position

These decisions should be treated as fixed for Phase 2.

### 2.1 The product site lives in its own app

The commercial site should be built as a new app boundary:

- `apps/product-site`

It should not be built by continuing work inside `apps/client-site-starter`.

### 2.2 The product site must not import frontend implementation from `hub-platform`

`apps/product-site` must not import:

- route components from `apps/hub-platform/src/app/*`
- UI components from `apps/hub-platform/src/components/*`
- CSS modules from `apps/hub-platform`
- app-specific hooks from `apps/hub-platform`
- route actions from `apps/hub-platform`

Reason:

- the product site and `hub-platform` serve different jobs
- their UX and release cadence will diverge
- frontend reuse at the app-folder level creates long-term coupling and makes both apps harder to evolve

### 2.3 Only neutral shared contracts may be reused

Shared code is acceptable only when it is genuinely app-agnostic.

Good candidates:

- package tier/status/source vocabulary
- provisioning/update contract helpers after Phase 1 lands
- neutral formatting or validation helpers
- future shared config or token packages if deliberately extracted

Bad candidates:

- admin UI patterns
- page sections from `hub-platform`
- account settings components
- route-level data loaders
- app-specific CSS modules

### 2.4 `client-site-starter` is historical and exploratory

It may inform architectural thinking, but it is not the authoritative commercial app boundary and should not become the production product site by drift.

## 3) Phase 2 Scope

Phase 2 includes:

1. create the standalone `apps/product-site` app boundary
2. define and implement the product-site route model
3. establish the public marketing shell
4. establish the authenticated business-account shell
5. establish the package/purchase information architecture
6. define cross-app dependency rules
7. create honest placeholder account/package destinations for later commercial flows
8. document the app boundary and shared-code rules clearly

Phase 2 excludes:

- live hub provisioning writes
- Stripe checkout
- webhook handling
- live billing orchestration
- cross-app auth unification
- copying `hub-platform` frontend into the product site

## 4) Core Deliverables

At the end of Phase 2, the repo must provide:

### 4.1 A new standalone app boundary

There must be a dedicated:

- `apps/product-site`

with its own app shell, routes, styling entry points, and local components.

### 4.2 A commercial route foundation

The product site must have a clear V1 route model for:

- homepage
- pricing
- signup
- authenticated account shell
- package/billing placeholders

### 4.3 A locked dependency rule

The repo must make it clear that:

- `apps/product-site` depends on shared packages only
- `apps/product-site` does not import frontend code from `apps/hub-platform`

### 4.4 A product-site UI system foundation

The product site must have:

- its own layout system
- its own sections and shells
- its own route components
- its own local styling entry points

This does not require a fully shared monorepo design system package yet.

### 4.5 Honest package/account placeholders

The product site must be able to present:

- package information
- account shell destinations
- future billing surface placeholders

without pretending that Stripe or live package mutations already exist.

## 5) Recommended Route Model

Phase 2 should establish these route groups.

### 5.1 Public marketing routes

- `/`
- `/pricing`
- `/signup`

Optional follow-on public routes if needed, but not required in Phase 2:

- `/features`
- `/about`
- `/legal/*`

### 5.2 Authenticated business-account routes

- `/account`
- `/account/package`
- `/account/billing`
- `/account/upgrade`

These may initially be placeholder or shell-level routes, but the route contract should be real.

### 5.3 Route behavior rule

Public marketing routes and authenticated account routes should live in clearly separated route groups so commercial acquisition and post-signup account management do not collapse into one mixed shell.

## 6) Recommended App Structure

Phase 2 should prefer a server-first Next.js app structure similar in discipline to `hub-platform`, but independent from it.

Recommended high-level structure:

```text
apps/product-site/
  src/
    app/
      (marketing)/
      (account)/
      api/
      styles/
    components/
      primitives/
      ui/
      patterns/
      sections/
    lib/
      domain/
      data/
      config/
      auth/
```

Key rule:

- this structure may mirror the discipline of `hub-platform`
- it must not import `hub-platform` app components directly

## 7) Shared-Code Strategy

Phase 2 should deliberately avoid over-extracting shared packages too early, but it should still establish the correct rule set.

### 7.1 What should remain local to `apps/product-site`

- marketing sections
- pricing tables
- product-site navigation
- product-site account shell
- product-site forms and route components
- product-site-specific styling

### 7.2 What may later be extracted into shared packages

- package contract helpers from Phase 1 if both apps need them
- package vocabulary constants
- neutral URL/config helpers
- possibly shared token/config primitives once duplication is real and stable

### 7.3 What should not be extracted in Phase 2

- generic “shared UI package” built prematurely
- admin-oriented component abstractions
- copied `hub-platform` patterns moved into shared code just to accelerate product-site development

The correct bias for Phase 2 is:

- keep frontend local
- share only true contracts

## 8) Execution Tracks

Phase 2 should be delivered in five tracks.

### Track A: App boundary creation

Outcome:
- `apps/product-site` exists as a clean commercial app

Primary outputs:

- app scaffold
- route groups
- global styles entry point
- local component directories

### Track B: Marketing shell and route architecture

Outcome:
- acquisition-facing routes exist with a coherent page structure

Primary outputs:

- homepage shell
- pricing shell
- signup shell
- shared marketing layout

### Track C: Business-account shell

Outcome:
- authenticated commercial account routes have a coherent home before Stripe is added

Primary outputs:

- account shell
- package page
- billing page
- upgrade entry page

### Track D: Shared contract integration seam

Outcome:
- Phase 2 is prepared to consume the Phase 1 contract without importing `hub-platform` UI code

Primary outputs:

- explicit dependency notes
- clean contract call-site placeholders
- no accidental route-code coupling

### Track E: Documentation and developer guidance

Outcome:
- engineers know exactly where product-site code belongs and what may or may not be shared

Primary outputs:

- roadmap updates
- app-boundary notes
- implementation references

## 9) Execution-Ready Backlog

This backlog is ordered so we establish architecture before page polish.

### Slice 1: Create the standalone app boundary

Implementation tasks:

1. Create `apps/product-site`
2. Establish the `src/app`, `src/components`, and `src/lib` structure
3. Add the product-site global styles and semantic entry points
4. Add a minimal root layout and route-group structure
5. Document the boundary rule in the app README or docs

Review checklist:

- no imports from `apps/hub-platform/src/components/*`
- no imports from `apps/hub-platform/src/app/*`
- the app boots independently as its own frontend surface

### Slice 2: Implement the marketing shell

Implementation tasks:

1. Add the top-level marketing layout
2. Add the homepage route
3. Add the pricing route
4. Add a shared marketing header/footer
5. Keep content honest and product-led rather than over-designed placeholder copy

Review checklist:

- the shell is acquisition-focused
- navigation is simple and conversion-aware
- no fake billing or provisioning claims appear yet

### Slice 3: Implement the signup shell

Implementation tasks:

1. Add `/signup`
2. Define package-selection presentation
3. Define account-creation flow structure without yet wiring live provisioning
4. Keep the Phase 1 provisioning contract as the future integration seam

Review checklist:

- signup structure maps cleanly onto the future provisioning contract
- no route logic hardcodes assumptions that belong in Phase 3

### Slice 4: Implement the business-account shell

Implementation tasks:

1. Add `/account`
2. Add `/account/package`
3. Add `/account/billing`
4. Add `/account/upgrade`
5. Establish navigation and empty/placeholder states for not-yet-live billing flows

Review checklist:

- route structure is real even if backend functionality is partial
- future Stripe integration has clear destinations
- account routes do not pretend to be operational `hub-platform` routes

### Slice 5: Add product-site local UI foundations

Implementation tasks:

1. Create local primitives, UI, patterns, and sections as needed
2. Follow the same token-first discipline used elsewhere in the repo
3. Avoid premature over-abstraction
4. Keep product-site patterns commercial and marketing-oriented

Review checklist:

- the product-site frontend can evolve independently
- local components are named clearly and scoped to the app
- no admin language leaks into commercial UI

### Slice 6: Document the shared-code rules

Implementation tasks:

1. Record what may be shared and what may not
2. Link the product-site app boundary back to the roadmap docs
3. Mark `client-site-starter` as exploratory rather than current implementation authority

Review checklist:

- future contributors cannot reasonably mistake `client-site-starter` for the production commercial surface
- cross-app import rules are explicit

## 10) File-By-File Touch Point Map

Phase 2 should primarily create new files rather than spreading product-site concerns across `hub-platform`.

### New app boundary

- new `apps/product-site/*`

Expected major areas:

- `apps/product-site/src/app/*`
- `apps/product-site/src/components/*`
- `apps/product-site/src/lib/*`
- `apps/product-site/README.md`

### Existing docs likely to update

- [product-site-and-commercial-platform-implementation-plan-2026-04-20.md](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-and-commercial-platform-implementation-plan-2026-04-20.md)
- [product-site-phase-1-execution-plan-2026-04-20.md](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-phase-1-execution-plan-2026-04-20.md)
- [README.md](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/README.md)
- [apps/client-site-starter/README.md](/mnt/c/local/community-app/apps/client-site-starter/README.md)

### Existing code expected to remain untouched in Phase 2 unless strictly necessary

- `apps/hub-platform` frontend route components
- `apps/hub-platform` admin UI
- `apps/hub-platform` member/public route UI

That restraint is part of the architecture, not a limitation.

## 11) PR Sequencing Recommendation

To preserve review quality, Phase 2 should be split into small PRs.

### PR 1: Product-site app scaffold

Scope:

- create `apps/product-site`
- create the base route groups and layout
- add README and app-boundary guidance

Success condition:

- the new app exists as a clean independent frontend boundary

### PR 2: Marketing routes and shell

Scope:

- homepage
- pricing page
- shared marketing layout

Success condition:

- the acquisition shell is real and production-directed

### PR 3: Signup and account shell

Scope:

- signup route
- account routes
- package/billing placeholders

Success condition:

- the commercial route tree is complete enough for Phase 3 and later Stripe work

### PR 4: Documentation closeout

Scope:

- update roadmap docs
- update `client-site-starter` status note
- record dependency rules

Success condition:

- the repo clearly communicates that `apps/product-site` is the commercial system boundary

## 12) Engineering Standards For This Phase

Phase 2 must follow these rules.

### 12.1 Do not import `hub-platform` frontend code

If shared logic is needed, extract it deliberately. Do not reach across app boundaries to “borrow” UI.

### 12.2 Keep product-site routes server-first and thin

Route files should orchestrate, not own deep business logic.

### 12.3 Keep commercial and operational language distinct

The product site should talk about plans, signup, billing, and account management.

It should not reuse admin-oriented wording from `hub-platform`.

### 12.4 Keep placeholders honest

If a billing or provisioning flow is not live yet, the UI should say so clearly rather than implying completed functionality.

### 12.5 Avoid premature shared packages

Extract only when the shared need is real, stable, and app-agnostic.

## 13) Test Plan

Minimum required checks:

### App-boundary checks

- no product-site frontend imports from `apps/hub-platform`
- app boots independently

### Route and shell checks

- homepage renders
- pricing route renders
- signup route renders
- account/package/billing/upgrade routes render

### Source and structure checks

- `client-site-starter` is not referenced as the authoritative product-site boundary
- roadmap docs point to the correct app boundary

### UX/source checks

- package messaging is consistent with the package model already implemented in `hub-platform`
- product-site copy does not promise live Stripe or live provisioning before those phases land

## 14) Risk Register And Controls

### Risk: product-site work drifts into `client-site-starter`

Control:

- establish `apps/product-site` immediately
- update docs so the repo has one authoritative commercial app boundary

### Risk: frontend coupling to `hub-platform`

Control:

- lock the no-cross-app-frontend-import rule
- review imports explicitly in PRs

### Risk: Phase 2 overreaches into provisioning or Stripe

Control:

- keep Phase 2 focused on app boundary and route architecture
- defer live provisioning to Phase 3
- defer Stripe to Phase 5

### Risk: shared-package extraction happens too early

Control:

- prefer local product-site implementation first
- extract only after repetition is real and contract shape is stable

## 15) Definition Of Done

Phase 2 is done when:

1. `apps/product-site` exists as a standalone app
2. public marketing routes exist for homepage, pricing, and signup
3. authenticated account routes exist for package/billing/upgrade destinations
4. the product site does not depend on `hub-platform` frontend files
5. shared-code rules are documented clearly
6. roadmap docs identify `apps/product-site` as the canonical commercial app boundary
7. lint and route-level checks are clean

## 16) Recommended Immediate Coding Slice

When coding begins for Phase 2, the first implementation slice should be:

1. create `apps/product-site`
2. add the base route groups and root layout
3. add homepage, pricing, and signup shells
4. add the account shell and placeholder package/billing routes
5. update docs to lock the app-boundary rule

This is the highest-leverage first slice because it creates the commercial application boundary cleanly before any provisioning or billing complexity is layered on top.

## 17) Final Recommendation

Phase 2 should be treated as an application-boundary and route-foundation milestone.

If implemented well, it will give later phases a clean place to attach:

- provisioning
- package updates
- billing destinations
- Stripe lifecycle flows

without polluting `hub-platform` or coupling the two apps at the frontend layer.
