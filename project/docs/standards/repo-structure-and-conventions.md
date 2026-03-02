# Repo Structure + Conventions (Canonical)

This document defines where code lives and how it is named/organized so the codebase remains modular, token-driven, and scalable.

Authority:
- Secondary to `docs/standards/engineering-source-of-truth.md`
- Must be followed by all contributors and assistants.

---

## 1) Root structure (HARD)
Source code MUST live only in:
- `src/app/` — Next.js App Router routes/layouts/route handlers; composition shells
- `src/components/` — primitives/ui/patterns/sections (no routes)
- `src/lib/` — non-React: repositories/services, validation, auth/session helpers, config
- `src/hooks/` — reusable React hooks (orchestration/derived state)

---

## 2) Route Ownership Rules (`src/app/**`)

- Routes/pages/layouts are composition shells:
  - Compose sections/patterns/ui components
  - Wire high-level state
  - Call server repositories/services for data on the server (default)
- Route modules MUST NOT become monoliths:
  - No feature-wide business logic dumps
  - No catch-all route stylesheets for component-owned UI
- Prefer Server Components by default (see `docs/standards/nextjs-runtime-performance.md`).

### Route handlers
- API route handlers live under:
  - `src/app/api/**/route.js`
- Route handlers MUST call into `src/lib/**` for actual data access/mutations.

---

## 3) Layering inside `src/components` (HARD)
- `src/components/primitives/**`
- `src/components/ui/**`
- `src/components/patterns/**`
- `src/components/sections/**`

Allowed dependency direction ONLY:
`tokens/globals -> primitives -> ui -> patterns -> sections -> routes`

Hard rule:
- MUST NOT import higher layers into lower layers.
- No reverse imports.

Allowed dependency direction:
`tokens/globals -> primitives -> ui -> patterns -> sections -> routes`

---

## 4) Component folder convention (HARD)
Every component lives in its own folder with colocated CSS module:

Example:
- `src/components/ui/button/Button.jsx`
- `src/components/ui/button/Button.module.css`

Rules:
- Component filename MUST be `PascalCase.jsx`
- CSS module MUST be `ComponentName.module.css`
- No mega CSS modules containing unrelated component styles

Optional colocated files allowed:
- `index.js` (local barrel export)
- `*.test.js` / `*.spec.js`
- `*.stories.jsx`
- `utils.js` (ONLY if tightly scoped to the component)

---

## 5) Hooks convention
Default:
- `src/hooks/useSomething.js`

Rules:
- Hook filename MUST be `useXyz.js` (camelCase, starts with `use`)
- Hooks MUST NOT own direct DB mutations; they orchestrate via `src/lib/**`.
- Hooks SHOULD remain small and cohesive (see size thresholds in source of truth).

If a hook grows into a small domain module, use a folder:
- `src/hooks/useSomething/`
  - `useSomething.js`
  - `helpers.js` (optional)
  - `index.js` (optional)

Default remains single-file hooks.

---

## 6) Lib convention
`src/lib/` is for non-React, testable modules:
- data repositories/services
- validation/schemas
- auth/session helpers
- config/bootstrap (e.g. Firebase client/server split)
- pure utilities

Rules:
- Client components MUST NOT import server-only lib modules.
- DB access MUST be centralized here, not scattered in UI.

Recommended subfolders (directional):
- `src/lib/data/**`
- `src/lib/validation/**`
- `src/lib/auth/**`
- `src/lib/firebase/**` (if using Firebase)

---

## 7) File types (HARD)
- JSX only: components and React modules MUST use `.jsx`
- Hooks SHOULD use `.js` (preferred) unless they render JSX
- No TypeScript (`.ts`/`.tsx`) unless explicitly approved as an exception.

---

## 8) Styling (HARD)
- Global design tokens live in `globals.css`
- Component styles MUST use colocated `.module.css`
- Inline styles / `style` prop are DISALLOWED unless explicitly approved + exception logged
- Prefer token usage over hardcoded values when tokens exist. If tokens do not exist, request confirmation before creating new tokens.

---

## 9) Import Conventions (Guardrails)

- Routes MUST NOT be imported into shared layers.
- Avoid deep relative imports across domains; prefer stable exports.
- If using barrel exports (`index.js`), keep them:
  - local to a component folder, OR
  - at a layer boundary (e.g. `src/components/ui/index.js`) ONLY if it stays maintainable.

---

## 10) Placement Decision Rules (Quick reference)

If the code is:
- a route/page/layout/API handler → `src/app/**`
- a reusable UI element → `src/components/ui/**`
- a low-level building block → `src/components/primitives/**`
- a composed reusable arrangement → `src/components/patterns/**`
- a page block variant → `src/components/sections/**`
- a reusable React hook → `src/hooks/**`
- data access/validation/auth/config → `src/lib/**`