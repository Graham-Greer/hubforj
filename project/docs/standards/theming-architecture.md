# Template Theming Architecture (Canonical)

Goal:
- Support multiple hub templates with distinct visual identity.
- Keep reusable component APIs stable across templates.
- Avoid branching component logic per template.
- Ensure CMS preview and live runtime render the same template design.

Core principle (HARD):
- Separate behavior (logic, accessibility, interaction state) from presentation (tokens/variables/recipes).
- Behavior stays in shared components.
- Presentation is resolved by selected template and token overrides.

---

## 1) Token model (two layers)

### 1. Global semantic tokens (HARD)
- MUST define color/typography/spacing/radius/shadow/motion/border/z-index as semantic CSS variables.
- Components MUST consume semantic variables (no template branching).

### 2. Component recipe tokens (HARD)
- MUST define component-specific visual contracts as CSS variables (recipe tokens) where needed.
- Templates MAY override recipe token values.
- Templates MUST NOT override component behavior.

---

## 2) Runtime contract (HARD)
- Hub settings MUST provide selected templateKey (e.g. `templateA`).
- App shell MUST set template scope on root element:
  - `data-template="<templateKey>"` (or equivalent class).
- Template token map MUST be loaded once at shell level.
- Components MUST consume semantic variables only.

### 2.1 Theme delivery mechanism (HARD)
- Theme overrides MUST be delivered via generated CSS file per hub (no inline `<style>` injection).
- Storage path is canonical:
  - `hubs/{hubId}/theme/theme-overrides.css`
- Hub config MUST include:
  - `themeRevision` (int, default `1`)
  - `themeCssPath` (canonical storage path)
- Runtime MUST load:
  - `THEME_CSS_URL?v={themeRevision}`
- On token/template changes:
  - server regenerates CSS
  - overwrites storage file
  - increments `themeRevision` in same update flow

Forbidden (HARD):
- MUST NOT introduce `if (templateKey === "...")` branches inside reusable components for styling.
- MUST NOT hardcode template names inside reusable components.

---

## 3) Structural variation strategy
- If token changes cannot express required layout differences:
  - MUST use constrained recipe variants with stable APIs (e.g. `variant="split|stacked"`).
  - Variants MUST be documented and limited (no unbounded per-hub one-offs).
- Template config MAY select a default variant, but components MUST NOT inspect templateKey.

---

## 4) Reusable component contract requirements

All reusable components MUST:
- expose stable behavioral props (`value`, `onChange`, `open`, etc.)
- consume semantic CSS vars for visuals
- avoid template names
- support `className` extension without bypassing token contracts

---

## 5) Form system requirements (high-frequency)

Reusable form primitives:
- `Input`, `Textarea`, `Select`, `Checkbox`, `Radio`, `Switch`, etc

Composition wrappers:
- `Field`, `FieldLabel`, `FieldHint`, `FieldError`, `FieldGroup`, etc

Visual states MUST be tokenized:
- default, focus, disabled, error, success

Template differences MUST flow through tokens/recipe tokens, not one-off panel CSS.

## 6) CMS + Live parity (HARD)
- CMS preview MUST use the same template resolver and token source as live runtime.
- QA MUST verify parity for:
  - primitives/ui components
  - form controls
  - interactive sections (accordion/tabs/media cards)

---

## 7) Governance (per new template)

For each new template:
1) MUST provide required token set.
2) MAY provide optional component recipe overrides.
3) MUST run visual QA for core component set.
4) MUST record coverage in template QA checklist.

Non-goals:
- Duplicating entire component implementations per template.
- Mixing behavior and visual branching in the same component.
- Allowing unbounded template-specific one-off overrides.
