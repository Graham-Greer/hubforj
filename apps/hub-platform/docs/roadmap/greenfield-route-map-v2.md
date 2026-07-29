# Greenfield Route Map v2

Status:
- Proposed
- Canonical route authority for the greenfield rebuild

Purpose:
- Define the approved route map for the new application before implementation begins.
- Prevent route sprawl, shell ambiguity, and accidental recreation of the current repo's drift.

Authority:
- Derived from:
  - `docs/product/routes-and-gating.md`
  - `docs/product/roles-and-permissions.md`
  - `docs/product/auth-and-session.md`
  - `docs/roadmap/greenfield-product-scope-v2.md`
  - `docs/roadmap/greenfield-architecture-decision-record-v2.md`

Hard rule:
- No new route may be introduced into the greenfield app unless this document is updated first.

---

## 1) Route Philosophy

The route map must stay:
- explicit
- shallow where possible
- user-centric
- aligned to jobs-to-be-done
- consistent with shell ownership

The route map must avoid:
- route sprawl
- redundant nested surfaces
- multiple routes for the same job without clear reason
- inventing route depth to compensate for weak information architecture

---

## 2) Surface Model

The product has four route surfaces:

1. Public site
2. Member portal
3. Hub admin
4. Platform superadmin

Each surface has:
- its own shell
- its own navigation rules
- its own route authority

---

## 3) Domain and Host Rules

### 3.1 Platform domain

Platform domain is used for:
- superadmin
- hub admin
- auth/session establishment where appropriate
- support/access escalation flows

### 3.2 Hub branded domain

Hub branded/custom domain is used for:
- public site
- member portal

### 3.3 Locked rule

Admin portals MUST NOT run on custom domains.

---

## 4) Hub Resolution

Hub context resolves in this order:

1. host header matches a configured custom domain
2. else path-based hub slug on platform domain

Examples:
- custom domain: `https://hub.example.com`
- platform domain: `https://platform.example.com/{hubSlug}`

---

## 5) Public Site Routes

Purpose:
- branded public-facing experience
- discovery of events, courses, and hub information

### 5.1 Canonical public routes on platform domain

- `/{hubSlug}`
- `/{hubSlug}/about`
- `/{hubSlug}/events`
- `/{hubSlug}/events/{eventSlug}`
- `/{hubSlug}/courses`
- `/{hubSlug}/courses/{courseSlug}`
- `/{hubSlug}/testimonials`
- `/{hubSlug}/contact`
- `/{hubSlug}/join`
- `/{hubSlug}/sign-in`

### 5.2 Canonical public routes on custom domain

- `/`
- `/about`
- `/events`
- `/events/{eventSlug}`
- `/courses`
- `/courses/{courseSlug}`
- `/testimonials`
- `/contact`
- `/join`
- `/sign-in`

### 5.3 Public route notes

- Public site pages are developer-owned route compositions.
- “About”, “Testimonials”, and “Contact” may be omitted by a specific implementation if not needed, but if present they must use these canonical paths.
- Additional marketing/informational routes may be approved later, but only if added to this document first.

---

## 6) Member Portal Routes

Purpose:
- member-facing authenticated surface
- focused on account, membership, bookings, and payments

### 6.1 Canonical member routes on platform domain

- `/{hubSlug}/account`
- `/{hubSlug}/account/membership`
- `/{hubSlug}/account/registrations`
- `/{hubSlug}/account/courses`
- `/{hubSlug}/account/payments`
- `/{hubSlug}/account/profile`

### 6.2 Canonical member routes on custom domain

- `/account`
- `/account/membership`
- `/account/registrations`
- `/account/courses`
- `/account/payments`
- `/account/profile`

### 6.3 Member route notes

- Member portal should remain narrow and calm.
- Do not turn the member portal into a second admin experience.
- Any future additions must remain clearly member-owned, not staff-owned.

---

## 7) Hub Admin Routes

Purpose:
- operational workspace for hub staff/admins

Community admin should optimize for clear jobs-to-be-done, not route density.

### 7.1 Canonical hub admin root

- `/{hubSlug}/admin`

This route should function as the operational overview/dashboard.

### 7.2 People and roles

- `/{hubSlug}/admin/admins`
- `/{hubSlug}/admin/admins/invite`
- `/{hubSlug}/admin/members`
- `/{hubSlug}/admin/members/{memberId}`

### 7.3 Events

- `/{hubSlug}/admin/events`
- `/{hubSlug}/admin/events/create`
- `/{hubSlug}/admin/events/{eventId}`
- `/{hubSlug}/admin/events/{eventId}/registrations`
- `/{hubSlug}/admin/events/{eventId}/attendance`

### 7.4 Courses

- `/{hubSlug}/admin/courses`
- `/{hubSlug}/admin/courses/create`
- `/{hubSlug}/admin/courses/{courseId}`
- `/{hubSlug}/admin/courses/{courseId}/registrations`
- `/{hubSlug}/admin/courses/{courseId}/attendance`

### 7.5 Testimonials

- `/{hubSlug}/admin/testimonials`
- `/{hubSlug}/admin/testimonials/create`
- `/{hubSlug}/admin/testimonials/{testimonialId}`

### 7.6 Payments

- `/{hubSlug}/admin/payments`

This route may aggregate event, course, and membership payment operations.

### 7.7 Site settings

- `/{hubSlug}/admin/settings`
- `/{hubSlug}/admin/settings/branding`
- `/{hubSlug}/admin/settings/navigation`
- `/{hubSlug}/admin/settings/site`

### 7.8 Media

- `/{hubSlug}/admin/media`

This route is the canonical hub-scoped media workspace for:
- asset upload
- folder organization
- asset selection support for structured forms
- usage visibility
- safe asset management

### 7.9 Admin route notes

- Keep the admin route map intentional and comprehensible.
- Avoid creating separate routes when a detail panel or in-page section is the better UX.
- Do not create deep nested settings trees.
- Do not create a route merely to compensate for weak page composition.

---

## 8) Platform Superadmin Routes

Purpose:
- internal product-owner/operator workspace

### 8.1 Superadmin root

- `/platform`

This route should act as the superadmin overview/workspace entry.

### 8.2 Communities

- `/platform/hubs`
- `/platform/hubs/create`
- `/platform/hubs/{hubId}`
- `/platform/hubs/{hubId}/invite-admin`

### 8.3 Support mode / access escalation

- `/platform/support/{hubId}`

This is an explicit context-switch route, not a normal workspace tab.

### 8.4 Superadmin route notes

- Canonical product naming is `hub`.
- No second permanent sidebar should emerge from route growth; hub context should remain controlled by the shell.

---

## 9) Auth Routes

Auth routes should stay simple and canonical.

### 9.1 Platform-level auth

- `/platform/sign-in`

### 9.2 Community-facing auth

Platform domain:
- `/{hubSlug}/sign-in`
- `/{hubSlug}/join`

Custom domain:
- `/sign-in`
- `/join`

### 9.3 Auth route notes

- Protected-route access remains server-enforced.
- Auth routes should not create redirect churn.
- Post-auth navigation must resolve to the canonical destination for the user role.

---

## 10) Gating Rules

### 10.1 Public routes

- accessible to guests by default
- certain content may require membership/sign-in

### 10.2 Member routes

- require authenticated member session

### 10.3 Community admin routes

- require `admin` role for the hub
- `superadmin` may access via explicit support/access context as approved by auth/session model

### 10.4 Platform routes

- require `superadmin`

---

## 11) Route Group Guidance for App Router

Recommended route groups:

- `(platform)` for `/platform/*`
- `(admin)` for `/{hubSlug}/admin/*`
- `(public)` for public site routes
- `(member)` for member portal routes

Guidance:
- preserve persistent shells
- do not remount major navigation unnecessarily
- route files must remain composition shells only

---

## 12) Explicitly Disallowed Route Patterns

The following patterns are disallowed unless this document changes:

- tenant-facing arbitrary page-builder routes
- ad-hoc nested admin routes with no clear information-architecture reason
- duplicate routes for the same operational task
- catch-all “content” or “cms” route trees for generic page composition
- custom-domain admin routes

Examples of disallowed shapes:
- `/{hubSlug}/admin/cms/*`
- `/{hubSlug}/admin/content/*` as a generic catch-all
- `/platform/content/*` as a generalized editor system

---

## 13) Naming Decision

The greenfield route map uses `hub` / `hubSlug`.

This is the canonical naming decision for the new app.

Do not mix `community` back into implementation naming for routes, ids, slugs, or primary entities.

---

## 14) Immediate Follow-up Documents Required

Before implementation starts, this route map should be followed by:

1. greenfield data model v2
2. greenfield shell/navigation specification
3. greenfield route-to-role matrix if more detail is needed
