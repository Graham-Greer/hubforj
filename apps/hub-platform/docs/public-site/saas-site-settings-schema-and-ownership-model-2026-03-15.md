# SaaS Site Settings Schema And Ownership Model

Status:
- Proposed
- Operational planning document for bounded hub-admin-managed site settings

Purpose:
- Define the bounded site-settings model for the confirmed SaaS direction
- Clarify what hub admins can edit directly
- Clarify what remains platform-controlled, package-derived, or developer-owned
- Establish the first-release scope for public-site settings without drifting into CMS behavior

Related:
- [SaaS Direction And Next Steps](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/saas-direction-and-next-steps-2026-03-15.md)
- [SaaS Domain And Route Model](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/saas-domain-and-route-model-2026-03-15.md)
- [Hub Site Config Schema And Package Gating](/mnt/c/local/community-app/apps/hub-platform/docs/public-site/hub-site-config-schema-and-package-gating.md)
- [SaaS Package Tier And Entitlement Model](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/saas-package-tier-and-entitlement-model-2026-03-29.md)
- [SaaS Package Authority And Enforcement Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/saas-package-authority-and-enforcement-plan-2026-03-29.md)

---

## Precedence note

This document remains the authoritative ownership model for bounded hub-admin-managed site settings.

For package-tier decisions, entitlement rules, and enforcement planning, the following newer documents take precedence:

- [SaaS Package Tier And Entitlement Model](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/saas-package-tier-and-entitlement-model-2026-03-29.md)
- [SaaS Package Authority And Enforcement Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/saas-package-authority-and-enforcement-plan-2026-03-29.md)

---

## 1) Formal decision

Under the confirmed SaaS direction, each hub should have one bounded site-settings boundary that hub admins can manage directly through admin.

This settings model should support:

- branded public-site presentation
- bounded public-page content fields
- contact/footer/legal completeness
- featured-content choices
- package-aware site capability exposure

It should not support:

- arbitrary page composition
- arbitrary route creation
- freeform CMS authoring
- unrestricted navigation architecture
- unrestricted template editing

The system must remain structured, validated, and product-owned.

---

## 2) Why this document is needed

Earlier planning assumed a more platform-managed public-site configuration model.

That assumption no longer fits the confirmed product direction, because the SaaS model now expects hub admins to manage bounded site presentation directly inside the product.

This creates a new ownership model:

- developers still own routes, templates, sections, and rendering logic
- the platform still owns package and domain authority
- hub admins now own a bounded site-settings surface

This document exists to keep that boundary clean.

---

## 3) Core principles

The site-settings system must be:

- bounded
- validated
- package-aware
- token-aware
- template-aware
- operationally simple
- safe for direct admin use

The site-settings system must not become:

- a CMS
- a visual editor
- an arbitrary page builder
- a freeform theme engine
- a backdoor for unsupported product combinations

---

## 4) Ownership model

### 4.1 Hub-admin-managed

Hub admins should be able to manage:

- site identity basics
- logo and branded media inputs
- approved brand color choices or token override inputs within bounds
- selected template/theme options where allowed
- homepage hero fields
- selected featured content
- contact information
- footer information
- legal-page content or legal references where supported
- package-allowed page visibility or feature toggles where product policy allows it

This should all happen through structured forms and validated settings objects.

### 4.2 Platform-controlled

These settings should remain platform-controlled:

- package tier
- feature flags derived from package or internal rollout
- domain assignment and canonical domain policy
- custom-domain verification state
- advanced template availability
- experimental section or page-template availability
- commercial limits and upgrade entitlements

Current package naming and commercial ladder should now be read as:
- free
- starter
- growth

Hub admins may view some of this information, but they should not authoritatively control it.

### 4.3 Developer-owned

These remain code-owned:

- route inventory
- route implementations
- page templates
- section implementations
- auth-aware CTA logic
- shell ownership
- normalized data adapters
- capability enforcement behavior

This boundary is essential.
Hub admins manage content and bounded settings, not product architecture.

---

## 5) Proposed top-level settings shape

The exact implementation can evolve, but the first stable model should include the following domains.

### 5.1 `siteIdentity`

Purpose:

- define the public-facing identity of the hub

Fields should include:

- public site name
- short site description or tagline
- logo asset reference
- square mark or favicon reference if supported

Notes:

- this should not include arbitrary brand manifesto content
- text length limits should be explicit

### 5.2 `branding`

Purpose:

- bind the hub to approved visual controls

Fields should include:

- theme mode or approved theme preference where applicable
- template family selection if package and product policy allow it
- bounded accent color or brand token overrides
- optional surface style choices only if the design system explicitly supports them

Rules:

- branding must resolve through tokens
- raw CSS values should not be stored directly
- unsupported combinations must be rejected by validation

### 5.3 `homePage`

Purpose:

- configure bounded homepage content inputs

Fields should include:

- hero eyebrow
- hero title
- hero description
- hero actions from approved action shapes
- hero image or video asset reference
- hero variant if product-approved
- selected featured-content sections where allowed

Rules:

- this is bounded page configuration, not arbitrary homepage composition
- hero fields should map to one approved homepage template contract

### 5.4 `featuredContent`

Purpose:

- control which structured records are highlighted publicly

Fields should include:

- featured events strategy
- featured courses strategy
- featured testimonials strategy
- featured announcements strategy where announcements are enabled

Allowed models:

- manual selection
- simple automatic modes such as latest or upcoming where justified

Disallowed:

- arbitrary query-builder logic

### 5.5 `navigation`

Purpose:

- control bounded site navigation exposure

Fields should include:

- primary navigation enablement for approved pages
- footer navigation groups
- external link entries where approved

Rules:

- navigation items should point to approved route types
- navigation should not support arbitrary route invention
- package-disabled pages should not be exposed

### 5.6 `contact`

Purpose:

- provide public contact completeness

Fields should include:

- primary contact email
- phone number
- address or location display fields
- map or directions link if supported
- contact CTA wording only if product-approved

### 5.7 `footer`

Purpose:

- support consistent public footer presentation

Fields should include:

- footer summary text
- social links
- approved footer navigation groups
- copyright or organization line

### 5.8 `legal`

Purpose:

- support privacy and terms completeness

Fields should include:

- privacy page enabled state
- terms page enabled state
- legal contact fields where needed
- legal text inputs or approved managed-document references

Rules:

- if the product supports inline legal content editing, it must remain constrained and validated
- legal routes remain product-owned even if admins can edit bounded text fields

### 5.9 `memberExperience`

Purpose:

- control bounded public-to-member behavior

Fields should include:

- public join enabled state
- member account entry emphasis where supported
- whether certain public registration actions require sign-in first
- approved CTA behavior toggles only where genuinely needed

This area should stay behavior-oriented, not message-authoring-heavy.

### 5.10 `packageContext`

Purpose:

- expose package-derived capability state to the settings UI and rendering layer

Fields should include:

- package tier
- enabled feature flags
- upgrade-gated capabilities
- package limits

Rules:

- this data should be read-only for hub admins
- the UI may use it to disable or hide unsupported settings

---

## 6) First-release editable scope

The first release should be intentionally narrow.

Hub-admin-editable in v1:

- site name
- short site description
- logo
- approved brand color inputs
- homepage hero eyebrow, title, description
- homepage hero media
- homepage hero actions within approved constraints
- featured events selection
- featured courses selection if package-enabled
- featured testimonials selection if package-enabled
- contact details
- footer text and social links
- privacy and terms content or references within bounded limits

Not in v1:

- arbitrary section ordering
- arbitrary homepage composition
- custom page creation from admin
- arbitrary navigation tree editing
- advanced template switching if it materially changes composition contracts
- raw token editing

This keeps the first version useful without opening the door to CMS sprawl.

---

## 7) Package-aware settings behavior

Package gating must shape both the stored settings and the admin UI.

### 7.1 Rules

- unsupported settings should not be silently accepted
- unsupported settings should not be exposed as editable if the package does not allow them
- existing settings for downgraded capabilities should be preserved safely but treated as inactive
- upgrade opportunities may be shown in the UI where commercially appropriate

### 7.2 Examples

- courses settings visible only when courses are enabled by package
- payments-related public settings visible only when payments are enabled by package
- advanced homepage variants visible only on allowed packages
- custom-domain status visible to all, but editable controls limited by platform authority

---

## 8) Admin UX rules for site settings

The admin site-settings experience should feel operational, not editorially chaotic.

### 8.1 UX principles

- grouped by clear domains
- low-cognitive-load forms
- immediate relationship to public-site outcome
- preview support only if it can be high quality
- strong validation and helpful constraints

### 8.2 Suggested settings navigation

Initial settings areas could be:

- Branding
- Homepage
- Navigation
- Contact and Footer
- Legal
- Domain and Package

The exact route structure can stay shallow.

### 8.3 Validation rules

Validation should enforce:

- text length limits
- asset requirements
- package eligibility
- approved action shapes
- approved page references
- approved color/token mappings

Validation must happen below the UI layer, not only in the form.

---

## 9) Data and implementation rules

### 9.1 Storage model

Each hub should have one canonical site-settings record or equivalent normalized boundary.

The settings record should be:

- versionable
- defaultable
- safe to read at public-route render time
- easy to validate centrally

### 9.2 Rendering model

Public routes should consume normalized site-settings data through adapters.

Routes and sections should not:

- read raw Firestore settings blobs directly
- guess package capability rules
- interpret partially invalid settings ad hoc

### 9.3 Media model

Site settings that use media should rely on approved hub-scoped media references.

Examples:

- logo asset
- hero media
- favicon or mark asset

Media selection must remain structured and validated.

---

## 10) Conflicts with older planning assumptions

This document updates earlier assumptions in an important way.

Older planning often assumed:

- public-site configuration would be primarily platform-managed
- hub admins would not directly manage meaningful site presentation settings

The confirmed SaaS direction changes that.

The updated rule is:

- hub admins may manage bounded site settings directly
- but they still do not manage freeform composition, routes, or architecture

That is the correct middle ground.

---

## 11) Recommended next implementation sequence

After this settings model is accepted, the implementation sequence should be:

1. define the normalized settings schema in code
2. define package-capability adapters
3. build admin settings routes and forms for v1 scope
4. wire public homepage and shell to consume normalized settings
5. extend the public section system in `hub-platform`

This order keeps the data model and admin surface aligned with the public rendering system.

---

## 12) Summary

The SaaS site-settings model should let hub admins manage a bounded, high-value subset of site presentation directly.

They should be able to manage:

- identity
- branding within approved constraints
- homepage hero content
- featured content
- contact/footer/legal details

They should not be able to manage:

- arbitrary composition
- arbitrary routes
- arbitrary templates
- product architecture

That is the right balance for a productized SaaS site system.
