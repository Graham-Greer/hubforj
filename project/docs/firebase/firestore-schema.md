# Firestore Schema (Canonical, Hub-Scoped)

Goal:
- Define a production-grade Firestore schema that enforces hub scoping and supports required queries.
- Prevent Codex from inventing collection layouts or denormalization inconsistently.

Authority:
- `docs/product/data-model.md` (business entities + fields)
- `docs/product/state-machines.md` (status fields + transitions)
- `docs/product/media-library.md` (media/folders/usageRefs + delete prohibition)

---

## 1) Tenancy model (LOCKED)
- One Firebase project.
- Hub is the tenant boundary.
- Every domain object MUST be stored under `hubs/{hubId}/...` OR include `hubId` and be rule-enforced.
- MVP: one user belongs to one hub.

Design rule (HARD):
- Prefer hub-scoped subcollections under `/hubs/{hubId}/...` for tenant isolation.
- Use a small top-level `/users/{uid}` profile doc only for cross-surface identity and role/hub binding.

---

## 2) Top-level collections

### 2.1 `/users/{uid}` (identity + role binding)
Purpose:
- Bind a Firebase Auth user to a hub and role.
- Provide stable lookup for rules and server logic.

Required fields:
- `uid` (document id)
- `hubId`
- `role`: `member | admin | superadmin`
- `email`
- `name`
- `createdAt`
Optional:
- `avatarMediaId` (member avatar media id)
- `updatedAt`

Hard rules:
- Users MUST NOT belong to multiple hubs in MVP.
- Role MUST be one of the locked roles.

---

## 3) Hub-scoped collections (`/hubs/{hubId}/...`)

### 3.1 `/hubs/{hubId}`
Fields (minimum):
- `name`
- `slug`
- `templateKey`
- `tokenOverrides` (map)
- `globalHeaderId`
- `globalFooterId`
- `features` (map)
- `customDomains[]` (optional)
- `themeRevision` (int; cache-busting revision for generated hub CSS)
- `themeCssPath` (storage path, e.g. `hubs/{hubId}/theme/theme-overrides.css`)

### 3.2 `/hubs/{hubId}/invites/{inviteId}` (admin invites)
Fields:
- `email`
- `role`: `admin`
- `status`: `pending | accepted | revoked`
- `createdAt`, `createdBy` (superadmin id)
- `acceptedAt?`, `revokedAt?`

### 3.3 `/hubs/{hubId}/membershipPlans/{planId}`
Fields per product spec:
- `title`, `description`, `durationUnit`, `durationValue`, `price`, `active`
- timestamps
Optional:
- `imageMediaId?`

### 3.4 `/hubs/{hubId}/memberships/{membershipId}`
Fields:
- `userId`
- `planId`
- `status` (pending/active/expired/inactive/cancelled)
- `paymentStatus` (not-required/unpaid/paid/refunded)
- `startDate`, `renewalDate`
- timestamps

Query requirements:
- list memberships by `status`
- list memberships for `userId`
- admin: list all memberships sorted by renewalDate

### 3.5 `/hubs/{hubId}/events/{eventId}`
Fields:
- `slug`
- `status` (draft/published/cancelled)
- `title`
- `description` (WYSIWYG content)
- `imageMediaIds[]`
- `startAt`, `endAt`
- `location`
- `capacity`
- `category` (Workshop/Meetup/Course)
- `tags[]`
- `pricingMode` (free/paid) + `price?`
- `registrationEligibility` (members-only/guests-allowed)
- `visibility` (public/members-only)
- timestamps

Optional denormalized counters (recommended):
- `registeredCount`
- `waitlistedCount`

### 3.6 `/hubs/{hubId}/events/{eventId}/registrations/{registrationId}`
Registration is naturally scoped to an event.

Fields:
- `userId`
- `status` (registered/waitlisted/cancelled)
- `paymentStatus` (not-required/unpaid/paid/refunded)
- `attendanceStatus` (unknown/attended/no-show)
- timestamps

Query requirements:
- list registrations for an event (admin)
- list registrations for a user across events (member portal)
  - Recommended denormalization:
    - also write to `/hubs/{hubId}/users/{uid}/registrations/{registrationId}` as a view index (optional), OR
    - query via collection group `registrations` filtered by `userId` and `hubId` (requires careful indexes)
  - MVP recommendation:
    - create a per-user index subcollection under hub for fast member portal reads.

### 3.7 `/hubs/{hubId}/pages/{pageId}`
Fields:
- `slug`, `title`
- `draftComposition[]`, `publishedComposition[]`
- `headerIdOverride?`, `footerIdOverride?`
- `seo` (title/description/image)
- timestamps

Query requirements:
- fetch by `slug` (published)
- fetch draft by id (superadmin CMS)

### 3.8 `/hubs/{hubId}/mediaFolders/{folderId}`
Fields:
- `name` (required)
- system folder: “All assets” (not deletable)
- timestamps

### 3.9 `/hubs/{hubId}/media/{mediaId}`
Fields per media library:
- `filename`, `storagePath`, `publicUrl`
- `type` (image/video/pdf), `contentType`, `sizeBytes`
- `folderId`
- `alt`
- image fields: `width`, `height`
- `usageCount`, `usageRefs[]`
- timestamps
- `status` (active/deleted)

### 3.10 Avatar media (member-only uploads)
Recommended (hub-scoped, user-scoped):
- `/hubs/{hubId}/users/{uid}/avatarMedia/{mediaId}`

Fields reuse Media schema; permissions are user-scoped.

---

## 4) Indexes (MVP guidance)
Codex MUST create Firestore composite indexes for these query patterns:

Events:
- published upcoming events: `status == "published"` + `startAt` order
- events by `slug` (use direct query on `slug`)

Registrations:
- registrations list by `status` order createdAt
- member portal index: by `userId` and startAt (if stored)

Pages:
- published pages by slug

Memberships:
- memberships by `userId` and status
- memberships by renewalDate

Media:
- media by folderId + createdAt
- missing alt tab: `alt == ""` (or null) + createdAt
- recently added: createdAt desc

Note:
- Prefer explicit subcollection queries over collection group queries unless necessary.
