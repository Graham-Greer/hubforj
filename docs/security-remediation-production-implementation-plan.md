# Security Remediation Production Implementation Plan

## Objective

Close the audited security gaps across:

- `apps/product-site`
- `apps/hub-platform`
- hub public/member routes served from `hub-platform`

The outcome should be a safer launch posture without breaking existing product flows:

- SaaS signup and GBP package billing
- product-site account management
- hub owner/admin onboarding
- hub public member join/sign-in
- event/course booking and enrolment
- Stripe Connect payments inside hubs
- booking notification automation
- custom-domain runtime behaviour

This plan is intentionally phased so we tighten the highest-risk entry points first, preserve current domain/data behaviour where possible, and add tests around every security boundary we change.

## Current Audited State

### What is already strong

1. Stripe webhook routes verify Stripe signatures with `stripe.webhooks.constructEvent`.
2. Custom product/hub sessions are HMAC-signed.
3. Main session verification uses timing-safe comparison in the shared session modules.
4. Public/member server actions generally re-check the current member session and hub membership before mutating member-owned records.
5. Rich text is stored as structured content and rendered through React nodes rather than arbitrary HTML.
6. Media upload has an existing 10 MB domain-level cap.
7. Sensitive Firestore access is mostly server/Admin SDK based, with Firebase client usage mostly limited to Auth.

### Primary gaps to close

1. Some admin and platform server actions rely on page/layout access instead of action-level authorization.
2. Internal automation credentials are split between `INTERNAL_AUTOMATION_TOKEN` and `INTERNAL_AUTOMATION_SECRET`.
3. Stripe Connect webhook reconciliation needs explicit connected-account ownership checks before mutating hub records.
4. Upload validation needs stricter allowlists and file-signature checks.
5. Both apps need baseline security headers and a carefully tested CSP.
6. Public signup/reset/join surfaces need abuse controls.
7. Repo/Firebase deployment hygiene needs tightening so secrets/rules/indexes are not accidentally mishandled.

## Non-Negotiable Implementation Principles

1. Do not rely on page layouts for mutation security.
- Every server action and API route that mutates data must authorize itself.

2. Treat hidden form fields as untrusted.
- `hubId`, `eventId`, `courseId`, `memberId`, and similar values must be cross-checked against the authorized hub/user context.

3. Preserve role-specific authorization, not just hub-level authorization.
- A generic hub operator guard proves the actor can access the hub admin area.
- Sensitive owner-only or superadmin-only actions must still enforce their stricter role requirements.
- Examples include ownership transfer, admin suspension/reactivation, support-mode entry, platform hub creation, and platform-level invite actions.

4. Preserve existing product behaviour unless the behaviour itself is unsafe.
- We should add guards around existing domain/data calls before rewriting domain logic.

5. Add tests before or alongside security changes.
- Source tests are acceptable for broad enforcement.
- Domain/helper tests are preferred for reusable guards.
- Behaviour tests should cover high-risk mutation and webhook paths.

6. Fail safely and visibly.
- Unauthorized actions should not mutate.
- Stripe account mismatches should not be silently ignored.
- Upload validation should return clear user-facing errors without leaking internals.

7. Keep launch language and regional decisions unchanged.
- This plan is security-focused and should not reopen product-site billing currency or hub regionalization decisions.

8. Avoid partial-security refactors.
- If a helper is introduced, all matching entry points should migrate in the same phase unless explicitly documented.
- Do not leave old and new security patterns mixed without a compatibility reason.

## Pre-Implementation Decisions

These decisions should be treated as locked before Phase 1 starts.

1. Server actions and API routes are both in scope.
- The audit found server-action gaps, but the principle applies to every cookie-authenticated or mutation-capable API route too.
- Phase 1 must inventory and protect both `actions.js` files and `route.js` mutation handlers.

2. Preserve current role semantics unless a separate product decision changes them.
- Do not use this security remediation to broaden admin permissions.
- If a current action is owner-only, keep it owner-only.
- If the current policy is unclear, pause that specific action and document the chosen rule before implementation.

3. Product-site has less existing test infrastructure than hub-platform.
- Phase 0 should not block forever on creating a full product-site unit-test harness.
- For product-site, use focused source tests, lint/build checks, and targeted manual QA where unit coverage is not already available.

4. Rate limiting provider choice is deferred until Phase 6.
- Do not add a fake production limiter earlier just to satisfy the plan.
- Earlier phases should avoid introducing abstractions that assume a specific provider.

5. CSP is allowed to be split from baseline headers.
- Baseline headers are expected in Phase 5.
- CSP should ship only if QA confirms it does not break auth, Stripe, media, or custom-domain routing.

## Phase 0: Safety Baseline And Test Harness

### Goal

Create a regression safety net before changing security boundaries.

### Implementation steps

1. Record current command baseline:
- `apps/hub-platform` unit tests
- `apps/hub-platform` lint/build if currently reliable
- `apps/product-site` lint/build if currently reliable
- product-site manual smoke checks for signup/sign-in/billing if there is no equivalent unit-test harness

2. Add source-level tests for security enforcement:
- Admin action files import/use a shared hub action access guard.
- Admin mutation API routes import/use the correct hub action or route access guard.
- Platform action files import/use a superadmin action guard.
- Platform mutation API routes import/use the correct superadmin route guard.
- Internal automation code references the canonical automation secret name.
- Stripe Connect webhook code calls the ownership assertion helper.
- Upload code uses the shared upload policy validator.

3. Add helper/domain tests:
- Action access guard returns hub/access for valid operator/admin context.
- Action access guard rejects missing access.
- Hub id cross-check rejects mismatched hidden `hubId`.
- Automation secret comparison rejects empty, placeholder, wrong, and short production values.
- Upload policy detects safe and unsafe file signatures.

### Acceptance criteria

- Baseline command results are known.
- New tests describe the desired security posture.
- No application behaviour is changed in this phase except tests/docs.

### Phase 0 Implementation Notes

Status: implementation pass complete; local verification pending.

Baseline commands attempted from `/mnt/c/local/community-app` on 2026-06-08:

- `apps/hub-platform`: `npm run test:unit`
- `apps/hub-platform`: `npm run lint`
- `apps/product-site`: `npm run lint`

Current local shell result:

- All three commands fail before app code runs with `WSL 1 is not supported. Please upgrade to WSL 2 or above. Could not determine Node.js install directory`.
- This is an execution-environment limitation, not a product test failure.
- Re-run these commands from the working PowerShell environment or a WSL 2 shell before Phase 1 changes are merged.

Phase 0 scaffold added:

- `apps/hub-platform/tests/unit/security-remediation-phase0-source.test.js`
- Active checks confirm the remediation inventory files exist and both Stripe webhook routes keep signature verification in the baseline.
- TODO source tests define the desired future posture for admin action guards, admin route guards, platform action guards, internal automation secret naming, Stripe Connect ownership assertions, and upload policy validation.
- The TODO checks should be converted into active assertions in the phase that implements each control.

### Tradeoffs

- Source tests can be brittle if file structure changes, but they are useful here because the risk is missing authorization calls entirely.
- Behaviour tests should still be added for core helpers so we are not relying only on text matching.

## Phase 1: Action-Level Authorization

### Goal

Ensure all admin/platform mutation entry points authorize themselves, independent of the page/layout that rendered the form.

### Current risk

Some server actions mutate records after only loading a hub by slug or accepting hidden form fields. Server actions can be invoked directly, so layout protection is insufficient. Cookie-authenticated API routes have the same boundary requirement.

### New shared helpers

Create a hub action guard, for example:

```js
requireHubOperatorActionAccess(hubSlug)
```

It should:

- normalize and require `hubSlug`
- load the hub by slug
- call `getCurrentHubOperatorAccess(hub)`
- reject if no access exists
- return `{ hub, access, actorId }`

Create role-aware variants or options where needed, for example:

```js
requireHubOwnerActionAccess(hubSlug)
requireHubAdminActionAccess(hubSlug, { allowedRoles: ["owner", "admin"] })
```

These should:

- reuse the same hub/session resolution
- enforce role-specific restrictions after hub access is established
- preserve existing owner-only semantics for dangerous admin-management actions

Create a cross-check helper, for example:

```js
assertActionHubIdMatches(hub, submittedHubId)
```

It should:

- allow empty submitted hub id only where the action can safely derive hub id from slug
- reject any submitted hub id that does not equal the authorized hub id

Create a platform guard, for example:

```js
requirePlatformOperatorActionAccess(nextPath)
```

It should:

- call `requireCurrentSuperadminSession(nextPath)`
- return `{ operatorSession, actorId }`

Create route/API variants where needed, for example:

```js
requireHubOperatorRouteAccess(request, hubSlug)
requirePlatformOperatorRouteAccess(request)
```

These should:

- use the same authorization semantics as server actions
- optionally include origin checks for browser-cookie authenticated routes
- not be applied to Stripe webhooks or internal automation routes that use signature/bearer-secret authentication

### Modules to update

#### Hub admin actions

Apply the hub action guard to:

- admin events create/edit/delete
- admin recurring event series edit/delete
- admin event registration/payment/attendance mutations
- admin courses create/edit/delete
- admin course registration/payment/attendance mutations
- admin member detail mutations
- admin site/settings mutations
- admin custom-domain actions
- admin testimonials mutations
- admin what-we-do mutations
- any admin actions currently relying only on layout protection

Actions that already use `getCurrentHubOperatorAccess` should either keep that pattern or migrate to the shared guard for consistency.

Actions that require stricter roles must use role-aware guards:

- ownership transfer should remain owner-only
- admin suspend/reactivate should remain owner-only if that is the existing policy
- custom-domain destructive actions should require admin/owner access and may require owner-only confirmation if the current product policy expects that
- support-mode operations should remain superadmin-controlled

#### Platform actions

Apply the platform guard to:

- platform hub creation
- platform admin invite creation
- support-mode mutation actions where not already protected

#### Cookie-authenticated API routes

Inventory and protect mutation-capable browser API routes, including:

- admin onboarding and payments helper routes
- media upload
- member avatar upload/delete
- auth/session exchange routes where origin checks are appropriate

Do not apply browser-cookie origin checks to:

- Stripe webhook routes
- internal automation routes
- public read-only routes

### Behaviour preservation

1. Keep existing redirects and success/error messages unless they leak security-sensitive details.
2. Replace hardcoded actor ids like `"hub-admin"` with the resolved `access.actorId` where possible.
3. Continue to support superadmin support mode through `getCurrentHubOperatorAccess`.
4. Do not change domain/data validation logic unless action boundaries expose a direct mismatch.
5. Do not accidentally broaden permissions by replacing a stricter local check with a generic hub-access check.

### Tests

1. Source tests for all admin action files requiring the shared guard.
2. Source tests for all admin mutation API routes requiring the route guard or equivalent authorization.
3. Source tests for all platform action files requiring superadmin guard.
4. Source tests for all platform mutation API routes requiring superadmin guard.
5. Helper tests for hub-id mismatch.
6. Role tests for stricter actions:
- owner-only actions reject non-owner admins
- superadmin-only actions reject hub admins
- support-mode actions still require superadmin support context
7. Regression tests for representative admin mutation actions:
- unauthorized request does not mutate
- mismatched hidden hub id does not mutate
- authorized request still succeeds

### Acceptance criteria

- Every mutation action authorizes at action level.
- Cookie-authenticated mutation API routes authorize at route level.
- Hidden hub ids are cross-checked or removed where redundant.
- Existing role-specific restrictions are preserved.
- Existing member/public flows still pass tests.
- Existing admin functionality is preserved when authorized.

### Phase 1 Implementation Notes

Status: implementation pass complete; local verification pending.

Shared guard scaffold added:

- `apps/hub-platform/src/lib/auth/action-access.js`
- Hub action guards now centralize hub lookup, current operator access, actor id resolution, role-aware restrictions, and hidden hub-id cross-checking.
- Platform action guard now centralizes superadmin session enforcement for platform mutations.
- Route guard variants are available for browser API routes, including a hub-object variant for hub-id based upload routes.
- Superadmin support mode remains supported by the hub operator boundary.

Migrated action and route set:

- Admin events create/update/delete.
- Admin recurring event series update.
- Admin event registration/payment/attendance mutations.
- Admin courses create/update/delete.
- Admin course registration/payment/attendance mutations.
- Admin member detail mutations.
- Admin settings and custom-domain actions.
- Admin legal settings action.
- Admin regional onboarding action.
- Admin payments actions and Stripe setup actions.
- Admin owner-only access-management and invite actions, preserving owner-only semantics.
- Admin testimonials mutations.
- Admin what-we-do mutations.
- Platform hub creation, platform admin invite creation, and support-mode entry.
- Admin onboarding API route.
- Admin payments account-session and sync API routes.
- Admin media upload API route.
- Admin event/course attendance export routes.
- Admin payments export route.

Source regression coverage added:

- `apps/hub-platform/tests/unit/security-remediation-phase1-source.test.js`
- The test covers the migrated Phase 1 action/route set and rejects legacy page-level auth patterns in those files.

Still remaining in Phase 1:

- Decide whether to add explicit same-origin checks for browser-cookie mutation API routes after the shared authorization pass is complete.
- Run `npm run lint` and `npm run test:unit` from the working PowerShell/Node environment.
- Complete targeted manual smoke checks for authorized admin event/course/settings/payments/media flows.

### Tradeoffs

- This adds boilerplate to action modules. The shared helper should keep it readable.
- Some tests may need updating because actor ids become real user ids instead of `"hub-admin"`.

## Phase 2: Internal Automation Secret Consolidation

### Goal

Use one canonical internal automation credential across product-site and hub-platform.

### Canonical name

Use:

```txt
INTERNAL_AUTOMATION_SECRET
```

### Migration strategy

1. Update `product-site` to read `INTERNAL_AUTOMATION_SECRET`.
2. Temporarily allow fallback to `INTERNAL_AUTOMATION_TOKEN` in non-production only.
3. Update `hub-platform` custom-domain runtime code to use `getServerEnv().internalAutomationSecret`.
4. Remove direct reads of `process.env.INTERNAL_AUTOMATION_TOKEN`.
5. Update `.env.example`, README, roadmap docs, and operational notes.

### Secret validation

Add helper behaviour:

- reject empty secret
- reject `"replace-me"`
- in production, reject short secrets
- use timing-safe equality for request comparison
- support `Authorization: Bearer <secret>` as the primary transport
- do not return diagnostics that reveal whether a specific secret format was close to valid

### Routes affected

- product-site provisioning calls into hub-platform
- product-site owner-admin provisioning calls
- product-site package-authority sync
- hub-platform custom-domain internal routes
- hub-platform provision-hub route
- hub-platform provision-owner-admin route
- hub-platform update-package-authority route
- hub-platform booking notification processor route
- hub-platform middleware internal custom-domain lookups

### Tests

1. Source test that app code no longer directly reads `INTERNAL_AUTOMATION_TOKEN`.
2. Helper tests for valid/invalid secret states.
3. Route/source tests for timing-safe comparison or shared auth helper use.
4. Integration-style test or source test proving product-site and hub-platform both use the same env key.

### Acceptance criteria

- Both apps document and use `INTERNAL_AUTOMATION_SECRET`.
- Old token naming is removed from production code.
- Placeholder secrets cannot silently protect production routes.
- Existing local internal automation flows still work after `.env.local` is updated.
- Custom-domain middleware, product-site provisioning, and booking notification processing all use the same authorization helper or equivalent timing-safe validation.

### Phase 2 Implementation Notes

Status: implementation pass complete; local verification pending.

Canonical secret consolidation completed:

- Product-site server env now exposes `internalAutomationSecret` from `INTERNAL_AUTOMATION_SECRET`.
- Product-site allows `INTERNAL_AUTOMATION_TOKEN` only as a non-production fallback in the config layer.
- Product-site provisioning, owner-admin provisioning, package-authority sync, and account-session fallback now use `internalAutomationSecret`.
- Hub-platform custom-domain runtime and middleware now use `getInternalAutomationSecret`.
- Hub-platform internal automation domain helper now validates missing, placeholder, and weak production secrets.
- Hub-platform internal automation authorization now resolves `Authorization: Bearer <secret>` first, supports `x-internal-automation-secret` as a fallback transport, and compares with `timingSafeEqual`.
- Booking notification processor route now uses `getInternalAutomationAuthorizationState` instead of direct string comparison.

Documentation and examples updated:

- `apps/product-site/.env.example`
- `apps/product-site/README.md`
- hub-platform custom-domain roadmap notes

Source regression coverage added:

- `apps/hub-platform/tests/unit/internal-automation-secret-consolidation-source.test.js`
- `apps/hub-platform/tests/unit/internal-automation-domain.test.js`
- `apps/hub-platform/tests/unit/booking-notification-phase6-source.test.js` updated for shared auth helper usage.

Local follow-up required:

- Rename any local `INTERNAL_AUTOMATION_TOKEN` entries to `INTERNAL_AUTOMATION_SECRET`.
- Ensure product-site and hub-platform use the same secret value.
- In production, use a generated secret of at least 32 characters and never `replace-me`.

### Tradeoffs

- Removing `INTERNAL_AUTOMATION_TOKEN` immediately could break local setups. A non-production fallback reduces friction while still forcing production correctness.
- Middleware depends on the same secret for internal host resolution. Misconfiguration should fail closed without exposing mappings.

## Phase 3: Stripe Connect Webhook Ownership Checks

### Goal

Ensure Stripe Connect webhooks can only mutate records for the hub/account that actually owns the connected Stripe account.

### Current risk

Stripe signature verification confirms Stripe sent the event, but checkout reconciliation often uses event metadata to locate hub records. Metadata must not be the only tenant boundary.

### New shared helper

Create a helper such as:

```js
assertStripeConnectEventOwnsTransaction({ event, transaction, hubPaymentConfiguration })
```

It should verify:

- `event.account` exists for Connect-sensitive events
- `transaction.stripeAccountId` exists
- `event.account === transaction.stripeAccountId`
- if hub payment configuration is provided, `event.account === hubPaymentConfiguration.stripeAccountId`

### Apply to reconciliation paths

Apply before mutating:

- event booking checkout reconciliation
- course registration checkout reconciliation
- legacy event registration checkout reconciliation
- membership upgrade checkout reconciliation
- payment intent failure reconciliation
- refund reconciliation

### Error policy

1. Missing metadata can keep the existing ignored behaviour where no record can be resolved.
2. A resolved transaction with mismatched Stripe account is a security failure.
3. Do not mark mismatched events as processed.
4. Log event id, type, and account ids, but avoid member PII.
5. If Stripe retries a mismatched event, keep the failure noisy until the configuration or data issue is corrected.

### Tests

1. Valid connected account mutates normally.
2. Mismatched connected account does not mutate.
3. Missing account on a Connect-sensitive event fails safely.
4. Duplicate event handling still works.
5. Refund reconciliation cannot cross hub/account boundaries.
6. Account ownership is checked for payment intent failure events, not only checkout session events.

### Acceptance criteria

- No Stripe Connect event can update a transaction unless the connected account matches.
- Existing successful Stripe checkout and refund flows still work.
- Webhook logs are actionable for configuration mistakes.

### Phase 3 Implementation Notes

Status: implementation pass complete; local verification pending.

Ownership helper added:

- `apps/hub-platform/src/lib/domain/stripe-connect-webhook-ownership.js`
- The helper requires `event.account`, `transaction.stripeAccountId`, and matching hub payment configuration `stripeAccountId` when provided.
- Mismatches throw before any transaction, registration, booking, membership, or payment-record mutation.

Webhook reconciliation updated:

- Membership upgrade checkout.
- Legacy event registration checkout.
- Event booking checkout.
- Course registration checkout.
- Offering refund reconciliation for `refund.created`, `refund.updated`, and `charge.refunded`.
- Checkout payment-intent failure reconciliation.

Failure policy implemented:

- Missing metadata can still return existing ignored results before a transaction is resolved.
- Once a transaction is resolved, missing or mismatched connected-account ownership throws.
- The webhook processor releases the claim and rethrows, so mismatched events are not marked processed and Stripe retries remain noisy.

Regression coverage added:

- `apps/hub-platform/tests/unit/stripe-connect-webhook-ownership-domain.test.js`
- `apps/hub-platform/tests/unit/stripe-connect-webhook-ownership-source.test.js`

### Tradeoffs

- This may reveal webhook misconfiguration that was previously hidden. That is acceptable; we should surface those problems before launch.

## Phase 4: Upload Hardening

### Goal

Prevent unsafe files from being uploaded or rendered as public media.

### Upload policies

#### Member avatars

Allow:

- `image/jpeg`
- `image/png`
- `image/webp`

Reject:

- SVG
- GIF unless intentionally supported
- PDF
- unknown binary
- files where browser MIME and detected signature do not match

Recommended avatar max size:

- 2 MB

#### Admin public media

Allow initially:

- `image/jpeg`
- `image/png`
- `image/webp`
- `application/pdf` if document uploads are required

Reject initially:

- SVG
- HTML
- JavaScript
- unknown binary
- mismatched MIME/signature files

Recommended media max size:

- keep existing 10 MB unless product requirements say otherwise

### Implementation steps

1. Create a shared upload validation module.
2. Detect file type using magic bytes/signatures.
3. Compare detected type with submitted content type.
4. Apply avatar policy in `/api/member/avatar`.
5. Apply media policy in `/api/media/upload`.
6. Ensure user-facing errors are clear and non-technical.
7. Consider setting safer storage metadata for PDFs, such as attachment disposition if they are not meant to render inline.
8. Confirm the media picker and avatar UI show the same accepted file types as the server policy.
9. Do not rely on client-side `accept` attributes as security controls.

### Tests

1. Avatar accepts JPG/PNG/WebP.
2. Avatar rejects SVG/PDF/fake image MIME/oversized files.
3. Admin media accepts allowed image/PDF types.
4. Admin media rejects SVG/HTML/unknown binary.
5. Existing media domain normalization still works.

### Acceptance criteria

- Browser-provided `file.type` is not trusted by itself.
- SVG is blocked for v1 unless a sanitizer is introduced.
- Existing valid image upload UX remains intact.

### Tradeoffs

- Blocking SVG may inconvenience admins who want vector logos. For launch, this is safer than serving unsanitized SVG from public storage.
- Image re-encoding would be even stronger for avatars, but signature validation plus SVG blocking is a pragmatic v1 hardening step.

## Phase 5: Security Headers And CSP

### Goal

Add browser-level security protections without breaking Next, Firebase Auth, Stripe, or media rendering.

### Baseline headers

Add to both apps:

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` with unnecessary browser capabilities disabled
- `Strict-Transport-Security` in production
- `frame-ancestors` via CSP or `X-Frame-Options`

### CSP rollout

Implement CSP carefully.

Initial CSP should account for:

- Next runtime requirements
- Firebase Auth client usage
- Stripe checkout/payment surfaces where applicable
- Firebase Storage images
- app styles/fonts currently used by each app
- custom domains and platform subdomains served by hub-platform

### Rollout strategy

1. Add non-CSP headers first.
2. Add a conservative CSP with required allowances.
3. Test locally and in a preview environment.
4. Tighten only after confirming no auth/checkout/media regressions.
5. If full CSP is too risky for the same phase, ship the non-CSP headers and document CSP as the next hardening task rather than blocking all other security fixes.

### Implementation note

Phase 5 has been implemented as the safe baseline-header step only. Both live apps now emit:

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

The following are intentionally deferred until preview-environment QA confirms the exact behaviour across product checkout, Firebase Auth, Stripe Connect, public media, and custom-domain routing:

- enforced `Content-Security-Policy`
- `Strict-Transport-Security`
- `X-Frame-Options` or CSP `frame-ancestors`

This preserves the phase goal without introducing a high-risk policy change that could block external scripts, embedded payment/onboarding flows, custom domains, or future legitimate browser capabilities.

### Tests

1. Source tests for headers in each `next.config.mjs`.
2. Manual QA:
- product signup
- product sign-in
- product Stripe checkout
- hub public sign-in/join
- hub admin pages
- hub Stripe Connect setup
- public media images
- booking notification links

### Acceptance criteria

- Security headers are emitted by both apps.
- No auth, checkout, media, or admin UI flows break.
- CSP does not block required first-party app functionality.

### Tradeoffs

- A strict CSP can easily break framework/runtime behaviour if implemented too aggressively. We should phase this rather than trying to reach a perfect CSP in one pass.

## Phase 6: Public Abuse Controls

### Goal

Reduce automated abuse of public flows that can create accounts, send email, provision hubs, or generate checkout sessions.

### Surfaces to protect

1. Product signup
2. Product forgot-password
3. Product commercial session exchange if needed
4. Hub member join
5. Hub member session exchange if needed
6. Admin invite acceptance if abuse appears likely
7. Media upload endpoints if abuse patterns appear after launch

### Rate limiting architecture

Create a small adapter-based rate limit module:

- production adapter: Redis/KV-backed
- local/test adapter: no-op or in-memory

Recommended production providers:

- Vercel KV
- Upstash Redis
- another managed Redis-compatible store

### CAPTCHA / Turnstile rollout

Start with:

- product signup
- forgot-password

Consider later:

- hub member join
- admin invite acceptance

### Behaviour rules

1. Forgot-password responses should remain non-enumerating.
2. Signup should fail gracefully with a clear “try again shortly” message when limited.
3. Rate limits should consider both IP and normalized email where relevant.
4. Do not block legitimate payment webhook/internal automation traffic with public form limits.
5. Rate limiting must account for hosting-provider forwarded IP behaviour and should not trust arbitrary client-supplied IP headers unless the host/proxy chain is known.

### Implementation note

Phase 6 should be delivered in small slices to avoid breaking signup and checkout.

The first implementation slice protects the product-site flows with the highest anonymous abuse impact:

- product signup
- product forgot-password
- hub member join backend route

This slice adds:

- shared product-site public abuse-control primitives
- narrowly scoped hub-platform public abuse-control primitives
- IP and normalized-email keying with hashed key parts
- local no-op by default, with optional in-memory limiting for development
- optional Upstash Redis REST support for production
- graceful form-state errors when a public form is limited
- graceful `429` JSON responses when hub member join is limited

The first slice intentionally does not:

- add CAPTCHA / Turnstile UI yet
- rate-limit Stripe webhooks
- rate-limit internal automation endpoints
- add friction to authenticated admin/member operations
- harden media upload, which is deferred separately

Turnstile should follow as Phase 6b after backend limits have been verified against signup, checkout, and password reset. The first Turnstile targets should be product signup and forgot-password. Hub member join can be considered after that because its Firebase account creation happens client-side before the backend join route is called.

The hub member join backend limiter does not prevent Firebase Auth account creation because that happens in the browser first. It does protect hub-platform server resources, including hub/user lookups, package-limit checks, Firestore member creation, default membership assignment, and session creation.

### Tests

1. Rate limit helper tests.
2. Source tests showing public form actions call the limiter.
3. Behaviour tests for forgot-password non-enumeration.
4. CAPTCHA verification tests can use mocked verification responses.

### Acceptance criteria

- Public high-risk forms have rate limiting.
- Product signup has anti-bot protection before launch.
- Existing legitimate signup and reset flows still work.

### Tradeoffs

- CAPTCHA introduces friction. Applying it first to product signup is justified because signup provisions real infrastructure and billing state.
- Hub member join may be left with rate limiting only for v1 if CAPTCHA harms community conversion.

## Phase 7: Repo, Firebase, And Deployment Hygiene

### Goal

Reduce operational risk around secrets, Firebase rules/indexes, and launch configuration.

### Repo hygiene

Add or verify root ignore coverage for:

- `.env*`
- `!.env.example`
- service account JSON
- private keys
- `.vercel`
- `.next`
- `node_modules`
- logs
- build output

### Firebase deployment source of truth

The old top-level `project/` scaffold has been removed to avoid confusing it with the active product launch.

The launch runbook must clearly state:

- root `firestore.indexes.json` is the active notification-index artifact
- Firebase index deployment should be run from the repo root with an explicit `--project`
- active Firestore/Storage rules need a separate reviewed root source before deployment

Resolved decision:

- keep the active notification outbox indexes at repo root
- do not recreate or deploy from the old `project/` scaffold
- do not deploy old `project/` rules for `apps/product-site` or `apps/hub-platform`

### Rules review

1. Confirm Firestore rules are deployed even though most app access uses Admin SDK.
2. Confirm Storage rules align with media upload policy.
3. Confirm public media read access is intentional and documented.

### Deployment checklist

Before launch, verify:

- strong `SESSION_HMAC_SECRET`
- strong `PRODUCT_SITE_SESSION_SECRET`
- shared strong `INTERNAL_AUTOMATION_SECRET` in both apps
- Stripe product-site webhook secret
- Stripe Connect hub webhook secret
- product-site GBP price ids
- Resend sender domains verified
- Firebase rules deployed
- Firestore indexes deployed
- Storage rules deployed
- booking notification automation endpoint scheduled and protected
- custom-domain runtime intentionally enabled/disabled
- product-site `.env.example` package price variable names match the current GBP-only implementation
- hub-platform and product-site base URLs point to the deployed origins and not localhost

### Tests

- Source test for root ignore file if useful.
- Manual deployment dry-run checklist.

### Acceptance criteria

- Secrets are not accidentally trackable.
- Firebase deployment instructions are unambiguous.
- Index/rules state supports booking notifications and media storage safely.

### Tradeoffs

- Firestore/Storage rules for the active launch still need a separate review before we claim a full rules deployment source of truth. The current Phase 7 cleanup intentionally resolves the index deployment confusion first without importing old scaffold rules.

## Final Verification Matrix

### Product-site

Verify:

- signup free package
- signup paid package
- checkout success updates account/package
- checkout cancellation/failure does not over-upgrade
- sign-in/session exchange
- forgot-password
- billing portal
- package upgrade/downgrade/scheduled change
- internal provisioning to hub-platform

### Hub platform admin

Verify:

- regional onboarding
- Stripe Connect gate for Growth
- event/course create/edit/delete
- recurring event create/edit
- registration/payment status mutations
- member mutations
- membership plan creation
- media upload
- custom-domain settings
- admin invite creation/resend/revoke
- support mode

### Public/member hub

Verify:

- member join
- member sign-in
- event booking
- course enrolment
- native Stripe checkout
- external payment flow
- member cancellation
- avatar upload
- member account pages

### Automation

Verify:

- booking notification processor with correct secret
- wrong secret returns unauthorized
- custom-domain resolve/lifecycle routes with correct secret
- product-site provisioning with shared secret
- Stripe product-site webhook
- Stripe Connect webhook

## Execution Order

1. Phase 0: Safety baseline and tests
2. Phase 1: Action-level authorization
3. Phase 2: Internal automation secret consolidation
4. Phase 3: Stripe Connect webhook ownership checks
5. Phase 4: Upload hardening
6. Phase 5: Security headers and CSP
7. Phase 6: Public abuse controls
8. Phase 7: Repo/Firebase/deployment hygiene

This order is deliberate:

- first close direct mutation and tenant-boundary risks
- then secure automation and payment integrity
- then reduce file/browser attack surface
- then add abuse and deployment hardening

## Tradeoff And Gap Audit

### Gap: Action guard coverage can drift

Risk:

- Future admin actions could be added without the shared guard.

Refinement:

- Add a source test that scans all admin/platform `actions.js` files and fails if mutation files do not reference the approved guard.
- Document the guard in the hub-platform engineering standards after implementation.

### Gap: Server actions and CSRF posture

Risk:

- Authorization checks protect identity/permissions, but cookie-backed mutation endpoints can still have CSRF considerations.

Refinement:

- After Phase 1, assess whether Next server action origin protections are sufficient for the deployment model.
- For custom API mutation routes, consider explicit origin checks where browser-cookie auth is used.
- Do not block Stripe webhooks or internal automation with browser-origin checks.

### Gap: Product-site session context is signed but not re-authenticated on every action

Risk:

- Product-site account actions rely on the signed product-site session cookie, then resolve the account from the database.
- This is acceptable for current UX, but the session is 30 days and does not re-check Firebase Auth token freshness.

Refinement:

- Keep current flow for launch to avoid breaking account UX.
- Add a future hardening task to bind product-site session rotation to Firebase Auth freshness for especially sensitive billing actions.
- Ensure billing portal/package actions use fresh database account state, which they already do through `requireCommercialAccountContext`.

### Gap: Rate limiting requires infrastructure choice

Risk:

- Rate limiting cannot be production-grade without a shared backing store.

Refinement:

- Do not fake production rate limiting with local memory.
- Choose Redis/KV before implementing Phase 6.
- Keep a no-op adapter only for tests/local development.

### Gap: CSP can break runtime features

Risk:

- Stripe/Firebase/Next/browser runtime needs can be easy to miss.

Refinement:

- Add headers in two steps: baseline headers first, CSP second.
- Run a dedicated manual QA pass in preview before production.
- Prefer a conservative CSP over a brittle perfect CSP for v1.

### Gap: Upload validation without re-encoding still trusts image parsers later

Risk:

- Magic-byte validation blocks obvious unsafe files, but advanced image payload attacks are still possible.

Refinement:

- For v1, block SVG and validate signatures.
- For later hardening, consider image re-encoding/resizing for avatars and public images.

### Gap: Firebase rules source of truth needs a dedicated active-app review

Risk:

- Root notification indexes are now clear, but active Firestore/Storage rules have not yet been reviewed into a current root deployment source.

Refinement:

- Treat root `firestore.indexes.json` as the active index artifact.
- Create/review root Firestore and Storage rules separately before deploying rules for the active apps.

### Gap: Internal automation route exposure

Risk:

- Internal routes are publicly addressable and protected by a bearer secret.

Refinement:

- Strong secret, timing-safe compare, and placeholder rejection are required.
- Consider provider-level cron protection or IP allowlisting where hosting supports it, but do not depend on Vercel-only mechanisms.

### Gap: Stripe Connect event mismatch policy could affect retries

Risk:

- Returning 500 on account mismatch may cause Stripe retries.

Refinement:

- That is acceptable for a security mismatch because it should be investigated.
- Include clear logs.
- Do not mark mismatched events as processed.

## Definition Of Done

This remediation project is complete when:

1. Every admin/platform mutation entry point authorizes itself.
2. Internal automation uses one canonical strong secret across both apps.
3. Stripe Connect webhooks cannot cross tenant/account boundaries.
4. Upload endpoints reject unsafe/mismatched file types.
5. Both apps emit launch-appropriate security headers.
6. Public high-risk forms have rate limiting and signup has anti-bot protection.
7. Firebase/rules/index deployment source of truth is documented and deployable.
8. The final verification matrix passes without breaking existing product, hub admin, public member, payment, or automation flows.
