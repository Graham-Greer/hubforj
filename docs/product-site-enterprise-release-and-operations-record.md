# Product-site closure release record

Scope: account-access closure only, STOP-01–08. Owner: founder. Reviewer: Codex self-review. Status: bounded local closure verified; no deployment/launch sign-off. Parent: [master](product-site-enterprise-upgrade-master-plan.md).

## Deployment boundary

1. Preserve the complete reviewed changes: product-site auth/session, signup/recovery/reconciliation modules, related UI/email changes and tests; hub provisioning route/mutation/operation/address modules; migration tooling and relevant docs. These include currently untracked files. Do not checkpoint unrelated changes or `.env.local`/credentials. No commit or branch operation is implied by this document.
2. Keep acquisition disabled during rollout. Verify current provider address coverage/ready marker against the slice 003 runbook, and confirm no old hub writers remain. Historical backfill verification is not a current production check.
3. Deploy and verify the reservation-aware/idempotency-aware hub receiver before the product-site caller. Preserve claims and durable operation records. Verify deployed rules/IAM protect all server-owned records; the repo's emulator rules are not production assurance.
4. Deploy product-site closure code with the intended session secret and Firebase/Resend/site URL settings. **Version-1 commercial cookies become invalid and users must sign in again.** This is deliberate identity binding, not data migration. Missing/invalid/currently revoked identities fail closed; provider outages do not become permission to access an account.
5. Smoke-check signup, verification, reset, recovery and owner handoff against the deployed hosts before enabling acquisition. The source default remains off. This work does not change deployment or environment settings automatically.

## Operating and rollback notes

- Use [incomplete-signup repair](product-site-incomplete-signup-reconciliation.md) for the documented pre-operation failure only, with explicit target review and the affected account's writers paused. Never overwrite another UID or delete operations to force retries.
- Commercial sessions now require a bounded account read and Firebase user lookup on validation. There is no cross-request authority cache. Failures can make account pages unavailable until the provider recovers. The check does not create an atomic transaction across Auth/Firestore and subsequent business actions.
- Product-site sign-out clears its commercial cookie. Hub sessions remain a separate existing application/session system; this slice does not claim global sign-out across both applications. Future global revocation/deletion work must respect that boundary.
- Pause acquisition first if rollout fails. Retain claims/operation records for review. Do not roll back to identity-overwriting code or old reservation-bypassing writers. Any database rollback requires a fresh comparison against the scoped migration snapshots and coordinated compatible code.
- Temporary test runtimes, generated app copies, logs and delivery evidence are ignored artifacts, not a deployment bundle. No real customer database was used for local tests; only explicitly authorized email delivery used a real provider.

## Real email evidence

The founder authorized Resend credential use and delivery tests to their controlled inbox. A domain-list API request returned 401, but a sending request succeeded; domain-list permission therefore did not establish sending failure. The founder confirmed inbox receipt of the diagnostic message and both actual verification/reset templates.

Actual production email module with real Resend transport and disposable emulator identity: verification message ID `28596b85-e915-4030-953d-6ca0c29a6e15`, reset message ID `10b5e355-47f2-4a7f-a673-17443c258f65`. Both provider-accepted; verification code applied; reset applied; old password rejected; new password accepted; temporary emulator identity/account removed. No existing real identity/password changed. Links used the local test application origin, so this is not proof of deployed URL routing. Provider acceptance alone was not counted as inbox delivery; the founder supplied that confirmation. [Resend email API](https://resend.com/docs/api-reference/emails/send-email), [delivery event meaning](https://resend.com/docs/webhooks/emails/delivered).

## Remaining release-only dependencies

Current deployed host routing, provider state, rules/IAM and reservation-aware deployment are not verified here. Stripe paid checkout/webhooks and wider hub-session lifecycle assurance remain outside account-access closure and must be completed before their relevant public release. The 27 previously recorded hub baseline failures/six TODOs remain classified in the verification register; local closure is not a whole-platform launch approval.
