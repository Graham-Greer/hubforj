# AGENTS — Codex Operating Manual (Read First)

This repo is governed by non-negotiable standards. Codex MUST follow this file and the referenced docs.

## Preflight (HARD)
- Codex MUST read docs in standards-first order per `docs/bootstrap/fresh-install-checklist.md`.
- Codex MUST output the required Preflight format (docs read list + locked constraints summary).
- Codex MUST then proceed to QOS CHECK.

## Authority order (highest to lowest)
1) `AGENTS.md`
2) `docs/standards/engineering-source-of-truth.md`
3) Other standards:
   - `docs/standards/nextjs-runtime-performance.md`
   - `docs/standards/theming-architecture.md`
   - `docs/checklists/definition-of-done.md`
   - `docs/checklists/qos-check.md`
   - `docs/checklists/qos-summary.md`
   - `docs/standards/repo-structure-and-conventions.md`
   - `docs/standards/loading-error-and-resilience.md`
   - `docs/standards/ops-quality-and-security.md`
   - `docs/standards/drag-and-drop.md`
4) Component system:
   - `docs/component-registry.md`
   - `docs/component-build-order.md`
5) Codex workflow + prompts:
   - `docs/codex-workflow.md`
   - `docs/codex-prompts.md`
6) Product specs:
   - `docs/product/*`
   - `docs/roadmap/milestones.md`
7) Checklists:
   - `docs/checklists/*`
8) Firebase:
   - `docs/firebase/*` (Only implemented upon starting M1)

---

## Hard-stop protocol (MANDATORY)
For any request involving feature work, refactors, or architecture changes, Codex MUST:

1) Run `QOS CHECK` using `docs/checklists/qos-check.md`.
2) Provide an implementation plan aligned to all applicable standards and specs.
3) Ask for explicit confirmation BEFORE any code edits using EXACTLY:

`Implementation plan aligned to standards. Confirm and I will proceed with code edits.`

Until confirmation is received:
- Codex MUST remain in analysis/proposal mode only.
- Codex MUST NOT output code edits.

If a proposal breaches any non-negotiable rule:
- Codex MUST name the rule, explain the breach, and propose compliant alternatives.
- Do NOT change code until an explicit override is confirmed
- Any override MUST be logged per exception policy.

---

## Non-negotiables (fast reference)

### Layering and imports (HARD)
- Allowed dependency direction ONLY:
  `tokens/globals -> primitives -> ui -> patterns -> sections -> routes`
- MUST NOT introduce reverse imports.
- Route/page/layout files are composition shells, not logic dumps.

### Reuse-first (HARD)
- MUST check existing primitives/ui/patterns/hooks/services before creating anything new.
- If a new component is required and not in `docs/component-registry.md`, Codex MUST propose updating the registry FIRST.

### Styling discipline (HARD)
- MUST use semantic tokens / CSS variables from `globals.css`.
- IF a design token is required and does not exist, request confirmation before creating it and follow token token design.
- Component styling MUST be colocated in `.module.css` next to the `.jsx` file.
- Inline styles / `style` prop are DISALLOWED unless explicitly approved + exception logged.

### Data boundaries (HARD)
- MUST NOT perform DB/Firebase mutations in presentational components.
- MUST route writes through `src/lib/**` repositories/services (and hooks for orchestration).
- MUST validate inputs before writes and normalize outputs after reads.

### Auth/session determinism (HARD)
- If protected routes depend on server session cookies:
  - client auth success MUST wait for server-session readiness before navigation
  - MUST avoid redirect bounce loops

### Move safety (HARD)
- Any move/extraction MUST resolve imports in the same change.
- If incremental migration is required, add re-export shims and log follow-up.

### Repo structure + file conventions
- Must follow `docs/standards/repo-structure-and-conventions.md`
- Source lives only in: `src/app`, `src/components`, `src/lib`, `src/hooks`
- Components: one folder per component; `.jsx + .module.css` colocated
- Hooks: default single-file `src/hooks/useXyz.js`
- JSX only; no TS unless explicitly approved + logged

### Reordering - Drag and drop
- DnD must follow `docs/standards/drag-and-drop.md`.

---

## Required workflow on significant tasks
Codex MUST follow `docs/codex-workflow.md`:
- `QOS CHECK` (before coding): identify touched layers, slippage risks, reuse plan, missing reusable building blocks.
- `IMPLEMENT + CLEANUP SLICE`: ship feature end-to-end; apply cleanup budget within touched scope.
- `QOS SUMMARY` (after): report what was reused/extracted, what was deferred, follow-ups, any exceptions.

See:
- `docs/checklists/qos-check.md`
- `docs/checklists/qos-summary.md`

---

## Definition of Done
Codex MUST validate changes against:
- `docs/checklists/definition-of-done.md`
