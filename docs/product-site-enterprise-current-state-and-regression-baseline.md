# Enterprise current-state and regression baseline

Created/updated: 2026-09-07. Accountable owner: founder. Engineering: Codex. Status: Stage 0 in progress; focused baseline established, full programme baseline pending.

Parent: [master plan](product-site-enterprise-upgrade-master-plan.md), DOC-01, S0-10/S0-12, S2-14, RA05.

Revision inspected: `e7ee2f24d91924ed053a76fe0099a0b7688bd31c`. Pre-existing changes in hub-platform ESLint config, `mock-users.txt`, `updates-to-make.txt` are out of scope and preserved. Master/audit documents were untracked. No secrets or live customer records inspected.

## Runtime and initial tests

Linux `node` is absent. Installed Windows Node is `C:\Program Files\nodejs\node.exe`, v24.13.1. From WSL use `/mnt/c/Program Files/nodejs/node.exe`; WSL interop requires execution outside the sandbox. Dependencies are already installed. Do not install or replace them without need.

From `apps/hub-platform`, run:

```sh
node --import ./tests/unit/register-aliases.mjs --test tests/unit/package-entitlements-domain.test.js tests/unit/hub-package-contracts.test.js tests/unit/product-site-package-scheduled-change-source.test.js tests/unit/product-site-auth-routing-source.test.js
```

Initial result: 15 tests, 14 pass, 1 fail. The failed marketing-chrome source assertion expects `href="/account/package">Manage package`, while existing JSX has `prefetch={false}` between those attributes. This pre-existing failure is unrelated to identity logic; do not weaken/edit it as part of the security slice. Full build/lint/browser/provider baselines are still pending.

## Identity dependency map

Signup action → validation/rate limit → existing commercial workspace check → Stripe price validation → commercial account reservation → internal hub provisioning → ownership attachment → Firebase identity helper → verification email → signed commercial session → optional paid checkout.

Commercial session POST → revoked-token verification → UID lookup → email fallback → UID attachment → verification-state sync → owned hub selection → signed session.

Firebase owns authentication credentials and revocation. Firestore commercial account `authUid` binds the identity; email alone is not proof of authority. The UID writer currently has only two call sites in commercial auth. Hub owner provisioning/handoff consumes the established identity. Preserve GBP pricing, Free baseline, email verification and revoked-token verification. Do not infer that changing this boundary implements general custom-session revocation or MFA.

## Focused risk and remaining baseline

Existing identity helper overwrites password and clears disabled status. Email fallback can rebind an already-linked commercial account. Address in slice 001. Existing partial provisioning can leave mock account/hub records on provider failure; a full resumable provisioning lifecycle is a separate required slice and blocks declaring onboarding enterprise-complete. Authenticated member-to-owner onboarding is not implemented here.

Next: execute slice 001 tests/QC, record results, then broaden baseline into the remaining billing, legal, host, data, browser and operational matrices in Stage 0.

## Slice 001 verification update

Added `npm run test:auth` in product-site (Node v24.13.1 verified). Equivalent command from `apps/product-site`:

```sh
node --experimental-vm-modules --test tests/auth/commercial-identity.test.js
```

Tests load the production modules unchanged into VM modules and replace imported external boundaries. This Node test-only API requires the experimental flag; production code does not use VM modules. Test support on other Node versions is not established. No environment/secret file, Firebase, Stripe or email service is contacted.

Before guard changes: 15 tests, 4 passed/11 failed, reproducing unsafe mutation/linking and missing preflight/transaction controls. After implementation and QC additions: 19/19 passed, including all three signup tier orchestrations and revoked-token rejection. Existing cross-app selection rerun: same 14/15 pass and same pre-existing marketing source assertion failure. No new failure observed in that selection. This is a focused baseline, not the full repository test result.

Targeted lint initially found five forbidden `module` variable declarations in the test harness. Renamed to `subject`, reran 19 tests successfully; final lint result recorded in slice evidence. Full build/browser/provider verification still pending; do not call the programme launch-ready.

## Slice 002 dependency and verification update

See [slice 002](product-site-enterprise-slice-002-provisioning-idempotency.md) for the opt-in internal provisioning contract, schema, QC and rollout constraints. Internal keyed requests now commit hub, membership plan and operation together. Existing unkeyed signup keeps its original orchestration. No ownership/authentication/billing mutation changed in this slice.

Focused results: hub operation helpers/package mutation source checks 9/9; product-site provisioning client/identity checks 24/24; changed-file lint passes. Initial hub command required correction to use the existing alias loader. Full receiver/mutation integration, Firestore contention, browser/provider/build and broad regression checks are deferred at the founder's request and remain required before release. Deployed Firestore rules must deny direct client access to `hubProvisioningOperations`; the repo has no checked-in rules file establishing this.

## Slice 003 hosted-address update

[Slice 003](product-site-enterprise-slice-003-address-reservations.md) supersedes the slice 002 full-scan workaround. Both platform-admin and internal provisioning call createHub; all new hubs now atomically reserve slug/hosted label with hub and membership plan. Runtime address reads are bounded. Existing records must pass audit/backfill before `platformMigrations/hubAddressClaimsV1` becomes ready; no provider migration was executed. Claims remain reserved when a hub is deleted.

Focused selection: 25/25 tests pass, including actual createHub orchestration against simulated boundaries, custom-domain compatibility, migration partial-failure recovery, legacy collisions and pagination. Targeted lint passes. Real contention, deployed access controls, provider CLI execution and full cross-app verification remain pending; no enterprise-stage sign-off. New schema/rollout details and costs are in the slice runbook.

## Provider migration evidence — 2026-09-07

Slice 003 address backfill applied to `community-app-c2f67` after founder confirmed writer shutdown. Run `c5d858be-3eb5-4911-b038-f09f0d3595d6` completed at 19:33:21 UTC. A separate read-back at 19:33:48 UTC verified seven claims, the one previously missing hosted label, zero coverage issues and marker version 1/status ready. Existing addresses were compared against the refreshed scoped snapshot and preserved. This supersedes earlier no-migration status; deployed writer/access-control verification, contention and full regression remain pending. See the slice 003 completion evidence.

## Slice 004 and expanded baseline

Testing deferral was superseded by the founder: required checks now accompany implementation. [Slice 004](product-site-enterprise-slice-004-signup-recovery.md) is locally implemented with 45 passing focused product tests; full product production build, local Edge mobile/desktop rendering and disabled-recovery HTTP checks pass. Full source/test lint has zero errors and one existing webhook logging warning.

Full current hub selection: 577 tests, 544 pass, 27 fail, 6 TODO. Isolated tracked-HEAD baseline: 554 tests, 521 pass, same 27 fail, 6 TODO. Two changed-boundary assertions were corrected without removing their invariants; no new failure names remain. See the [complete failure register](product-site-enterprise-verification-2026-09-07.md). These failures remain open, not accepted for launch. Recovery flow stays disabled pending actual provider/end-to-end/deployment checks; no provider signup, checkout or new data migration occurred in this slice.

## Bounded closure update

Account-access closure now has 52 focused passes, 12 browser checks, 14 emulator integrations and 23 retained hub dependency passes. Related cross-app selection: 22 passes/six existing TODOs. Isolated production-copy build passes; lint has zero errors/one existing webhook warning. No deployed assurance claimed. See [final handover](product-site-closure-handoff.md) for exact boundaries and deployment prerequisites.
