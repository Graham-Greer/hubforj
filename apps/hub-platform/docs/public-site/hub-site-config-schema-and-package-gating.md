# Hub Site Config Schema And Package Gating

Status:
- Proposed
- Schema and governance planning document for hub-scoped public-site configuration
- Higher-level schema document; newer package/site-settings docs take precedence for current product authority

Purpose:
- Define the bounded configuration model that each hub should use to control its public site
- Define how package tiers should gate capability without creating forks or ad hoc logic
- Define what belongs in hub configuration versus what must remain developer-owned

Related:
- [SaaS Site Settings Schema And Ownership Model](/mnt/c/local/community-app/apps/hub-platform/docs/public-site/saas-site-settings-schema-and-ownership-model-2026-03-15.md)
- [SaaS Package Tier And Entitlement Model](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/saas-package-tier-and-entitlement-model-2026-03-29.md)
- [SaaS Package Authority And Enforcement Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/saas-package-authority-and-enforcement-plan-2026-03-29.md)

---

## Precedence note

This document should now be read as a higher-level schema and governance document.

For authoritative decisions on:

- package tiers
- capability bundles
- package ownership
- package enforcement

the following newer documents take precedence:

- [SaaS Site Settings Schema And Ownership Model](/mnt/c/local/community-app/apps/hub-platform/docs/public-site/saas-site-settings-schema-and-ownership-model-2026-03-15.md)
- [SaaS Package Tier And Entitlement Model](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/saas-package-tier-and-entitlement-model-2026-03-29.md)
- [SaaS Package Authority And Enforcement Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/saas-package-authority-and-enforcement-plan-2026-03-29.md)

---

## 1) Role of `HubSiteConfig`

Every hub should have one structured site-configuration boundary.

That boundary should be responsible for:
- enabling or disabling approved public pages
- selecting template families and page templates
- configuring featured content and public navigation
- controlling contact, footer, legal, and social information
- exposing package-governed capabilities

This configuration should be exposed to hub admins only through bounded, product-owned settings forms.

The intended operating model is:
- hub admins manage approved public-site settings directly through structured admin forms
- platform/package authority still controls package-derived capabilities and limits
- developers still own route implementations, template logic, and section implementations

It should not be responsible for:
- arbitrary page tree storage
- arbitrary layout authoring
- arbitrary route creation
- raw block composition state

`HubSiteConfig` exists to enable bounded variation, not unrestricted authorship.

---

## 2) Design rules for the schema

The schema must be:
- explicit
- normalized enough to stay stable
- strict enough to prevent unsupported combinations
- evolvable without breaking existing hubs
- package-aware

Configuration must be:
- validated below the UI layer
- defaultable
- safe to read from server-rendered public routes

The schema should be optimized for:
- predictable rendering
- clear admin/platform UX
- future extensibility
- low risk of configuration drift

---

## 3) Proposed top-level shape

The exact field names can evolve, but the model should contain the following domains.

### 3.1 Site identity

Purpose:
- establish public-site basics

Fields should include:
- public site name
- short public description
- canonical domain settings
- logo/media references
- favicon/media references if supported

### 3.2 Package and capability context

Purpose:
- define what the hub is allowed to enable

Fields should include:
- package tier
- enabled feature flags
- upgrade-restricted features
- package-derived limits

This should not be editable as freeform hub-admin content.
It should be derived from platform/package authority.

### 3.3 Theme and template context

Purpose:
- bind the hub to the presentation system

Fields should include:
- selected theme mode or theme preset
- selected template family
- selected typography/branding options where allowed
- token override references where approved

Theme and template must remain separate:
- theme affects presentation mode and token expression
- template affects composition defaults and design direction

### 3.4 Page enablement

Purpose:
- define which approved public pages are active

Fields should include:
- enabled core pages
- enabled optional pages
- enabled custom page entries

Each enabled page should map to an approved route type.

### 3.5 Page template selections

Purpose:
- define which approved page template variant each enabled page uses

Fields should include:
- homepage template
- about page template
- article list template
- article detail template
- legal page templates
- content page template selections for custom pages

Page template selection must be validated against:
- package tier
- template family
- page type

### 3.6 Navigation config

Purpose:
- define structured public navigation

Fields should include:
- primary navigation items
- footer navigation groups
- utility nav options
- external link support where approved

Navigation should reference approved pages and approved link types.
It should not support arbitrary hidden route structures.

### 3.7 Featured content config

Purpose:
- surface dynamic content intentionally

Fields should include:
- featured events source or selection
- featured courses source or selection
- featured testimonials source or selection
- featured announcements selection where supported

Featured-content config should support:
- manual curation
- simple automated rules where justified

It should not become a query-builder.

### 3.8 Contact, footer, and legal content

Purpose:
- support public site completeness

Fields should include:
- contact information
- address/location details
- social links
- footer text
- legal page references or legal content settings

### 3.9 Member experience config

Purpose:
- allow bounded control over member-entry behavior on the public site

Fields should include:
- whether public join is enabled
- whether events/courses require sign-in before booking
- where account prompts should appear
- wording toggles only if strongly justified

These settings should affect behavior, but not permit broad messaging drift.

### 3.10 Custom page registry

Purpose:
- support bounded extra pages

Fields should include:
- custom page slug
- custom page type
- selected page template
- enabled/disabled state
- navigation exposure

Custom page entries should be constrained by:
- package tier
- approved template types
- slug validation rules

---

## 4) Configuration ownership boundaries

### 4.1 Platform-owned fields

These should generally be platform-controlled or package-derived:
- package tier
- capability flags
- custom page count limits
- advanced template family availability
- advanced section/template variant availability
- future editorial enablement such as blog/news

### 4.2 Hub-admin-managed fields

Hub admins should not have direct control over public-site composition or route/page configuration.
Hub admins should not have direct control over arbitrary public-site composition or arbitrary route/page configuration.

Hub admins may still manage structured records that feed the public site where the product allows it, such as:
- events
- courses
- testimonials
- announcements if that content type is later implemented
- limited contact or profile information only if explicitly delegated by product policy

Hub admins may also manage bounded site settings directly where the product explicitly supports it, such as:
- branding fields
- homepage hero fields
- contact fields
- footer fields
- legal text fields where supported

### 4.3 Developer-owned fields

These should remain code-owned:
- route implementations
- section implementations
- template logic
- dynamic data adapters
- CTA/state rules

This ownership line is non-negotiable if the system is to remain maintainable.

---

## 5) Package gating model

Package gating should operate on capability bundles, not on ad hoc switches scattered through the app.

### 5.1 Recommended package categories

The current package model is:
- free
- starter
- growth

These categories should map to:
- page inventory access
- custom page limits
- template family access
- advanced dynamic content capabilities
- future editorial feature access beyond the core announcements model

### 5.2 What packages should gate

Packages may gate:
- number of custom pages
- advanced landing-page templates
- future news/blog support
- advanced featured-content controls
- advanced template families
- certain premium section variants if justified

### 5.3 What packages should not gate

Packages should not gate:
- basic design-system integrity
- accessibility quality
- auth-aware navigation correctness
- core performance
- core responsive behavior
- stable event/course discovery flows

Lower packages should have less breadth, not worse architecture.

---

## 6) Validation rules

The config layer must enforce compatibility.

Examples:
- a hub cannot choose an unsupported home template for its template family
- a hub cannot create more custom pages than its package allows
- a hub cannot enable future blog/news routes unless the feature is approved and active

Validation should happen:
- in domain/schema normalization
- in admin/platform mutation boundaries
- in route resolution where necessary as a defensive check

Validation should not rely on:
- client-side form assumptions only

---

## 7) Defaults and fallback behavior

Every hub should have a valid site configuration, even if only minimally customized.

The system therefore needs:
- package-derived defaults
- template-family defaults
- sensible defaults for navigation and featured content
- defensive fallback behavior when optional config is incomplete

Fallbacks must be:
- deterministic
- documented
- product-approved

Fallbacks must not:
- silently expose unsupported routes
- silently invent page compositions
- hide incompatible package/template choices

---

## 8) Suggested schema modules

The implementation should likely split the configuration into internally separate modules such as:
- `siteIdentity`
- `packageContext`
- `themeContext`
- `pageRegistry`
- `navigationConfig`
- `featuredContent`
- `contactAndFooter`
- `memberExperienceConfig`
- `customPages`

This keeps the data model evolvable and the admin UI manageable.

---

## 9) Admin and platform UX implications

This schema implies structured management screens, not a freeform site-builder.

Likely management areas:
- Site overview
- Public pages
- Homepage and featured content
- Navigation
- Contact and footer
- Branding and theme
- Custom pages
- Package/capability visibility

These are platform/product-team management areas, not a hub-admin site editor.

The UX should be calm and task-oriented.
Admins should feel like they are configuring a site system, not assembling a page tree.

---

## 10) Implementation sequence

### Step 1

Define:
- schema shape
- defaults
- package capability matrix
- validation rules

### Step 2

Implement:
- domain normalization
- package compatibility checks
- server-side config resolution for public routes

### Step 3

Build:
- admin/platform editors for the bounded configuration areas

### Step 4

Wire:
- page enablement
- template selection
- featured content
- navigation resolution

### Step 5

Verify:
- route gating
- auth-aware nav and CTA behavior
- package enforcement

---

## 11) Acceptance criteria

The `HubSiteConfig` model is ready when:
- every hub can resolve to one valid public-site configuration
- packages are enforced centrally
- public routes can resolve enabled pages deterministically
- template-family and page-template selections are validated
- custom pages remain bounded and predictable
- no route requires CMS-like page-tree data to render

That is the desired product architecture boundary.
