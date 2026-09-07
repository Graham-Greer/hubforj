# Slice 004 — identity-first signup and authenticated provisioning recovery

Date: 2026-09-07. Status: implemented locally; focused checks/build/browser rendering pass; provider recovery and release assurance pending. Parents: S2-14, DOC-02/03; [master](product-site-enterprise-upgrade-master-plan.md). Reviewer: Codex self-review. Address backfill is applied; reservation-aware deployment remains unverified.


## Current repo and scope

Pre-slice signup created account → hub → ownership → Firebase identity → verification email → session → checkout. Implemented flow: account → create-only identity → durable operation → verification email attempt → idempotent hub provisioning and atomic ownership completion → session → optional existing checkout. Hub/ownership failure can strand an unauthenticated customer. Slice 003 protects hub address creation but requires its provider migration before any new hub creation. Both applications use internal bearer authorization for provisioning; commercial sign-in verifies Firebase revocation and permits verified-email fallback only for an unbound account.

Move Firebase create-only identity setup ahead of hub creation. Save an immutable server-created signup operation, bound to account ID and UID, before requesting the hub. Use its random operation ID as the internal provisioning key. Only finalize ownership from the matched provisioning response; commit ownership, account hub references/count, selected-package intent and operation completion atomically. Preserve initial Free entitlements and existing normal signup checkout behavior.

Provide an explicit recovery sign-in route; do not mutate provisioning during ordinary sign-in. Recovery must verify a revoked-token-checked Firebase token with authentication within five minutes, resolve the account using existing binding rules, and recheck active account/UID against the persisted operation. Never trust browser account IDs, email, hub IDs, provisioning keys or replacement payloads. No credentials/tokens in operation storage or action state. A server-generated operation key is deduplication, not authority.

## State and authority

Persist `commercialAccounts/{id}/signupOperations/initial` with version, operationId, authUid, normalized hub payload, selected tier/currency, status (`pending`/`complete`), timestamps and completed hub summary. One immutable initial operation per account. Complete rows are replayable but never create a second hub. Reject changed intent, different UID, deleted/missing/inactive accounts, conflicting owned hubs and unexpected response identity. Transport failures leave pending for explicit retry. No lease needed: internal key and ownership transaction make concurrent same-operation attempts converge.

Fresh signup creates only a new Firebase identity using slice 001 safeguards. Recovery for an already-bound UID can proceed with recent password authentication while verification remains required for admin access; email fallback still requires provider-verified email. Session issuance occurs only after completion on the recovery route. Recovery returns to the account, where paid checkout remains an explicit existing action; no automatic charge/checkout creation on retry.

## Deployment, gaps and QC

Receiver-first rollout and slice 003 migration are prerequisites for enabling this flow. Mixed old receivers may create a hub without acknowledging idempotency; stop and investigate rather than retrying. Retire old signup writers before enabling the new flow. No automatic provider actions or backfills in this slice.

Legacy partial signups have no trusted operation and must not be inferred from email/slug; require separately audited operator reconciliation. Failure before the durable operation is saved (including Firebase identity/UID persistence failure) remains an explicit follow-up; do not claim automatic recovery for that case. Existing-member workspace onboarding, operation retention/deletion, distributed account lifecycle locks, full session invalidation, checkout recovery/reconciliation and legal acceptance remain open parent requirements. Existing custom sessions are not sufficient authority for the new recovery mutation.

Run focused offline tests for fresh signup ordering, no writes for rejected identity, immutable operation/UID binding, account and hub conflicts, concurrent finalization/count, provider failure/replay, recent-auth enforcement and safe internal redirects. Review recovery copy for accurate next steps and limits. The founder superseded testing deferral and now requires checks during implementation. Local build/browser checks are performed below; actual provider recovery, emulator contention and release assurance are still outstanding requirements. Record findings, corrections and final evidence here and in master before handoff.

## Transition table and implemented boundaries

| State/event | Guard | Writes / external effects | Result / retry |
| --- | --- | --- | --- |
| Acquisition disabled | `PRODUCT_SITE_SIGNUP_PROVISIONING_ENABLED` is not exactly `true` | No identity/account/provisioning write | Truthful temporary-unavailability error; ordinary sign-in remains available |
| Fresh valid signup | Existing abuse controls, no existing identity/workspace, paid price validation | Account and new Firebase identity first; never update existing credentials | No hub created on identity failure |
| Save initial operation | Active account, matching UID/email, valid Free provisioning payload, GBP tier intent, no existing workspace | Create versioned immutable random-key operation | Same canonical intent reuses it; changed intent/UID fails |
| Pending provisioning | Persisted operation shape/key valid; recovery additionally requires revoked-token-checked authentication within five minutes and existing abuse controls | Internal keyed hub request | Lost/error response leaves pending; same key reused on explicit retry |
| Pending ownership completion | Matching account/UID/operation, expected Free hub response, no conflicting owned hub | Transaction writes ownership, account references/count, paid intent and operation completion | Concurrent completion converges; failed commit leaves pending |
| Completed recovery | Active bound identity, retained owner link and existing matching hub | No new provisioning/checkout; issue session only after recovery succeeds | Return to account with current hub summary; missing/deleted/transferred workspace fails closed |
| Ordinary sign-in | Existing token/binding rules | Existing session flow only | No implicit recovery; unsafe external/backslash/control-character redirect targets rejected |

Schema remains one `signupOperations/initial` document per commercial account. Firestore map key ordering is not used to compare intent. Stored operation version, UUID, payload defaults and completion summary are validated before use so malformed keys cannot degrade into unkeyed provisioning. Passwords are removed even from invalid signup action state.

Files: product-site signup action/form/recovery page; sign-in form/page; commercial session endpoint and auth; commercial signup operations/recovery modules; environment flag/example and recovery limiter scope; focused auth/server tests. Hub changes this session are verification-only: VM flag in test script, shared fake-database query support, concise reporter, and two updated source assertions.

## Rollout and outstanding safeguards

`PRODUCT_SITE_SIGNUP_PROVISIONING_ENABLED=false` is documented in `.env.example`; absent also means disabled. No `.env.local` value was changed, no production switch enabled and no application deployed. This gates new public signup and authenticated recovery provisioning, not normal sign-in or account management. Platform-admin hub creation uses its existing reservation marker and must still run only on the updated receiver code.

Enable only after checking the receiver protocol, address claims/ready marker, retired old writers, deployed access controls for signup-operation records, distributed abuse controls and isolated provider recovery results. The new recovery limiter uses the existing configurable provider; memory/disabled configuration is not evidence of distributed production protection. Disabled flow was verified locally to reject recovery before token/provider work. Rollback/incident response disables acquisition first; retain operations/claims for reconciliation instead of deleting records or reverting to unsafe identity overwrite.

No operation was written to the real project during this slice. Legacy orphan recovery is deliberately not inferred. Failures before operation persistence still need operator-assisted reconciliation; the error copy does not claim an operation was saved. No legal acceptance, MFA, complete session-revocation, checkout reconciliation or deletion lifecycle is claimed here. Existing account-context/billing code and the 27 baseline failures still require their parent-stage audits.

## QC and evidence

Follow-up 2026-09-07: [slice 005](product-site-enterprise-slice-005-recovery-integration-tests.md) supersedes the focused-test count below with **47 passes**, and adds **13 passing Auth/Firestore emulator integration tests** through actual cross-app production handlers. It fixes completed replay after ownership removal/downgrade and pending completion promoting a non-owner. Browser cookies, email/Stripe delivery, handoff and deployed access controls remain open; original evidence below is preserved as history.

| Finding | Correction | Re-audit |
| --- | --- | --- |
| Hub existed before usable sign-in on failed signup | Identity-first orchestration with saved operation before provisioning | Free/Starter/Growth ordering and rejection tests pass |
| Repeated recovery could duplicate ownership/count or accept another UID | Immutable UID-bound intent and transactional finalizer | Concurrent completion, conflict and abort tests pass |
| Firestore map ordering differs from JS insertion order | Compare canonical field values | Same-intent reuse passes; changed intent rejected |
| Corrupt saved key could reach unkeyed client fallback | Validate stored UUID/payload/version/completion shape | Corruption regression passes |
| Invalid form response exposed password values | Redact both password fields on normalization error | Secret-redaction test passes |
| Session endpoint allowed unsafe return URLs | Reject protocol-relative/backslash/control-character targets | Redirect and normal-internal-path tests pass |
| Automatic recovery would mutate on ordinary sign-in | Explicit recovery intent, recent auth, separate throttle and release switch | Ordinary sign-in has no recovery; disabled/throttled/failed paths issue no recovery session |
| Two broad source assertions referenced superseded implementation details | Preserve invariants while recognizing transactional commit and recovery runner | Full suite no longer adds these two failures; behavior tests remain |
| Initial mobile screenshot used window sizing rather than explicit viewport emulation | Recheck with CDP device metrics | 390px mobile and 1440px desktop: no horizontal overflow |

Final focused selection: **45/45 pass** (Node v24.13.1). Full product source/test lint at recorded run: zero errors, one pre-existing Stripe webhook `console.info` warning; final changed-file lint recorded separately. Production webpack compile and full production build passed, including 19 static-generation entries. Provider credentials were explicitly disabled for the full build; the final stored-operation guard was subsequently verified by focused tests. Browser checks used an isolated headless Edge profile and loopback server, verified heading/inputs/actions and measured overflow, plus an HTTP disabled-recovery check. No real Firebase sign-in, paid checkout, cross-app handoff or provider failure injection was exercised. This is local verification, not complete end-to-end assurance.

Full hub suite: 577 tests, 544 pass, 27 fail, 6 TODO. Isolated tracked-HEAD baseline `e7ee2f24d91924ed053a76fe0099a0b7688bd31c`: 554 tests, 521 pass, the same 27 fail, 6 TODO. All failures are enumerated in [verification evidence](product-site-enterprise-verification-2026-09-07.md), with remediation open. No full stage or release is signed off.
