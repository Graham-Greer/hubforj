# Hub Platform Public Testimonials Shell Deferred Slice - 2026-08-04

## Purpose

This slice upgrades the public `/testimonials` route to follow the same enterprise-grade perceived performance pattern now used by public `/events` and `/courses`.

The route should render public shell content quickly, then stream the data-rich testimonial listing behind a route-specific skeleton.

## Implemented Scope

### Shell And Deferred Data Split

File:

- `apps/hub-platform/src/lib/data/public-site.js`

Added:

- `getPublicTestimonialsShellData(hubSlug)`
- `getPublicTestimonialsDeferredData(hub)`

The shell helper resolves:

- public hub context;
- public site settings;
- testimonial page hero settings;
- route mode and public shell-safe settings.

The deferred helper resolves:

- cached published testimonials through `listPublicTestimonialsByHub`.

This keeps existing testimonial filtering, sorting, media hydration, and cache invalidation behavior unchanged.

### Route Streaming

File:

- `apps/hub-platform/src/app/(hub)/[hubSlug]/testimonials/page.jsx`

Changed:

- The route now calls `getPublicTestimonialsShellData` first.
- The testimonial list is loaded through `getPublicTestimonialsDeferredData`.
- The testimonial list is wrapped in `Suspense`.
- Hero and CTA configuration remain shell-rendered.

### Public Testimonial Skeleton

Files:

- `apps/hub-platform/src/components/patterns/public-testimonial-fallbacks/PublicTestimonialFallbacks.jsx`
- `apps/hub-platform/src/components/patterns/public-testimonial-fallbacks/PublicTestimonialFallbacks.module.css`
- `apps/hub-platform/src/components/patterns/public-testimonial-fallbacks/index.js`

Added `PublicTestimonialsSectionFallback`, a route-specific skeleton using public section/card tokens.

The fallback reserves:

- section heading;
- cards variant;
- spotlight-plus-rail variant;
- showcase variant;
- quote mark;
- quote lines;
- attribution avatar/name/meta area.

## Guardrails

- Do not change testimonial visibility rules.
- Do not bypass the existing cached testimonial helper.
- Do not load admin or mutation code in the loading component.
- Keep the public hero outside the Suspense boundary.
- Keep skeletons below the route hero and focused on the testimonial listing.
- Preserve empty-state behavior; if there are no published testimonials, the final section still renders nothing.

## Verification Checklist

- Load `/testimonials` anonymously in production.
- Confirm the hero appears before testimonial data under throttling.
- Confirm the testimonial skeleton uses public tokens in light and dark themes.
- Confirm no generic root progress loading appears for public route refresh.
- Confirm published testimonials still appear in the same order.
- Confirm unpublished testimonials do not appear.
- Edit/create/delete a testimonial in admin and confirm public `/testimonials` updates after invalidation.
- Compare Network waterfall before/after where available.

## Runtime Verification

- Production `/testimonials` hard-refresh screenshot showed a clean document load around 416 ms.
- Testimonial RSC refresh/navigation requests were observed around 157-173 ms.
- Repeated navigation between `/courses` and `/testimonials` still caused later `/courses` RSC requests, but this is currently accepted because the expensive public course data path is server-side cached.
- Client navigation-cache tuning is deferred unless repeated route transitions remain visibly slow after this public cache/shell work.

## Remaining Follow-Up

- Verify testimonial create/edit/delete invalidation updates public `/testimonials`.
