# Data + Caching Checklist (Hard guidance)

Use this checklist whenever adding or changing data surfaces.

## 1) Fetch pattern
- [ ] Server fetch + render is default
- [ ] Client fetch is exception-only and goes through `/api/**` + a `useXyzQuery` hook
- [ ] Mutations go through server actions or route handlers, not UI components

## 2) Contracts + validation
- [ ] Inputs validated before writes
- [ ] Outputs normalized after reads
- [ ] Stable response shapes returned from mutations
- [ ] SDK errors mapped to app-friendly errors

## 3) Caching intent declared
Choose one per fetch:
- [ ] Public/shared: cached + revalidate
- [ ] Semi-static: revalidate (N) appropriate to domain
- [ ] Per-user/authed: `no-store` unless explicitly safe to cache
- [ ] CMS preview/drafts: `no-store`

## 4) Invalidation (when needed)
- [ ] Tag-based invalidation or explicit revalidation strategy documented
- [ ] Publish/update flows invalidate what they must, not everything

## 5) Forbidden
- [ ] No direct DB SDK use inside presentational components
- [ ] No blanket `no-store` across the app
- [ ] No persisting canonical `id` in payloads if datastore provides it
