# Public Site Section System Plan

Status:
- Proposed
- Detailed planning document for the production-grade public section library

Purpose:
- Define the section system required to deliver polished client public sites from one shared codebase
- Define section taxonomy, section contracts, variant strategy, and dynamic content integration rules
- Align public sections with the token, template, and theme architecture already governing the app

---

## 1) Why the section system matters

The section library is the core implementation asset for the public-site strategy.

Without a strong section system, the app will drift into:
- ad hoc route-level page building
- weak client-site quality
- inconsistent page composition
- repeated redesign work for each new client

With a strong section system, the product can support:
- rapid public-site delivery
- high frontend quality
- bounded customization
- consistent theming
- strong performance and accessibility

The section system is therefore not a cosmetic library.
It is part of the product architecture.

---

## 2) Section-system principles

The section system must be:
- production-grade
- token-first
- theme-aware
- template-aware
- variant-bounded
- auth-aware where needed
- data-normalized
- accessible

The section system must not be:
- placeholder-heavy
- driven by route-specific CSS hacks
- tied directly to backend document shapes
- expanded into a CMS block-builder contract

---

## 3) Section taxonomy

The system should group sections into clear categories.

### 3.1 Foundational content sections

These support broad page composition:
- Hero section
- Split hero section
- Page intro section
- Rich text / narrative section
- Feature list section
- Stats section
- CTA section
- FAQ section
- Contact section
- Trust/logo strip section
- Quote highlight section

### 3.2 Dynamic promotional sections

These surface structured admin-managed content:
- Featured testimonials section
- Featured events section
- Event list section
- Featured courses section
- Course list section
- Announcement list section
- Featured announcements section

### 3.3 Dynamic detail-page sections

These support entity detail routes:
- Event detail header section
- Event detail content section
- Event detail meta section
- Course detail header section
- Course detail content section
- Course detail meta section
- Announcement detail header section
- Announcement detail content section

### 3.4 Utility and supporting sections

These help complete public pages:
- Breadcrumb / page-header section
- Signup/sign-in prompt section
- Empty-state support section
- Legal content section
- Divider / transition section where justified

---

## 4) Initial v1 section inventory

The initial production-grade inventory should include at least:

1. Hero section
2. Page intro section
3. Rich text section
4. Feature list section
5. CTA section
6. Featured testimonials section
7. Featured events section
8. Event list section
9. Event detail header section
10. Event detail content section
11. Featured courses section
12. Course list section
13. Course detail header section
14. Course detail content section
15. Announcement list section
16. Announcement detail header section
17. Announcement detail content section
18. Contact section
19. FAQ section
20. Pricing section
21. Content page section set

This is the minimum realistic inventory for servicing early client public sites with quality.

---

## 5) Section contract model

Every public section should have an explicit contract.

### 5.1 Core contract areas

Each section should define:
- purpose
- required props
- optional props
- allowed variants
- expected content density
- responsive behavior
- accessibility expectations
- token/theme expectations
- template-family interactions

### 5.2 Common section prop shape

The exact implementation may vary, but most sections should support inputs such as:
- eyebrow
- title
- body
- actions
- media
- variant
- background/surface intent derived from semantic tokens
- section-level identity if needed for anchor links

### 5.3 Dynamic section additions

Dynamic sections should also define:
- normalized data contract
- empty state
- loading/skeleton behavior if needed
- error/fallback behavior
- auth-aware CTA handling inputs

Sections should not resolve raw database documents or business logic internally.

---

## 6) Variant strategy

Variants are necessary, but they must be bounded and intentional.

### 6.1 Variant rules

Variants should:
- map to design intent
- stay limited in number
- share the same token and accessibility contract
- avoid creating parallel component families

Variants should not:
- become a catch-all for every one-off client request
- alter the component's core purpose beyond recognition

### 6.2 Example initial variant model

`HeroSection`
- `centered`
- `split`

`CTASection`
- `band`
- `card`
- `split`

`FeaturedTestimonialsSection`
- `grid`
- `highlight`
- `carousel` only if the interaction quality is strong enough

`EventListSection`
- `grid`
- `stack`
- `featured`

`CourseListSection`
- `grid`
- `stack`
- `featured`

Variants should be documented with when-to-use guidance.

### 6.3 Foundational architecture lessons already learned

The first implementation pass in the exploratory starter surfaced several architectural lessons that should now be treated as guidance for the production `hub-platform` section system.

Locked guidance:
- `SectionShell` should own vertical spacing and outer semantics only
- `SectionContainer` should own width constraint and horizontal gutters
- sections should own `SectionShell` and `SectionContainer` internally
- layout should be width-led rather than height-led
- max-width is preferred over min-width
- split layouts should be solved by section-level grid or flex rules, not shell-level min-width workarounds
- `SectionMedia` should separate `radius`, `chrome`, and `elevation` rather than bundling them into a single frame prop

These lessons should inform implementation in `hub-platform` rather than being rediscovered there.

---

## 7) Token, theme, and template alignment

The section system must align cleanly with the design-system layers.

### 7.1 Token role

Tokens define:
- spacing
- radius
- type scales
- semantic colors
- elevation
- layout constraints
- motion values where used

Public sections must consume semantic tokens rather than raw palette values.

### 7.2 Theme role

Theme defines:
- token expression
- color atmosphere
- typography expression where approved
- contrast and visual mode behavior

Sections must not hardcode hub branding logic.

### 7.3 Template role

Template defines:
- compositional defaults
- preferred variants
- visual tone at the page-composition level

Sections should be compatible with multiple templates without being rewritten.

---

## 8) Dynamic entity presentation contracts

Events and courses should not be presented differently on every public surface.

The system needs shared presentation contracts for:
- event cards
- course cards
- testimonial cards
- announcement cards

Each contract should define:
- metadata hierarchy
- image behavior
- status/badge rules
- CTA slot rules
- empty/fallback states
- accessible heading/link structure

This creates consistency across:
- featured sections
- list sections
- detail-related promotional modules

---

## 9) Auth-aware section behavior

Some sections are static and can ignore auth state.
Others must adapt explicitly.

### 9.1 Sections that should usually be auth-agnostic

Examples:
- rich text
- features
- FAQ
- logo strip
- generic CTA section unless specifically account-aware

### 9.2 Sections that must be auth-aware

Examples:
- event list
- event detail header/meta
- course list
- course detail header/meta
- account/join prompt sections
- public utility navigation/header sections

These sections must not implement role logic ad hoc.
They should consume shared auth-aware CTA and navigation contracts from the public-site system.

---

## 10) Data-adapter expectations

Sections should consume normalized props from route-level or page-level server adapters.

Examples:
- `featuredEvents`
- `featuredCourses`
- `featuredTestimonials`
- `eventDetailViewModel`
- `courseDetailViewModel`

Adapters should handle:
- backend mapping
- package compatibility
- feature availability
- auth-aware CTA inputs
- fallback decisions where approved

This keeps sections presentation-focused and testable.

---

## 11) Page composition rules

Sections must be composable, but composition still needs boundaries.

Rules:
- page templates own the allowed section sequence
- template families influence defaults, not arbitrary section sprawl
- hubs may select among approved options
- custom pages must be built from approved section sets

This is how the system delivers flexibility without becoming a block-builder.

---

## 12) Production-quality requirements

Every production-grade section should meet the following bar:

- visually complete, not placeholder
- mobile and desktop ready
- accessible
- token-only styling discipline
- predictable empty/fallback behavior
- no route-specific styling assumptions
- suitable for repeated client use without redesign

If a section does not meet this bar, it is not ready to become part of the shared public-site system.

---

## 13) Documentation requirements for each section

Each approved section should eventually have internal documentation for:
- purpose
- intended routes/pages
- allowed variants
- required and optional props
- dynamic data dependencies
- auth-aware behavior if any
- accessibility requirements
- when not to use the section

This documentation is important if multiple template families and package tiers rely on the same shared inventory.

---

## 14) Recommended implementation order

### Phase 1: Core static sections

Implement:
- Hero
- Page intro
- Rich text
- Feature list
- CTA

### Phase 2: Core dynamic promotional sections

Implement:
- Featured testimonials
- Featured events
- Event list
- Featured courses
- Course list
- Announcement list
- Featured announcements

### Phase 3: Detail-page dynamic sections

Implement:
- Event detail header/content/meta
- Course detail header/content/meta
- Announcement detail header/content

### Phase 4: Supporting and conversion sections

Implement:
- Contact
- FAQ
- Pricing
- join/sign-in prompt support sections

### Phase 5: Bounded custom-page coverage

Implement:
- content page section sets
- landing page section sets
- legal page section sets

### Phase 6: Future editorial sections

Implement only when approved:
- news list/article sections
- blog/post list/article sections

---

## 15) Acceptance criteria

The section system is ready to support implementation when:
- the initial v1 inventory is approved
- each section has a clear contract and bounded variants
- token/theme/template alignment is explicit
- auth-aware dynamic sections have a shared behavior model
- page templates can be composed from the approved section inventory
- the system is strong enough to support multiple client public sites without route-level reinvention
