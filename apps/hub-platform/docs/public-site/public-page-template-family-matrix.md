# Public Page Template Family Matrix

Status:
- Proposed
- Planning document for template-family strategy and approved page-template combinations

Purpose:
- Define how the product should support meaningful client variation without creating site forks or CMS-style entropy
- Separate theme concerns from template-family concerns
- Establish approved page-template families and page-template combinations

---

## 1) Why template families exist

Different hubs will need different public-site emphasis.

Examples:
- some hubs need a highly event-led home page
- some need a more editorial or story-led about/home structure
- some need a stronger educational emphasis around courses
- some may need a simple brochure-style presence with operational discovery secondary

If every variation is solved with one-off route code, the system will drift.
If every variation is solved with a CMS block-builder, the product will over-expand.

Template families are the bounded middle ground.

They provide:
- compositional direction
- default page-template choices
- approved section-variant defaults
- predictable client variation

---

## 2) Template family versus theme

This distinction must remain explicit.

Theme controls:
- color expression
- light/dark mode behavior
- branding tokens
- typography mapping where approved

Template family controls:
- compositional style
- section ordering defaults
- density and page rhythm
- emphasis on events, courses, editorial content, or community trust signals

Changing template family should not require changing the token system.
Changing theme should not redefine page architecture.

---

## 3) Recommended initial template families

### 3.1 `community-standard`

Intent:
- balanced public site for most hubs

Characteristics:
- strong hero
- concise trust and context sections
- featured events and/or courses
- testimonials as supporting proof
- clear member entry points

Best fit:
- general community hubs
- mixed event/course use
- clients that want a calm modern default

### 3.2 `events-led`

Intent:
- prioritize event discovery and participation

Characteristics:
- event-heavy homepage
- stronger featured/upcoming event placement
- registration and schedule visibility prioritized
- testimonials secondary

Best fit:
- event-driven organizations
- hubs where public conversion is event-first

### 3.3 `education-focused`

Intent:
- prioritize course/program discovery

Characteristics:
- course-led hero and body composition
- stronger curriculum/program explanation
- educational credibility and outcomes emphasized

Best fit:
- learning-heavy hubs
- teaching/training communities

### 3.4 `content-led`

Intent:
- stronger editorial or story-led public site

Characteristics:
- richer intro/content page behavior
- stronger about/program storytelling
- events/courses still supported, but not always the dominant first impression

Best fit:
- hubs that need more narrative or institutional context

---

## 4) Recommended page-template types

Each route type should select from approved template types.

Recommended initial page-template types:
- `home-standard`
- `home-editorial`
- `about-standard`
- `listing-standard`
- `detail-standard`
- `content-standard`
- `landing-standard`
- `legal-standard`

These page-template types should remain product-owned.

---

## 5) Page-template matrix

The matrix below describes the intended initial relationships.

### 5.1 Home page

Allowed page-template types:
- `home-standard`
- `home-editorial`

Likely family defaults:
- `community-standard` -> `home-standard`
- `events-led` -> `home-standard` with stronger event section defaults
- `education-focused` -> `home-standard` with stronger course defaults
- `content-led` -> `home-editorial`

### 5.2 About page

Allowed page-template types:
- `about-standard`
- `content-standard`

Likely family defaults:
- `community-standard` -> `about-standard`
- `content-led` -> `content-standard`

### 5.3 Events list

Allowed page-template types:
- `listing-standard`

Family variation should come mostly from section variants and token/theme expression, not from route proliferation.

### 5.4 Event detail

Allowed page-template types:
- `detail-standard`

Event detail should remain structurally consistent across hubs because operational clarity matters.

### 5.5 Courses list

Allowed page-template types:
- `listing-standard`

### 5.6 Course detail

Allowed page-template types:
- `detail-standard`

### 5.7 Contact page

Allowed page-template types:
- `content-standard`
- `landing-standard`

### 5.8 Articles list

Allowed page-template types:
- `listing-standard`

### 5.9 Article detail

Allowed page-template types:
- `detail-standard`

### 5.10 Pricing

Pricing should be treated as a section capability, not a standalone page-template type in the baseline model.

### 5.11 Custom content pages

Allowed page-template types:
- `content-standard`
- `landing-standard`

Custom pages should not select from every route-specific template type.

### 5.12 Legal pages

Allowed page-template types:
- `legal-standard`

---

## 6) Family-specific section emphasis

Each template family should define default emphasis rather than arbitrary different components.

Examples:

`community-standard`
- hero
- key intro
- featured events
- featured courses
- testimonials
- FAQ if needed
- CTA

`events-led`
- hero
- event-intro
- featured events
- schedule/discovery emphasis
- CTA

`education-focused`
- hero
- course/program overview
- featured courses
- trust/testimonial support
- CTA

`content-led`
- editorial hero
- story/mission content
- proof/testimonials
- featured offers/events/courses later in the page

This creates meaningful variation while still using the same underlying section system.

---

## 7) Variant strategy inside template families

Template families should influence:
- default section ordering
- preferred section variants
- type and spacing expression where approved
- hero treatment

Template families should not create:
- separate duplicate components for the same content role
- template-specific design systems
- incompatible interaction patterns

The section system should stay shared.

---

## 8) Package interaction with template families

Packages may govern:
- which template families are available
- which page-template types can be selected
- whether custom pages are available
- whether premium section variants are available where justified

Packages should not create:
- separate routing models
- different auth behavior
- different data-adapter architectures

---

## 9) Implementation sequence

### Step 1

Approve:
- initial template-family list
- page-template type list
- matrix compatibility rules

### Step 2

Define:
- family defaults
- section-variant defaults
- page-template registry

### Step 3

Implement:
- one baseline family first, likely `community-standard`
- then additional family defaults without changing route authority

### Step 4

Validate:
- package restrictions
- config compatibility
- dynamic section behavior across families

---

## 10) Acceptance criteria

The template-family system is ready when:
- client variation can be expressed cleanly without one-off route forks
- theme and template remain separate concerns
- page-template choices remain bounded and validated
- public sites can vary in tone and emphasis without losing product consistency
- the system remains maintainable by one product engineering team
