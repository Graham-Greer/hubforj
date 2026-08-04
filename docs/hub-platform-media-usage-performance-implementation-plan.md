# Hub Platform Media Usage Performance Implementation Plan

## Objective

Prevent the media library from scanning the entire hub content graph to calculate usage while preserving useful usage indicators for admins.

## Audit Findings

The media route can become expensive for media-rich hubs or content-heavy hubs.

Relevant audited files:

- `apps/hub-platform/src/lib/data/media-queries.js`
- Public site settings/content areas that reference media.
- Admin event, course, testimonial, what-we-do, branding, and page settings mutations.

Current high-risk patterns:

- Media library loads all media assets by hub.
- Usage building can scan site settings, testimonials, events, courses, and users.
- Usage information is useful, but it does not need to block the primary media library shell.

## Target Architecture

Separate media asset listing from media usage reporting:

- Primary route:
  - Bounded media asset list.
  - Upload controls.
  - Search/filter/sort shell.

- Usage layer:
  - Lazy-loaded on demand or served from projection.
  - Does not block first render.

Potential projection:

- `hubs/{hubId}/mediaUsage/{assetId}`

Recommended fields:

- `hubId`
- `assetId`
- `usageCount`
- `references`
- `lastReferencedAt`
- `updatedAt`
- `schemaVersion`

Reference entry shape:

- `type`: `siteSettings`, `event`, `course`, `testimonial`, `whatWeDo`, `user`, `branding`, `page`
- `sourceId`
- `label`
- `adminHref`

Recommended delivery decision:

- Implement lazy usage loading first because it removes the initial route bottleneck with lower migration risk.
- Add the usage projection after the media route first render is bounded and stable.
- Do not block the media library shell on usage counts.

Asset performance rule:

- Media listing performance is not only Firestore read count.
- Public image performance must account for file size, dimensions, responsive URLs, CDN caching, and image metadata.
- Admin media listing should avoid loading full-resolution assets in every card where thumbnails are sufficient.

## Implementation Phases

### Phase 1: Bound Media Asset Listing

- Add cursor pagination for media assets.
- Keep filters and search bounded.
- Avoid loading all assets by default.
- Add indexes for media listing sort/filter fields.
- Load thumbnail/display metadata only for the list view.

Acceptance criteria:

- Media route first load reads one page of assets.
- Pagination does not re-read all assets.
- Large original images do not block the first useful media list render.

### Phase 2: Lazy Load Usage

- Remove usage scanning from initial media list fetch.
- Add usage panel or per-item lazy fetch when an asset row/card is expanded.
- Show explicit usage loading state inside the item detail area only.
- Keep lazy usage fetch bounded to the selected asset or visible page of assets.
- Cache usage result per request where safe.

Acceptance criteria:

- Media library can render assets before usage data is available.
- Usage display remains available to admins.
- Expanding one asset does not scan unrelated usage if a projection is available.

### Phase 3: Add Usage Projection If Needed

- Create `mediaUsage` projection.
- Update admin mutations that attach/detach media references.
- Backfill existing media usage.
- Add reconciliation script.
- Store references as compact metadata, not full source documents.
- Remove stale references when source content is deleted or media is detached.

Acceptance criteria:

- Usage query for one asset is a direct document lookup.
- Usage summary for a page of assets is a bounded multi-read or batched lookup.
- Projection can be rebuilt if drift occurs.
- Projection updates are idempotent.

### Phase 4: Integrate With Public Cache Invalidation

- Media updates that affect public assets must invalidate relevant public content tags.
- Asset metadata-only updates should not flush unrelated content unless public display changes.
- Maintain a mapping from media reference type to cache tags:
  - Home/page sections.
  - Events.
  - Courses.
  - Testimonials.
  - What-we-do.
  - Branding/header/footer.

Acceptance criteria:

- Updating a public hero/image refreshes cached public content.
- Updating unused media does not invalidate public pages unnecessarily.

### Phase 5: Reconciliation And Cleanup

- Add a usage reconciliation path that scans source content intentionally when requested.
- Detect references to missing media.
- Detect media assets with stale usage rows.
- Provide repair behavior for stale projection rows.

Acceptance criteria:

- Usage projection drift can be corrected.
- Deleted content no longer appears as an active media reference after reconciliation.

## Edge Cases

- Same image reused in multiple page sections.
- Same image reused in events, courses, and testimonials.
- Media asset deleted while still referenced.
- Referenced content deleted.
- Asset metadata changes but binary does not.
- Binary/image changes but asset id remains the same.
- Custom domain public cache still contains an old image.
- Very large media library.
- Very large original images.
- Failed upload leaving partial metadata.
- User avatar/media references included in usage scans.

## Verification Checklist

- Test media route for hub with few assets.
- Test media route for hub with many assets.
- Test usage expansion for one asset.
- Test image replacement in public home/settings.
- Test event/course/testimonial media attachment changes.
- Confirm first render is not blocked by usage graph scan.
- Confirm thumbnails/responsive images load instead of full originals where applicable.
- Confirm public cache invalidation for media-backed public sections.
- Run scoped checks and `git diff --check`.
