# M3 Pilot Section: AccordionSection (Canonical Contract + Migration Gate)

Purpose:
- Define the canonical contract for the M3 CMS editor foundation pilot section.
- Ensure Codex upgrades CMS editor foundations cleanly without rewriting all sections at once.
- Provide a single-source-of-truth for:
  - block schema
  - editor field rendering
  - readiness + publish gates
  - preview defaults
  - section rendering behavior

Authority alignment:
- `AGENTS.md`
- `docs/codex-workflow.md`
- `docs/standards/engineering-source-of-truth.md`
- `docs/standards/drag-and-drop.md`
- `docs/standards/repo-structure-and-conventions.md`
- `docs/standards/nextjs-runtime-performance.md`
- `docs/product/cms-pages.md`
- `docs/product/cms-block-registry.md`
- `docs/component-registry.md`

Hard rule:
- Codex MUST treat this document as canonical for the AccordionSection block.
- Codex MUST NOT migrate multiple sections until the Pilot Gate in section 1 is satisfied.

---

## 0) Naming and semantics (LOCKED)
- The pilot section block name is `AccordionSection` (NOT `FAQSection`).
- This section is domain-neutral and MUST be suitable for:
  - FAQs
  - policies
  - onboarding steps
  - structured content explanations
- Renderer MUST compose the reusable `ui/accordion/Accordion.jsx` (no bespoke accordion behavior).

---

## 1) Pilot Gate: Prevent “rewrite all sections” drift (HARD)

### 1.1 Phase A scope (HARD)
Codex MUST implement CMS editor foundations using ONLY `AccordionSection` as the pilot section.

Forbidden in Phase A:
- MUST NOT migrate other sections (FeatureGrid/Team/Testimonials/Pricing/etc.)
- MUST NOT expand or redesign public-facing section visuals beyond minimal contract-driven wiring
- MUST NOT introduce delimiter-string fallbacks for this pilot

Allowed in Phase A:
- Shared editor foundations:
  - schema single source of truth
  - grouped editor shell
  - repeatable item editor with DnD
  - readiness badges and gates
  - dirty-state guard patterns
- The `AccordionSection` schema + editor + renderer updates required to prove end-to-end flow

### 1.2 Exit criteria for Phase A (HARD)
Phase A is complete ONLY when:
- `AccordionSection` can be added, edited, reordered, validated, previewed, and published end-to-end
- contracts are structured (no delimiter string parsing)
- readiness + publish gates block appropriately with actionable messages
- DnD is drag-handle-only and keyboard accessible (per dnd standard)
- tests exist for:
  - schema validation
  - readiness computation
  - repeatable editor add/remove/reorder
  - publish gate blocking reasons

Only after this, Codex may proceed to Phase B section migrations.

---

## 2) Block contract (Canonical)

Block type:
- `type: "AccordionSection"`
- `variant: "default"` (only variant in MVP; additional variants later)

### 2.1 Top-level props (all optional)
- `eyebrow?: string`
- `title?: string`
- `description?: string`

Description constraints (LOCKED):
- `description` MUST be plain textarea (NOT WYSIWYG).
- `description` MUST have a max length of **240 characters**.
- Editor SHOULD show a character counter.

### 2.2 Items (required array)
- `items: Array<AccordionItem>`

AccordionItem contract:
- `id: string` (required; stable)
- `title: string` (required)
- `content: WysiwygValue` (required)

WysiwygValue constraints (LOCKED):
- `content` MUST use the project WYSIWYG editor wrapper.
- Allowed formatting only:
  - bold, italic, underline
  - bullets, numbered
  - link
- MUST NOT support source/HTML/code mode.

### 2.3 Item ID strategy (LOCKED)
- Item IDs MUST be stable and stored in the item object.
- IDs MUST NOT be derived from array index.
- ID generation:
  - SHOULD use `crypto.randomUUID()` when available.
  - MUST fallback to a safe generator when unavailable.
- IDs MUST remain stable through add/remove/reorder cycles.

---

## 3) Accordion behavior (Renderer contract)

### 3.1 Single-open mode (LOCKED)
- Only one item may be open at a time.
- Opening one item MUST collapse any previously open item.

### 3.2 Default open behavior (LOCKED)
On initial render:
- If any item has `defaultOpen: true` (future), open the first such item.
- Else open the first item in `items` (index 0).
- If `items` is empty, render empty-state UI (but this should be blocked by readiness gates).

Implementation note:
- The renderer MUST use the reusable `ui/accordion/Accordion.jsx` in a single-open configuration.
- The section MUST NOT re-implement accordion state management independently.

---

## 4) Editor UX (Phase A requirements)

### 4.1 Group taxonomy (schema-driven)
The editor MUST render groups via the shared group shell (Accordion-based), using schema metadata.
Recommended groups for this section:
- `Core` (eyebrow/title/description)
- `Items` (repeatable editor list)

### 4.2 Repeatable items editor (required)
- MUST use shared repeatable editor foundation:
  - add/remove/reorder
  - DnD:
    - vertical-only
    - drag-handle-only
    - keyboard accessible
  - remove uses ConfirmModal

Item row fields:
- title input (required)
- WYSIWYG editor for content (required)

### 4.3 Progressive disclosure
- Items editor should keep non-selected item editors collapsed or lightly summarized for performance.
- Heavy WYSIWYG surfaces SHOULD mount only when an item is expanded/selected.

---

## 5) Readiness + publish gates (Canonical)

### 5.1 Draft readiness (minimum validity)
Draft-ready when:
- `items.length >= 1`
- every item has:
  - `title` non-empty
  - `content` non-empty

### 5.2 Publish readiness (strict)
Publish-ready when:
- same as draft-ready (for the pilot; stricter rules may be added later)

### 5.3 UX surface requirements
- The section list card MUST show:
  - `Ready` OR `Fields required (N)`
- The editor MUST show readiness at group/section level.
- Publish must be blocked if publish-ready is false, with actionable messaging referencing missing fields.

---

## 6) Tests (Minimum required for Phase A exit)

Codex MUST add tests for:
- schema validation for AccordionSection props
- readiness computation for draft and publish gates
- repeatable editor interactions:
  - add item
  - remove item (ConfirmModal)
  - reorder item with DnD
  - keyboard reorder behavior
- WYSIWYG presence (smoke test: mounts only when needed, if lazy-mounted)

---

## 7) Documentation wiring (HARD)
- `docs/product/cms-block-registry.md` MUST list `AccordionSection` as a valid block type.
- `docs/component-registry.md` MUST include the editor foundations created for Phase A.
- The M3 plan and checklist MUST reference this pilot gate to prevent scope drift.
