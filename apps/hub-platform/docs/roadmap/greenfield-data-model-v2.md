# Greenfield Data Model v2

Status:
- Proposed
- Canonical domain model for the greenfield rebuild

Purpose:
- Define the entities, required fields, core relationships, and state boundaries for the new implementation.
- Prevent schema drift before implementation begins.

Authority:
- Derived from:
  - `docs/product/data-model.md`
  - `docs/product/events-and-registrations.md`
  - `docs/product/membership-flow.md`
  - `docs/product/state-machines.md`
  - `docs/roadmap/greenfield-product-scope-v2.md`
  - `docs/roadmap/greenfield-route-map-v2.md`

Hard rule:
- The new app must use `hub` terminology consistently:
  - `hub`
  - `hubId`
  - `hubSlug`

---

## 1) Data Model Philosophy

The greenfield model must be:
- explicit
- operationally correct
- structured
- simple to reason about
- resistant to accidental schema sprawl

The greenfield model must avoid:
- generic CMS/page-builder entities as core platform requirements
- overloaded documents with mixed responsibilities
- ambiguous status fields without explicit state machines

---

## 2) Tenancy Rules

Locked assumptions:
- the product is hub-scoped
- one user belongs to one hub in the initial foundation
- protected operational data is isolated by `hubId`
- one shared Firebase project is used for all hubs

Preferred organization:
- `hubs/{hubId}` as the primary root for hub-owned data

Alternative patterns may be used where justified, but the system must always preserve explicit hub ownership.

---

## 3) Core Entities

## 3.1 Hub

Represents a tenant hub organization.

Required:
- `id`
- `name`
- `slug`
- `status`
- `themeKey`
- `tokenOverrides`
- `contactEmail`
- `createdAt`
- `updatedAt`

Recommended:
- `description`
- `logoMediaId`
- `supportEmail`
- `supportPhone`
- `timezone`
- `locale`
- `customDomains[]`
- `features`

`status`:
- `active`
- `inactive`

`features` may include:
- `stripePayments`
- `courses`
- other add-ons approved later

Notes:
- The greenfield model should not require CMS-specific fields on the `Hub` entity.
- Public-site rendering should be driven by structured settings/config, not page-builder records.

---

## 3.2 User

Represents an authenticated person associated with one hub.

Required:
- `id`
- `hubId`
- `role`
- `email`
- `name`
- `status`
- `createdAt`
- `updatedAt`

Recommended:
- `avatarMediaId`
- `phone`
- `lastSignInAt`

`role`:
- `member`
- `admin`
- `superadmin`

`status`:
- `active`
- `invited`
- `suspended`

Notes:
- `superadmin` remains platform-authoritative.
- `admin` and `member` are hub-scoped roles.

---

## 3.3 AdminInvite

Represents an invite issued to a future hub admin.

Required:
- `id`
- `hubId`
- `email`
- `status`
- `invitedByUserId`
- `expiresAt`
- `createdAt`

`status`:
- `pending`
- `accepted`
- `expired`
- `revoked`

---

## 3.4 MembershipPlan

Defines a membership offer for a hub.

Required:
- `id`
- `hubId`
- `title`
- `description`
- `price`
- `currency`
- `durationUnit`
- `durationValue`
- `status`
- `createdAt`
- `updatedAt`

Recommended:
- `summary`
- `sortOrder`
- `highlighted`
- `features[]`
- `stripeProductId`
- `stripePriceId`

`status`:
- `active`
- `inactive`
- `archived`

`durationUnit`:
- `days`
- `months`
- `years`

Notes:
- Plans are structured product records, not freeform CMS content.

---

## 3.5 Membership

Represents a user’s membership relationship to the hub.

Required:
- `id`
- `hubId`
- `userId`
- `planId`
- `status`
- `paymentStatus`
- `startDate`
- `renewalDate`
- `createdAt`
- `updatedAt`

Recommended:
- `gracePeriodDaysOverride`
- `notes`
- `cancelledAt`
- `cancelledByUserId`

`status` and `paymentStatus` must follow the canonical state machine.

Notes:
- `expired` is system-derived, not manually assigned.

---

## 3.6 Event

Represents a bookable event.

Required:
- `id`
- `hubId`
- `slug`
- `status`
- `title`
- `description`
- `startAt`
- `endAt`
- `location`
- `capacity`
- `pricingMode`
- `registrationEligibility`
- `visibility`
- `createdAt`
- `updatedAt`

Recommended:
- `heroMediaId`
- `galleryMediaIds[]`
- `category`
- `tags[]`
- `price`
- `currency`
- `summary`
- `publishedAt`

`status`:
- `draft`
- `published`
- `cancelled`

`pricingMode`:
- `free`
- `paid`

`registrationEligibility`:
- `members-only`
- `account-required`

`visibility`:
- `public`
- `members-only`

Notes:
- The prior `guests-allowed` wording should be normalized to account-based participation if that is the actual product rule.
- If true guest registrations are later supported, add a separate explicit rule instead of overloading semantics.

---

## 3.7 Course

Represents a course offering. The exact course/session model can evolve, but the first-class entity should exist now.

Required:
- `id`
- `hubId`
- `slug`
- `status`
- `title`
- `description`
- `capacity`
- `pricingMode`
- `registrationEligibility`
- `visibility`
- `createdAt`
- `updatedAt`

Recommended:
- `summary`
- `heroMediaId`
- `price`
- `currency`
- `sessionCount`
- `scheduleSummary`
- `startAt`
- `endAt`

`status`:
- `draft`
- `published`
- `cancelled`

Notes:
- If courses later require child session entities, that should be an additive design, not a reason to treat `Course` as ambiguous now.

---

## 3.8 Registration

Represents a user booking for an event.

Required:
- `id`
- `hubId`
- `eventId`
- `userId`
- `status`
- `paymentStatus`
- `attendanceStatus`
- `createdAt`
- `updatedAt`

Recommended:
- `notes`
- `cancelledAt`
- `cancelledByUserId`

Notes:
- Capacity and waitlist logic are domain rules, not freeform UI concerns.

---

## 3.9 CourseRegistration

Represents a user booking for a course.

Required:
- `id`
- `hubId`
- `courseId`
- `userId`
- `status`
- `paymentStatus`
- `attendanceStatus`
- `createdAt`
- `updatedAt`

Recommended:
- `notes`
- `cancelledAt`
- `cancelledByUserId`

Notes:
- This may share behavior with event registrations, but should stay explicit at the data-contract layer.

---

## 3.10 Testimonial

Represents a reusable testimonial record for public-site use.

Required:
- `id`
- `hubId`
- `status`
- `quote`
- `authorName`
- `createdAt`
- `updatedAt`

Recommended:
- `authorRole`
- `authorOrganization`
- `avatarMediaId`
- `sortOrder`
- `featured`

`status`:
- `draft`
- `published`
- `archived`

Notes:
- Testimonials are structured content and operationally managed records.

---

## 3.11 SiteSettings

Represents structured hub-level public site configuration.

Required:
- `hubId`
- `siteName`
- `contactEmail`
- `updatedAt`

Recommended:
- `tagline`
- `logoMediaId`
- `contactPhone`
- `address`
- `socialLinks`
- `seoDefaults`
- `themeKey`

Notes:
- Keep this entity focused on global site settings.

---

## 3.12 NavigationConfig

Represents structured navigation and footer config.

Required:
- `hubId`
- `headerItems[]`
- `footerItems[]`
- `updatedAt`

Recommended:
- `primaryCta`
- `secondaryCta`
- `footerMeta`

Notes:
- This replaces the need for generic header/footer CMS editing.

---

## 3.13 HomePageConfig

Represents structured configuration for the public hub homepage.

Required:
- `hubId`
- `updatedAt`

Recommended:
- `hero`
- `featureHighlights[]`
- `featuredEventIds[]`
- `featuredCourseIds[]`
- `featuredTestimonialIds[]`
- `announcement`
- `ctaBand`

Notes:
- Keep homepage composition structured and bounded.

---

## 3.14 MediaAsset

Represents a reusable uploaded asset supporting structured content and operational records.

Required:
- `id`
- `hubId`
- `filename`
- `type`
- `contentType`
- `storagePath`
- `publicUrl`
- `sizeBytes`
- `status`
- `createdAt`
- `updatedAt`

Recommended:
- `width`
- `height`
- `alt`
- `folderId`
- `usageRefs[]`
- `usageCount`

`type`:
- `image`
- `video`
- `pdf`
- `file`

`status`:
- `active`
- `deleted`

Notes:
- Media exists to support the product, not to become a product center in itself.

---

## 3.15 MediaFolder

Optional but supported organization unit for media assets.

Required:
- `id`
- `hubId`
- `name`
- `system`
- `createdAt`
- `updatedAt`

Notes:
- single-level only
- no nested folder trees

---

## 4) Core Relationships

- `Hub` has many `User`
- `Hub` has many `AdminInvite`
- `Hub` has many `MembershipPlan`
- `User` has many `Membership`
- `Hub` has many `Event`
- `Hub` has many `Course`
- `Event` has many `Registration`
- `Course` has many `CourseRegistration`
- `Hub` has many `Testimonial`
- `Hub` has one `SiteSettings`
- `Hub` has one `NavigationConfig`
- `Hub` has one `HomePageConfig`
- `Hub` has many `MediaAsset`
- `Hub` has many `MediaFolder`

---

## 5) Canonical State-Machine Bindings

The following entities are governed by explicit state machines:

- `Membership`
- `Event`
- `Course` (should mirror event publishing semantics unless later differentiated)
- `Registration`
- `CourseRegistration`
- payment status axes
- attendance status axes

State transitions must be implemented as domain rules, not ad-hoc UI mutations.

---

## 6) Explicitly Excluded Entities

The greenfield initial foundation does not require:
- generic `Page`
- generic `PageBlock`
- generic `PageComposition`
- draft/live page-builder records
- arbitrary block registry entities as a core product model

If a future structured informational-page system is needed, it should be introduced deliberately and not as a carry-over from the current CMS architecture.

---

## 7) Data Design Rules

### 7.1 Required conventions

- ids are canonical document identifiers
- payloads should not redundantly persist ids inside nested bodies unless justified
- timestamps must be explicit
- `hubId` ownership must be unambiguous
- status fields must map to documented state machines

### 7.2 Avoid

- mixed-responsibility documents
- generic JSON blobs where explicit structure is known
- content-builder abstractions in core operational entities

---

## 8) Immediate Follow-up Documents

This data model should be followed by:

1. greenfield shell/navigation spec
2. greenfield roles-to-actions matrix if needed in more detail
3. greenfield implementation checklist for the new app bootstrap
