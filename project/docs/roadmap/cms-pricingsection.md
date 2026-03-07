# CMS Section Doc: PricingSection (Canonical, Machine-Enforced)

Purpose:
- Define the canonical contract and CMS editor behavior for `PricingSection`.
- Provide pricing tiers as cards (tiers-only MVP).
- Enforce production-grade money modeling (GBP/USD/EUR) to avoid costly refactors.
- Provide a clear, non-nested editor UX for tier + features editing (two-pane master/detail).
- Ensure renderer/editor/validation are aligned (single source of truth via schema).

Authority alignment:
- `AGENTS.md`
- `docs/codex-workflow.md`
- `docs/roadmap/section-composition-policy.md`
- `docs/roadmap/cms-fragment-catalogue.md` (v4)
- `docs/standards/engineering-source-of-truth.md`
- `docs/standards/drag-and-drop.md`
- `docs/product/cms-pages.md`

Locked brainstorm decisions:
- Variants: tiers-only (no comparison table in MVP)
- Tier count: 1–4
- Editor UX: **two-pane** master/detail (NO accordion-in-accordion)
- Currency: per-tier (MoneyFragment)

Hard rule:
- Codex MUST treat this document as canonical for `PricingSection`.
- Codex MUST implement this section using fragment-composed schemas per the fragment catalogue.
- Codex MUST follow the two-pane editor UX requirements in section 4 exactly.

---

## 0) Section identity (LOCKED)

Block type:
- `type: "PricingSection"`

Semantic purpose:
- Display 1–4 pricing tiers as cards.
- Typical use: membership plans, subscriptions, service packages.

Non-goals:
- Comparison-table pricing is NOT in MVP.
- Carousel pricing is NOT in MVP.

---

## 1) Composition mapping (LOCKED)

PricingSection MUST be composed from:
- `SectionHeaderFragment` (descriptionMaxLength = 240)
- `GridLayoutFragment` (columns/align/density; NO lead mode)
- `PriceTierFragment` repeatable items (1..4 required for publish)
- Optional: `CtaGroupFragment` at section level (0..2) — OPTIONAL for now
  - Primary CTAs usually exist per-tier; section-level CTAs may be used for ancillary actions.

Notes:
- PriceTierFragment MUST use MoneyFragment:
  - `currency: GBP|USD|EUR`
  - `amountMinor: integer`
- BadgeFragment may be used on tiers (e.g. “Best value”).

---

## 2) Canonical schema (single source of truth)

### 2.1 Required top-level fields
- `type: "PricingSection"`
- `variant: "tiers"` (required; ONLY allowed value in MVP)

### 2.2 Header fields (SectionHeaderFragment)
- `eyebrow?: string`
- `title?: string` (optional)
- `description?: string` (plain textarea; maxLength 240)

### 2.3 Layout fields (GridLayoutFragment)
- `columns?: 1 | 2 | 3 | 4` (default 3; clamped to item count at render time)
- `align?: "left" | "center"` (default "left")
- `density?: "comfortable" | "compact"` (default "comfortable")

Constraints (HARD):
- `layout="lead"` MUST NOT be exposed.
- Only columns/align/density apply.

### 2.4 Items (PriceTierFragment)
- `items: Array<PriceTier>`

Tier constraints (HARD):
- Tier count MUST be 1–4 (enforced by schema + editor controls).
- Each tier requires stable `id`.

PriceTier fields (canonical; per fragment catalogue v4):
- `id: string`
- `name: string` (required for publish)
- `description?: string` (plain; maxLength 200 recommended)
- `isFree?: boolean` (default false)
- `price?: Money` (required when isFree=false)
- `interval?: "once" | "month" | "year"` (optional; recommended when price exists)
- `features?: Array<{ id: string, text: string }>` (repeatable; text required)
- `highlight?: boolean` (optional)
- `badge?: Badge` (optional)
- `cta?: Cta` (optional; per-tier 0..1)

MoneyFragment (per tier):
- `amountMinor: number` (integer >= 0)
- `currency: "GBP" | "USD" | "EUR"`

---

## 3) Renderer contract (public/runtime)

### 3.1 Variant behavior (tiers)
- Render SectionHeader above tier cards.
- Render tier cards in a responsive grid:
  - use `columns` at large screens
  - reduce columns responsively on smaller screens
- Tier card content:
  - name, description
  - price display:
    - if isFree: show “Free”
    - else: format amountMinor + currency
  - interval label if present (month/year/once)
  - features list
  - badge + highlight styling if present
  - per-tier CTA button/link if present

### 3.2 Accessibility
- Buttons/links must be keyboard operable.
- Badge and highlight must not be color-only cues; include semantics in markup (e.g., text label).

---

## 4) Editor UX contract (M3) — TWO-PANE MASTER/DETAIL (HARD)

Goal:
- Avoid accordion-in-accordion nesting.
- Make tier editing fast while keeping feature editing manageable.

### 4.1 Groups (schema-driven)
Recommended groups:
1) `Core`
- eyebrow/title/description
- variant (fixed to tiers; display read-only or hidden)
2) `Items` (TWO-PANE TIER EDITOR — REQUIRED)
3) `Advanced`
- columns/align/density
4) `Actions` (ONLY if section-level CTAs enabled)
- section-level CTA editor (0..2)

Default open group (HARD):
- If items missing/invalid: open `Items`.
- Else open `Core`.

### 4.2 Items group MUST use a two-pane layout (HARD)

Within the `Items` group, the UI MUST be structured as:

**Left pane: Tier list (master)**
- Displays tiers as a vertical list.
- Each row shows:
  - tier name (or “Untitled tier”)
  - optional badge text
  - highlight indicator
- Supports:
  - Add tier (disabled when count=4)
  - Remove tier (ConfirmModal)
  - Reorder tiers (DnD, drag-handle-only, keyboard accessible)
  - Select tier (click row sets activeTierId)

**Right pane: Tier editor (detail)**
- Only renders the editor for the currently selected tier.
- MUST NOT render all tiers expanded at once.
- MUST include:
  - name (required)
  - description (optional; counter; maxLength 200)
  - isFree toggle
  - If isFree=false:
    - currency select (GBP/USD/EUR)
    - amount input (major units UI is allowed; convert to amountMinor in state)
    - interval select (once/month/year)
  - highlight toggle
  - badge editor (optional)
  - CTA editor (0..1 per tier; label+href required if present)
  - Features editor (repeatable list) as a sub-surface inside the right pane:
    - Add feature
    - Remove feature (ConfirmModal optional; can be inline delete if low risk)
    - Reorder features (DnD optional; recommended, but can be added later)
    - feature text required

**No nested accordions rule (HARD):**
- Tier editor MUST NOT be implemented as “accordion per tier” inside the Items group.
- Features MUST NOT be implemented as a second accordion inside a tier accordion.
- The only acceptable nesting is: tier list (left) + single selected tier detail (right).

### 4.3 Progressive disclosure
- Hide money fields when `isFree=true`.
- Hide CTA fields until “Add tier CTA” is clicked (optional, recommended).
- Hide badge fields until “Add badge” is clicked (optional, recommended).

### 4.4 Performance rules
- Only the selected tier detail editor mounts.
- Features editor mounts only within the selected tier.
- Avoid mounting rich preview UIs for non-selected tiers.
- Avoid heavy derived formatting on every keystroke; debounce where needed.

---

## 5) Readiness and publish gates (HARD)

### 5.1 Draft-ready (minimum)
Draft-ready when:
- `items.length >= 1`
- `items.length <= 4`
- for each tier:
  - name non-empty
  - if isFree=false:
    - price.amountMinor is integer >= 0
    - price.currency in GBP/USD/EUR
  - if CTA exists:
    - label + href valid (CTA rules)
  - features:
    - may be empty for draft (allowed), but feature text must be non-empty for any feature entries

### 5.2 Publish-ready (strict)
Publish-ready when:
- meets draft-ready
- plus:
  - each tier has at least 1 feature (HARD gate for publish quality)
  - for each tier:
    - every feature.text non-empty

### 5.3 Fields required count
`Fields required (N)` MUST count missing required fields across tiers:
- missing tier name
- missing price fields for paid tiers
- missing CTA label/href when CTA exists
- missing feature text
- missing features for a tier (publish gate)

---

## 6) Testing requirements (minimum)

Codex MUST add tests for:
1) Schema validation + readiness:
- tier count 1..4 enforced
- name required
- money required for paid tiers
- isFree hides/disables money requirements
- currency enum enforced
- CTA validation smoke

2) Editor interaction tests (at least basic):
- add tier up to 4
- remove tier uses ConfirmModal
- selecting tier switches detail panel

3) Publish gate tests:
- tier must have >=1 feature

---

## 7) Non-negotiables / anti-patterns

- MUST NOT implement comparison-table variant in MVP.
- MUST NOT implement nested accordion inside Items group.
- MUST NOT implement carousel pricing in MVP.
- MUST NOT use inline styles; tokenized `.module.css` only.
- MUST NOT scatter schema logic in UI components; keep under `src/lib/cms/**`.

---

## 8) Implementation notes (directional, not prescriptive)

Suggested files (directional):
- Schema: `src/lib/cms/schemas/pricingSection.schema.js`
- Validator: `src/lib/cms/validation/pricingSection.validation.js`
- Defaults: `src/lib/cms/defaults/pricingSection.defaults.js`
- Renderer: `src/components/sections/pricing/PricingSection.jsx` + module CSS
- Editor adapter: `src/lib/cms/editor/pricingSection.editor.js`
- Editor UI pattern (if needed): `src/components/patterns/cms/TierEditor/*` (ensure registry compliance if new pattern added)
