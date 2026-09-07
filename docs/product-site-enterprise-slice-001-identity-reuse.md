# Slice 001 — prevent unauthorised commercial identity reuse

Created/updated: 2026-09-07. Owner: founder. Engineering/reviewer: Codex (self-review). Status: implemented; focused behavioural verification passed; final QC evidence below. Not deployed or launch verified.

Parents: DOC-02, S2-14/RA05; [master](product-site-enterprise-upgrade-master-plan.md), [baseline](product-site-enterprise-current-state-and-regression-baseline.md), [identity contract](product-site-enterprise-identity-and-access-spec.md).

## Before / after

Before: anonymous signup can update an existing Firebase user's credentials/disabled status; email fallback can overwrite account binding. After: signup rejects existing identities, provider lookup errors fail closed, fallback requires verified ownership and attachment rejects conflicts transactionally.

Files: product-site commercial auth, signup action, commercial account UID writer; isolated auth tests and a focused package test command. No hub logic, billing, public styling, data reset or live provider operation.

## Acceptance and verification

1. New signup creates an unverified identity with supplied credentials and attaches UID; existing UID/email/disabled user never triggers credential updates.
2. Lookup errors other than user-not-found do not trigger identity creation. Firebase duplicate creation fails without retrying credential mutation.
3. Signup preflight rejection occurs before account/hub writes, session issuance and checkout.
4. Revoked-token verification remains enabled. UID lookup succeeds without email fallback; unverified email fallback fails. Verified unbound fallback succeeds; different existing UID fails.
5. UID persistence transaction rejects missing accounts/conflicts, accepts identical binding and checks current persisted state, not just stale caller state.
6. Behaviour tests execute the actual modules with synthetic external dependencies, no real Firebase/Stripe/email. Add tests before implementation and demonstrate their failures on old code. Retain unrelated baseline failure evidence.
7. Run focused lint, affected regressions and final diff/QC; document residual limits without marking S2-14 fully complete.

## Deployment / recovery

No schema change; product-site only. No automatic deployment. Rolling versions mean the old credential-overwrite path remains unsafe until retired; release validation must confirm all instances serve the guarded code. Prefer fix-forward; do not deliberately restore unsafe identity mutation as a normal rollback. Existing hub sessions and data are not altered by this patch.

## QC and evidence

Production guard changes implemented in commercial auth, signup and transactional UID attachment. Existing Firebase identities are not updated by anonymous signup; availability preflight precedes provisioning; conflicts are rechecked in a Firestore transaction. No migration/provider configuration required.

| Finding | Corrective update | Re-audit evidence |
| --- | --- | --- |
| Unsafe credential reuse and email rebinding | Create-only signup, verified email fallback, conflict checks and transactional attachment | Initial 11 failing tests now pass |
| Initial tests lacked full action happy paths and revoked-token failure | Added fresh Free/Starter/Growth orchestration and revoked-token rejection cases | Expanded suite 19/19 pass after final harness change |
| Test harness used forbidden `module` variable names | Renamed variables to `subject`; no lint rule disabled | Targeted lint exited 0 with no findings after rename |
| Shared regression suite has pre-existing brittle marketing assertion | Kept test and unrelated JSX unchanged; recorded baseline mismatch | Before/after both 14/15, same failure |

Tradeoffs still open: authenticated existing-member workspace creation is not delivered; failed/concurrent provisioning can leave mock records; durable signup recovery is a follow-up. VM tests verify production module behaviour with synthetic provider boundaries, not Firebase transactions under real contention. Real provider integration, full build and browser walkthrough remain required before live release. No full stage is marked complete. Error copy scope/review is in [DOC-06](product-site-enterprise-copy-and-design-spec.md).

Final scoped `git diff --check` passed for product-site and the master plan. Supporting-document links passed validation. Global diff checks also report pre-existing CRLF whitespace in the founder's unrelated files; those files were preserved. No full build or live deployment was attempted.
