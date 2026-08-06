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
  - Unknown usage must be treated as pending, not as zero.
  - Destructive asset actions must remain blocked until usage has been loaded or verified server-side.

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
- Make UI copy clear when counts/search are scoped to loaded assets.
- Preserve picker mode by fetching a selected asset directly if it is not present in the first media page.

Acceptance criteria:

- Media route first load reads one page of assets.
- Pagination does not re-read all assets.
- Large original images do not block the first useful media list render.
- Folder counts on the route do not imply full-library counts unless backed by a projection or aggregate.
- Selected picker assets remain available even when outside the first page.

Implementation status:

- Implemented initial bounded admin media route loading with a default 48-asset page.
- Added cursor pagination through `/api/admin/hubs/[hubSlug]/media/assets`.
- Initial folder counts now represent loaded assets only and are labelled accordingly.
- Full-library server-side search and folder aggregate counts are intentionally deferred until a dedicated query/index pass.

### Phase 2: Lazy Load Usage

- Remove usage scanning from initial media list fetch.
- Add usage panel or per-item lazy fetch when an asset row/card is expanded.
- Show explicit usage loading state inside the item detail area only.
- Keep lazy usage fetch bounded to the selected asset or visible page of assets.
- Cache usage result per request where safe.
- Prevent asset deletion in the client while usage is unknown.
- Keep the server delete action authoritative by rechecking usage immediately before deletion.
- Track Firestore indexes required by lazy usage source queries.
- Return partial usage data with a verification flag for the admin UI when one source query fails, but keep destructive server-side checks strict.
- Make selected-asset usage fetching idempotent per mounted media workspace so rerenders cannot repeatedly call the same usage endpoint.

Acceptance criteria:

- Media library can render assets before usage data is available.
- Usage display remains available to admins.
- Expanding one asset does not scan unrelated usage if a projection is available.
- The details panel never shows `0 references` while usage has not loaded.
- If lazy usage fails, the admin sees an inline usage error and destructive actions remain safe.
- Missing or building indexes cannot make the UI claim an asset is unused.
- Selecting one asset does not trigger repeated usage fetches for that same asset during ordinary rerenders.

Implementation status:

- Removed initial media route usage graph scanning.
- Added selected-asset usage loading through `/api/admin/hubs/[hubSlug]/media/assets/[assetId]/usage`.
- Added a targeted usage query that checks only references for the selected asset across site settings, homepage media, page hero media, testimonials, events, event series, courses, and users.
- Marked usage-backed records as `usageLoaded: true`; page-list records start as `usageLoaded: false`.
- Asset deletion remains protected by client disablement and by the existing server-side usage check.
- Added the required `users` index for `hubId + avatarAssetId`.
- Added tolerant selected-asset usage reporting for the admin UI while keeping `buildMediaUsageForAssetId` strict for delete verification.
- Added a ref-backed client request guard so each selected asset usage lookup is attempted once per mounted workspace.

### Phase 2B: Bound Embedded Media Pickers

- Remove full media library reads from admin create/edit/settings routes that only need a media field.
- Keep route shells and form titles fast by rendering fields before picker assets are fetched.
- Fetch the currently selected asset by id only when a field needs to render an existing preview.
- Fetch media picker pages only when the admin opens the existing-media picker.
- Reuse the protected media asset pagination endpoint from the media library.
- Use metadata-only asset reads for previews; do not run usage verification for ordinary form rendering.
- Preserve upload folder selection by continuing to load media folders server-side while folder counts remain scoped/metadata-only.

Acceptance criteria:

- Event create/edit routes do not call `listMediaAssetsByHubId`.
- Course create/edit routes do not call `listMediaAssetsByHubId`.
- Testimonial create/edit routes do not call `listMediaAssetsByHubId`.
- Branding and public page settings routes do not call `listMediaAssetsByHubId`.
- Existing selected media previews still render after the field hydrates the selected asset by id.
- Opening the existing-media picker loads a bounded first page and supports loading more assets.
- Batch media hydration for event/course/testimonial/list previews does not build the full usage graph.
- Embedded picker first-page size should be smaller than the dedicated media library first-page size because picker users need quick selection, not full-library browsing.

Implementation status:

- Removed admin form route usage of `listMediaAssetsByHubId`.
- Added protected metadata endpoint `/api/admin/hubs/[hubSlug]/media/assets/[assetId]`.
- Added `getMediaAssetMetadataById` for preview-only reads.
- Updated `MediaAssetField` to lazy-load selected asset metadata and picker pages.
- Updated `getMediaAssetsByIds` to return metadata-only assets without usage graph scanning.
- Updated site settings admin form value readers to avoid media hydration because form values only require asset ids and alt text.
- Fixed the selected-preview picker state so an edit form can hydrate the currently selected image without incorrectly marking the picker library page as loaded.
- Set embedded picker first-page requests to 24 assets while keeping the dedicated media library route at the larger media-library page size.

Production verification checklist:

- Hard refresh each embedded media form route in production with Chrome DevTools Network open.
- Confirm no route-level request calls the full media asset library before the form shell renders.
- Confirm opening the existing-media picker triggers one bounded `/api/admin/hubs/[hubSlug]/media/assets` request.
- Confirm embedded picker requests include `limit=24`.
- Confirm a selected existing asset outside the first page still renders its preview through `/api/admin/hubs/[hubSlug]/media/assets/[assetId]`.
- Confirm the picker first page contains the bounded media library page, not only the previously selected asset.
- Confirm removing an existing selected asset and then opening the picker shows a first-page loading state until the bounded media library page arrives, rather than briefly presenting the previous selected asset as if it were the full library.
- Confirm the picker supports load-more pagination without replacing the selected preview.
- Confirm create routes with no selected asset do not call the selected-asset metadata endpoint.
- Confirm edit routes with selected media do not call the usage endpoint merely to render the form.
- Confirm route navigation and hard refresh show the same picker behavior.
- Confirm the media library page itself still lazy-loads usage only for the selected asset.
- Capture before/after screenshots for at least:
  - event create
  - event edit
  - course create
  - course edit
  - testimonial create
  - testimonial edit
  - branding settings
  - homepage settings
  - events page settings
  - courses page settings
  - testimonials page settings

Regression lock:

- Admin form routes must not import `listMediaAssetsByHubId`.
- `MediaAssetField` must treat incoming `assets` as preview seed data, not proof that the picker page has loaded.
- Full-library media reads are reserved for dedicated admin media workflows or deliberate maintenance scripts.
- Usage verification must not be part of ordinary form rendering.

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

Implementation status:

- Added `hubs/{hubId}/mediaUsage/{assetId}` projection support.
- Projection documents store:
  - `hubId`
  - `assetId`
  - `usageCount`
  - `references`
  - `lastReferencedAt`
  - `updatedAt`
  - `schemaVersion`
- Added direct projection reads for `getMediaAssetUsageById`.
- Kept targeted scan fallback when a projection document does not yet exist.
- When fallback verification completes successfully, the projection is repaired for that asset.
- Verified zero-usage assets now receive an explicit zero-usage projection so they do not repeatedly fall back to scans.
- Asset deletion removes its projection document after strict live usage verification passes.
- Wired projection maintenance into:
  - event create/update/delete
  - course create/update/delete
  - recurring event-series create/update
  - testimonial create/update/delete
  - member avatar update/remove
  - branding settings media changes
  - homepage media changes
  - events page hero media changes
  - courses page hero media changes
  - testimonials page hero media changes
  - general site settings writes that may affect the shared site settings document
- Delete verification still uses the strict source-of-truth usage scan, not projection-only state.

Remaining production verification:

- Select a media asset with known event usage and confirm the usage panel is served from `mediaUsage` after one successful lookup or after editing the event.
- Select an unused media asset twice and confirm the second lookup does not perform the fallback source scan.
- Change an event image from asset A to asset B and confirm asset A loses the event reference while asset B gains it.
- Remove a testimonial author image and confirm the relevant projection reference is removed.
- Change branding logo and page hero media and confirm site settings references move correctly.
- Delete an unused asset and confirm its `mediaUsage/{assetId}` document is removed.
- Confirm a stale or missing projection never allows deletion of a genuinely referenced asset because delete still performs strict verification.

Known tradeoff:

- Existing hubs will not have complete projection coverage until assets are selected once, edited through the updated admin flows, or processed by a future reconciliation/backfill script.
- This is intentional for the first production-safe projection release because it avoids a broad migration while preserving correct usage results through fallback scanning.

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

Implementation status:

- Public media asset create/update/delete actions revalidate the admin media route and public media cache tags through `revalidatePublicMediaCache`.
- Public site/settings actions that can change branding, homepage, page hero, or shell media references revalidate the public shell/home/events/courses/testimonials paths and public shell cache tags.
- Event, course, testimonial, user avatar, event-series, and site-settings mutation paths maintain `mediaUsage` projection rows at the same time as source records change.
- The support-only media usage reconciliation report provides a backstop for cache/projection drift after migrations, incidents, or legacy data changes.
- Metadata-only asset reads remain lightweight and do not run usage verification during form rendering.

Remaining verification:

- Confirm public cache invalidation after changing:
  - branding logo
  - homepage hero media
  - homepage info media
  - events page hero media
  - courses page hero media
  - testimonials page hero media
  - event/course/testimonial content image
- Confirm media metadata changes that do not affect public references do not trigger unexpected broad route reads.

### Phase 5: Reconciliation And Cleanup

- Add a usage reconciliation path that scans source content intentionally when requested.
- Detect references to missing media.
- Detect media assets with stale usage rows.
- Provide repair behavior for stale projection rows.

Acceptance criteria:

- Usage projection drift can be corrected.
- Deleted content no longer appears as an active media reference after reconciliation.

Implementation status:

- Added `getHubMediaUsageReconciliationReport(hubId)` as a support-only read path for deliberate source/projection comparison.
- The report scans active media assets, current source references, and existing `mediaUsage` projection rows intentionally during support diagnostics only.
- The report flags:
  - missing projection rows for active assets
  - projection schema mismatches
  - projected usage count mismatches
  - projected reference mismatches
  - orphan projection rows for missing/inactive assets
  - source references that point to missing/inactive media assets
- Added `rebuildHubMediaUsageProjections(hubId, actorId)` as the safe repair/backfill path.
- The repair path writes one projection row per active asset, including explicit zero-usage rows, using bounded Firestore write batches.
- The repair path deletes orphaned `mediaUsage` rows when the asset no longer exists or is inactive.
- The repair path does not mutate source content when a page/event/course/testimonial/user references a missing asset; those remain visible as reconciliation issues for support/manual correction.
- Added support-mode diagnostics and a **Sync media usage** action on `/admin/media`.
- The diagnostics panel is hidden in embedded picker mode so content-editing media selection remains uncluttered.

Rollout verification:

1. Enter support mode for a production hub.
2. Open `/admin/media`.
3. Confirm the media usage diagnostics panel displays active asset, projection row, source reference, and open issue counts.
4. Run **Sync media usage**.
5. Confirm the page returns with `Media usage projections synced.`
6. Confirm the diagnostics report no longer flags missing/stale/orphaned projection rows, except source references to genuinely missing/inactive assets.
7. Select an asset with known usage and confirm the usage panel resolves from projection.
8. Select an unused asset twice and confirm the second lookup is served from the explicit zero-usage projection.
9. Confirm deleting an unused asset removes its `mediaUsage/{assetId}` row.

## Edge Cases

- Same image reused in multiple page sections.
- Same image reused in events, courses, and testimonials.
- Same image reused in branding, homepage hero, homepage info media, and per-page heroes.
- Same image reused on generated or recurring event-series records.
- Media asset deleted while still referenced.
- Referenced content deleted.
- Asset metadata changes but binary does not.
- Binary/image changes but asset id remains the same.
- Custom domain public cache still contains an old image.
- Very large media library.
- Very large original images.
- Failed upload leaving partial metadata.
- User avatar/media references included in usage scans.
- Picker mode references an asset outside the first loaded page.
- Admin filters a folder where not all assets have been loaded yet.
- Admin searches for an asset that exists outside the loaded page.
- Usage fetch fails after the asset details panel has rendered.
- React rerenders while an asset usage lookup is in flight or after it has completed.
- Asset selected from an older page has been deleted by another admin before usage loads.
- Required usage index is deployed but still building.
- One usage source fails while other sources return valid references.

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
- Deploy Firestore indexes and confirm the `users` `hubId + avatarAssetId` index is built before relying on avatar usage checks in production.

## Current Tradeoffs

- Search, filter, and folder counts are currently scoped to loaded assets. This keeps first render bounded but means a large library may require loading more pages before a match is visible.
- Folder deletion still updates all assets in the folder server-side. For very large folders, this remains a potential write-heavy operation and should be revisited with batched pagination or a folder archive model if folder sizes become large.
- Selected-asset usage now prefers the `mediaUsage` projection. It falls back to targeted source queries only when the projection is missing, then repairs the projection after a complete verification.
- Embedded admin media pickers now lazy-load bounded media pages instead of calling `listMediaAssetsByHubId`.
- Existing hubs still need either natural admin edits, selected-asset fallback repair, or a future reconciliation/backfill run before every asset has a projection document.
- Support-only media usage sync now provides the future reconciliation/backfill path for existing hubs; source references to missing assets remain manual correction items because the repair path must not guess which replacement media should be used.
