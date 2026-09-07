# Product-site account-access handover

## Stopping point

The agreed account-access closure is **development verified**. Stop the wider enterprise programme here unless the founder requests another refinement. This checkpoint does not require future policy, cancellation or deletion features to function and is not a public-launch approval.

Completed: current active-account/UID/revocation checks; strict version-2 signed cookies; no stale-session email fallback or stale/non-owner workspace access; functioning verification/reset email paths with truthful delivery status; tested operator repair for an identity created before setup persistence; browser signup/recovery and one-time owner handoff checks. Old commercial cookies require users to sign in again.

## Evidence

- Product auth/server tests: **52 pass**.
- Actual Next/Edge browser checks: **12 pass**, covering signup, HttpOnly cookie/reload, verification, unverified admin denial, correct owner handoff and reuse rejection, logout, wrong/correct passwords, reset invalidating old cookie/password, used-link denial, tampered-cookie denial, interrupted-signup recovery and mobile overflow checks (some checks group related assertions).
- Auth/Firestore emulator integration tests: **14 pass**, including pre-operation repair, Free/Starter/Growth orchestration, lost responses, real concurrent transactions and ownership guards.
- Hub address/provisioning regression tests: **23 pass**.
- Related cross-app source checks: **22 pass, zero fail, six pre-existing TODOs**.
- Product source/tests/scripts lint: zero errors, one existing Stripe webhook logging warning. Scoped whitespace checks pass.
- Isolated production-mode build: pass, including 19 static-generation entries. Firebase connection adapters and email transport are test-copy substitutions; real application pages/actions/session code is compiled. Original environment files are not loaded by that build.
- Real Resend verification/reset templates: provider accepted both; founder confirmed both in inbox; test verification and reset codes applied; old password rejected/new accepted. Only a disposable local Firebase identity was changed and then removed. Details: [release record](product-site-enterprise-release-and-operations-record.md).

## Preserve before switching branches or chats

Commit selection reviewed against the current working tree: **75 files** (14 hub-platform, 45 product-site, 16 docs). Exact paths are in the ignored local artifact `apps/product-site/.browser-test/commit-files.txt`. Stage with `git --literal-pathspecs add --pathspec-from-file=apps/product-site/.browser-test/commit-files.txt` from the repository root, then review `git diff --cached --stat`. Excluded: `mock-users.txt`, `updates-to-make.txt` and the line-ending-only change in `apps/hub-platform/eslint.config.mjs`. No staging or commit was performed by this selection review. The manifest describes this snapshot; review any later changes separately.

Work remains in the working tree, including untracked required modules, tests, scripts and docs. No commit/reset/branch operation was performed. Save the complete reviewed implementation before any reset; a branch alone is not a backup of uncommitted changes. Keep secrets and unrelated pre-existing edits out of the checkpoint (`mock-users.txt`, `updates-to-make.txt`, hub eslint changes were not part of this closure).

Preserve both apps' signup/address/provisioning changes from slices 001–005 and the product-site closure changes. Test tools live under `tests/browser`, `tests/integration` and `tests/server`; the operator entry point is `scripts/reconcile-commercial-signup.mjs`. Ignored generated copies/caches are not product code. [Browser instructions](../apps/product-site/tests/browser/README.md), [repair runbook](product-site-incomplete-signup-reconciliation.md).

## Deployment prerequisites, not more feature work

No live flag/environment/database change or deployment was performed during closure. The earlier provider address backfill remains a historical applied change. Before deploying/enabling signup, recheck its current claims/ready marker, retire old writers, deploy the compatible hub receiver first, verify deployed access controls and smoke-check the actual hosts. Keep durable operations and reservations. See [release/rollback sequence](product-site-enterprise-release-and-operations-record.md).

Full hub admin UI, deployed cross-domain routing, Stripe paid checkout/webhooks and global cross-app session revocation were not signed off here. The full hub suite's earlier 27 failures remain tracked; the relevant targeted subset added no failures. Policies, cancellation and deletion remain separate future product refinements. These boundaries must not be described as completed simply because the current account-access work is closed.
