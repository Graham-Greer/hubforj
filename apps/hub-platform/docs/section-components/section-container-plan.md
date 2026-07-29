# SectionContainer Plan

Status:
- Proposed
- Production-grade planning document for the public section width container

Purpose:
- Define the role of `SectionContainer` in the public section system
- Separate width and gutter control from `SectionShell`
- Establish the correct layout boundary for width-led section composition

---

## 1) Why SectionContainer exists

The first section-system pass showed that `SectionShell` becomes too heavy if it tries to own:

- vertical spacing
- horizontal gutters
- max-width containment
- inner content wrapping
- full-bleed exceptions

That creates awkward wrapper structure and makes full-bleed or split sections harder to reason about.

`SectionContainer` exists to solve that cleanly.

`SectionShell` should own vertical rhythm and outer semantics.
`SectionContainer` should own width and gutter containment.

---

## 2) Responsibilities

`SectionContainer` should own:

- width constraint
- horizontal gutters
- max-width containment
- full-width mode where appropriate

`SectionContainer` should not own:

- vertical section spacing
- semantic section element choice
- surface/background treatment
- section identity or anchor semantics

---

## 3) Composition model

Expected composition:

```jsx
<SectionShell spacing="default">
  <SectionContainer width="wide">
    ...
  </SectionContainer>
</SectionShell>
```

For full-bleed sections:

```jsx
<SectionShell spacing="none">
  <SectionContainer width="full">
    ...
  </SectionContainer>
</SectionShell>
```

Routes should not usually use `SectionContainer` directly.
Real sections should own it internally as part of their layout contract.

---

## 4) Proposed API shape

### 4.1 Core props

- `as`
- `className`
- `children`

### 4.2 Layout props

- `width`
  - locked initial values:
    - `"narrow"`
    - `"default"`
    - `"wide"`
    - `"full"`

Recommendation:
- width should be expressed through semantic container tokens
- prefer max-width over min-width

---

## 5) Layout rules

The public section system should be width-led.

That means:

- width is the primary layout dictator
- max-width is preferred over min-width
- height is usually an outcome, not an input
- split layouts should be solved with section-level grid or flex rules, not shell/container min-width hacks

This rule should guide all future section composition.

---

## 6) Token alignment

`SectionContainer` should consume:

- semantic gutter tokens
- semantic container-width tokens

It should not hardcode:

- arbitrary rem widths
- per-section gutter values

If new container tokens are needed, they should be added intentionally to the design system.

---

## 7) Relationship to SectionShell

The boundary should remain:

- `SectionShell` = vertical spacing and outer semantics
- `SectionContainer` = horizontal containment and width

This separation is now a locked architectural lesson from the first implementation pass.
