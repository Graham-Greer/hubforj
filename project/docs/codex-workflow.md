# Codex Workflow (Repo Operating Procedure)

Purpose:
- Provide an explicit step-by-step workflow for Codex (and humans) so implementation stays aligned with:
  - architecture / layering
  - design tokens + CSS module discipline
  - Next.js performance boundaries
  - the canonical component registry + build order
- Prevent “slap code together” behavior.

## Preflight (HARD)
- Codex MUST read docs in standards-first order per `docs/bootstrap/fresh-install-checklist.md`.
- Codex MUST output the required Preflight format (docs read list + locked constraints summary).
- Codex MUST then proceed to QOS CHECK.

Authority:
- This doc MUST be followed for all tasks.
- Primary references:
  - `AGENTS.md`
  - `docs/standards/engineering-source-of-truth.md`
  - `docs/standards/repo-structure-and-conventions.md`
  - `docs/component-registry.md`
  - `docs/component-build-order.md`
  - `docs/standards/nextjs-runtime-performance.md`
  - `docs/standards/loading-error-and-resilience.md`
  - `docs/standards/ops-quality-and-security.md`

---

## 0) Hard-stop rule (always)

For any request that includes new feature work, refactors, or architectural changes:

1) Codex MUST begin with a `QOS CHECK` (see `docs/checklists/qos-check.md`).
2) Codex MUST provide an implementation plan aligned to standards.
3) Codex MUST ask for confirmation before any code edits using this exact line:

`Implementation plan aligned to standards. Confirm and I will proceed with code edits.`

Until confirmation is given:
- Remain in analysis/proposal mode only.
- Do not output code edits.

If any non-negotiable would be breached:
- Name the rule
- Explain why it’s breached
- Propose compliant alternatives
- Do NOT change code until an explicit override is confirmed
- Log exception per exception policy

---

## 1) Task intake checklist (MANDATORY)

Before coding, Codex MUST answer:

### A) What milestone is this for?
Choose one:
- M1 Superadmin hub provisioning
- M2 Hub admin events/memberships
- M3 CMS pages
- M4 Public/member site

Then open `docs/component-build-order.md` and confirm the build phase that applies.

### B) What layers are touched?
List touched layers from:
- primitives
- ui
- patterns
- sections
- routes (`src/app/**`)
- lib (`src/lib/**`)
- hooks (`src/hooks/**`)

### C) What state boundaries are involved?
- Server vs client components
- Data fetching pattern and caching intent
- Auth/session determinism requirements

---

## 2) Component registry rule (prevents component sprawl)

Whenever a UI need arises:

1) Codex MUST search `docs/component-registry.md` for an existing component.
2) If the component exists:
   - Reuse it.
   - If missing capability is needed, extend via:
     - variant prop, OR
     - composable props (slots), OR
     - small additive API change.
3) If the component does NOT exist:
   - Codex MUST update `docs/component-registry.md` FIRST (propose the entry).
   - Only after registry update is accepted, implement the component.

Hard rule:
- Codex MUST NOT create ad-hoc components outside the registry.

---

## 3) Build-order rule (prevents building the wrong layer first)

Codex MUST check `docs/component-build-order.md` and obey the sequence:

- Do NOT build patterns before UI kernel exists.
- Do NOT build sections before patterns + CMS controls exist.
- Do NOT build route screens that require missing primitives/UI.

If a requested task violates build order:
- Codex MUST propose the compliant prerequisite(s) first.

---

## 4) Code placement and structure rules (Repo conventions)

Codex MUST follow `docs/standards/repo-structure-and-conventions.md`:

- Source code only in:
  - `src/app`
  - `src/components`
  - `src/lib`
  - `src/hooks`

Component folder rule:
- `src/components/<layer>/<domain>/<ComponentName>.jsx`
- `src/components/<layer>/<domain>/<ComponentName>.module.css`

File-type rule:
- React components: `.jsx`
- Hooks: `.js` unless they render JSX

Styling rule:
- Component styles MUST live in colocated `.module.css`
- Inline styles (`style=`) are disallowed unless explicitly approved + logged exception
- Use tokens / semantic CSS variables, not hardcoded values when tokens exist

---

## 5) Next.js runtime rules (server/client boundaries)

Codex MUST follow `docs/standards/nextjs-runtime-performance.md`:

- Default to Server Components.
- Use `"use client"` only for leaf interactive islands.
- Never import server-only modules into client components.
- Data fetching defaults to server fetch + render.
- Client fetch is exception-only and must go through route handlers.

Caching intent rule:
- Every server fetch MUST declare caching intent:
  - cached/revalidate for public shared content
  - `no-store` for per-user/authed or preview/draft

---

## 6) Loading, error, empty UX rules

Codex MUST follow `docs/standards/loading-error-and-resilience.md`:

- Loading vs empty vs error MUST be distinct.
- Use shared Skeleton primitives (no bespoke skeleton system per page).
- Provide `loading.jsx`, `error.jsx`, `not-found.jsx` where needed.
- Skeletons must preserve layout footprint (avoid layout shift).

---

## 7) Data/mutation boundaries and safety

Codex MUST follow:
- `docs/standards/engineering-source-of-truth.md`
- `docs/standards/ops-quality-and-security.md`

Hard rules:
- No direct DB/Firebase mutation logic in presentational components.
- All writes via services/repositories/hooks with validation and normalized outputs.
- Protected routes are gated server-side when cookies are authoritative.
- Avoid sign-in bounce loops: post-login navigation waits for server session readiness.

---

## 8) Implementation protocol per task

Codex MUST proceed in the following steps:

### Step 1 — QOS CHECK
- Complete `docs/checklists/qos-check.md` content in the response.

### Step 2 — Plan
- Provide the smallest plan that meets the milestone goal.
- Identify:
  - which existing components will be reused
  - any registry additions needed (and propose them explicitly)
  - server/client boundaries
  - caching intent
  - loading/error/empty states

### Step 3 — Confirmation
- Ask for confirmation using the exact required line:
  - `Implementation plan aligned to standards. Confirm and I will proceed with code edits.`

### Step 4 — Code edits (only after confirmation)
- Output code changes in a file-by-file format.
- Keep modules small; avoid monoliths.
- Ensure imports resolve; file moves must resolve imports in the same change.

### Step 5 — QOS SUMMARY
- Complete `docs/checklists/qos-summary.md` content in the response.

---

## 9) Exceptions protocol (rare)

If a rule must be bypassed:
- Codex MUST request explicit override
- Codex MUST produce an exception note including:
  - rule bypassed
  - reason
  - follow-up task link
  - deadline (max 2 sprints)

No silent exceptions.

---

## 10) “Stop conditions” (when Codex must stop and ask)

Codex MUST stop and ask for clarification or confirmation when:
- a new component is needed but is not in the registry
- a task requires breaking build order
- a request conflicts with a non-negotiable rule
- token contract is insufficient and would force hardcoded styling
- server/client boundary is ambiguous (risking secrets in client)

---

## 11) Definition of Done

For any significant change, Codex MUST validate against:
- `docs/checklists/definition-of-done.md`

If DoD is not met:
- Codex MUST say what is missing and propose the minimal fix.

---

## 12) Lock-in note (functionality docs)

Once milestones and component registry stabilize, produce feature specs that reference:
- `docs/component-registry.md`
- `docs/component-build-order.md`
- the standards docs

Codex MUST treat those specs as authoritative for feature implementation.