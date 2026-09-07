# Slice 005 — isolated signup and recovery integration tests

Date: 2026-09-07. Status: development verified for the bounded recovery data/handler scope. Parent: S2-14/S2-15, DOC-02, [master](product-site-enterprise-upgrade-master-plan.md), [slice 004](product-site-enterprise-slice-004-signup-recovery.md). Owner: founder; implementer/reviewer: Codex self-review (no independent sign-off). Repo baseline: `e7ee2f24d91924ed053a76fe0099a0b7688bd31c` plus the existing uncommitted implementation; unrelated changes preserved.

## Scope and safety boundary

Previous evidence used VM-loaded modules and an in-memory transaction model. This slice runs actual production modules against local Firebase Auth and Firestore emulators using the non-live project `demo-hubforj-recovery`. Never load `.env.local`, never use application-default/cloud credentials, never change deployment switches, never send Stripe or email requests. Bind services to loopback. Test startup must reject non-demo project IDs and non-loopback/missing emulator endpoints. Use a fresh test namespace/project dataset; no deletion endpoint may target the real project.

Tools are installed only in ignored local cache folders, not product dependencies. Emulator-only rules/config and a repeatable test entry point belong in the repo. Where framework boundaries need stubbing, record them explicitly: cookies/redirect, verification-email delivery and checkout. Do not describe simulated Stripe/email as provider verification.

## Cases and acceptance

Run fresh Free/Starter/Growth signup orchestration, identity rejection, token checks, concurrent recovery using real transactions, lost response after committed hub creation, ownership conflicts, corrupt operation, completed/deleted workspace and initial provisioning gate. Verify only one hub/default plan/owner link and no automatic checkout on recovery. Read raw stored records to verify account count and unchanged unrelated ownership data. Cover actual cross-app normalization and internal receiver handling, not a prebuilt response fixture. Forced commit-abort, alternate-UID and old/revoked-token checks additionally retain their focused unit-test evidence; emulator coverage must not be claimed for those injected unit scenarios.

Any failing case must be diagnosed, fixed in the shared production path and rerun along with affected unit tests. Audit remaining races and provider limitations. Update master progress, slice evidence and copy/specs if behavior changes. Deployment, actual Stripe checkout/handoff and full launch assurance remain separate gates.

## Findings and remediation

| Finding | Evidence before correction | Correction / tradeoff |
| --- | --- | --- |
| Completed finalizer trusted a saved result after ownership removal/downgrade | Added unit regression failed with missing expected rejection | Re-read the owner link inside the same transaction before returning a completed result. Adds one bounded document read on completed finalization. |
| Pending finalizer could promote an existing non-owner relationship | Added unit regression failed with missing expected rejection | Reject non-owner relationships in the existing bounded ownership query. Preserve the relationship and pending operation for review; no additional query. |
| Integration test changed a startup-only flag after config import | Test returned 200 instead of expected 503 | Correct the harness: a separate process imports production handlers with the disabled flag already set. No production configuration behavior changed. |
| Windows portable Java failed before tests started | Runtime launch error; no application test executed | Run native Linux Node 24.13.1 and Temurin Java 21.0.12.1+1 with CLI 15.29.0 / Firestore emulator 1.22.0. Keep portable runtimes outside tracked source. |

Production changes are confined to `commercial-signup-operations.js`. No schema migration or backfill is needed. Valid fresh signup and valid repeated completion preserve their contracts; stale ownership now requires review. An absent ownership link is still expected for pending first completion, so the guard cannot distinguish a historical deletion during that earlier state without lifecycle tombstones. That broader lifecycle design remains open.

## Verification and remaining gates

Repeatable entry point: `npm run test:integration`; [setup and exact substitutes](../apps/product-site/tests/integration/README.md). The emulator runner creates a credential-free environment and uses only the demo dataset. Neither application's `.env.local` was loaded or changed. No live signup switch, real provider record, billing action, email delivery or deployment was changed.

Focused auth/server suite after both fixes: **47 passed, zero failed**. Final emulator run: **13 passed, zero failed/skipped/TODO**, CLI exit 0; services shut down cleanly. Both ownership defects were reproduced with failing unit regressions before correction and verified after correction in unit and emulator tests. The first emulator run after harness import fixes passed 11 cases but failed the incorrectly constructed runtime-flag test; correcting startup isolation produced the final passing run, including the additional pending-relationship regression. Changed-file lint passed with zero errors/warnings; scoped whitespace validation passed. Lint covered the production finalizer, its focused tests and the integration harness.

Still outside this slice: real Next cookie issuance/browser submission, verification email delivery, Stripe test-mode checkout/webhook continuation, cross-domain hub handoff, deployed rules/IAM, distributed throttling, auth revocation between the initial check and session issuance, and lifecycle changes after transactional completion. The existing 27 hub baseline failures / six TODOs remain open; no hub code was changed in this slice and the full hub suite was not rerun. Prior build/browser evidence is historical; no new build or browser journey is claimed. No complete stage or public launch is signed off.

Next action after passing this slice: test the actual browser/session, verification and paid-checkout/handoff journey in a dedicated sandbox, then remediate affected baseline/release controls before enabling acquisition. Continue pre-operation orphan reconciliation and lifecycle safeguards through their planned slices.

## Setup references

Firebase recommends demo projects for isolated emulator tests; current Firestore emulator requires Java 21 or newer. [Emulator connection guide](https://firebase.google.com/docs/emulator-suite/connect_firestore), [installation guide](https://firebase.google.com/docs/emulator-suite/install_and_configure).
