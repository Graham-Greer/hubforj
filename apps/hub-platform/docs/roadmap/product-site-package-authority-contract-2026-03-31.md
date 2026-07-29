# Product-Site Package Authority Contract

Status:
- Proposed
- Upstream integration planning document

Date:
- 2026-03-31

Purpose:
- Define the first contract between the future product site and `hub-platform`
- Prevent package and billing ownership from drifting into `hub-platform`
- Make hub provisioning and package management implementation-ready before the product site exists

Related:
- [SaaS Package Tier And Entitlement Model](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/saas-package-tier-and-entitlement-model-2026-03-29.md)
- [SaaS Package Authority And Enforcement Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/saas-package-authority-and-enforcement-plan-2026-03-29.md)
- [SaaS Domain And Route Model](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/saas-domain-and-route-model-2026-03-15.md)
- [Custom Domain Management Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/custom-domain-management-plan-2026-03-31.md)
- [Admin Account Settings Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/admin-account-settings-plan-2026-03-31.md)
- [Product Site And Commercial Platform Implementation Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-and-commercial-platform-implementation-plan-2026-04-20.md)

## 1) Executive Summary

The product site does not need to be built immediately in order to continue `hub-platform`.

However, the integration boundary now needs to be explicit.

The product site will eventually own:

- SaaS signup
- initial package selection
- subscription and billing authority
- package upgrades and downgrades
- package status changes
- package-management handoff flows

`hub-platform` will continue to own:

- reading package authority
- resolving package entitlements
- enforcing package capabilities and limits
- showing package state, usage, and upgrade prompts
- operational custom-domain management for entitled hubs

This document locks the boundary so both applications can be built independently without conflicting assumptions.

## 2) Ownership Boundary

## 2.1 Product site owns

The product site is the authoritative commercial system for:

- product marketing and pricing
- account signup
- initial package selection
- billing and subscriptions
- package upgrades
- package downgrades
- package cancellation / renewal / recovery state
- package-management UI that talks to the business Stripe account

The product site is also the authoritative writer of package authority to the shared hub record or equivalent shared backing system.

## 2.2 `hub-platform` owns

`hub-platform` is the authoritative operational system for:

- admin operations
- public hub experience
- member experience
- package-aware feature enforcement
- package-aware usage visibility
- locked states and upgrade prompts
- custom-domain setup, verification state, and disconnect state for entitled hubs

`hub-platform` may initiate a package-management handoff, but it must not become the subscription source of truth.

## 2.3 What `hub-platform` must not do

`hub-platform` must not become responsible for:

- package checkout
- subscription creation
- primary billing customer management
- invoicing logic
- retry / cancellation / subscription status lifecycle

Those responsibilities belong to the product site and its Stripe integration.

## 3) First Integration Responsibilities

The product site must eventually be able to do two things reliably:

1. create a new hub with authoritative package input
2. update package authority for an existing hub after commercial changes

That is the minimum viable upstream contract.

## 4) Hub Provisioning Contract

## 4.1 Required creation inputs

When the product site provisions a hub, it should send at least:

```js
{
  name: string,
  slug: string,
  contactEmail: string,
  template: string,
  theme: string,
  description: string,
  timezone: string,
  locale: string,
  packageTier: "free" | "starter" | "growth",
  packageStatus: "active" | "trialing" | "past_due" | "cancelled",
  packageSource: "product_site",
  customDomain: string | "",
}
```

Notes:

- `customDomain` should only be allowed when the selected package tier entitles it
- `packageSource` should be `product_site` for product-site-created hubs
- `slug` remains the stable route identity for the hub until host-based routing is introduced

## 4.2 Required hub record result

After provisioning, the hub record must contain:

```js
{
  packageTier,
  packageStatus,
  packageSource,
  packageAssignedAt,
  packageUpdatedAt,
  packageOverrides: {
    customDomainEnabled: null,
    brandingRemovalEnabled: null,
    reportingEnabled: null,
  },
}
```

`hub-platform` then resolves the rest of the entitlement model from that authority.

## 4.3 Provisioning rule

The product site should not rely on legacy `features.*` booleans as primary commercial inputs.

Those fields may still exist during transition, but package authority is now the canonical upstream input.

## 5) Package Update Contract

The product site must be able to update the package authority for an existing hub after:

- upgrade
- downgrade
- trial conversion
- payment recovery
- cancellation
- operator correction

The update contract should include:

```js
{
  hubId: string,
  packageTier: "free" | "starter" | "growth",
  packageStatus: "active" | "trialing" | "past_due" | "cancelled",
  packageSource: "product_site",
  packageUpdatedAt: ISODateString,
  packageAssignedAt?: ISODateString,
  packageOverrides?: {
    customDomainEnabled?: boolean | null,
    brandingRemovalEnabled?: boolean | null,
    reportingEnabled?: boolean | null,
  },
}
```

Rules:

- `packageUpdatedAt` must always be written when package authority changes
- `packageAssignedAt` may remain the original assignment timestamp if only status changes
- overrides must remain exceptional, not the normal configuration path

## 6) Package Management Handoff Contract

## 6.1 User experience

Inside `hub-platform`, admins should be able to:

- see their current package
- see package usage and upgrade pressure
- click `Manage package`
- click `Upgrade to Growth`

But the actual management flow should hand off to the product site.

## 6.2 Handoff direction

The first version should assume:

- `hub-platform` deep-links to a product-site route
- the product site uses the authenticated business account context to show package management

Recommended handoff targets:

- `/account/package`
- `/account/billing`
- `/account/upgrade?target=growth`

Exact route names can change, but `hub-platform` should treat them as product-site-owned destinations.

## 6.3 Handoff data

At minimum, the handoff should identify:

- the owning SaaS account
- the target hub
- the desired action if relevant

Recommended query shape:

```txt
/account/upgrade?hubId=hub_123&target=growth&source=hub_platform
```

This is intentionally lightweight. The product site should resolve the billing context from its own authenticated user/session model rather than trusting `hub-platform` for commercial authority.

## 7) Stripe And Billing Lifecycle Expectations

The product site’s Stripe integration should eventually be the source of package status changes.

Typical status transitions:

- signup selects `starter` or `growth`
- successful checkout -> `active`
- trial start -> `trialing`
- failed renewal -> `past_due`
- cancelled subscription -> `cancelled`
- recovered payment -> `active`

Those transitions should then update the hub’s package authority record for `hub-platform` to consume.

`hub-platform` should not attempt to reconstruct this lifecycle from local signals.

## 8) Custom Domain Expectations

Custom domain is a Growth-only capability.

Therefore:

- the product site must not provision a custom domain for `free` or `starter`
- the product site must only write package authority that entitles Growth customers to use custom-domain management
- `hub-platform` must continue to enforce that entitlement when reading or writing hub state

If a customer downgrades off Growth later:

- downgrade takes effect at the end of the paid billing period
- the downgrade flow must present destructive confirmation before commitment
- when the downgrade becomes effective, the active custom domain must be disconnected from service for that hub
- the hub must revert to its platform subdomain

Operational domain setup remains inside `hub-platform` admin. The product site owns entitlement and billing state, not the domain-connection UI.

## 9) Transitional Development Rule

Until the product site exists:

- `hub-platform` may continue to use transitional operator provisioning
- but that provisioning must obey the package model exactly
- and it must be treated as temporary support tooling, not long-term commercial onboarding

That means:

- package tier must be explicit
- custom-domain entitlement must be respected
- capabilities must derive from package authority
- upgrade buttons inside `hub-platform` may remain placeholders until the handoff target exists

## 10) Recommended Next Implementation Steps

Historical sequencing note:

This section still captures the correct ownership direction, but the repo has advanced since this document was written.
For the current repo-audited implementation sequence and detailed touch points, use:

- [Product Site And Commercial Platform Implementation Plan (2026-04-20)](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-and-commercial-platform-implementation-plan-2026-04-20.md)

1. Keep tightening `hub-platform` around package consumption and enforcement.
2. Leave package-management buttons in `Account settings` as placeholders until the product site exists.
3. When product-site work begins, implement in this order:
   - pricing / package selection
   - signup
   - package-aware hub provisioning
   - package-management page
   - Stripe-backed package billing lifecycle
   - package update write-back to shared hub authority

## 11) Decisions Locked By This Document

Locked:

- product site is the authoritative commercial owner
- `hub-platform` is the consuming and enforcing app
- package management can be initiated inside `hub-platform`
- package management must resolve through the product site
- package authority must be explicit and durable on the hub record
- custom-domain operations live in `hub-platform` admin, not on the product site
- downgrade off Growth removes active custom-domain service at the end of the paid billing period

Not yet locked:

- exact product-site route names for package management
- authentication/session sharing strategy between product site and `hub-platform`
- exact webhook/event transport for package updates
- exact verification provider and job runtime for domain checks

These can be decided later without changing the fundamental ownership model.
