# State Machines (Canonical)

This document codifies the locked state machines for Memberships, Events, Registrations, Payments, and Attendance.

These rules are authoritative for:
- database schema and validation
- UI state rendering
- admin actions
- business logic and permissions

---

## 1) Membership State Machine

### Membership.status
- `pending` — user selected plan; Stripe disabled or payment not confirmed yet
- `active` — membership valid
- `expired` — renewal date passed + grace period elapsed (**system-derived only**)
- `inactive` — manually deactivated by admin (not time-based)
- `cancelled` — cancelled by member or admin (terminal)

### Membership.paymentStatus (separate axis)
- `not-required` (rare; free plan)
- `unpaid`
- `paid`
- `refunded` (future; Stripe add-on)

### Key dates
- `startDate`
- `renewalDate`
- `gracePeriodDays` (hub-level default; membership override optional)

### Allowed transitions
- `pending -> active` (admin marks paid OR Stripe confirms later)
- `active -> expired` (system: now > renewalDate + grace)
- `expired -> active` (admin renews + marks paid / payment confirmed)
- `active -> inactive` (admin manual)
- `inactive -> active` (admin manual)
- `pending -> cancelled` (member/admin)
- `active -> cancelled` (member/admin)
- `inactive -> cancelled` (member/admin)
- `expired -> cancelled` (optional)

Hard rules:
- `expired` MUST NOT be set manually by admins.
- Admin override uses `inactive` or direct renewal actions, not manual expiry.

---

## 2) Event Lifecycle State Machine

### Event.status
- `draft`
- `published`
- `cancelled`
- `archived` (optional; derived later, not required MVP)

### Allowed transitions (MVP)
- `draft -> published`
- `published -> cancelled`

Disallowed (locked):
- `published -> draft` when registrations exist (MVP: disallow entirely once published)

Optional later:
- `cancelled -> published` (restore)
- auto `archived` after endDate (admin UX)

---

## 3) Registration State Machine

### Registration.status
- `registered`
- `waitlisted`
- `cancelled`

### Allowed transitions
- `waitlisted -> registered` (admin promotes)
- `registered -> cancelled` (member/admin)
- `waitlisted -> cancelled` (member/admin)
- `cancelled -> registered` (optional future; not required MVP)

### Capacity rule
- if `registeredCount < capacity` => new registrations become `registered`
- else => `waitlisted`

Member cancellation:
- members CAN cancel their own registrations (cutoff window is a future enhancement)

---

## 4) Registration Payment Axis

### Registration.paymentStatus
- `not-required` (free event)
- `unpaid` (paid event; Stripe disabled or not yet paid)
- `paid`
- `refunded` (future; Stripe add-on)

Rules (locked):
- `pricingMode=free` => `not-required`
- `pricingMode=paid`:
  - Stripe disabled => allow register as `unpaid` and admin can mark paid later
  - Stripe enabled (future) => `paid` after checkout succeeds

---

## 5) Attendance Axis

### Registration.attendanceStatus
- `unknown` (default)
- `attended`
- `no-show`

Rules (locked):
- Admin-only.
- Can only be set when `Registration.status=registered`.
- MUST NOT mark attendance for cancelled registrations.
- If registration is cancelled after being marked attended/no-show, attendance must reset to `unknown` (or treated as irrelevant in UI).

---

## 6) Cancellation Policies (MVP defaults)

- Member cancellation allowed: YES
- Cancellation cutoff window: NONE (future enhancement)
- Refund logic: not MVP (Stripe later)

---

## 7) CMS Block Registry MVP (Summary)

CMS uses a block registry approach:
- Each block has: `type`, `variant`, `props`
- Structured forms for props; WYSIWYG only on approved rich-text fields
- Draft vs published compositions; preview uses draft (no-store), live uses published (cached/revalidate)
- CMS editing is superadmin-only initially; hub-admin CMS is a feature-flag add-on
