# SaaS Direction And Next Steps

Status:
- Confirmed direction
- Planning and alignment document

Purpose:
- Formally confirm the product direction as SaaS rather than bespoke client-site delivery
- Record the architectural implications for `apps/hub-platform`
- Define the controlled next steps for implementation from a product and engineering perspective

---

## 1) Formal decision

The product direction is now confirmed as:

- one shared multi-tenant application foundation
- one shared route and feature system
- one shared public/member/admin experience per hub
- optional custom domains per hub
- platform-hosted default domain or subdomain for hubs before custom-domain setup
- bounded admin-managed site settings
- no bespoke per-client repo as the default delivery model
- no general-purpose CMS or freeform page builder

This means the primary architectural path is `apps/hub-platform`, not `apps/client-site-starter`.

The `client-site-starter` work remains useful as exploratory work for the public section system and route ergonomics, but it is no longer the primary delivery direction.

---

## 2) Product model

### 2.1 Hub experience model

Each hub should receive:

- a public site
- a member experience
- an admin experience

These should all live on the hub's real domain once a custom domain is configured.

Examples:

- `https://bobsyoga.com`
- `https://bobsyoga.com/account`
- `https://bobsyoga.com/admin`

Before custom-domain setup, the hub should be available on a platform-hosted address such as:

- `https://bobsyoga.ourplatform.com`

or another equivalent platform-controlled host model.

### 2.2 Standardization model

The public site should be standardized rather than bespoke.

That means:

- product-owned route inventory
- developer-owned page templates and sections
- bounded template and theme choices
- structured admin-managed content inputs
- package-tier-controlled capability enablement

It does not mean:

- arbitrary route creation by hub admins
- a visual page builder
- a CMS block system
- one-off client code forks as the normal product path

### 2.3 Admin-managed site configuration

Hub admins should be able to manage bounded public-site settings such as:

- logo
- brand colors or theme choices within approved constraints
- homepage hero copy
- homepage hero media
- contact details
- social links
- selected featured content

This should be managed through structured forms in admin.

It should not become freeform page composition.

### 2.4 Package-tier behavior

Public routes and product capabilities should be package-aware.

Examples:

- payments enabled only on qualifying packages
- courses enabled only on qualifying packages
- advanced public pages or content types gated by package
- custom-domain support potentially gated by package if desired commercially

Package gating should be a first-class architectural concern, not scattered route-by-route conditionals.

---

## 3) Why this direction is preferred

This direction is preferred because it aligns the product model, technical model, and operational model.

Benefits:

- hubs can be provisioned immediately
- the product remains one shared system rather than many bespoke frontends
- public, member, and admin experiences can stay aligned on one domain while preserving distinct shell roles
- template and section investment compounds across all hubs
- package differentiation becomes natural
- custom-domain support becomes a SaaS feature rather than a bespoke delivery exercise

This is a better fit for a scalable product than creating and maintaining one client-site repo per client.

---

## 4) Architectural implications

### 4.1 Primary application boundary

`apps/hub-platform` becomes the primary product delivery surface for:

- public site
- member experience
- hub admin experience

The long-term product should not depend on copying and customizing separate frontend repos per client.

### 4.2 Host and domain resolution

The platform must support:

- platform-hosted hub address resolution
- custom-domain-to-hub resolution
- canonical-domain policy
- correct routing for public, member, and admin under the resolved hub

This becomes core application infrastructure.

### 4.3 Public-site architecture

The public site must be treated as a first-class product surface inside `hub-platform`.

That means:

- production-grade section system
- bounded template families
- auth-aware public/member transitions
- hub-scoped site settings
- package-aware route enablement

### 4.4 Admin scope

Hub admin should continue to focus on community and site operations such as:

- members
- admins and invites
- events
- courses
- registrations
- attendance
- payments
- testimonials
- media
- bounded site settings

Admin should remain an operational workspace.

That means:

- keep the current admin structure and interaction model where it is already working
- avoid unnecessary restyling or structural redesign
- extend the admin only where the SaaS model requires new capability such as bounded site settings and package-aware behavior

Superadmin alignment is not the priority for this phase.

The immediate priority is aligning public, member, and admin around the SaaS domain and configuration model.

---

## 5) What becomes transitional

The following should now be treated as transitional or exploratory rather than primary:

- `apps/client-site-starter` as the default product direction
- the client-site split architecture as the default delivery model
- the assumption that every serious client needs its own frontend repo

The existing docs under `docs/client-site-split/` should remain as historical context for that explored direction, but they are no longer the default path forward.

The section-system work done in `client-site-starter` is still valuable.
However, it should be treated as design and implementation input to bring back into `hub-platform`, not as the final application boundary.

---

## 6) Controlled implementation priorities

The next steps should be taken in the following order.

### 6.1 Formalize the domain and route model

Define and document:

- host-to-hub resolution rules
- default platform-hosted hub address format
- custom-domain resolution behavior
- canonical-domain policy
- whether admin/member/public all resolve from the same host

This has effectively been decided at product level:

- public, member, and admin should all live on the hub's domain

The next work is to codify the technical model cleanly.

### 6.2 Formalize the bounded site-settings model

Define exactly what hub admins can configure for the public site.

This should include:

- identity and branding
- theme/template choices within allowed bounds
- hero content fields
- contact/footer/legal fields
- featured content controls
- package-aware page enablement where appropriate

This should remain structured and validated.

### 6.3 Bring the public section-system work back toward `hub-platform`

Use the recent section-system exploration as input, but implement the production system in `hub-platform`.

Initial priority should be:

- `SectionShell`
- `SectionContainer`
- `SectionHeader`
- `SectionActions`
- `SectionMedia`
- `HeroSection`

The section system must remain token-first and production-grade.

### 6.4 Build the public shell and member continuity model

The member experience should feel like a continuation of the site, not a disconnected portal.

This requires:

- public shell design
- member shell design aligned to the same brand language
- auth-aware nav and CTA rules
- entry/return flows between public pages and account flows

This continuity requirement applies much more strongly to member than to admin.

### 6.5 Align admin with the same SaaS model

Admin is already the strongest implemented surface, but it must align with the new domain and site-settings direction without unnecessary overhaul.

Immediate admin work should focus on:

- site settings UI and data model
- package-aware admin navigation and capability gating
- ensuring admin works cleanly on the hub domain model

### 6.6 Define package gating as a platform capability

Package-tier rules should be centralized.

They should govern:

- feature availability
- public page enablement
- admin navigation exposure
- route access where needed
- upgrade prompts and disabled states where appropriate

### 6.7 Delay superadmin realignment

Superadmin and internal platform operations should not drive the current implementation order.

They matter later, but they should not distract from:

- public quality
- member continuity
- admin/site-settings alignment
- domain model correctness

---

## 7) Immediate workstreams

The immediate delivery workstreams should now be:

1. Domain and hub resolution model
2. Site settings schema and ownership model
3. Public section system in `hub-platform`
4. Public homepage and core public templates
5. Member-route redesign for site continuity
6. Package gating integration

This is the controlled order that best protects architecture quality while still moving the product forward.

---

## 8) Open decisions to lock next

The following are the next decisions that should be explicitly documented.

### 8.1 Default hub host format

Need to confirm:

- subdomain model
- path model
- local-development host strategy

### 8.2 Canonical-domain rules

Need to define:

- which host wins when both platform-hosted and custom domain exist
- redirect behavior
- SEO/canonical handling

### 8.3 Initial site-settings scope

Need to confirm the first release boundary for:

- branding
- homepage fields
- contact/footer/legal settings
- featured content controls
- page enablement controls

### 8.4 Initial package matrix

Need to confirm what is gated in the first production package model.

Examples:

- events
- courses
- payments
- testimonials
- custom domain
- advanced templates

---

## 9) Recommended next artifact

The next planning artifact should define the domain and route model in detail for the SaaS direction.

That document should cover:

- host resolution
- custom-domain mapping
- local-development behavior
- session and cookie implications
- canonical redirects
- public/member/admin route expectations under one hub domain

That should be the next formal planning step before significant new implementation work.

---

## 10) Summary

The product direction is now formally SaaS.

That means:

- `hub-platform` is the primary product application
- public, member, and admin should align on the hub's domain
- the public site should be standardized and productized
- hub admins should manage bounded site settings, not a CMS
- package gating should be a core architectural concern
- superadmin alignment is deferred

The next work should proceed in a controlled order:

- domain model
- site-settings model
- public section system in `hub-platform`
- public/member alignment
- package gating

This is the cleanest route to a scalable product from both product and engineering perspectives.
