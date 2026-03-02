# Route Map and Gating Rules

This is the canonical route map. Routes are grouped by surface and enforced via server-side gating.

MUST read `docs/firebase/auth-and-session.md`

## Hub resolution
A request resolves hub context by:
1) **Host header** matches a configured custom domain → hub is that domain’s hub
2) Else **path-based hub slug** on platform domain: `/{hubSlug}/...`

## Domain rules (locked)
- **Public/Member site**: platform domain OR hub custom domain
- **Admin portals**: platform domain only (no admin on custom domain)

## Public site (hub)
Accessible without login unless explicitly gated by `visibility` rules.

Platform-domain examples:
- `/{hubSlug}` (hub landing)
- `/{hubSlug}/events`
- `/{hubSlug}/events/{eventSlug}`
- `/{hubSlug}/pages/{pageSlug}`
- `/{hubSlug}/join`
- `/{hubSlug}/sign-in`

Custom-domain equivalents:
- `/` (hub landing)
- `/events`
- `/events/{eventSlug}`
- `/pages/{pageSlug}`
- `/join`
- `/sign-in`

### Public gating
- Pages/events may be set `visibility = members-only`:
  - guests see sign-in/join CTA
  - members can view if logged in

## Member portal (hub)
Requires login.

Platform-domain examples:
- `/{hubSlug}/account`
- `/{hubSlug}/account/registrations`
- `/{hubSlug}/account/membership`

Custom-domain equivalents:
- `/account`
- `/account/registrations`
- `/account/membership`

## Hub admin portal (platform domain only)
Requires hub admin role or superadmin support-mode context.

- `/{hubSlug}/admin`
- `/{hubSlug}/admin/events`
- `/{hubSlug}/admin/events/{eventId}`
- `/{hubSlug}/admin/members`
- `/{hubSlug}/admin/members/{memberId}`
- `/{hubSlug}/admin/membership-plans`
- `/{hubSlug}/admin/settings/features`
- Feature-locked routes (when disabled) must render `FeatureLocked` and not 404.

## Platform superadmin (platform domain only)
Requires superadmin.

- `/platform`
- `/platform/hubs`
- `/platform/hubs/create`
- `/platform/hubs/{hubId}` (hub config)
- `/platform/hubs/{hubId}/invite-admin`
- `/platform/support/{hubId}` (enter support mode → redirect to `/{hubSlug}/admin`)

## Next.js layout guidance (performance)
Use App Router route groups to keep navigation persistent:
- `(platform)` for `/platform/*`
- `(admin)` for `/{hubSlug}/admin/*`
- `(public)` for hub public routes
- `(member)` for member portal routes

Do not remount nav shells unnecessarily.
