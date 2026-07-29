# SaaS Site Settings Code Schema Plan

Status:
- Proposed
- Code-facing planning document

Purpose:
- Translate the SaaS site-settings planning into an implementation-ready schema and adapter plan
- Define the validation, normalization, and capability-boundary layers required before admin forms and public rendering are built

Related:
- [SaaS Site Settings Schema And Ownership Model](/mnt/c/local/community-app/apps/hub-platform/docs/public-site/saas-site-settings-schema-and-ownership-model-2026-03-15.md)
- [SaaS Domain And Route Model](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/saas-domain-and-route-model-2026-03-15.md)
- [Design System And Theming](/mnt/c/local/community-app/apps/hub-platform/docs/standards/design-system-and-theming.md)

---

## 1) Implementation goal

Before building admin settings forms or wiring the public homepage to live hub settings, the product needs one normalized site-settings schema in code.

That schema layer must give us:

- stable defaults
- central validation
- package-aware enforcement
- safe public-read normalization
- clear form payload boundaries

This is the layer that should prevent settings drift and unsupported combinations.

---

## 2) Required code layers

The implementation should be split into explicit layers.

### 2.1 Raw persistence shape

Purpose:

- represent the stored Firestore document or equivalent persisted record

Rules:

- close to storage
- versioned
- not consumed directly by routes or sections

### 2.2 Normalized domain shape

Purpose:

- produce the canonical in-app site-settings object

Rules:

- all defaults applied
- invalid combinations corrected or rejected centrally
- package-aware normalization applied
- safe for route and section consumption

### 2.3 Admin form payload shape

Purpose:

- define what the admin UI can submit for each settings area

Rules:

- only editable fields
- no platform-controlled fields
- area-specific validation

### 2.4 Capability adapter shape

Purpose:

- convert package tier and flags into a capability model that both settings UI and rendering layers can trust

Rules:

- centralized
- read-only from hub-admin perspective
- reused across admin and public/member logic

Important:
- this capability layer may influence whether approved route families are available
- but site settings should not own the primary navigation structure itself
- role-aware utility navigation should remain system-driven

---

## 3) Suggested module boundaries

The exact file names can evolve, but the implementation should likely separate concerns like this:

- `src/lib/domain/site-settings.js`
- `src/lib/domain/site-settings-capabilities.js`
- `src/lib/data/site-settings.js`
- `src/lib/data/site-settings-records.js`
- `src/lib/actions/site-settings.js`

Possible admin-area helpers:

- `src/app/admin/settings/branding/*`
- `src/app/admin/settings/homepage/*`
- `src/app/admin/settings/navigation/*`
- `src/app/admin/settings/contact/*`
- `src/app/admin/settings/legal/*`

The main rule is:

- raw persistence logic stays in data layer
- normalization and validation logic stays in domain layer
- routes and forms stay thin

---

## 4) Canonical normalized schema

The normalized schema should expose one stable object such as:

```js
{
  siteIdentity: {},
  branding: {},
  homePage: {},
  featuredContent: {},
  navigation: {},
  contact: {},
  footer: {},
  legal: {},
  memberExperience: {},
  packageContext: {},
}
```

This does not mean the stored Firestore shape must be identical, but the normalized shape should remain stable for consumers.

Important clarification:
- `navigation` in the normalized schema must not be interpreted as tenant-authored header links
- primary public navigation should remain system-derived from route authority, enablement, and capability rules
- member/admin utility menus should remain system-derived from session state and role rules
- site-settings-backed navigation fields, if any remain, must stay bounded to non-authoritative visibility or presentation concerns only

---

## 5) Validation model

Validation should happen in three layers.

### 5.1 Shape validation

Examples:

- required object keys
- string length limits
- allowed enum values
- allowed action-array lengths
- media reference shape

### 5.2 Capability validation

Examples:

- reject courses settings when courses are not package-enabled
- reject advanced hero variants when not allowed
- reject unsupported template family selections

### 5.3 Cross-field validation

Examples:

- legal page enabled requires corresponding content or reference
- selected featured content cannot reference disabled capability families
- homepage hero actions must fit approved action contracts

Validation must not live only in form components.

---

## 6) Defaulting rules

The schema layer should apply stable defaults so public routes do not need defensive conditional logic everywhere.

Defaults should include:

- fallback site identity text where appropriate
- default branding values
- default homepage hero structure
- default navigation visibility
- default legal enablement behavior
- default member-experience behavior

The normalized object should always be safe to consume even when the stored record is partial.

---

## 7) Package capability adapter

The implementation should create one normalized capability model derived from:

- package tier
- rollout flags
- future commercial limits

Examples:

```js
{
  coursesEnabled: true,
  paymentsEnabled: false,
  announcementsEnabled: true,
  customDomainAllowed: true,
  advancedHomepageVariantsEnabled: false,
}
```

This capability model should drive:

- settings UI visibility
- settings validation
- nav exposure
- route availability

That avoids package logic scattering across the app.

---

## 8) Content naming rules

The product should use `announcements`, not `articles`, for the community-update content type in this SaaS model.

Rationale:

- `articles` implies editorial or blog publishing
- `announcements` better matches community updates from admins to their members

That means the code-facing settings and capability plan should use:

- `announcementsEnabled`
- announcement-related featured content inputs where applicable

This naming should be kept consistent as implementation proceeds.

---

## 9) Member and admin implications

The settings schema should support the clarified surface roles:

- member experience should carry stronger public-site continuity
- admin should remain operational and structurally stable

So the schema should primarily feed:

- public shell and public pages
- member-entry and public-to-member transitions
- bounded admin settings forms

It should not be used as justification to redesign the existing admin shell.

---

## 10) First implementation slice

The first implementation slice should be intentionally narrow.

### 10.1 Domain layer

Implement:

- normalized schema defaults
- validation helpers
- capability adapter

### 10.2 Data layer

Implement:

- load current site-settings record by hub
- save per-area settings payloads
- version or migration support if needed

### 10.3 Admin layer

Implement v1 routes and forms for:

- branding
- homepage
- contact and footer
- legal

### 10.4 Public consumption

Wire only the first public consumers:

- public shell identity inputs
- homepage hero inputs
- footer/contact/legal basics

This keeps the first release controlled.

---

## 11) Recommended next implementation document

After this schema plan, the next most useful artifact would be a route-and-form implementation note for:

- `/admin/settings`
- `/admin/settings/branding`
- `/admin/settings/homepage`
- `/admin/settings/contact`
- `/admin/settings/legal`

That document should stay implementation-focused and map routes to schema areas and save actions.

---

## 12) Summary

The SaaS site-settings work should move into code through:

- one normalized schema
- one capability adapter
- one thin data-access boundary
- one bounded admin form model

That is the cleanest bridge from planning into implementation without reopening the architecture.
