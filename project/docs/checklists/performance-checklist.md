# Performance Checklist (Next.js)

## Server/client split
- [ ] Default Server Components used
- [ ] `"use client"` only in leaf interactive islands
- [ ] No server-only imports in client components

## Bundle discipline
- [ ] No heavy library imported into client without explicit justification
- [ ] Prefer server-side parsing/formatting; ship results not toolchains
- [ ] Dynamic import used for heavy/rarely used client widgets

## Suspense + streaming
- [ ] Suspense boundaries are at section-level
- [ ] Fallbacks use shared tokenized primitives
- [ ] No micro-Suspense nesting that fragments UX
- [ ] Shared Skeleton primitives used; no layout shift.

## Images/fonts/scripts
- [ ] `next/image` used for non-trivial images
- [ ] width/height or fill + `sizes` provided
- [ ] `next/font` used where feasible
- [ ] `next/script` used for third-party scripts; deliberate strategy chosen

## UX resilience
- [ ] loading/error/not-found provided where needed
- [ ] meaningful empty states implemented