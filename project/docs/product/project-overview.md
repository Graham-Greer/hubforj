# Project Overview (North Star)

## What this product is
A multi-hub community platform where each **Hub** (tenant) gets:
- a themed public website (custom domain supported)
- a member portal (accounts, membership status, registrations)
- a hub admin portal (events, memberships, registrations, attendance)

The platform also includes a **Superadmin** area used by the product owner to:
- provision hubs (tenants)
- configure theming/tokens and feature flags
- invite hub admins
- enter “Support Mode” to manage a specific hub’s admin portal

## Surfaces
1) **Public Site** (hub themed; guest browsing allowed)
2) **Member Portal** (account required)
3) **Hub Admin Portal** (admin role required; platform domain only)
4) **Platform Superadmin** (superadmin required; platform domain only)

## Non-negotiable product constraints (locked)
- **Tenancy:** one Firebase project; hub-scoped data isolation
- **Domains:** custom domains for public/member site only; admin portals stay on platform domain
- **Roles:** superadmin / hub admin / member
- **Routing:** custom pages at `/{hubSlug}/pages/{pageSlug}`
- **SEO slugs:** pages and events use slugs (store both `id` + `slug`)
- **Membership onboarding:** create account → choose plan → membership becomes:
  - **active** if Stripe enabled and payment succeeds
  - **pending/unpaid** if Stripe disabled (admin later marks paid)

## Feature flags (hub-scoped)
Hubs have feature flags visible in hub admin (with locked upsell screens when disabled).
MVP flags include:
- `cmsPages` (superadmin-only CMS first; hub-admin CMS later as add-on)
- `stripePayments` (optional add-on; MVP supports offline payment tracking)
- `emailNotifications` (scoped for future; not implemented in MVP)

## What “MVP” means here
MVP must support:
- provisioning hubs and admins (superadmin)
- hub admin operations for events, memberships, registrations, payment + attendance tracking
- CMS for custom pages (superadmin-only initially)
- public site + member portal that render hub content and support event registration rules
