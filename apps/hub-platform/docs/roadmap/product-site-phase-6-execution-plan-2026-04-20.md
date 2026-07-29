# Product Site Phase 6 Execution Plan

Status:
- Proposed
- Execution-ready delivery breakdown

Date:
- 2026-04-20

Purpose:
- Turn Phase 6 of the product-site/commercial-platform work into an implementation-ready plan
- Define the release-hardening work needed after product-site foundation, provisioning, package-management, and Stripe lifecycle delivery
- Lock the regression, recovery, observability, downgrade-consequence, and support-readiness requirements needed for production launch

Authority:
- [Product Site And Commercial Platform Implementation Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-and-commercial-platform-implementation-plan-2026-04-20.md)
- [Product Site Phase 1 Execution Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-phase-1-execution-plan-2026-04-20.md)
- [Product Site Phase 2 Execution Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-phase-2-execution-plan-2026-04-20.md)
- [Product Site Phase 3 Execution Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-phase-3-execution-plan-2026-04-20.md)
- [Product Site Phase 4 Execution Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-phase-4-execution-plan-2026-04-20.md)
- [Product Site Phase 5 Execution Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-phase-5-execution-plan-2026-04-20.md)
- [Roadmap Docs README](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/README.md)
- app-local standards in `docs/standards/*`

Related:
- [Product-Site Package Authority Contract](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-package-authority-contract-2026-03-31.md)
- [Custom Domain Management Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/custom-domain-management-plan-2026-03-31.md)
- [Custom Domain Launch Readiness Checklist](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/custom-domain-launch-readiness-checklist-2026-03-31.md)

## 1) Phase 6 Goal

Phase 6 exists to make the commercial platform safe to launch and safe to operate.

By this point, the system should already have:

- canonical package-authority contracts
- a standalone product site
- product-site-driven provisioning
- a live package-management surface
- Stripe-backed billing lifecycle handling

Phase 6 ensures those capabilities are production-ready through:

- regression coverage
- reconciliation and recovery tooling
- support/operator playbooks
- downgrade and custom-domain consequence verification
- rollout and launch-readiness checks

## 2) Locked Delivery Position

These decisions should be treated as fixed for Phase 6.

### 2.1 Phase 6 is about safety, not new product scope

This phase should not become a disguised feature-expansion phase.

Its job is to harden what already exists.

### 2.2 Recovery is a product requirement, not an afterthought

If package state, billing state, or domain state can drift, Phase 6 must provide a supported path to detect and repair that drift.

### 2.3 Downgrade and custom-domain consequences are launch blockers

The downgrade path off Growth and its effect on custom-domain service must be explicitly verified before launch.

### 2.4 Support and operator clarity matter as much as code correctness

The system is not production-ready if recovery requires tribal knowledge or manual guessing.

## 3) Phase 6 Scope

Phase 6 includes:

1. regression hardening across provisioning, package management, and billing lifecycle flows
2. reconciliation and recovery tooling for failed or partial package-authority updates
3. downgrade and custom-domain consequence verification
4. operator/support playbooks
5. observability and event-correlation guidance
6. launch-readiness checklists and rollout sequencing
7. documentation closeout for the final production path

Phase 6 excludes:

- major new commercial features
- redesigning the route architecture
- changing the package model unless a launch-blocking defect forces it

## 4) Core Deliverables

At the end of Phase 6, the repo must provide:

### 4.1 Regression confidence across the full lifecycle

The key commercial and operational flows must be covered and re-runnable:

- provisioning
- package changes
- billing lifecycle updates
- operational entitlement consumption

### 4.2 Recovery and reconciliation tooling

The team must be able to detect and repair:

- failed webhook application
- stale package-authority state
- partial downgrade side effects
- mismatched billing and package state

### 4.3 Verified downgrade and domain behavior

The product must prove that:

- downgrade off Growth preserves the fallback platform-hosted path
- custom-domain disconnect consequences occur correctly
- no customer is left with broken host routing after package change

### 4.4 Support-ready documentation and playbooks

The launch must include clear operational guidance for:

- support staff
- platform operators
- engineering on-call responders

## 5) Recommended Hardening Model

Phase 6 should treat the platform as an operating system, not just a codebase.

### 5.1 Commercial lifecycle verification chain

The following chain must be verified end to end:

1. package/signup intent on the product site
2. provisioning or package-change initiation
3. Stripe lifecycle event
4. canonical package-authority update
5. `hub-platform` read-model reflection
6. entitlement enforcement and UX adaptation

### 5.2 Downgrade consequence chain

The following downgrade sequence must be verified explicitly:

1. customer leaves Growth
2. package lifecycle reaches effective downgrade state
3. custom-domain service is disconnected correctly
4. platform-hosted fallback remains usable
5. admin messaging reflects the change accurately

### 5.3 Recovery rule

Any broken state should have:

- a way to detect it
- a way to explain it
- a way to recover it safely

## 6) Recommended Code And Operational Touch Points

Phase 6 should cut across both apps and the supporting docs.

### 6.1 Product-site lifecycle and webhook flows

Expected hardening areas:

- Stripe event handling
- billing state display
- retry and reconciliation logic
- customer-facing lifecycle messaging

### 6.2 `hub-platform` package and domain consequences

Expected hardening areas:

- package status visibility
- entitlement application
- custom-domain disconnect and fallback behavior
- account settings messaging

### 6.3 Domain-management and host-resolution logic

Relevant concern areas already present in the repo:

- custom-domain mapping lifecycle
- disconnect scheduling and disconnect completion
- canonical host behavior

### 6.4 Docs and operational references

Expected updates:

- roadmap closeout
- support playbooks
- recovery instructions
- launch-readiness notes

## 7) Execution Tracks

Phase 6 should be delivered in six tracks.

### Track A: Regression and integration hardening

Outcome:
- the core commercial-to-operational lifecycle is covered by reliable automated checks

Primary outputs:

- expanded integration coverage
- critical-flow regression tests
- source/UX consistency checks

### Track B: Reconciliation and recovery tooling

Outcome:
- package-authority drift and failed event application can be repaired safely

Primary outputs:

- reconciliation logic or guided repair flow
- retry guidance
- failure-state inspection model

### Track C: Downgrade and domain-consequence verification

Outcome:
- downgrade off Growth is safe and predictable

Primary outputs:

- downgrade verification scenarios
- custom-domain disconnect verification
- platform-hosted fallback verification

### Track D: Support and operator playbooks

Outcome:
- support staff and operators can resolve common failures without guesswork

Primary outputs:

- playbook documents
- escalation paths
- triage checklist

### Track E: Launch readiness and rollout

Outcome:
- the team has a defensible rollout and rollback plan

Primary outputs:

- launch checklist
- rollout sequencing
- rollback criteria

### Track F: Final documentation closeout

Outcome:
- the roadmap and operational docs accurately describe the launched system

Primary outputs:

- final roadmap updates
- historical marking of superseded planning notes

## 8) Execution-Ready Backlog

This backlog is ordered so operational safety comes before launch ceremony.

### Slice 1: Expand full-lifecycle regression coverage

Implementation tasks:

1. Add or extend tests across provisioning, package changes, billing lifecycle, and `hub-platform` entitlement reflection
2. Cover the critical success paths and key failure paths
3. Add regression checks for package messaging and handoff routes

Review checklist:

- the full commercial-to-operational path is exercised
- regressions are likely to be caught before release

### Slice 2: Add reconciliation and recovery tooling

Implementation tasks:

1. Define how stale or failed package-authority updates are identified
2. Add reconciliation or guided repair tooling where needed
3. Add supportable retry behavior for failed commercial update application
4. Ensure tooling is safe and auditable

Review checklist:

- repair does not require ad hoc record patching as the only option
- failure handling is explicit and repeatable

### Slice 3: Verify downgrade and custom-domain consequences

Implementation tasks:

1. Add downgrade verification scenarios
2. Verify disconnect scheduling and disconnect completion for custom domains
3. Verify the platform-hosted fallback remains valid
4. Verify customer/admin messaging after downgrade

Review checklist:

- no downgrade can leave the hub without a viable host
- destructive consequences are reflected clearly and correctly

### Slice 4: Produce support and operator playbooks

Implementation tasks:

1. Document common failure cases
2. Define triage steps for billing-state mismatch, webhook failure, and domain consequence issues
3. Define when support can recover directly versus when engineering escalation is required
4. Add operator notes for temporary or corrective actions

Review checklist:

- support guidance is actionable
- escalation boundaries are clear

### Slice 5: Finalize launch and rollback criteria

Implementation tasks:

1. Define launch checklist criteria
2. Define rollout order and monitoring checkpoints
3. Define rollback triggers and safe fallback behavior
4. Define post-launch observation expectations

Review checklist:

- rollout is staged and observable
- rollback decisions are pre-defined rather than improvised

### Slice 6: Close out documentation

Implementation tasks:

1. Update the canonical implementation plan if needed
2. Mark superseded roadmap notes as historical
3. Add references to the recovery and support playbooks
4. Ensure the final roadmap set reflects production truth rather than pre-launch assumptions

Review checklist:

- the docs are usable as operational references
- historical and current authority are clearly separated

## 9) File-By-File Touch Point Map

Phase 6 is intentionally cross-cutting.

### Product-site hardening areas

- `apps/product-site/src/app/(account)/*`
- `apps/product-site/src/app/api/*`
- `apps/product-site/src/lib/*` for billing lifecycle, retry, and reconciliation support

### `hub-platform` hardening areas

- package read-model and entitlement application modules
- account settings package visibility
- custom-domain lifecycle and disconnect logic
- host-resolution and mapping behavior where affected by downgrade

### Documentation areas

- [product-site-and-commercial-platform-implementation-plan-2026-04-20.md](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-and-commercial-platform-implementation-plan-2026-04-20.md)
- [product-site-phase-5-execution-plan-2026-04-20.md](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-phase-5-execution-plan-2026-04-20.md)
- custom-domain roadmap documents
- any new support or launch playbooks added during implementation

## 10) PR Sequencing Recommendation

### PR 1: Regression and consequence hardening

Scope:

- full-lifecycle test expansion
- downgrade and domain consequence verification

Success condition:

- the highest-risk production paths are covered and verified

### PR 2: Recovery and reconciliation tooling

Scope:

- repair/retry tooling
- failure-state inspection
- operational guidance hooks

Success condition:

- stale or failed package updates can be repaired safely

### PR 3: Support and launch readiness

Scope:

- support/operator playbooks
- launch checklist
- rollback criteria
- roadmap/doc closeout

Success condition:

- the team can launch and operate the system with clear procedures

## 11) Engineering Standards For This Phase

### 11.1 Treat launch safety as a product feature

Recovery, rollback, and observability are part of the deliverable.

### 11.2 Verify destructive consequences explicitly

Downgrades, disconnects, and fallback-host behavior must be tested directly, not assumed from code structure.

### 11.3 Keep recovery tooling narrow and auditable

Repair paths should be safe, explicit, and understandable in code review.

### 11.4 Prefer deterministic checks over tribal knowledge

If a failure mode matters, it should be documented and, where possible, testable.

### 11.5 Close the loop between commercial and operational systems

The launch is only successful if both the product site and `hub-platform` behave coherently under success and failure conditions.

## 12) Test Plan

Minimum required checks:

### Full-lifecycle checks

- signup or package change triggers the expected commercial lifecycle
- Stripe event handling leads to correct canonical package-authority updates
- `hub-platform` reflects updated package state correctly

### Downgrade and domain checks

- downgrade off Growth preserves the platform-hosted fallback path
- custom-domain disconnect consequences are correct
- domain-related messaging remains accurate

### Recovery checks

- failed or delayed commercial updates are detectable
- retry or repair logic works safely
- repeated lifecycle events do not corrupt state

### UX/source checks

- product-site and `hub-platform` package messaging remain aligned
- support and launch docs reflect the actual implementation

## 13) Risk Register And Controls

### Risk: the system is feature-complete but not operationally safe

Control:

- make Phase 6 mandatory before production launch
- treat recovery and launch-readiness as delivery requirements

### Risk: downgrade off Growth breaks custom-domain hosting

Control:

- verify downgrade and disconnect behavior directly
- confirm the platform-hosted fallback path remains available

### Risk: failed Stripe updates create silent drift

Control:

- add observability, reconciliation, and repair guidance
- require a detectable failure state

### Risk: support cannot recover issues consistently

Control:

- produce explicit playbooks
- define escalation thresholds and operator actions

## 14) Definition Of Done

Phase 6 is done when:

1. full-lifecycle regression coverage exists for the critical commercial and operational paths
2. recovery or reconciliation tooling exists for failed package updates
3. downgrade and custom-domain consequences are verified explicitly
4. support/operator playbooks are written and usable
5. launch and rollback criteria are documented
6. roadmap and operational docs reflect the final production path
7. lint and all required verification checks are clean

## 15) Recommended Immediate Coding Slice

When coding begins for Phase 6, the first implementation slice should be:

1. add downgrade and custom-domain consequence verification
2. add full-lifecycle regression tests
3. define the failure detection and reconciliation approach
4. draft the support and launch playbooks

This is the highest-leverage first slice because it exposes the highest-risk production gaps before the team treats the commercial platform as launch-ready.

## 16) Final Recommendation

Phase 6 should be treated as the production-readiness milestone.

If implemented well, it will ensure that:

- the system is not only feature-complete, but safe to operate
- failures are recoverable
- downgrade and domain consequences are trustworthy
- the team has a clear path to launch with confidence

That is the standard required for a production-grade SaaS rollout.
