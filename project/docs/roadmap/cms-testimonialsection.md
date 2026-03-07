# CMS Section Doc: TestimonialSection (Canonical, Machine-Enforced)

Purpose:
- Define the canonical contract and CMS editor behavior for `TestimonialSection`.
- Provide social proof cards with an optional lead testimonial layout.
- Enforce layout-only variants (grid vs lead) and prevent semantic drift.
- Ensure renderer/editor/validation are aligned (single source of truth via schema).

Authority alignment:
- `AGENTS.md`
- `docs/codex-workflow.md`
- `docs/roadmap/section-composition-policy.md`
- `docs/roadmap/cms-fragment-catalogue.md` (v4)
- `docs/standards/engineering-source-of-truth.md`
- `docs/standards/drag-and-drop.md`
- `docs/product/cms-pages.md`
- `docs/product/media-library.md`

Hard rule:
- Codex MUST treat this document as canonical for `TestimonialSection`.
- Codex MUST implement this section using fragment-composed schemas per the fragment catalogue.
- Carousel behavior is not part of this section in MVP (explicitly out of scope).

Locked brainstorm decisions:
- Lead layout style: horizontal lead card (avatar left, quote right).
- Quote max length: 360 characters.
- Rating: removed for MVP.

---

## 0) Section identity (LOCKED)

Block type:
- `type: "TestimonialSection"`

Semantic purpose:
- Display testimonials as quote cards for marketing pages.
- Support one “lead” testimonial followed by a grid of additional testimonials.

Non-goals:
- Not a carousel/slider section.
- Not a review aggregation widget with star ratings (deferred).

---

## 1) Composition mapping (LOCKED)

TestimonialSection MUST be composed from:
- `SectionHeaderFragment` (descriptionMaxLength = 240)
- `GridLayoutFragment` (columns, align, density; lead behavior is section-owned)
- `QuoteItemFragment` repeatable items
- Optional: `CtaGroupFragment` at section level (0..2) — OPTIONAL for now

Notes:
- Quote items support optional avatar image with alt-at-authoring.
- Rating is explicitly excluded in MVP.

---

## 2) Canonical schema (single source of truth)

### 2.1 Required top-level fields
- `type: "TestimonialSection"`
- `variant: "grid" | "lead"` (required; default "grid")

### 2.2 Header fields (SectionHeaderFragment)
- `eyebrow?: string`
- `title?: string` (optional)
- `description?: string` (plain textarea; maxLength 240)

### 2.3 Layout fields (GridLayoutFragment)
- `columns?: 2 | 3 | 4` (default 3; applies to non-lead grid)
- `align?: "left" | "center"` (default "left")
- `density?: "comfortable" | "compact"` (default "comfortable")

Constraints (HARD):
- `layout="lead"` from GridLayoutFragment MUST NOT be exposed; this section uses its own `variant="lead"` semantics.
- Only columns/align/density apply.

### 2.4 Items (QuoteItemFragment)
- `items: Array<QuoteItem>`

QuoteItem fields (MVP canonical; rating removed):
- `id: string` (stable)
- `quote: string` (required for publish; plain; maxLength 360)
- `authorName?: string`
- `authorRole?: string`
- `authorOrg?: string`
- `avatar?: { imageMediaId: string, alt: string }` (optional; alt required if present)
- `badge?: Badge` (optional; BadgeFragment)

Constraints (HARD):
- No rating field in MVP.
- Avatar is image-only.
- If avatar selected, alt is required at authoring time.

### 2.5 Optional section CTAs (if enabled)
If enabled:
- `ctas?: Array<Cta>` (0..2) using CtaGroupFragment.
If not enabled:
- omit Actions group and do not render CTAs.

---

## 3) Variant behavior (Renderer contract)

### 3.1 variant="grid"
- Render SectionHeader above the grid.
- Render all testimonials as stacked cards in a grid.
- Use `columns` for grid layout at large screens, responsive stacking on smaller screens.

### 3.2 variant="lead" (HARD)
- First testimonial item is the “lead” card:
  - spans full width
  - horizontal layout:
    - avatar/media on the left
    - quote + author metadata on the right
- Remaining testimonials render as stacked cards in a grid using `columns`.

Fallback behavior:
- If items.length == 1:
  - render only the lead card.

Hard rule:
- Lead behavior is section-level only.
- MUST NOT add per-item layout toggles in MVP.

---

## 4) Editor UX contract (M3)

### 4.1 Groups (schema-driven)
Recommended groups:
1) `Core`
- eyebrow/title/description
- variant selector (grid/lead)
2) `Items`
- repeatable QuoteItem editor (add/remove/reorder)
3) `Advanced`
- columns, align, density
4) `Actions` (ONLY if section-level CTAs enabled)
- CTA editor (0..2)

Default open group (HARD):
- If items missing/invalid: open `Items`.
- Else open `Core`.

### 4.2 Repeatable editor requirements (HARD)
- MUST use shared repeatable item editor foundation.
- DnD MUST follow `docs/standards/drag-and-drop.md`:
  - vertical-only list
  - drag-handle-only
  - keyboard accessible
- Removing an item MUST use `ConfirmModal`.

Item editing fields:
- quote textarea (required; counter; maxLength 360)
- authorName/role/org inputs (optional)
- avatar media picker (optional) + alt required if selected
- badge editor (optional)

Progressive disclosure:
- Hide avatar alt field until avatar selected.
- Hide badge until “Add badge” (optional).

Performance:
- Keep non-selected item editors collapsed/summarized.
- Avoid full image previews for all items at once; show thumbnail only.

---

## 5) Readiness and publish gates (HARD)

### 5.1 Draft-ready (minimum)
Draft-ready when:
- `items.length >= 1`
- for each item:
  - `quote` non-empty
  - if avatar present: avatar.alt non-empty

### 5.2 Publish-ready (strict)
Publish-ready when:
- meets draft-ready
- plus:
  - CTAs valid if present (CTA rules)

### 5.3 Fields required count
`Fields required (N)` MUST count:
- missing quote
- missing avatar.alt when avatar selected

---

## 6) Media usageRefs integration (HARD)

For each item with avatar:
- MediaRefsExtractor MUST register `item.avatar.imageMediaId`

Deletion policy:
- Any referenced media must be protected from deletion by usageRefs rules.

---

## 7) Testing requirements (minimum)

Codex MUST add tests for:
1) Schema validation + readiness:
- requires >= 1 item
- quote required
- avatar alt required if avatar selected
- rating is not present in schema

2) Variant behavior smoke:
- lead variant uses first item as lead and does not require extra fields

3) Repeatable editor interactions:
- add testimonial
- remove testimonial (ConfirmModal)
- reorder testimonial (pointer + keyboard)

---

## 8) Non-negotiables / anti-patterns

- MUST NOT implement carousel/slider in MVP for testimonials.
- MUST NOT reintroduce rating in MVP.
- MUST NOT introduce per-item layout toggles in MVP.
- MUST NOT introduce inline styles; use tokenized `.module.css`.
- MUST NOT scatter schema logic in UI components; keep under `src/lib/cms/**`.

---

## 9) Deferred (explicit)

- Ratings/stars can be introduced later as a separate field with a separate doc update.
- Carousel may be introduced later only after a reusable carousel pattern exists.

---

## 10) Implementation notes (directional, not prescriptive)

Suggested files (directional):
- Schema: `src/lib/cms/schemas/testimonialSection.schema.js`
- Validator: `src/lib/cms/validation/testimonialSection.validation.js`
- Defaults: `src/lib/cms/defaults/testimonialSection.defaults.js`
- Renderer: `src/components/sections/testimonial/TestimonialSection.jsx` + module CSS
- Editor adapter (if needed): `src/lib/cms/editor/testimonialSection.editor.js`
