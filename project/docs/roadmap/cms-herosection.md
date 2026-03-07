# CMS Section Doc: HeroSection (Canonical, Machine-Enforced)

Purpose:
- Define the canonical contract and CMS editor behavior for `HeroSection`.
- Prevent variant bloat and ensure predictable authoring UX.
- Ensure renderer/editor/validation are aligned (single source of truth via schema).

Authority alignment:
- `AGENTS.md`
- `docs/codex-workflow.md`
- `docs/roadmap/section-composition-policy.md`
- `docs/roadmap/cms-fragment-catalogue.md` (v4)
- `docs/standards/engineering-source-of-truth.md`
- `docs/standards/nextjs-runtime-performance.md`
- `docs/product/cms-pages.md`
- `docs/product/media-library.md`

Hard rule:
- Codex MUST treat this document as canonical for `HeroSection`.
- Codex MUST NOT implement `HeroSection` in a way that contradicts fragment catalogue constraints.

---

## 0) Section identity (LOCKED)

Block type:
- `type: "HeroSection"`

Semantic purpose:
- Attention-grabbing, above-the-fold section.
- Primary page entry point and key CTA surface.

Non-goals:
- Hero carousel/slider is NOT part of this section.
  - If needed later, it must be a separate section type (e.g. `HeroCarouselSection`) with its own doc.

---

## 1) Composition mapping (LOCKED)

HeroSection MUST be composed from:
- `SectionHeaderFragment` (descriptionMaxLength = 280)
- `CtaGroupFragment` (0..2)
- `MediaFragment` (image/video)
- `SectionLayoutFragment` (section-level layout-only fields)

Reference:
- `docs/roadmap/cms-fragment-catalogue.md` section “HeroSection mapping (detailed)”

---

## 2) Canonical schema (single source of truth)

### 2.1 Required top-level fields
- `type: "HeroSection"`
- `variant: "centered" | "split"` (required)

### 2.2 Header fields (SectionHeaderFragment)
- `eyebrow?: string`
- `title: string` (REQUIRED for publish)
- `description?: string` (plain textarea, maxLength 280)

### 2.3 CTA fields (CtaGroupFragment)
- `ctas?: Array<Cta>` (0..2, progressive disclosure)
- CTA validation per catalogue rules (internal/external validation + forbidden schemes).

### 2.4 Media fields (MediaFragment)
Hero media is expressed as:
- `media?: MediaRef` for centered variant
- `media: MediaRef` for split variant (required)

MediaRef fields per catalogue:
- `mediaId: string`
- `kind: "image" | "video"`
- `alt: string` (REQUIRED at authoring time when media exists)
- `posterMediaId?: string` (recommended when kind="video")
- `aspect?: "auto" | "16:9" | "4:3" | "1:1"` (optional)

Placement constraints (LOCKED):
- centered variant:
  - placement is background only (conceptual). Do not expose `placement` in schema; renderer enforces background rendering.
- split variant:
  - placement is featured only (conceptual). Do not expose `placement` in schema; renderer enforces featured rendering.

### 2.5 Layout fields (SectionLayoutFragment)
Allowed fields by variant:

Centered:
- `backgroundTone?: "surface" | "muted" | "brand" | "inverse"` (default "surface")
- `textAlign?: "left" | "center"` (default "center")

Split:
- `mediaPosition?: "left" | "right"` (default "right")
- `splitRatio?: "50-50" | "60-40" | "40-60"` (default "50-50")
- `contentAlign?: "left" | "center"` (default "left")

Forbidden:
- `textAlign` must NOT apply to split.
- `mediaPosition`, `splitRatio`, `contentAlign` must NOT apply to centered.
- Right text alignment is forbidden (alignment options are left|center only).

---

## 3) Editor UX contract (M3)

### 3.1 Groups (schema-driven)
The section editor MUST render groups via the shared grouped editor shell (Accordion-based), using schema metadata.

Recommended groups:
1) `Core`
- eyebrow
- title (required)
- description (optional, maxLength 280 + counter)
- variant selector

2) `Actions`
- CTA group editor (0..2), progressive disclosure

3) `Media`
- For centered:
  - optional media selection (image or video)
  - alt input required if media selected
- For split:
  - required media selection (image or video)
  - alt input required
  - poster selection recommended for video

4) `Advanced`
- centered only:
  - backgroundTone
  - textAlign
- split only:
  - mediaPosition
  - splitRatio
  - contentAlign

Default open group (HARD):
- Must be the first group containing required fields for the current variant:
  - Always open `Core` by default (contains required title and variant).
  - If variant is split and media missing, `Media` should also show readiness indicator.

### 3.2 Progressive disclosure rules
- CTA fields hidden until “Add CTA”.
- Video poster field shown only if kind="video".

### 3.3 Performance rules
- WYSIWYG is not used in Hero (description is plain). No heavy editor.
- Media panel should not eagerly mount heavy preview components for non-selected media.
- No always-mounted modals; mount Media Library selector only when invoked.

---

## 4) Readiness and publish gates (HARD)

### 4.1 Draft-ready (minimum)
Draft-ready when:
- `variant` set
- `title` non-empty
- If variant is split:
  - `media.mediaId` present
  - `media.alt` non-empty
- If variant is centered and media is selected:
  - `media.alt` non-empty

### 4.2 Publish-ready (strict)
Publish-ready when:
- meets draft-ready
- plus:
  - CTAs valid if present (label/href + safe scheme rules)

### 4.3 Validation messaging (required)
If not publish-ready, the UI MUST display actionable reasons, e.g.:
- “Title is required”
- “Split hero requires a featured image or video”
- “Alt text is required for hero media”
- “CTA href must start with / or https://”

---

## 5) Renderer contract (public/runtime)

### 5.1 Default behavior
- Renderer MUST support both variants:
  - centered: text block on top of background tone or background media
  - split: content + featured media in a split layout
- Renderer MUST render CTAs using CTA link rules:
  - internal -> Next Link
  - external -> anchor with rel/target
- Renderer MUST use `ui/image/AppImage.jsx` for images.
- Renderer MUST support video rendering per existing media strategy:
  - must not autoplay by default (recommended)
  - must respect reduced-motion preferences when applicable

### 5.2 Accessibility
- Must ensure sufficient contrast for text on background media:
  - if background media used, apply tokenized overlay or tone strategy to preserve readability.
- Alt text MUST be applied to images.
- Video must have poster when available and controls as appropriate.

---

## 6) Media usageRefs integration (HARD)

If hero has media:
- MediaRefsExtractor MUST register `media.mediaId`
- If video with poster:
  - Must register `media.posterMediaId`

Deletion policy:
- If a media asset is referenced by HeroSection, it MUST be protected from deletion by usageRefs rules.

---

## 7) Testing requirements (minimum)

Codex MUST add tests for:
1) Schema validation:
- centered variant passes without media
- centered variant with media requires alt
- split variant requires mediaId and alt

2) Readiness computation:
- verifies correct `Ready` vs `Fields required (N)` outcomes

3) CTA validation smoke:
- invalid scheme rejected (`javascript:`)
- internal path accepted
- https external accepted

---

## 8) Non-negotiables / anti-patterns

- MUST NOT create a “HeroCarousel” variant.
- MUST NOT add new semantic variants beyond centered/split.
- MUST NOT add right alignment options.
- MUST NOT move hero schema logic into UI components; keep in schema/validation layer under `src/lib/cms/**`.
- MUST NOT introduce inline styles; must use tokenized `.module.css`.

---

## 9) Implementation notes (directional, not prescriptive)

Suggested files (directional):
- Schema: `src/lib/cms/schemas/heroSection.schema.js`
- Validator: `src/lib/cms/validation/heroSection.validation.js`
- Defaults: `src/lib/cms/defaults/heroSection.defaults.js`
- Renderer: `src/components/sections/hero/HeroSection.jsx` + module CSS
- Editor adapter (if needed): `src/lib/cms/editor/heroSection.editor.js`

Codex MUST adhere to existing repo structure conventions.
