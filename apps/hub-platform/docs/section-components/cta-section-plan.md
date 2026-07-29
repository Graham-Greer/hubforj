# CTASection Plan

Status:
- Proposed
- Production-grade planning document for the shared public call-to-action section

Purpose:
- Define the production contract for `CTASection`
- Establish the shared conversion-focused section used across public pages
- Keep CTA presentation strong, reusable, and template-driven without drifting into page-builder behavior

---

## 1) Why CTASection matters

`CTASection` is one of the highest-leverage public sections because it helps turn page interest into action.

Used well, it helps communities:

- encourage visitors to join
- guide people toward events or courses
- invite people to get in touch
- reinforce the next meaningful step without overwhelming the page

Without a strong `CTASection`, the public site will drift into:

- inconsistent conversion messaging
- ad hoc full-width banners
- route-specific CTA styling
- weak page endings with no clear next step

So this is not a decorative extra.
It is part of the public-site conversion architecture.

---

## 2) Role of CTASection

`CTASection` is a focused conversion section for prompting a clear next action.

It should be suitable for:

- homepage conversion prompts
- about-page join prompts
- post-content call-to-action blocks
- event/course supporting conversion moments where appropriate
- page-ending “what next” guidance

It should not be overloaded into:

- a second hero
- a feature list
- a pricing section
- a testimonial section
- a catch-all message banner for unrelated content

Its job is to reinforce a clear next step, not carry the entire page narrative.

---

## 3) Composition model

`CTASection` should own `SectionShell` internally.
`CTASection` should also own `SectionContainer` internally.

Expected internal structure:

```jsx
<SectionShell ...>
  <SectionContainer ...>
    <div className={styles.layout}>
      <SectionHeader ... />
      <SectionActions ... />
    </div>
  </SectionContainer>
</SectionShell>
```

`CTASection` should not be wrapped externally in `SectionShell` by routes.

Pages should consume it like:

```jsx
<CTASection
  eyebrow="Join"
  title="Join our community today"
  description="Become part of our martial arts family and grow in confidence."
  actions={[...]}
/>
```

Routes and page templates should compose the section.
They should not construct its shell/container behavior manually.

---

## 4) Production-grade requirements

`CTASection` must be:

- token-based
- theme-aware
- template-aware
- responsive
- accessible
- visually strong without depending on route-specific styling
- bounded in its variants

It must not:

- depend on page-specific CSS
- carry raw backend logic
- expose an unbounded prop surface
- allow ad hoc variant selection that bypasses template control

---

## 5) Proposed API shape

### 5.1 Core content props

- `eyebrow`
- `title`
- `description`
- `actions`

### 5.2 Variant props

- `variant`
  - locked initial values:
    - `"band"`
    - `"split"`

Important:
- this is a design-system and template concern
- it should not be exposed as a hub-admin-controlled setting per section instance

### 5.3 Layout props

- `align`
  - optional, tightly bounded
  - likely values:
    - `"start"`
    - `"center"`
    - `"end"`

Recommendation:
- keep alignment decisions mostly internal to the chosen variant and template
- avoid exposing this unless a real implementation need appears

### 5.4 Utility props

- `id`
- `className`

Avoid expanding beyond this until real usage proves it necessary.

---

## 6) Content rules

### 6.1 Eyebrow

- optional
- short, high-signal label
- should not become another long message line

### 6.2 Title

- required
- primary CTA message
- should remain concise and high impact

### 6.3 Description

- optional but expected in most uses
- one short supporting paragraph in most cases
- should remain plain text or tightly bounded content

Recommendation:
- do not open this to arbitrary rich text in the first version

### 6.4 Actions

- optional, but expected for the section to be useful
- maximum two CTAs
- should be rendered through `SectionActions`
- actions should not become an arbitrary button list

Recommendation:
- one primary and one secondary action at most

---

## 7) Locked initial variants

### 7.1 `band`

Use when:

- the CTA should read as a strong full-width section break
- the page needs a clear conversion moment between other sections
- the copy should remain central and direct

Behavior:

- band-style section treatment
- clear visual separation from surrounding content
- strong title and supporting description
- actions grouped beneath or alongside copy depending on layout

### 7.2 `split`

Use when:

- the CTA should feel more layout-driven and editorial
- the page needs a broader section rhythm than a single centered band
- copy and action grouping benefit from a more structured two-part layout

Behavior:

- split layout for copy and actions
- stacked on smaller viewports
- width-led layout
- no media in v1

Implementation note:

- split layout should be solved by section-level grid or flex rules
- avoid min-width-led layout hacks
- width should dictate layout behavior

---

## 8) Variant ownership rules

Variants should be template-driven, not admin-selected per section instance.

This is a critical architecture rule.

Why:

- admins should manage bounded content, not visual composition choices
- template families should determine the visual language of the site
- allowing admins to choose section variants ad hoc would move the product toward page-builder behavior

So the correct ownership model is:

- admin controls:
  - eyebrow
  - title
  - description
  - actions

- template controls:
  - variant
  - layout personality
  - surface treatment
  - presentation rhythm

This keeps the SaaS product coherent and scalable.

---

## 9) Relationship to primitives

`CTASection` should depend on:

- `SectionShell`
- `SectionContainer`
- `SectionHeader`
- `SectionActions`

Responsibilities:

- `CTASection`
  - chooses layout
  - maps template/variant to shell and container decisions
  - determines how copy and actions relate spatially

- `SectionHeader`
  - renders eyebrow, title, description

- `SectionActions`
  - renders up to two CTAs consistently

`CTASection` should not require `SectionMedia` in v1.

That is an intentional boundary to keep the first implementation strong and focused.

---

## 10) Token and template alignment

`CTASection` must align cleanly with the design-system layers.

It should consume:

- semantic spacing tokens
- semantic surface tokens
- semantic typography tokens
- semantic container-width tokens
- semantic button contracts through `SectionActions`

It should not:

- hardcode colors
- invent local spacing values
- bypass template-driven visual decisions

Template expression should decide whether the section feels:

- more direct and band-like
- more spacious and split

The section implementation should remain compatible with multiple templates without redesign.

---

## 11) Accessibility expectations

`CTASection` must:

- preserve semantic heading behavior through `SectionHeader`
- keep action count bounded and readable
- maintain strong contrast and obvious action hierarchy
- avoid visually dense or ambiguous CTA arrangements

Recommendation:

- no icon-only actions in this section
- no unlabeled controls

---

## 12) What stays out of CTASection

Do not include initially:

- media
- testimonial content
- pricing tables
- feature grids
- arbitrary badges or metadata rows
- analytics logic
- auth-resolution logic

These belong either in separate sections or in upstream resolved action/content models.

---

## 13) SaaS and community-fit rationale

`CTASection` must be generic in structure but community-specific in content.

That means the section should work equally well for:

- yoga studios
- martial arts clubs
- spiritual groups
- creative workshops
- small community organizations

The structure remains stable.
The content changes.

Example:

- title: `Join our community today`
- description: `Become part of our martial arts family and gain inner peace through confidence.`
- actions:
  - `Join now`
  - `View classes`

This is the correct balance for a SaaS community-site system:

- reusable design system
- bounded admin-authored content
- no bespoke section redesign for every community type

---

## 14) Open decisions to review

### 14.1 Alignment exposure

Recommendation:

- keep alignment internal at first
- only expose if a real template or layout need proves it necessary

### 14.2 Surface intensity

Recommendation:

- allow template-driven surface treatment rather than broad prop-based control
- avoid letting routes or admin settings decide section chrome directly

### 14.3 Variant rollout

Locked recommendation:

- start with `band` and `split`
- do not add `card` in v1

---

## 15) Relationship to homepage build order

`CTASection` should be one of the next homepage sections after `HeroSection`.

Reason:

- it supports conversion directly
- it is broadly reusable
- it does not depend on complex admin-driven listing data
- it helps define the homepage journey before event/course listing sections are introduced

This makes it a better near-term priority than dynamic listing sections.

---

## 16) Recommended first implementation rule

When `CTASection` is first built:

- keep the prop surface intentionally small
- keep variant count bounded
- make the variant template-driven
- use token-only styling discipline
- do not add media support
- do not add admin-selectable visual options

This will keep the first implementation strong and reusable.

---

## 17) Summary

`CTASection` should be:

- a conversion-focused public section
- built from the existing section primitives
- bounded to `band` and `split` variants
- template-driven in visual choice
- admin-driven only in content

That is the correct production-grade direction for the SaaS public-site system.
