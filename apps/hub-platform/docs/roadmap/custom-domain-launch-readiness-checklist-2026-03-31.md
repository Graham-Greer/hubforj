# Custom Domain Launch Readiness Checklist

Status:
- Proposed
- Operational launch checklist

Date:
- 2026-03-31

Purpose:
- Record the concrete launch tasks required before custom domains can be truthfully activated in a real environment
- Prevent `CUSTOM_DOMAIN_RUNTIME_ENABLED` from being enabled before the surrounding runtime is actually ready

Related:
- [Custom Domain Management Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/custom-domain-management-plan-2026-03-31.md)
- [SaaS Domain And Route Model](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/saas-domain-and-route-model-2026-03-15.md)

## 1) Core Rule

`CUSTOM_DOMAIN_RUNTIME_ENABLED=true` must only be enabled in an environment where the platform can genuinely serve hub traffic on connected custom domains.

This flag is not cosmetic.

It allows the activation processor to mark verified domains as `connected`.

Therefore, enabling it before runtime support is actually live would create false product state and operational risk.

## 2) Required Preconditions Before Enabling

All of the following should be complete before enabling `CUSTOM_DOMAIN_RUNTIME_ENABLED=true` in a real environment.

### 2.1 Host resolution

- incoming request host must be available to the application runtime
- host-to-hub lookup must work for:
  - platform subdomain
  - verified custom domain
- the app must no longer rely only on slug/path-based hub resolution for environments where custom domains are considered active

Current implementation note:

- platform-subdomain host rewriting is implemented
- custom-domain candidate requests now resolve through a dedicated hostname mapping path rather than a hub collection scan
- live activation still depends on the environment supporting real host cutover and certificate handling

### 2.2 TLS / certificate handling

- custom domains must terminate over HTTPS successfully
- certificate issuance and renewal must be handled reliably
- certificate failures must not silently leave domains marked as active

### 2.3 Canonical host behavior

- one canonical active host per hub must be defined
- platform subdomain redirect behavior must be confirmed
- root + `www` handling must be confirmed
- duplicate-host behavior must be avoided

Current implementation note:

- companion custom-domain hosts can redirect to the canonical custom domain through the hostname mapping layer
- platform subdomain requests can redirect to the connected canonical custom domain when runtime is enabled
- launch validation still needs to confirm that this behavior is correct in the target environment with real DNS and certificates

### 2.4 Safe fallback behavior

- every hub must still have a working platform subdomain fallback
- admin and support flows must still be recoverable through the fallback host if custom-domain traffic fails

### 2.5 Verification and activation operations

- verification endpoint and activation endpoint must be callable in the target environment
- custom-domain resolve path must be callable in the target environment
- the unified custom-domain lifecycle endpoint should be callable for scheduled automation
- `INTERNAL_AUTOMATION_SECRET` must be set securely
- operational process must exist for:
  - verification retries
  - activation retries
  - failure observation

Operational expectation:

- the scheduler should call `POST /api/internal/custom-domains/run`
- `GET /api/internal/custom-domains/status` should be used as a protected preflight check before enabling runtime in a new environment
- the route returns `200` when all phases succeed
- the route returns `207` when one or more phases fail but the lifecycle run still completed with structured phase results
- phase execution order is:
  1. disconnect
  2. verification
  3. activation

### 2.6 Observability and support

- logs should make it clear:
  - when verification ran
  - when activation ran
  - whether activation was blocked
  - which hostname was affected
- support should have a documented recovery path if a domain is misconfigured or stuck

## 3) Environment Variables To Review

Before launch, confirm:

- `NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN`
- `CUSTOM_DOMAIN_VERIFICATION_PREFIX`
- `INTERNAL_AUTOMATION_SECRET`
- `CUSTOM_DOMAIN_RUNTIME_ENABLED`

Reference:

- seed new environments from [`.env.example`](/mnt/c/local/community-app/apps/hub-platform/.env.example)

Expected launch behavior:

- `CUSTOM_DOMAIN_RUNTIME_ENABLED` stays `false` until host resolution and runtime cutover are truly ready
- only then should it be switched to `true`

## 4) Recommended Launch Sequence

1. finish host-based runtime support
   - including verified custom-domain lookup through the runtime mapping path
2. confirm TLS/certificate behavior
3. confirm canonical redirect rules
4. validate verification flow in a real environment
5. validate activation flow in a real environment
6. validate the protected runtime preflight:
   - `GET /api/internal/custom-domains/status`
7. validate the unified lifecycle automation path
8. verify fallback platform subdomain behavior
9. then enable `CUSTOM_DOMAIN_RUNTIME_ENABLED=true`

Recommended scheduler cadence:

- run `POST /api/internal/custom-domains/run` every 5 minutes in production
- use the same route for staging if the environment is intended to exercise real domain lifecycle behavior

Local/dev trigger:

- keep the individual phase endpoints for focused debugging when needed
- prefer `POST /api/internal/custom-domains/run` for realistic end-to-end local verification

## 5) Post-Enablement Checks

After enabling:

- verify a newly connected domain resolves correctly
- verify the platform subdomain fallback still works as intended
- verify `connected` state only appears for truly reachable domains
- verify no environment still reports activation blocked

## 6) Final Reminder

Do not treat `CUSTOM_DOMAIN_RUNTIME_ENABLED` as a feature toggle for design review or UI testing in production-like environments.

It is a launch-readiness switch for real custom-domain service.
