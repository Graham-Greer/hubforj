# Public Site Architecture And Delivery Plan

Status:
- Proposed
- Detailed planning document for the branded public-site system inside `apps/hub-platform`

Purpose:
- Define how the platform should deliver public websites for hubs without implementing a general-purpose CMS
- Define the relationship between route authority, hub-scoped configuration, template families, reusable sections, and auth-aware behavior
- Establish a production-grade implementation order for public-site delivery

---

## 1) Product decision

The public site is a first-class product surface.

It must be capable of:
- presenting a hub as a polished branded website
- surfacing dynamic operational content such as events and courses
- acting as the entry point for member sign-in, member account access, and public-to-member conversion
- steering admins and members appropriately when they are already authenticated

The public site is not:
- a general-purpose tenant-authored website builder
- a freeform CMS block system
- a route-by-route bespoke implementation that bypasses shared architecture

The public site must therefore be implemented as:
- one shared route system
- one shared token/theme/template system
- one shared public section library
- one structured hub site configuration model
- one bounded package-gating model

Current implementation note:
- public and member-facing hub routes now run beneath one shared hub shell boundary
- member account routes are protected below that shell rather than mounted in a competing layout tree

---

## 2) Public-site operating model

### 2.1 Core principle

Public pages should be:
- platform-defined
- developer-composed
- hub-scoped through platform-managed configuration
- package-gated
- theme-aware
- auth-aware

This is the core balance the architecture must protect.

### 2.2 Ownership model

Ownership should be split as follows:

- Platform architecture owns route authority.
- Developers own page template implementations and section composition.
- Platform-managed hub configuration owns bounded enablement, featured content, theme choices, and selected variants.
- Hub-admin-managed structured data owns dynamic content inputs such as events, courses, testimonials, and articles.

This separation is necessary so the system stays flexible without collapsing into page-builder complexity.

### 2.3 Why this model is preferred

This model is the correct fit for the product because it:
- preserves high frontend quality
- avoids a second product surface for CMS authoring
- keeps routes and composition under engineering control
- allows package-based differentiation
- supports rapid client-site delivery from one shared codebase
- prevents tenant-authored arbitrary content structures from destabilizing the product

---

## 3) Public page inventory

The system should distinguish between three page categories.

### 3.1 Core platform pages

These pages are part of the public-site foundation and should exist as canonical route types:

- home
- about
- events list
- event detail
- courses list
- course detail
- articles list
- article detail
- privacy policy
- terms
- contact
- sign in
- join
- account entry

These routes are part of the product, not optional experiments.

### 3.2 Optional product pages

These pages should be supported by the architecture, but may be gated by package or rollout stage:

- news list
- news article
- blog list
- blog article

Important:
- testimonials should remain a dynamic section capability
- FAQ should remain a section capability
- pricing should remain a section capability
- privacy policy and terms are core public pages, not optional legal add-ons

### 3.3 Client-specific custom pages

These pages are allowed only as bounded, approved public-page types:

- campaign pages
- landing pages
- ministry/program pages
- giving/support pages
- local information pages

These pages should not be arbitrary route definitions authored by tenants.

Instead, they should be implemented as:
- developer-owned page template types
- selected or enabled through platform-managed hub configuration
- subject to package limits and validation

---

## 4) Route authority rules

The public-site architecture must remain explicit about route ownership.

### 4.1 Route rules

- Core routes are product-owned.
- Optional routes are product-owned but package-gated.
- Custom pages are product-approved route types, not arbitrary route shapes.
- Hub admins must not be able to create unbounded new route structures from the UI.
- Hub admins should not have public-site composition or page-enablement authority.
- Public routes must remain compatible with the auth/session model already governing member and admin flows.

### 4.2 Route responsibilities

Public routes should be responsible for:
- resolving hub context
- resolving auth/session context
- loading normalized page data through server-side adapters
- selecting the correct page template or composition module

Public routes should not be responsible for:
- raw database shaping inside the route file
- ad hoc CTA logic
- direct package rules scattered across many routes
- one-off theme decisions

---

## 5) Hub-scoped site configuration

Each hub needs one bounded public-site configuration boundary.

That boundary should control:
- which public pages are enabled
- which template family the site belongs to
- which page templates are selected
- what featured content is surfaced
- what branding and theme settings apply
- which package-governed capabilities are unlocked

This should live as structured hub-scoped configuration, not as arbitrary page-builder state.
That configuration should be managed by the product/platform side as part of client delivery, not as a general hub-admin editing capability.

The hub is therefore the tenant boundary for:
- site identity
- page enablement
- public navigation
- theme/template selection
- featured content
- contact/footer/legal information
- public-site feature gating

The schema details are described in `hub-site-config-schema-and-package-gating.md`.

---

## 6) Template family model

The system needs bounded variation between clients without forking the product.

That variation should be expressed through template families.

Template families should define:
- design tone and composition defaults
- allowed page templates
- section variant defaults
- navigation expectations
- content emphasis

Examples:
- `community-standard`
- `education-focused`
- `events-led`
- `content-led`

These are not themes.

Theme controls presentation mode and branding expression.
Template family controls layout personality, composition defaults, and public-site emphasis.

This distinction must remain clean.

The matrix is detailed in `public-page-template-family-matrix.md`.

---

## 7) Page composition model

Public pages should be built from developer-owned page templates and production-grade section components.

### 7.1 Composition rules

- Developers define approved page templates in code.
- Platform-managed hub config selects from approved templates and variants.
- Dynamic content flows through normalized adapters.
- Sections remain bounded and intentional.

This is the required middle ground between:
- hardcoded one-off client pages
- and a general CMS block-builder

### 7.2 Page template types

Initial page template types should include:

- `home-standard`
- `home-editorial`
- `about-standard`
- `listing-standard`
- `detail-standard`
- `content-standard`
- `landing-standard`
- `legal-standard`

Each page template type should define:
- the sections it may contain
- the order and layout logic
- the variant system it supports
- what dynamic data dependencies it can consume

### 7.3 Custom page model

Custom client pages should be supported as bounded page types.

Examples:
- a custom `landing-standard` page with a hero, rich text, CTA, FAQ, and testimonials section
- a custom `content-standard` page with intro, body, image split, and CTA

Custom pages should not mean:
- arbitrary block trees
- arbitrary routing rules
- arbitrary code injection

The platform should instead support:
- approved custom page templates
- approved slugs
- approved section combinations
- package-based quantity limits

---

## 8) Dynamic content model

The public site must integrate structured operational content.

Dynamic public inputs should include:
- events
- courses
- articles
- testimonials
- featured content selections
- contact info
- navigation/footer settings
- future editorial records such as posts if approved later

Dynamic sections should not receive raw backend shapes directly.

Instead the system should introduce server-side adapters such as:
- `getPublicHomePageData(hubSlug)`
- `getPublicAboutPageData(hubSlug)`
- `getPublicEventsPageData(hubSlug)`
- `getPublicEventDetailPageData(hubSlug, slug)`
- `getPublicCoursesPageData(hubSlug)`
- `getPublicCourseDetailPageData(hubSlug, slug)`

These adapters should:
- validate hub/package/template context
- normalize data for sections
- resolve auth-aware CTA state inputs
- hide backend implementation detail from presentation components

---

## 9) Auth-aware public behavior

The public site must adapt when the viewer is:
- anonymous
- a signed-in member
- a signed-in admin

This is not optional.

Because the public site is also the front door for the operational product, public pages must understand:
- sign-in state
- member registration state where relevant
- whether account or admin navigation should be surfaced
- whether event/course CTAs should prompt sign-in, join, register, or manage

This must be implemented as a shared system, not as per-page improvisation.

The behavioral rules are detailed in `public-auth-aware-ux-and-cta-rules.md`.

---

## 10) Package-aware site delivery

Different price points should control public-site capability without fragmenting the codebase.

Packages should gate:
- available page inventory
- custom page count
- advanced template families
- section variant access where justified
- advanced dynamic content capabilities
- future editorial capabilities such as blog/news

Packages should not gate:
- basic accessibility quality
- core route quality
- basic theme correctness
- stable navigation or auth behavior

The platform must remain one high-quality system.
Packages should control scope and flexibility, not whether the product feels coherent.

---

## 11) Admin and platform management surfaces

The architecture implies structured admin/platform surfaces for public-site management.

Likely management areas:
- site overview
- page enablement
- homepage/featured content
- navigation
- footer/contact/social
- theme/template selection
- package visibility and upsell restrictions
- custom page registry

Permission boundaries should be explicit:
- platform operators and the product team control public-site configuration, package, and high-level site capabilities
- hub admins manage community records that may feed the public site, but do not edit public-site composition

This prevents configuration drift and protects product quality.

---

## 12) Delivery phases

### Phase 1: Public route authority

Define:
- canonical public route inventory
- package-gated route inventory
- custom-page policy
- route ownership and adapter expectations

Acceptance:
- route boundaries are explicit
- no implementation depends on arbitrary route authoring

### Phase 2: Hub site configuration model

Define:
- `HubSiteConfig`
- package capability matrix
- feature gating rules
- validation/normalization rules

Acceptance:
- one bounded hub configuration shape exists
- package rules are centralized

### Phase 3: Auth-aware public UX rules

Define:
- nav-state matrix
- CTA-state matrix
- account/admin entry rules
- event/course registration behavior by session state

Acceptance:
- public auth behavior is systematized before page implementation

### Phase 4: Production-grade public section system

Build:
- the base public section library
- entity presentation contracts
- variant system
- token/theme/template alignment

Acceptance:
- section quality is strong enough to support real client delivery

### Phase 5: Core page templates

Implement:
- home
- about
- events list/detail
- courses list/detail
- articles list/article
- contact
- privacy policy
- terms

Acceptance:
- one template family can support a real client-quality site

### Phase 6: Optional pages and higher packages

Implement:
- custom content pages
- custom landing pages
- future pricing or FAQ page types only if product direction changes and they stop being section-only concepts
- future editorial routes where approved

Acceptance:
- package gating works cleanly
- optional public pages do not create architectural drift

### Phase 7: Hardening and release readiness

Complete:
- accessibility sweep
- responsive behavior verification
- performance review on anonymous and signed-in public flows
- route-by-route QA with auth-state permutations

Acceptance:
- public-site delivery is production-grade
- auth-aware transitions feel integrated, not bolted on

---

## 13) Quality bar

The public site must feel like one polished product surface that happens to contain:
- a branded website
- dynamic event/course/article/testimonial discovery
- structured promotional content
- member entry points
- admin entry points

It must not feel like:
- a marketing layer pasted on top of an admin tool
- a CMS embedded into an operations app
- a site-builder compromise

The architecture should optimize for:
- clarity
- speed
- maintainability
- performance
- deliberate flexibility
- strong client delivery quality
