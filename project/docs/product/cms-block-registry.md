# CMS Block Registry (MVP)

This document defines how CMS page composition maps to section components.

Authority:
- Must align with `docs/component-registry.md` (Sections and Header/Footer sections).
- Must align with `docs/standards/theming-architecture.md` (no template branching).

## Block model (locked)
A page composition is an ordered list of blocks:

- `type` (string) — matches a registered section component key
- `variant` (string) — selects a constrained layout recipe
- `props` (object) — typed fields, edited via structured forms
- `id` (string) — stable per-block identifier for editing/reordering

### Library selection behavior (M3)
- Block `variant` is selected during Section Library add flow.
- Editor displays variant cards with descriptions and a live preview.
- Section is appended to page composition only after explicit `Add section to page`.
- Block settings editor updates `props`; variant changes are done through library flow in MVP.

Example:
```json
{
  "id": "blk_123",
  "type": "HeroSection",
  "variant": "split",
  "props": {
    "eyebrow": "Community programs",
    "title": "Welcome",
    "description": "Join the community",
    "media": {
      "mediaId": "media_abc",
      "kind": "image",
      "alt": "Members collaborating",
      "posterMediaId": "",
      "aspect": "16:9"
    },
    "mediaPosition": "right",
    "splitRatio": "50-50",
    "contentAlign": "left",
    "ctas": [
      { "label": "Become a member", "href": "/join" },
      { "label": "Contact us", "href": "https://example.org/contact" }
    ]
  }
}
```

CTA contract (M3 foundation):
- CTA-capable sections support `ctas[]` with up to 2 items.
- CTA fields are optional until a CTA is added.
- Each CTA requires `label` and `href`.
- `href` must be internal (`/path`) or external (`http/https`).

## Draft vs published (locked)
- Pages store `draftComposition[]` and `publishedComposition[]`.
- Editing modifies draft only.
- Publishing copies draft → published.
- Preview renders draft with `no-store` caching.
- Live renders published with cache/revalidate.

## Allowed blocks (MVP)
All sections listed under “Sections (CMS Registry Blocks)” in `docs/component-registry.md` are valid CMS blocks, including:
- HeroSection (centered|split)
- FeatureSection (centered|split)
- GridSection (default, layout=grid|lead)
- StatsSection (cards|split)
- AccordionSection (default)
- PricingSection (tiers)
- TeamSection (default)
- TestimonialsSection (grid|lead)
- SectionRenderFallback

Variant metadata contract:
- Registry definitions SHOULD include `variantDescriptions` for library cards.
- Registry definitions SHOULD include per-variant preview mock props for live preview.
- Section docs MAY require in-editor variant selection; where required by canonical section doc, variant selection in editor is allowed and schema-driven.

FeatureSection contract (M3):
- Uses fragment-composed schema (SectionHeader + CtaGroup + Media + SectionLayout).
- `centeredMediaMode` controls centered rendering: `none|background|inline`.
- Publish gating:
  - `title` required.
  - `split` requires mediaId + alt.
  - `centered` requires mediaId + alt when `centeredMediaMode != "none"`.
  - CTA contract validated when CTA rows are present.

GridSection contract (M3):
- Uses fragment-composed schema (SectionHeader + GridLayout + CardItem + Badge).
- Publish gating:
  - requires at least one item.
  - each item requires `title`.
  - if `item.media.imageMediaId` is set, `item.media.alt` is required.
- Layout rules:
  - `layout="grid"` uses columns 2/3/4.
  - `layout="lead"` renders first item as lead and remaining items as grid cards.

StatsSection contract (M3):
- Uses fragment-composed schema (SectionHeader + GridLayout + StatsItem + IconRef + optional CtaGroup).
- Variants:
  - `cards`: section header above stats grid.
  - `split`: two-column layout with header/actions on the left and grid on the right.
- Publish gating:
  - requires at least one stat item.
  - each item requires `label` and `value`.
  - if icon row is added on an item, `icon.name` is required.
  - CTA contract validated when CTA rows are present.
- Layout rules:
  - supports `columns` (2/3/4), `align` (left/center), `density` (comfortable/compact).
  - `lead` layout mode is intentionally not available for stats.

TeamSection contract (M3):
- Uses fragment-composed schema (SectionHeader + GridLayout + PersonItem + optional CtaGroup).
- Variants:
  - `default`: responsive team people grid.
- Publish gating:
  - requires at least one team member.
  - each item requires `name`.
  - if `avatar.imageMediaId` is set, `avatar.alt` is required.
  - if social links are added, platform enum and `https://` URL are required.
  - CTA contract validated when CTA rows are present.
- Layout rules:
  - supports `columns` (2/3/4), `align` (left/center), `density` (comfortable/compact).
  - `lead` layout mode is intentionally not available for team.

PricingSection contract (M3):
- Uses fragment-composed schema (SectionHeader + GridLayout + PriceTier + Money + optional Badge/CTA per tier).
- Variants:
  - `tiers`: card-based pricing tiers (1..4).
- Publish gating:
  - requires at least one tier and at most four tiers.
  - each tier requires `name`.
  - if `isFree=false`, `price.amountMinor` (integer >= 0) and `price.currency` (`GBP|USD|EUR`) are required.
  - if tier CTA exists, `label` and valid `href` are required.
  - each tier requires at least one feature for publish.
- Layout rules:
  - supports `columns` (1/2/3/4), `align` (left/center), `density` (comfortable/compact).
  - lead layout mode is intentionally not available for pricing.

TestimonialsSection contract (M3):
- Uses fragment-composed schema (SectionHeader + GridLayout + QuoteItem).
- Variants:
  - `grid`: testimonials render as a standard responsive card grid.
  - `lead`: first testimonial is rendered as a lead horizontal card; remaining testimonials render as grid cards.
- Publish gating:
  - requires at least one testimonial item.
  - each item requires `quote`.
  - if `avatar.imageMediaId` is set, `avatar.alt` is required.
- Layout rules:
  - supports `columns` (2/3/4), `align` (left/center), `density` (comfortable/compact).
  - no rating field in MVP.

## WYSIWYG fields (locked)
WYSIWYG is allowed only for approved fields (no HTML/source mode):
- Event description
- MembershipPlan description (optional)

Allowed formatting:
- bold, italic, underline
- bullets, numbered
- link

## Media rules (MVP)
- Use hub-scoped Media library.
- Multi-file upload supported.
- Alt text required for all images.
- AppImage wrapper used for rendering.
- MUST follow `docs/product/media-library.md`.

## Header/Footer selection (locked)
Hub has global layout config:
- `globalHeaderId`, `globalFooterId`
Page can override:
- `headerIdOverride`, `footerIdOverride`

Headers/Footers are sections with variants:
- HeaderSection: standard|minimal|landing
- FooterSection: simple|columns|cta
