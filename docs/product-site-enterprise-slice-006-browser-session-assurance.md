# Slice 006 — browser and session assurance

Date: 2026-09-07. Status: development verified for bounded account-access closure. Owner: founder. Implementer/reviewer: Codex self-review. Parent: S2-14, DOC-01/02/03/06/07; [master](product-site-enterprise-upgrade-master-plan.md), [slice 005](product-site-enterprise-slice-005-recovery-integration-tests.md).

Scope reassessment: founder interrupted execution to question programme complexity and clarify what is actually needed for launch. Browser harness scaffolding exists; the first run was stopped and no browser acceptance pass is claimed. Initial audit observations below are not implemented corrections. Resume only against the agreed initial-launch scope; do not make all later enterprise capabilities prerequisites for a limited launch.

Closure execution resumed on explicit founder instruction to resolve STOP-01–08. Scope is limited to current account-access closure. Implemented version-2 UID-bound cookies, current raw active-account/Firebase authority on reads and issuance, revocation against original authentication time, no email fallback or stale hub access, strict expiry/shape checks, truthful email status without secret-link logs, and [operator reconciliation](product-site-incomplete-signup-reconciliation.md). Old version-1 cookies intentionally require sign-in again; no account-data migration is required. Added focused regressions (51 total passing at first closure run); browser/emulator final results remain pending. A provider read failure fails closed; this adds a bounded account read and Firebase user lookup for session validation, with no cross-request authority cache. It is not an atomic guarantee against changes after validation.

## Current state and scope

Slice 005 passed 47 focused and 13 emulator integration tests, but replaced the cookie writer and did not render/submit the actual application. This slice exercises the real Next application, browser form, signed HttpOnly cookie, sign-in/out, verification page and interrupted-signup recovery against local demo emulators. Preserve current billing and cross-app provisioning contracts; do not contact real billing/email services or enable live acquisition.

Use an isolated generated application copy without environment files. Replace only Firebase connection adapters in that copy to bind Auth/Firestore to `demo-hubforj-recovery` on loopback. Real signup/session/application code must remain unchanged in the copy. Record all substitutes and limitations; no test-only endpoint or adapter belongs in production source. Test artifacts contain only disposable fixture data. Prepare a reproducible runner and remove processes after checks.

Acceptance: actual browser Free signup; signed HttpOnly/SameSite cookie; reload; verification gating and emulator verification link consumption; sign-out; wrong-password rejection; successful sign-in/recovery after lost internal response; no duplicate workspace; malformed/tampered/expired cookie rejection. Audit current account authority and failure redirects to prevent stale access or redirect loops. Add focused failing regressions before corrections and rerun affected checks. Cookie Secure behavior requires production-mode evidence or explicit focused coverage; localhost development alone is insufficient.

## Initial audit findings to investigate

- `account-session.js` validates signature/expiry but accepts additional token segments and the exact expiry instant. Its payload does not bind an auth UID.
- `commercial-account-context.js` falls back from missing account ID to email and can fall back to stale workspace details from the cookie. It only refreshes Firebase state for unverified accounts; disabled/deleted identities and account status need lifecycle analysis before claiming session revocation.
- Production Firebase adapters require real credentials and do not expose emulator configuration; use test-copy adapters rather than weakening production startup checks.
- Email code generates real action links but logs them and marks verification email sent when Resend is absent. Local emulator link consumption is not proof of email delivery; provider configuration/copy remains a tracked gap.

## Completion and release boundary

Update this specification, shared identity/baseline documents and master with actual results, failures, remediation and remaining gaps. Create the release/operations record with current rollout prerequisites. Paid Stripe sandbox checkout/webhooks, delivered email, full cross-domain owner handoff, baseline failures, distributed abuse controls and deployed rules remain separate evidence gates. No stage or launch approval follows from browser success alone.

## Final closure evidence

52 focused tests, 12 browser checks and 14 emulator integration tests pass. Retained hub dependency checks: 23 passes; cross-app source selection: 22 passes and six pre-existing TODOs. Lint: zero errors/one existing webhook warning. Isolated production build and scoped whitespace checks pass. Real email template delivery was authorized and both messages confirmed in the founder's inbox; emulator verification/reset actions completed without altering an existing real identity. See the [handover](product-site-closure-handoff.md) and [release record](product-site-enterprise-release-and-operations-record.md).

Test harness corrections were necessary: generated source was moved out of node_modules so Next could compile JSX; explicit safe configuration was supplied across WSL/Windows; a loopback TCP relay made Java Firestore reachable; both apps use the same Admin SDK in the shared harness; Free-signup and logout expectations were corrected to match actual routes. These were test-environment corrections, not changes to production redirects or provider adapters. The old unused generated copy is superseded; the final documented harness is repeatable. No further enterprise feature work was started.
