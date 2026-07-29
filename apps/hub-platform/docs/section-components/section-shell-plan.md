# SectionShell Plan

Status:
- Proposed
- Updated planning document for the public section-component system in `apps/hub-platform`

Purpose:
- Define the role of `SectionShell` before implementation begins
- Lock the boundaries between section-level spacing/semantics and section-specific content concerns
- Create a durable base for later public sections such as `HeroSection`, `FeatureListSection`, `CTASection`, `EventListSection`, and `AnnouncementListSection`

---

## 1) Why start with SectionShell

`SectionShell` should be the outer layout contract for public sections.

It should solve the repeated concerns that almost every public section will need:
- vertical spacing between sections
- background/surface treatment
- section-level anchor/id support

It should not solve section-specific content design.

It should also not own width or gutter containment.
Those concerns belong to `SectionContainer`.

That means `SectionShell` is not responsible for:
- eyebrow/title/body rendering
- CTA rendering
- section-specific media layout
- entity-card rendering
- dynamic data handling

Starting with `SectionShell` is the right first move because it lets the public-site system define consistent outer rhythm without prematurely locking internal content patterns.

---

## 2) Design goals

`SectionShell` should be:
- token-based
- theme-aware
- template-aware
- variant-bounded
- simple to compose
- hard to misuse

`SectionShell` should help us avoid:
- ad hoc route-level spacing
- one-off section wrapper CSS
- inconsistent section density
- coupling each section to page-level layout concerns

---

## 3) Responsibilities

`SectionShell` should own:
- top and bottom spacing rhythm
- background intent
- optional semantic HTML wrapper choice
- section `id` and ARIA labelling hooks where needed

`SectionShell` should not own:
- horizontal gutters
- max-width containment
- inner content wrapping
- typography hierarchy beyond inherited defaults
- rendering of section headers
- rendering of section actions
- rendering of media
- section body composition
- card grids, lists, or columns beyond very high-level containment

---

## 4) Proposed folder and naming

Recommended location:

- `src/components/sections/section-shell/SectionShell.jsx`
- `src/components/sections/section-shell/SectionShell.module.css`

Rationale:
- `SectionShell` is part of the public section system
- it is not a global primitive like `Button`, `Icon`, or `Surface`
- keeping it under `sections` makes ownership clear

---

## 5) Proposed API shape

Initial `SectionShell` props should stay intentionally small.

### 5.1 Core props

- `as`
  - semantic wrapper element
  - default: `"section"`
  - allowed examples: `"section"`, `"div"`, `"header"`

- `id`
  - optional anchor target

- `className`
  - local extension hook

- `children`
  - section content

### 5.2 Layout props

- `spacing`
  - controls vertical rhythm for the section block
  - proposed values:
    - `"none"`
    - `"default"`
    - `"compact"`
    - `"spacious"`

- `spacingTop`
  - optional top-only override

- `spacingBottom`
  - optional bottom-only override

### 5.3 Surface/background props

- `surface`
  - controls the section background intent
  - proposed values:
    - `"transparent"`
    - `"subtle"`
    - `"primary"`
    - `"inverse"`

- `divider`
  - optional section boundary treatment
  - proposed values:
    - `"none"`
    - `"top"`
    - `"bottom"`

### 5.4 Accessibility props

- `ariaLabel`
- `ariaLabelledby`

These should remain optional and only be used where section semantics require them.

---

## 6) Variant strategy

`SectionShell` should not have expressive visual variants like a hero or CTA section.

Its variants should be limited to structural concerns only.

Good `SectionShell` variants:
- spacing
- surface
- divider

Bad `SectionShell` variants:
- `"hero"`
- `"editorial"`
- `"promo"`
- `"card-grid"`
- `"split"`

Those belong to actual section components.

This is important.
If `SectionShell` absorbs section identity, it will become an unmaintainable generic wrapper instead of a stable layout primitive for the section system.

---

## 7) Token and theme alignment

`SectionShell` must stay aligned with the token and theme system already established in the app.

It should consume:
- semantic spacing tokens
- semantic surface/background tokens
- semantic border/divider tokens

It should not hardcode:
- literal colors
- one-off spacing values
- per-client visual rules

Recommended token expectations:
- spacing via `--space-*`
- backgrounds via semantic surface tokens
- divider color via semantic border tokens

Container widths and gutters should be handled by `SectionContainer`, not by `SectionShell`.

---

## 8) Relationship to future section primitives

`SectionShell` should sit below real sections and alongside `SectionContainer` and section-specific primitives.

Likely companion primitives:
- `SectionHeader`
- `SectionActions`
- `SectionMedia`

Intended relationship:
- `SectionShell` handles outer section framing
- `SectionHeader` handles eyebrow/title/description
- `SectionActions` handles up to two CTAs
- `SectionMedia` handles image/media framing where needed

Locked composition model:
- real section components should own `SectionShell` internally
- routes and pages should compose full sections, not wrap them in `SectionShell` manually

Preferred example:

```jsx
function HeroSection(props) {
  return (
    <SectionShell surface="transparent" spacing="spacious">
      <SectionContainer width="wide">
        <SectionHeader ... />
        <SectionMedia ... />
      </SectionContainer>
    </SectionShell>
  );
}
```

Expected page usage:

```jsx
<HeroSection variant="split" ... />
<FeatureListSection ... />
<CTASection ... />
```

This is the production-grade direction because it:
- keeps page composition clean
- reduces misuse of shell props at the route level
- keeps spacing, width, and surface decisions attached to the section contract
- makes sections easier to reuse consistently across client sites

---

## 9) What should stay out of SectionShell for now

To avoid premature abstraction, `SectionShell` should not include:
- built-in header rendering props like `title`, `eyebrow`, or `description`
- built-in CTA props
- layout grids for media/text splits
- card-list/grid rendering helpers
- dynamic content hooks
- auth-aware behavior

Those concerns belong either in real sections or in dedicated section primitives.

---

## 10) Open decisions before implementation

These are the main items to review before writing code.

### 10.1 Width scale

Moved to `SectionContainer`.

Width should no longer be treated as part of the `SectionShell` contract.

### 10.2 Surface naming

Locked decision:
- use semantic section intent names such as `transparent`, `subtle`, `primary`, `inverse`
- map them internally to the correct tokens

### 10.3 Axis-specific spacing control

Locked direction:
- `SectionShell` should support top and bottom spacing control cleanly
- `spacing="none"` must be available
- axis-specific overrides are justified for cases such as flush opening heroes

---

## 11) Recommended first implementation rule

When `SectionShell` is first built:
- keep the prop surface intentionally small
- use semantic tokens only
- do not let it become a catch-all wrapper
- implement one real consumer immediately after it, likely `HeroSection`

That gives us a strong feedback loop:
- `SectionShell` proves itself in a real section
- `HeroSection` proves which follow-on primitives are genuinely reusable

---

## 12) Next documents to create

After this document, the next planning docs should be:

1. `hero-section-plan.md`
2. `section-header-plan.md`
3. `section-actions-plan.md`
4. `section-media-plan.md`

That order keeps the first real section and its likely reusable internals planned together.
