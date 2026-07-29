# Product Site Phase 1 Execution Plan

Status:
- Proposed
- Execution-ready delivery breakdown

Date:
- 2026-04-20

Purpose:
- Turn Phase 1 of the product-site/commercial-platform work into an implementation-ready plan
- Define the exact scope, code touch points, contract shapes, test coverage, and definition of done
- Remove ambiguity before production coding begins

Authority:
- [Product Site And Commercial Platform Implementation Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-and-commercial-platform-implementation-plan-2026-04-20.md)
- [Product-Site Package Authority Contract](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-package-authority-contract-2026-03-31.md)
- [SaaS Package Authority And Enforcement Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/saas-package-authority-and-enforcement-plan-2026-03-29.md)
- app-local standards in `docs/standards/*`

Related:
- [SaaS Package Tier And Entitlement Model](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/saas-package-tier-and-entitlement-model-2026-03-29.md)
- [Admin Account Settings Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/admin-account-settings-plan-2026-03-31.md)

## 1) Phase 1 Goal

Phase 1 exists to make `hub-platform` a clean and reliable **consumer** of package authority written by an upstream commercial system.

This phase does **not** build the product site UI yet.

This phase also does **not** implement Stripe.

It creates the contract and mutation boundary that the future product site will depend on.

## 2) Phase 1 Scope

Phase 1 includes:

1. explicit provisioning contract hardening
2. explicit package-authority update contract creation
3. separation of operator provisioning from upstream commercial provisioning semantics
4. package-management handoff configuration groundwork
5. unit-level and integration-adjacent contract coverage
6. documentation updates that define the contract as canonical

Phase 1 excludes:

- any new product-site app
- Stripe checkout or webhook handling
- authenticated business-account flows
- full cross-app handoff wiring
- any attempt to turn `hub-platform` into a billing surface

## 3) Core Deliverables

At the end of Phase 1, the codebase must provide:

### 3.1 Canonical create-hub contract

The create-hub contract must support:

- operator-driven provisioning
- future product-site-driven provisioning

The contract must accept package authority explicitly and validate it centrally.

### 3.2 Canonical package-authority update contract

The update contract must support:

- package tier changes
- package status changes
- source changes where valid
- package override changes where explicitly allowed

It must update only package-related fields and audit timestamps.

### 3.3 Clear mutation boundary

There must be one clearly owned mutation path for:

- creating hubs
- updating hub package authority

UI routes should not become the contract.

### 3.4 Handoff configuration shape

`hub-platform` must gain a clean place to resolve future product-site destinations for:

- manage package
- upgrade to Growth

These do not need to be live in Phase 1, but the integration seam should exist.

## 4) Recommended Code Touch Points

These are the primary files and modules Phase 1 should touch.

### 4.1 Domain normalization

Existing files:

- [hubs.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/hubs.js)
- [hub-package.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/hub-package.js)
- [package-entitlements.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/package-entitlements.js)
- [package-tiers.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/package-tiers.js)

Recommended additions:

- `src/lib/domain/hub-package-contracts.js`
  - normalize package-authority create payload inputs
  - normalize package-authority update payload inputs
  - keep package-contract rules separate from UI forms

Why:

- `hubs.js` currently owns create payload normalization
- package update normalization does not yet exist as a first-class contract
- separating contract logic prevents the future product site from depending on admin-route assumptions

### 4.2 Data mutation layer

Existing file:

- [hub-mutations.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/data/hub-mutations.js)

Recommended additions inside or adjacent to it:

- `updateHubPackageAuthorityById(hubId, payload, actorId)`
- optional helper:
  - `buildHubPackageAuthorityWriteModel(...)`

Why:

- there is already a clean `createHub(...)` mutation
- there is not yet an equivalent first-class package-authority update mutation

### 4.3 Read-model layer

Existing file:

- [data/hubs.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/data/hubs.js)

Expected work:

- ensure normalized hub read models continue to expose:
  - package tier
  - package status
  - package source
  - package timestamps
  - package overrides
  - payment processing mode
  - derived capabilities
  - derived limits

This is already mostly present and should be preserved, not redesigned.

### 4.4 Platform provisioning UI

Existing files:

- [CreateHubForm.jsx](/mnt/c/local/community-app/apps/hub-platform/src/app/(platform)/platform/hubs/create/CreateHubForm.jsx)
- [create/actions.js](/mnt/c/local/community-app/apps/hub-platform/src/app/(platform)/platform/hubs/create/actions.js)

Expected work:

- keep this as transitional operator tooling
- route it through the hardened canonical create contract
- make sure the wording continues to reflect transitional provisioning, not permanent commercial onboarding

### 4.5 Admin account settings handoff surface

Existing file:

- [account/page.jsx](/mnt/c/local/community-app/apps/hub-platform/src/app/(admin)/[hubSlug]/admin/settings/account/page.jsx)

Recommended additions:

- package-management handoff helper module, for example:
  - `src/lib/domain/package-management-handoff.js`

Responsibilities:

- resolve future product-site destinations
- keep handoff destination generation out of route components
- support placeholder mode until the product site exists

Phase 1 does not need live links, but the handoff module should exist.

## 5) Contract Shapes

These payloads should become explicit and documented in code.

## 5.1 Provisioning contract

Recommended normalized shape:

```js
{
  name: string,
  slug: string,
  contactEmail: string,
  template: string,
  theme: string,
  description: string,
  timezone: string,
  locale: string,
  packageTier: "free" | "starter" | "growth",
  packageStatus: "active" | "trialing" | "past_due" | "cancelled",
  packageSource: "product_site" | "operator" | "seed",
  customDomain: string | "",
}
```

Recommended rule:

- `packageSource` should default to `operator` for platform tooling
- future product-site callers should explicitly set `product_site`

## 5.2 Package authority update contract

Recommended normalized shape:

```js
{
  packageTier: "free" | "starter" | "growth",
  packageStatus: "active" | "trialing" | "past_due" | "cancelled",
  packageSource: "product_site" | "operator" | "seed",
  packageOverrides?: {
    customDomainEnabled?: boolean | null,
    brandingRemovalEnabled?: boolean | null,
    reportingEnabled?: boolean | null,
  },
  packageAssignedAt?: string,
  packageUpdatedAt?: string,
}
```

Recommended update rules:

- `packageUpdatedAt` is always refreshed by the mutation layer
- `packageAssignedAt` is set on first assignment and may be preserved thereafter
- override fields remain optional and exceptional
- contract validation rejects unsupported tier/status/source combinations before persistence

## 5.3 Handoff contract shape

Recommended destination resolver output:

```js
{
  managePackageHref: string,
  upgradeToGrowthHref: string,
  placeholder: boolean,
}
```

For Phase 1, placeholder mode is acceptable.

## 6) Detailed Implementation Tasks

The work should be implemented in this order.

## 6.1 Step 1: Extract package contract normalization

Goal:
- centralize package-related contract normalization away from route code

Tasks:

1. Create `src/lib/domain/hub-package-contracts.js`
2. Move or wrap package create normalization concerns out of general UI assumptions
3. Add:
   - `normalizeCreateHubProvisioningPayload`
   - `normalizeUpdateHubPackageAuthorityPayload`
4. Keep naming explicit: “provisioning” and “package authority” should not be conflated

Acceptance criteria:

- create and update contracts can be used independently of UI route code
- package-specific validation lives in one place

## 6.2 Step 2: Add package-authority update mutation

Goal:
- create one canonical write path for package changes

Tasks:

1. Add `updateHubPackageAuthorityById(...)` in [hub-mutations.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/data/hub-mutations.js)
2. Ensure only package fields are mutated
3. Update audit timestamps consistently
4. Preserve existing hub state unrelated to package authority

Acceptance criteria:

- package updates do not require ad hoc Firestore field manipulation elsewhere
- write semantics are stable enough for future product-site callers

## 6.3 Step 3: Tighten create-hub semantics

Goal:
- ensure current create-hub flow is contract-compliant and future-safe

Tasks:

1. Update [hubs.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/hubs.js) to use the new contract helpers if appropriate
2. Keep custom-domain entitlement enforcement in the domain layer
3. Preserve transitional operator flow in [create/actions.js](/mnt/c/local/community-app/apps/hub-platform/src/app/(platform)/platform/hubs/create/actions.js)
4. Keep transitional product-site wording in [CreateHubForm.jsx](/mnt/c/local/community-app/apps/hub-platform/src/app/(platform)/platform/hubs/create/CreateHubForm.jsx)

Acceptance criteria:

- current platform provisioning still works
- future upstream provisioning can reuse the same contract

## 6.4 Step 4: Add package-management handoff resolver

Goal:
- create the seam for future product-site links

Tasks:

1. Create `src/lib/domain/package-management-handoff.js`
2. Define placeholder route config and resolver behavior
3. Integrate it into [account/page.jsx](/mnt/c/local/community-app/apps/hub-platform/src/app/(admin)/[hubSlug]/admin/settings/account/page.jsx)
4. Keep buttons honest:
   - disabled if truly unavailable
   - or link to a placeholder path only if explicitly intended

Acceptance criteria:

- package-management destinations are resolved through one module
- route components do not hardcode future product-site URLs

## 6.5 Step 5: Add tests

Goal:
- lock the contract before the product site is built on top of it

Tasks:

1. Add domain tests for provisioning normalization
2. Add domain tests for package-authority update normalization
3. Add mutation-focused tests where feasible
4. Add handoff resolver tests

Recommended test files:

- `tests/unit/hub-package-contracts.test.js`
- `tests/unit/hub-package-handoff.test.js`
- extend:
  - [hubs-domain.test.js](/mnt/c/local/community-app/apps/hub-platform/tests/unit/hubs-domain.test.js)
  - [package-entitlements-domain.test.js](/mnt/c/local/community-app/apps/hub-platform/tests/unit/package-entitlements-domain.test.js)

Acceptance criteria:

- invalid contract payloads fail deterministically
- normalized outputs are stable and explicit
- future product-site integration can rely on test-protected behavior

## 6.6 Step 6: Close the documentation loop

Goal:
- ensure the execution contract is understandable without re-auditing the repo

Tasks:

1. Keep this document as the execution authority for Phase 1
2. Update the canonical implementation plan once concrete code lands
3. Mark any superseded package-authority planning notes as historical where they no longer reflect repo reality
4. Add code references in the final implementation PR notes so the product-site build can start from audited truth, not roadmap inference

Acceptance criteria:

- the next engineer can start product-site work from one current contract document
- there is no ambiguity about which doc describes Phase 1 delivery

## 7) Execution Tracks

Phase 1 should be delivered in four parallel-but-ordered tracks. The tracks are intentionally separated so we can keep contracts, mutations, handoff wiring, and documentation from drifting.

### Track A: Contract extraction and normalization

Outcome:
- explicit provisioning and package-authority update normalization owned in one place

Primary files:

- [hubs.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/hubs.js)
- [hub-package.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/hub-package.js)
- new `src/lib/domain/hub-package-contracts.js`

Primary outputs:

- `normalizeCreateHubProvisioningPayload`
- `normalizeUpdateHubPackageAuthorityPayload`
- shared internal helpers for tier, status, source, and override validation

### Track B: Mutation and persistence boundary

Outcome:
- one write path for package-authority updates

Primary files:

- [hub-mutations.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/data/hub-mutations.js)

Primary outputs:

- `updateHubPackageAuthorityById`
- stable write-model shaping for package fields only
- consistent `packageAssignedAt` and `packageUpdatedAt` semantics

### Track C: Admin handoff seam

Outcome:
- `hub-platform` can resolve commercial package destinations without owning them

Primary files:

- [account/page.jsx](/mnt/c/local/community-app/apps/hub-platform/src/app/(admin)/[hubSlug]/admin/settings/account/page.jsx)
- new `src/lib/domain/package-management-handoff.js`

Primary outputs:

- environment-aware or config-aware destination resolver
- explicit placeholder mode
- one route-level integration seam instead of hardcoded future product-site links

### Track D: Verification and documentation

Outcome:
- future product-site work can trust the upstream contract

Primary files:

- new `tests/unit/hub-package-contracts.test.js`
- new `tests/unit/hub-package-handoff.test.js`
- [hubs-domain.test.js](/mnt/c/local/community-app/apps/hub-platform/tests/unit/hubs-domain.test.js)
- [package-entitlements-domain.test.js](/mnt/c/local/community-app/apps/hub-platform/tests/unit/package-entitlements-domain.test.js)
- this roadmap document

Primary outputs:

- stable unit coverage
- explicit documentation of the upstream contract
- reduced onboarding cost for the next workstream

## 8) Execution-Ready Backlog

This backlog is ordered so each item leaves the repo in a cleaner, more reliable state than before.

### Slice 1: Formalize package contract helpers

Implementation tasks:

1. Create `src/lib/domain/hub-package-contracts.js`
2. Move shared package validation logic into named helpers:
   - tier normalization
   - status normalization
   - source normalization
   - override normalization
3. Add `normalizeCreateHubProvisioningPayload`
4. Add `normalizeUpdateHubPackageAuthorityPayload`
5. Keep the returned shapes explicit and serialization-safe

Review checklist:

- no route file owns package validation
- defaults are explicit, not implied by UI
- invalid inputs fail with deterministic messages

### Slice 2: Rewire create-hub flow onto the contract

Implementation tasks:

1. Update [hubs.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/hubs.js) to call the new provisioning contract where appropriate
2. Preserve existing create-hub behavior for operator tooling
3. Keep custom-domain gating in the domain layer
4. Confirm the platform create flow still produces the same persisted package authority for equivalent valid input

Review checklist:

- no create behavior regression for current operator flow
- product-site-facing semantics are now reusable without importing route code
- legacy compatibility fields still derive from canonical authority data

### Slice 3: Add package-authority write mutation

Implementation tasks:

1. Implement `updateHubPackageAuthorityById(hubId, payload, actorId)`
2. Normalize the incoming payload before persistence
3. Limit writes to:
   - `packageTier`
   - `packageStatus`
   - `packageSource`
   - `packageOverrides`
   - `packageAssignedAt`
   - `packageUpdatedAt`
   - any legacy compatibility fields derived from canonical authority
4. Avoid mutation of unrelated hub settings

Review checklist:

- updates are idempotent for equivalent normalized payloads
- unrelated hub fields remain untouched
- timestamp semantics are obvious in code comments or helper names

### Slice 4: Add package-management handoff resolver

Implementation tasks:

1. Create `src/lib/domain/package-management-handoff.js`
2. Define the resolver contract:
   - manage package destination
   - upgrade destination
   - placeholder flag
   - optional return-path support
3. Integrate the resolver into [account/page.jsx](/mnt/c/local/community-app/apps/hub-platform/src/app/(admin)/[hubSlug]/admin/settings/account/page.jsx)
4. Keep UI behavior honest when no commercial destination exists yet

Review checklist:

- route components do not embed product-site URLs
- return-path handling is explicit and future-safe
- placeholder mode cannot be mistaken for a live billing flow

### Slice 5: Add test coverage before product-site work begins

Implementation tasks:

1. Add `tests/unit/hub-package-contracts.test.js`
2. Add `tests/unit/hub-package-handoff.test.js`
3. Extend domain tests to cover contract-backed create behavior
4. Extend entitlement/read-model tests where package writes affect derived behavior

Review checklist:

- both valid and invalid payloads are covered
- tests assert normalized shapes, not incidental formatting
- the new mutation boundary is protected from silent drift

### Slice 6: Finalize docs and delivery notes

Implementation tasks:

1. Update the canonical implementation plan if implementation details evolve
2. Record the final contract entry points and intended callers
3. Mark older plan notes as historical where necessary

Review checklist:

- a new engineer can identify the correct contract entry points in under five minutes
- the next workstream does not need to infer package semantics from UI code

## 9) File-By-File Touch Point Map

This map is the concrete implementation checklist for code review and PR scoping.

### Domain layer

- [hubs.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/hubs.js)
  - rewire create-hub normalization to the new provisioning contract
  - preserve current operator defaults
- [hub-package.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/hub-package.js)
  - keep package-domain helpers focused on package semantics, not caller-specific input normalization
- new `src/lib/domain/hub-package-contracts.js`
  - own create/update payload validation and normalization
- [package-entitlements.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/package-entitlements.js)
  - preserve behavior, but verify compatibility with normalized authority updates
- [package-tiers.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/package-tiers.js)
  - keep as the authoritative tier vocabulary source

### Data layer

- [hub-mutations.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/data/hub-mutations.js)
  - add the canonical package-authority update mutation
- [data/hubs.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/data/hubs.js)
  - verify read-model shape remains stable after authority updates

### App layer

- [CreateHubForm.jsx](/mnt/c/local/community-app/apps/hub-platform/src/app/(platform)/platform/hubs/create/CreateHubForm.jsx)
  - preserve transitional wording only
- [create/actions.js](/mnt/c/local/community-app/apps/hub-platform/src/app/(platform)/platform/hubs/create/actions.js)
  - keep thin, delegating to the contract and mutation boundary
- [account/page.jsx](/mnt/c/local/community-app/apps/hub-platform/src/app/(admin)/[hubSlug]/admin/settings/account/page.jsx)
  - consume the handoff resolver rather than hardcoded destinations

### Test layer

- new `tests/unit/hub-package-contracts.test.js`
- new `tests/unit/hub-package-handoff.test.js`
- [hubs-domain.test.js](/mnt/c/local/community-app/apps/hub-platform/tests/unit/hubs-domain.test.js)
- [package-entitlements-domain.test.js](/mnt/c/local/community-app/apps/hub-platform/tests/unit/package-entitlements-domain.test.js)

## 10) PR Sequencing Recommendation

To keep review quality high, Phase 1 should be split into small, high-confidence PRs rather than one large mixed change.

### PR 1: Contract extraction

Scope:

- add `hub-package-contracts.js`
- add contract tests
- rewire create normalization where safe

Success condition:

- create/update package payloads are normalized in one place

### PR 2: Package-authority mutation

Scope:

- add `updateHubPackageAuthorityById`
- add mutation-adjacent tests
- verify read-model compatibility

Success condition:

- package authority can be updated without touching unrelated hub state

### PR 3: Handoff seam

Scope:

- add `package-management-handoff.js`
- wire account settings to the resolver
- add handoff tests

Success condition:

- `hub-platform` has a production-safe commercial handoff seam

### PR 4: Documentation closeout

Scope:

- update roadmap docs after code lands
- record final contract shape and call sites

Success condition:

- the next workstream can start without re-auditing package authority

## 11) Engineering Standards For This Phase

Phase 1 must follow these rules.

### 7.1 Keep contract logic out of route files

Route files may collect form values, but they must not become the authoritative business contract.

### 7.2 Preserve server-first mutation boundaries

Domain normalization and mutation logic should remain in `lib/domain` and `lib/data`, not UI layers.

### 7.3 Do not leak future product-site assumptions into admin UX

Phase 1 should create the integration seam, not a fake finished experience.

### 7.4 Do not introduce Stripe vocabulary into `hub-platform` package mutations

Package authority is the contract.
Stripe is only a future upstream event source.

## 12) Resolved Design Decisions

These decisions should be treated as locked unless new information forces a change.

### 12.1 `hub-platform` remains the operational consumer

This phase must not move commercial ownership into `hub-platform`.

### 12.2 Product-site callers should consume explicit contracts, not route actions

Route actions may orchestrate current UI flows, but they are not the long-term external contract.

### 12.3 Override support remains exceptional

`packageOverrides` should stay narrow, explicit, and validated. They are not a substitute for tier design.

### 12.4 Handoff URLs belong behind one resolver

Even before the product site exists, destination generation must be centralized so cross-app wiring can evolve without touching multiple route files.

## 13) Documentation Deliverables

Phase 1 must also update docs so the contract is clear for future work.

Required documentation updates:

1. Update the canonical product-site implementation plan after Phase 1 lands
2. Add a short contract reference section if the payload shape changes materially during implementation
3. Mark any route-level workaround docs as historical if superseded

## 14) Test Plan

Minimum required checks:

### Domain contract tests

- provisioning payload accepts valid package authority
- provisioning payload rejects invalid package authority
- update payload accepts valid package authority transitions
- update payload rejects invalid tier/source/status inputs
- custom-domain input still fails for non-Growth provisioning

### Read model tests

- updated hub records still resolve correct entitlements
- read models expose package metadata consistently after update writes

### UX/source tests

- account settings still references package visibility and handoff semantics correctly
- platform create flow still reflects transitional operator provisioning correctly

## 15) Risk Register And Controls

### Risk: create and update semantics drift apart

Control:

- keep both paths normalized through the same contract module
- test both create and update payload shapes explicitly

### Risk: package update writes accidentally mutate unrelated hub state

Control:

- isolate the new mutation
- keep the write model package-scoped
- review persisted field lists explicitly in code review

### Risk: future product-site work bypasses the contract and talks to route code

Control:

- document the contract entry points clearly
- keep route files thin
- make the contract module easy to discover from the roadmap and tests

### Risk: placeholder handoff UI is mistaken for a real billing system

Control:

- expose explicit placeholder state in the resolver
- keep UI copy honest until the product site is live

## 16) Definition Of Done

Phase 1 is done when:

1. there is one canonical provisioning contract
2. there is one canonical package-authority update contract
3. there is one canonical package-authority update mutation
4. account settings has a dedicated handoff resolver seam
5. the new contract is covered by unit tests
6. documentation reflects the new contract as the foundation for product-site work
7. lint and unit tests are clean

## 17) Recommended Immediate Coding Slice

When coding begins, the first implementation slice should be:

1. add `hub-package-contracts.js`
2. implement package-authority update normalization
3. implement `updateHubPackageAuthorityById(...)`
4. add tests for both contracts

This is the highest-leverage first slice because it gives the future product site a real contract to build on.

## 18) Final Recommendation

Phase 1 should be treated as a contract-hardening milestone, not a UI milestone.

If implemented well, it will let the product site be built on top of:

- stable package authority
- stable package updates
- stable read semantics
- stable handoff assumptions

That is the strongest possible foundation for a production-grade SaaS commercial layer.
