# SaaS Domain And Route Model

Status:
- Proposed
- Next planning artifact after formal SaaS direction confirmation
- Partially superseded by newer package and audit documents where noted

Purpose:
- Define how hubs should resolve by host and route under the confirmed SaaS direction
- Replace outdated assumptions that split public/member from admin by domain
- Establish the canonical route and host behavior for public, member, and admin on one shared multi-tenant application

Related:
- [SaaS Direction And Next Steps](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/saas-direction-and-next-steps-2026-03-15.md)
- [SaaS Domain, Onboarding, And Tier Audit](/mnt/c/local/community-app/apps/hub-platform/docs/audits/2026-03-29-saas-domain-onboarding-and-tier-audit.md)
- [SaaS Package Tier And Entitlement Model](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/saas-package-tier-and-entitlement-model-2026-03-29.md)
- [SaaS Package Authority And Enforcement Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/saas-package-authority-and-enforcement-plan-2026-03-29.md)
- [Custom Domain Management Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/custom-domain-management-plan-2026-03-31.md)
- [Public Site Architecture And Delivery Plan](/mnt/c/local/community-app/apps/hub-platform/docs/public-site/public-site-architecture-and-delivery-plan.md)
- [Hub Site Config Schema And Package Gating](/mnt/c/local/community-app/apps/hub-platform/docs/public-site/hub-site-config-schema-and-package-gating.md)

---

## Precedence note

This document still defines the intended long-term SaaS route and host model.

For current implementation status and package-aware product authority, the following newer documents take precedence:

- [SaaS Domain, Onboarding, And Tier Audit](/mnt/c/local/community-app/apps/hub-platform/docs/audits/2026-03-29-saas-domain-onboarding-and-tier-audit.md)
- [SaaS Package Tier And Entitlement Model](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/saas-package-tier-and-entitlement-model-2026-03-29.md)
- [SaaS Package Authority And Enforcement Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/saas-package-authority-and-enforcement-plan-2026-03-29.md)

Important clarification:

- host and domain resolution described below remain the intended product direction
- they are not yet implemented in the current codebase
- the current runtime still resolves hubs primarily by `/{hubSlug}` path
- custom-domain lifecycle, verification, and downgrade behavior are now further defined by the Custom Domain Management Plan

---

## 1) Formal route and host decision

The SaaS route model is:

- one shared multi-tenant application
- one resolved hub context per request
- one host per hub experience at runtime
- public, member, and admin all available on the resolved hub host

This means the following are all valid once a custom domain is configured:

- `https://bobsyoga.com`
- `https://bobsyoga.com/account`
- `https://bobsyoga.com/admin`

Before custom-domain setup, the same hub should be available on a platform-hosted address such as:

- `https://bobsyoga.ourplatform.com`
- `https://bobsyoga.ourplatform.com/account`
- `https://bobsyoga.ourplatform.com/admin`

This is now the authoritative direction for the SaaS product path.

It supersedes earlier planning assumptions that:

- hub admin should remain only on the platform domain
- custom domains should only serve public or member surfaces

Those assumptions do not align with the now-confirmed product direction.

---

## 2) Why this model is preferred

This model is preferred because it creates one coherent hub experience.

Benefits:

- the hub feels like one product on one domain
- member flows feel like a continuation of the public site
- admin can operate from the real client domain
- white-label quality improves materially
- platform-hosted fallback and custom-domain upgrade paths can coexist cleanly

This is the right fit for a SaaS product where:

- hubs are provisioned immediately
- customization is bounded
- the platform owns the route system

---

## 3) Host resolution model

### 3.1 Resolution order

Hub resolution should happen in this order:

1. custom domain match
2. platform-hosted hub subdomain match
3. local-development host mapping
4. explicit fallback only for internal non-hub routes

This should be resolved at the server boundary before route-family rendering decisions are made.

### 3.2 Custom domain

If the incoming host matches a verified custom domain record for a hub:

- resolve that hub
- treat that host as the active request host
- render public, member, or admin routes for that hub on that host

Examples:

- `bobsyoga.com`
- `www.bobsyoga.com`

### 3.3 Platform-hosted hub address

If the incoming host matches the platform-controlled hub address for a hub:

- resolve that hub
- treat that host as the active request host unless a canonical redirect rule applies

Preferred model:

- one hub per subdomain

Examples:

- `bobsyoga.ourplatform.com`
- `lakesideclub.ourplatform.com`

This is preferred over a path-based hub model for the SaaS direction because it:

- aligns better with custom-domain equivalence
- avoids mixing platform and hub route concerns
- simplifies canonical host policy
- better preserves the feeling of one hub-owned site

### 3.4 Local development behavior

Local development must support deterministic hub resolution without custom DNS burden beyond what the team can reasonably manage.

Preferred local-development model:

- `hubSlug.localhost:3000`

Examples:

- `bobsyoga.localhost:3000`
- `lakesideclub.localhost:3000`

If local subdomain routing becomes impractical in a given environment, a temporary development fallback may be allowed, but it should remain development-only and must not become the production mental model.

---

## 4) Canonical domain policy

Each hub should have one canonical public host at a time.

### 4.1 Before custom-domain setup

Canonical host:

- platform-hosted hub subdomain

Example:

- `bobsyoga.ourplatform.com`

### 4.2 After custom-domain setup

Canonical host:

- verified primary custom domain

Examples:

- `bobsyoga.com`
- or `www.bobsyoga.com`

### 4.3 Redirect behavior

When a hub has a primary custom domain:

- platform-hosted hub subdomain should redirect to the primary custom domain
- if both root and `www` are supported, the non-canonical companion hostname should redirect to the primary custom domain

This should apply consistently for:

- public routes
- member routes
- admin routes

The goal is:

- one canonical host
- no duplicate content
- no split session expectations by host unless intentionally designed otherwise

### 4.4 Session considerations

Because public, member, and admin all live on the same host model for a hub, session behavior should be designed around the resolved hub host.

The system should avoid:

- one host for public and another for admin by default
- auth cookies that assume only the platform domain matters
- redirect churn across hosts during normal hub use

---

## 5) Route-family model on a resolved hub host

Once a hub is resolved by host, the route families should be:

- public
- member
- admin

Platform superadmin remains separate and should not be confused with the hub-host route families.

### 5.1 Public routes

Canonical public routes:

- `/`
- `/about`
- `/events`
- `/events/{eventSlug}`
- `/courses`
- `/courses/{courseSlug}`
- `/announcements`
- `/announcements/{announcementSlug}`
- `/contact`
- `/privacy`
- `/terms`
- `/join`
- `/sign-in`

Optional public routes may be package-gated or template-gated, but core route naming should remain consistent.

### 5.2 Member routes

Canonical member routes:

- `/account`
- `/account/bookings`
- `/account/membership`
- `/account/billing`
- `/account/profile`

Legacy or transitional:

- `/account/courses` may remain temporarily while the member account consolidation settles, but it is no longer part of the preferred V1 member route model

These routes should feel like a signed-in continuation of the site, not a separate portal.

Event and course discovery should remain on the public site.
Signed-in members should act from those public routes and manage outcomes in account rather than duplicating the same content trees under `/account`.

### 5.3 Admin routes

Canonical admin routes:

- `/admin`
- `/admin/admins`
- `/admin/admins/invite`
- `/admin/members`
- `/admin/members/{memberId}`
- `/admin/events`
- `/admin/events/create`
- `/admin/events/{eventId}`
- `/admin/events/{eventId}/registrations`
- `/admin/events/{eventId}/attendance`
- `/admin/courses`
- `/admin/courses/create`
- `/admin/courses/{courseId}`
- `/admin/courses/{courseId}/registrations`
- `/admin/courses/{courseId}/attendance`
- `/admin/testimonials`
- `/admin/testimonials/create`
- `/admin/testimonials/{testimonialId}`
- `/admin/payments`
- `/admin/media`
- `/admin/settings`

Admin should remain operational and calmer than public, but it should still feel like part of the same hub-owned system.

### 5.4 Platform routes

Platform superadmin and internal routes should remain on the platform domain only.

Examples:

- `https://app.ourplatform.com/platform`
- `https://app.ourplatform.com/platform/hubs`

These are not part of the hub-host route family.

---

## 6) Public, member, and admin shell rules

The route model implies a shell model.

### 6.1 Public shell

Owns:

- public navigation
- public footer
- auth-aware utility actions
- brand presentation and public page rhythm

### 6.2 Member shell

Owns:

- member account navigation
- member-specific utility actions
- lighter self-service workspace framing

It should feel brand-consistent with the public shell.

### 6.3 Admin shell

Owns:

- admin operational navigation
- admin utility actions
- denser operational workspace treatment

It may feel more task-oriented, but it still lives under the hub domain model.
It should remain operational in structure and styling rather than trying to resemble the public site directly.

---

## 7) Auth and redirect rules

The domain model requires explicit redirect rules.

### 7.1 Anonymous visitor

Can access:

- public routes
- sign-in
- join

Should be redirected away from:

- member routes
- admin routes

### 7.2 Signed-in member

Can access:

- public routes
- member routes

Should not be routed into redundant sign-in or join flows.

### 7.3 Signed-in admin

Can access:

- public routes
- admin routes

May also access member routes only if the product intentionally supports it, but admin should not be forced through member routes as the main signed-in path.

### 7.4 Host-aware redirects

Redirect rules should preserve the resolved hub host wherever possible.

Examples:

- anonymous visitor on `bobsyoga.com/events/retreat-2026` who signs in should return to `bobsyoga.com`
- admin visiting `bobsyoga.ourplatform.com/sign-in` should resolve to `bobsyoga.ourplatform.com/admin` after successful admin sign-in

Redirects should not casually bounce between platform and hub hosts.

---

## 8) Package gating implications

The route model must work with package gating.

That means:

- some public pages may be disabled by package
- some admin sections may be unavailable by package
- some member capabilities may be unavailable by package

However, package gating should not create route chaos.

Rules:

- route names stay canonical
- disabled capability routes should be handled through controlled redirects or `notFound()` rules
- nav exposure must respect package gating centrally

---

## 9) Site-settings implications

Because public, member, and admin now share one hub host model, the site-settings model must support:

- branding that spans public and signed-in surfaces where appropriate
- homepage and public content settings
- contact/footer/legal settings
- template and theme selection
- package-aware enablement

The settings model should not try to manage:

- arbitrary route trees
- arbitrary page composition
- arbitrary domain behavior from the UI

Domain assignment and canonical-domain policy remain platform-controlled concerns even if admins can view their current domain state.

---

## 10) Implementation order

The domain and route model should be implemented in this order.

### 10.1 Host resolution layer

Implement:

- custom-domain lookup
- platform-hosted hub subdomain lookup
- local-development host resolution

### 10.2 Canonical redirect layer

Implement:

- primary custom-domain redirects
- platform-hosted fallback redirects
- alias cleanup behavior

### 10.3 Route-tree alignment

Align route families and shell ownership around:

- `/`
- `/account/*`
- `/admin/*`

for a resolved hub host.

### 10.4 Session and auth alignment

Ensure sign-in, join, member session, and admin session flows all preserve the resolved hub host model.

### 10.5 Package-gated route enforcement

Centralize route exposure and route access behavior for gated capabilities.

---

## 11) Conflicts with older planning assumptions

This document intentionally conflicts with older planning assumptions in places.

Most importantly:

- hub admin is now allowed on the hub's custom domain
- platform-hosted hub subdomain is preferred over path-based hub routing for the SaaS model
- public/member/admin are treated as one coherent hub-host experience

Older planning docs should be interpreted in light of this updated direction where conflicts exist.

---

## 12) Recommended next artifact

After this document, the next planning artifact should define the bounded site-settings schema for the SaaS model in operational detail.

That document should cover:

- what admins can edit
- what remains platform-controlled
- how package gating shapes settings visibility
- what homepage and public-site configuration fields are in scope first

---

## 13) Summary

The confirmed SaaS route model is:

- one shared multi-tenant application
- one resolved hub host
- public, member, and admin all on that host
- platform-hosted hub subdomain by default
- custom domain as the canonical host once configured

This is the correct route model for:

- immediate hub provisioning
- standardized public-site delivery
- strong white-label quality
- coherent public/member/admin alignment

It should now guide future implementation work in `apps/hub-platform`.
