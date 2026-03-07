# CMS Section Doc: StatsSection (Canonical, Machine-Enforced)

Purpose:
- Define the canonical contract and CMS editor behavior for `StatsSection`.
- Provide a stats grid block for marketing pages with optional icon per stat.
- Enforce layout-only variants (cards vs split) without introducing semantic drift.
- Ensure renderer/editor/validation are aligned (single source of truth via schema).

Authority alignment:
- `AGENTS.md`
- `docs/codex-workflow.md`
- `docs/roadmap/section-composition-policy.md`
- `docs/roadmap/cms-fragment-catalogue.md` (v4 + IconRefFragment snippet)
- `docs/standards/engineering-source-of-truth.md`
- `docs/standards/drag-and-drop.md`
- `docs/product/cms-pages.md`

Hard rule:
- Codex MUST treat this document as canonical for `StatsSection`.
- Codex MUST implement this section using fragment-composed schemas per the fragment catalogue.
- If the repo does not yet include `IconRefFragment`, Codex MUST implement it per the approved snippet and update the catalogue as part of this slice.

---

## 0) Section identity (LOCKED)

Block type:
- `type: "StatsSection"`

Semantic purpose:
- Showcase key metrics (members, events, impact, ratings, etc.).
- Typical range: 2–8 items.

Non-goals:
- Not a dashboard analytics widget.
- Not a chart section.
- Not a testimonial section.

---

## 1) Composition mapping (LOCKED)

StatsSection MUST be composed from:
- `SectionHeaderFragment` (descriptionMaxLength = 180)
- `GridLayoutFragment` (columns, align, density; lead mode is NOT used for stats)
- `StatsItemFragment` repeatable items
- `CtaGroupFragment` at section level (0..2; OPTIONAL, enabled)

Notes:
- Stats items support optional icon via IconRefFragment.
- Badge support is optional per item (BadgeFragment).

---

## 2) Canonical schema (single source of truth)

### 2.1 Required top-level fields
- `type: "StatsSection"`
- `variant: "cards" | "split"` (required)

### 2.2 Header fields (SectionHeaderFragment)
- `eyebrow?: string`
- `title?: string` (optional)
- `description?: string` (plain textarea; maxLength 180)

### 2.3 CTA fields (CtaGroupFragment) — OPTIONAL
- `ctas?: Array<Cta>` (0..2) with standard CTA validation

### 2.4 Layout fields (GridLayoutFragment)
- `columns?: 2 | 3 | 4` (default 3; applies to both variants for the stats grid)
- `align?: "left" | "center"` (default "left")
- `density?: "comfortable" | "compact"` (default "comfortable")

Constraints (HARD):
- `layout="lead"` MUST NOT be exposed for StatsSection (no lead behavior).
- Only columns/align/density apply.

### 2.5 Items (StatsItemFragment)
- `items: Array<StatItem>`

StatItem fields (canonical):
- `id: string` (stable)
- `label: string` (required for publish)
- `value: string` (required for publish; string supports “10k+”, “£2m”, “4.9★”)
- `subtext?: string` (plain; maxLength 120 recommended)
- `badge?: Badge` (BadgeFragment; optional)
- `icon?: IconRef` (IconRefFragment; optional)

Icon constraints:
- If icon exists: `icon.name` is required and must be a valid Material Symbols name used by `primitives/icon/Icon.jsx`.

---

## 3) Variant behavior (Renderer contract)

### 3.1 variant="cards"
- Render SectionHeader above the stats grid.
- Render stats as cards/surfaces (tokenized), one card per stat item.
- Icon (if present) renders near value/label per design, using `primitives/icon/Icon.jsx`.

### 3.2 variant="split"
- Layout is two columns:
  - Left: header content (eyebrow/title/description + optional CTAs)
  - Right: stats grid
- Stats grid columns selectable: 2/3/4
- Ensure responsive behavior:
  - On small screens, stack header above grid.

Hard rule:
- Split is layout-only; item schema does not change.

---

## 4) Editor UX contract (M3)

### 4.1 Groups (schema-driven)
Recommended groups:
1) `Core`
- eyebrow/title/description
- variant selector (cards/split)
2) `Items`
- repeatable StatItem editor (add/remove/reorder)
3) `Actions`
- CTA editor (0..2), progressive disclosure
4) `Advanced`
- columns, align, density

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
- label input (required)
- value input (required)
- subtext textarea (optional; counter; maxLength 120)
- icon picker/input (optional; icon.name required if enabled)
- badge editor (optional)

Progressive disclosure:
- Hide icon fields until “Add icon” (optional, recommended).
- Hide badge fields until “Add badge” (optional, recommended).

Performance:
- Keep non-selected item editors collapsed/summarized.
- Avoid rendering all icons with heavy previews; icon rendering is lightweight.

---

## 5) Readiness and publish gates (HARD)

### 5.1 Draft-ready (minimum)
Draft-ready when:
- `items.length >= 1`
- for each item:
  - `label` non-empty
  - `value` non-empty
  - if icon exists: `icon.name` non-empty

### 5.2 Publish-ready (strict)
Publish-ready when:
- meets draft-ready
- plus:
  - CTAs valid if present (CTA rules)

### 5.3 Fields required count
`Fields required (N)` MUST count missing required fields across items:
- missing label
- missing value
- missing icon.name when icon enabled

---

## 6) Testing requirements (minimum)

Codex MUST add tests for:
1) Schema validation:
- requires at least 1 item for readiness
- label/value required
- icon.name required when icon present
- CTA validation smoke (javascript: rejected)

2) Readiness computation:
- correct missing-field counts

3) Repeatable editor interactions:
- add item
- remove item (ConfirmModal)
- reorder item (pointer + keyboard)

---

## 7) Non-negotiables / anti-patterns

- MUST NOT introduce row variant in MVP.
- MUST NOT allow lead layout in stats.
- MUST NOT move schema logic into UI components; keep under `src/lib/cms/**`.
- MUST NOT introduce inline styles; use tokenized `.module.css`.
- MUST NOT add charts here; charts would be a separate section type.

---

## 8) Implementation notes (directional, not prescriptive)

Suggested files (directional):
- Schema: `src/lib/cms/schemas/statsSection.schema.js`
- Validator: `src/lib/cms/validation/statsSection.validation.js`
- Defaults: `src/lib/cms/defaults/statsSection.defaults.js`
- Renderer: `src/components/sections/stats/StatsSection.jsx` + module CSS
- Editor adapter (if needed): `src/lib/cms/editor/statsSection.editor.js`

Codex MUST adhere to existing repo structure conventions.
