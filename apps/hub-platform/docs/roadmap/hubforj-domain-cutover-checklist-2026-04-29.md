# Hubforj Domain Cutover Checklist

Status:
- Local implementation baseline captured
- Staging and production verification deferred

Date:
- 2026-04-29

Purpose:
- provide the final production-grade checklist for moving from the placeholder hosted-hub domain model to the real Hubforj production domain contract
- separate work that can be completed locally or in staging from work that requires a real deployed environment
- give the team one explicit close-out artifact for this track before `hub-platform` native Stripe work begins

Current usage mode:
- use this checklist as the deferred verification and cutover artifact while `hub-platform` Stripe work proceeds
- local code-level hardening is already complete enough that this checklist does not block the next implementation track

Authority:
- [Hubforj Domain Alignment And Host Resolution Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/hubforj-domain-alignment-and-host-resolution-plan-2026-04-29.md)
- [Product Site Phase 6 Execution Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-phase-6-execution-plan-2026-04-20.md)
- current app code in `apps/hub-platform` and `apps/product-site`

Related:
- [Product Site README](/mnt/c/local/community-app/apps/product-site/README.md)
- [Stripe Two-Domain Architecture Note](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/stripe-two-domain-architecture-note-2026-04-20.md)

## 1) Locked Target Contract

Treat the following as the intended live production model:

- product site:
  - `https://hubforj.com`
- marketing companion redirect host:
  - `https://www.hubforj.com`
- operational application root:
  - `https://app.hubforj.com`
- Hubforj-hosted hubs:
  - `https://{hubSlug}.hubforj.com`
- Growth custom domains:
  - client-owned canonical host

Local development must remain valid on:

- product-site:
  - `localhost` app-local dev host and port
- hub-platform platform root:
  - `localhost`
- local hub runtime:
  - `{hubSlug}.localhost`

## 2) Exit Criteria

This domain track is only considered complete when all of the following are true:

1. placeholder `.ourplatform.com` assumptions are no longer required for current runtime behavior
2. Hubforj-hosted hub addresses are the default product and operator mental model
3. local and deployed host-resolution behavior are both explicit and tested
4. auth redirects, public navigation, member navigation, and key commercial handoffs behave correctly in both path mode and host mode
5. production DNS, TLS, and deployment prerequisites have been verified or explicitly accepted as pending deployment tasks

## 3) Completed Work Baseline

These items are already complete in the repo and should be treated as the starting baseline for this checklist:

- hosted-hub default root moved to `hubforj.com`
- custom-domain verification prefix default moved to `_hubforj-verify`
- reserved hosted-subdomain labels are blocked during hub provisioning
- Hubforj-hosted subdomain wording is now used in key operator/admin domain surfaces
- host resolution covers:
  - `app.hubforj.com`
  - `*.hubforj.com`
  - `localhost`
  - `*.localhost`
  - custom-domain candidates
- public header/nav and core auth flows now support route mode:
  - `path`
  - `host`
- public event/course CTAs and key signed-in member surfaces now use the shared route contract
- current lint, unit tests, and builds have passed after these changes

This checklist is only for what remains to be verified or closed.

Current checkpoint:

- local code changes, lint, unit tests, and builds have passed
- the remaining items in this checklist are intentionally not being treated as immediate blockers
- staging and production verification should resume before any live Hubforj domain cutover

## 4) Local And Staging Checklist

These items do not require a production cutover. They should be completed before any live-domain switch.

### 4.1 Repo And Config Checks

- [ ] confirm `apps/hub-platform/.env.example` reflects the real Hubforj production defaults
- [ ] confirm `apps/product-site` env documentation reflects:
  - `PRODUCT_SITE_BASE_URL=https://hubforj.com`
  - `HUB_PLATFORM_BASE_URL=https://app.hubforj.com`
- [ ] confirm `NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN` is never hardcoded in component logic where environment-based behavior is required
- [ ] confirm `PLATFORM_RESERVED_HOSTS` is documented clearly for operators

### 4.2 Local Runtime Checks

- [x] verify `localhost` resolves as platform root, not as a custom-domain candidate
- [x] verify `{hubSlug}.localhost` resolves as a hosted hub
- [x] verify public navigation on local subdomain mode stays host-local:
  - `/`
  - `/about`
  - `/events`
  - `/courses`
  - `/join`
  - `/sign-in`
- [x] verify member sign-in and join flows preserve `next` correctly in local hosted-hub mode
- [x] verify member account surfaces use host-local links in local hosted-hub mode

### 4.3 Staging Or Preview Runtime Checks

- [ ] verify `app.hubforj.com` is treated as platform root
- [ ] verify a Hubforj-hosted hub like `oak-hill.hubforj.com` resolves correctly
- [ ] verify the same hub still works if visited through path-mode fallback on a platform root in non-production environments, if that fallback is still intentionally supported
- [ ] verify public event detail CTA routes correctly:
  - anonymous user
  - signed-in member
  - historical member-access case
- [ ] verify public course detail CTA routes correctly for the same states
- [ ] verify member account/bookings/billing/courses/membership links stay host-local on hosted hubs

### 4.4 QA Regression Checks

- [x] verify product-site -> hub-platform provisioning still works after the domain changes
- [x] verify commercial package handoff from `hub-platform` back into product-site still works
- [x] verify support-mode entry still lands on the correct hub routes
- [x] verify admin invite acceptance still lands on the correct hub routes
- [x] verify custom-domain management UI still reflects the correct fallback Hubforj-hosted subdomain

## 5) Production-Required Checklist

These items require a real deployed environment or live infrastructure.

### 5.1 DNS

- [ ] apex `hubforj.com` points to the product-site deployment target
- [ ] `www.hubforj.com` is configured as a redirect or companion host for the product site
- [ ] `app.hubforj.com` points to the `hub-platform` operational deployment target
- [ ] wildcard DNS for `*.hubforj.com` points to the `hub-platform` hosted-hub runtime
- [ ] any required DNS provider records are documented for rollback and support use

### 5.2 TLS / Certificates

- [ ] valid certificates exist for:
  - `hubforj.com`
  - `www.hubforj.com`
  - `app.hubforj.com`
  - `*.hubforj.com`
- [ ] certificate coverage is verified on real browser requests, not assumed from dashboard configuration alone

### 5.3 Cookie And Auth Behavior

- [ ] member sign-in cookies behave correctly on Hubforj-hosted hub subdomains
- [ ] admin sign-in cookies behave correctly on Hubforj-hosted hub subdomains
- [ ] product-site commercial account cookies are isolated from `hub-platform` cookies as intended
- [ ] no unexpected cross-subdomain cookie leakage exists between:
  - `hubforj.com`
  - `app.hubforj.com`
  - `{hubSlug}.hubforj.com`

### 5.4 Real Host Verification

- [ ] verify `hubforj.com` serves the product site
- [ ] verify `app.hubforj.com` serves the operational app root
- [ ] verify a real hosted hub serves on `{hubSlug}.hubforj.com`
- [ ] verify public pages, member pages, and admin pages all resolve correctly on the hosted hub
- [ ] verify redirects do not unexpectedly bounce users back into path mode on hosted hubs

### 5.5 Custom Domain Verification

- [ ] verify a Growth custom domain can still be:
  - requested
  - DNS-verified
  - connected
  - used as canonical host
- [ ] verify Hubforj-hosted hub subdomain redirects or fallback behavior remain correct after custom-domain activation
- [ ] verify disconnecting a custom domain returns the hub cleanly to its Hubforj-hosted subdomain

## 6) Remaining Code Sweep

This is the final targeted cleanup work after the major runtime pieces are already in place.

- [ ] sweep for remaining isolated `/${hubSlug}/...` builders in:
  - member-facing workspaces
  - offering next-step flows
  - lower-level CTA helpers
  - admin/member detail helper surfaces
- [ ] decide whether each remaining instance is:
  - intentionally path-mode only
  - safe because it only runs after middleware rewrite
  - should be moved onto `buildHubRuntimeHref(...)`
- [ ] add unit tests for any remaining high-risk route builders that are kept

Important note:
- do not chase every slug-prefixed string blindly
- only convert code that materially affects runtime correctness or user-visible navigation on hosted hubs or custom domains

## 7) Rollout And Rollback Preparation

### 7.1 Pre-Cutover

- [ ] capture current production env values for both apps
- [ ] capture current DNS state
- [ ] capture current host-routing behavior for one representative hub
- [ ] record a named rollback point in source control and deployment history

### 7.2 Cutover

- [ ] deploy product-site and hub-platform with the aligned domain contract
- [ ] verify product-site root
- [ ] verify operational root
- [ ] verify one hosted hub
- [ ] verify one member auth flow
- [ ] verify one admin auth flow

### 7.3 Rollback

Rollback must be possible if any of the following fail:

- product-site root becomes unavailable
- operational app root becomes unavailable
- hosted hub routing breaks for public or admin access
- auth cookies or redirects behave incorrectly on production hosts

Rollback readiness should include:

- [ ] previous deployment target ready to restore
- [ ] previous DNS settings recorded
- [ ] production-required verification steps documented in the exact order they were run

## 8) Recommendation Before Hub-Platform Stripe Work

Before beginning the `hub-platform` Stripe implementation, this checklist should be at one of two states:

Option A:
- all local/staging items complete
- all production prerequisites documented and ready
- only live cutover execution remains

Option B:
- all local/staging items complete
- production-required items explicitly accepted as a separate release gate
- no unresolved code-level routing ambiguity remains in the payment-related surfaces that Stripe work will depend on

This is the minimum bar for calling the domain-alignment track production-grade enough to stop being a blocker.

## 9) Current Recommendation

Immediate next steps from here:

1. keep this checklist as the deferred verification artifact
2. begin `hub-platform` Stripe implementation on the now-stabilized local host model
3. resume staging and production verification before any real Hubforj domain cutover
4. update this checklist item-by-item once staging work begins
