# Engineering + Design Source of Truth (Canonical)

Purpose:
- Define one enforceable standard for delivery quality in this project.
- Prevent drift into monolith components/stylesheets and ad-hoc architecture.
- Keep feature delivery moving while controlling technical debt.

Status:
- Effective immediately.
- Supersedes conflicting guidance elsewhere. This file is canonical.

Supporting references:
- `docs/standards/nextjs-runtime-performance.md`
- `docs/standards/theming-architecture.md`
- `docs/checklists/definition-of-done.md`
- `docs/checklists/qos-check.md`
- `docs/checklists/qos-summary.md`
- `docs/cms/cms-decisions-log.md`
- `docs/standards/repo-structure-and-conventions.md`
- `docs/standards/loading-error-and-resilience.md`
- `docs/standards/ops-quality-and-security.md`

---

## 1) Non-Negotiable Rules (MUST / MUST NOT)

### 1. Reusable-first
- MUST check for existing reusable components/hooks/services before writing one-off code.
- MUST create a reusable building block first when:
  - used in 2+ places, OR
  - expected to grow, OR
  - is a foundational domain element (forms, navigation, cards, modals, lists).

### 2. Layering integrity
- Allowed dependency direction ONLY:
  `tokens/globals -> primitives -> ui -> patterns -> sections -> routes`
- MUST NOT introduce reverse imports.
- Route/page files MUST be composition shells, not logic dumps.

### 3. No monoliths
- MUST NOT create or expand catch-all route-level stylesheets for component-owned UI.
- MUST NOT allow long-lived giant components/hooks when cohesive extraction is possible.

### 4. Styling discipline
- MUST use tokens and semantic CSS variables; avoid hardcoded values when a token exists.
- Component-specific styles MUST be colocated next to the component in `.module.css`.
- Inline styles / `style` prop are DISALLOWED by default and require explicit owner approval + logged exception.
- Hard sizing overrides (fixed width/height/min-width clamps) are DISALLOWED unless explicitly approved + logged.

CMS ownership (if CMS/admin exists):
- Shared CMS panel/list primitives MUST use:
  - `src/components/cms/shared/cms-panel-base.module.css`
  - `src/components/cms/shared/cms-list-toolbar.module.css`
- CMS shell layout styles MUST live in:
  - `src/app/admin/admin-page-shell.module.css`
- MUST NOT reintroduce deleted legacy route-level CMS catch-all stylesheets unless approved + logged as temporary exception.

### 5. UX consistency
- MUST reuse existing UI primitives and interaction patterns before inventing new patterns.
- Destructive actions MUST use a reusable confirmation modal/dialog (no `window.confirm`).
- `window.alert`/`window.confirm` are disallowed for shipped CMS/product UX unless explicitly approved as temporary fallback.

### 6. Data and mutation boundaries
- MUST NOT place direct DB/Firebase mutation logic in presentational components.
- MUST route all writes through hook/service/repository boundaries.
- MUST validate all inputs before writes and normalize outputs after reads.
- MUST keep data contracts explicit and stable.
- MUST NOT persist `id` inside payloads when datastore has canonical document IDs.

### 7. Auth/session determinism
- When route authorization depends on server session cookies:
  - MUST ensure client auth success flows wait for server-session readiness before protected-route navigation.
  - MUST avoid chained redirect churn (`sign-in -> admin -> sign-in`) from ambiguous intermediate states.

### 8. Move/refactor safety
- File moves/extractions MUST resolve all imports in the same change.
- If phased migration is required:
  - MUST add compatibility re-export shims
  - MUST log a follow-up task

### 9. Repo structure compliance
- MUST follow `docs/standards/repo-structure-and-conventions.md` for placement, naming, and file types.
- Source code MUST remain within: `src/app`, `src/components`, `src/lib`, `src/hooks`.

---

## 2) Size and Complexity Thresholds (enforcement triggers)

Thresholds apply to TOUCHED files. When exceeded, extraction is required within cleanup budget.

- Route/page files:
  - Warn: > 350 lines
  - Must justify + extract: > 450 lines
- Components:
  - Warn: > 250 lines
  - If touched and over threshold: MUST extract at least one cohesive subcomponent/hook.
- Hooks/services/helpers:
  - Target: < 220 lines
  - MUST split if responsibility is mixed (orchestration + mutation + derivation + view-model).
- CSS modules:
  - Warn: > 250 lines
  - MUST extract by ownership into component-level modules.

Hard anti-patterns:
- Giant catch-all CSS module holding unrelated component styles.
- Route file owning business logic, mutation orchestration, and UI rendering for multiple surfaces.

---

## 3) Ownership Model (Where Code Belongs)

UI and styling ownership:
- Component JSX + module CSS live together.
- Shared visual primitives belong in `primitives` / `ui` / `cms/shared`.
- Routes compose feature modules and wire high-level state only.

Logic ownership:
- Presentational components: rendering + local interaction state only.
- Hooks: orchestration / derived state (no direct DB writes).
- Services/repositories: external I/O and data access.
- Helpers/contracts: schema, arg builders, normalizers; no side-effect mutation.

---

## 4) Delivery Model (Controlled cleanup, not refactor loops)

Default sprint ratio:
- 80–90% feature delivery
- 10–20% cleanup/extraction

Per-task cleanup budget (canonical):
Stop cleanup when ANY limit is reached (whichever comes first):
- 10–15% of feature effort, OR
- 2 focused extractions/refactors, OR
- 90 minutes

Rules:
- No broad opportunistic rewrites outside touched scope.
- If larger debt is discovered, log explicit follow-up task with owner and priority.
- Refactor in stages; do not block roadmap features unless a breaking risk exists.

---

## 5) Required Workflow on Every Significant Task

1) QOS CHECK (before coding)
- Touched files/layers
- Slippage risks (bloat, one-off styles, mixed concerns)
- Existing reusable components/hooks/services to use
- Missing reusable building blocks to create first

2) Implement + cleanup slice
- Deliver feature end-to-end
- Apply cleanup budget in touched scope

3) QOS SUMMARY (after coding)
- What was reused/extracted
- What was deferred
- Follow-up item(s) for deferred debt
- Any exception note created

See:
- `docs/checklists/qos-check.md`
- `docs/checklists/qos-summary.md`

---

## 6) Review / Definition of Done Checklist (Mandatory)

See `docs/checklists/definition-of-done.md`.

---

## 7) Exceptions Policy (Hard rule)

Exceptions are allowed only when explicit and time-boxed.

Required exception note:
- Rule bypassed
- Reason
- Follow-up task link
- Deadline (max 2 sprints)

No silent exceptions.

---

## 8) Change Control

When standards evolve:
- Update this file first.
- Then update supporting references that depend on it.
- Record meaningful CMS behavior/UX decisions in:
  - `docs/cms/cms-decisions-log.md`