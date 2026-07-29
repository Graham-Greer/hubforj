# Greenfield Shell and Navigation Specification v2

Status:
- Proposed
- Canonical shell and navigation specification for the greenfield rebuild

Purpose:
- Define how shells, sidebars, top bars, breadcrumbs, and workspace navigation behave across the product.
- Prevent navigation drift, shell confusion, and cognitive overload in the new implementation.

Authority:
- Derived from:
  - `docs/roadmap/greenfield-product-scope-v2.md`
  - `docs/roadmap/greenfield-route-map-v2.md`
  - `docs/roadmap/greenfield-architecture-decision-record-v2.md`
  - `docs/standards/engineering-source-of-truth.md`
  - `docs/standards/nextjs-runtime-performance.md`

Hard rule:
- Shell and navigation decisions in the new app must follow this document unless it is updated first.

---

## 1) Shell Philosophy

The shell system must be:
- stable
- calm
- explicit
- role-aware
- low-friction

The shell system must not:
- compete with the content it frames
- duplicate navigation layers unnecessarily
- force users to decode where they are
- overload top-level navigation with workflow actions

The shell should orient the user quickly, then get out of the way.

---

## 2) High-Level Shell Model

There are four product surfaces, but three shell families:

1. **Platform shell**
   - for `/platform/*`
   - used by superadmins only

2. **Hub admin shell**
   - for `/{hubSlug}/admin/*`
   - used by hub admins and superadmins in support mode

3. **Public/member shell family**
   - public shell
   - member shell
   - shared branded foundation, but different navigation emphasis

Each shell family must be visually and behaviorally distinct.

---

## 3) Platform Shell

### 3.1 Purpose

The platform shell supports superadmin tasks such as:
- viewing hubs
- creating hubs
- inviting hub admins
- entering support mode
- operating platform-level workflows

### 3.2 Required structure

The platform shell must provide:
- a primary left sidebar
- a compact top bar for account-level utilities
- page header region
- content frame
- optional in-frame workspace subnavigation

### 3.3 Left sidebar rules

The left sidebar is the primary navigation surface.

It should contain:
- primary platform destinations
- hub context switcher where relevant
- collapse/expand control

It should not contain:
- dense page-local actions
- duplicate toolbar actions
- unrelated account utility clutter

### 3.4 Top bar rules

The platform top bar should be minimal.

It should contain:
- current user/account identity
- account/profile menu
- sign-out
- theme toggle if included

It should not contain:
- primary workflow navigation
- hub workspace tabs
- noisy utility overload

### 3.5 Workspace subnavigation

When a route sits inside a specific hub workflow, hub-scoped navigation should appear inside the content frame, below page header/breadcrumbs.

This keeps:
- one permanent global nav
- one contextual in-frame nav

and avoids dual competing sidebars.

---

## 4) Hub Admin Shell

### 4.1 Purpose

The hub admin shell is the operational workspace for running a hub.

It should optimize for:
- clarity
- focus
- speed of completion
- low cognitive overhead

### 4.2 Required structure

The hub admin shell must provide:
- one primary left sidebar
- one restrained top bar for account/context utilities
- page header region
- content region
- optional in-frame page/workspace navigation where necessary

### 4.3 Navigation grouping

The hub admin sidebar should group items by real jobs-to-be-done.

Recommended groups:
- Overview
- People
  - Admins
  - Members
- Programmes
  - Events
  - Courses
- Content
  - Testimonials
- Finance
  - Payments
- Settings

Exact labels may evolve, but the grouping principle should remain:
- stable
- shallow
- obvious

### 4.4 Cognitive-load rules

The hub admin shell must:
- keep top-level choices limited
- avoid exposing everything at once
- use clear active state and section grouping
- make the current location obvious

It must avoid:
- stacked permanent nav layers
- overuse of drawers/panels for routine navigation
- hidden critical workflow destinations

### 4.5 Support mode

When a superadmin is operating inside hub admin via support mode:
- the shell must show a persistent support-mode banner
- the banner must be clear but not visually overwhelming
- exit flow must be deterministic and visible

---

## 5) Public Shell

### 5.1 Purpose

The public shell frames branded marketing and information surfaces.

It should emphasize:
- trust
- clarity
- polish
- strong first impression

### 5.2 Required structure

The public shell should provide:
- branded header/nav
- page content region
- footer

### 5.3 Navigation behavior

Public navigation should be:
- simple
- branded
- easy to scan
- light on choices

It should typically include:
- home
- about
- events
- courses
- testimonials
- contact
- join/sign-in CTA

It should not feel like an app dashboard.

---

## 6) Member Shell

### 6.1 Purpose

The member shell supports authenticated self-service.

It should feel:
- simpler than admin
- more utility-focused than public
- calm and personal

### 6.2 Required structure

The member shell should provide:
- lightweight header/nav
- account-oriented content region
- clear member account navigation

### 6.3 Navigation behavior

Member navigation should emphasize:
- account overview
- membership
- registrations
- courses
- payments
- profile

It should remain narrow and focused.

---

## 7) Navigation Patterns

## 7.1 Primary navigation

Primary navigation:
- is persistent within a shell
- should be icon + label on larger screens
- may collapse to icon rail where justified
- must preserve strong active state

### 7.2 Breadcrumbs

Breadcrumbs should be used for:
- orientation in deeper admin routes
- reinforcing hierarchy

Breadcrumbs should not replace:
- primary navigation
- page title

### 7.3 Page headers

Page headers should provide:
- title
- concise supporting copy where helpful
- primary and secondary actions
- optional in-frame workspace navigation beneath

### 7.4 In-frame workspace navigation

Use in-frame subnavigation only when a route represents a broader workspace with meaningful subsections.

Examples:
- settings subsections
- detail workspace modes

Do not use in-frame navigation when a simple page header and content hierarchy is enough.

---

## 8) Responsive Behavior

### 8.1 Desktop

Desktop should favor:
- persistent sidebar
- stable content frame
- consistent page-header placement

### 8.2 Tablet

Tablet may:
- keep sidebar if space supports it
- collapse sidebar to narrower rail
- shift in-frame navigation to scrollable horizontal tabs when necessary

### 8.3 Mobile

Mobile should:
- move sidebar to drawer
- keep top bar compact
- preserve orientation and primary actions without crowding

Critical rule:
- mobile should simplify layout, not hide information architecture.

---

## 9) Interaction Rules

### 9.1 Active state

All nav items must support:
- active
- hover
- focus-visible
- disabled where relevant

The current location must be obvious without requiring interpretation.

### 9.2 One dominant action per screen

Each major screen should present one clearly dominant action.

Secondary actions should be visually restrained and grouped.

### 9.3 Empty states

Shell-framed empty states must:
- explain the missing content
- provide a clear next action
- maintain orientation

### 9.4 Error states

Error states must:
- keep shell context intact where possible
- explain what failed
- provide recovery paths

---

## 10) Performance and Architecture Rules

### 10.1 Persistent shells

Shells must remain mounted across internal navigation where App Router structure allows.

### 10.2 Thin route files

Route files must compose:
- server data
- shell
- leaf components

They must not own mixed UI/business/navigation logic.

### 10.3 Shell isolation

Shell state must not be coupled to:
- editor-local state
- page-local forms
- heavy operational detail state

### 10.4 Sidebar payload rules

The shell should only load lightweight orientation data.

Do not load:
- full CMS/page trees
- large record bodies
- heavy media collections
- unrelated workspace detail into the shell

---

## 11) Visual Direction

The shells should feel:
- modern
- restrained
- intentional
- premium without being decorative

Guidance:
- clear spacing rhythm
- strong typography hierarchy
- quiet surfaces
- subtle emphasis, not noise
- obvious navigation affordances

Avoid:
- cluttered chrome
- heavy gradients in admin shells
- too many simultaneous cards, badges, and buttons competing for attention

---

## 12) Recommended Navigation Inventory

## 12.1 Platform shell primary items

Recommended:
- Overview
- Hubs

Optional later only if approved by route map:
- platform-level reports
- internal tools

## 12.2 Hub admin shell primary items

Recommended:
- Overview
- Admins
- Members
- Events
- Courses
- Testimonials
- Payments
- Settings

## 12.3 Member shell primary items

Recommended:
- Account
- Membership
- Registrations
- Courses
- Payments
- Profile

## 12.4 Public shell primary items

Recommended:
- Home
- About
- Events
- Courses
- Testimonials
- Contact

---

## 13) Explicit Anti-Patterns

Do not introduce:
- two permanent sidebars in one shell
- workflow nav in the top bar when sidebar exists
- route-level one-off nav systems that bypass shared shell rules
- giant route components that own shell rendering and page logic together
- overloaded dashboards that try to expose every action at once

---

## 14) Implementation Follow-up

This specification should inform:

1. app bootstrap and route group structure
2. shell pattern component design
3. navigation primitive design
4. page header and breadcrumb pattern design
5. responsive shell behavior
