# Roles and Permissions (Matrix)

## Roles
- **Superadmin**: platform operator (your company)
- **Hub Admin**: staff/volunteers for a specific hub
- **Member**: user belonging to exactly one hub

## Tenancy rule (locked)
- One user belongs to **one hub** in MVP.

## Permission matrix

### Platform Superadmin (`/platform/*`, platform domain only)
Superadmin can:
- Create/edit hubs (name, slug, templateKey, token overrides)
- Configure hub feature flags
- Configure custom domain mapping (public/member only)
- Invite hub admins (invite-only onboarding)
- Enter support mode to manage a hub’s admin portal
- In support mode, manage:
  - events
  - memberships + plans
  - registrations, waitlist promotions, payment and attendance flags

### Hub Admin (`/{hubSlug}/admin/*`, platform domain only)
Hub admin can:
- Create/edit/publish/cancel events
- Manage registrations (registered/waitlisted/cancelled)
- Promote from waitlist to registered
- Mark registration payment status (paid/unpaid/not-required)
- Mark attendance (unknown/attended/no-show) for registered attendees
- Remove/cancel registrations
- Create/edit membership plans
- Manage memberships (pending/active/expired/inactive/cancelled)
- Mark membership paid/unpaid and renew memberships

Hub admin can view feature flags:
- Enabled features: normal UI
- Disabled features: show `FeatureLocked` upsell screen (not a 404)

### Member (hub site + member portal)
Member can:
- View public hub pages (plus member-only pages if gated)
- See membership status and perks
- Register/RSVP for events depending on event eligibility rules
- Cancel their own registration (cutoff window is a future enhancement)
- Cancel their membership

### Guest (not logged in)
Guest can:
- View hub landing, schedule, event details, contact, custom pages (unless page/event is members-only)
Guest cannot:
- Register for events without creating an account
- Access member portal

## Access gates (non-negotiable)
- Authorization must be enforced server-side for protected routes.
- UI visibility is not an access control mechanism.
