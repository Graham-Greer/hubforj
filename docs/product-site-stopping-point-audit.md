# Signup/recovery stopping-point audit

Date: 2026-09-07. Reviewer: Codex self-review. Scope: working tree at HEAD `e7ee2f2`, slices 001–006. Parent: [master plan](product-site-enterprise-upgrade-master-plan.md). Audit only: no application fixes, deployments, environment edits or provider writes performed.

## Closure update

STOP-01–08 have been addressed for the agreed development checkpoint: session/identity authority, stale-account/hub handling, tested operator reconciliation, truthful functioning email delivery, strict cookies, completed browser checks and current handover documentation. The findings below are preserved as the pre-fix audit, not current unresolved production-code findings. [Final results and stopping boundary](product-site-closure-handoff.md). Live deployment/access-control checks remain release prerequisites. No Git commit or rollback was performed; untracked files must be included when preserving this checkpoint.

## Verdict

The completed signup/address/recovery implementation does not require future policy, cancellation, deletion or enterprise procurement features to run. It can stand independently. The current tree is nevertheless a development checkpoint, not fully verified account access. Close the bounded gaps below before calling the current implementation complete or enabling acquisition. The larger programme is not required to close them.

## Findings

| ID / priority | Evidence | Disposition |
| --- | --- | --- |
| STOP-01 / High | `commercial-account-context.js:28–44` checks account existence, but not active status/current identity authority. An isolated VM probe returned a closed verified account with zero auth-sync calls. Verified-account requests skip Firebase refresh; the cookie contains no UID or revocation check. Session/context modules are unchanged from HEAD: existing weaknesses, not introduced by the recovery finalizer. | Add bounded session-authority checks and tests for closed/deleted/disabled/rebound/revoked identities. Recent authentication on recovery does not invalidate an already issued cookie. |
| STOP-02 / High | A missing account ID falls back to cookie-email lookup (`commercial-account-context.js:30–32`). A probe returned a replacement account with a different UID after the original ID was absent. Boundary reproduction, not a demonstrated live exploit. | Reject stale session identity; do not reassign an old session to a replacement account by email. |
| STOP-03 / Medium | Missing account redirects to `/signup`; signup redirects a still-valid cookie to `/account/package`. Source-confirmed loop path, not browser evidence. Context also uses stale cookie labels/owned-link data when a hub is absent and does not filter owner relationships. | Deterministic invalid-session handling; verify current hub/ownership before privileged handoff. Downstream actions have separate guards; this audit does not establish that all are exploitable. |
| STOP-04 / Medium | Identity creation can succeed before operation persistence (`signup/actions.js:150–158`). Failure there leaves no operation for recovery, while anonymous identity reuse is correctly rejected. | Supply a tested operator reconciliation procedure or a small authenticated continuation. Do not weaken identity safeguards or assume future deletion will resolve this. |
| STOP-05 / Medium | Missing Resend configuration returns `logged`, logs the action link and marks verification email sent. Signup success/next-steps treat `logged` as delivered and tell users to check their inbox. | Correct delivery status/copy and avoid action-link secrets in normal logs. Verify reset/verification journeys; actual email delivery still needs provider evidence. |
| STOP-06 / Verification | Slice 006 run was interrupted and subsequently reported isolated Next startup timeout: no browser pass. Its scaffold waits for next-steps/account after Free signup, but the actual action redirects to `/signup/success`. No password-reset journey or expiry test exists in that scaffold. | Finish a small correct browser check or use a reproducible manual checklist; do not expand infrastructure or count scaffolding as evidence. |
| STOP-07 / Low | `account-session.js:56–80` ignores extra token segments and accepts the exact expiry instant. Signature checks still apply: no cookie-forgery claim. | Strict token-shape/expiry validation with focused regressions during session closure. |
| STOP-08 / Checkpoint hygiene | Required new modules/tests/docs are untracked alongside unrelated modified files. Older plan/slice text still says signup is unkeyed or full testing deferred. | Preserve all required files in a reviewed checkpoint, excluding secrets/unrelated work. Latest evidence supersedes stale historical statements. A branch alone does not preserve uncommitted files. |

## Dependencies to preserve

- Shared `createHub` calls `hub-provisioning-operations.js` and `hub-address-claims.js`, including platform-admin/unkeyed callers. Creation requires the ready migration marker and claims. Removing the marker while keeping this code blocks creation; existing hub reads are unaffected.
- Product signup persists its operation and sends the idempotency key. The hub receiver must persist keyed operations and acknowledge `idempotency-v1`. An old receiver can create a hub before the client rejects its missing acknowledgement. Verify the receiver first, then the product site, before enabling acquisition.
- Old writers bypass reservations and can invalidate coverage. Earlier confirmation that writers were stopped is historical, not a fresh check that all remain stopped.
- Retain signup operations, hub provisioning operations, claims and migration state. No automatic TTL, claim release or deletion lifecycle was introduced. Conservative address retention does not require future automated deletion to run.
- Signup defaults off in source; normal sign-in remains available. Actual local/deployed environment values were not inspected or changed. Root `firebase.json` references indexes only: deployed rules/IAM remain unverified, and emulator deny-all rules do not establish production protection.
- Historical database evidence: seven claims, one missing hosted label filled and ready marker independently checked. No live read-back in this audit. Code/database rollback must be coordinated; deleting the claims alone is not a rollback.

## Verification

- Reran product auth/server suite: **47 passed, zero failed**.
- Reran hub address/backfill/provisioning selection: **23 passed, zero failed**.
- Two temporary VM probes loaded the actual account-context module with dependency fixtures: closed account accepted; deleted-ID fallback selected a different account. No provider/network access in these probes.
- Prior 13 emulator integration passes remain historical evidence; not rerun here.
- Prior full hub baseline has 27 failures/six TODOs. Classify those affecting current identity, provisioning, routing and handoff; do not automatically require unrelated future-feature remediation for this checkpoint. No full build/browser/provider rerun here.

## Smallest defensible finish

1. Correct session authority/stale-account handling, cookie validation and email delivery status, with focused regressions.
2. Document and test reconciliation for failure before operation persistence.
3. Check actual signup, verification, sign-in/out, password reset and recovery; finish or remove browser scaffolding. Verify hub-access gating; record paid-checkout/provider limits honestly.
4. Record receiver/claim/access-control rollout prerequisites and preserve a complete reviewed checkpoint/handover. No deployment or flag enablement is implied.

Stop the broader programme there if desired. Future policy, cancellation and deletion work remains separate launch/product work, not a runtime dependency. Pausing immediately is also possible with acquisition kept disabled and the checkpoint explicitly labelled unfinished.
