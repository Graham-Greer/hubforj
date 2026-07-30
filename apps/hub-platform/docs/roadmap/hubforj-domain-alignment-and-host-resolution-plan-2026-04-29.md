# Hubforj Domain Alignment And Host Resolution Plan

Status:
- Local implementation complete
- Staging and production verification deferred

Date:
- 2026-04-29

Purpose:
- Replace the placeholder hosted-hub domain model with the real Hubforj production domain contract
- Align `apps/product-site` and `apps/hub-platform` around one explicit domain authority model
- Define the implementation sequence, guardrails, rollout order, and verification requirements needed to stop relying on `.ourplatform.com`

Progress so far:
- Slice 1 complete:
  - default hosted-hub root changed to `hubforj.com`
  - default custom-domain verification prefix changed to `_hubforj-verify`
  - reserved subdomain protection added during hub provisioning
- Slice 2 complete:
  - operator and admin domain messaging updated to use the Hubforj-hosted subdomain model explicitly
- Slice 3 complete for local development:
  - local and production-style host-resolution expectations are codified through tests
  - shared route-mode handling now covers key public, auth, and member-facing surfaces
- Slice 4 deferred:
  - real staging and production host verification remains intentionally deferred until after `hub-platform` Stripe implementation begins

Current delivery decision:
- local domain-alignment hardening is considered complete enough to unblock the next implementation track
- staging environment setup is intentionally deferred
- production cutover is intentionally deferred
- this document remains the authority for the completed implementation work and the still-open verification obligations

Authority:
- [Roadmap Docs README](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/README.md)
- [Product Site And Commercial Platform Implementation Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-and-commercial-platform-implementation-plan-2026-04-20.md)
- [Product Site Phase 6 Execution Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-phase-6-execution-plan-2026-04-20.md)
- [Stripe Two-Domain Architecture Note](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/stripe-two-domain-architecture-note-2026-04-20.md)
- [Custom Domain Management Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/custom-domain-management-plan-2026-03-31.md)
- [Custom Domain Launch Readiness Checklist](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/custom-domain-launch-readiness-checklist-2026-03-31.md)
- current repo code in `apps/hub-platform` and `apps/product-site`

Related:
- [Product Site README](/mnt/c/local/community-app/apps/product-site/README.md)
- [SaaS Domain And Route Model](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/saas-domain-and-route-model-2026-03-15.md)

## 1) Executive Summary

The repo is now far enough along that continuing to describe hosted hubs as `*.ourplatform.com` is no longer a harmless placeholder.

It leaks into:

- product language
- admin-domain messaging
- runtime assumptions
- launch-readiness thinking

The correct production domain contract is now:

- product site: `https://hubforj.com`
- product marketing redirect host: `https://www.hubforj.com`
- operational app root: `https://community.hubforj.com`
- platform-hosted hub runtime: `https://{tenantSlug}.hubforj.com`
- connected Growth custom domains: client-owned canonical host

This plan exists to make that contract explicit and to define the work needed to support it safely.

Current execution note:

- the code-level alignment work needed for a production-grade host model is now far enough along that it no longer blocks `hub-platform` Stripe implementation
- what remains on this plan is primarily real-environment verification and final cutover execution

Important distinction:

- switching the hosted-hub root from `ourplatform.com` to `hubforj.com` is the immediate requirement
- finishing a fully host-native SaaS route model is a related but larger concern

Those two concerns must be sequenced correctly rather than blurred together.

## 2) Locked Domain Contract

These decisions should be treated as fixed unless a newer architecture note explicitly supersedes them.

### 2.1 Product site owns the apex product brand

The product site should own:

- `hubforj.com`

The product site may also answer on:

- `www.hubforj.com`

But `www` should be treated as a redirect or companion marketing host, not the canonical operational host.

### 2.2 `hub-platform` owns the operational root

The operational root for the multi-tenant application should be:

- `app.hubforj.com`

This is the correct boundary for:

- platform/operator entry
- internal operational app identity
- app-to-app automation calls where a base URL is required

### 2.3 Hosted hubs live on subdomains of the product root

Platform-hosted hubs should resolve on:

- `{tenantSlug}.hubforj.com`

Examples:

- `oakhill.hubforj.com`
- `citystudio.hubforj.com`

### 2.4 Growth custom domains remain a separate runtime concern

Client-owned custom domains remain:

- operationally owned by `hub-platform`
- entitlement-gated by package authority
- subject to the existing verification and activation lifecycle

This plan does not collapse hosted hub subdomains and custom-domain activation into one change.

### 2.5 Product site and hub-platform must remain distinct apps

The move to `hubforj.com` must not blur the boundary between:

- the SaaS commercial front door
- the SaaS operational application

This means:

- product-site routes remain on `hubforj.com`
- hub-platform remains on `app.hubforj.com`
- hosted hubs remain on `{tenantSlug}.hubforj.com`

## 3) Repo-Audited Current State

This section records the current code-backed state that this plan is working from.

### 3.1 The hosted-hub root domain is already mostly centralized

The root domain is currently read from:

- [custom-domain-runtime-config.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/custom-domain-runtime-config.js)

Current behavior:

- `NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN` controls the platform root domain
- `ourplatform.com` is still the fallback default
- custom-domain verification prefix also still defaults to `_ourplatform-verify`

This is good news because the code is not hardcoded everywhere.

### 3.2 Host resolution already matches the intended production shape

Host resolution currently lives in:

- [hub-hosts.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/hub-hosts.js)
- [middleware.js](/mnt/c/local/community-app/apps/hub-platform/src/middleware.js)

The runtime already distinguishes:

- platform root
- platform subdomain
- local subdomain
- custom-domain candidate

This is structurally compatible with:

- `hubforj.com`
- `www.hubforj.com`
- `app.hubforj.com`
- `{tenantSlug}.hubforj.com`

Important local-development contract:

- platform root: `localhost`
- local hub runtime: `{hubSlug}.localhost`

That local contract must remain supported even after the production domain contract is fully aligned.

### 3.3 Platform-hosted hub labels are derived, not manually written

Hosted subdomain labels are currently computed in:

- [hub-domains.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/hub-domains.js)

This means the UI can inherit the correct domain once the root-domain config is correct.

### 3.4 Cross-app routing is already using explicit app-base URLs

The commercial/operational split is already expressed through:

- [product-site README env contract](/mnt/c/local/community-app/apps/product-site/README.md)
- [package-management-handoff.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/package-management-handoff.js)
- [provision-hub.js](/mnt/c/local/community-app/apps/product-site/src/lib/server/provision-hub.js)
- [provision-owner-admin.js](/mnt/c/local/community-app/apps/product-site/src/lib/server/provision-owner-admin.js)
- [hub-package-authority.js](/mnt/c/local/community-app/apps/product-site/src/lib/server/hub-package-authority.js)

This is already the correct architectural direction.

### 3.5 The biggest remaining gap is not domain configuration alone

The main gaps are:

1. reserved host and slug protection is not clearly enforced
2. many internal routes still generate slug-path URLs directly
3. documentation and environment examples still normalize the placeholder domain

That means the hosted-hub root can be corrected now, but it should be done with operational discipline.

## 4) Key Risks And Gaps

### 4.1 Reserved host collision risk

Current concern:

- `PLATFORM_RESERVED_HOSTS` exists in config parsing
- but the current audit did not find clear enforcement during hub slug creation

This matters because once hosted hubs use `*.hubforj.com`, slugs such as:

- `app`
- `www`
- `api`
- `support`
- `status`

can become operationally dangerous if not blocked intentionally.

This is the highest-priority implementation gap before production domain cutover.

### 4.2 Partial path-based routing model still exists

Many route builders and redirects still generate:

- `/${hubSlug}/...`

Examples include:

- [public-routes.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/public-routes.js)
- [public-action-links.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/public-action-links.js)
- [member-session.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/auth/member-session.js)

This does not block the domain cutover because middleware can rewrite and normalize requests.

However, it does mean:

- the system is not yet fully host-native internally
- redirects and auth flows still depend on the slug-path model in places

This should be treated as a separate modernization track, not as a reason to delay the domain contract correction indefinitely.

### 4.3 Verification-prefix drift risk

The custom-domain verification prefix still defaults to:

- `_ourplatform-verify`

If the product brand is now Hubforj, this should become:

- `_hubforj-verify`

That is not just aesthetic. It affects:

- DNS instruction clarity
- support messaging
- operator confidence when reviewing customer DNS state

### 4.4 Mixed mental-model risk in docs and UI

The current code and docs still contain placeholder language such as:

- platform subdomain
- fallback host assumptions tied to `ourplatform.com`

The issue is not only correctness. It is also product trust.

If the customer sees:

- Hubforj in the sales flow
- but `ourplatform.com` in operational messaging

the system appears unfinished.

### 4.5 Runtime enablement risk for custom domains

Switching hosted hub subdomains to `*.hubforj.com` must not be confused with enabling all custom-domain runtime behavior.

The custom-domain launch checklist remains valid:

- [Custom Domain Launch Readiness Checklist](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/custom-domain-launch-readiness-checklist-2026-03-31.md)

This plan does not authorize enabling:

- `CUSTOM_DOMAIN_RUNTIME_ENABLED=true`

unless the surrounding DNS, TLS, certificate, redirect, and mapping infrastructure is ready.

## 5) Recommended Delivery Position

The implementation should be delivered in two layers.

### Layer A: Production domain alignment now

Deliver now:

- real product-site root
- real hub-platform app root
- real hosted hub subdomain root
- reserved host enforcement
- environment and docs alignment
- UI truthfulness updates

This is the immediate priority.

### Layer B: Host-native SaaS route normalization later

Deliver separately:

- route builders that prefer resolved-host semantics over `/${hubSlug}`-first assumptions
- auth redirects that operate from host context first
- internal link generation that becomes host-aware where appropriate

This should be treated as an intentional follow-on modernization track, not as an accidental side effect of the domain switch.

## 6) Target Environment Contract

### 6.1 Product-site

Expected production values:

- `PRODUCT_SITE_BASE_URL=https://hubforj.com`
- `HUB_PLATFORM_BASE_URL=https://community.hubforj.com`

These values support:

- branded verification and reset links
- Stripe return URLs
- package-management handoff
- admin activation handoff

### 6.2 Hub-platform

Expected production values:

- `PRODUCT_SITE_BASE_URL=https://hubforj.com`
- `NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN=hubforj.com`
- `HUB_PLATFORM_BASE_URL=https://community.hubforj.com`
- `CUSTOM_DOMAIN_VERIFICATION_PREFIX=_hubforj-verify`
- `INTERNAL_AUTOMATION_SECRET=<shared secret>`
- `CUSTOM_DOMAIN_RUNTIME_ENABLED=false` until runtime launch criteria are satisfied

### 6.3 Reserved host policy

The following should be treated as reserved and not available for hub slugs:

- `hubforj`
- `www`
- `app`
- `api`
- `status`
- `support`
- `help`
- any other hostnames required by infrastructure or future platform surfaces

The final production list should be explicitly codified in environment or code, not assumed socially.

## 7) Execution Tracks

This work should be delivered in six tracks.

### Track A: Domain contract and env alignment

Outcome:

- both apps share one explicit production domain model

Primary outputs:

- updated env examples
- updated docs
- updated production/staging config checklist

### Track B: Reserved host and slug safety

Outcome:

- hosted subdomain collisions are blocked before they can become runtime incidents

Primary outputs:

- reserved host list
- hub slug validation against reserved hosts
- test coverage for blocked slugs

### Track C: Hosted hub domain presentation

Outcome:

- admin and operator surfaces show the real hosted hub domain

Primary outputs:

- updated product language
- updated UI labels and hints where needed
- updated support-facing copy

### Track D: Runtime verification for hosted subdomains

Outcome:

- `{tenantSlug}.hubforj.com` is verified in staging and production-like environments

Primary outputs:

- wildcard DNS validation
- app-root and subdomain routing validation
- middleware and redirect verification

### Track E: Custom-domain lifecycle compatibility check

Outcome:

- the new hosted hub root does not break the existing custom-domain lifecycle assumptions

Primary outputs:

- verification-prefix alignment
- fallback-host correctness
- disconnect and reconnect scenario validation

### Track F: Follow-on host-native routing normalization

Outcome:

- the system gradually stops relying on path-shaped hub URLs internally

Primary outputs:

- route-builder audit
- auth redirect normalization
- host-aware internal linking plan

## 8) Execution-Ready Backlog

### Slice 1: Lock the production domain contract in docs and env examples

Implementation tasks:

1. update `apps/hub-platform/.env.example`
2. update relevant product-site and hub-platform docs
3. document the canonical production contract:
   - `hubforj.com`
   - `app.hubforj.com`
   - `{tenantSlug}.hubforj.com`

Acceptance criteria:

- no new engineer needs chat history to know the intended domain model
- placeholder domain language is no longer treated as the default truth

### Slice 2: Enforce reserved host protection

Implementation tasks:

1. define the reserved-host list explicitly
2. apply validation during hub provisioning and slug updates
3. ensure operator-facing errors are clear
4. add tests for blocked slugs such as:
   - `app`
   - `www`
   - `api`

Acceptance criteria:

- no reserved operational hostname can be provisioned as a hub slug
- the production domain model is protected from obvious collisions

### Slice 3: Align hosted subdomain computation and UI language

Implementation tasks:

1. update domain-related UI copy to use the real host model
2. verify admin account settings show `{tenantSlug}.hubforj.com`
3. verify platform hub summaries show the correct hosted domain

Acceptance criteria:

- operational users no longer see fake domain language
- platform-hosted fallback messaging remains correct and client-facing

### Slice 4: Validate runtime routing on real subdomains

Implementation tasks:

1. verify wildcard DNS for `*.hubforj.com`
2. verify:
   - `hubforj.com`
   - `www.hubforj.com`
   - `app.hubforj.com`
   - `{tenantSlug}.hubforj.com`
3. confirm middleware rewriting and redirect behavior
4. confirm that non-hub platform routes remain stable

Acceptance criteria:

- hosted hub traffic resolves on real subdomains
- platform root traffic and app-root traffic are not misclassified

### Slice 5: Reconcile custom-domain lifecycle assumptions

Implementation tasks:

1. update verification prefix from `_ourplatform-verify`
2. verify DNS instructions remain correct
3. verify connected custom-domain mappings still carry the right fallback host
4. verify disconnect behavior still returns hubs to `{tenantSlug}.hubforj.com`

Acceptance criteria:

- hosted fallback remains trustworthy
- custom-domain lifecycle still behaves correctly after the root-domain change

### Slice 6: Plan host-native route normalization

Implementation tasks:

1. audit all route and action helpers that still emit `/${hubSlug}/...`
2. classify them into:
   - safe for now
   - should become host-aware
   - must become host-aware before launch
3. define the follow-on migration plan

Acceptance criteria:

- the team knows exactly which path-based assumptions still exist
- domain cutover is not blocked by unrelated routing perfectionism

## 9) Technical Audit Findings That Should Guide Implementation

### 9.1 The runtime boundary is healthier than the UI boundary

The code already has a reasonable host-resolution core:

- [custom-domain-runtime-config.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/custom-domain-runtime-config.js)
- [hub-hosts.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/hub-hosts.js)
- [middleware.js](/mnt/c/local/community-app/apps/hub-platform/src/middleware.js)

So this is not a greenfield domain-runtime problem.

The greater risk is:

- unguarded slug collisions
- stale placeholder language
- incomplete host-native link generation

### 9.2 Product-site and hub-platform are already correctly split

The apps already use explicit base URLs for cross-app calls and handoffs.

That means:

- we do not need to re-architect the product boundary
- we do need to formalize the final production origins

### 9.3 Path-based routing still exists intentionally

Many route helpers still generate `/${hubSlug}` URLs.

This is not ideal long term, but it is not by itself evidence that the hosted-subdomain move is unsafe.

The correct interpretation is:

- domain contract alignment can land first
- host-native route generation can be completed as a next-phase hardening track

## 10) Rollout Order

Recommended order:

1. lock the domain contract in docs
2. implement reserved-host enforcement
3. update env examples and staging config
4. validate staging:
   - product site on `hubforj.com`
   - hub-platform on `app.hubforj.com`
   - hosted hub on `{tenantSlug}.hubforj.com`
5. verify admin activation and package-management handoff
6. verify hosted fallback and custom-domain lifecycle behavior
7. only then treat `.ourplatform.com` as fully retired

## 11) Verification Checklist

### Product-site and app boundary

- `hubforj.com` serves the product site correctly
- `www.hubforj.com` redirects or behaves as intended
- product-site emails and Stripe return URLs use the correct canonical origin
- package-management handoff from `hub-platform` reaches the product site correctly

### Operational app root

- `app.hubforj.com` serves the operational app correctly
- product-site internal automation calls to `app.hubforj.com` succeed
- admin activation handoff returns a valid sign-in URL under the app root

### Hosted hub runtime

- a hub resolves correctly on `{tenantSlug}.hubforj.com`
- middleware strips duplicated slug paths safely
- auth entry points work from the hosted hub domain
- public, member, and admin routes all continue to function

### Custom-domain lifecycle

- Growth custom-domain verification still works
- connected domains still map correctly
- disconnect returns the hub to `{tenantSlug}.hubforj.com`
- fallback messaging remains accurate

### Negative and safety cases

- reserved slugs are rejected
- unresolved custom-domain hosts do not resolve accidentally
- platform root hosts are not misclassified as hub subdomains

## 12) Non-Goals

This plan does not attempt to:

- collapse product-site and hub-platform onto one app origin
- fully redesign the hub route model in the same slice
- enable customer custom-domain runtime before infrastructure is ready
- replace every `/${hubSlug}` route helper immediately

## 13) Recommendation

The team should proceed with the real Hubforj domain alignment now.

The correct engineering posture is:

- treat `*.ourplatform.com` retirement as overdue
- implement it deliberately, not casually
- close reserved-host safety first
- keep host-native routing modernization as a parallel or follow-on hardening track

That gives the product a truthful external identity without forcing an unnecessary all-or-nothing rewrite of every internal route helper first.
