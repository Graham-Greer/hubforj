# Fresh Install Checklist (Next.js App Router, `src/`, JSX) — Canonical

Goal:
- Start from a fresh Next.js install (App Router) with only `globals.css` in place.
- Force Codex to read and prioritize standards docs before any implementation.
- Produce a deterministic bootstrap so no architecture is guessed.

Scope:
- Next.js App Router under `src/app/**`
- JSX (`.jsx`) only
- Token-based styling via `globals.css`
- Component layering per `docs/component-registry.md`

This doc is authoritative for the repository bootstrap phase.

---

## 0) Preflight: Mandatory doc read + comprehension handshake (HARD GATE)

Before ANY plan or code edits, Codex MUST complete the following in the chat:

### 0.1 Standards-first required reading order (MUST)
Codex MUST read in this exact priority order and then explicitly list them as “read”:

1) `AGENTS.md`
2) Standards (in order):
   - `docs/standards/engineering-source-of-truth.md`
   - `docs/standards/repo-structure-and-conventions.md`
   - `docs/standards/nextjs-runtime-performance.md`
   - `docs/standards/theming-architecture.md`
   - `docs/standards/loading-error-and-resilience.md`
   - `docs/standards/ops-quality-and-security.md`
3) Component system:
   - `docs/component-registry.md`
   - `docs/component-build-order.md`
4) Codex execution workflow:
   - `docs/codex-workflow.md`
   - `docs/codex-prompts.md`
5) Product specs (skim at minimum; full read as needed per milestone):
   - `docs/product/project-overview.md`
   - `docs/product/routes-and-gating.md`
   - `docs/product/state-machines.md`
   - `docs/product/media-library.md`
   - `docs/roadmap/milestones.md`
6) Firebase Documentation: Firebase setup occurs at M1.0 step
   - `docs/firebase/*`

### 0.2 Required Preflight output format (MUST)
Codex MUST output:

- **Docs read (standards-first)**: (explicit list in the order above)
- **Locked constraints understood**:
  - tenancy (hub-scoped, one Firebase project)
  - domains (custom domain public/member only; admin platform domain only)
  - roles (superadmin/admin/member)
  - routing (`/{hubSlug}/pages/{pageSlug}`)
  - state machines (membership/event/registration/payment/attendance)
  - media library rules (folders, tabs, usageRefs, delete prohibition)
- **Milestone target**: M1/M2/M3/M4
- **Build-order check**: confirm prerequisites per `docs/component-build-order.md`
- Then proceed to `QOS CHECK` per `docs/checklists/qos-check.md`

### 0.3 Hard-stop confirmation line (MUST)
After the plan and before any code edits, Codex MUST ask:

`Implementation plan aligned to standards. Confirm and I will proceed with code edits.`

---

## 1) Fresh Next.js install settings (MUST)

### 1.1 Project setup assumptions
- MUST use Next.js App Router.
- MUST use `src/` directory.
- MUST use `.jsx` (no TypeScript) unless explicitly approved + exception logged.
- MUST use CSS Modules for components and token-based `globals.css`.

### 1.2 Required top-level directories
The repo MUST include:
- `src/app/`
- `src/components/`
- `src/hooks/`
- `src/lib/`
- `docs/`
- `public/`

---

## 2) Required initial route group scaffolding (MUST)

Codex MUST create route groups as empty shells first (no business logic until UI/kernel exists):

- `src/app/(platform)/platform/` — superadmin surface
- `src/app/(admin)/[hubSlug]/admin/` — hub admin surface (platform domain only)
- `src/app/(public)/[hubSlug]/` — hub public surface (platform domain)
- `src/app/(member)/[hubSlug]/account/` — member portal (platform domain)

Note:
- Custom domains are resolved by Host header; do not implement domain routing by guessing.
- The hub public + member surfaces must be compatible with both platform domain and custom domain later.

---

## 3) Global styling hook-up (MUST)

- MUST place `globals.css` in the correct app entry and import it once.
- MUST NOT add global “utility class frameworks” beyond `.container` and a minimal a11y helper (if present).
- MUST ensure tokens are semantic and stable; components must consume tokens via `.module.css`.

---

## 4) Bootstrap enforcement (MUST)

### 4.1 Registry-first and build-order enforcement
- MUST NOT implement patterns/sections/routes that require UI primitives before the UI kernel exists.
- MUST implement primitives/UI/forms in the order defined by `docs/component-build-order.md`.

### 4.2 Product milestone enforcement
- MUST implement milestones in order:
  1) M1 Superadmin hub provisioning
  2) M2 Hub admin events/memberships
  3) M3 CMS pages (superadmin-only initially)
  4) M4 Public/member site + member onboarding

---

## 5) Acceptance checks before leaving bootstrap phase

Bootstrap phase is complete only when:
- [ ] Route group skeletons exist with placeholder pages.
- [ ] `globals.css` is wired correctly and tokens are available.
- [ ] `AGENTS.md` + standards + workflow docs are present and referenced.
- [ ] Codex can run the Preflight handshake and QOS CHECK on a trivial task without guessing.
