# Public Home Cache Slice - 2026-08-04

## Scope

This slice implements the first narrow phase from the enterprise performance execution checklist:

- Public anonymous cache foundation.
- Public hub core lookup by slug.
- Public home route shell-safe site settings.
- Public layout shell-safe site settings.
- Cache invalidation from site/home/branding/page settings and media mutations.
- Rollback through `HUB_PLATFORM_PUBLIC_CACHE_DISABLED=true`.

Explicitly out of scope:

- Public events listing query optimization.
- Public courses listing query optimization.
- Testimonials and what-we-do durable caching.
- Member account query optimization.
- Admin dashboard counters.
- Payments ledger projection.
- Members directory projection.
- Media usage projection.

## Baseline

- Date: 2026-08-04.
- Environment: source-level local audit.
- Route: public hub home `/`.
- Host model: platform subdomain and custom domain compatible because cache keys are based on `hubId` after hub identity resolution.
- Auth state: anonymous shell data only; member/admin header state remains dynamic.
- Screenshot/network file: not captured in this slice because local runtime verification is blocked by unavailable Node in the current shell.
- Document load time: not measured in this slice.
- Slowest requests: previous audit identified repeated Firestore reads for public shell/site settings and media hydration.
- Unexpected prefetch/redirect/duplicate requests: not assessed in this slice.
- Known Firestore-heavy helpers:
  - `getPublicSiteContext`.
  - `getCachedSiteSettingsByHub`.
  - public layout site settings hydration.
- Current skeleton/loading behavior: unchanged.
- Current UX issue: public shell data was request-cached only, so repeated anonymous requests could reread stable public settings/media.
- Target improvement: durable reuse of public shell-safe site settings across anonymous requests, with targeted invalidation when admin content changes.

## Implementation

Added:

- `apps/hub-platform/src/lib/cache/public-content.js`

Updated:

- `apps/hub-platform/src/app/api/internal/update-package-authority/route.js`
- `apps/hub-platform/src/lib/data/hubs.js`
- `apps/hub-platform/src/lib/data/site-settings.js`
- `apps/hub-platform/src/lib/data/public-site.js`
- `apps/hub-platform/src/app/(hub)/[hubSlug]/layout.jsx`
- `apps/hub-platform/src/app/(hub)/[hubSlug]/courses/layout.jsx`
- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/settings/actions.js`
- `apps/hub-platform/src/lib/actions/media.js`
- `apps/hub-platform/.env.example`

## Cache Model

The new public cache utility provides:

- Stable public content tags per `hubId`.
- Stable public hub-core tag per hub slug.
- A `createPublicContentCache` wrapper around `unstable_cache`.
- Public hub-core invalidation helper.
- Public shell invalidation helper.
- Public media invalidation helper.
- Rollback using `HUB_PLATFORM_PUBLIC_CACHE_DISABLED=true`.

Cached site settings are keyed by:

- `hub.id`
- normalized site settings media scope
- route mode
- home media hydration flag
- page hero key scope

The cache intentionally does not key by hostname.

Public hub core is cached by normalized hub slug because slug lookup is the identity-resolution step for the public route tree after middleware has resolved the incoming host/path model.

## Safety Controls

- Auth/session data is not cached.
- `getPublicHeaderModel` remains dynamic and still reads current member/admin session state.
- Public hub core caching contains normalized hub identity, public package capabilities, route/domain metadata, and public theme/template fields only.
- Admin/private media hydration remains on the existing non-public helper.
- Public settings helpers use `publicMedia: true`.
- Cache invalidation is tag-based and hub-scoped.
- Legacy behavior can be restored by setting `HUB_PLATFORM_PUBLIC_CACHE_DISABLED=true`.

## Invalidation Coverage

Settings actions now invalidate public shell cache for:

- Branding settings.
- Site settings.
- Homepage settings.
- Events page settings.
- Courses page settings.
- Testimonials page settings.
- Custom-domain request, verification, and disconnect scheduling.

Package authority updates now invalidate public shell cache because public site settings include package capability data.

Package authority updates also invalidate public hub core because package capability data is normalized into the public hub record.

Media actions now invalidate public media-related shell cache for:

- Media folder create/update/delete.
- Media asset update/delete.

## Verification Completed

- Source inspection confirmed public header personalization remains outside the durable cache.
- Source inspection confirmed public hub core lookup is now durable-cache wrapped for public route surfaces.
- Source inspection confirmed public layout and public page context now use the public cache-safe helper.
- Source inspection confirmed admin settings mutations pass `hub.id` to tag invalidation.
- Source inspection confirmed media mutations pass `hub.id` to tag invalidation.
- Source inspection confirmed package authority updates invalidate both public hub core and public shell tags.
- `git diff --check` passed for touched implementation files.

## Verification Still Required In Runtime

Run in local or preview where Node/runtime is available:

- Load a public hub home route anonymously twice.
- Confirm the page renders normally.
- Confirm signed-in member header state still renders correctly.
- Confirm signed-in admin header state still renders correctly.
- Update homepage settings and confirm public home reflects the change.
- Update branding settings and confirm public shell reflects the change.
- Update package authority in a non-production environment and confirm public capability-driven UI reflects the change.
- Confirm courses capability gating reflects package changes after invalidation.
- Update a home hero/info media asset and confirm public home reflects the change.
- Test platform subdomain.
- Test custom domain.
- Set `HUB_PLATFORM_PUBLIC_CACHE_DISABLED=true` and confirm the route still renders through legacy reads.

## Follow-Up

The next slice should not expand to payments, members, or projections yet. The next controlled move is either:

- Add durable caching for public deferred home sections after confirming invalidation for testimonials and what-we-do mutations.
- Begin bounded public events/courses query optimization with index deployment gates.
