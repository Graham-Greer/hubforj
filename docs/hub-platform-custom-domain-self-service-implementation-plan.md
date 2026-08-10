# Hub Platform Custom Domain Self-Service Implementation Plan

## Objective

Upgrade HubForJ custom domains from a partially staged internal capability into a self-service, enterprise-grade Growth-plan feature.

The finished system should let a Growth-plan hub owner connect, verify, activate, monitor, and disconnect a client-owned custom domain without support intervention for the normal path, while preserving operational controls for repair, reconciliation, abuse prevention, and rollback.

The target domain model remains:

- HubForJ product site:
  - `https://hubforj.com`
  - `https://www.hubforj.com`, redirected to the canonical product host
- Standard HubForJ-hosted hub:
  - `https://{hubSlug}.hubforj.com`
  - public, member, and admin routes on the same hostname
- Growth-plan custom domain:
  - `https://customdomain.com`
  - `https://community.customdomain.com`
  - public, member, and admin routes on the same verified custom hostname

Custom domains must never cause `hubforj.com`, `www.hubforj.com`, or reserved platform hosts to resolve as individual customer hubs.

## Current State Audit

### Current UX Entry Point

Custom domain management currently lives in:

- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/settings/account/page.jsx`
- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/settings/account/AccountDomainSetupForm.jsx`
- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/settings/account/AccountDomainVerificationCheckForm.jsx`
- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/settings/account/AccountDomainDisconnectForm.jsx`
- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/settings/actions.js`

The admin sees a custom-domain panel on Account settings.

Current behavior:

- Free/Starter hubs see custom domain as locked.
- Growth hubs, or hubs with `packageOverrides.customDomainEnabled === true`, can start custom-domain setup.
- The form accepts a primary hostname.
- After submission, the UI displays TXT verification details.
- The admin can click "Check again" to re-check DNS ownership.
- Connected domains can be scheduled for disconnect by typing the current hostname.

### Current Entitlement Gate

Server-side entitlement enforcement exists in:

- `apps/hub-platform/src/lib/data/hub-mutations.js`
- `apps/hub-platform/src/lib/domain/hub-package.js`
- `apps/hub-platform/src/lib/domain/package-entitlements.js`
- `apps/hub-platform/src/lib/auth/action-access.js`

`requestHubCustomDomainBySlug` and `checkHubCustomDomainVerificationBySlug` both reject non-entitled hubs.

This is correct and must be preserved. UI-only gating is not relied on.

Current account settings actions call `requireHubOperatorActionAccess`, which currently allows `owner`, `admin`, and `superadmin` unless an action passes narrower `allowedRoles`.

Enterprise implication:

- setup, verification, and disconnect must be narrowed to owner/superadmin for the first self-service launch
- support/superadmin actions should remain separately auditable from customer admin actions

### Current Data Model

The hub document stores a `customDomain` object with fields such as:

- `hostname`
- `status`
- `isPrimary`
- `verificationMethod`
- `verificationHost`
- `verificationTarget`
- `requestedAt`
- `verifiedAt`
- `activationReadyAt`
- `connectedAt`
- `lastCheckedAt`
- `disconnectAt`
- `disconnectedAt`
- `failureReason`
- `activationBlockedReason`
- `connectedByUserId`
- `updatedByUserId`

The hub document also stores a legacy/compatibility `customDomains` array.

Connected runtime mappings are stored in:

- `customDomainMappings/{hostname}`

Mapping records include:

- `hostname`
- `hubId`
- `hubSlug`
- `canonicalHost`
- `companionHost`
- `fallbackHost`
- `redirectTo`
- `matchType`
- `status`
- `connectedAt`
- `updatedAt`
- `updatedBy`

The mapping model supports:

- canonical host routing
- `www` companion host redirects
- fallback HubForJ-hosted host
- hydration from a connected hub if mapping is missing

### Current Validation

Validation lives mainly in:

- `apps/hub-platform/src/lib/domain/hub-domains.js`
- `apps/hub-platform/src/lib/data/hub-mutations.js`

Current checks:

- hostname is normalized
- `http://`, `https://`, path, query, hash, port, and trailing dots are stripped
- hostname must include a dot
- hostname must use `[a-z0-9.-]`
- hostname cannot be a platform-managed hostname under the configured platform root domain
- hostname cannot be duplicated across:
  - `hubs.customDomains`
  - `hubs.customDomain.hostname`
  - `customDomainMappings`

Current reserved host behavior is controlled by:

- `NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN`
- `PLATFORM_RESERVED_HOSTS`

### Current DNS Ownership Verification

DNS TXT verification lives in:

- `apps/hub-platform/src/lib/domain/custom-domain-verification.js`
- `apps/hub-platform/src/lib/data/custom-domain-verification.js`

Current flow:

1. App generates a token such as `verify-{uuid}`.
2. App asks the customer to create a TXT record at:
   - `{CUSTOM_DOMAIN_VERIFICATION_PREFIX}.{hostname}`
   - default prefix: `_hubforj-verify`
3. `verifyCustomDomainDnsTxt` uses `dns.resolveTxt`.
4. Matching token moves the domain to:
   - `status: "verifying"`
   - `verifiedAt`
   - `activationReadyAt`
5. Failed lookup moves or keeps the domain at:
   - `status: "verification_failed"`
   - `failureReason`
   - `lastCheckedAt`

This verifies domain ownership only. It does not prove the domain is routed to Vercel or that TLS is ready.

### Current Runtime Routing

Runtime routing lives in:

- `apps/hub-platform/src/middleware.js`
- `apps/hub-platform/src/lib/domain/hub-hosts.js`
- `apps/hub-platform/src/app/api/internal/custom-domains/resolve/route.js`

The middleware classifies hosts as:

- `platform_root`
- `platform_subdomain`
- `local_subdomain`
- `custom_domain_candidate`
- `unknown`

For platform subdomains:

- `https://maplegrovecommunityhub.hubforj.com/events`
- rewrites internally to:
- `/{hubSlug}/events`

For connected custom domains:

- `https://customdomain.com/events`
- resolves through `/api/internal/custom-domains/resolve`
- rewrites internally to:
- `/{hubSlug}/events`

If a request includes the hub slug on a host-mode URL, the middleware redirects to remove the duplicate slug path.

This route model is sound and should be preserved.

### Current Runtime Performance Shape

The current custom-domain middleware path resolves every custom-domain candidate by calling:

- `/api/internal/custom-domains/resolve`

The middleware call uses:

- bearer `INTERNAL_AUTOMATION_SECRET`
- `cache: "no-store"`
- current request origin

The resolve route then reads:

- `customDomainMappings/{hostname}`
- and can hydrate from `hubs where customDomain.hostname == ...` if the direct mapping is missing

This is correctness-oriented, but it creates a request-time waterfall for custom-domain traffic. It is acceptable as a staged implementation, but it should not be considered the final enterprise runtime if many custom-domain hubs are active.

Performance risks to resolve before broad self-service launch:

- every public asset route is excluded, but every HTML route on a custom domain pays the middleware resolve fetch
- `cache: "no-store"` prevents reuse even for stable connected mappings
- hydration from hub state on a mapping miss writes mappings during a read path, which is useful for repair but risky as routine runtime behavior
- internal API latency becomes part of TTFB for every custom-domain page
- unknown custom-domain traffic can create repeated miss lookups

The implementation must measure this path and then either add a safe short-lived mapping cache or introduce an edge-friendly mapping projection.

### Current Internal Automation

Internal routes exist for lifecycle operations:

- `apps/hub-platform/src/app/api/internal/custom-domains/status/route.js`
- `apps/hub-platform/src/app/api/internal/custom-domains/verify/route.js`
- `apps/hub-platform/src/app/api/internal/custom-domains/activate/route.js`
- `apps/hub-platform/src/app/api/internal/custom-domains/disconnect/route.js`
- `apps/hub-platform/src/app/api/internal/custom-domains/run/route.js`
- `apps/hub-platform/src/app/api/internal/custom-domains/resolve/route.js`

They require:

- `INTERNAL_AUTOMATION_SECRET`

Runtime activation also requires:

- `CUSTOM_DOMAIN_RUNTIME_ENABLED=true`

The default `.env.example` value is:

- `CUSTOM_DOMAIN_RUNTIME_ENABLED=false`

The deployment runbook currently warns not to enable this flag as part of Firebase index deployment. That indicates the feature is deliberately staged and not fully operationalized.

### Current Vercel Integration

No repo code currently provisions or manages Vercel domains.

The current code does not appear to:

- add a custom domain to the hub-platform Vercel project
- remove a custom domain from the Vercel project
- check Vercel domain verification records
- check Vercel certificate readiness
- surface Vercel-specific misconfiguration states
- reconcile Firestore mappings against Vercel project domains

This is the primary gap between the current implementation and self-service production readiness.

### Current Product-Site Relationship

Product-site signup currently provisions hubs and commercial package state, but custom-domain setup is not part of the product-site checkout/signup path.

This is appropriate for launch if:

- Growth customers are provisioned first on `{hubSlug}.hubforj.com`
- custom domain is configured later from hub admin Account settings

The product site should continue marketing "custom domain" as a Growth capability, but should not imply instant custom-domain activation until the self-service lifecycle is complete.

### Current Auth And Session Shape

Member/admin auth uses Firebase client auth followed by hub-platform session cookies.

Relevant files:

- `apps/hub-platform/src/lib/firebase/client.js`
- `apps/hub-platform/src/app/(hub)/[hubSlug]/sign-in/MemberSignInForm.jsx`
- `apps/hub-platform/src/app/api/auth/member/session/route.js`
- `apps/hub-platform/src/lib/auth/session.js`
- `apps/hub-platform/src/lib/auth/hub-auth-redirects.js`

Current session cookies are host-scoped because `buildSessionCookieOptions` does not set a cookie `domain`.

Enterprise implication:

- a session created on `{hubSlug}.hubforj.com` will not automatically authenticate the same user on `customdomain.com`
- a session created on `customdomain.com` will not automatically authenticate the same user on `{hubSlug}.hubforj.com`
- this is safer by default, but the user experience must be explicit during/after domain activation
- activation should not strand an admin mid-flow without a clear sign-in/session handoff

Firebase Auth behavior also needs explicit production verification for arbitrary customer domains. Email/password flows may behave differently from popup, redirect, email-link, or future social auth flows. Self-service launch must not assume the current Firebase authorized-domain setup automatically covers every custom domain.

### Current Stripe Return URL Shape

Native payment checkout helpers build return URLs from the current request host and runtime route mode.

Relevant files:

- `apps/hub-platform/src/lib/server/event-booking-checkout.js`
- `apps/hub-platform/src/lib/server/event-registration-checkout.js`
- `apps/hub-platform/src/lib/server/course-registration-checkout.js`
- `apps/hub-platform/src/lib/server/membership-upgrade-checkout.js`
- checkout return routes under `apps/hub-platform/src/app/(hub)/[hubSlug]/.../checkout-return/route.js`

This is good for custom-domain compatibility because checkout can return to the hostname the member used.

Enterprise implication:

- only connected and routable custom domains should be used for Stripe return URLs
- pending or failed custom domains must not be emitted in checkout/session URLs
- Stripe checkout, webhook reconciliation, and return-page redirects must be verified on custom-domain traffic
- webhook handling must remain hub/account scoped through metadata and connected account ownership, not through hostname trust

## Does The Current Functionality Work?

The current custom-domain code can work only when the external infrastructure is already correct.

It should work if all of these are true:

- the hub is Growth or has custom-domain entitlement override
- the admin requests a valid client-owned hostname
- the hostname is not already attached to another hub
- the customer adds the TXT ownership record
- verification is run
- `CUSTOM_DOMAIN_RUNTIME_ENABLED=true`
- activation is run
- the custom domain has already been added to the hub-platform Vercel project
- DNS points to Vercel correctly
- Vercel has issued a certificate for the hostname

It is not yet fully self-service because the normal customer/admin flow does not add or verify the domain with Vercel.

## Desired Enterprise Outcome

### Admin Outcome

A Growth-plan hub owner should be able to:

- open Account settings
- enter a custom domain
- see clear DNS instructions
- complete ownership verification
- complete routing/TLS readiness checks
- have the domain automatically activated when safe
- know exactly what is pending when activation is not safe
- disconnect a custom domain with clear consequences
- keep the HubForJ-hosted address available as fallback

### Operational Outcome

HubForJ operators should be able to:

- inspect every custom-domain lifecycle state
- reconcile Firestore domain state with Vercel state
- repair stale or missing mappings
- safely disable runtime routing without deleting customer configuration
- prevent reserved-host or duplicate-domain collisions
- audit who requested, verified, activated, failed, retried, or disconnected a domain

### Security Outcome

The platform must prevent:

- taking over another hub's domain
- using platform-managed hostnames as custom domains
- activating a domain before ownership is proven
- routing unknown custom domains to arbitrary hubs
- exposing admin/member routes on a domain owned by someone else
- bypassing Growth entitlement server-side
- leaking internal automation endpoints
- cache leakage across hostnames, hubs, users, or auth states
- using custom-domain host headers as authorization evidence
- creating Stripe return URLs for unverified/unconnected domains
- letting a non-owner disconnect a domain unless product policy intentionally allows it

### Performance Outcome

Custom-domain runtime should not materially slow normal requests.

Middleware custom-domain resolution must:

- avoid broad Firestore scans
- use direct mapping document lookups
- avoid repeated network waterfalls where possible
- have clear cache/revalidation behavior
- fail closed to normal Next routing if no mapping is found
- avoid write-on-read repair as the normal request path
- expose timing so regressions are visible in production logs

Target thresholds should be confirmed during implementation, but the initial enterprise target is:

- custom-domain mapping resolution should add under 50 ms p95 when served from the chosen runtime cache/projection
- custom-domain mapping resolution should add under 200 ms p95 when it has to call the internal resolve endpoint
- unknown custom-domain misses should be rate-limited or cached briefly enough to avoid repeated expensive misses
- Vercel API calls should never happen during normal page rendering or middleware routing

## Proposed Domain Lifecycle Model

### Status Values

Retain existing values, but tighten semantics:

- `not_configured`
- `pending_verification`
- `verification_failed`
- `verified`
- `provisioning`
- `provisioning_failed`
- `certificate_pending`
- `activation_ready`
- `connected`
- `disconnect_scheduled`
- `disconnecting`
- `disconnect_failed`
- `disconnected`

The existing `verifying` status is currently used to mean "DNS TXT matched and runtime activation is next." That name is ambiguous. The implementation can either:

- introduce clearer new statuses, or
- preserve `verifying` for compatibility and add derived UI labels.

Recommendation:

- preserve old statuses during migration
- add normalized domain lifecycle selectors that map old/new statuses to stable UI phases
- migrate persisted records only after the new lifecycle is proven

### Required Domain Checks

Each domain should have separate checks for:

- ownership TXT record
- DNS routing record
- Vercel domain added
- Vercel verification state
- Vercel certificate state
- internal mapping state
- canonical/companion redirect state

Do not collapse these into one boolean. Admins and support need to know what is actually failing.

### Apex Versus Subdomain

The setup flow must distinguish:

- apex/root domains, e.g. `example.com`
- subdomains, e.g. `community.example.com`
- `www` companion domains

The UI should show provider-neutral instructions:

- for subdomains: CNAME to the Vercel target
- for apex: A/ALIAS/ANAME guidance depending on Vercel requirements
- for ownership: TXT at `_hubforj-verify.{hostname}`

The exact Vercel targets must be pulled from configuration or Vercel API responses rather than hard-coded in arbitrary UI copy.

## Phase 0: Implementation Prep And Baseline

### Deliverables

- Confirm Vercel project ownership and API strategy.
- Attach arbitrary customer domains to the main hub-platform Vercel project for the first implementation pass.
- Confirm canonical product root remains separate from the hub-platform Vercel project.
- Confirm production env values:
  - `NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN`
  - `PLATFORM_RESERVED_HOSTS`
  - `INTERNAL_AUTOMATION_SECRET`
  - `CUSTOM_DOMAIN_RUNTIME_ENABLED`
  - proposed Vercel integration env vars
- Capture baseline behavior for:
  - platform subdomain public route
  - platform subdomain admin route
  - pending custom-domain setup
  - TXT verification check
  - internal lifecycle run
  - custom-domain runtime disabled state

### Confirmed Vercel Details

Confirmed before implementation:

- Vercel project ID:
  - `prj_Xn3SNVIi8AP3jwCBKbUO5Z5evxdw`
- Vercel ownership:
  - personal account, not a Vercel team
- Vercel token:
  - created for custom-domain automation
  - added to the hub-platform Vercel project as `VERCEL_API_TOKEN`

Implementation assumptions:

- `VERCEL_TEAM_ID` is not required while the project remains in a personal Vercel account.
- `VERCEL_HUB_PLATFORM_PROJECT_ID` must be added to the hub-platform Vercel project before the Vercel adapter is enabled.
- Do not confuse this with Firebase project id `community-app-c2f67`; Vercel project ids use the `prj_...` shape.
- Vercel API access must be verified through a dry-run/status diagnostic before any domain add/remove operation is enabled.

### Proposed New Environment Variables

Names can be adjusted during implementation, but the plan should expect:

- `VERCEL_API_TOKEN`
- `VERCEL_TEAM_ID`
  - optional for current personal-account deployment
  - required if the hub-platform Vercel project later moves to a team
- `VERCEL_HUB_PLATFORM_PROJECT_ID=prj_Xn3SNVIi8AP3jwCBKbUO5Z5evxdw`
- `HUB_PLATFORM_CUSTOM_DOMAIN_VERCEL_ENABLED`
- `HUB_PLATFORM_CUSTOM_DOMAIN_AUTO_ACTIVATE_ENABLED`
- `HUB_PLATFORM_CUSTOM_DOMAIN_ALLOWED_HOSTNAME_SUFFIXES`
- `HUB_PLATFORM_CUSTOM_DOMAIN_BLOCKED_HOSTNAMES`
- `HUB_PLATFORM_CUSTOM_DOMAIN_DNS_TARGET`
- `HUB_PLATFORM_CUSTOM_DOMAIN_SETUP_RATE_LIMIT_PROVIDER`
- `HUB_PLATFORM_CUSTOM_DOMAIN_CHECK_RATE_LIMIT_PROVIDER`
- `HUB_PLATFORM_CUSTOM_DOMAIN_RUNTIME_CACHE_TTL_SECONDS`
- `HUB_PLATFORM_CUSTOM_DOMAIN_MISS_CACHE_TTL_SECONDS`
- `HUB_PLATFORM_CUSTOM_DOMAIN_VERCEL_TIMEOUT_MS`

Feature flags should allow Vercel provisioning to be enabled separately from runtime routing.

### Success Criteria

- Current behavior is documented with screenshots/logs.
- Vercel project ID and personal-account scope are confirmed.
- Vercel token can read the configured project and project-domain state through diagnostics.
- Env var rollout is documented for local, preview, and production.
- No product code is changed in this phase except optional instrumentation if later approved.

## Phase 1: Domain Lifecycle Data Model Hardening

### Deliverables

Create or normalize a stronger lifecycle model around the existing `customDomain` object.

Add fields as needed:

- `status`
- `lifecyclePhase`
- `hostname`
- `canonicalHost`
- `companionHost`
- `requestedAt`
- `requestedByUserId`
- `ownershipVerifiedAt`
- `ownershipLastCheckedAt`
- `ownershipFailureReason`
- `dnsRoutingStatus`
- `dnsRoutingLastCheckedAt`
- `dnsRoutingFailureReason`
- `vercelProjectId`
- `vercelDomainId`
- `vercelDomainAddedAt`
- `vercelVerificationStatus`
- `vercelVerificationLastCheckedAt`
- `certificateStatus`
- `certificateLastCheckedAt`
- `activationReadyAt`
- `connectedAt`
- `connectedByUserId`
- `lastActivatedAt`
- `disconnectAt`
- `disconnectedAt`
- `lastLifecycleRunAt`
- `lastLifecycleError`
- `schemaVersion`

Add a domain lifecycle event log subcollection:

- `hubs/{hubId}/customDomainEvents/{eventId}`

Suggested event fields:

- `type`
- `hostname`
- `actorUserId`
- `actorType`
- `createdAt`
- `beforeStatus`
- `afterStatus`
- `details`
- `error`

### Compatibility Requirements

- Existing `customDomain` records must continue to render.
- Existing connected domains must keep routing.
- Existing `customDomains` array compatibility must remain until safely removed.
- Existing internal lifecycle endpoints must continue to handle old statuses.
- Existing session behavior must remain host-scoped unless a separate security review approves broader cookie-domain behavior.
- Existing Stripe return URL behavior must continue to use the current request host only when that host is a verified platform subdomain or connected custom domain.

### Domain Claim Model

Add deterministic claim documents so duplicate-domain protection is transactional rather than best-effort.

Recommended collection:

- `customDomainClaims/{hostname}`

Recommended fields:

- `hostname`
- `hubId`
- `hubSlug`
- `status`
- `createdAt`
- `updatedAt`
- `expiresAt`
- `createdByUserId`
- `releasedAt`
- `releasedByUserId`

Rules:

- claim creation must happen in a Firestore transaction
- the same hub may reuse its own active claim idempotently
- another hub must be rejected if an active claim exists
- stale pending claims may expire only if no connected mapping exists
- connected claims should not expire automatically
- disconnect should release or mark the claim according to the Vercel retention policy

### Success Criteria

- All current and future statuses normalize into stable UI phases.
- Old records do not break the Account settings page.
- New records have enough detail for support diagnostics.
- Duplicate ownership is enforced by deterministic claim documents, not only query checks.

## Phase 2: Vercel Domain Service Adapter

### Deliverables

Add a server-only Vercel adapter.

Responsibilities:

- add a domain to the hub-platform Vercel project
- fetch domain status
- fetch verification challenges or domain config
- remove a domain from the project when safe
- normalize Vercel errors into product-safe messages
- classify retryable versus terminal failures

Expected module shape:

- `apps/hub-platform/src/lib/server/vercel-domains.js`
- `apps/hub-platform/src/lib/domain/custom-domain-vercel.js`

The adapter should expose high-level methods such as:

- `addProjectDomain(hostname)`
- `getProjectDomain(hostname)`
- `removeProjectDomain(hostname)`
- `getDomainConfig(hostname)`
- `verifyProjectDomain(hostname)`
- `normalizeVercelDomainStatus(response)`

### Current Vercel API Shape To Design Around

As of the plan audit, Vercel exposes project-domain operations through the Projects API.

The adapter should be built around project-level domain ownership because customer domains must be attached to the hub-platform Vercel project, not merely added at an account level.

Relevant API shapes to verify during implementation:

- add project domain:
  - `POST /v10/projects/{idOrName}/domains`
- get project domain:
  - `GET /v9/projects/{idOrName}/domains/{domain}`
- verify project domain:
  - `POST /v9/projects/{idOrName}/domains/{domain}/verify`
- remove project domain:
  - `DELETE /v9/projects/{idOrName}/domains/{domain}`
- get domain configuration:
  - `GET /v6/domains/{domain}/config`

The exact versions and response fields should be confirmed against Vercel docs during implementation, then wrapped behind the adapter so future API version changes do not leak into app logic.

Do not use account-level `POST /v4/domains` as the primary self-service operation unless there is a deliberate reason to register/manage the domain at account scope first. Adding a domain to the account is not the same product action as attaching it to the hub-platform project.

### Design Rules

- Keep raw Vercel API details out of React components.
- Never expose `VERCEL_API_TOKEN` to the client.
- Do not call Vercel from middleware.
- Do not block normal page requests on Vercel API calls.
- Time out external calls with clear retry behavior.
- Log enough context for support without logging secrets.
- Use `teamId` or team slug consistently when the hub-platform project belongs to a Vercel team.
- Treat the Vercel project id/name as configuration, not a derived value.

### Failure Handling

Handle at least:

- unauthorized Vercel token
- wrong team/project ID
- domain already exists on this Vercel project
- domain exists on another Vercel project/account
- invalid hostname
- domain not found after expected creation
- verification challenge returned but not completed
- rate limit
- Vercel outage
- certificate pending
- DNS misconfigured

### Success Criteria

- Vercel API calls are isolated and testable.
- All failures produce actionable admin/support states.
- No runtime routing depends on live Vercel API calls.

## Phase 3: Request Flow Upgrade

### Current Flow To Replace

Current request flow:

- validate hostname
- check entitlement
- check duplicate domain
- generate TXT token
- write `pending_verification`

This does not add the hostname to Vercel.

### Target Flow

When a Growth admin submits a hostname:

1. Normalize and validate hostname.
2. Re-check Growth entitlement server-side.
3. Acquire a domain-operation lock for the hub/hostname.
4. Check duplicate ownership in Firestore.
5. Add or confirm the domain in the Vercel project.
6. Store Vercel metadata and DNS instructions.
7. Generate or preserve TXT ownership token.
8. Store lifecycle state as pending ownership/routing verification.
9. Write a lifecycle event.
10. Revalidate account settings and public shell cache as needed.

### Authorization Requirements

Use explicit action access boundaries:

- setup/update request:
  - `owner`, `superadmin`
- check/retry verification:
  - `owner`, `superadmin`
- destructive disconnect:
  - `owner`, `superadmin`
- support repair:
  - platform `superadmin` or protected internal automation only

Do not leave custom-domain mutations on implicit default action-access behavior. Each action should state its allowed roles.

### Locking

Add a lightweight lock to prevent double-submits and race conditions.

Potential options:

- `customDomain.operationLock`
- separate `customDomainOperations/{hubId_hostname}` document

Lock fields:

- `operation`
- `hostname`
- `lockedAt`
- `lockedByUserId`
- `expiresAt`

Locks must expire automatically by timestamp logic so a failed request does not permanently block setup.

### Idempotency

The setup action must be idempotent for:

- same hub + same hostname + same pending state
- same hub + same hostname + already added to Vercel
- retry after Vercel timeout where the project domain was actually created
- retry after Firestore write failure where a Vercel domain may already exist

Implementation should prefer "read current external/internal state, then converge" over "assume previous step completed or failed."

### Success Criteria

- Double-clicking setup does not create inconsistent state.
- Re-submitting the same hostname is idempotent.
- Updating to a different hostname removes or supersedes stale pending state safely.
- Vercel domain is present before the UI claims routing/certificate checks can proceed.
- Failed Vercel calls do not leave a domain claim permanently stuck.
- Security-sensitive errors are logged for support but summarized safely for the admin.

## Phase 4: Verification And Activation Flow Upgrade

### Current Flow To Replace

Current "Check again" only checks TXT ownership and then says activation is next.

### Target Flow

"Check again" should run a full safe readiness check:

1. Check TXT ownership.
2. Check DNS routing.
3. Check Vercel domain config.
4. Check Vercel verification state.
5. Check certificate state.
6. If all checks pass and auto-activation is enabled, write internal mappings.
7. If not all checks pass, update precise pending/failure reasons.

### Activation Rules

Only activate internal routing when:

- hub remains entitled to custom domains
- hostname still belongs to the same hub
- TXT ownership is verified
- Vercel domain is attached to the correct project
- Vercel says the domain is verified or configured sufficiently
- certificate is ready or acceptable for Vercel-managed serving
- `CUSTOM_DOMAIN_RUNTIME_ENABLED=true`
- `HUB_PLATFORM_CUSTOM_DOMAIN_AUTO_ACTIVATE_ENABLED=true`
- the deterministic `customDomainClaims/{hostname}` document belongs to the same hub
- any existing mapping for the canonical or companion host belongs to the same hub
- the host is not reserved, blocked, or platform-managed at activation time

### Mapping Writes

When activated:

- write canonical mapping for hostname
- write companion mapping for `www` or apex counterpart where appropriate
- set `connectedAt`
- set `connectedByUserId` or system actor
- clear failure reasons
- write lifecycle event

Mapping writes should be transactional where possible. If multiple mapping documents are written, all must agree on the same `hubId`, `hubSlug`, `canonicalHost`, and `status`.

Do not write custom-domain mappings as part of ordinary page rendering. Repair/hydration should move to lifecycle or reconciliation paths once self-service is enabled.

### Success Criteria

- Admin does not need support in the normal path.
- UI shows exactly which check is pending.
- Internal mapping is not written before the external host is safely routable.
- Activation is idempotent.
- Runtime routing never points a hostname at a hub before ownership, Vercel readiness, and mapping claim checks pass.

## Phase 5: Account Settings UX Upgrade

### Current UX Gaps

The current Account settings UI:

- shows TXT instructions
- does not clearly separate ownership, routing, Vercel verification, and certificate readiness
- does not explain whether HubForJ or the customer must take the next activation step
- displays raw ISO timestamps in some places
- has limited copy for apex versus subdomain setup

### Target UX

Use a compact domain lifecycle panel with clear steps:

1. Domain entered
2. Ownership verification
3. DNS routing
4. Secure connection
5. Connected

Each step should show:

- status
- required action
- exact DNS record if applicable
- last checked timestamp in readable format
- retry/check button where appropriate

### Required UI States

Support:

- locked on non-Growth
- not configured
- pending ownership TXT
- ownership failed/not found
- ownership verified
- Vercel provisioning pending
- DNS routing pending
- certificate pending
- connected
- disconnect scheduled
- disconnected
- failed requiring support
- active on hosted fallback while custom domain is pending
- connected custom domain with hosted fallback still available
- session may need to be re-established on the new custom host

### DNS Instruction Requirements

For each hostname, show:

- TXT ownership record
- routing record type
- routing host/name
- routing value/target

Apex domains and subdomains should not receive identical instructions unless Vercel explicitly returns identical guidance.

### UX Performance Requirements

The Account settings title shell should render quickly. Domain lifecycle details may load inside the existing Account settings Suspense boundary, but the page should not block on live Vercel API calls.

The UI should read stored lifecycle state from Firestore. The "Check again" action can trigger external checks and then refresh the panel. Background lifecycle jobs can update the panel between visits.

### Success Criteria

- A non-technical admin can understand what to do.
- Support can diagnose from the same screen.
- Copy does not overpromise instant activation.
- The HubForJ-hosted fallback address remains visible.
- No Account settings render path calls Vercel directly.

## Phase 5B: Enterprise Admin User Journey For Adding A Custom Domain

### Objective

Make custom-domain setup simple enough for a non-technical Growth-plan hub owner while still giving precise DNS direction for technical admins and support teams.

The admin should never need to understand Vercel, certificates, CNAME flattening, or ownership verification as abstract concepts. The UI should translate those concepts into:

- what domain they want to use
- where they bought/manage that domain
- which DNS records to add
- how to check progress
- what to do if the provider uses different field labels
- when the domain is live

### Journey Principles

- Keep the default path short and guided.
- Do not expose every lifecycle detail up front.
- Show exact copyable DNS values.
- Use the customer's registrar terminology where possible.
- Explain DNS propagation without making the admin feel they did something wrong.
- Keep HubForJ-hosted fallback visible at every step.
- Never ask the admin to change nameservers unless the product intentionally supports and recommends that path.
- Never ask the admin to remove existing email records.
- Warn before they replace existing website records.
- Verify automatically in the background after records are added.
- Make support escalation clear if the domain is blocked by external provider state.

### Recommended Entry Point

Account settings should show a domain card with:

- current HubForJ-hosted address
- current custom domain status
- Growth entitlement state
- primary action:
  - "Connect custom domain"
  - "Continue setup"
  - "Check DNS"
  - "Manage connected domain"

For locked plans, show:

- "Custom domains are available on Growth"
- a link to package management
- the current hosted address

For Growth hubs, start the guided setup.

### Step 1: Choose Domain

Screen title:

- "Connect your custom domain"

Fields:

- Custom domain
  - placeholder: `community.example.com`
  - helper: "Enter the address members should use for this hub."

Recommended inline options:

- "Use a subdomain" recommended
  - example: `community.yourdomain.com`
- "Use my root domain"
  - example: `yourdomain.com`

Recommendation:

- Launch should prefer subdomains as the guided default because they are easier and safer across DNS providers.
- Apex/root domains can be supported if Vercel apex-domain behavior is fully validated, but the UI should explain that root domains may affect an existing website.

Validation before continuing:

- show normalized domain before saving
- reject platform-managed domains
- reject wildcard domains
- reject raw IPs
- reject invalid/public-suffix-only domains
- warn when admin enters `www.example.com` that HubForJ can use it as primary, but their root domain behavior should be intentional

### Step 2: Identify DNS Provider

After the domain is accepted, ask:

- "Where do you manage DNS for this domain?"

Provide quick choices:

- Cloudflare
- GoDaddy
- Namecheap
- Squarespace Domains
- Wix
- IONOS
- Bluehost
- Hostinger
- Other provider
- "I'm not sure"

Important:

- The registrar where they bought the domain is not always the DNS provider.
- The UI should say: "Use the account where your domain's nameservers are managed."

For "I'm not sure":

- show a short explanation of nameservers
- provide a "Check nameservers" button if we implement DNS NS lookup
- tell the admin the likely provider based on nameserver lookup when available

Potential enhancement:

- Add a lightweight server action that runs NS lookup for the domain and maps common nameserver patterns to provider names.
- Example:
  - `*.cloudflare.com` -> Cloudflare
  - `domaincontrol.com` -> GoDaddy
  - `registrar-servers.com` -> Namecheap
  - Squarespace nameserver patterns -> Squarespace Domains

This should be treated as a helpful suggestion, not a security decision.

### Step 3: Show Exact DNS Records

The UI should show two separate sections:

1. Verify ownership
2. Point visitors to HubForJ

Each record should be displayed in a copy-friendly table:

| Purpose | Type | Name/Host | Value/Target | TTL |
| --- | --- | --- | --- | --- |
| Verify ownership | TXT | `_hubforj-verify.community` | `verify-...` | Auto/default |
| Point domain | CNAME | `community` | configured Vercel target | Auto/default |

For a root/apex domain, the routing record should use the exact Vercel-derived instruction. Do not hard-code apex records unless the Vercel adapter confirms the current required values.

The table should support:

- copy value button per cell
- "Copied" confirmation
- provider-specific field label aliases
- warning if the admin must edit an existing conflicting record

Provider field label examples:

- GoDaddy:
  - Type
  - Name
  - Value
  - TTL
- Namecheap:
  - Type
  - Host
  - Value
  - TTL
- Cloudflare:
  - Type
  - Name
  - Content
  - Proxy status
  - TTL
- Squarespace:
  - Type
  - Host/Name
  - Data
  - TTL

Cloudflare-specific note:

- If the record is a CNAME/A record for HubForJ routing, the UI should explain the required proxy mode based on the Vercel/Cloudflare compatibility decision.
- For safest launch, recommend DNS-only for the routing record unless the Vercel + Cloudflare proxied path has been explicitly verified.
- TXT records are not proxied.

Email safety note:

- "Do not remove MX, SPF, DKIM, DMARC, or other email records. HubForJ only needs the records shown here."

Existing website warning:

- If connecting a root domain, say: "This may replace the website currently using this root domain."
- If connecting a subdomain, say: "This only affects this subdomain, not your main website."

### Step 4: Registrar-Specific Guidance

The enterprise solution should provide registrar-specific help without tightly coupling the app to brittle third-party UI screenshots.

Recommended launch approach:

- Provide a registrar selector.
- Show provider-specific short instructions using stable terminology.
- Link to the provider's official DNS help article.
- Use HubForJ-owned illustrated examples or annotated generic diagrams rather than copying third-party screenshots.
- Add "Open registrar in new tab" only where a stable DNS dashboard URL exists; otherwise link to help/search guidance.

Why not rely only on screenshots:

- registrar screens change frequently
- screenshots can become stale
- screenshots may require permission/licensing
- screenshots can differ by country, account type, and product bundle

Best enterprise approach:

- use simple guided steps in-app
- use copyable values
- use provider terminology
- link to official current documentation
- optionally add HubForJ-created short videos/GIFs for the most common providers and review them quarterly

Provider guidance examples:

#### Cloudflare

In-app steps:

1. Open Cloudflare and choose your domain.
2. Go to DNS > Records.
3. Select Add record.
4. Add the TXT verification record exactly as shown.
5. Add or update the routing record exactly as shown.
6. Save both records.
7. Return to HubForJ and select "Check DNS".

Provider-specific notes:

- Cloudflare uses "Content" for the value/target field.
- TTL can usually stay on Auto.
- Proxy status appears for CNAME/A records, not TXT records.
- Use the proxy mode recommended by HubForJ for the specific record.

#### GoDaddy

In-app steps:

1. Open your GoDaddy Domain Portfolio.
2. Select the domain.
3. Open DNS.
4. Select Add New Record.
5. Add the TXT verification record.
6. Add or update the CNAME/routing record.
7. Save changes.
8. Return to HubForJ and select "Check DNS".

Provider-specific notes:

- GoDaddy uses "Name" for the host field.
- GoDaddy uses "Value" for the target/content field.
- The name should usually be the prefix only, not the full domain, unless HubForJ explicitly shows otherwise.
- DNS changes often appear quickly but can take up to 48 hours globally.

#### Namecheap

In-app steps:

1. Open Namecheap.
2. Go to Domain List.
3. Select Manage for the domain.
4. Open Advanced DNS.
5. Select Add New Record.
6. Add the TXT verification record.
7. Add or update the CNAME/routing record.
8. Save changes.
9. Return to HubForJ and select "Check DNS".

Provider-specific notes:

- Namecheap uses "Host" for the name field.
- Namecheap uses "Value" for the target/content field.
- Namecheap may automatically append the root domain, so admins should enter the prefix shown by HubForJ, not duplicate the full domain unless instructed.

#### Squarespace Domains

In-app steps:

1. Open your Squarespace domains dashboard.
2. Select the domain.
3. Open DNS.
4. Add or edit records in DNS settings/custom records.
5. Add the TXT verification record.
6. Add or update the routing record.
7. Save changes.
8. Return to HubForJ and select "Check DNS".

Provider-specific notes:

- Squarespace may call the value field "Data".
- Custom records can have a default TTL.
- DNS updates may take 24-48 hours.

#### Other Provider

Show generic instructions:

1. Sign in to the account where your domain DNS is managed.
2. Find DNS settings, DNS records, Zone editor, or Advanced DNS.
3. Add the TXT record exactly as shown.
4. Add or update the routing record exactly as shown.
5. Save changes.
6. Return to HubForJ and select "Check DNS".

Also show:

- "If your provider asks for Host, Name, Alias, or Subdomain, use the Name/Host value from HubForJ."
- "If your provider asks for Value, Content, Data, Points to, or Target, use the Value/Target from HubForJ."
- "Leave TTL as Auto/default unless your provider requires a value."

### Step 5: Check DNS

The admin selects:

- "Check DNS"

The action should:

- check ownership TXT
- check routing record
- check Vercel project domain status
- check certificate status
- update stored lifecycle state
- refresh the UI

UI outcomes:

- "Ownership verified"
- "Routing record not found yet"
- "Certificate is being prepared"
- "Domain connected"
- "We found a conflicting DNS record"
- "This domain appears to be managed by another Vercel account/project"
- "We need support to review this domain"

The UI should explain that DNS can take time.

Recommended copy:

- "DNS changes are often visible within minutes, but some providers can take up to 24-48 hours. You can leave this page and come back later."

### Step 6: Background Completion

After the admin adds DNS records, HubForJ should continue checking in the background.

Behavior:

- Account settings shows latest known state.
- A scheduled lifecycle job checks pending domains.
- When all checks pass, HubForJ activates the domain automatically.
- Optional email notification can tell the admin the domain is live.

Recommended notification:

- subject: "Your custom domain is connected"
- include custom domain URL
- include fallback HubForJ-hosted URL
- include admin URL

### Step 7: Connected State

Connected screen should show:

- custom domain
- status: Connected
- public website URL
- admin URL
- fallback HubForJ-hosted URL
- connected date
- last checked date
- "Open website"
- "Open admin"
- "Disconnect domain"

Important:

- The fallback HubForJ-hosted address should remain available.
- The app should explain that sessions may be separate per hostname if the admin signs in on the hosted address and then opens the custom domain.

### Step 8: Troubleshooting

Add a compact troubleshooting panel.

Common problems:

- "TXT record not found"
- "TXT value does not match"
- "Routing record not found"
- "Existing CNAME/A record conflicts"
- "Cloudflare proxy mode may be blocking verification/routing"
- "Domain is attached to another Vercel project"
- "Certificate is still pending"
- "DNS provider is not the registrar where you bought the domain"
- "Email records should not be changed"

Each problem should show:

- what HubForJ checked
- what the admin should check next
- whether support is needed
- last checked timestamp

### Step 9: Guided Tour And Visual Help

Recommendation:

- Build a first-party guided setup panel in HubForJ.
- Do not depend on third-party screenshots as the primary instruction source.
- Add optional provider-specific illustrated steps using HubForJ-created visuals.
- Link to official registrar help pages for current external UI details.

Best enterprise design:

- one guided wizard inside HubForJ
- provider selector
- copyable DNS records
- provider-specific terminology
- official help links
- automated checks
- background lifecycle
- clear support escalation

Screenshots/video:

- Useful for top providers after launch data shows which providers customers actually use.
- Should be HubForJ-created, dated, and reviewed quarterly.
- Should not block the first enterprise implementation because copyable DNS records and automated checks are more durable and more important.

### User Journey Acceptance Criteria

- Admin can complete setup without contacting support for a standard subdomain.
- Admin understands where to add DNS records even if the registrar and DNS provider differ.
- Admin sees exact DNS records and can copy each value.
- Admin can choose a common provider and see provider-specific field names.
- Admin is warned not to delete email records.
- Admin is warned before changing a root domain that may already host a website.
- Admin can leave and return while background verification continues.
- Connected state provides website, admin, and fallback URLs.
- Error states identify the failed check without exposing sensitive internals.
- Support can use the same screen to diagnose the issue.

## Phase 6: Internal Lifecycle And Reconciliation

### Current State

Internal endpoints exist, but custom domains are not yet integrated into the broader projection reconciliation endpoint.

### Deliverables

Add custom-domain lifecycle and reconciliation operations:

- run pending domain verification
- run Vercel provisioning checks
- run activation checks
- run disconnect processing
- reconcile connected Firestore mappings against hub records
- reconcile hub records against Vercel project domains
- flag orphaned Vercel domains
- flag orphaned Firestore mappings
- flag connected hub domains with no Vercel readiness

Options:

- extend `/api/internal/projections/reconcile` with `includeCustomDomains=true`, or
- keep `/api/internal/custom-domains/run` and add a dedicated `/api/internal/custom-domains/reconcile`.

Recommendation:

- keep lifecycle execution in custom-domain endpoints
- add custom-domain reporting to the unified reconcile endpoint so support has one diagnostics entry point

### Scheduled Automation

Configure scheduled jobs for:

- frequent checks for recently requested domains
- less frequent reconciliation for connected domains
- disconnect processing

Suggested cadence:

- every 5 minutes for pending domains
- every 30-60 minutes for connected-domain reconciliation
- every 5-15 minutes for disconnect queue

### Reconciliation Scope

Reconciliation should compare:

- `hubs.customDomain`
- `hubs.customDomains`
- `customDomainClaims`
- `customDomainMappings`
- Vercel project domains
- runtime cache/projection entries, if introduced

Reports should distinguish:

- missing claim
- stale pending claim
- claim belongs to wrong hub
- mapping missing for connected domain
- mapping points to wrong hub
- Vercel project domain missing
- Vercel domain exists but is not verified
- certificate not ready
- Firestore connected but Vercel not connected
- Vercel connected but Firestore not connected
- companion host mismatch
- blocked/reserved hostname currently present in state

Repair operations must be explicit. Dry-run reporting must be the default for support-facing manual endpoints.

### Success Criteria

- Domain activation does not depend on a human manually calling endpoints.
- Stale states recover automatically.
- Support can run dry-run diagnostics before repairs.
- Repairs are idempotent.
- Reconciliation can prove Firestore, Vercel, and runtime mapping state agree before broad rollout.

## Phase 7: Disconnect And Downgrade Behavior

### Current State

Disconnect is scheduled immediately from the account settings action, and an internal processor later removes internal mappings.

### Required Decisions

Define what happens when:

- a Growth hub downgrades to Starter/Free
- package payment fails
- package cancellation is scheduled
- custom-domain entitlement is manually revoked
- custom domain is disconnected by admin
- domain is removed from Vercel but Firestore still says connected

### Recommended Policy

For launch:

- manual disconnect should remove internal mapping and optionally remove Vercel project domain
- downgrade should schedule disconnect after a grace period
- failed payment should not immediately break the customer domain
- cancellation at period end should schedule disconnect at entitlement end
- support override can keep custom domain active temporarily

### Security Requirements

- Disconnect action should require owner/superadmin unless product explicitly approves admin-level disconnect.
- Disconnect must require exact hostname confirmation.
- Disconnect should write an audit event before and after processing.
- Downgrade-triggered disconnect should include package/billing context in lifecycle events.
- Vercel removal should not happen before internal routing fallback is confirmed.

### Success Criteria

- Customers are not abruptly broken by billing transitions.
- HubForJ-hosted address remains available.
- Domain state reflects entitlement state.
- Support can see why a domain is still active or scheduled for removal.
- A failed Vercel removal does not leave the hub unreachable.

## Phase 8: Middleware And Runtime Performance Hardening

### Current State

Middleware resolves custom-domain candidates by calling an internal route with `cache: "no-store"`.

This is safe for correctness but can add a request-time waterfall for custom-domain traffic.

### Deliverables

Assess and optimize runtime lookup:

- direct edge-compatible lookup if feasible
- short TTL cache for custom-domain mappings
- fail-closed behavior on lookup failure
- metrics for resolve latency
- clear fallback for runtime disabled
- miss caching for unknown hosts with a very short TTL
- explicit invalidation after activation/disconnect
- removal of write-on-read mapping hydration from the hot path once reconciliation is available

### Constraints

- Middleware cannot use Firebase Admin directly in an edge runtime.
- Do not introduce stale routing that serves one hub on another hub's domain.
- Do not cache missing mappings for long during setup/activation.
- Do not trust `host` or `x-forwarded-host` for authorization; host resolution only establishes route context.
- Do not route platform root/reserved hosts through custom-domain candidate behavior.

### Recommended Approach

Initial enterprise-safe approach:

- keep internal resolve endpoint
- add short-lived cache headers or platform cache only if safe
- add timing/logging around resolve
- ensure activation/deactivation invalidates relevant mapping cache
- use deterministic `customDomainMappings/{hostname}` documents as the runtime source
- return compact payloads from resolve: `hubId`, `hubSlug`, `canonicalHost`, `redirectTo`, `status`
- avoid returning customer PII, package state, or lifecycle failure details from runtime resolve

Future advanced approach:

- move domain mappings to an edge-friendly KV/config store
- treat Firestore as source of truth and KV as runtime projection

### Runtime Cache Policy

Initial TTL recommendation:

- connected mapping hit: 30-120 seconds
- unknown host miss: 5-15 seconds
- redirect/companion mapping: 30-120 seconds

Activation and disconnect should invalidate any runtime cache/projection immediately where the platform supports explicit invalidation. TTL exists as a safety net, not the primary consistency mechanism.

Runtime cache entries must include:

- `hostname`
- `hubId`
- `hubSlug`
- `canonicalHost`
- `redirectTo`
- `status`
- `updatedAt`
- `schemaVersion`

Do not cache:

- pending domains
- failed domains
- disconnected domains
- activation-blocked domains
- Vercel failure details

### Success Criteria

- Custom-domain request overhead is measurable.
- Unknown custom domains fail closed.
- Connected domains route consistently after activation.
- Disconnect takes effect predictably.
- Middleware p95 overhead is within the target set in the Performance Outcome section.

## Phase 9: Cache And Revalidation Safety

### Existing Cache Context

Public content caching is keyed by hub identity after route resolution, which is compatible with custom domains and platform subdomains.

### Required Safety Checks

Verify that:

- anonymous public content does not key solely by hostname
- signed-in member/admin state is never globally cached across custom domains
- custom-domain activation revalidates relevant hub shell/content caches
- custom-domain disconnect does not leave stale canonical links or URLs
- generated URLs use the current route mode correctly
- Stripe return URLs use the active request host only when that host is an accepted platform subdomain or connected custom domain.
- Host-mode auth redirects strip `/{hubSlug}` prefixes and never redirect to arbitrary external URLs.
- Session cookies remain host-scoped unless a separate security decision intentionally changes that behavior.

### Success Criteria

- Same hub content renders correctly on both platform subdomain and custom domain.
- Personalized header/member/admin state remains correct.
- Canonical URL and metadata behavior is intentional.
- Domain activation and disconnect do not create stale navigation, CTA, checkout, or auth URLs.

## Phase 10: Security And Abuse Controls

### Required Controls

Add or verify:

- server-side Growth entitlement enforcement
- owner/admin role requirement for domain mutation
- optional owner-only requirement for disconnect
- domain-operation rate limiting
- DNS check rate limiting
- Vercel API call rate limiting/backoff
- audit logging for all lifecycle transitions
- blocked hostname/domain list
- protection against platform hostnames
- protection against duplicate ownership
- safe handling for public suffix and wildcard edge cases
- explicit allowed-role configuration per server action
- deterministic domain claims for transactional ownership
- strict internal automation authorization for lifecycle and resolve endpoints
- safe error messages that do not expose Vercel tokens, DNS record contents from unrelated domains, stack traces, or internal project IDs to admins
- observability that redacts secrets but includes hub id, hostname, lifecycle phase, and operation id
- protection against Unicode/homograph spoofing unless internationalized domain names are deliberately supported
- lowercase punycode normalization if internationalized domain names are supported later
- rejection of wildcard hostnames such as `*.example.com` for customer self-service unless wildcard support receives a separate design
- rejection of localhost, private/internal hosts, raw IP addresses, and single-label hostnames
- anti-enumeration behavior for duplicate-domain errors where appropriate

### Public Suffix Consideration

The current validation checks that a hostname includes a dot and is not platform-managed. That is not enough for all cases.

Consider using a public suffix parser to prevent invalid or unsafe requests such as:

- `co.uk`
- `github.io`
- provider-owned multi-tenant roots where ownership semantics are unclear

If a public suffix library is introduced, document dependency and rollout risk.

### Host Header Trust

The current app correctly uses host headers to determine route mode and build same-host runtime paths. For custom-domain self-service, host headers must remain route context only.

Rules:

- never authorize a user because they are on a given hostname
- always authorize using signed session, hub id, role, and Firestore access checks
- do not derive hub id from host without checking the resolved mapping status
- do not use untrusted host values to build internal automation URLs outside the current origin
- validate any absolute URL before redirecting

### Secrets And Environment

Required checks before production enablement:

- `INTERNAL_AUTOMATION_SECRET` is strong and shared only with trusted schedulers/internal callers
- `VERCEL_API_TOKEN` has the minimum practical scope
- Vercel team/project identifiers are not accepted from client input
- no public env var exposes internal project IDs unnecessarily
- logs do not include bearer tokens, DNS token values beyond the current hub context, session cookies, or Stripe secrets

### Rate Limiting

Apply rate limits to:

- domain setup requests per hub
- domain setup requests per actor
- verification checks per hub/hostname
- lifecycle external checks per hostname
- unknown-host runtime misses if abuse is observed

Failure mode should be conservative:

- customer UI can show "try again shortly"
- internal lifecycle can back off and retry
- runtime routing should fail closed rather than route incorrectly

### Success Criteria

- A malicious admin cannot claim platform infrastructure hostnames.
- A malicious admin cannot claim another hub's domain.
- Internal automation remains protected.
- Domain lifecycle operations are auditable.
- Host spoofing, duplicate-domain races, and excessive verification retries are explicitly covered.

## Phase 11: Tests

### Unit Tests

Add tests for:

- hostname normalization
- platform-managed hostname rejection
- reserved hostname rejection
- wildcard/raw-IP/private-host/single-label rejection
- public suffix rejection or explicit documented behavior
- duplicate-domain detection
- deterministic domain claim creation/reuse/rejection
- custom-domain status normalization
- Vercel response normalization
- DNS instruction generation
- lifecycle phase selectors
- role gating for setup, verification, disconnect, and support repair
- runtime cache hit/miss normalization if a cache/projection is introduced

### Integration Tests

Add tests for:

- Growth admin can request domain
- Starter admin cannot request domain
- TXT verified domain moves to the correct next state
- Vercel-ready domain activates mappings
- unresolved custom domain does not route
- companion host redirects to canonical
- duplicate slug path redirects away on custom-domain host
- disconnect removes mapping
- disconnect is blocked for non-owner admin if owner-only policy is adopted
- unknown custom-domain misses do not write mappings
- connected mapping resolve does not expose sensitive lifecycle details
- Stripe return URL uses connected custom domain only when request host is valid
- member/admin session redirects remain same-origin and route-mode correct

### Mocking

Mock:

- DNS TXT lookups
- Vercel API responses
- internal automation auth
- Firestore mapping records
- runtime cache/projection store if introduced
- Stripe checkout session creation for return URL assertions

### Manual Verification

Verify in production or a production-like environment:

- subdomain custom domain
- apex custom domain
- `www` companion behavior
- public home
- public events
- public courses
- member sign-in
- member account
- admin sign-in/admin route
- Stripe checkout/return URLs if used on custom domain
- Firebase Auth authorized domain requirements
- session behavior when moving between hosted subdomain and custom domain
- admin owner handoff behavior after custom domain activation
- domain setup rate limiting
- lifecycle scheduler behavior
- rollback flags

## Phase 12: Rollout Strategy

### Feature Flags

Use separate flags for:

- showing self-service UI
- Vercel provisioning
- automatic activation
- runtime routing
- scheduled reconciliation

Suggested flags:

- `HUB_PLATFORM_CUSTOM_DOMAIN_SELF_SERVICE_ENABLED`
- `HUB_PLATFORM_CUSTOM_DOMAIN_VERCEL_ENABLED`
- `HUB_PLATFORM_CUSTOM_DOMAIN_AUTO_ACTIVATE_ENABLED`
- `CUSTOM_DOMAIN_RUNTIME_ENABLED`
- `HUB_PLATFORM_CUSTOM_DOMAIN_RECONCILIATION_ENABLED`

### Rollout Order

1. Ship data model compatibility and diagnostics with self-service UI unchanged.
2. Enable Vercel adapter in dry-run/log-only mode.
3. Enable Vercel provisioning for internal test hubs.
4. Enable full flow for one test Growth hub.
5. Verify public/member/admin routes on subdomain custom domain.
6. Verify apex and `www` companion behavior.
7. Enable scheduled lifecycle.
8. Enable for all Growth hubs.

### Rollback

Rollback must support:

- disabling self-service setup without disconnecting existing domains
- disabling auto-activation while retaining pending states
- disabling runtime routing while preserving configuration
- removing a broken mapping while leaving hub data intact

Do not design rollback as "delete all custom-domain state."

## Phase 13: Documentation And Support Runbook

Create/update:

- admin-facing help copy
- internal support runbook
- Vercel env setup checklist
- DNS troubleshooting guide
- launch verification checklist
- custom-domain incident playbook

Support runbook must include:

- how to inspect current domain state
- how to run lifecycle dry-run
- how to force re-check safely
- how to disconnect safely
- how to identify Vercel-side misconfiguration
- how to recover from orphaned mappings

## Firestore Index Review

Current mapping reads:

- `customDomainMappings/{hostname}` direct doc lookup
- `customDomainMappings where hubSlug == ... limit 5`
- `hubs where customDomain.hostname == ... limit 1`
- `hubs where slug == ... limit 1`
- `hubs where platformSubdomainLabel == ... limit 1`
- `hubs where customDomains array-contains ... limit 1`

Likely required indexes are minimal because most are single-field or direct doc reads. Before implementation, confirm Firestore has automatic single-field indexing enabled for:

- `hubs.slug`
- `hubs.platformSubdomainLabel`
- `hubs.customDomain.hostname`
- `hubs.customDomain.status`
- `customDomainMappings.hubSlug`
- `customDomainMappings.status`

If lifecycle event logs are queried by hub and timestamp, add:

- `hubs/{hubId}/customDomainEvents`: `createdAt desc`

If a fleet-level dashboard lists pending custom domains, add:

- `hubs`: `customDomain.status`, `customDomain.lastCheckedAt`
- `hubs`: `customDomain.status`, `customDomain.requestedAt`

## Launch Policy Decisions

These defaults are resolved for the first implementation pass so engineering can proceed without ambiguity.

### Access Policy

- Start/update custom-domain setup:
  - `owner`, `superadmin`
  - rationale: custom-domain setup controls the public identity of the hub and can affect DNS/routing even before connection
- Check/retry DNS verification:
  - `owner`, `superadmin`
  - rationale: verification can advance lifecycle state toward activation, so it should use the same boundary as setup
- Disconnect custom domain:
  - `owner`, `superadmin`
  - rationale: disconnect can break the public website and should be treated as destructive
- Support repair/manual override:
  - `superadmin` or protected internal automation only
  - rationale: support actions can affect routing and must be tightly controlled

### Domain Shape Policy

- Guided launch default:
  - recommend subdomains, e.g. `community.example.com`
- Apex/root domains:
  - support only after Vercel apex behavior and DNS guidance are verified end to end
  - if not verified before launch, keep apex behind a feature flag or support-assisted path
- Wildcard domains:
  - not supported for customer self-service
- Internationalized domains:
  - not supported for first launch unless punycode/public-suffix handling is implemented and tested

### Canonical Host Policy

- The canonical host is the exact hostname entered and verified by the admin.
- If the admin enters `community.example.com`, that is canonical.
- If the admin enters `example.com`, that is canonical.
- Companion host behavior:
  - `www.example.com` redirects to `example.com` when `example.com` is canonical
  - `example.com` should not automatically redirect to `www.example.com` unless `www.example.com` is the verified canonical host and Vercel/DNS support is confirmed
  - for non-apex subdomains, do not invent extra companion hosts beyond the current `www.` helper without validating the desired behavior

### Entitlement And Downgrade Policy

- Growth active/trialing with custom-domain entitlement:
  - custom-domain setup and connected runtime allowed
- scheduled cancellation:
  - keep custom domain active until entitlement end
- downgrade at entitlement end:
  - schedule disconnect with a grace period
- failed payment:
  - do not immediately disconnect
  - show account warning and allow support/billing recovery
- manual entitlement override:
  - support can temporarily preserve or revoke custom-domain capability, with audit events

### Vercel Removal Policy

- Manual disconnect:
  - remove internal runtime mapping first
  - confirm HubForJ-hosted fallback remains available
  - then remove or mark Vercel project domain according to recovery policy
- Recovery window:
  - retain the Vercel project domain for a short recovery window if operationally safe
  - mark the domain as disconnected in Firestore so it no longer routes
- Immediate Vercel removal:
  - reserved for support/superadmin cases where retention creates conflict or risk

### Manual Activation Policy

- No customer-facing manual activation override.
- No support manual activation before ownership and Vercel readiness checks pass, except for a documented emergency superadmin procedure.
- Any emergency override must write lifecycle events and should be followed by reconciliation.

### Deferred Product Choices

These can be revisited after first launch:

- admin access for setup/check if future customer teams need delegated DNS management
- user-selectable canonical `www` behavior
- full apex self-service
- cross-host session handoff
- registrar-specific videos/screenshots for the most common providers

## Tradeoffs And Edge Cases Audit

### Vercel API Integration

Tradeoff:

- Full automation improves customer experience but introduces external API dependency, token scope risk, rate limits, and operational failure modes.

Mitigation:

- isolate API calls in a server-only adapter
- use feature flags
- make lifecycle operations idempotent
- keep existing HubForJ-hosted address live
- never call Vercel from middleware

### Apex Domain Complexity

Tradeoff:

- Apex domains are commercially valuable but more DNS-provider-dependent than subdomains.

Mitigation:

- model apex/subdomain separately
- display exact Vercel-derived instructions
- consider launching subdomain-only if apex testing is incomplete

### Status Migration

Tradeoff:

- Renaming statuses improves clarity but risks breaking existing records and UI branches.

Mitigation:

- add selectors first
- support old statuses indefinitely during rollout
- migrate only after successful production verification

### Runtime Lookup Performance

Tradeoff:

- Current middleware internal fetch is simple and safe, but adds overhead to every custom-domain request.

Mitigation:

- measure first
- use direct mapping document IDs
- add short TTL or edge projection only after correctness is proven
- keep fail-closed behavior

### Duplicate Domain Ownership

Tradeoff:

- Firestore duplicate checks can race if two admins submit the same hostname at the same time.

Mitigation:

- use deterministic lock/domain claim documents
- make claim creation transactional
- make setup idempotent for the same hub/hostname

### Disconnect Behavior

Tradeoff:

- Immediate disconnect is operationally clean but can break a customer website abruptly.

Mitigation:

- use scheduled disconnect
- show clear warnings
- preserve hosted fallback
- consider recovery window before Vercel removal

### Entitlement Downgrade

Tradeoff:

- Strict entitlement enforcement protects packaging, but abrupt domain removal is poor customer experience.

Mitigation:

- schedule disconnect at entitlement end
- support grace period
- visible account warnings

### Cache Correctness

Tradeoff:

- Caching improves performance but can leak stale host metadata if keyed incorrectly.

Mitigation:

- key content by hub identity
- keep personalized state dynamic
- revalidate on domain connect/disconnect
- verify custom-domain and platform-hosted routes after mutations

### Firebase Auth Authorized Domains

Tradeoff:

- Member/admin auth on arbitrary customer domains may require Firebase Auth authorized domain handling.

Mitigation:

- verify current Firebase Auth behavior for custom domains
- decide whether custom domains must be added manually, via Firebase API, or whether auth flows should use platform-hosted callbacks
- include this in launch verification before enabling full self-service

### Stripe And Payment Return URLs

Tradeoff:

- Stripe checkout/Connect return URLs may use current host or configured base URLs. Custom domains can expose mismatches.

Mitigation:

- audit payment return URL builders before enabling custom-domain payments
- ensure webhook handling remains account/project scoped, not hostname scoped
- verify public booking checkout and admin Stripe setup on custom-domain hosts

## Gaps Found During Plan Audit

This section is intentionally maintained as the plan self-audit.

### Gap 1: Current Code Has No Vercel Provisioning

The plan now includes a dedicated Vercel domain adapter and lifecycle phases for Vercel add/status/remove.

### Gap 2: Current Code Uses Ambiguous `verifying`

The plan now requires normalized lifecycle selectors and compatibility with existing statuses before any migration.

### Gap 3: Current Code Verifies Ownership Only

The plan now separates ownership verification, DNS routing, Vercel readiness, certificate readiness, and internal mapping activation.

### Gap 4: Current Middleware Lookup May Add Runtime Cost

The plan now includes middleware performance measurement and a future edge projection option while preserving fail-closed behavior.

### Gap 5: Current Admin UI Does Not Fully Explain Operational State

The plan now includes a step-based domain lifecycle panel with explicit DNS instructions and support-readable statuses.

### Gap 6: Disconnect Is Internal-Only Today

The plan now includes Vercel removal/retention policy and downgrade handling.

### Gap 7: Firebase Auth And Stripe Custom-Domain Effects Are Not Proven

The plan now includes explicit auth/payment verification before self-service launch.

### Gap 8: Race Conditions Are Possible In Domain Claims

The plan now includes locking/domain claim behavior and idempotency requirements.

### Gap 9: Apex Domain Launch Risk Is Higher Than Subdomain Launch Risk

The plan now calls out a possible subdomain-first rollout if apex verification is not fully validated.

### Gap 10: Current Custom-Domain Actions Use Broad Operator Access

Current settings actions call `requireHubOperatorActionAccess`, which allows owner/admin/superadmin by default.

The plan now requires explicit allowed roles for each custom-domain action and recommends owner/superadmin for destructive disconnect.

### Gap 11: Current Runtime Resolve Path Is Correctness-First, Not Scale-First

Current middleware calls the internal resolve route with `cache: "no-store"` for every custom-domain HTML request.

The plan now adds measurable runtime targets, short-TTL hit/miss caching, explicit invalidation, and a future edge-friendly mapping projection option.

### Gap 12: Current Mapping Hydration Can Write During Resolve

`getCustomDomainMappingByHostname` can hydrate missing mappings from connected hub state.

The plan now requires moving write-on-read repair out of the hot request path once lifecycle/reconciliation is implemented.

### Gap 13: Current Sessions Are Host-Scoped

This is safer by default, but it means users may need a new session when moving between `{hubSlug}.hubforj.com` and a custom domain.

The plan now requires explicit UX and verification for session behavior after domain activation instead of assuming seamless cross-host authentication.

### Gap 14: Current Stripe Return URLs Depend On Request Host

This is useful for custom-domain compatibility, but unsafe if an unverified host is allowed to start checkout.

The plan now requires checkout return URLs to be verified on connected custom domains and to remain scoped by Stripe metadata/account ownership rather than hostname trust.

### Gap 15: Current Hostname Validation Is Basic

The current validation does not fully address raw IPs, wildcard domains, private/internal hostnames, public suffixes, or internationalized-domain spoofing.

The plan now adds explicit security controls and tests for these cases before customer self-service launch.

### Gap 16: Current Plan Needed A Registrar-Aware Admin Journey

The current code has a technical TXT verification panel, but not a complete customer journey for admins who bought domains through common registrars.

The plan now includes a dedicated enterprise user journey with:

- provider selection
- DNS-provider versus registrar explanation
- copyable DNS records
- provider-specific terminology
- Cloudflare, GoDaddy, Namecheap, Squarespace, and generic provider guidance
- warnings for email records and existing websites
- background verification
- connected-state URLs
- troubleshooting states
- guidance on using first-party illustrated help instead of brittle third-party screenshots as the primary instruction source

## Readiness To Implement

This plan is ready for implementation using the launch policy defaults above.

Recommended first implementation slice:

1. Add domain lifecycle selectors and compatibility normalization.
2. Add Vercel server-only adapter in dry-run/testable form.
3. Add diagnostics endpoint support for Vercel/custom-domain readiness.
4. Update Account settings UI to show separated lifecycle steps without yet enabling auto-activation.

Do not start with runtime auto-activation. The first slice should make state, diagnostics, provider guidance, and Vercel dry-run behavior visible and testable without changing live routing behavior for existing hubs.

Do not enable full self-service runtime for all Growth hubs until:

- Vercel provisioning works in production
- a test custom subdomain works end to end
- a test apex domain works end to end or apex launch is deferred
- Firebase Auth behavior is verified
- Stripe/payment return URLs are verified
- scheduled lifecycle and reconciliation are configured
- rollback has been tested

## Implementation Progress

### Phase 1A: Lifecycle And Claim Foundation

Status: implemented locally, pending runtime test execution in an environment with Node available.

Completed:

- Added custom-domain lifecycle phase normalization for old and planned statuses.
- Preserved compatibility for existing statuses such as `pending_verification`, `verifying`, `connected`, `disconnect_scheduled`, and `disconnected`.
- Added pass-through fields for future Vercel/DNS/certificate readiness state.
- Added stricter self-service hostname validation for:
  - wildcard hostnames
  - raw IPv4 hostnames
  - local/internal hostnames
  - invalid label boundaries
  - overlong hostnames
  - platform-managed hostnames
- Added deterministic `customDomainClaims/{hostname}` helper functions.
- Added claim conflict checks to custom-domain uniqueness validation.
- Added transactional claim creation when a hub owner requests custom-domain setup.
- Added claim creation for operator/platform hub creation when a Growth hub is seeded with a connected custom domain.
- Added claim transition to `connected` during existing activation processing.
- Added claim release during existing disconnect processing.
- Narrowed custom-domain setup, verification, and disconnect actions to owner/superadmin.
- Added unit/source tests for lifecycle phases, validation, claim normalization, and action access boundaries.

Not included in this slice:

- Vercel API adapter.
- Vercel dry-run diagnostics.
- Account settings lifecycle UI redesign.
- Registrar-aware DNS wizard UI.
- Runtime auto-activation.
- Middleware runtime cache/projection.

Verification notes:

- Full `git diff --check` currently reports pre-existing unrelated trailing-whitespace issues in `apps/hub-platform/eslint.config.mjs`, `mock-users.txt`, and `updates-to-make.txt`.
- Targeted `git diff --check` for this slice's changed files passes.
- Local test execution could not be run in this shell because `node` is unavailable.

### Phase 2A: Vercel Adapter Foundation And Dry-Run Diagnostics

Status: implemented locally, pending runtime test execution in an environment with Node available and production diagnostics against Vercel.

Scope note:

- This phase creates the server-only adapter and diagnostics surface.
- It includes Vercel mutation helpers, but deliberately does not call them from admin actions yet.
- That keeps live provisioning behavior unchanged until the lifecycle wiring phase has been implemented and verified.

Completed:

- Added server env support for:
  - `VERCEL_API_TOKEN`
  - `VERCEL_TEAM_ID`
  - `VERCEL_HUB_PLATFORM_PROJECT_ID`
  - `HUB_PLATFORM_CUSTOM_DOMAIN_VERCEL_ENABLED`
  - `HUB_PLATFORM_CUSTOM_DOMAIN_AUTO_ACTIVATE_ENABLED`
  - `HUB_PLATFORM_CUSTOM_DOMAIN_VERCEL_TIMEOUT_MS`
- Added `.env.example` entries with behavior-changing flags disabled by default.
- Added safe Vercel config diagnostics that redact the token and report personal/team scope.
- Added deterministic Vercel config normalization so diagnostics can be tested without depending on process-env module cache timing.
- Added a server-only Vercel project-domain adapter for read/status operations.
- Added defensive Vercel response parsing so non-JSON provider failures are surfaced as diagnostics instead of crashing the status endpoint.
- Added read-only helper methods for:
  - project-domain access diagnostics
  - fetching a project domain
  - fetching Vercel domain config
  - normalizing Vercel domain status
- Added server-only project-domain mutation helpers for the next lifecycle slice:
  - adding a domain to the hub-platform Vercel project
  - verifying a project domain
  - removing a project domain from the hub-platform Vercel project
- Added provider-failure classification for authorization, not-found, conflict, invalid-request, rate-limit, timeout, and provider-unavailable cases.
- Extended `/api/internal/custom-domains/status` to include safe Vercel configuration diagnostics and classified live Vercel failures.
- Kept live Vercel calls opt-in with `includeVercel=true`.
- Preserved internal automation authorization for all diagnostics.
- Added tests/source guards for config redaction, opt-in diagnostics, project-domain mutation boundaries, and provider-failure classification.

Not included in this slice:

- Calling Vercel project-domain mutation helpers from admin actions.
- Persisting Vercel mutation results into hub lifecycle state.
- Runtime auto-activation.
- Middleware runtime cache/projection.
- Account settings lifecycle UI redesign.

No admin flow calls the Vercel mutation helpers yet. That remains a separate lifecycle wiring phase so this foundation can be verified safely before live custom-domain provisioning changes behavior.

Production diagnostic command shape:

```powershell
$headers = @{
  Authorization = "Bearer <INTERNAL_AUTOMATION_SECRET>"
}

Invoke-RestMethod `
  -Uri "https://<hub-platform-domain>/api/internal/custom-domains/status?includeVercel=true" `
  -Method GET `
  -Headers $headers
```

Expected first-pass result:

- `diagnostics.vercel.configured` is `true`
- `diagnostics.vercel.projectId` is `prj_Xn3SNVIi8AP3jwCBKbUO5Z5evxdw`
- `diagnostics.vercel.accountScope` is `personal`
- `diagnostics.vercel.tokenConfigured` is `true`
- `diagnostics.vercelLive.ok` is `true`

### Phase 3A: Request Flow Provisioning Foundation

Status: implemented locally and production-verified for controlled custom-domain provisioning.

Completed:

- Added a high-level server-only Vercel provisioning service in `apps/hub-platform/src/lib/domain/custom-domain-vercel.js`.
- Kept Vercel provisioning behind `HUB_PLATFORM_CUSTOM_DOMAIN_VERCEL_ENABLED`.
- Preserved existing TXT-only setup behavior when Vercel provisioning is disabled.
- Added idempotent add-or-confirm behavior:
  - attempt to add the domain to the configured Vercel project
  - treat same-project conflict as a recoverable convergence path by reading the project domain
  - classify non-recoverable provider failures into product-safe lifecycle state
- Added DNS routing status capture from Vercel domain config:
  - `not_checked`
  - `pending`
  - `ready`
  - `misconfigured`
- Added Vercel verification status capture:
  - `not_checked`
  - `pending`
  - `verified`
  - `failed`
- Added certificate readiness placeholder state based on provider verification:
  - `pending`
  - `ready`
- Added an expiring `customDomain.operationLock` during setup submission.
- Re-checks entitlement inside the transaction before lock/claim writes.
- Writes an expiring pending `customDomainClaims/{hostname}` claim for setup requests so failed provisioning cannot permanently trap a domain.
- Preserves the existing TXT verification token when the same hub retries the same hostname.
- Writes lifecycle-ready fields onto the hub custom-domain record:
  - `dnsRoutingStatus`
  - `dnsRoutingLastCheckedAt`
  - `dnsRoutingFailureReason`
  - `vercelProjectId`
  - `vercelDomainId`
  - `vercelDomainAddedAt`
  - `vercelVerificationStatus`
  - `vercelVerificationLastCheckedAt`
  - `certificateStatus`
  - `certificateLastCheckedAt`
  - `lastLifecycleRunAt`
  - `lastLifecycleError`
- Writes best-effort lifecycle events to `hubs/{hubId}/customDomainEvents`.
- Updated Account settings copy/facts for:
  - `provisioning`
  - `provisioning_failed`
  - DNS routing status
  - Vercel hosting verification status
  - certificate status
  - configured Vercel project id
- Added source guards for request-flow provisioning, expiring locks/claims, idempotent Vercel convergence, and flag safety.

Not included in this slice:

- Full "Check again" readiness orchestration across TXT, Vercel config, Vercel verification, certificate readiness, and internal activation.
- Auto-activation.
- Removing old pending Vercel domains when switching from one pending hostname to another.
- Removing Vercel project domains during disconnect.
- Registrar-specific guided setup UI.
- Middleware runtime cache/projection changes.

Operational rollout:

- Deploy with `HUB_PLATFORM_CUSTOM_DOMAIN_VERCEL_ENABLED=false` first to preserve existing behavior.
- Re-run `/api/internal/custom-domains/status?includeVercel=true`.
- Enable `HUB_PLATFORM_CUSTOM_DOMAIN_VERCEL_ENABLED=true` only for controlled testing.
- Submit a test Growth custom domain from Account settings.
- Confirm the domain appears in the Vercel project.
- Confirm the hub document records `status: "pending_verification"` with Vercel/DNS readiness fields.
- Keep `CUSTOM_DOMAIN_RUNTIME_ENABLED=false` and `HUB_PLATFORM_CUSTOM_DOMAIN_AUTO_ACTIVATE_ENABLED=false` until Phase 4 is implemented and verified.

### Phase 4A: Full Readiness Check On "Check Again"

Status: implemented and production-verified for custom-domain provisioning, readiness, activation, routing, admin auth, and member auth on a controlled test domain.

Completed:

- Upgraded the existing "Check again" path instead of introducing a parallel custom-domain verification route.
- Added `checkCustomDomainVercelReadiness` to the server-only Vercel domain service.
- "Check again" now evaluates:
  - TXT ownership verification
  - Vercel project-domain verification
  - Vercel domain config
  - DNS routing readiness
  - certificate readiness placeholder state
  - runtime activation flag
  - auto-activation flag
- Persists refreshed readiness fields on every successful TXT check:
  - `dnsRoutingStatus`
  - `dnsRoutingLastCheckedAt`
  - `dnsRoutingFailureReason`
  - `vercelProjectId`
  - `vercelDomainId`
  - `vercelVerificationStatus`
  - `vercelVerificationLastCheckedAt`
  - `certificateStatus`
  - `certificateLastCheckedAt`
  - `lastLifecycleRunAt`
  - `lastLifecycleError`
- Moves a domain to `activation_ready` when:
  - TXT ownership is verified
  - Vercel verification is `verified`
  - DNS routing is `ready`
  - certificate status is `ready`
  - runtime activation or auto-activation is still disabled
- Preserves safe behavior when external readiness is incomplete:
  - domain remains `verifying`
  - precise `activationBlockedReason` explains the pending condition
  - internal mappings are removed/kept absent
- Allows the activation processor to accept both `verifying` and `activation_ready`.
- Hardens the activation processor so it still requires stored external readiness before writing mappings.
- Keeps activation blocked when auto-activation is disabled, even if runtime routing is enabled later.
- Auto-activation remains gated by both:
  - `CUSTOM_DOMAIN_RUNTIME_ENABLED=true`
  - `HUB_PLATFORM_CUSTOM_DOMAIN_AUTO_ACTIVATE_ENABLED=true`
- Updated Account settings UI/copy for `activation_ready`.
- Updated the server action success message for activation-ready and connected outcomes.
- Added source guards for the full readiness path.

Not included in this slice:

- Enabling runtime routing.
- Enabling auto-activation.
- Removing Vercel project domains during disconnect.
- Registrar-specific guided setup UI.
- Runtime custom-domain mapping cache/projection.

Production verification:

- With `HUB_PLATFORM_CUSTOM_DOMAIN_VERCEL_ENABLED=true`, `CUSTOM_DOMAIN_RUNTIME_ENABLED=false`, and `HUB_PLATFORM_CUSTOM_DOMAIN_AUTO_ACTIVATE_ENABLED=false`, clicking "Check again" for `hubforjtestdomain.co.uk` successfully moved the hub into activation-ready state.
- Verified activation-ready hub state:
  - `customDomain.status = "activation_ready"`
  - `customDomain.dnsRoutingStatus = "ready"`
  - `customDomain.vercelVerificationStatus = "verified"`
  - `customDomain.certificateStatus = "ready"`
  - `customDomain.activationBlockedReason` explains that runtime/auto activation is not enabled.
- With `CUSTOM_DOMAIN_RUNTIME_ENABLED=true` and `HUB_PLATFORM_CUSTOM_DOMAIN_AUTO_ACTIVATE_ENABLED=false`, clicking "Check again" preserved the activation-ready state and did not write live mappings.
- With both `CUSTOM_DOMAIN_RUNTIME_ENABLED=true` and `HUB_PLATFORM_CUSTOM_DOMAIN_AUTO_ACTIVATE_ENABLED=true`, clicking "Check again" connected the domain.
- Verified connected-domain behavior for `https://hubforjtestdomain.co.uk`:
  - custom domain resolves to the correct hub
  - public routes resolve
  - admin login works
  - member login works
  - admin/member sessions work on the custom-domain host

Remaining production verification:

- Stripe checkout/payment return URLs for membership flows on the custom-domain host, if those flows are enabled.
- Webhook reconciliation remains hub/id based and does not depend on the request host.
- Disconnect lifecycle removes or disables connected custom-domain routing safely.

Additional production verification completed:

- Paid course/event booking checkout from `hubforjtestdomain.co.uk` opened Stripe checkout successfully.
- Completed Stripe payment returned to the custom-domain host.
- Admin payment record was created.
- Admin booking/registration record was created.
- Admin dashboard counters updated.
- Member booking appeared.
- Member billing record appeared.
- Stripe delivered the relevant `checkout.session.completed` webhook with `200 OK`.

### Phase 4B: Immediate Manual Disconnect And Provider Cleanup

Status: implemented and production-verified for reconnect, immediate manual disconnect, hosted-domain redirect, and Vercel project-domain removal.

Completed:

- Manual disconnect now schedules and immediately processes the disconnect in the same admin action.
- After a successful manual disconnect, the admin is redirected to the HubForJ-hosted admin settings URL:
  - `https://{platformSubdomain}.hubforj.com/admin/settings/account?customDomain=disconnected`
- Internal safety remains the first priority:
  - release `customDomainClaims/{hostname}`
  - clear `customDomains`
  - mark the hub custom-domain state as `disconnected`
  - delete canonical and companion `customDomainMappings`
- Vercel project-domain cleanup runs after internal routing has been removed.
- Vercel cleanup is idempotent:
  - a provider `not_found` response is treated as already removed
  - other provider failures are stored in `customDomain.lastLifecycleError`
  - failed provider cleanup does not leave the hub mapped to the old custom domain
- Added source guards for immediate manual disconnect, hosted-domain redirect, internal routing removal, and Vercel cleanup idempotency.

Not included in this slice:

- Grace-period redirects from disconnected custom domains to the hosted subdomain.
- Admin-facing cleanup/retry controls for provider removal failures.
- Full custom-domain Account settings UX redesign.

Production verification:

- Connect a controlled test domain.
- Click disconnect from the custom-domain host.
- Expected:
  - action completes without requiring a separate internal lifecycle endpoint call
  - admin lands on the HubForJ-hosted admin settings URL
  - custom-domain mapping documents are removed
  - custom-domain claim is released
  - hub falls back to the HubForJ-hosted subdomain
  - Vercel project-domain entry is removed or marked already removed

Production verification completed:

- Reconnected the controlled test domain after disconnect.
- Manual disconnect processed without requiring a separate lifecycle endpoint call.
- Admin was redirected to the HubForJ-hosted admin settings URL.
- Custom domain stopped resolving to the hub.
- Vercel removed the project-domain entry.
- Hub remained available on the HubForJ-hosted subdomain.

### Phase 4C: Package Downgrade Entitlement Enforcement

Status: implemented and production-verified for effective Growth downgrade entitlement loss, automatic custom-domain disconnect, hosted-domain fallback, and Vercel project-domain cleanup.

Current state:

- Product-site billing/webhook flows sync package state to the hub platform through:
  - `apps/product-site/src/lib/server/hub-package-authority.js`
  - `apps/hub-platform/src/app/api/internal/update-package-authority/route.js`
  - `apps/hub-platform/src/lib/data/hub-mutations.js:updateHubPackageAuthorityById`
- `updateHubPackageAuthorityById` now compares previous and next effective package entitlements after the package authority write.
- If custom-domain entitlement is lost, the same immediate disconnect processor used by manual disconnect is triggered.

Enterprise policy:

- Scheduled downgrade:
  - Do not disconnect the custom domain at the moment the downgrade is merely scheduled.
  - Keep the custom domain active until the lower package becomes effective.
  - Product/account UI should warn that the custom domain will disconnect when Growth ends.
- Effective downgrade:
  - When package authority changes from custom-domain-entitled to not custom-domain-entitled, automatically run the same immediate disconnect flow.
  - The hub must remain available on the HubForJ-hosted subdomain.
- Payment status grace:
  - `active` Growth: custom domain allowed.
  - `trialing` Growth: custom domain allowed if trial policy allows Growth capabilities.
  - `past_due` Growth: recommended to keep the custom domain during billing grace.
  - `cancelled`, effective lower tier, or explicit entitlement override `customDomainEnabled: false`: disconnect.
- Operator override:
  - `packageOverrides.customDomainEnabled === true` may preserve custom-domain capability even on a lower tier.
  - `packageOverrides.customDomainEnabled === false` must disconnect even if the package tier would otherwise allow it.

Implementation target:

- `updateHubPackageAuthorityById` compares previous and next effective entitlements:
  - `previousEntitlements.capabilities.customDomainEnabled`
  - `nextEntitlements.capabilities.customDomainEnabled`
- Effective entitlement treats `packageStatus: "cancelled"` as not entitled even if the package tier is still `growth`.
- Effective entitlement preserves `past_due` Growth as entitled during billing grace.
- If previous was enabled and next is disabled, and a custom domain is configured in a routable or pending state, entitlement disconnect is triggered.
- The same safety path as manual disconnect is used:
  - schedule disconnect with reason `package_downgrade`
  - immediately process disconnect
  - release `customDomainClaims/{hostname}`
  - clear `customDomains`
  - remove `customDomainMappings`
  - attempt Vercel project-domain removal
  - preserve any provider cleanup error in lifecycle metadata
- The package-authority path does not redirect, because the caller is an internal package-authority API/webhook path.
- Package update responses include custom-domain enforcement metadata for support diagnostics:
  - `customDomainEntitlementChanged`
  - `customDomainDisconnectTriggered`
  - `customDomainDisconnectStatus`
  - `customDomainDisconnectError`

Production verification completed:

- A Growth hub with a connected custom domain was downgraded to Starter through the product-site/package-authority flow.
- The custom-domain entitlement change was detected when the lower tier became effective.
- The disconnect processor ran automatically from the package-authority path.
- Internal custom-domain mappings were removed.
- Vercel removed the project-domain entry.
- The hub remained available on the HubForJ-hosted subdomain.
- Product-site scheduled-change UX was tightened so a customer keeping the current paid tier can cancel the scheduled change instead of seeing the tier treated as simply current while a cancellation remains pending.

Lifecycle event requirements:

- Writes best-effort lifecycle/audit metadata for:
  - `custom_domain_disconnected_package_downgrade`
  - previous package tier/status/source
  - next package tier/status/source
  - previous entitlement state
  - next entitlement state
  - actor `internal-product-site-billing` or operator actor where relevant
- If provider cleanup fails:
  - keep internal mapping removed
  - keep claim released
  - store provider cleanup failure in `customDomain.lastLifecycleError`
  - include retryability metadata where available

Edge cases:

- No custom domain configured:
  - no-op.
- Custom domain already `disconnected`:
  - no-op.
- Custom domain pending verification/provisioning:
  - release claim and remove Vercel project-domain entry if it was added.
- Custom domain `disconnect_scheduled`:
  - process immediately if entitlement is now lost.
- Custom domain cleanup fails at Vercel:
  - package update should still succeed because hub routing safety has been enforced internally.
  - support diagnostics should show cleanup failure.
- Package update fails after disconnect:
  - avoid this ordering; package authority write should happen first, followed by entitlement enforcement, because the downgrade must remain the source of truth.
- Immediate upgrade back to Growth:
  - admin should be able to reconnect custom domain through the normal setup flow.
  - do not automatically reconnect a previously disconnected domain without explicit owner action.

Testing requirements:

- Source/unit tests:
  - package authority source compares previous and next custom-domain entitlement.
  - package downgrade disconnect uses reason `package_downgrade`.
  - package downgrade path calls the immediate custom-domain disconnect processor.
  - package authority API returns custom-domain enforcement metadata.
  - full behavior cases should be covered by integration tests or targeted emulator tests when available:
    - downgrade from Growth to Starter triggers custom-domain disconnect.
    - downgrade from Growth to Free triggers custom-domain disconnect.
    - Growth `past_due` does not immediately disconnect.
    - `packageOverrides.customDomainEnabled === true` prevents disconnect.
    - `packageOverrides.customDomainEnabled === false` triggers disconnect.
    - no custom domain remains no-op.
    - provider cleanup failure does not fail package authority update.
- Production verification:
  - connect test domain
  - use package-authority endpoint or product-site downgrade path to make the lower package effective
  - confirm custom domain disconnects
  - confirm hosted subdomain continues working
  - confirm Vercel project-domain entry is removed or cleanup error is recorded
  - confirm Account settings shows custom-domain locked on lower package

### Phase 6A: Unified Custom-Domain Reconciliation Reporting And Repair

Status: implemented locally, pending runtime test execution in an environment with Node available and controlled production dry-run/repair verification.

Implemented:

- Added custom-domain reconciliation to the unified internal projection maintenance endpoint:
  - `GET /api/internal/projections/reconcile?...&includeCustomDomains=true`
  - `POST /api/internal/projections/reconcile` with `includeCustomDomains`
- `includeCustomDomains` defaults to `true`, matching the other reconciliation families.
- Dry-run reports now include:
  - `reports.customDomains.totalIssues`
  - `reports.customDomains.generatedAt`
  - `reports.customDomains.summary`
- Repair mode now includes:
  - `repairs.customDomains`

Dry-run checks:

- connected custom domain has an active claim
- connected claim points to the same hub id and slug
- connected claim is marked `connected`
- connected domain has canonical and companion runtime mappings
- runtime mappings point to the same hub id and slug
- runtime mappings have the expected canonical host, redirect host, match type, and connected status
- inactive/non-connected custom-domain state does not leave stale runtime mappings
- inactive/non-connected custom-domain state does not leave an active claim for the same hub
- pending/verifying/activation-ready custom-domain state keeps an active pending claim
- connected provider state is checked through the Vercel readiness adapter when Vercel automation is enabled
- connected Firestore state is flagged if Vercel readiness is not complete
- due `disconnect_scheduled` records are flagged so lifecycle maintenance can process them

Repair behavior:

- Runs the existing custom-domain lifecycle batch first:
  - due disconnects
  - pending verification checks
  - activation checks
- Re-reads hub state directly from Firestore after lifecycle repair to avoid request-cache staleness.
- Reconciles Firestore claims:
  - configured/pending/connected states get a claim upserted for the same hub
  - connected states mark the claim as `connected`
  - inactive states release the claim if it belongs to the hub
- Reconciles runtime mappings:
  - connected states rebuild canonical and companion mappings from the hub record
  - non-connected states delete canonical and companion mappings
- Does not directly add or remove Vercel project domains from the reconciliation repair layer.
- Vercel mutation remains inside existing lifecycle and disconnect processors to avoid surprising provider-side changes from a generic repair action.

Operational policy:

- Dry-run remains the default.
- Repair is explicit through `dryRun=false`.
- Provider readiness issues are reported, but provider mutations are not performed unless an existing lifecycle phase is legitimately due.
- The first implementation is intentionally per-hub and bounded by the existing projection-maintenance paging model.

Recommended production verification:

1. Run a dry-run for a known connected test hub:
   - `includePayments=false`
   - `includeMembers=false`
   - `includeDashboard=false`
   - `includeMedia=false`
   - `includeEventAttendance=false`
   - `includeAdminOnboarding=false`
   - `includeCustomDomains=true`
2. Confirm `reports.customDomains.totalIssues` is `0`.
3. Run the same request with `dryRun=false`.
4. Confirm `repairs.customDomains.status` is `reconciled`.
5. Confirm the follow-up custom-domain report has `0` issues.
6. Confirm the custom domain and HubForJ-hosted fallback still resolve.
7. Confirm reconnect/disconnect still behave as previously verified.

Not included in this slice:

- Broad orphan Vercel project-domain scan across domains not tied to the current hub page.
- Scheduled job configuration in Vercel/cron.
- Runtime middleware cache/KV optimization.
- Admin-facing custom-domain UI redesign.

### Phase 6B: Scheduled Custom-Domain Lifecycle Runner

Status: implemented locally, pending runtime test execution in an environment with Node available and production cron verification after deployment.

Implemented:

- Added a Vercel Cron entry in `apps/hub-platform/vercel.json`:
  - path: `/api/cron/custom-domains`
  - schedule: `0 3 * * *`
  - cadence: daily at 03:00 UTC
- The daily cadence is intentional for the current Vercel Hobby deployment constraint.
- Future Vercel Pro cadence can move this back toward:
  - every 5 minutes for pending domains
  - every 5-15 minutes for disconnect processing
  - every 30-60 minutes for connected-domain reconciliation
- Added a cron-only route:
  - `apps/hub-platform/src/app/api/cron/custom-domains/route.js`
- The route is `GET` because Vercel Cron invokes configured paths with GET.
- The route is protected by `CRON_SECRET`, using the standard Vercel Cron authorization pattern:
  - `Authorization: Bearer $CRON_SECRET`
- The route fails closed:
  - `503` if `CRON_SECRET` is missing/weak
  - `401` if the authorization header is wrong
- The route is feature-flagged:
  - `HUB_PLATFORM_CUSTOM_DOMAIN_SCHEDULED_MAINTENANCE_ENABLED`
  - `HUB_PLATFORM_CUSTOM_DOMAIN_RECONCILIATION_ENABLED`
- The scheduled route can be deployed while disabled.
- When enabled, the route runs:
  1. custom-domain lifecycle maintenance
  2. optional custom-domain reconciliation repair

Lifecycle targeting improvement:

- Existing lifecycle batches no longer scan an arbitrary first page of hubs and filter in memory.
- They now query by `customDomain.status` directly:
  - verification candidates:
    - `pending_verification`
    - `verifying`
    - `verification_failed`
    - `activation_ready`
  - activation candidates:
    - `verifying`
    - `activation_ready`
  - disconnect candidates:
    - `disconnect_scheduled`
- This avoids missing pending custom-domain work as the number of hubs grows.

Scheduled reconciliation behavior:

- Added a custom-domain-specific reconciliation batch.
- It targets hubs with custom-domain lifecycle statuses rather than arbitrary hub pages:
  - `pending_verification`
  - `verification_failed`
  - `verifying`
  - `activation_ready`
  - `connected`
  - `disconnect_scheduled`
- It runs the same conservative repair logic implemented in Phase 6A.
- It does not perform broad Vercel project-domain orphan scans.
- It does not force provider mutations except through existing lifecycle/disconnect processors.

Required production environment variables:

- `CRON_SECRET`
  - required for the cron endpoint
  - should be strong, random, and separate from client-visible values
  - Vercel sends this as `Authorization: Bearer $CRON_SECRET` for cron invocations
- `HUB_PLATFORM_CUSTOM_DOMAIN_SCHEDULED_MAINTENANCE_ENABLED=true`
  - enables the route to perform work
- `HUB_PLATFORM_CUSTOM_DOMAIN_RECONCILIATION_ENABLED=true`
  - enables claim/mapping reconciliation after lifecycle maintenance
- `HUB_PLATFORM_CUSTOM_DOMAIN_SCHEDULED_MAINTENANCE_LIMIT=25`
  - default batch limit
  - can be lowered temporarily if provider/API pressure is observed

Rollout sequence:

1. Deploy the route and cron schedule with:
   - `HUB_PLATFORM_CUSTOM_DOMAIN_SCHEDULED_MAINTENANCE_ENABLED=false`
   - `HUB_PLATFORM_CUSTOM_DOMAIN_RECONCILIATION_ENABLED=false`
2. Confirm the cron route returns a skipped response when called with the correct `CRON_SECRET`.
3. Enable:
   - `HUB_PLATFORM_CUSTOM_DOMAIN_SCHEDULED_MAINTENANCE_ENABLED=true`
4. Manually call the cron route once.
5. Confirm lifecycle output is `ok: true`.
6. Enable:
   - `HUB_PLATFORM_CUSTOM_DOMAIN_RECONCILIATION_ENABLED=true`
7. Manually call the cron route again.
8. Confirm reconciliation output is `ok: true`.
9. Confirm Vercel Cron appears in the Vercel project Cron Jobs UI after production deploy.
10. Monitor production logs for the next scheduled run.

Manual verification command:

```powershell
$headers = @{
  Authorization = "Bearer <CRON_SECRET>"
}

Invoke-RestMethod `
  -Uri "https://maplegrovecommunityhub.hubforj.com/api/cron/custom-domains" `
  -Method GET `
  -Headers $headers
```

Expected disabled response:

```json
{
  "ok": true,
  "skipped": true,
  "reason": "custom_domain_scheduled_maintenance_disabled"
}
```

Expected enabled response:

```json
{
  "ok": true,
  "skipped": false,
  "limit": 25,
  "lifecycle": {
    "ok": true
  },
  "reconciliation": {
    "ok": true
  }
}
```

Operational notes:

- Vercel Cron runs on production deployments.
- Cron schedules are UTC.
- Cron routes should not redirect.
- The route returns compact summaries so logs stay useful without exposing customer secrets.
- Full diagnostic detail remains available through `/api/internal/projections/reconcile`.
- If Vercel plan limits become a concern, reduce cadence or split lifecycle/reconciliation later.

Not included in this slice:

- Persisted scheduler cursor/checkpoint across invocations.
- Broad Vercel orphan-domain inventory scan.
- Separate low-frequency connected-domain reconciliation cron.
- Alerting integration for failed cron runs.
- Admin-facing UI notification that background verification is running.
