# Custom Domain Management Plan

Status:
- Proposed
- Product and engineering decision document

Date:
- 2026-03-31

Purpose:
- Lock the production-grade custom-domain model for `hub-platform`
- Define the ownership split between the future product site and `hub-platform`
- Define the lifecycle, security model, downgrade behavior, and admin UX before implementation

Related:
- [SaaS Package Tier And Entitlement Model](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/saas-package-tier-and-entitlement-model-2026-03-29.md)
- [SaaS Package Authority And Enforcement Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/saas-package-authority-and-enforcement-plan-2026-03-29.md)
- [Product-Site Package Authority Contract](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-package-authority-contract-2026-03-31.md)
- [SaaS Domain And Route Model](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/saas-domain-and-route-model-2026-03-15.md)

## 1) Executive Summary

Custom domain is a Growth-only operational capability.

The correct ownership split is:

- the product site owns package sales, billing, upgrades, downgrades, and package authority
- `hub-platform` owns operational custom-domain management for entitled hubs

That means:

- admins should manage custom-domain setup from inside `hub-platform`
- the future product site should not become the place where admins perform domain connection work
- downgrade off Growth must eventually remove active custom-domain service

This feature must be implemented as a production-grade lifecycle, not as a thin input field.

## 2) Locked Product Decisions

The following are now locked.

### 2.1 Entitlement

- custom domain is Growth-only
- Free and Starter may not connect or activate a custom domain
- the platform-hosted hub subdomain remains the permanent fallback host for every hub

### 2.2 Where admins manage domains

Admins manage custom domains inside `hub-platform`, under admin `Account settings`.

The product site remains responsible for:

- acquiring the client
- plan selection
- billing and subscriptions
- package upgrades and downgrades
- writing package authority to the hub

The product site is not the long-term operational home for domain setup.

### 2.3 Verification model

The verification model is:

- asynchronous background-job verification
- with manual `Check again` available in admin

The system must not rely on one-shot synchronous verification as the main model because DNS propagation is not deterministic enough for a production-grade UX.

Third-party infrastructure may be used later underneath this model if helpful, but the product lifecycle and state model must remain platform-owned.

### 2.4 Domain scope

V1 support is:

- one primary custom domain per hub
- strong root + `www` handling
- one canonical active host at a time

Not included in V1:

- arbitrary aliases
- multiple independent custom domains

However, the data model should be designed so aliases or multiple domains can be added later without rewriting the model from scratch.

### 2.5 Downgrade behavior

Downgrade takes effect at the end of the paid billing period.

If a hub downgrades off Growth:

- the admin must be shown a destructive confirmation before the downgrade is committed
- the confirmation must clearly state that custom-domain service will be removed when the downgrade takes effect
- on the effective downgrade date, the hub must revert to its platform subdomain
- the custom domain must be disconnected from active service for that hub

This is the correct commercial and operational rule. Custom domains must not remain indefinitely active after entitlement ends.

## 3) Why This Model Is Preferred

This model is preferred because it aligns:

- user expectation
- operational ownership
- package enforcement
- long-term maintainability

Custom domain setup is an operational website concern, not a sales-site concern.

Admins already manage their hub inside `hub-platform`, so domain setup belongs there.

At the same time, domain entitlement still belongs to the commercial system because:

- package billing decides who may use the feature
- downgrade and upgrade state originate from billing/package authority

So the correct split is:

- product site decides who is entitled
- `hub-platform` manages the operational lifecycle for entitled hubs

## 4) Domain Lifecycle Model

The platform should use an explicit lifecycle.

Recommended states:

- `not_configured`
- `pending_verification`
- `verifying`
- `connected`
- `verification_failed`
- `disconnect_scheduled`
- `disconnected`

Recommended interpretation:

- `not_configured`
  - no custom domain has been submitted
- `pending_verification`
  - hostname submitted and instructions issued
- `verifying`
  - background verification is in progress
- `connected`
  - custom domain is active and serving the hub
- `verification_failed`
  - verification failed and needs corrective action
- `disconnect_scheduled`
  - downgrade or admin disconnect has been accepted and a future removal is scheduled
- `disconnected`
  - domain no longer serves the hub

## 5) Data Model Direction

The hub record should not treat domain state as a bare string.

The recommended direction is a structured domain record, for example:

```js
{
  customDomain: {
    hostname: "community.example.org",
    status: "pending_verification" | "verifying" | "connected" | "verification_failed" | "disconnect_scheduled" | "disconnected",
    isPrimary: true,
    verificationMethod: "dns_txt" | "cname",
    verificationTarget: string,
    requestedAt: ISODateString,
    verifiedAt: ISODateString | null,
    connectedAt: ISODateString | null,
    lastCheckedAt: ISODateString | null,
    disconnectAt: ISODateString | null,
    disconnectedAt: ISODateString | null,
    failureReason: string | null,
    connectedByUserId: string | null,
    updatedByUserId: string | null,
  }
}
```

Important direction:

- model one primary domain now
- structure the record so aliases can be added later if needed
- keep the platform subdomain separate from the custom-domain record

## 6) Canonical Host Policy

Each hub has exactly one canonical active host at runtime.

Before custom-domain connection:

- canonical host is the platform-controlled hub subdomain

After successful custom-domain connection:

- canonical host becomes the connected primary custom domain

Root and `www` handling should be deliberate:

- one hostname is the canonical custom domain
- the companion root or `www` hostname should redirect to the canonical custom domain where supported
- once a custom domain is active, the platform-hosted hub subdomain should also redirect to the canonical custom domain in runtime-enabled environments

This is stronger than open-ended alias support and matches the expected behavior of mature hosted-site products.

## 7) Verification And Security Model

The platform must verify domain control before activation.

Minimum production requirements:

- hostname normalization
- global uniqueness enforcement
- proof-of-control via DNS-based verification
- auditability of who requested and changed the domain
- no assumption that entered hostname equals connected hostname

Verification should work like this:

1. admin submits hostname
2. platform generates exact DNS instructions
3. hostname moves to `pending_verification`
4. background verification checks DNS and readiness
5. admin may manually trigger `Check again`
6. only after successful verification may the domain move to `connected`

This reduces false failure states caused by DNS propagation delay.

## 8) Admin UX In `hub-platform`

The long-term admin home for this feature is:

- `Settings`
- `Account settings`
- `Custom domain`

### 8.1 Free / Starter experience

Show:

- current platform subdomain
- Growth-only locked panel for custom domain
- concise explanation of the value
- upgrade CTA

Do not show:

- active connection form controls

### 8.2 Growth without a connected domain

Show:

- platform subdomain
- domain setup form
- exact DNS instructions
- current verification status
- manual `Check again`

### 8.3 Growth with a connected domain

Show:

- connected custom domain
- current status
- canonical host explanation
- disconnect or replace actions when those workflows are defined

### 8.4 Downgrade warning UX

If a downgrade off Growth is initiated:

- show a destructive confirmation
- explain that the custom domain will stop serving the hub at the end of the paid billing period
- explain that the hub will revert to the platform subdomain
- require explicit acknowledgement

This warning should be part of the downgrade path, not buried in passive settings copy.

## 9) Interaction With The Product Site

The product site still owns:

- package selection
- upgrade
- downgrade
- billing state
- authoritative package writes

The product site should not own:

- domain setup UI
- domain verification instructions
- operational domain status for a hub admin

Instead:

- package authority changes flow from the product site into the hub record
- `hub-platform` reacts to entitlement changes and shows the correct operational state

## 10) Implementation Sequencing

Implementation should happen in this order:

1. lock documentation and data shape
2. refactor hub/domain read model to structured domain state
3. implement read-only domain status in `Account settings`
4. implement locked-state Growth gating in `Account settings`
5. implement Growth-only domain setup and verification UI
6. implement downgrade scheduling and disconnect behavior
7. implement runtime hostname-to-hub resolution using a dedicated custom-domain mapping model, not a collection scan in middleware
8. implement canonical redirect behavior once runtime host resolution is active

Do not skip the state model and jump straight to a form.

## 11) Final Decisions Locked By This Document

Locked:

- custom domain is Growth-only
- admins manage domain operations inside `hub-platform`
- product site owns commercial package authority, not domain setup UX
- verification is asynchronous background-job based with manual recheck
- V1 supports one primary custom domain per hub
- V1 includes strong root + `www` handling
- arbitrary aliases are not part of V1
- multiple independent custom domains are not part of V1
- downgrade takes effect at the end of the paid billing period
- downgrade off Growth must remove active custom-domain service and revert the hub to the platform subdomain

Not yet locked:

- exact verification provider or infrastructure vendor
- exact background job runtime
- exact root/apex DNS target strategy at infrastructure level
- whether replace-domain and disconnect-domain actions ship together or in sequence

Transitional implementation note:

- until a full scheduler is introduced, the verification engine may be triggered by a protected internal endpoint that calls the same reusable verification processor used by manual recheck
- this keeps state transitions centralized and avoids a second verification code path
- connected-state activation should use the same pattern: a reusable activation processor plus a protected internal endpoint
- domains must not be marked `connected` in environments where runtime host activation is not actually enabled
- scheduled disconnect execution should use the same pattern as well so end-of-billing downgrade behavior and manual disconnect share one processor
- the preferred automation entrypoint for schedulers should be a single protected lifecycle route that runs disconnect, verification, then activation in order
- phase-specific routes may remain for focused operational debugging, but they are not the primary scheduled path
- runtime host resolution should use a dedicated hostname-to-hub mapping model that is written on connect and cleared on disconnect
- request-time custom-domain lookup should resolve through that mapping model, with migration-safe fallback hydration from the hub record when needed
- the mapping model should support both:
  - canonical custom-domain resolution
  - companion-host redirects for root/`www`
- the platform subdomain should resolve to the hub normally until a connected canonical custom domain exists, at which point it should redirect to that canonical host
