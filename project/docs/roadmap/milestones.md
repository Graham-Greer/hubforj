# Milestones (Stage 1–4)

This is the canonical build sequence for product delivery. It complements:
- `docs/component-build-order.md` (component dependency order)

## Stage 1 — Superadmin hub provisioning (M1)
Deliver:
- Superadmin portal layout (`/platform/*`)
- Create/edit hub
- Set templateKey + token overrides
- Configure custom domains (public/member only)
- Configure feature flags
- Invite hub admins
- Support mode entry into hub admin portal

Acceptance criteria:
- Hub can be created and appears on platform hub list
- Hub config persists and can be edited
- Hub admin invites are created/revoked
- Support mode is explicit and visible (banner) and can be exited cleanly

## Stage 2 — Hub admin events + memberships (M2)
Deliver:
- Hub admin portal shell (`/{hubSlug}/admin/*`) with collapsible side nav + top nav
- Events CRUD: draft/publish/cancel; event fields and WYSIWYG description
- Registrations table: waitlist, payment status, attendance marking, remove/cancel
- MembershipPlan CRUD
- Membership management: pending/active/expired/inactive/cancelled; renew; mark paid

Acceptance criteria:
- Admin can publish events and members can view them on hub site
- Registrations enforce capacity + waitlist correctly
- Attendance and payment flags are editable per rules
- Membership expiry is system-derived; admin renewal works

## Stage 3 — CMS pages (M3)
Deliver:
- Superadmin-only pages CMS:
  - create custom pages
  - block composition editor
  - draft/publish
  - preview vs live parity
- Header/footer global config and per-page overrides
- Hub admins see CMS as locked feature (FeatureLocked)

Acceptance criteria:
- Published pages render at `/{hubSlug}/pages/{pageSlug}` and on custom domain
- Draft preview renders draft (no-store) and matches live components
- Headers/footers can be set globally and overridden per page

## Stage 4 — Public/member site (M4)
Deliver:
- Public hub site rendering with theming:
  - landing, events list/detail, custom pages, contact
- Member onboarding:
  - create account → choose plan → membership activation rules
- Member portal:
  - membership status, registrations, cancellations
- Event registration rules:
  - members-only vs guests-allowed; account required; waitlist; cancellation

Acceptance criteria:
- Hub pages are themed via templateKey/tokens
- Custom domains resolve correct hub
- Member signup flow creates correct membership states
- Registration, waitlist, payment, attendance rules behave as specified
