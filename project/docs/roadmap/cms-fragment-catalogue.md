# CMS Schema Fragment Catalogue (Canonical, Machine-Enforced) — v4 (Detailed)

Purpose:
- Define reusable schema fragments for CMS sections to achieve production-grade data composition
  without creating “god sections”.
- Provide a single source of truth for reusable field groups, validation rules, and editor metadata.
- Ensure section schemas remain semantic while reusing common contracts.

Authority alignment:
- `AGENTS.md`
- `docs/codex-workflow.md`
- `docs/roadmap/section-composition-policy.md`
- `docs/standards/engineering-source-of-truth.md`
- `docs/product/cms-pages.md`
- `docs/product/cms-block-registry.md`
- `docs/product/media-library.md`

Hard rules:
- Codex MUST compose section schemas from these fragments where applicable.
- Codex MUST NOT duplicate fragment logic ad-hoc inside individual sections when a fragment applies.
- Fragments are NOT React components; they are schema/validation/editor-metadata building blocks.
- Fragments MUST live in `src/lib/cms/**` (NOT in `src/components/**`).

---

## 0) Fragment conventions (HARD)

Each fragment MUST define:
- `fields`: canonical data shape
- `editorMeta`: grouping, labels, hints, maxLength, progressive disclosure rules
- `validation`: draft-ready and publish-ready contributions (field-level rules)
- `defaults`: optional defaults for new blocks/items
- `mediaRefsExtractor`: helper for media usageRefs maintenance (if fragment contains media)

Fragments MUST NOT:
- introduce section-level semantic identity
- define section-level readiness/publish gates alone (sections compose gates)

ID policy (HARD):
- Any repeatable item object MUST include a stable `id: string`.
- IDs MUST NOT be derived from array index.
- Generation SHOULD use `crypto.randomUUID()` with safe fallback.

---

## 1) SectionHeaderFragment (Hero/Feature/Accordion/Grid/etc.)

### Fields
- `eyebrow?: string`
- `title?: string`
- `description?: string` (plain text, NOT WYSIWYG)

### EditorMeta
Group: `Core`
- Description MUST be textarea.
- Section schema MUST provide `descriptionMaxLength`.
- Editor SHOULD show character counter.

### Validation
- Fragment itself requires nothing.
- Section schema decides if `title` is required for publish.

---

## 2) CtaGroupFragment (0..2 CTAs)

### Fields
- `ctas?: Array<Cta>` (0..2)

Cta:
- `id: string` (stable)
- `label: string` (required if CTA exists)
- `href: string` (required if CTA exists)
- `variant?: "primary" | "secondary" | "tertiary"` (optional; section may constrain)

### EditorMeta
Group: `Actions`
- Progressive disclosure:
  - no CTA fields until user clicks `Add CTA`
  - second CTA via `Add second CTA` (disabled at 2)
- CTA row editor:
  - label input
  - href input
  - optional variant selector if section supports

### Validation (HARD)
If a CTA exists:
- `label` non-empty
- `href` non-empty
- `href` MUST be:
  - internal path starting with `/`, OR
  - external URL starting with `https://` or `http://` (prefer https)
Forbidden schemes:
- `javascript:`
- `data:`
- `vbscript:`

### Rendering (HARD)
- Internal href MUST render via Next.js `Link`.
- External href MUST render via `<a target="_blank" rel="noopener noreferrer">`.

---

## 3) MediaFragment (image/video reference with alt override)

Purpose:
- Use Media Library assets without relying on asset-level alt as the only accessibility source.
- Enforce “alt at authoring time” when required by section gates (Hero/Feature do).

### Fields
MediaRef:
- `mediaId: string`
- `kind: "image" | "video"`
- `alt: string` (required when section requires alt-at-authoring)
- `placement?: "background" | "featured"` (section-owned constraints)
- Video-only:
  - `posterMediaId?: string` (recommended)
- Layout hint:
  - `aspect?: "auto" | "16:9" | "4:3" | "1:1"`

### EditorMeta
Group: `Media`
- Media selection MUST use Media Library selector.
- Alt is edited at usage-time (in section/item editor), not upload-time.
- If kind is video, editor SHOULD prompt for poster selection if missing.

### Validation
If `mediaId` exists:
- `kind` required
- `alt` required when section requires alt-at-authoring
If `kind=="video"`:
- poster recommended (unless section requires)

### MediaRefsExtractor
- include `mediaId`
- include `posterMediaId` when present

---

## 4) SectionLayoutFragment (section-level layout-only configuration)

Rename notice:
- Supersedes prior `LayoutVariantFragment` naming.

### Fields
- `textAlign?: "left" | "center"`
- `contentAlign?: "left" | "center"`
- `mediaPosition?: "left" | "right"`
- `splitRatio?: "50-50" | "60-40" | "40-60"`
- `backgroundTone?: "surface" | "muted" | "brand" | "inverse"`

### Constraints (HARD)
- Section-only; MUST NOT be used for per-item orientation.
- Layout-only; MUST NOT simulate semantic differences.

### EditorMeta
Group: `Advanced` (collapsed by default).

---

## 5) GridLayoutFragment (card-grid section layout)

### Fields
- `layout?: "grid" | "lead"` (default `"grid"`)
- `columns?: 2 | 3 | 4` (default 3; applies only when layout="grid")
- `align?: "left" | "center"` (default left)
- `density?: "comfortable" | "compact"` (default comfortable)

### Lead behavior (HARD)
If `layout=="lead"`:
- First item is “lead”:
  - spans full width
  - horizontal card layout (media left, content right)
- Remaining items:
  - stacked cards in a grid
- Lead is section-level only (no per-item layout toggles in MVP).

### EditorMeta
Group: `Advanced` (collapsed by default).

---

## 6) BadgeFragment (optional small tag)

### Fields
Badge:
- `badge?: {`
  - `text: string`
  - `tone?: "neutral" | "brand" | "success" | "warning" | "danger"`
`}`

### Validation
If badge exists:
- `text` non-empty
- Recommend <= 24 chars (section may enforce)

### EditorMeta
- When used in repeatables, badge editor belongs in the `Items` group.

---

## 7) CardItemFragment (generic cards used by GridSection)

Note:
- `badge` explicitly uses **BadgeFragment**.

### Fields
CardItem:
- `id: string`
- `title: string` (required for publish)
- `description?: string` (plain; section provides maxLength, recommend 200)
- `media?: {`
  - `imageMediaId: string`
  - `alt: string` (required when imageMediaId set; authoring-time)
`}`
- `badge?: Badge` (BadgeFragment)

### Constraints (HARD)
- Per-card media is IMAGE ONLY for performance.
- Video is supported in Hero/Feature or dedicated video sections only.

### EditorMeta
Group: `Items`
- title input (required)
- description textarea with counter (optional)
- media picker (optional)
- alt input shown/required when media picked
- badge editor (optional)

### MediaRefsExtractor
- include imageMediaId when present

---

## 8) PersonItemFragment (Team members)

Note:
- `badge` explicitly uses **BadgeFragment**.

### Fields
PersonItem:
- `id: string`
- `name: string` (required for publish)
- `role?: string`
- `bio?: string` (plain; section provides maxLength, recommend 240)
- `avatar?: { imageMediaId: string, alt: string }` (optional; alt required if present)
- `badge?: Badge` (BadgeFragment)
- `socialLinks?: Array<SocialLink>` (0..3)

SocialLink:
- `id: string` (stable)
- `platform: "x" | "linkedin" | "facebook"`
- `href: string` (required; MUST start with `https://`)

### Constraints (Hard)
- avatar is image-only.
- platform limited to enum above.
- href MUST be https.
- forbidden schemes: `javascript:`, `data:`, `vbscript:`.
- render icons only; require aria-label in TeamSection renderer.

### EditorMeta
Group: `Items`
- repeatable editor + DnD
- nested links editor SHOULD be lazy-mounted if implemented

### MediaRefsExtractor
- include avatar.imageMediaId when present

---

## 9) QuoteItemFragment (Testimonials)

Note:
- `badge` explicitly uses **BadgeFragment**.

### Fields
QuoteItem:
- `id: string`
- `quote: string` (required for publish; plain; recommend maxLength 360)
- `authorName?: string`
- `authorRole?: string`
- `authorOrg?: string`
- `avatar?: { imageMediaId: string, alt: string }` (optional; alt required if present)
- `rating?: 1 | 2 | 3 | 4 | 5` (optional)
- `badge?: Badge` (BadgeFragment)

### EditorMeta
Group: `Items`
- quote textarea with counter
- repeatable editor + DnD

### MediaRefsExtractor
- include avatar.imageMediaId when present

---

## 10) MoneyFragment (currency-aware pricing building block)

Purpose:
- Avoid costly refactors by making pricing currency-aware now.
- Provide a stable money shape usable for MembershipPlans and Pricing tiers later.

### Fields
Money:
- `amountMinor: number` (integer, e.g. 1000 for £10.00)
- `currency: "GBP" | "USD" | "EUR"`
- `display?: string` (optional derived display string)

### Constraints (HARD)
- `amountMinor` MUST be >= 0.
- Currency MUST be one of: GBP/USD/EUR.

---

## 11) PriceTierFragment (Pricing tiers)

Note:
- Uses **MoneyFragment** and **BadgeFragment**.

### Fields
PriceTier:
- `id: string`
- `name: string` (required for publish)
- `description?: string` (plain; recommend maxLength 200)
- `isFree?: boolean` (default false)
- `price?: Money` (MoneyFragment; required when isFree is false)
- `interval?: "once" | "month" | "year"` (optional)
- `features?: Array<{ id: string, text: string }>` (repeatable; text required)
- `highlight?: boolean` (optional)
- `badge?: Badge` (BadgeFragment)
- `cta?: Cta` (optional; per-tier CTA 0..1)

### Constraints (HARD)
- If `isFree==true`: `price` MUST be absent or ignored.
- If `isFree==false`: `price` MUST be present.
- If `cta` present: validate label+href via CTA rules.

### EditorMeta
Group: `Items`
- tier editor lazy-mounted
- nested features list uses repeatable foundation

---

## 12) LogoItemFragment (LogoCloud/LogoMarquee)

### Fields
LogoItem:
- `id: string`
- `imageMediaId: string` (required)
- `alt: string` (required; authoring-time)
- `href?: string`
- `name?: string`

Constraints:
- href MUST follow CTA href validation rules.

MediaRefsExtractor:
- include imageMediaId

---

## IconRefFragment (optional icon reference)

Purpose:
- Provide a stable, reusable icon reference contract for CMS-authored items (e.g. stats).
- Rendered via `primitives/icon/Icon.jsx` using Google Material Symbols (name-based).

Fields:
IconRef:
- `icon?: {`
  - `name: string` (required if icon exists)
  - `tone?: "neutral" | "brand" | "success" | "warning" | "danger"` (optional; default "neutral")
`}`

Constraints (HARD):
- `name` MUST be a valid Material Symbols icon name used by `primitives/icon/Icon.jsx`.
- IconRef is not media; it MUST NOT use Media Library.
- If `icon` exists, `icon.name` MUST be non-empty.

EditorMeta:
- Icon belongs in the `Items` group when used in repeatable items.
- Icon editing SHOULD be a constrained picker if available; otherwise a string input with guidance text.

## 13) StatsItemFragment

Note:
- `badge` explicitly uses **BadgeFragment**.

### Fields
StatItem:
- `id: string`
- `label: string` (required for publish)
- `value: string` (required for publish)
- `subtext?: string` (plain; recommend maxLength 120)
- `badge?: Badge` (BadgeFragment)
- `icon?: IconRef` (IconRefFragment)

---

## 14) EventsSection policy (REMOVED from CMS by default)

Decision (LOCKED):
- Events are created and managed by hub admins in their admin portal.
- Therefore, Events are not authored as CMS content blocks by default.

Optional future enhancement:
- A CMS EventsSection may be introduced later that QUERIES published events.
- If introduced later, it MUST be documented as a separate section type and MUST follow Next.js caching standards.

---

## 15) Section composition mappings (LOCKED references)

### 15.1 HeroSection mapping (detailed)
HeroSection MUST be composed from:
- SectionHeaderFragment (descriptionMaxLength = 280)
- CtaGroupFragment (0..2)
- MediaFragment (image/video)
- SectionLayoutFragment

Hero constraints (LOCKED):
- `variant: "centered" | "split"` only.
- `title` required for publish.
- `centered`:
  - media optional; placement background only
  - backgroundTone supported
  - textAlign supported
- `split`:
  - media required; placement featured only
  - mediaPosition supported
  - splitRatio supported
  - contentAlign supported
- Alt required at authoring time when media present.

### 15.2 FeatureSection mapping (detailed)
FeatureSection MUST be composed from:
- SectionHeaderFragment (descriptionMaxLength = 280)
- CtaGroupFragment (0..2)
- MediaFragment (image/video)
- SectionLayoutFragment

Feature constraints (LOCKED):
- `variant: "centered" | "split"` only.
- `title` required for publish.
- `split`: media required (featured placement).
- `centered`: media optional and controlled by `centeredMediaMode: "none" | "background" | "inline"`.
- If `centeredMediaMode=="none"`: centered media does not render and media is not required.
- If `centeredMediaMode=="background"` or `"inline"`: `media.mediaId` and `media.alt` are required.
- Alt required at authoring time when media present.

### 15.3 GridSection mapping (detailed)
GridSection MUST be composed from:
- SectionHeaderFragment (descriptionMaxLength = 240)
- GridLayoutFragment
- items: CardItem[] (CardItemFragment)
- optional CtaGroupFragment at section-level (optional)

Grid constraints:
- publish-ready:
  - items.length >= 1
  - each item requires title
  - if item has media.imageMediaId: alt required (authoring-time)

### 15.4 TeamSection mapping
TeamSection MUST be composed from:
- SectionHeaderFragment (descriptionMaxLength = 240)
- GridLayoutFragment
- items: PersonItem[] (PersonItemFragment)
- optional CtaGroupFragment at section-level (0..2)

Team constraints:
- publish-ready:
  - items.length >= 1
  - each member requires name
  - if avatar present: alt required
  - if social links present: platform enum + https href required
  - CTA validation applies when CTA rows are present
  - GridLayoutFragment `layout="lead"` is not used for TeamSection; only columns/align/density apply

### 15.5 TestimonialSection mapping
TestimonialSection MUST be composed from:
- SectionHeaderFragment (descriptionMaxLength = 240)
- GridLayoutFragment
- items: QuoteItem[] (QuoteItemFragment)

Constraints:
- publish-ready:
  - items.length >= 1
  - quote required

### 15.6 PricingSection mapping
PricingSection MUST be composed from:
- SectionHeaderFragment (descriptionMaxLength = 240)
- GridLayoutFragment
- items: PriceTier[] (PriceTierFragment)

Constraints:
- publish-ready:
  - items.length >= 1
  - tier name required
  - MoneyFragment enforced for paid tiers

### 15.7 LogoCloudSection mapping
LogoCloudSection MUST be composed from:
- SectionHeaderFragment (optional; descriptionMaxLength = 180)
- GridLayoutFragment
- items: LogoItem[] (LogoItemFragment)

Constraints:
- publish-ready:
  - items.length >= 1
  - each logo requires imageMediaId + alt

### 15.8 StatsSection mapping
StatsSection MUST be composed from:
- SectionHeaderFragment (optional; descriptionMaxLength = 180)
- GridLayoutFragment
- items: StatItem[] (StatsItemFragment)
- optional CtaGroupFragment at section-level (0..2)

Constraints:
- publish-ready:
  - items.length >= 1
  - label + value required
  - if icon exists: icon.name required
  - CTA validation applies when CTA rows are present
  - GridLayoutFragment `layout=\"lead\"` is not used for StatsSection; only columns/align/density apply

---

## 16) Next steps (planned)
Create concrete section docs as you implement each migration:
- `docs/roadmap/cms-herosection.md`
- `docs/roadmap/cms-featuresection.md`
- `docs/roadmap/cms-gridsection.md`
- `docs/roadmap/cms-teamsection.md`
- `docs/roadmap/cms-testimonialsection.md`
- `docs/roadmap/cms-pricingsection.md`
- `docs/roadmap/cms-logocloudsection.md`
- `docs/roadmap/cms-statssection.md`
