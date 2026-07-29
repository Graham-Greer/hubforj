# Public Site Planning Docs

Status:
- Proposed planning set for the non-CMS public-site system inside `apps/hub-platform`
- Intended to sit alongside the greenfield roadmap, but focused specifically on public-site delivery, package gating, and production-grade section composition

Authority:
- Must be read together with:
  - `docs/standards/source-of-truth.md`
  - `docs/standards/design-system-and-theming.md`
  - `docs/roadmap/greenfield-product-scope-v2.md`
  - `docs/roadmap/greenfield-implementation-roadmap-v2.md`
- This folder does not replace the greenfield roadmap.
- This folder deepens the public-site architecture that the greenfield roadmap already implies.

Purpose:
- Define how `apps/hub-platform` should support branded client public sites without becoming a CMS
- Define how hub-scoped site configuration, package gating, route authority, and reusable public page sections should work together
- Define how the public site should adapt to anonymous, member, and admin states while remaining one coherent branded product surface
- Define the operating model where public-site setup is handled by the product/platform team and hub admins manage community operations rather than site composition

Interpretation rule:
- Public-site delivery must remain:
  - route-bounded
  - developer-controlled
  - token-first
  - theme-aware
  - template-aware
  - package-aware
- Nothing in this folder should be interpreted as approval for arbitrary tenant-authored page building.

---

## Recommended reading order

1. `public-site-architecture-and-delivery-plan.md`
2. `hub-site-config-schema-and-package-gating.md`
3. `public-auth-aware-ux-and-cta-rules.md`
4. `public-page-template-family-matrix.md`
5. `public-site-section-system-plan.md`

---

## Planning intent

This planning set exists because the product now has a clearer direction:

- the platform is not a CMS
- the public site is still a first-class product surface
- client sites must be deliverable quickly from one shared codebase
- some public content must remain dynamic and hub-managed
- some public page composition must remain developer-owned so quality does not collapse into generic templates or uncontrolled block systems

The public-site system therefore needs to be planned as a real product capability, not as a series of ad hoc public routes.

---

## Deliverable shape

The intended output of this planning set is a public-site architecture where:

- every hub has structured site configuration
- public-site configuration remains a platform-managed capability rather than a hub-admin editing surface
- package tiers control what site capabilities can be enabled
- developers build public pages from production-grade section components
- template families provide bounded variation between clients
- dynamic sections consume normalized data adapters rather than raw database records
- hub admins continue to manage the structured operational content that feeds dynamic public sections, such as events, courses, testimonials, and articles
- public navigation and CTAs adapt correctly when a visitor is anonymous, signed in as a member, or signed in as an admin
- the same site remains the front door for member sign-in, member account access, bookings, and admin entry

---

## Non-goals

This planning set does not authorize:

- arbitrary drag-and-drop client page building
- tenant-authored arbitrary route creation
- generic WYSIWYG composition of page trees
- page-by-page CMS-style publishing workflows
- duplicating the public site as a separate disconnected app

Those are explicitly outside the intended product model.
