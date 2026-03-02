# Core Data Model (MVP)

This document defines the canonical MVP entities, required fields, and state machines.
All entities are hub-scoped (tenant isolation).

## Tenancy (locked)
- One Firebase project.
- Data is scoped by hub, typically:
  - `/hubs/{hubId}/...` subcollections, OR
  - documents with explicit `hubId` field.
- One user belongs to one hub in MVP.

## Entities

### Hub
Represents a tenant/community hub.

Required:
- `id`
- `name`
- `slug` (used in platform-domain routes)
- `templateKey`
- `tokenOverrides` (object / map)
- `globalHeaderId`
- `globalFooterId`
- `features` (object of booleans)
- `customDomains[]` (optional)
- `themeRevision` (int; cache-busting revision for generated hub theme CSS)
- `themeCssPath` (storage path: `hubs/{hubId}/theme/theme-overrides.css`)

Example features:
- `cmsPages`
- `stripePayments`
- `emailNotifications` (future)

### User
Auth identity + hub association.

Required:
- `id` (uid)
- `hubId`
- `role`: `member | admin | superadmin`
- `email`
- `name`
Optional:
- `avatarMediaId?`
- `createdAt`

> Superadmin users are platform-level; hub admins are hub-scoped admins.

### MembershipPlan
Defined by hub admins (and visible on website).

Required:
- `id`
- `hubId`
- `title`
- `description` (plain text or WYSIWYG content)
- `durationUnit`: `days | months | years`
- `durationValue`: integer
- `price` (number; currency assumed hub-level or platform-level config)
- `active` (boolean)
Optional:
- `sortOrder`
- `stripeProductId?` (future)

### Membership
Represents a user’s membership instance.

Required:
- `id`
- `hubId`
- `userId`
- `planId`
- `status` (see state machine)
- `paymentStatus` (see state machine)
- `startDate`
- `renewalDate`
Optional:
- `gracePeriodDaysOverride?`
- `notes?`
- `updatedAt`

#### Membership status state machine (locked)
- `pending`
- `active`
- `expired` (system-derived only: renewalDate + grace)
- `inactive` (admin manual)
- `cancelled` (terminal)

Transitions:
- `pending -> active` (admin marks paid OR Stripe confirms later)
- `active -> expired` (system)
- `expired -> active` (admin renews + marks paid)
- `active <-> inactive` (admin manual)
- `pending/active/expired/inactive -> cancelled` (member/admin)

#### Membership paymentStatus
- `not-required` (rare: free plan)
- `unpaid`
- `paid`
- `refunded` (future)

### Event
Events are created by admins.

Required:
- `id`
- `hubId`
- `slug`
- `status` (see state machine)
- `title`
- `description` (WYSIWYG)
- `imageMediaIds[]` (can be one; support multiple)
- `startAt`
- `endAt`
- `location`
- `capacity`
- `category`: `Workshop | Meetup | Course`
- `tags[]`
- `pricingMode`: `free | paid`
- `price?` (required if paid)
- `registrationEligibility`: `members-only | guests-allowed`
- `visibility`: `public | members-only`
- `createdAt`, `updatedAt`

#### Event status state machine (locked)
- `draft`
- `published`
- `cancelled`

Transitions:
- `draft -> published`
- `published -> cancelled`
- `published -> draft` is disallowed once registrations exist

### Registration
A member/guest account’s registration for an event.

Required:
- `id`
- `hubId`
- `eventId`
- `userId`
- `status`
- `paymentStatus`
- `attendanceStatus`
- `createdAt`, `updatedAt`

#### Registration status (locked)
- `registered`
- `waitlisted`
- `cancelled`

Transitions:
- `waitlisted -> registered` (admin promote)
- `registered -> cancelled` (member/admin)
- `waitlisted -> cancelled` (member/admin)
- `cancelled -> registered` (optional future; not required MVP)

Capacity rule:
- if registeredCount < capacity => new regs become `registered`
- else => `waitlisted`

#### Registration paymentStatus (locked)
- `not-required` (free event)
- `unpaid` (paid event and no Stripe or not paid)
- `paid`
- `refunded` (future)

Rule:
- paid event with Stripe disabled: allow `unpaid` registrations; admin can mark `paid` manually

#### Attendance status (locked)
- `unknown` (default)
- `attended`
- `no-show`

Rules:
- Admin-only
- Only for `registered` (not waitlisted)
- Not allowed for cancelled registrations

### Page (CMS)
Custom pages beyond home/events/contact are supported.

Required:
- `id`
- `hubId`
- `slug`
- `title`
- `status`
- `draftComposition[]`
- `publishedComposition[]`
- `headerIdOverride?`
- `footerIdOverride?`
- `seo` (recommended)
- timestamps

### Media
Media library for hub assets.

MUST follow `docs/product/media-library.md`.

Required:
- `id`
- `hubId`
- `url`
- `alt`
- `width`, `height`
- `createdAt`
Optional:
- `mimeType`, `size`
