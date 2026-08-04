# Public Home Deferred Cache Slice - 2026-08-04

## Scope

This slice implements durable caching for the public home deferred content sections:

- Published testimonials.
- Published what-we-do items.

It builds on the existing public content cache utility and rollback flag from the public home shell cache slice.

Explicitly out of scope:

- Public events listing query optimization.
- Public courses listing query optimization.
- Admin testimonials list performance.
- Admin what-we-do list performance.
- Media usage projection.
- Payment/member/admin projections.

## Baseline

- Date: 2026-08-04.
- Environment: source-level local audit.
- Route: public hub home `/`.
- Host model: platform subdomain and custom domain compatible because cache keys are based on `hubId`.
- Auth state: public anonymous-safe deferred data only.
- Screenshot/network file: not captured in this slice because local runtime verification is blocked by unavailable Node in the current shell.
- Document load time: not measured in this slice.
- Known Firestore-heavy helpers:
  - `listPublicTestimonialsByHub`.
  - `listPublicWhatWeDoItemsByHub`.
- Current behavior: deferred home sections read published testimonials and what-we-do items from Firestore on request.
- Target improvement: durable reuse of published deferred home section data across requests, with targeted invalidation when admin content changes.

## Implementation

Updated:

- `apps/hub-platform/src/lib/cache/public-content.js`
- `apps/hub-platform/src/lib/data/testimonials.js`
- `apps/hub-platform/src/lib/data/what-we-do.js`
- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/testimonials/create/actions.js`
- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/testimonials/[testimonialId]/actions.js`
- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/testimonials/actions.js`
- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/what-we-do/create/actions.js`
- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/what-we-do/[itemId]/actions.js`
- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/what-we-do/actions.js`

## Cache Model

Published testimonials are cached by:

- `hubId`
- `public-testimonials` key namespace

Tags:

- `hub:{hubId}`
- `hub:{hubId}:home`
- `hub:{hubId}:testimonials`
- `hub:{hubId}:media`

Published what-we-do items are cached by:

- `hubId`
- `public-what-we-do` key namespace

Tags:

- `hub:{hubId}`
- `hub:{hubId}:home`
- `hub:{hubId}:what-we-do`

Both caches inherit the existing rollback behavior:

- `HUB_PLATFORM_PUBLIC_CACHE_DISABLED=true`

## Safety Controls

- Only documents with `status == "published"` are cached.
- Admin list/detail helpers remain uncached and unchanged.
- Testimonial media hydration uses public media helpers.
- What-we-do output remains limited to six items, matching existing public behavior.
- Existing sort behavior is preserved.
- Redirect behavior for create/update/delete actions is preserved.

## Invalidation Coverage

Testimonials cache invalidates on:

- Testimonial create.
- Testimonial update.
- Testimonial delete.
- Media update/delete through the existing public media invalidation helper.

What-we-do cache invalidates on:

- What-we-do create.
- What-we-do update.
- What-we-do delete.

Both content types also invalidate the public home tag because they are embedded on the home route.

## Verification Completed

- Source inspection confirmed cached testimonial reads use `status == "published"`.
- Source inspection confirmed cached what-we-do reads use `status == "published"`.
- Source inspection confirmed admin testimonial create/update/delete paths invalidate public testimonial/home tags.
- Source inspection confirmed admin what-we-do create/update/delete paths invalidate public what-we-do/home tags.
- Source inspection confirmed rollback is inherited from `createPublicContentCache`.
- `git diff --check` passed for touched implementation files.

## Verification Still Required In Runtime

Run in local or preview where Node/runtime is available:

- Load public home anonymously twice and confirm deferred sections render normally.
- Create a published testimonial and confirm it appears on public home after redirect/reload.
- Change a testimonial from draft to published and confirm it appears.
- Change a testimonial from published to draft and confirm it disappears.
- Delete a published testimonial and confirm it disappears.
- Update testimonial author image/media and confirm public display updates.
- Create a published what-we-do item and confirm it appears on public home if within the six-item limit.
- Change a what-we-do item from draft to published and confirm it appears if within the six-item limit.
- Change a what-we-do item from published to draft and confirm it disappears.
- Delete a what-we-do item and confirm it disappears.
- Set `HUB_PLATFORM_PUBLIC_CACHE_DISABLED=true` and confirm public home still renders through live reads.

## Follow-Up

The public home route now has durable caching for shell-safe settings, hub core, testimonials, and what-we-do. The next controlled step should be bounded public Firestore queries for events and courses, with index deployment gates from the public Firestore query optimization plan.

