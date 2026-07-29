# GridSection Plan

Status:
- Proposed
- Production-grade planning document for the shared public grid-based content section

Purpose:
- Define the production contract for `GridSection`
- Establish a reusable public section for bounded grid-based content such as “What to expect”, “What we offer”, “How it works”, or similar structured messaging
- Create a section that stays template-driven, token-aligned, and SaaS-safe without drifting into page-builder behavior

---

## 1) Why GridSection matters

The public site needs a structured way to communicate multiple clear points without forcing everything into:

- `InfoSection`
- `TestimonialsSection`
- improvised page-specific grids

`GridSection` fills that gap.

Used well, it helps communities:

- explain what members can expect
- outline what the community offers
- communicate key values or experience points
- break broad messaging into clearer, more scannable units
- reinforce trust and comprehension before users move into listings or conversion actions

Without a bounded grid section, the system is likely to drift into:

- one-off homepage card grids
- route-specific CSS layouts
- inconsistent card counts and spacing
- overly broad use of `InfoSection`

So this is not just another decorative section.
It is a core structured explanatory section in the public journey.

---

## 2) Role of GridSection

`GridSection` is a reusable public section for rendering a bounded collection of simple content cards beneath a shared section header.

It should be suitable for:

- homepage “what to expect” sections
- homepage “what we offer” sections
- homepage or public-page “how it works” / “how to book” sections when driven by known system flows
- public about page support sections
- secondary public pages that need structured point-based content

It should not be overloaded into:

- a listing/archive section
- a pricing table
- an icon gallery
- arbitrary CMS block composition
- event/course/announcement cards

Its job is to present a small set of structured items in a consistent, template-aware grid.

Those items may be:

- admin-managed content items
- system-driven process steps

---

## 3) Composition model

`GridSection` should own `SectionShell` internally.
`GridSection` should also own `SectionContainer` internally.

Expected internal structure:

```jsx
<SectionShell ...>
  <SectionContainer ...>
    <div className={styles.inner}>
      <SectionHeader ... />
      <SectionItemsGrid ...>
        {items.map((item, index) => (
          <SectionCard ...>
            <GridSectionMarker ... />
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </SectionCard>
        ))}
      </SectionItemsGrid>
    </div>
  </SectionContainer>
</SectionShell>
```

`GridSection` should not be wrapped externally in `SectionShell` by routes.

Pages should consume it like:

```jsx
<GridSection
  eyebrow="What to expect"
  title="A clearer picture of what joining feels like"
  description="Use this section to break the community experience into a few simple points."
  items={[...]}
  variant="default"
/>
```

Routes and page templates should compose the section.
They should not manually construct its shell/grid behavior.

---

## 4) Production-grade requirements

`GridSection` must be:

- token-based
- theme-aware
- template-aware
- responsive
- accessible
- visually balanced
- bounded in content contract

It must not:

- depend on page-specific CSS
- expose arbitrary icon selection to admins
- allow arbitrary visual customization outside bounded choices
- become a generic card-layout escape hatch

---

## 5) Naming

The reusable component name should be:

- `GridSection`

This is intentionally generic.

The component should remain reusable across public pages and use cases.
Admin UI can use context-specific labels such as:

- `What to expect`
- `What we offer`
- `How it works`

This follows the same separation of reusable component naming and context-specific admin labeling already established with `InfoSection`.

---

## 6) Proposed API shape

### 6.1 Core content props

- `eyebrow`
- `title`
- `description`
- `items`

### 6.2 Variant props

- `variant`
  - locked initial values:
    - `"default"`
    - `"step"`

### 6.3 Utility props

- `id`
- `className`

Avoid broadening beyond this until real usage proves it necessary.

---

## 7) Content rules

### 7.1 Eyebrow

- optional
- short, high-signal label above the section title

### 7.2 Title

- required
- primary section heading

### 7.3 Description

- optional
- short supporting summary beneath the title

### 7.4 Items

- minimum 1
- maximum 6

Each item must include:

- `title` required
- `description` required

Items must not include in v1:

- arbitrary icons
- links
- images
- rich text
- nested lists

Keeping items this bounded is important for:

- admin clarity
- SaaS consistency
- responsive layout predictability

---

## 8) Variant model

`GridSection` should support two template-driven variants.

### 8.1 `default`

Use for:

- offerings
- expectations
- benefits
- similar admin-managed structured content

This variant should use the template’s default grid-card visual treatment.

Templates may express this differently, for example through:

- top-border emphasis
- shape-based marker treatment
- restrained decorative accents

Admins should not choose those presentation details directly.

### 8.2 `step`

Use for:

- system-driven process sections
- known platform flows such as:
  - how to book
  - how to join
  - how to register for an event/course

This variant should imply ordered steps.
Numbering is appropriate here because the content is process-driven by design.

Templates may style the step markers differently, but the existence of steps should be inherent to the variant.

### 8.3 Out of scope

Admins should not choose:

- arbitrary icons
- arbitrary colors
- arbitrary border styles
- arbitrary illustration types
- marker style

Visual treatment remains template-driven.

---

## 9) Layout rules

### 9.1 Core layout

`GridSection` should use a responsive grid layout that handles 1..6 items gracefully.

Expected behavior:

- cards should sit naturally with varying item counts
- layout should avoid awkward over-wide cards when only a few items exist
- mobile should stack cleanly

### 9.2 Item count behavior

Supported counts:

- 1 item
- 2 items
- 3 items
- 4 items
- 5 items
- 6 items

The layout should feel intentional at every supported count.

This means `GridSection` must not assume:

- always 3 items
- always 6 items

### 9.3 Layout implementation principle

This should be solved through a reusable grid primitive rather than one-off section CSS.

That supporting primitive is:

- `SectionItemsGrid`

`GridSection` should consume that primitive rather than owning all responsive grid logic locally.

---

## 10) Card usage

`GridSection` should use:

- `SectionCard`

for each grid item.

`SectionCard` should continue to own only:

- shared card shell
- surface
- radius
- border
- shadow
- outer padding

`GridSection` should own:

- card content anatomy
- marker placement
- title/description spacing

This keeps responsibilities clean.

---

## 11) Content source model

`GridSection` should support different content sources depending on the use case.

### 11.1 Admin-managed content items

For sections like:

- what we offer
- what to expect
- benefits

it is preferable to treat the grid items as managed content, similar in principle to testimonials.

That means:

- items are created and managed in their own admin area
- ordering/publish state can live with the content type
- homepage settings should only manage the section-level wrapper copy if needed

This is cleaner than embedding up to six repeated item groups directly into homepage settings.

### 11.2 System-driven step items

For sections like:

- how to book
- how to join
- how a known flow works

the items should not necessarily be admin-authored at all.

Instead, they may be generated from known platform flow rules and rendered through:

- `GridSection` variant `"step"`

This keeps the system cleaner and avoids unnecessary admin content entry for product-defined processes.

---

## 12) Template ownership

The section must remain template-aligned.

Templates should control things like:

- default variant treatment
- card surface character
- card gap rhythm through tokens
- number styling for step variants
- border/shape styling for default variants

Admins should not control:

- card radius
- card shadow
- accent color
- responsive layout behavior
- marker styling details

That belongs to:

- template
- tokens
- section system

---

## 13) Accessibility requirements

`GridSection` must:

- preserve semantic heading hierarchy
- keep cards readable at all breakpoints
- ensure decorative markers are not treated as meaningful UI controls
- ensure number markers do not create confusing duplicated announcements for assistive tech if they are decorative

If numbering is meaningful content, it should be rendered intentionally.
If it is decorative sequencing only, it should be treated as presentation.

This distinction must be made carefully during implementation.

---

## 14) Admin model

The admin experience should be bounded and simple.

For section-level wrapper copy, expected admin fields may include:

- eyebrow
- title
- description

For admin-managed content use cases, the grid items themselves should ideally be managed outside homepage settings in a dedicated content area.

Admins should not configure in homepage settings:

- up to 6 repeated inline item groups
- marker style
- card columns
- card spacing
- card colors
- icon choice

---

## 15) Relationship to other sections

`GridSection` should complement:

- `HeroSection`
- `InfoSection`
- `TestimonialsSection`
- `CTASection`

It should not duplicate them.

Its role is:

- structured scannable points

Whereas:

- `InfoSection` handles richer narrative
- `TestimonialsSection` handles trust proof
- `CTASection` handles direct action

---

## 16) Risks to avoid

### Risk 1: Too much admin-level visual flexibility

If the variant system expands too far or starts exposing styling choices directly to admins, `GridSection` starts acting like a page-builder section rather than a bounded SaaS section.

### Risk 2: Local layout improvisation

If this section owns bespoke grid logic that future sections repeat, we will recreate the same layout problem again for listings and content cards.

### Risk 3: Overloading the content contract

If items start accepting icons, links, media, badges, and actions, the section becomes too vague and hard to maintain.

---

## 17) Locked decisions

- reusable component name should be `GridSection`
- admin UI may use context-specific labels depending on where the section is used
- section uses `SectionShell`, `SectionContainer`, `SectionHeader`, and `SectionCard`
- section supports two template-driven variants:
  - `default`
  - `step`
- section items are bounded to title + description only
- max item count is 6
- responsive layout must gracefully handle varying card counts
- a reusable `SectionItemsGrid` primitive should support the layout
- arbitrary admin icon selection is out of scope
- admin marker-style selection is out of scope
- templates own the actual visual treatment for both variants
- admin-managed content grids and system-driven step grids should both reuse the same `GridSection` component
