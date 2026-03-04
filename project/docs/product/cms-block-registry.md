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
    "heading": "Welcome",
    "subheading": "Join the community",
    "imageMediaId": "media_abc",
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
- RichTextSection
- CTASection (centered|split)
- FeatureGridSection (2col|3col|4col)
- AccordionSection (default)
- EventListSection (upcoming|featured|category)
- ContactSection (card|split)
- LogoMarqueeSection (marquee|grid)
- PricingSection (3tier|enterprise)
- StatsSection (row|cards)
- TeamSection (grid|withLead)
- TestimonialsSection (grid|spotlight)
- LegalDocumentSection
- SectionRenderFallback

Variant metadata contract:
- Registry definitions SHOULD include `variantDescriptions` for library cards.
- Registry definitions SHOULD include per-variant preview mock props for live preview.

## WYSIWYG fields (locked)
WYSIWYG is allowed only for approved fields (no HTML/source mode):
- RichTextSection content
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
