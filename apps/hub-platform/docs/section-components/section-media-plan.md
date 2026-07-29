# SectionMedia Plan

Status:
- Proposed
- Production-grade planning document for the shared public section media primitive

Purpose:
- Define how public sections render supporting media consistently
- Prevent each section from inventing its own image/frame behavior
- Create a token-aligned media contract for the first public sections, starting with `HeroSection`

---

## 1) Role of SectionMedia

`SectionMedia` is the shared primitive for rendering supporting section media.

It should handle:
- image presentation
- media presentation treatment
- aspect-ratio behavior
- alt/decorative rules
- optional caption support if later required

It should not handle:
- media selection logic
- upload logic
- backend/media-library queries
- section-level layout decisions

It is a public presentation primitive, not a content-management primitive.

---

## 2) Why it should exist

Without `SectionMedia`, each section will improvise:
- image container styles
- radius and framing treatment
- aspect ratio behavior
- decorative vs informative media semantics

That would fragment the public-site visual language quickly.

`SectionMedia` gives the section system a consistent media presentation contract.

---

## 3) Proposed folder and naming

Recommended location:

- `src/components/sections/primitives/section-media/SectionMedia.jsx`
- `src/components/sections/primitives/section-media/SectionMedia.module.css`

---

## 4) Initial scope

The first implementation should support:
- images
- background-capable video usage for sections that require it, starting with `HeroSection`

That means:
- support images cleanly
- support video in the bounded contexts where the section contract requires it
- defer broader rich-media behavior until a real section requires it

This is important for keeping the first production implementation strong and narrow without contradicting the agreed `HeroSection` requirements.

---

## 5) Proposed API shape

### 5.1 Core props

- `media`
  - normalized media object

- `alt`
  - optional explicit alt override if not already on the object

### 5.2 Presentation props

- `ratio`
  - initial values:
    - `"16:9"`
    - `"4:3"`
    - `"1:1"`
    - `"3:4"`
    - `"auto"`

- `radius`
  - initial values:
    - `"none"`
    - `"lg"`
    - `"xl"`

- `chrome`
  - initial values:
    - `"none"`
    - `"subtle"`
    - `"default"`

- `elevation`
  - initial values:
    - `"none"`
    - `"sm"`
    - `"md"`
    - `"lg"`

- `priority`
  - boolean for above-the-fold images where justified

### 5.3 Accessibility props

- `decorative`
  - boolean

### 5.4 Utility props

- `className`

---

## 6) Image contract

The component should expect a normalized media object, not raw storage or database shapes.

Recommended image shape:
- `type: "image"`
- `src`
- `alt`
- `width`
- `height`

Recommended video shape:
- `type: "video"`
- `src`
- `poster`
- `autoplay`
- `muted`
- `loop`
- `playsInline`

Optional later additions:
- `blurDataUrl`
- `caption`

This normalized contract should come from route or data-adapter layers, not from the primitive itself.

Recommendation:
- images should render through the existing `next/image` usage already established in the app
- video should be handled through a bounded native video contract where required

---

## 7) Accessibility expectations

If `decorative` is `true`:
- media should be hidden from assistive technology appropriately

If media is meaningful:
- alt text should be required or strongly expected

This contract is especially important because hero imagery often blurs the line between decorative and content-bearing media.

---

## 8) Styling contract

`SectionMedia` should own:
- border radius treatment
- overflow behavior
- image fit behavior
- optional chrome treatment
- optional elevation treatment

It should not own:
- macro layout positioning relative to copy
- section-level spacing
- outer shell surfaces

Those belong to consuming sections, `SectionShell`, and `SectionContainer`.

Clarification:

- `radius` controls corner treatment
- `chrome` controls border/background framing
- `elevation` controls shadow depth

These concerns should remain separate.

This is an explicit lesson from the first implementation pass.
Bundling radius, background, and shadow into one `frame` prop makes the API too blunt and prevents valid combinations such as radius without shadow.

---

## 9) Responsive behavior

`SectionMedia` must:
- scale predictably across breakpoints
- preserve intended aspect ratio behavior
- avoid layout collapse or overflow
- avoid image distortion

Recommendation:
- keep media container behavior explicit
- do not rely on implicit image sizing in consuming sections
- avoid height-led layout pressure from consuming sections

---

## 10) Token and theme alignment

`SectionMedia` should consume:
- semantic radius tokens
- semantic border/frame tokens
- semantic surface support tokens if needed

It should not:
- hardcode colors
- create client-specific visual effects
- embed template-specific styling directly into props

Template expression should come from CSS decisions layered through the design system, not by prop explosion.

---

## 11) What stays out of SectionMedia

Do not include initially:
- gallery behavior
- carousels
- lightboxes
- captions from day one unless a real section requires them immediately

These are all valid future enhancements, but they should not dilute the first production implementation.

Clarification:
- bounded section video support is in scope
- broader video-player behavior is not

---

## 12) Relationship to HeroSection

`HeroSection` is the first primary consumer.

For `HeroSection`, `SectionMedia` should support:
- strong supporting imagery
- stable aspect-ratio handling
- meaningful or decorative alt behavior
- visually polished framing

Later sections may also use it, but the first implementation should still stay general enough for:
- CTA sections
- feature sections
- content page highlights

---

## 13) Open decisions to review

### 13.1 Ratio scale

Recommendation:
- use explicit aspect-ratio values rather than vague labels
- start with:
  - `"16:9"`
  - `"4:3"`
  - `"1:1"`
  - `"3:4"`
  - `"auto"`

### 13.2 Styling split

Recommendation:
- split media treatment into:
  - `radius`
  - `chrome`
  - `elevation`

Locked direction:
- do not collapse these concerns back into one `frame` prop

### 13.3 Next/Image coupling

Locked decision:
- use the existing `next/image` component already established in the app
- keep the primitive aligned with the app’s image performance strategy

### 13.4 Caption support

Locked decision:
- defer until a real section requires it
