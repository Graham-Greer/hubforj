# CMS Section Doc: GridSection (Canonical, Machine-Enforced)

Purpose:
- Define the canonical contract and CMS editor behavior for `GridSection`.
- Provide a generic card-grid section for marketing content (features/services/benefits/resources).
- Enforce layout-only variants (grid vs lead) and prevent semantic drift.
- Ensure renderer/editor/validation are aligned (single source of truth via schema).

Authority alignment:
- `AGENTS.md`
- `docs/codex-workflow.md`
- `docs/roadmap/section-composition-policy.md`
- `docs/roadmap/cms-fragment-catalogue.md` (v4)
- `docs/standards/engineering-source-of-truth.md`
- `docs/standards/drag-and-drop.md` (repeatable items + reorder)
- `docs/product/cms-pages.md`
- `docs/product/media-library.md`

Hard rule:
- Codex MUST treat this document as canonical for `GridSection`.
- Codex MUST implement this section using fragment-composed schemas per the fragment catalogue.
- If any required fragment is missing, Codex MUST implement it per the catalogue in the same slice (or stop and propose a doc update).

---

## 0) Section identity (LOCKED)

Block type:
- `type: "GridSection"`

Semantic purpose:
- Render a list of “card items” in a grid layout.
- Reusable for many marketing use cases without embedding unrelated semantics (team/pricing/testimonials are separate sections).

Non-goals:
- Not a Team section.
- Not a Pricing section.
- Not a Testimonials section.
- Not a carousel/slider.

---

## 1) Composition mapping (LOCKED)

GridSection MUST be composed from:
- `SectionHeaderFragment` (descriptionMaxLength = 240)
- `GridLayoutFragment`
- `CardItemFragment` repeatable items (0..N; publish requires >= 1)
- Optional: `CtaGroupFragment` at section level (0..2) — OPTIONAL for now
  - If not implemented yet, omit and document as future enablement.

Reference:
- `docs/roadmap/cms-fragment-catalogue.md` section “GridSection mapping (detailed)”

---

## 2) Canonical schema (single source of truth)

### 2.1 Required top-level fields
- `type: "GridSection"`
- `layout?: "grid" | "lead"` (default "grid")
- `columns?: 2 | 3 | 4` (default 3; only applies when layout="grid")
- `align?: "left" | "center"` (default "left")
- `density?: "comfortable" | "compact"` (default "comfortable")

### 2.2 Header fields (SectionHeaderFragment)
- `eyebrow?: string`
- `title?: string` (optional by section; recommended optional)
- `description?: string` (plain textarea; maxLength 240)

### 2.3 Items (CardItemFragment)
- `items: Array<CardItem>`

CardItem fields per fragment catalogue:
- `id: string` (stable)
- `title: string` (required for publish)
- `description?: string` (plain; maxLength 200 recommended)
- `media?: { imageMediaId: string, alt: string }` (optional; IMAGE ONLY; alt required when present)
- `badge?: { text, tone }` (optional; BadgeFragment)

Constraints (HARD):
- Per-item media is image-only (no per-card video).
- Alt is required at authoring time if image is selected.

### 2.4 Optional section CTAs (if enabled)
If enabled for this section:
- `ctas?: Array<Cta>` (0..2) using CtaGroupFragment.
If not enabled:
- Section does not render CTAs and editor does not show Actions group.

---

## 3) Layout behavior (Renderer contract)

### 3.1 layout="grid"
- Render items as stacked cards in a grid with `columns`.
- Columns allowed: 2, 3, 4 only.
- `align` controls text alignment within cards (left|center).
- `density` controls spacing/padding via tokens (compact vs comfortable).

### 3.2 layout="lead" (HARD)
- First item MUST render as a “lead” card:
  - spans full width (grid column span = all)
  - horizontal card layout (image left, content right)
- Remaining items MUST render as stacked cards in a grid (like layout="grid").
- There MUST NOT be per-item layout toggles in MVP.

Fallback behavior:
- If items.length == 1 and layout="lead":
  - render single lead card only.

---

## 4) Editor UX contract (M3)

### 4.1 Groups (schema-driven)
The section editor MUST use the shared grouped editor shell.

Recommended groups:
1) `Core`
- eyebrow/title/description
2) `Items`
- repeatable CardItem editor (add/remove/reorder)
3) `Advanced`
- layout, columns, align, density
4) `Actions` (ONLY if section-level CTAs are enabled)
- CTA editor (0..2)

Default open group (HARD):
- If items are missing or invalid: open `Items` by default.
- Otherwise open `Core` by default.

### 4.2 Repeatable editor requirements (HARD)
- MUST use shared repeatable item editor foundation.
- Must support add/remove/reorder.
- DnD MUST follow `docs/standards/drag-and-drop.md`:
  - vertical-only list
  - drag-handle-only
  - keyboard accessible
- Removing an item MUST use `ConfirmModal`.

Item editing:
- title input (required)
- description textarea (optional; counter; maxLength 200)
- image media picker (optional)
- alt input required if image is selected
- badge editor (optional)

Progressive disclosure:
- Hide alt field until media selected.
- Badge fields hidden until “Add badge” (optional, recommended).

Performance:
- Keep non-selected item editors collapsed or summarized.
- Avoid mounting media picker/modals until invoked.
- Avoid rendering full image previews for all items at once; show thumbnail only.

---

## 5) Readiness and publish gates (HARD)

### 5.1 Draft-ready (minimum)
Draft-ready when:
- `items.length >= 1`
- for each item:
  - `title` non-empty
  - if item has `media.imageMediaId`, then `media.alt` non-empty

Title at section level is optional (draft and publish) for GridSection.

### 5.2 Publish-ready (strict)
Publish-ready when:
- meets draft-ready
- plus:
  - if section-level CTAs exist: CTA validation passes (per fragment rules)

### 5.3 Fields required count
`Fields required (N)` MUST count missing required fields across all items:
- missing item.title
- missing item.media.alt when image selected

---

## 6) Media usageRefs integration (HARD)

For each item with image media:
- MediaRefsExtractor MUST register `item.media.imageMediaId`

Deletion policy:
- Any referenced media must be protected from deletion by usageRefs rules.

---

## 7) Testing requirements (minimum)

Codex MUST add tests for:
1) Schema validation:
- items required for draft/publish readiness
- item title required
- alt required when media selected
- layout lead rules do not require extra fields (pure render concern)

2) Readiness computation:
- counts missing fields correctly for `Fields required (N)`

3) Repeatable editor interactions:
- add item
- remove item (ConfirmModal)
- reorder item via DnD (pointer + keyboard)

---

## 8) Non-negotiables / anti-patterns

- MUST NOT introduce semantic variants (team/pricing/testimonial) into GridSection.
- MUST NOT add per-item layout toggles in MVP.
- MUST NOT allow video per card.
- MUST NOT introduce inline styles; use tokenized `.module.css`.
- MUST NOT scatter schema logic in UI components; keep schema/validation under `src/lib/cms/**`.

---

## 9) Implementation notes (directional, not prescriptive)

Suggested files (directional):
- Schema: `src/lib/cms/schemas/gridSection.schema.js`
- Validator: `src/lib/cms/validation/gridSection.validation.js`
- Defaults: `src/lib/cms/defaults/gridSection.defaults.js`
- Renderer: `src/components/sections/grid/GridSection.jsx` + module CSS
- Editor adapter (if needed): `src/lib/cms/editor/gridSection.editor.js`

Codex MUST adhere to existing repo structure conventions.
