# SectionActions Plan

Status:
- Proposed
- Production-grade planning document for the shared public section action primitive

Purpose:
- Define the CTA/action contract for public sections
- Keep button/link treatment consistent across sections
- Enforce bounded action density and hierarchy

---

## 1) Role of SectionActions

`SectionActions` is the shared primitive for rendering a small set of public section CTAs.

It should handle:
- one or two actions
- action spacing
- action hierarchy
- alignment behavior
- responsive stacking/wrapping

It should not handle:
- business logic for which actions to show
- section-level spacing
- navigation resolution

That means action resolution happens outside this component.
`SectionActions` is only responsible for presentation and structure.

---

## 2) Why it should exist

Without `SectionActions`, every section will choose its own:
- button grouping
- spacing
- primary/secondary pairing
- mobile behavior

That would create a fragmented public-site CTA language.

`SectionActions` keeps action behavior visibly consistent across:
- hero sections
- CTA sections
- intro sections
- dynamic list/detail sections where top-level actions are appropriate

---

## 3) Proposed folder and naming

Recommended location:

- `src/components/sections/primitives/section-actions/SectionActions.jsx`
- `src/components/sections/primitives/section-actions/SectionActions.module.css`

---

## 4) Proposed API shape

### 4.1 Core props

- `actions`
  - array of resolved action objects

### 4.2 Layout props

- `align`
  - initial values:
    - `"start"`
    - `"center"`
    - `"end"`

- `size`
  - initial values:
    - `"md"`
    - `"lg"`

### 4.3 Utility props

- `className`

---

## 5) Action object contract

The action data should be resolved before reaching `SectionActions`.

Recommended action object shape:
- `label`
- `href` or `onClick` equivalent where justified
- `variant`
- `icon`
- `external`

Recommendation:
- prefer `href`-based actions for the public-site system
- avoid opening this primitive to too many behavioral branches initially

### 5.1 Supported action count

Locked recommendation:
- maximum two actions

The primitive should not normalize arbitrary action lists.

---

## 6) Hierarchy rules

When two actions are present:
- one should be primary
- one should be secondary/ghost

`SectionActions` should not be responsible for deciding which is primary.
That should come from the resolved action objects.

It should, however, render them in a consistent order and grouping.

---

## 7) Alignment contract

Initial alignment should stay simple:
- `start`
- `center`
- `end`

This should mirror `SectionHeader` so common section combinations feel coherent.

`end` is important for sections such as `CTASection` where actions may need to sit against the far edge of the content block.

---

## 8) Responsive behavior

`SectionActions` should support:
- horizontal grouping at comfortable widths
- clean wrapping or stacking on smaller screens

Recommendation:
- allow wrapping by default
- handle mobile stacking/wrapping through CSS and layout rules rather than a dedicated prop in the first implementation

The goal is to avoid crushed button rows on mobile.

---

## 9) Token and button-system alignment

`SectionActions` should use the existing reusable `Button` component.

It should not introduce:
- custom CTA button markup
- hero-only button styling
- one-off spacing tokens

It should rely on:
- button variants already in the design system
- button size contracts already in the design system
- token-based spacing
- semantic alignment behavior

---

## 10) Accessibility expectations

`SectionActions` should:
- preserve correct accessible labels from resolved actions
- avoid unlabeled icon-only actions in this context
- maintain usable focus order and spacing

Recommendation:
- this primitive should assume text-bearing actions, not icon-only controls

---

## 11) What stays out of SectionActions

Do not include initially:
- analytics concerns
- auth-resolution logic
- loading-state behavior
- overflow menus
- tertiary text-link sets

Those are separate concerns and should not dilute the base CTA primitive.

---

## 12) Relationship to HeroSection and future sections

`HeroSection` is the first key consumer.

Later sections that may also use `SectionActions`:
- `CTASection`
- `PageIntroSection`
- `ContactSection`
- selected dynamic detail/list sections

That means the primitive should stay generic and not be visually tied too closely to hero-specific layout assumptions.
