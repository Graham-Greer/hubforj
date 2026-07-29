# Hub Platform Docs

This documentation set is the implementation authority for `apps/hub-platform`.

It exists so the greenfield rebuild can govern itself instead of inheriting process, structure, and ambiguity from the legacy project. These docs are intentionally opinionated. They are written to protect architecture quality, user experience quality, and long-term maintainability.

## Document order

Read in this order before doing substantial work in `apps/hub-platform`:

1. `docs/standards/source-of-truth.md`
2. `docs/standards/engineering-principles.md`
3. `docs/standards/repo-structure-and-layering.md`
4. `docs/standards/design-system-and-theming.md`
5. `docs/standards/nextjs-runtime-and-route-architecture.md`
6. `docs/standards/firebase-data-auth-and-security.md`
7. `docs/standards/quality-gates.md`
8. `docs/component-registry.md`
9. `docs/component-build-order.md`
10. Relevant roadmap docs in `docs/roadmap/*`
11. Relevant audit docs in `docs/audits/*`

## Authority model

- `docs/standards/*` defines engineering rules and non-negotiable constraints.
- `docs/component-registry.md` defines approved reusable modules and their intended role.
- `docs/component-build-order.md` defines the order in which abstractions may be introduced.
- `docs/roadmap/*` defines product direction, route authority, shell/navigation direction, and implementation sequence.
- `docs/audits/*` records the current codebase state, active risks, and remediation priorities.

## What these docs optimize for

- A multi-hub product, not a collection of ad hoc client implementations.
- A production-grade v1, not an MVP shortcut culture.
- A calm, modern, low-cognitive-load user experience.
- Strong server-first architecture and explicit route authority.
- A token-based design system that is flexible across light/dark themes, template families, and hub-level overrides.
- Durable layering that keeps route files thin and business logic out of UI components.

## What these docs do not permit

- Generic page-builder/CMS complexity as a core product dependency.
- Unbounded placeholder routes that quietly become permanent.
- Silent fallback behavior in production paths.
- Styling that bypasses the token system.
- Route sprawl, shell duplication, or mixed-responsibility files.
