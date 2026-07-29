# InfoSection Plan

Status:
- Proposed
- Production-grade planning document for the shared public informational split section

Purpose:
- Define the production contract for `InfoSection`
- Establish the reusable public section used to explain what a community is about, what it offers, or why somebody should engage
- Create a strong, reusable split-content section that stays template-driven and token-aligned without drifting into CMS-style page building

---

## 1) Why InfoSection matters

`InfoSection` helps the public site move beyond a strong opening message into clearer understanding.

Used well, it helps communities:

- explain who they are
- communicate what they offer
- reinforce trust and belonging
- provide richer supporting context than the hero
- guide somebody toward a single next step without turning the section into another hero

Without a strong `InfoSection`, the public site will drift into:

- weak explanatory content blocks
- improvised split layouts
- route-specific rich-text rendering
- inconsistent content hierarchy between templates

So this is not just a decorative body section.
It is part of the core homepage and public-page understanding journey.

---

## 2) Role of InfoSection

`InfoSection` is a reusable informational split section for explaining a community, offering, programme, or supporting public message.

It should be suitable for:

- homepage “about us” sections
- homepage “what we offer” sections
- public about pages
- secondary public pages that need richer explanatory content
- trust-building sections that need more context than a CTA or hero

It should not be overloaded into:

- a second hero
- a CTA band
- a listing section
- an event/course detail body
- arbitrary CMS content rendering

Its job is to provide structured explanatory content with supporting media, not to become a freeform content area.

---

## 3) Composition model

`InfoSection` should own `SectionShell` internally.
`InfoSection` should also own `SectionContainer` internally.

Expected internal structure:

```jsx
<SectionShell ...>
  <SectionContainer ...>
    <div className={styles.layout}>
      <div className={styles.copy}>
        <SectionHeader ... />
        <SectionRichText ... />
        <SectionActions ... />
      </div>
      <SectionMedia ... />
    </div>
  </SectionContainer>
</SectionShell>
```

`InfoSection` should not be wrapped externally in `SectionShell` by routes.

Pages should consume it like:

```jsx
<InfoSection
  eyebrow="About us"
  title="A place to train, grow, and belong"
  description="A short supporting summary."
  body={...}
  media={...}
  action={...}
/>
```

Routes and page templates should compose the section.
They should not construct its shell/container behavior manually.

---

## 4) Production-grade requirements

`InfoSection` must be:

- token-based
- theme-aware
- template-aware
- responsive
- accessible
- visually balanced
- bounded in its content and layout contract

It must not:

- depend on page-specific CSS
- expose arbitrary rich HTML rendering
- allow admin-controlled visual variant selection
- become a generic long-form content dump

---

## 5) Proposed API shape

### 5.1 Core content props

- `eyebrow`
- `title`
- `description`
- `body`
- `media`
- `action`

### 5.2 Layout props

- `mediaPosition`
  - locked initial values:
    - `"start"`
    - `"end"`

Important:
- this is a template and composition concern
- it should not be exposed as a hub-admin-controlled setting per section instance

### 5.3 Utility props

- `id`
- `className`

Avoid expanding beyond this until real usage proves it necessary.

---

## 6) Content rules

### 6.1 Eyebrow

- optional
- short, high-signal label
- should not become another long line of copy

### 6.2 Title

- required
- primary explanatory message
- should remain concise enough to preserve hierarchy and impact

### 6.3 Description

- optional but strongly recommended
- short supporting summary
- helps create hierarchy before the richer body content begins

Recommendation:
- keep `description` in `SectionHeader`
- do not force all supporting copy into the rich-text body

### 6.4 Body

- required
- should render through `SectionRichText`
- should support bounded formatted content only

Locked v1 formatting scope:

- paragraphs
- unordered lists
- bold
- italic

Explicitly out of scope in v1:

- links
- headings inside the body
- ordered lists
- images inside rich text
- arbitrary embedded content

### 6.5 Media

- required
- should render through `SectionMedia`
- should be visually meaningful and balanced against the copy column

Recommendation:
- because this section relies on split balance, media should not be optional in v1

### 6.6 Action

- optional
- maximum one CTA in v1
- should be rendered through `SectionActions`

Recommendation:
- keep this to a single action because `InfoSection` is primarily explanatory, not multi-path conversion

---

## 7) Layout rules

### 7.1 Core layout

`InfoSection` is a split section.

Expected behavior:

- copy and media sit side-by-side at larger breakpoints
- layout stacks cleanly on smaller viewports
- width should dictate layout
- height should follow from content and media naturally

Implementation note:

- solve this through section-level grid layout
- avoid height-led layout pressure
- avoid min-width-led hacks

### 7.2 Media position

`InfoSection` must support:

- media on the left
- media on the right

This matters because templates may alternate section rhythm based on surrounding sections.

Important architecture rule:

- the component must support both positions
- template or page composition chooses the position
- admins do not choose media position

---

## 8) Variant ownership rules

This section should remain template-driven rather than admin-composed.

Why:

- admins should manage bounded content
- templates should determine visual rhythm and composition
- exposing layout controls per section instance would move the product toward page-builder behavior

So the correct ownership model is:

- admin controls:
  - eyebrow
  - title
  - description
  - rich-text body
  - media selection
  - optional action

- template controls:
  - media position
  - spacing rhythm
  - surface behavior if introduced later
  - how this section sits relative to surrounding sections

---

## 9) Relationship to primitives

`InfoSection` should depend on:

- `SectionShell`
- `SectionContainer`
- `SectionHeader`
- `SectionMedia`
- `SectionActions`
- `SectionRichText`

Responsibilities:

- `InfoSection`
  - chooses layout
  - chooses media position
  - coordinates the copy and media relationship

- `SectionHeader`
  - handles eyebrow, title, and description hierarchy

- `SectionRichText`
  - renders bounded formatted body content

- `SectionMedia`
  - renders supporting media consistently

- `SectionActions`
  - renders the optional single CTA using the shared action system

---

## 10) Required supporting primitive: SectionRichText

`InfoSection` depends on a new primitive:

- `SectionRichText`

This primitive should exist so sections do not each invent their own body-copy rendering rules.

It should:

- render bounded rich-text content
- stay token-aligned
- remain presentation-focused

It should not:

- include editor behavior
- query data
- sanitize arbitrary HTML from unknown sources at render time

`SectionRichText` needs its own planning doc, but the formatting scope required for `InfoSection` is already locked:

- paragraphs
- unordered lists
- bold
- italic
- no links

---

## 11) Admin and product implications

In admin, this section may be presented with more context-specific naming.

Example:

- on homepage settings:
  - label the section as `About us`

But the shared component should remain generic as `InfoSection`.

Why:

- the same component may be reused on multiple public pages
- the public implementation should not be hardcoded to one page meaning

The admin editing experience should eventually use a bounded editor for the `SectionRichText` body.

Important:

- this should not become a full WYSIWYG page-builder
- it should remain a bounded formatting surface

---

## 12) Initial v1 boundaries

`InfoSection` v1 should include:

- split layout
- required media
- `SectionHeader`
- `SectionRichText`
- optional single action
- template-driven left/right media positioning

It should not include initially:

- multiple CTAs
- optional/no-media mode
- arbitrary body links
- nested rich content blocks
- admin-controlled layout variants
- alternate media treatments beyond what `SectionMedia` already supports

---

## 13) Recommended implementation order

1. Create and lock `SectionRichText` planning
2. Implement `SectionRichText`
3. Implement `InfoSection`
4. Wire `InfoSection` into the real homepage using a bounded “About us” content model
5. Add admin settings for the homepage usage context

Do not implement `InfoSection` before the `SectionRichText` contract is defined.

---

## 14) Locked initial decisions

- Section name is `InfoSection`
- `InfoSection` is reusable and generic by design
- admin labels may be usage-specific, such as `About us`
- media is required in v1
- `SectionHeader` keeps `description`
- rich body content must use `SectionRichText`
- `SectionRichText` supports:
  - paragraphs
  - unordered lists
  - bold
  - italic
- `SectionRichText` does not support links in v1
- `InfoSection` may include one optional action in v1
- media position must support left and right placement
- media position is template-driven, not admin-controlled

