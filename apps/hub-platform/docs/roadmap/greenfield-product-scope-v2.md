# Greenfield Product Scope v2

Status:
- Proposed replacement direction for the current CMS-heavy implementation.
- Intended as the source document for a fresh build in a new subfolder/app.

Authority:
- Derived from:
  - `docs/product/project-overview.md`
  - `docs/product/roles-and-permissions.md`
  - `docs/product/auth-and-session.md`
  - `docs/product/events-and-registrations.md`
  - `docs/product/membership-flow.md`
  - `docs/product/state-machines.md`
- Overrides prior roadmap assumptions that a general-purpose page CMS is a core product requirement.

---

## 1) Product Decision

The product is an **operations platform for hub-based community groups with a branded public site**.

It is **not** a general-purpose website builder.

The greenfield rebuild MUST optimize for:
- hub admin workflows
- member lifecycle management
- event and course operations
- branded public-site delivery
- developer-controlled site composition
- durable architecture
- calm, modern, low-friction UX
- a high-quality developer system for building branded sites

The rebuild MUST NOT optimize for:
- arbitrary drag-and-drop page building
- general-purpose block CMS authoring
- end-user page-builder UX

The rebuild MUST be treated as a **production-grade v1 foundation**, not as a “minimal” or disposable first pass.

---

## 1.1 Product Quality Standard

The new product should be built with the mindset of senior engineers and product designers creating:
- a durable system
- a clean mental model
- a modern, user-friendly experience
- a strong developer platform for future site delivery

This means:
- simple for the user
- deliberate under the hood
- extensible without structural rework
- polished in details, not just functionally complete

The goal is not to over-engineer.

The goal is to avoid rebuilding core architecture later because it was scoped too narrowly at the start.

---

## 1.2 UX and Product Principles

### User principles

The new product should feel:
- calm
- modern
- clear
- focused
- trustworthy

The UI should favor:
- single-focus workflows
- strong visual hierarchy
- progressive disclosure
- minimal cognitive overload
- obvious next actions
- restrained use of dense controls and competing panels

### Admin UX principles

Admin surfaces must prioritize:
- task clarity over feature dumping
- stable navigation landmarks
- shallow information hierarchy
- explicit statuses and transitions
- low mental overhead during operational work

### Developer experience principles

The implementation system must provide developers with:
- high-quality reusable sections
- flexible layout primitives
- well-designed composition patterns
- strong defaults
- intentional extension points

It must not force future teams to work around weak components or under-designed sections.

---

## 2) Core Product Surfaces

### 2.1 Public site

Purpose:
- Present the hub publicly
- Allow browsing of events, courses, and key marketing content
- Support branded site delivery using shared templates and tokens

Includes:
- home page
- about/landing pages
- events list and event detail
- courses list and course detail
- testimonials display
- contact page
- registration/join entry points

Constraints:
- routes are developer-owned
- page composition is code-driven, not CMS-driven
- site theming comes from tokenized design configuration

### 2.2 Member experience

Purpose:
- Let members create accounts, manage their relationship with the hub, and interact with bookings/payments

Includes:
- sign-in / account creation
- membership state visibility
- registrations/bookings view
- payment status visibility
- member profile/account basics

### 2.3 Hub admin

Purpose:
- Let hub administrators run the organization

Includes:
- members
- admins/invites
- events
- courses
- testimonials
- payments
- attendance
- hub settings

### 2.4 Internal implementation system

Purpose:
- Allow the product team to deliver new hub sites quickly from one shared codebase

Includes:
- token-based theming
- reusable sections and layouts
- shared route patterns
- hub/site configuration

This is for the product team, not for client self-service page building.

---

## 3) Explicit Scope In

### 3.1 Operations domain

Greenfield scope includes:
- hub provisioning
- role-based access
- admin invite flow
- members CRUD/list/detail where required by product journeys
- membership lifecycle handling
- event CRUD and event operations
- course CRUD and course operations
- registrations/bookings
- offline/manual payment tracking where applicable
- attendance tracking
- testimonials CRUD and publish/archive state

### 3.2 Public content domain

Greenfield scope includes structured content/config for:
- site identity
- navigation
- footer
- homepage hero and key sections
- featured testimonials
- featured events/courses
- contact details
- social links
- legal/supporting site content

### 3.3 Design/theming domain

Greenfield scope includes:
- token-based theme system
- template-level variations
- hub-specific branding configuration
- reusable section/component library
- navigation systems that are clean, modern, and user-centric
- page-building flexibility for developers through shared sections and layout primitives

---

## 4) Explicit Scope Out

The greenfield rebuild MUST exclude the following from the initial product foundation:
- generic page-builder CMS
- arbitrary block reordering as a tenant-facing content authoring model
- draft/live publishing system for custom page composition
- expansive CMS-style media tooling unrelated to hub content and operational records
- support for tenant-authored arbitrary routes
- heavy inline preview infrastructure for site construction

These may be reconsidered later only if justified by real commercial demand.

---

## 5) Recommended Content Model

The new build SHOULD prefer **structured content modules** over a page builder.

Examples:
- `siteSettings`
  - name
  - logo
  - contact info
  - social links
  - theme settings
- `navigationConfig`
  - header items
  - footer items
  - CTA links
- `homePageConfig`
  - hero
  - feature highlights
  - featured testimonials
  - featured events/courses
- `testimonial`
  - quote
  - author
  - role
  - avatar
  - published state
- `event`
- `course`
- `membershipPlan`

This keeps the site dynamic without needing a generalized CMS.

### 5.1 Media as a hub workspace

The product SHOULD include a dedicated hub-scoped media workspace when that workspace remains:
- operationally focused
- reuse-oriented
- clearly bounded away from CMS/page-builder complexity

The media workspace should support:
- upload
- folder organization
- asset-type filtering
- asset detail editing
- usage references
- safe delete rules
- selection into structured admin forms

---

## 6) Multi-Tenant Delivery Strategy

The rebuild SHOULD assume:
- one shared product codebase
- one shared Firebase project
- strict hub-scoped multi-tenancy
- hub-specific configuration
- flexible frontend deployment topology

This means:
- all hubs live in one backend
- all hub data is explicitly isolated by `hubId`
- backend rules, indexes, and feature rollout happen once for the product

The product owner may still deploy public-facing sites in different ways if commercially preferred, but the software architecture should remain:
- standards-driven
- reusable
- composable
- not CMS-dependent

### 6.1 Deployment model

The system should support:
- one shared admin/platform deployment
- either shared or separate public-site deployments
- one shared backend underneath

This keeps backend/product evolution centralized while preserving deployment flexibility.

---

## 7) User Roles

Locked roles:
- `superadmin`
- `admin`
- `member`

### 7.1 Superadmin

Owns:
- provisioning hubs
- configuration
- support/access escalation where approved
- implementation-level controls

### 7.2 Admin

Owns:
- members
- events
- courses
- registrations
- payments
- attendance
- testimonials
- selected site settings

### 7.3 Member

Owns:
- own account
- own registrations/bookings
- own membership visibility

---

## 8) UX Strategy

### 8.1 Product focus

The new product UX should prioritize:
- clear operational workflows
- deterministic state transitions
- low cognitive load
- strong navigation and information architecture
- single-focus page layouts for admin tasks
- a modern but restrained visual language

### 8.2 What should feel polished

Priority UX investments should go to:
- admin shell/navigation
- data tables and detail views
- create/edit flows
- status visibility
- payments/attendance workflows
- events and courses workflows
- testimonials management
- public site quality
- component quality and section composition quality

### 8.3 Navigation standard

Navigation must be:
- modern
- clean
- user-centric
- easy to scan
- consistent across surfaces

Admin navigation should avoid:
- competing permanent nav systems
- overloaded top-level menus
- excessive context switching
- weak active-state communication

### 8.4 Component and section quality standard

Reusable components and sections must be designed with:
- strong defaults
- intentional flexibility
- layout awareness
- controlled variation
- visual consistency
- extensibility without prop sprawl

The system should allow developers to build pages with confidence, not discover later that the component library is too limited or under-designed.
- testimonial management
- public site quality

### 8.3 What should not dominate scope

Avoid spending core product time on:
- CMS builder ergonomics
- block editing complexity
- editor-side preview chrome

---

## 9) Success Criteria for v2

The greenfield rebuild is successful if:
- a new hub can be provisioned quickly
- branding/theme can be applied predictably
- admins can operate members, events, courses, testimonials, payments, and attendance without friction
- the public site can be assembled rapidly from shared sections and structured content
- the admin UX feels focused and easy to follow
- the reusable component/section system is strong enough to support future pages without redesigning the foundation
- the codebase remains aligned to standards without architectural drift

---

## 10) Decision Summary

### Locked decisions

- The generic CMS is removed from core product direction.
- The product is operations-first.
- Public-site composition is developer-controlled.
- Tenant-facing content editing is structured, not arbitrary block-based.
- Admin operational workflows are the primary investment area.

### Deferred decisions

- Whether each client gets a separate Firebase project or another tenancy strategy
- Whether a limited structured page-config editor is later useful
- Whether media management needs to exist as a first-class workspace beyond operational content
