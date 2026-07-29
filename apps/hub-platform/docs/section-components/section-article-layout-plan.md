# SectionArticleLayout Plan

## Status

Proposed

## Purpose

Define a reusable structural primitive for public section surfaces that need:

- a primary reading column
- a secondary aside column
- a clear article-style hierarchy
- optional sticky aside behavior on larger screens
- graceful collapse to one column on smaller screens

This primitive is being introduced first to support `EventDetailsSection`, but it must remain neutral and reusable rather than event-specific.

## Why This Primitive Exists

The public section system now has a clear need for a layout that is not:

- a simple card grid
- a hero split layout
- a one-column article flow

`EventDetailsSection` needs:

- full-width media at the top
- then a reading-oriented content layout
- with a supporting conversion/action aside

That is a genuine reusable structural pattern.

Without a dedicated primitive, we risk:

- ad-hoc page-local two-column CSS
- sticky-aside logic implemented per route
- inconsistent column ratios
- divergence in how article/detail surfaces collapse on mobile

`SectionArticleLayout` exists to prevent that drift while staying intentionally bounded.

## Primitive Role

`SectionArticleLayout` should be a structural layout primitive for section internals.

It should not:

- own section spacing
- own max-width containment
- own media lead behavior
- own typography
- own CTA card styling
- own metadata styling
- own event-specific or course-specific content decisions

Those responsibilities belong to:

- `SectionShell`
- `SectionContainer`
- the consuming section

So `SectionArticleLayout` is not a section by itself.
It is an internal section-layout primitive.

## Primary Use Case

The first target use case is:

- `EventDetailsSection`

Expected initial structure:

- `SectionShell`
  - `SectionContainer`
    - media lead
    - `SectionArticleLayout`
      - main content column
      - booking aside

Likely future reuse:

- `CourseDetailsSection`
- richer editorial public detail pages
- public article/detail surfaces with an informational aside

## Responsibilities

`SectionArticleLayout` should own:

- two-column layout structure
- main/aside column ratio
- gap between columns
- responsive collapse behavior
- optional sticky aside support
- alignment behavior between columns

`SectionArticleLayout` should not own:

- outer section spacing
- outer width containment
- sticky top offset tokens directly embedded as literals
- card chrome
- metadata composition
- CTA layout internals
- mobile sticky CTA behavior

## Locked Layout Direction

### Desktop / larger screens

The layout should be two-column with:

- main / left column: roughly `2/3`
- aside / right column: roughly `1/3`

This should not be treated as pixel-perfect fixed fractions.

The correct intent is:

- the reading column clearly dominates
- the aside remains substantial enough to hold a booking card comfortably

The primitive should express this through tokens and bounded layout rules rather than hardcoded one-off widths in consuming sections.

### Tablet and smaller screens

The layout should collapse to a single column.

The aside should move back into normal document flow beneath the main content.

This collapse behavior is a core part of the primitive contract, not an optional afterthought.

## Sticky Aside Support

### Desktop behavior

The primitive should support an optional sticky aside mode on larger screens.

This is important for event/course detail surfaces where the action card should remain visible during reading.

Requirements:

- aside can become sticky once it reaches the page-header offset
- sticky behavior must not overlap the page header
- sticky behavior must not cause clipping or overflow issues
- sticky behavior must remain token-driven and template-aware

### Mobile behavior

The primitive should not force sticky behavior on smaller screens.

On mobile:

- the aside returns to normal document flow
- no sticky top or sticky bottom behavior should be built into the primitive by default

This keeps `SectionArticleLayout` structurally clean and prevents it from making product-level mobile CTA decisions on behalf of consuming sections.

## Why Mobile Sticky Should Stay Out Of The Primitive

Whether a mobile CTA should pin:

- under the header
- at the bottom of the viewport
- or not at all

is a route-level or section-level UX decision, not a generic layout concern.

So `SectionArticleLayout` should only guarantee:

- single-column collapse
- logical aside placement in document flow

Any sticky mobile CTA behavior should be a higher-level decision made later by the consuming section if it is truly justified.

## Composition Model

Expected composition should look like:

```jsx
<SectionShell spacing="spacious" surface="transparent">
  <SectionContainer width="wide">
    ...
    <SectionArticleLayout stickyAside>
      <SectionArticleLayout.Main>
        ...
      </SectionArticleLayout.Main>
      <SectionArticleLayout.Aside>
        ...
      </SectionArticleLayout.Aside>
    </SectionArticleLayout>
  </SectionContainer>
</SectionShell>
```

The exact API shape can still be refined, but the composition intent should stay clear:

- main content is explicit
- aside is explicit
- sticky behavior is an opt-in structural mode

## API Direction

The initial API should stay bounded.

### Likely core props

- `className`
- `children`
- `stickyAside`
  - boolean
  - opt-in sticky aside on larger screens

### Preferred structural pattern

One of these should be chosen during implementation:

- named slots/components:
  - `SectionArticleLayout.Main`
  - `SectionArticleLayout.Aside`
- or explicit prop-based children mapping if a simpler contract is cleaner

My planning recommendation is to prefer named child components or explicit slot wrappers so the consuming section remains easy to read.

## Layout Rules

### Main column

The main column should:

- remain the dominant reading column
- support long-form rich text without feeling squeezed
- expand naturally when the aside collapses away on smaller screens

### Aside column

The aside column should:

- remain visually secondary
- support conversion or supporting utility content
- not become so narrow that CTA cards feel cramped

### Column gap

The gap between columns should be token-driven and template-aware.

It should not be hardcoded per consumer.

## Token And Template Awareness

This primitive must remain:

- token-driven
- template-aware

It should consume semantic layout tokens for:

- article gap
- sticky top offset
- breakpoint behavior
- column proportions if needed

It should not hardcode:

- literal rem column gaps
- hardcoded sticky offsets tied to one page header height
- one-off breakpoint math

If new semantic tokens are needed, they should be added intentionally.

## Relationship To Existing Primitives

### `SectionShell`

`SectionShell` still owns:

- vertical spacing
- outer section semantics
- section surface/background intent

`SectionArticleLayout` must not absorb those responsibilities.

### `SectionContainer`

`SectionContainer` still owns:

- width
- horizontal containment
- outer gutters

`SectionArticleLayout` must not try to become a container.

### `SectionCard`

The aside content may use `SectionCard` or another card-like surface, but `SectionArticleLayout` itself should not own card styling.

## Accessibility Requirements

The primitive should support:

- logical DOM order
- main content first, aside second unless a consuming section intentionally chooses otherwise
- keyboard flow that remains natural
- sticky behavior that does not trap or obscure content

The aside should remain fully accessible when sticky.

## Out Of Scope

`SectionArticleLayout` should not include:

- built-in share actions
- built-in booking card
- built-in metadata rows
- built-in breadcrumbs
- built-in media lead
- route hero behavior
- mobile sticky CTA behavior

Those belong to the consuming section or later primitives.

## Risks To Avoid

### Risk 1: Making it event-specific

If the primitive bakes in event assumptions now, it becomes harder to reuse later.

### Risk 2: Making the API too abstract

If the primitive becomes a mini page builder, it will become hard to maintain.

### Risk 3: Letting consuming sections control too much layout

If every consumer can override ratio, gaps, sticky rules, and breakpoints freely, the primitive stops creating consistency.

## Locked Decisions

- `SectionArticleLayout` should be introduced
- it is justified by `EventDetailsSection`
- it should remain neutral and reusable
- it should produce a two-column layout on larger screens
- the intended ratio is roughly `2/3` main and `1/3` aside
- it should support optional sticky aside on larger screens
- it should collapse to one column on smaller screens
- mobile sticky CTA behavior is not part of the primitive contract
- it must remain token-driven and template-aware

## Implementation Sequence Recommendation

1. implement `SectionArticleLayout`
2. use it in `EventDetailsSection`
3. validate sticky-aside behavior across templates
4. reuse it later for `CourseDetailsSection` if it still fits cleanly
