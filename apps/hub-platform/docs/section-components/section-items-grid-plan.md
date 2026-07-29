# SectionItemsGrid Plan

Status:
- Proposed
- Production-grade planning document for the shared responsive grid primitive used by section-level item collections

Purpose:
- Define the production contract for `SectionItemsGrid`
- Establish a reusable layout primitive for responsive section grids with bounded item counts
- Prevent repeated ad hoc card-grid implementations across public sections

---

## 1) Why SectionItemsGrid matters

The public section system is now clearly moving toward repeated grid-based layouts.

Current and near-future use cases include:

- `GridSection`
- event preview/listing sections
- course preview/listing sections
- announcement preview/listing sections

Without a reusable grid primitive, we risk:

- repeated responsive grid logic in each section
- inconsistent gap usage
- inconsistent column behavior across templates
- awkward handling of small or uneven item counts

So `SectionItemsGrid` exists to protect layout consistency at the same level that `SectionCard` protects card shell consistency.

---

## 2) Primitive role

`SectionItemsGrid` is a thin layout primitive.

Its job is to provide:

- responsive item grid behavior
- token-driven gap
- natural handling of varying card counts

It is not:

- a section in its own right
- a card primitive
- a content renderer
- a filtering/sorting system
- a pagination system

It should own layout only.

---

## 3) Expected consumers

First expected consumer:

- `GridSection`

Likely later consumers:

- event preview sections
- course preview sections
- announcement preview sections

This is why introducing it now is justified rather than premature.

---

## 4) Core responsibilities

`SectionItemsGrid` should own:

- responsive grid columns
- grid gap
- item wrapping behavior
- natural support for 1..N bounded item counts

It should not own:

- card appearance
- internal item spacing
- section header spacing
- item ordering logic
- item count limits

Those belong to:

- `SectionCard`
- consuming sections
- data/domain layers

---

## 5) Proposed API shape

### 5.1 Core props

- `children`
- `className`

### 5.2 Optional bounded props

- `maxColumns`
  - likely bounded to:
    - `2`
    - `3`
- `dense`
  - only if a real use case appears later

Recommendation:

Keep v1 very small.
It may not need any props beyond `children` and `className` if the first implementation can use one stable public grid contract.

---

## 6) Layout direction

### 6.1 Responsive behavior

The primitive should use CSS grid.

Expected desktop behavior:

- natural multi-column layout
- cards do not stretch into awkward full-width blocks when more than one item is present

Expected mobile behavior:

- clean single-column stack

### 6.2 Variable counts

The grid must handle varying item counts gracefully.

Important supported scenarios:

- 1 item
- 2 items
- 3 items
- 4 items
- 5 items
- 6 items

This matters because many SaaS-admin-managed sections will not always have full, even counts.

### 6.3 Layout technique

Recommended direction:

- use `repeat(...)`
- use `minmax(...)`
- keep gap token-driven

The layout should avoid brittle assumptions such as:

- always 3 columns
- hardcoded widths tied to one section only

---

## 7) Spacing ownership

This primitive should own:

- the gap between items

But the actual gap values must come from semantic/template tokens rather than local guesses.

This is important because template changes should ripple through all grid-based sections consistently.

The principle is:

- component owns where spacing is applied
- tokens/templates own what the spacing values are

That matches the broader public-section system direction already established.

---

## 8) Token expectations

`SectionItemsGrid` should consume semantic layout tokens such as:

- public section grid gap
- related section cluster/stack gap tokens if needed

It should not invent local gap values.

If a dedicated grid token proves necessary later, it should be added to the semantic layer rather than hardcoded in the primitive.

---

## 9) Relationship to SectionCard

`SectionItemsGrid` and `SectionCard` solve different problems.

`SectionItemsGrid` owns:

- outer grid layout for the collection

`SectionCard` owns:

- outer shell for each card item

This separation is important.

Without it:

- sections will either overuse cards to solve layout
- or bury shared layout rules inside section-specific CSS

---

## 10) Relationship to GridSection

`GridSection` should consume `SectionItemsGrid`.

This creates a clean architecture:

- `GridSection`
  - section-level composition
- `SectionItemsGrid`
  - collection layout
- `SectionCard`
  - per-item shell

This is the intended layered model.

---

## 11) Accessibility expectations

`SectionItemsGrid` should preserve normal document flow and not impose unusual semantics.

It should not:

- add unnecessary ARIA roles
- pretend to be a list unless the consuming section needs actual list semantics

The consuming section should decide whether items are rendered as:

- plain grid children
- list items inside a semantic list

The primitive should remain layout-focused.

---

## 12) Risks to avoid

### Risk 1: Over-configuring it too early

If the primitive gains too many layout props too soon, it becomes harder to keep sections consistent.

### Risk 2: Solving only the current section

If it is designed too tightly around `GridSection`, it may not transfer well to future listing sections.

### Risk 3: Letting sections bypass it

If each section still builds its own local grid, the primitive stops providing any real value.

---

## 13) Locked decisions

- `SectionItemsGrid` should be introduced as a reusable layout primitive
- it should own responsive collection layout only
- it should not own item shell styling or content anatomy
- it should support varying bounded item counts gracefully
- it should consume semantic/template spacing tokens
- `GridSection` should be its first consumer
- later listing-style public sections are expected to reuse it

