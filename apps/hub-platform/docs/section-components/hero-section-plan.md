# HeroSection Plan

Status:
- Proposed
- Production-grade planning document for the first real public section component

Purpose:
- Define the production contract for `HeroSection`
- Establish the first real consumer of `SectionShell`
- Establish the first real consumer of `SectionContainer`
- Drive the first reusable section primitives from a concrete section need rather than abstract guessing

---

## 1) Why HeroSection comes first

`HeroSection` is the highest-leverage first section because it forces decisions about:
- content hierarchy
- CTA handling
- media framing
- responsive layout
- theme and template expression
- signed-in vs anonymous public entry behavior

It is also likely to appear on nearly every client site in some form.

If `HeroSection` is well designed, it becomes the first proof that the section system is production-grade rather than a collection of ad hoc page blocks.

---

## 2) Role of HeroSection

`HeroSection` is the primary page-opening section for high-value public routes.

It should be suitable for:
- home pages
- about pages
- event/programme landing pages
- announcement or campaign landing pages where justified
- campaign pages in future

It should not be overloaded into:
- a generic content section
- a CTA band
- a list section
- a detail-page metadata block

`HeroSection` is responsible for high-level first-impression framing, not for all possible above-the-fold content patterns.

---

## 3) Composition model

`HeroSection` should own `SectionShell` internally.
`HeroSection` should also own `SectionContainer` internally.

Expected internal structure:

```jsx
<SectionShell ...>
  <SectionContainer ...>
    <div className={styles.layout}>
      <SectionHeader ... />
      <SectionMedia ... />
    </div>
  </SectionContainer>
</SectionShell>
```

`HeroSection` should not be wrapped externally in `SectionShell` by routes.

Pages should consume it like:

```jsx
<HeroSection
  variant="split"
  eyebrow="Welcome"
  title="A community rooted in belonging"
  description="..."
  actions={[...]}
  media={...}
/>
```

---

## 4) Production-grade requirements

`HeroSection` must be:
- token-based
- theme-aware
- template-aware
- responsive
- accessible
- visually strong without relying on ad hoc route styling
- bounded in its variants

It must not:
- depend on page-specific CSS
- carry raw database logic
- use improvised layout rules outside the section system
- expose an unbounded prop surface to solve every client request

---

## 5) Proposed API shape

### 5.1 Core content props

- `eyebrow`
- `title`
- `description`
- `actions`
- `media`

### 5.2 Variant props

- `variant`
  - locked initial values:
    - `"centered"`
    - `"split"`

- `height`
  - locked initial values:
    - `"content"`
    - `"screen"`

- `align`
  - optional content alignment override where appropriate
  - likely values:
    - `"start"`
    - `"center"`

### 5.3 Shell-level props

These should remain tightly bounded and mostly internal defaults:
- `surface`
- `spacing`

Recommendation:
- expose only if there is a strong real need
- otherwise keep shell decisions internal to the hero variant contract

### 5.4 Utility props

- `id`
- `className`

Avoid expanding beyond this until real usage proves it necessary.

---

## 6) Content rules

### 6.1 Eyebrow

- optional
- short, high-signal label
- should not wrap into long narrative copy

### 6.2 Title

- required
- primary message
- should remain concise enough to preserve visual impact

### 6.3 Description

- optional but expected in most uses
- one to three short paragraphs at most
- should support rich text only if there is a proven need later

Recommendation:
- start with plain text or tightly bounded formatted content

### 6.4 Actions

- optional
- maximum two CTAs
- should be rendered through `SectionActions`
- actions should not become an arbitrary button list

### 6.5 Media

- optional by contract, but required or strongly expected for `split`
- should be rendered through `SectionMedia`
- should support image and bounded video behavior as already locked for hero usage

---

## 7) Locked initial variants

### 7.1 `centered`

Use when:
- the message is primary
- the page opens with a strong statement
- supporting media should sit behind the content rather than beside it

Behavior:
- centered text block
- optional actions beneath copy
- when media is present, it should be treated as background media
- background media may be:
  - image
  - video
- background media must not weaken copy legibility or CTA clarity

### 7.2 `split`

Use when:
- copy and media both matter
- the page needs stronger storytelling or visual context
- the hero should feel more editorial or campaign-like

Behavior:
- text and media in a split layout
- stacked on smaller viewports
- media treated as a first-class supporting asset
- media is required for this variant

Implementation note:
- split layout should be solved by section-level grid or flex rules
- avoid min-width-led layout hacks
- width should dictate layout behavior, with height following from content and media ratio

---

## 8) Variant boundaries

The initial hero contract should stop at:
- `centered`
- `split`

Do not start with:
- `carousel`
- `full-bleed cinematic`
- `statement`
- `media-right` as a separate variant

Those may become valid later, but they should not be introduced before the first two are proven.

If directional media placement becomes necessary, it should likely be an internal layout option on `split`, not a separate visual family from day one.

Video is in scope for `centered` background-media treatment, but not as a separate hero variant.

---

## 9) Relationship to primitives

`HeroSection` should depend on:
- `SectionShell`
- `SectionHeader`
- `SectionActions`
- `SectionMedia`

Responsibilities:
- `HeroSection`
  - chooses layout
  - decides which primitives appear
  - maps variant to shell/layout decisions

- `SectionHeader`
  - renders eyebrow, title, description

- `SectionActions`
  - renders up to two CTAs consistently

- `SectionMedia`
  - renders supporting hero media consistently

---

## 10) Theme and template alignment

`HeroSection` should express template and theme direction, but it should do so through the token system.

It should not:
- hardcode client-specific colors
- create its own parallel typography system
- bypass semantic surface and text tokens

It should be able to feel different under different templates, but that should happen through:
- token inheritance
- template-aware CSS decisions
- bounded variant logic

Not through one-off props such as:
- `headingFont`
- `backgroundColor`
- `accentHex`

---

## 11) Responsive behavior

`HeroSection` must have a strong mobile and desktop contract from the beginning.

### 11.1 `centered`

- preserve readability at narrow widths
- keep line lengths sensible
- avoid oversized title collapse
- maintain CTA clarity without crowding

### 11.2 `split`

- collapse cleanly to a vertical stack
- preserve hierarchy between copy and media
- avoid cramped side-by-side layouts at intermediate widths

Recommendation:
- mobile-first vertical stack
- split layout only once there is enough width for both halves to breathe

### 11.3 Height behavior

Locked decision:
- `height` is available on both `centered` and `split`
- `content` means natural content height
- `screen` means viewport-height presentation using a minimum height rather than a fixed height

Recommendation:
- `screen` should map to:
  - `min-height: calc(100svh - var(--public-header-height))`

This keeps the hero aligned with the public shell/header system and avoids content being obscured by the site header.

---

## 12) Accessibility expectations

`HeroSection` should:
- maintain correct heading hierarchy from the route context
- ensure CTA labels are explicit
- ensure media alt behavior is valid
- avoid decorative media being treated as meaningful content

If media is meaningful:
- require or strongly expect alt text

If media is decorative:
- allow it to be hidden from assistive technology through the `SectionMedia` contract

---

## 13) Auth-aware behavior

`HeroSection` itself should not directly implement business logic.

However, it should be able to receive CTA content that differs based on:
- anonymous visitor
- signed-in member
- signed-in admin

That means:
- auth-aware CTA resolution belongs outside `HeroSection`
- `HeroSection` must still support those resolved CTA outcomes cleanly

Example:
- anonymous: `Join community`
- member: `View your account`
- admin: `Open admin`

---

## 14) What stays out of HeroSection for now

Do not include initially:
- complex rich-text body rendering
- inline search/forms
- sliders or rotating hero content
- dynamic data fetching inside the component

Those are separate concerns and should not dilute the first production implementation.

Clarification:
- background media is in scope for `centered`
- that background media may be image or video
- what stays out is broader video-first hero behavior as a separate hero family with its own interaction model

---

## 15) Open decisions to review

### 15.1 Action limit

Locked decision:
- hard limit of two actions

### 15.2 Media optionality on `split`

Locked decision:
- `split` requires media

### 15.3 Copy width

Recommendation:
- constrain text width within the header primitive
- do not let hero titles/descriptions span uncontrolled widths

### 15.4 Internal shell defaults

Recommendation:
- `centered`
  - likely `width="default"` or `narrow`
  - `spacing="spacious"`
  - `surface="transparent"`

- `split`
  - likely `width="wide"`
  - `spacing="spacious"`
  - `surface="transparent"`

These should remain implementation defaults unless a real use case proves otherwise.

### 15.5 Height contract

Locked decision:
- `height` supports:
  - `content`
  - `screen`

- `screen` is available on both:
  - `centered`
  - `split`

Implementation guidance:
- use `min-height`, not fixed `height`
- depend on `--public-header-height` from the public shell/header system

---

## 16) Recommended next implementation order

After this plan is approved:

1. implement `SectionHeader`
2. implement `SectionActions`
3. implement `SectionMedia`
4. implement `HeroSection`

That order keeps primitive contracts stable before the first real section is built.
