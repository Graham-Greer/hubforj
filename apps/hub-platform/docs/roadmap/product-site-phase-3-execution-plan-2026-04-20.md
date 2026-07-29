# Product Site Phase 3 Execution Plan

Status:
- Proposed
- Execution-ready delivery breakdown
- Historical implementation plan only as of 2026-05-01

Date:
- 2026-04-20

Purpose:
- Turn Phase 3 of the product-site/commercial-platform work into an implementation-ready plan
- Define how the standalone product site provisions hubs into `hub-platform` using the Phase 1 contract and the Phase 2 app boundary
- Lock the signup-to-hub-creation flow before Stripe and live billing are introduced

Authority:
- [Product Site And Commercial Platform Implementation Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-and-commercial-platform-implementation-plan-2026-04-20.md)
- [Product Site Phase 1 Execution Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-phase-1-execution-plan-2026-04-20.md)
- [Product Site Phase 2 Execution Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-phase-2-execution-plan-2026-04-20.md)
- [Roadmap Docs README](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/README.md)
- app-local standards in `docs/standards/*`

Related:
- [Product Site Current-State Audit And Next Steps (2026-05-01)](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-current-state-audit-and-next-steps-2026-05-01.md)
- [Product-Site Package Authority Contract](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-package-authority-contract-2026-03-31.md)
- [SaaS Package Authority And Enforcement Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/saas-package-authority-and-enforcement-plan-2026-03-29.md)

## 1) Phase 3 Goal

Current-state note:

This document describes the intended Phase 3 implementation before the product-site signup and provisioning slice was completed.

That slice is now materially implemented in `apps/product-site`, including:

- signup form and action flow
- hub provisioning into `hub-platform`
- commercial-account ownership linking
- auth-user creation
- paid-package checkout handoff for Starter/Growth

Use this document as a historical execution plan, not as the current statement of what is still missing.

Phase 3 exists to make the product site capable of creating a real hub record with authoritative package input and then handing the customer cleanly into the operational system.

This phase does **not** yet implement Stripe-backed checkout.

This phase also does **not** require a fully unified auth model between the product site and `hub-platform`.

It establishes a truthful commercial signup flow that can:

- collect account and hub setup inputs
- collect package selection
- write through the canonical provisioning contract
- create the hub in `hub-platform`
- return the customer to the correct operational destination

## 2) Locked Delivery Position

These decisions should be treated as fixed for Phase 3.

### 2.1 The product site is the commercial initiator, not the operational owner

The product site initiates signup and provisioning.

`hub-platform` remains the system that owns operational hub usage and entitlement enforcement after provisioning.

### 2.2 Provisioning must write through the canonical contract, not route-local assumptions

Phase 3 must consume the Phase 1 provisioning contract and mutation boundary.

The product site should not duplicate package validation or invent a second create-hub contract.

### 2.3 Package choice must be explicit at provisioning time

The Phase 3 signup flow must treat package selection as a first-class input.

The created hub record must carry authoritative package fields from the start.

### 2.4 No fake billing should be implied

If a selected package would later require payment handling, the UX must still be honest about the current lifecycle until Stripe exists.

Phase 3 should prioritize truthful package authority and successful provisioning, not simulated checkout.

## 3) Phase 3 Scope

Phase 3 includes:

1. define the product-site signup flow for initial hub creation
2. define the business-account-to-hub creation handoff
3. connect the signup flow to the canonical create-hub contract
4. create hub records with authoritative package inputs
5. establish post-provisioning redirect behavior into `hub-platform`
6. ensure package-aware messaging stays honest before Stripe exists
7. add coverage for successful and invalid provisioning paths

Phase 3 excludes:

- Stripe checkout
- subscription lifecycle
- webhook-driven package updates
- live downgrade/upgrade billing logic
- deep multi-hub commercial account management

## 4) Core Deliverables

At the end of Phase 3, the repo must provide:

### 4.1 A real product-site signup and provisioning path

The product site must be able to:

- collect account identity inputs needed for signup
- collect hub setup inputs
- collect package choice
- submit a provisioning request

### 4.2 A canonical provisioning write path into `hub-platform`

The provisioning flow must end in the same authoritative create-hub contract and mutation path used by the system.

### 4.3 A truthful post-provisioning customer journey

After successful hub creation, the customer must be able to:

- understand that the hub is now created
- enter the operational product cleanly
- know where package management will live later

### 4.4 Error handling suitable for production onboarding

The flow must handle:

- duplicate slugs
- invalid package inputs
- custom-domain entitlement restrictions
- missing required setup values

without exposing backend assumptions directly to the user.

## 5) Recommended Flow Model

Phase 3 should lock the following onboarding flow.

### 5.1 Customer journey

1. Customer chooses a package on the product site
2. Customer enters account and hub setup details
3. Product site validates the request shape
4. Product site submits provisioning through the canonical contract
5. `hub-platform` creates the hub and seeds the default membership plan
6. Product site confirms success
7. Customer is redirected into the correct operational destination

### 5.2 Minimum provisioning inputs

The provisioning flow should capture:

- business/account owner identity
- hub/community name
- hub slug
- contact email
- package tier
- any package status default required by the contract
- optional custom-domain request only if allowed by package rules

### 5.3 Phase 3 handoff rule

Do not try to solve every cross-app session concern in the same step as provisioning.

The provisioning flow should focus on:

- creating the correct hub record
- returning the user to a deterministic destination

Session unification can remain a later workstream.

## 6) Recommended Code Touch Points

Phase 3 should primarily add product-site implementation and consume the canonical `hub-platform` contract.

### 6.1 Product-site signup flow

Expected new areas inside `apps/product-site`:

- signup route files
- signup form components
- provisioning action or server handler
- success/error states

### 6.2 Contract consumption layer

Expected shared touch points:

- Phase 1 provisioning contract entry point
- any extracted shared package vocabulary/constants

The product site should consume the contract rather than copy logic from:

- route actions
- UI forms
- admin screens

### 6.3 `hub-platform` mutation boundary

Relevant current file:

- [hub-mutations.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/data/hub-mutations.js)

Relevant current entry point:

- `createHub(...)`

Phase 3 should rely on the hardened create path rather than inventing a product-site-specific mutation.

### 6.4 Transitional platform tooling

Relevant current files:

- [CreateHubForm.jsx](/mnt/c/local/community-app/apps/hub-platform/src/app/(platform)/platform/hubs/create/CreateHubForm.jsx)
- `apps/hub-platform/src/app/(platform)/platform/hubs/create/actions.js`

These should remain operator tooling and not become the integration contract for the product site.

## 7) Execution Tracks

Phase 3 should be delivered in five tracks.

### Track A: Signup and package-selection UX

Outcome:
- the product site has a real onboarding flow with explicit package selection

Primary outputs:

- signup route
- package selection UI
- setup form
- success and error states

### Track B: Provisioning integration seam

Outcome:
- product-site submissions translate cleanly into the canonical provisioning contract

Primary outputs:

- provisioning action/handler
- contract payload assembly
- server-side validation path

### Track C: Hub creation and post-create response handling

Outcome:
- successful provisioning produces a real hub and a stable result model for the product site

Primary outputs:

- created hub identifier
- created slug
- package authority confirmation
- deterministic redirect target

### Track D: Post-provisioning handoff

Outcome:
- customer lands in the correct next step after hub creation

Primary outputs:

- success confirmation UX
- redirect strategy into `hub-platform`
- honest messaging about what is operational now versus what billing will provide later

### Track E: Verification and documentation

Outcome:
- Phase 3 can be trusted as the foundation for Phase 4 and Phase 5

Primary outputs:

- provisioning coverage
- failure-path coverage
- roadmap updates

## 8) Execution-Ready Backlog

This backlog is ordered so we lock behavior before we polish commercial copy.

### Slice 1: Define the signup payload assembly path

Implementation tasks:

1. Define the product-site signup form model
2. Map product-site form fields onto the canonical provisioning contract
3. Keep the mapping explicit and local to a product-site server-side integration layer
4. Avoid embedding contract defaults in client components

Review checklist:

- package fields are explicit
- hub fields are explicit
- payload assembly is not coupled to view markup

### Slice 2: Implement provisioning submission

Implementation tasks:

1. Add a product-site server action or equivalent handler for provisioning
2. Submit to the canonical create-hub contract/mutation
3. Normalize and surface validation errors cleanly
4. Keep the submission path server-first

Review checklist:

- there is one authoritative provisioning write path
- server-side errors are translated into actionable form feedback
- no route duplicates `hub-platform` package validation

### Slice 3: Implement success and error states

Implementation tasks:

1. Add clear provisioning success UI
2. Add duplicate-slug and invalid-package error handling
3. Add general failure fallback UX
4. Keep the copy honest about what has and has not happened yet

Review checklist:

- success does not imply billing completion
- errors do not leak internal implementation detail unnecessarily

### Slice 4: Implement post-provisioning redirect behavior

Implementation tasks:

1. Define the first operational destination after provisioning
2. Redirect the customer into the correct `hub-platform` destination
3. Include enough information for the next app to resolve the hub context deterministically
4. Keep the redirect strategy compatible with later business-account ownership work

Review checklist:

- the redirect target is deterministic
- the customer journey feels continuous even without unified sessions

### Slice 5: Add coverage and docs

Implementation tasks:

1. Add provisioning-path tests
2. Add invalid payload and duplicate-slug tests
3. Update roadmap docs once the flow shape is finalized
4. Document the redirect contract used after successful provisioning

Review checklist:

- success and failure paths are both covered
- the next phase can build package-management flows without re-auditing provisioning

## 9) File-By-File Touch Point Map

Phase 3 should primarily add product-site code and consume the existing authoritative `hub-platform` contract.

### Product-site additions

- new `apps/product-site/src/app/(marketing)/signup/*`
- new `apps/product-site/src/components/*` for signup/package-selection UI
- new `apps/product-site/src/lib/*` for provisioning integration

### `hub-platform` contract and mutation touch points

- [hub-mutations.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/data/hub-mutations.js)
- [hubs.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/hubs.js)
- any Phase 1 contract module added for canonical provisioning normalization

### Docs likely to update

- [product-site-and-commercial-platform-implementation-plan-2026-04-20.md](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-and-commercial-platform-implementation-plan-2026-04-20.md)
- [product-site-phase-1-execution-plan-2026-04-20.md](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-phase-1-execution-plan-2026-04-20.md)
- [product-site-phase-2-execution-plan-2026-04-20.md](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-phase-2-execution-plan-2026-04-20.md)

## 10) PR Sequencing Recommendation

To preserve quality, Phase 3 should be split into focused PRs.

### PR 1: Signup flow and payload assembly

Scope:

- product-site signup form
- package selection
- server-side payload assembly

Success condition:

- the commercial app can build a canonical provisioning payload cleanly

### PR 2: Provisioning integration and success/error handling

Scope:

- provisioning submission
- error handling
- success state

Success condition:

- the product site can create a real hub through the authoritative contract

### PR 3: Redirect and handoff completion for initial provisioning

Scope:

- post-create redirect strategy
- destination resolution
- copy refinement

Success condition:

- customers can move from signup into the operational product without confusion

### PR 4: Documentation and closeout

Scope:

- roadmap updates
- redirect contract notes
- provisioning behavior notes

Success condition:

- the repo clearly documents how commercial signup becomes operational hub ownership

## 11) Engineering Standards For This Phase

Phase 3 must follow these rules.

### 11.1 The product site consumes the contract; it does not redefine it

All provisioning semantics must resolve through the canonical Phase 1 contract.

### 11.2 Keep client-side code thin

Client components may collect input and render feedback, but package validation and provisioning semantics belong on the server side.

### 11.3 Keep the customer journey honest

Do not imply that:

- billing is complete if it is not
- Stripe exists if it does not
- package management is fully live if it is not

### 11.4 Preserve the app boundary

Do not solve Phase 3 by importing `hub-platform` frontend code into the product site.

### 11.5 Keep redirect semantics explicit

The first operational destination after provisioning should be intentional and documented, not implicit in scattered route code.

## 12) Test Plan

Minimum required checks:

### Provisioning contract path

- valid product-site signup data creates a canonical provisioning payload
- invalid package fields fail deterministically
- duplicate slug errors surface correctly
- custom-domain restrictions still apply correctly by package

### Mutation result handling

- successful provisioning returns the created hub identity and slug
- product-site success handling uses the created record deterministically

### UX/source checks

- product-site signup messaging remains consistent with current package capability rules
- the flow does not claim live Stripe or live billing when those phases are not implemented

### Redirect checks

- successful provisioning resolves the correct `hub-platform` destination
- failure states do not redirect prematurely

## 13) Risk Register And Controls

### Risk: product-site signup duplicates `hub-platform` provisioning rules

Control:

- centralize provisioning validation in the canonical contract
- keep product-site integration thin

### Risk: package messaging outruns actual billing behavior

Control:

- keep copy explicit about pre-Stripe limitations
- separate package authority from payment completion

### Risk: redirect flow feels broken without unified auth

Control:

- make post-provisioning destination deterministic
- keep the handoff explicit and documented
- defer full auth unification instead of solving it badly inside signup

### Risk: provisioning success shape is unstable

Control:

- keep mutation result shapes explicit
- add test coverage for the created hub identity, slug, and next-step contract

## 14) Definition Of Done

Phase 3 is done when:

1. the product site can collect package and hub setup inputs
2. the product site can submit provisioning through the canonical contract
3. a real hub is created in `hub-platform`
4. success and failure states are handled clearly
5. successful provisioning redirects the customer into the correct operational destination
6. no frontend coupling to `hub-platform` was introduced
7. lint and provisioning-path tests are clean

## 15) Recommended Immediate Coding Slice

When coding begins for Phase 3, the first implementation slice should be:

1. define the signup data model and package-selection UI
2. add the server-side provisioning handler
3. wire it to the canonical create-hub contract
4. return a deterministic success result
5. add duplicate-slug and invalid-payload coverage

This is the highest-leverage first slice because it proves that the commercial app can create authoritative operational state without Stripe and without collapsing the app boundary.

## 16) Final Recommendation

Phase 3 should be treated as the commercial-to-operational bridge milestone.

If implemented well, it will prove that:

- the product site can own signup
- `hub-platform` can remain the operational system
- package authority can be written correctly from the commercial side

That is the critical foundation needed before package management and Stripe are layered on top.
