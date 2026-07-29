# TestimonialsSection Plan

## Purpose

`TestimonialsSection` is a reusable public-site trust section for showcasing a bounded subset of published testimonials on template-driven pages such as the homepage.

Its role is to:

- build trust
- reinforce community credibility
- help prospective members feel reassured
- support the conversion journey without turning the page into a testimonial archive

It is not intended to replace the dedicated `/testimonials` page.

The section should always present a curated subset of testimonial content and defer the full list to the dedicated testimonials route.

## Section Role In The Public Journey

This section sits in the trust-building portion of the public experience.

It should typically appear after foundational narrative sections such as:

- `HeroSection`
- `InfoSection`

and before or near later conversion reinforcement such as:

- `CTASection`

Its job is not to explain the community in depth.

Its job is to provide credible social proof in a format that is:

- easy to scan
- visually balanced
- bounded in length
- consistent with the section system

## Naming

The reusable component name should be:

- `TestimonialsSection`

This is appropriate because the section is explicitly content-type driven.

Unlike `InfoSection`, this section is not generic content structure; it is specifically responsible for testimonial content.

## Variants

### V1 variants

The initial supported variants are:

- `cards`
- `spotlight-plus-rail`

### Default variant

The default variant should be:

- `cards`

### Excluded variant

The following variant is intentionally excluded from v1:

- carousel / quote slider

#### Why carousel is excluded

Carousel-style testimonial sections are not a good v1 fit because they:

- reduce information density
- hide trust content behind interaction
- often feel dated
- introduce more mobile and state complexity than necessary
- weaken scanability compared with cards

If a carousel is ever considered later, it should be treated as a separate product decision rather than an automatic fallback for larger testimonial counts.

## Template Ownership

Variant choice must be template-driven.

Admins should not select:

- `cards` vs `spotlight-plus-rail`
- visual layout variant
- section presentation mode

Admins manage testimonial content through the testimonial admin workflow.

Templates determine how the section is rendered on the page.

This keeps the SaaS model aligned with the design system:

- admins manage bounded content
- templates manage visual presentation
- the platform controls layout consistency

## Bounded Item Count

The homepage or any other public page using `TestimonialsSection` must not render an unbounded number of testimonials.

### V1 display rules

- `cards` variant shows a maximum of 3 testimonials
- `spotlight-plus-rail` shows a maximum of 3 testimonials total:
  - 1 spotlight testimonial
  - 2 supporting testimonials

### Why item count is bounded

The section must not:

- expand indefinitely as more testimonials are added
- create long vertical scroll on mobile
- become a hidden full testimonial archive

The dedicated `/testimonials` page is responsible for the complete testimonial collection.

### Overflow behavior

If more testimonials exist than the section displays:

- the section still shows only the bounded subset
- the dedicated testimonials page remains the place to see more
- an optional section CTA may link to `/testimonials`

No automatic carousel or overflow interaction should be introduced in v1.

## Ordering Rules

`TestimonialsSection` must respect the existing testimonial ordering contract already established in the testimonial data layer.

The section must not introduce a separate homepage-specific sorting system.

### Ordering contract

Testimonials are ordered by:

1. `featured` first
2. ascending `sortOrder`
3. deterministic fallback ordering after that

This ensures:

- featured testimonials are prioritized
- manual ordering is respected
- admin intent carries through to public rendering
- there is one clear ordering model across admin and public surfaces

## Data Source

The section should consume the existing published testimonial collection for the current hub.

It should only render:

- published testimonials

It should not surface:

- drafts
- archived testimonials

The section implementation should use the already-normalized public testimonial data model rather than re-normalizing in the component.

## Section Composition

`TestimonialsSection` should follow the established section system.

It should use:

- `SectionShell`
- `SectionContainer`
- `SectionHeader`

It should not use:

- `SectionMedia`

because this is not a media-led section in the same sense as hero/info sections.

It may use:

- `SectionActions`

only if we deliberately support an optional section-level CTA such as:

- `Read more testimonials`

That CTA should remain optional.

## Content Model

### Section-level content

The section itself may support:

- eyebrow
- title
- description
- optional section CTA

These should be bounded section-level settings, not freeform page-builder inputs.

### Testimonial record content

Each testimonial card/spotlight item should use the existing testimonial record model:

- quote
- author name
- author role
- author organization
- author image

No new testimonial content fields are required for v1.

## Card Anatomy

For the `cards` variant, each testimonial card should follow this order:

1. quote
2. attribution block beneath the quote

### Quote

The quote should:

- span the card width
- be the dominant content
- lead the card visually

### Attribution block

Below the quote:

- avatar sits on the left if an image exists
- attribution copy sits to the right of the avatar
- name is visually strongest
- role and organization sit beneath the name

The role and organization should compose consistently, for example:

- role only
- organization only
- role + organization joined with a separator

### Avatar sizing

The avatar should be sized for visual balance with the attribution block.

It should not be arbitrarily oversized or undersized.

Its size should feel proportionate to:

- author name
- author role
- author organization

Avatar sizing must be token-driven rather than locally guessed.

## Spotlight Plus Rail Variant

The `spotlight-plus-rail` variant should show:

- 1 primary spotlight testimonial
- 2 supporting testimonials

### Spotlight role

The spotlight item is the dominant testimonial.

It may have:

- larger quote treatment
- more prominent layout
- stronger emphasis on trust-building

### Rail role

The two supporting testimonials should reinforce credibility without overpowering the spotlight.

This variant should feel more editorial or premium, while still following the same data and ordering rules.

## Visual Language

### Quote marks

Quotation marks are a good place to carry brand identity into the section.

The quote-mark treatment should use a semantic accent token that derives from the hub’s brand-aware theme system.

This should not be hardcoded directly in the section CSS.

### Brand alignment

The section should help the public site feel customized to the client’s brand by using the token system intentionally.

Brand expression should come through:

- accent color usage
- typography
- surfaces
- spacing rhythm

not through per-client ad hoc styling.

## Spacing And Layout Rules

This section must follow the same spacing rules as the other public section components.

### Ownership model

- `SectionShell` owns vertical spacing
- `SectionContainer` owns width and gutters
- `TestimonialsSection` owns only its internal testimonial layout

### Internal spacing

Internal spacing between:

- quote
- attribution
- cards
- spotlight and rail items

must use the existing token scale.

No guessed margins or padding should be introduced locally.

## Mobile Behavior

The section must remain bounded and readable on mobile.

### Cards variant

On smaller screens:

- cards should stack vertically
- still capped at 3 visible testimonials

### Spotlight-plus-rail

On smaller screens:

- spotlight and supporting items should collapse into a clear vertical flow
- still capped at 3 visible testimonials total

The section must not create long, uncontrolled mobile scroll just because many testimonials exist in the system.

## CTA Behavior

An optional section-level CTA may be supported in v1.

Possible example:

- `Read more testimonials`

If present, it should use the existing section/action system and route to:

- `/{hubSlug}/testimonials`

The CTA should not be required for the section to function.

## Empty State / Missing Data

If no published testimonials exist:

- the section should not render on the public page

This should be treated as a normal absence of content, not as an error.

Public placeholder/fallback content is not required for this section in the same way it was required for foundational homepage structure sections such as:

- hero
- info
- CTA

The testimonials section is content-driven social proof, not foundational page scaffolding.

## Relationship To Existing Public Surfaces

The homepage currently includes a testimonial spotlight-style surface inside `PublicLandingPage`.

That existing logic should be treated as temporary and should eventually be replaced by `TestimonialsSection`.

The dedicated `/testimonials` page remains a separate public page with a different job:

- fuller collection browsing
- not bounded to a homepage-style subset

`TestimonialsSection` should not absorb the responsibilities of the full testimonials page.

## Admin Relationship

This section relies on the existing testimonial admin workflow.

It does not need a separate per-section testimonial picker in v1.

Instead, v1 should respect the existing testimonial model and ordering:

- published testimonials only
- featured first
- then sort order

This avoids creating a second testimonial management system before there is a clear need.

## V1 Implementation Guidance

### Implement first

1. `cards` variant
2. `spotlight-plus-rail` variant
3. optional section-level CTA only if needed by the target page/template

### Do not implement in v1

- carousel / slider behavior
- admin-selectable visual variants
- per-section manual testimonial picking
- unbounded item counts

## Open Questions

### 1. Should the section header always render?

Likely yes when configured, but template composition may choose whether the section-level copy is present or minimal.

### 2. Should the section-level CTA be part of the initial implementation?

It is optional and should only be included if it clearly improves the homepage/public page flow.

### 3. Should spotlight-plus-rail use the exact same card anatomy in smaller supporting items?

Probably yes in spirit, but it may use a slightly more compact supporting-card treatment if needed.

This should be resolved during implementation design review, not by broadening the content model.

## Locked Decisions

- `TestimonialsSection` is the correct component name
- v1 variants are `cards` and `spotlight-plus-rail`
- default variant is `cards`
- carousel is excluded from v1
- visible testimonial count is bounded to 3
- public section respects the existing testimonial ordering contract
- variant choice is template-driven, not admin-selectable
- quote comes first in card layout
- attribution block sits beneath the quote
- avatar sits beside attribution copy if present
- quote marks should use brand-aware accent tokens
- section must follow the established section-system spacing and layout rules
