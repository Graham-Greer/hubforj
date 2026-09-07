# Product-site closure release record

Scope: account-access closure only, STOP-01–08. Owner: founder. Reviewer: Codex self-review. Status: bounded local closure verified; no deployment/launch sign-off. Parent: [master](product-site-enterprise-upgrade-master-plan.md).

## Deployment boundary

### Current rollout checkpoint

- Verified local commit `615000d` on `Superadmin-enhancements`: its 75 changed paths exactly match the reviewed commit manifest. Only the three excluded pre-existing edits remained before this documentation update.
- Founder reports adding `PRODUCT_SITE_SIGNUP_PROVISIONING_ENABLED=false` in Vercel. Environment scope, deployment adoption and actual hosted behavior remain unverified; adding the setting is not evidence that an existing deployment uses it.
- Push status and deployment status for both apps have been requested. Neither app has a local `.vercel` project link, and this session has no Vercel connector. Hosted settings/build status cannot be inferred from local configuration.
- Next: establish deployed revisions, recheck current database coverage/marker and access controls, then follow the receiver-first rollout and hosted smoke checks below. No hosted setting or deployment changed by this checkpoint.

### Hosted check following founder's push/deployment confirmation

Founder confirms the commit was pushed and Vercel deployed from it; exact project/environment/domain association remains to be checked. Direct unauthenticated HTTPS requests, repeated with unique query strings and `Cache-Control: no-cache`, found `/signup/recover` returns HTTP 404 on `www.hubforj.com`; the apex redirects there and also returns 404. This conflicts with the recovery page present in `615000d`, which has no environment gate hiding the route. Sign-in and forgot-password return HTTP 200. `/account` returns an account shell in an unauthenticated HTTP response; no customer data was observed, and HTTP status alone does not establish an authorization bypass (Next can stream redirects).

Do not treat this as a verified deployment of the new code or enable acquisition yet. Confirm both Vercel projects' successful deployment revisions, Production/Preview designation and domain assignment. Request the hub-platform URL and product-site deployment URL to distinguish a preview-only deployment, older production alias or build/routing issue. No account creation, credential submission, email send or provider mutation was performed in these hosted checks. Current hosted signup gate remains unverified.

Founder subsequently confirms both apps deployed successfully and supplies a hub branch deployment URL. Read-only requests to that host's root and internal provisioning route redirect to `vercel.com/login`; the final HTTP 200 is the Vercel login page, not application success. The supplied toolbar query code was neither used nor recorded. Deployment protection prevents unauthenticated inspection at this URL; this result does not establish the receiver's revision, protocol or production domain assignment. Obtain the product-site deployment URL and both deployments' Production/Preview designation before selecting the next rollout action. Do not disable deployment protection merely to pass a check.

Founder reports that authenticated access to the hub deployment produces HTTP 500 `MIDDLEWARE_INVOCATION_FAILED`, request `lhr1::jbzdd-1788819590414-0f34e8522782`. This is an active rollout blocker despite successful build status. Source review: middleware and its runtime-config module were not changed by `615000d`; Vercel deployment hosts are classified as custom-domain candidates, and the enabled custom-domain resolver has uncaught fetch/JSON failure paths. These are investigation leads, not a confirmed cause. Obtain the runtime exception/stack from the supplied request log before selecting a correction; no speculative middleware or environment change has been made.

### Middleware correction after runtime log review

Founder supplied `SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON` from the deployed runtime. The custom-domain middleware lookup parsed any successful response as JSON; an HTML response therefore crashed it. Vercel login HTML is the likely source given the independently observed protection redirects, but the exception alone does not identify the HTML origin.

Local correction in `apps/hub-platform/src/middleware.js`: do not follow resolver redirects; require JSON content type; catch malformed JSON, fetch and timeout failures; bound the request to five seconds; accept only a found mapping with a nonempty string hub slug. Unexpected content and exceptions emit fixed warnings without response bodies, credentials or customer details. Failures retain the existing unresolved-host behavior used for non-OK responses; they do not fabricate a tenant or bypass application authorization.

QC: 15 focused tests pass, exercising the actual middleware with simulated framework/fetch boundaries and actual hostname classification. Includes HTML, mislabeled malformed JSON, protection redirect, provider error, network failure, timeout rejection, absent/invalid mappings, valid rewrite and canonical redirect, disabled/unconfigured lookup, API bypass and hosted-subdomain rewriting. These checks do not establish deployed Edge behavior or successful custom-domain resolution behind deployment protection. The protected internal API remains protected; a fresh hub deployment and authenticated smoke check are still required. No database/environment changes or deployment performed for this correction.

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
