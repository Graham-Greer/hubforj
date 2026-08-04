# Hub Platform Public Content Cache Implementation Plan

## Objective

Introduce enterprise-grade durable caching for anonymous public hub content while preserving correct personalized behavior for signed-in members, admins, custom domains, and platform subdomains.

## Audit Findings

The current public site has good perceived performance improvements through Suspense and split shell/deferred data, but the cache layer is mostly request scoped.

Relevant audited files:

- `apps/hub-platform/src/app/(hub)/[hubSlug]/layout.jsx`
- `apps/hub-platform/src/lib/data/hubs.js`
- `apps/hub-platform/src/lib/data/site-settings.js`
- `apps/hub-platform/src/lib/data/public-site.js`
- `apps/hub-platform/src/lib/data/public-header.js`
- `apps/hub-platform/src/middleware.js`

Current behavior:

- `React cache` is used for hub and site settings helpers, but this only deduplicates reads inside a render/request lifecycle.
- Public routes are dynamic because they read headers and support host-mode/path-mode routing.
- Public header model checks member/admin session cookies so it can personalize navigation.
- Home, events, and courses pages already split above-fold shell data from deferred sections.
- Deferred sections still perform live Firestore reads unless the current render/request reuses a request-scoped cache.

Risk at 1,000+ users:

- Anonymous traffic repeatedly reads the same published site settings, navigation, footer, landing content, event listings, course listings, testimonials, and what-we-do content.
- Traffic spikes create repeated Firestore reads for content that changes relatively infrequently.
- Personalization mixed into the public shell can prevent safe shared caching if not separated.

## Target Architecture

Create two clear data layers:

- Anonymous public content cache:
  - Hub core public identity.
  - Site settings.
  - Header/footer navigation configuration that is not viewer-specific.
  - Published page sections and public listing payloads.

- Viewer/session overlay:
  - Is signed in.
  - Is hub member.
  - Is hub admin.
  - Account/admin links and user-specific CTA state.

The anonymous layer can use durable Next.js caching with tags. The viewer overlay remains dynamic and uncached per request.

## Cache Safety Rules

Shared cache is only allowed for data that is safe for every visitor to the same hub to see.

Never place the following in a durable shared cache:

- Cookies.
- Request headers.
- Session state.
- Current user id.
- Member role.
- Admin role.
- Draft content visible only to admins.
- Preview content.
- Per-user CTA state.
- Billing or account data.
- Invite-only/private content unless it is explicitly public to anonymous visitors.

Cache keys must be based on stable platform identity:

- Prefer `hubId` once host/path resolution has identified the hub.
- Do not key public content by hostname because a single hub can resolve through a platform subdomain and one or more custom domains.
- Include query fingerprints for listing pages only when the query affects public output.
- Normalize query fingerprints so parameter order does not create duplicate cache entries.

Dynamic route behavior:

- It is acceptable for a route to remain dynamic because it reads headers for host resolution.
- Cached data helpers can still provide durable reuse inside dynamic route rendering as long as those helpers do not read request-scoped values.
- The route should compose cached anonymous data with a dynamic viewer overlay.

Staleness policy:

- Prefer explicit tag invalidation for admin mutations.
- Use a short TTL only as a defensive fallback where appropriate.
- Public content should not depend on long TTL expiry to reflect admin edits.
- If invalidation is uncertain during rollout, keep the cache feature flag disabled for that content type.

## Proposed Cache Model

Use stable cache keys scoped by hub id or slug:

- `hub-public-core:{hubId}`
- `hub-site-settings:{hubId}`
- `hub-public-home:{hubId}`
- `hub-public-events:{hubId}:{queryFingerprint}`
- `hub-public-courses:{hubId}:{queryFingerprint}`
- `hub-public-testimonials:{hubId}`
- `hub-public-what-we-do:{hubId}`
- `hub-public-navigation:{hubId}`

Use tags that can be invalidated from admin mutations:

- `hub:{hubId}`
- `hub:{hubId}:site-settings`
- `hub:{hubId}:navigation`
- `hub:{hubId}:home`
- `hub:{hubId}:events`
- `hub:{hubId}:courses`
- `hub:{hubId}:testimonials`
- `hub:{hubId}:what-we-do`
- `hub:{hubId}:media`
- `hub:{hubId}:public-shell`

Tag usage rules:

- Site-wide visual changes should invalidate `site-settings`, `navigation`, and `public-shell`.
- Content-type edits should invalidate the narrow content tag plus any page tag that embeds that content.
- Media replacement should invalidate media and every public content tag that references the changed asset.
- Hub slug/domain changes should invalidate hub public core and route metadata.

## Implementation Phases

### Phase 1: Add Cache Utilities

- Add a small public cache utility module.
- Wrap cache usage in named functions instead of scattering `unstable_cache` calls through route files.
- Keep dynamic request data out of cache inputs.
- Document cache tags beside each helper.
- Add a single public-cache feature flag or helper branch.
- Add optional debug logging for cache bypass/fallback during rollout.

Acceptance criteria:

- Cache helpers are discoverable and consistently named.
- Cached helpers only accept serializable stable arguments.
- No cookies, headers, user ids, or session-derived values enter shared cache keys.
- Durable cache can be disabled without deleting route code.

### Phase 2: Split Public Header Data

- Separate anonymous header/navigation config from viewer-specific header state.
- Keep header visual content and navigation config cacheable.
- Resolve member/admin state through a lightweight dynamic overlay.
- Ensure active nav state remains route-derived, not cached as a single global value.
- Ensure account/admin links are built after route mode is resolved.

Acceptance criteria:

- Anonymous visitors share cached public header content.
- Signed-in visitors still see correct account/admin navigation.
- No auth state is cached globally.
- Light/dark theme and public semantic tokens are unaffected.

### Phase 3: Cache Public Page Shell Data

- Cache stable public home shell content.
- Cache stable events and courses page shell content.
- Cache footer and shared site settings.
- Preserve current Suspense boundaries for deferred sections.
- Exclude preview/draft/admin-only fields from shell payloads.
- Keep route title/hero rendering independent from deferred data.

Acceptance criteria:

- Route title/hero/header/footer data can be served from cache.
- Updating site settings invalidates affected pages.
- Custom domains and platform subdomains resolve the same cached hub content once hub identity is known.
- Unpublished or private content is not present in cached shell payloads.

### Phase 4: Cache Deferred Public Sections

- Cache published testimonials, what-we-do items, home page featured events, and featured courses.
- Cache listing payloads with query fingerprint keys after bounded query optimization is in place.
- Keep listing cache entries bounded by page size and query params.
- Avoid caching empty results indefinitely during rollout if legacy data fields are incomplete.

Acceptance criteria:

- Deferred sections stop re-reading the same published content on every anonymous request.
- Admin edits invalidate only relevant tags.
- Pagination/search/filter variants cache independently and safely.

### Phase 5: Add Invalidation Hooks

Invalidate cache tags from existing admin mutations:

- Site settings and branding updates.
- Navigation/header/footer updates.
- Page content updates.
- Event create/update/delete/publish/unpublish.
- Course create/update/delete/publish/unpublish.
- Testimonial create/update/delete/publish/unpublish.
- What-we-do create/update/delete/publish/unpublish.
- Media changes that affect public assets.
- Hub slug/domain/custom-domain changes.
- Membership/package changes if public feature availability or gated public sections change.

Acceptance criteria:

- Publishing content appears after invalidation.
- Unpublishing content removes it after invalidation.
- Editing one content type does not flush unrelated hub-wide caches unless required.
- Failed invalidation is logged with enough context to repair manually.
- Invalidation helpers are reused from mutations instead of repeated ad hoc calls.

### Phase 6: Add Cache Verification And Observability

- Add route-level before/after network capture notes.
- Add development logging around legacy read fallback and cache bypass.
- Add a manual cache invalidation checklist for production support.

Acceptance criteria:

- Engineers can tell whether a route used cached public data or a live legacy read during rollout.
- Support has a documented path if a hub reports stale public content.

## Rollback Strategy

- Cache wrappers should support temporarily bypassing durable cache through a single feature flag or helper branch.
- If an invalidation defect appears, disable durable caching without removing route-level Suspense work.
- Rollback must preserve public route rendering and should only affect whether data is served from cache.
- If one content type has invalidation issues, disable that content type's cache without disabling unrelated safe caches where practical.

## Edge Cases

- A hub is reached through both `hubslug.hubforj.com` and a verified custom domain.
- A custom domain is removed but cached public content still exists.
- A hub slug changes.
- A page is unpublished immediately after being cached.
- A public section references media that is replaced or deleted.
- A signed-in member visits an otherwise anonymous cached page.
- A hub admin previews content that anonymous users should not see.
- A route returns 404 for a missing hub or disabled hub.
- A draft event/course shares a slug with a previously published item.

## Verification Checklist

- Load anonymous public home twice and verify second load avoids duplicate Firestore reads where measurable.
- Update public home content in admin and verify public route refreshes after invalidation.
- Sign in as member and verify personalized header state is still correct.
- Sign in as admin and verify admin CTA state is still correct.
- Test platform subdomain and custom domain routing.
- Test unpublished content does not leak through cache.
- Test media replacement updates public pages after invalidation.
- Test cache bypass feature flag.
- Run scoped checks and `git diff --check` on touched files.

## Implementation Progress

### 2026-08-04 - Public Home Shell Cache Foundation

Status: implemented at source level, pending runtime verification.

Completed:

- Added public content cache utilities and hub-scoped cache tags.
- Added public hub-core cache tag and invalidation helper.
- Added `HUB_PLATFORM_PUBLIC_CACHE_DISABLED` rollback control.
- Added durable public hub-core lookup for public route surfaces.
- Added cache-safe public site settings helper for public shell usage.
- Updated public layout and public page context to use the public cache-safe settings helper.
- Kept public header member/admin personalization dynamic.
- Added tag invalidation from settings and media mutations that affect public shell/home content.
- Added tag invalidation from package authority updates because cached public settings include package capabilities.
- Added implementation note:
  [hub-platform-public-home-cache-slice-2026-08-04.md](hub-platform-public-home-cache-slice-2026-08-04.md)

Pending:

- Runtime route verification on local or preview.
- Before/after network comparison where measurable.
- Expansion to deferred home sections, events listings, and courses listings.

### 2026-08-04 - Public Home Deferred Content Cache

Status: implemented at source level, pending runtime verification.

Completed:

- Added public cache invalidation helpers for testimonials and what-we-do.
- Added durable public cache wrappers for published testimonials.
- Added durable public cache wrappers for published what-we-do items.
- Preserved public-only filtering with `status == "published"`.
- Preserved existing testimonial sorting and public media hydration.
- Preserved existing what-we-do sorting and six-item public limit.
- Added testimonial create/update/delete invalidation for public testimonial and home tags.
- Added what-we-do create/update/delete invalidation for public what-we-do and home tags.
- Added implementation note:
  [hub-platform-public-home-deferred-cache-slice-2026-08-04.md](hub-platform-public-home-deferred-cache-slice-2026-08-04.md)

Pending:

- Runtime route verification on local or preview.
- Before/after network comparison where measurable.
- Expansion to events and courses query optimization.

### 2026-08-04 - Public Events And Courses Anonymous Cache

Status: implemented at source level, pending runtime verification.

Completed:

- Added durable anonymous cache wrappers for public `/events` deferred listing data.
- Added durable anonymous cache wrappers for public `/courses` deferred listing data.
- Preserved member-specific public offering visibility by bypassing the anonymous cache whenever a member session exists.
- Added public offering cache tags for events and courses.
- Added media invalidation coverage for events and courses card media.
- Added event create/update/delete and recurring-series update invalidation.
- Added course create/update/delete invalidation.
- Added course registration create/status invalidation because public course cards display available-space labels.
- Added route-specific public offering skeletons for `/events` and `/courses` Suspense fallbacks.
- Added implementation note:
  [hub-platform-public-offering-cache-and-fallback-slice-2026-08-04.md](hub-platform-public-offering-cache-and-fallback-slice-2026-08-04.md)

Pending:

- Runtime verify anonymous `/events` and `/courses` after deployment.
- Runtime verify signed-in member-only visibility still works.
- Compare warm anonymous hard-refresh waterfalls for `/events` and `/courses`.
