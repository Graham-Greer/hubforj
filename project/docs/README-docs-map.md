# Documentation Map (Canonical)

## A) Governance / Standards (Codex regulation)
- `AGENTS.md`
- `docs/standards/engineering-source-of-truth.md`
- `docs/standards/repo-structure-and-conventions.md`
- `docs/standards/nextjs-runtime-performance.md`
- `docs/standards/theming-architecture.md`
- `docs/standards/loading-error-and-resilience.md`
- `docs/standards/ops-quality-and-security.md`
- Checklists:
  - `docs/checklists/definition-of-done.md`
  - `docs/checklists/qos-check.md`
  - `docs/checklists/qos-summary.md`
  - `docs/checklists/data-caching-checklist.md`
  - `docs/checklists/performance-checklist.md`

## B) Component System (Codex build constraints)
- `docs/component-registry.md`
- `docs/component-build-order.md`

## C) Codex workflow
- `docs/codex-workflow.md`
- `docs/codex-prompts.md`

## D) Product / Functionality Specs
- `docs/product/project-overview.md`
- `docs/product/roles-and-permissions.md`
- `docs/product/routes-and-gating.md`
- `docs/product/data-model.md`
- `docs/product/state-machines.md`
- `docs/product/auth-and-session.md`
- `docs/product/feature-flags-and-addons.md`
- `docs/product/membership-flow.md`
- `docs/product/events-and-registrations.md`
- `docs/product/cms-pages.md`
- `docs/product/cms-block-registry.md`
- `docs/roadmap/milestones.md`
- `docs/product/open-questions.md`

Rule:
- If Codex changes behavior/contracts, it MUST update relevant `docs/product/*.md` in the same cycle.
- If Codex adds a new component, it MUST update `docs/component-registry.md` first.
