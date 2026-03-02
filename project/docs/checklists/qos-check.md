# QOS CHECK (Before Coding)

Codex MUST complete this checklist before any code edits.

## 1) Scope
- Milestone (M1–M4):
- Touched routes (`src/app/**`):
- Touched components (layer + path):
- Touched hooks (`src/hooks/**`):
- Touched lib modules (`src/lib/**`):
- Touched CSS modules:

## 2) Repo structure check
- Any new files added? (list)
- Do all new files comply with `docs/standards/repo-structure-and-conventions.md`?
- Any risk of placing logic in the wrong layer/folder? (yes/no)

## 2) Layering + boundaries
- Layers touched (tokens/primitives/ui/patterns/sections/routes):
- Risk of reverse imports? (yes/no)
- Server/client boundary risks? (yes/no)
- Any secrets/authz boundary risks? (yes/no)

## 3) Reuse-first plan
- Existing components/hooks/services to reuse:
- Missing building blocks (if any) to add FIRST:
- If new component is needed, confirm registry update plan.

## 4) Data + caching plan
- What data is needed?
- Fetch pattern (server fetch / client fetch via API / mutation via API):
- Cache intent (revalidate / no-store) and why:
- Invalidation strategy (if relevant):

## 5) UX plan
- Loading state plan:
- Empty state plan:
- Error state plan:
- Destructive actions confirmation plan:

## 6) Cleanup budget
- Planned cleanup slice within cap:
- Likely extractions if thresholds exceeded:
