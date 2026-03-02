# Media Library Spec (MVP Canonical)

This document defines the canonical Media Library behavior, data model, permissions, and UX flows.
It applies to:
- CMS pages (sections/blocks)
- Events (images)
- Membership plans (optional images)
- Member avatars (separate permissions)

Authority:
- Must align with:
  - `docs/product/data-model.md`
  - `docs/product/cms-pages.md`
  - `docs/product/events-and-registrations.md`
  - `docs/product/cms-block-registry.md`
  - `docs/standards/ops-quality-and-security.md`
  - `docs/standards/nextjs-runtime-performance.md`
  - `docs/standards/loading-error-and-resilience.md`

---

## 1) Storage and access model (LOCKED)

### 1.1 Storage access posture (public-read)
- MUST make hub media assets publicly readable (by URL) for production reliability and performance.
- MUST restrict writes by role and hub scoping (server-side and/or security rules).
- MUST NOT store sensitive documents (IDs, contracts, private paperwork) in this Media Library.
  - If sensitive docs are needed later, MUST implement a separate “Secure Documents” feature with private storage + signed URLs.

### 1.2 Storage paths (HARD)
- All stored objects MUST be scoped by hub.
- Storage object path MUST be:
  - `hubs/{hubId}/media/{mediaId}/{filename}`

### 1.3 Rendering (HARD)
- All images MUST be rendered via `ui/image/AppImage.jsx` (wraps `next/image`) unless explicitly justified.
- AppImage MUST reserve layout space (width/height or fill + sizes) to avoid CLS.
- Videos MUST be rendered via a reusable section/pattern (do not inline random `<video>` tags everywhere).

---

## 2) Data model (LOCKED)

### 2.1 Media folder model (single-level, MVP)
Folders are single-level only (no nesting).

Folder document:
- Collection: `hubs/{hubId}/mediaFolders/{folderId}`
- Required fields:
  - `id`, `hubId`
  - `name` (required; uniqueness per hub recommended)
  - `createdAt`, `createdByUserId`
  - `updatedAt?`
- System folder:
  - “All assets” MUST exist by default (system folder).
  - Deleting a folder MUST move its assets to “All assets”.
  - “All assets” MUST NOT be deletable.

### 2.2 Media model (hub assets)
Media document:
- Collection: `hubs/{hubId}/media/{mediaId}`
- Required fields:
  - `id`, `hubId`
  - `filename`
  - `storagePath`
  - `publicUrl` (or resolvable URL)
  - `type`: `image | video | pdf`
  - `contentType`
  - `sizeBytes`
  - `folderId` (defaults to “All assets”)
  - `createdAt`, `createdByUserId`
  - `status`: `active | deleted` (soft delete recommended)
  - `alt` (required at publish/save time when used in public-facing content; see section 4)
- Image-only fields:
  - `width`, `height`

Usage index (HARD for deletion + UX):
- `usageCount` (int)
- `usageRefs[]` (array of compact references)

UsageRef shape (MVP):
- MUST include:
  - `kind`: `pageBlock | event | membershipPlan | header | footer`
  - `label`: human readable (e.g. `Home — Hero`)
- SHOULD include stable IDs for navigation:
  - `pageId`, `pageSlug`, `blockId`
  - `eventId`, `eventSlug`
  - `planId`
  - `headerId` / `footerId` (if stored as entities)

Rule:
- usageRefs MUST be updated when content is published/saved and when references are removed.

### 2.3 Avatar media (member uploads)
Members can upload avatars but MUST NOT see the hub media library.

Avatar media rules:
- Avatar uploads MUST reuse the Media schema (same field set), but MUST be permission-isolated.
- Recommended storage path for avatars:
  - `hubs/{hubId}/users/{userId}/avatar/{mediaId}/{filename}`
- Recommended metadata location:
  - `hubs/{hubId}/users/{userId}/avatarMedia/{mediaId}` (or `hubs/{hubId}/userMedia/{mediaId}`)
- Members MUST only read/write their own avatar media.
- Hub admins/superadmin MAY read avatar media for display, but members MUST NOT browse hub assets.

---

## 3) Media Library UI/UX (MVP)

### 3.1 Main library layout
Media Library UI MUST support:
- Folder list (cards):
  - shows folder name + number of assets
  - includes menu (vertical dots) for edit/delete folder
- Asset browser with tabs:
  - All
  - Images
  - Videos
  - PDFs
  - Missing alt
  - Recently added
- Search:
  - MUST search by filename, alt text, and folder name

### 3.2 Folder operations
- Create folder:
  - folder name required
- Edit folder:
  - opens modal with folder name input
  - save/cancel actions
- Delete folder:
  - opens confirm modal
  - moves assets to “All assets”
  - system folder “All assets” is not deletable

### 3.3 Upload flow (multi-file)
Add assets flow MUST support:
- Select folder (required)
- Select files (multi-file)
- Before upload:
  - show list of filenames + file sizes
  - show a card per asset with:
    - preview (thumbnail where possible)
    - filename
    - file size (e.g. 47.5KB)
    - status tag: queued / uploading / uploaded / failed
    - remove button per file
- Actions:
  - Upload button label includes count: `Upload (N)`
  - Cancel button cancels entire batch (without losing already-uploaded files)

Upload statuses:
- queued
- uploading
- uploaded
- failed (retry allowed)

### 3.4 Selecting media in forms (Use media)
- Selecting media MUST open Media Library selector UI.
- User selects asset(s) then clicks `Use media`.
- Selector closes and returns to the prior form with assets applied.

Member avatar selection:
- Members MUST use a simplified avatar picker/uploader that only accesses their avatar media.
- Members MUST NOT see the hub media library UI.

### 3.5 Asset details panel (right column)
Asset details panel MUST provide:
- Preview/open asset
- Dimensions (images)
- Date added
- File name
- Alt text input
- Move to folder (select folder)
- Usage references list:
  - shows `usageCount` and each reference label (e.g. `Home — Hero`)
- Content type and size
- Aspect ratio control:
  - SHOULD be handled by consuming component/section where possible.
  - Media library MAY show a suggested aspect ratio but MUST NOT mutate files.

### 3.6 Video support (MVP)
- Media library MUST support uploading video files (`type=video`).
- Asset details MUST show: filename, size, content type, date added, folder, usage refs.
- Video rendering MUST be implemented via a dedicated section/pattern.
- MUST NOT scatter custom `<video>` implementations across sections.

---

## 4) Alt text policy (LOCKED)

### 4.1 Enforcement timing
- Alt text MUST be enforced at publish/save time, not upload time.

### 4.2 Where alt is required
Alt MUST be present for assets referenced by:
- published pages/sections
- published events (event image)
- published headers/footers if they reference images

Alt is NOT required for:
- member avatar images (decorative)

### 4.3 Missing-alt UX
- Media Library MUST provide a `Missing alt` tab.
- CMS publish and event publish MUST block if referenced assets are missing alt and show actionable messaging.

---

## 5) Deletion policy (LOCKED)

### 5.1 Prohibition on deleting referenced assets
- If `usageCount > 0`, deletion MUST be prohibited.
- UI MUST show a modal explaining:
  - the asset is in use
  - list of usage references
  - user cannot delete until references are removed

### 5.2 Soft delete (recommended)
- If `usageCount == 0`, deletion SHOULD:
  - mark `status=deleted`
  - and remove/archive storage object (implementation choice)
- Superadmin-only hard delete MAY be added later (not required MVP).

---

## 6) Usage index maintenance (HARD)

Because deletion depends on usage refs, usage MUST be maintained deterministically:
- When content is published/saved:
  - system MUST compute media references in that content and update media docs:
    - add new usage refs
    - remove old usage refs
    - update usageCount
- When content is unpublished/removed:
  - system MUST remove corresponding usage refs and update usageCount
- The update MUST be hub-scoped and idempotent.

Forbidden:
- MUST NOT scan the entire database on each delete attempt.
- MUST NOT rely on best-effort usage tracking.

---

## 7) Next.js and performance requirements (HARD)
- Images MUST use AppImage (next/image).
- Media lists MUST paginate/cursor-load; MUST NOT load all assets at once.
- Search SHOULD be server-backed for large hubs (MVP may start simple but must scale).
- Provide skeletons in media browser for perceived performance.

---

## 8) Security requirements (HARD)
- Writes MUST be restricted:
  - hub assets: superadmin and hub admins only
  - avatar media: member can write only their own
- Reads:
  - hub assets are public-read by URL (MVP posture)
  - avatar media is readable by the owning member and optionally readable by admins for display

- Upload endpoints MUST be rate limited (see `docs/standards/ops-quality-and-security.md`).
