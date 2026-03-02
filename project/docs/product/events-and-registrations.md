# Events and Registrations Spec (MVP)

## Event creation (admin)
Admins can create events with:
- Title
- Description (WYSIWYG: bold/italic/underline/bullets/numbered/link only)
- Images (multi supported), read `docs/product/media-library.md`.
- Start/end date-time (custom DateTimePicker)
- Location (string)
- Capacity
- Category: Workshop/Meetup/Course
- Tags
- Pricing: free/paid + price
- Registration eligibility: members-only vs guests-allowed (account required regardless)
- Visibility: public vs members-only

## Event lifecycle (locked)
- draft → published → cancelled
- Disallow published → draft once registrations exist

## Registration eligibility rules (locked)
- Guests-allowed events:
  - user must have an account
  - membership not required
- Members-only events:
  - user must be a member (and typically active membership; define UI message for pending/expired)
- Visibility:
  - public vs members-only controls viewing event details

## Registration lifecycle (locked)
Statuses:
- registered
- waitlisted
- cancelled

Capacity:
- if registeredCount < capacity: new registration becomes registered
- else: waitlisted

Member cancellation:
- members can cancel their own registration (cutoff window later)

## Waitlist operations (admin)
- Admin can promote waitlisted → registered (manual)
- Admin can remove/cancel registrations
- Admin can increase capacity (optional; supports growth)

## Payment tracking (offline-first; Stripe optional)
Payment statuses:
- not-required (free)
- unpaid (paid event; not paid yet or Stripe disabled)
- paid
- refunded (future)

Rules:
- Stripe disabled: allow unpaid registrations; admin marks paid manually
- Stripe enabled (future): payment success sets paid automatically

## Attendance tracking (admin-only; locked)
Attendance statuses:
- unknown (default)
- attended
- no-show

Rules:
- Admin only
- Only for registered
- Not allowed for cancelled registrations

## Email notifications (not MVP)
Email sending deferred but scope includes:
- registration confirmation
- waitlist confirmation
- waitlist promotion
- cancellation confirmation
- admin broadcast to registrants
