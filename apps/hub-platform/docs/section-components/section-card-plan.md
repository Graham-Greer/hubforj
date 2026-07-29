# SectionCard Plan

## Purpose

`SectionCard` is a reusable structural primitive for section-level card surfaces used within the public section system.

Its job is to provide shared card scaffolding for sections that need a card-based presentation, without owning the internal content anatomy of those cards.

It is intended to support recurring section patterns such as:

- testimonial cards
- event listing cards
- course listing cards
- announcement listing cards

## Why This Primitive Exists

The public section system now has enough evidence that card-based layouts will recur across multiple sections.

Without a shared primitive, we risk:

- repeated one-off surface styles
- inconsistent radius and elevation usage
- drift in outer padding and card chrome
- section-specific card wrappers all solving the same problem differently

`SectionCard` exists to prevent that drift while staying intentionally bounded.

## Primitive Role

`SectionCard` should own shared outer card scaffolding only.

It should not own section-specific content structure.

This distinction is important.

`SectionCard` is not:

- a universal card component for every possible use case
- a content layout system
- a media/content ratio system
- a card body spacing system
- an action-footer abstraction

It is the structural wrapper that gives section cards a consistent surface and outer shell.

## What SectionCard Should Own

### Core responsibilities

- card surface/background treatment
- border treatment
- radius
- elevation / shadow
- outer padding
- overflow behavior

In v1, these should come from the semantic/template token layer rather than a broad prop surface.

## What SectionCard Should Not Own

At this stage, `SectionCard` should not own:

- spacing between cards
- internal content spacing rhythm
- quote layout
- attribution layout
- meta row layout
- button/footer layout
- image aspect-ratio rules
- section-specific card header/body/footer slots with strong assumptions

Spacing between cards belongs to the parent layout or grid wrapper, not the card itself.

Section-specific content anatomy should remain with the consuming section implementation unless repeated structures later justify a second extraction.

## Relationship To The Section System

`SectionCard` is a primitive inside the public section component family.

It should align with the same section-system rules already established elsewhere:

- token-driven styling
- template-aware visual system
- no locally guessed padding or radius values
- no ad hoc shadow definitions

It should work comfortably inside layouts built with:

- `SectionShell`
- `SectionContainer`

## Expected Initial Consumers

The first expected consumer is:

- `TestimonialsSection`

Likely later consumers include:

- event listing sections
- course listing sections
- announcement listing sections

This is why introducing the primitive now is justified rather than premature.

## Initial API Direction

The initial API should stay extremely small.

Likely props:

- `children`
- `className`

Possibly one bounded opt-in later if a real need appears:

- `padding`

But v1 should prefer one stable default shell contract rather than multiple visual options.

## Styling Direction

`SectionCard` should rely on semantic tokens for:

- radius
- border
- background
- shadow
- padding

It should work from the new section-card semantic tokens rather than re-declaring card visuals locally.

It should not hardcode arbitrary visual values in component CSS.

If card-specific semantic tokens are needed, they should be introduced cleanly into the semantic layer rather than improvised locally.

## Template Ownership

As with other section primitives, visual choices should remain template-driven where relevant.

Admins should not directly choose:

- card radius style
- card shadow style
- card surface mode

Those belong to the section/template/design-system layers.

## Reuse Boundaries

We should be disciplined about what counts as a legitimate `SectionCard` consumer.

Good candidates:

- public section cards with repeated structural needs

Poor candidates:

- arbitrary admin workspace panels
- dashboard stat cards
- form group containers

This primitive is for the public section system, not a global replacement for every card-like UI in the product.

## V1 Implementation Guidance

### Build now

- `SectionCard` as a thin bounded structural wrapper

### Use first in

- `TestimonialsSection`

### Defer for now

- multiple visual variants
- internal slot architecture
- generic card media helpers
- card footer abstractions
- cross-product universal card usage

## Risks To Avoid

### Risk 1: Making it too generic too early

If `SectionCard` tries to solve all card use cases immediately, it will become vague and hard to reason about.

### Risk 2: Letting each consumer override too much

If every consumer can override everything, the primitive stops creating consistency.

### Risk 3: Duplicating existing primitives

`SectionCard` should not become a disguised second version of `Surface` with unclear responsibilities.

It should be a section-system-oriented wrapper that composes the existing design-system layers appropriately.

## Relationship To Surface

`SectionCard` will likely compose existing lower-level primitives such as `Surface`.

That is acceptable and desirable.

The point of `SectionCard` is not to replace lower-level primitives.

The point is to give section implementations a reusable card-level wrapper with the right public-section semantics and defaults.

## Refined Direction

The most important clarification is this:

`SectionCard` is not being introduced because we already need a family of card abstractions.

It is being introduced because we now have a semantic public-card contract and want one thin primitive that applies that contract consistently.

That means:

- card-to-card spacing remains outside the card
- internal card anatomy remains outside the card
- template-driven card behavior comes from tokens
- `SectionCard` is primarily a shared shell, not a configurable card system

## Locked Decisions

- `SectionCard` should be introduced now
- it is justified by recurring section-card needs
- it should own scaffolding only
- it should not own card-to-card spacing
- it should not own internal content spacing or anatomy
- it should be a thin shell rather than a configurable card framework
- it should be token-driven
- it should be used first by `TestimonialsSection`
