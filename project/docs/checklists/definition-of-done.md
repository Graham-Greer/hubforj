# Definition of Done (Mandatory)

A change is NOT done unless all applicable items are true:

## Architecture + layering
- [ ] Layering respected: `tokens/globals -> primitives -> ui -> patterns -> sections -> routes`
- [ ] No reverse imports
- [ ] Route/page modules remain composition shells

## Reuse + modularity
- [ ] Reuse-first applied; no unnecessary one-offs
- [ ] Touched oversized modules extracted within cleanup budget

## Styling + tokens
- [ ] Tokenized styling used where tokens exist
- [ ] `.module.css` colocated with component
- [ ] No inline styles/`style` props unless explicitly approved + exception logged
- [ ] No catch-all route-level styling for component-owned UI
- [ ] No hard sizing overrides unless approved + exception logged

## Data + mutations
- [ ] No DB mutations in presentational components
- [ ] Writes routed through `src/lib/**` services/repositories with validation + normalized outputs

## Auth/session determinism
- [ ] Protected-route navigation is deterministic; no sign-in bounce loops

## Next.js runtime/performance
- [ ] Server-first rendering; minimal `"use client"` usage
- [ ] Caching intent defined for new data surfaces
- [ ] Loading/error/not-found UX provided where needed
- [ ] `next/image` used appropriately; no layout shift

## Move safety
- [ ] File moves resolve imports in same change OR shims added + follow-up logged

## Documentation
- [ ] If contracts/architecture changed: docs updated same cycle `docs/product/*.md`
- [ ] Component additions reflected in `docs/component-registry.md`
- [ ] CMS behavior/UX changes recorded in `docs/cms/cms-decisions-log.md` (if applicable)

## Exceptions (if any)
- [ ] Exception note includes rule, reason, follow-up, deadline (max 2 sprints)

## Repo structure + conventions
- [ ] Placement follows `docs/standards/repo-structure-and-conventions.md`
- [ ] Component folders follow `.jsx + .module.css` colocation
- [ ] Hooks placed under `src/hooks/useXyz.js` (or approved folder form)
- [ ] No TS files added unless approved + exception logged

## Loading/resilience
- [ ] loading/error/not-found patterns implemented where needed
- [ ] shared skeleton primitives reused; no layout shift

## Ops/security
- [ ] server inputs validated; errors mapped safely
- [ ] rate limiting applied to public mutation endpoints (if applicable)
- [ ] structured server logs in critical paths
