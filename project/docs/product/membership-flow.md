# Membership Flow Spec (MVP)

## Goal
Enable account creation, plan selection, membership status lifecycle, and admin-managed payment when Stripe is disabled.

## Onboarding flow (locked)
1) User creates account (belongs to one hub).
2) User chooses a membership plan.
3) Membership is created:
   - If Stripe enabled and payment succeeds: `status=active`, `paymentStatus=paid`
   - If Stripe disabled: `status=pending`, `paymentStatus=unpaid`
4) Member can view membership status in `/account/membership`.

## Renewal and expiry (locked)
- `expired` is system-derived only:
  - when `now > renewalDate + gracePeriod`
- Admin can renew membership:
  - sets new renewalDate based on plan duration (or manual override)
  - sets `status=active` and `paymentStatus=paid` when paid

## Member actions (MVP)
- View membership status, renewal date, and plan
- Cancel membership:
  - sets `status=cancelled` (terminal)

## Hub admin actions (MVP)
- Create/edit membership plans
- View memberships and filter by status/payment
- Mark paid/unpaid
- Activate/deactivate memberships
- Renew membership (update renewalDate)
- Cancel membership

## Stripe add-on (scoped for future)
When `stripePayments` feature is enabled:
- Plan has Stripe product/price identifiers
- Membership activation is triggered by payment confirmation
- Refunds propagate to membership/payment records where relevant

## Email notifications (not MVP)
Email sending is deferred.
The system should be designed to emit intents for:
- membership activated
- membership expired
- membership renewed
