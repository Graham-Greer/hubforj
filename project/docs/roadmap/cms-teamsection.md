# CMS Section Doc: TeamSection (Canonical, Machine-Enforced)

Purpose:
- Define the canonical contract and CMS editor behavior for `TeamSection`.
- Provide a team/people grid section for marketing pages (staff, facilitators, speakers).
- Enforce layout-only configuration and prevent carousel creep in MVP.
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
- Codex MUST treat this document as canonical for `TeamSection`.
- Codex MUST implement this section using fragment-composed schemas per the fragment catalogue.
- Carousel behavior is explicitly deferred (see section 9). Codex MUST NOT implement carousel inside TeamSection in this slice.

---

## 0) Section identity (LOCKED)

Block type:
- `type: "TeamSection"`

Semantic purpose:
- Display people cards (name/role/avatar/bio) in a responsive grid.
- Suitable for “Meet the team”, “Hosts”, “Facilitators”, “Speakers”.

Non-goals:
- Not a testimonial section.
- Not a pricing section.
- Not a carousel/slider section in MVP.

---

## 1) Composition mapping (LOCKED)

TeamSection MUST be composed from:
- `SectionHeaderFragment` (descriptionMaxLength = 240)
- `GridLayoutFragment` (columns, align, density; NO lead mode)
- `PersonItemFragment` repeatable items
- Optional: `CtaGroupFragment` at section level (0..2) — OPTIONAL for now

Notes:
- Person items may include optional social links rendered as icons only (see section 2.5).
- Person items may include optional badge (BadgeFragment).

---

## 2) Canonical schema (single source of truth)

### 2.1 Required top-level fields
- `type: "TeamSection"`

### 2.2 Header fields (SectionHeaderFragment)
- `eyebrow?: string`
- `title?: string` (optional)
- `description?: string` (plain textarea; maxLength 240)

### 2.3 Layout fields (GridLayoutFragment)
- `columns?: 2 | 3 | 4` (default 3)
- `align?: "left" | "center"` (default "left")
- `density?: "comfortable" | "compact"` (default "comfortable")

Constraints (HARD):
- `layout="lead"` MUST NOT be exposed for TeamSection (no lead behavior).
- Only columns/align/density apply.

### 2.4 Items (PersonItemFragment)
- `items: Array<PersonItem>`

PersonItem fields per fragment catalogue:
- `id: string` (stable)
- `name: string` (required for publish)
- `role?: string`
- `bio?: string` (plain; maxLength 240 recommended)
- `avatar?: { imageMediaId: string, alt: string }` (optional; alt required if present)
- `badge?: Badge` (optional; BadgeFragment)

### 2.5 Social links (TeamSection MVP extension)
Social links are optional and icons-only.

Field (per person item):
- `socialLinks?: Array<SocialLink>` (0..3)

SocialLink:
- `id: string` (stable)
- `platform: "x" | "linkedin" | "facebook"`
- `href: string` (REQUIRED; MUST be https URL)

Constraints (HARD):
- Platforms are limited to the enum above for MVP.
- `href` MUST start with `https://`.
- Forbidden schemes: `javascript:`, `data:`, `vbscript:`.
- Links MUST render as icons only (no visible text labels), but MUST include `aria-label`.

---

## 3) Renderer contract (public/runtime)

### 3.1 Layout behavior
- Render SectionHeader above the grid.
- Render person cards in a responsive grid:
  - respect `columns` on large screens
  - stack to fewer columns on smaller screens
- `align` controls card text alignment (left|center).
- `density` controls spacing/padding via tokens.

### 3.2 Person card content
- Name and role displayed prominently.
- Bio displayed if present (truncate strategy optional; keep readable).
- Avatar displayed if present using `ui/image/AppImage.jsx`.
- Badge displayed if present using `ui/badge/Badge.jsx`.

### 3.3 Social icons (if present)
- Render platform icons (Material Symbols or your Icon system) as icon-only buttons/links.
- Each icon link MUST have an `aria-label`, e.g.:
  - `"LinkedIn profile for {name}"`
- Links MUST open in new tab with:
  - `target="_blank"`
  - `rel="noopener noreferrer"`

---

## 4) Editor UX contract (M3)

### 4.1 Groups (schema-driven)
Recommended groups:
1) `Core`
- eyebrow/title/description
2) `Items`
- repeatable PersonItem editor (add/remove/reorder)
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
- Removing a person MUST use `ConfirmModal`.

Item editing fields:
- name input (required)
- role input (optional)
- bio textarea (optional; counter; maxLength 240)
- avatar media picker (optional) + alt required if selected
- badge editor (optional)
- social links editor (optional, progressive)

Progressive disclosure:
- Hide avatar alt field until avatar selected.
- Hide badge fields until “Add badge”.
- Hide social links until “Add social links”.

Performance:
- Keep non-selected item editors collapsed/summarized.
- Mount social links sub-editor only when expanded.

---

## 5) Readiness and publish gates (HARD)

### 5.1 Draft-ready (minimum)
Draft-ready when:
- `items.length >= 1`
- for each item:
  - `name` non-empty
  - if avatar present: avatar.alt non-empty
  - if social link present: platform + href valid and https

### 5.2 Publish-ready (strict)
Publish-ready when:
- meets draft-ready
- plus:
  - section-level CTAs valid if present (CTA rules)

### 5.3 Fields required count
`Fields required (N)` MUST count missing required fields across items:
- missing person.name
- missing avatar.alt when avatar selected
- missing socialLink.href or invalid https when social link enabled

---

## 6) Media usageRefs integration (HARD)

For each person with avatar:
- MediaRefsExtractor MUST register `item.avatar.imageMediaId`

Deletion policy:
- Any referenced media must be protected from deletion by usageRefs rules.

---

## 7) Testing requirements (minimum)

Codex MUST add tests for:
1) Schema validation + readiness:
- requires >= 1 item
- name required
- avatar alt required if avatar selected
- social link must be https and platform enum valid

2) Repeatable editor interactions:
- add person
- remove person (ConfirmModal)
- reorder person (pointer + keyboard)

3) Accessibility smoke:
- social icon links include aria-labels (basic render test)

---

## 8) Non-negotiables / anti-patterns

- MUST NOT implement carousel/slider in TeamSection in MVP.
- MUST NOT expose lead layout for team.
- MUST NOT allow arbitrary social platforms in MVP (enum only).
- MUST NOT introduce inline styles; use tokenized `.module.css`.
- MUST NOT scatter schema logic in UI components; keep under `src/lib/cms/**`.

---

## 9) Deferred (explicit)

Carousel/split variant is deferred:
- If a split + carousel team layout is needed later, it MUST be implemented as:
  - a reusable carousel/scroller pattern in `src/components/patterns/**`
  - and then optionally enabled as a TeamSection variant in a separate change
- Do not implement it in this slice.

---

## 10) Implementation notes (directional, not prescriptive)

Suggested files (directional):
- Schema: `src/lib/cms/schemas/teamSection.schema.js`
- Validator: `src/lib/cms/validation/teamSection.validation.js`
- Defaults: `src/lib/cms/defaults/teamSection.defaults.js`
- Renderer: `src/components/sections/team/TeamSection.jsx` + module CSS
- Editor adapter (if needed): `src/lib/cms/editor/teamSection.editor.js`