# Hub-Platform Stripe Native Payments Phase 2 Events Plan

Status:
- Proposed
- Execution-ready planning document

Date:
- 2026-04-29

Purpose:
- Define the next production-grade native-payments slice after membership upgrades
- Lock scope to Growth-only event payments
- Establish a clear cancellation and refund model before implementation begins

Authority:
- [Hub-Platform Stripe Native Payments Phase 1 Closeout](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/hub-platform-stripe-native-payments-phase-1-closeout-2026-04-29.md)
- [Hub-Platform Stripe Native Payments Phase 1 Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/hub-platform-stripe-native-payments-phase-1-plan-2026-04-29.md)
- [Stripe Two-Domain Architecture Note](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/stripe-two-domain-architecture-note-2026-04-20.md)
- [Offering Next-Steps Pages Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/offering-next-steps-pages-plan-2026-04-09.md)
- Stripe Connect direct-charge and refund guidance:
  - https://docs.stripe.com/connect/direct-charges
  - https://docs.stripe.com/connect/charges
  - https://docs.stripe.com/connect/direct-charges-fee-payer-behavior

## 1) Executive Position

Phase 2 should be:

1. Growth-only native event payments
2. built on the same connected-account, checkout, and webhook foundation as Phase 1
3. production-grade about cancellations and refunds from the start

Phase 2 should not:

- change Starter behavior
- introduce course payments in the same slice
- introduce recurring billing
- hand-wave refunds with "manual for now" language

Starter is already handled:

- paid Starter events remain external/manual
- paid Growth events are the new native-payment target

## 2) Locked Tier Boundary

This tier boundary is now explicit.

### Growth

Growth should support:

- native Stripe checkout for paid events
- Stripe-backed cancellation and refund operations
- admin payment visibility through `/admin/payments`

### Starter

Starter should remain on the existing external/manual event-payment model.

Phase 2 must not blur that distinction in code, UI, or copy.

## 3) Recommended Refund And Cancellation Position

This needs to be locked before coding because the event lifecycle affects:

- member expectations
- admin operations
- Stripe refund handling
- Hubforj application-fee behavior

### 3.1 Product recommendation

Do not hardcode one platform-wide cancellation window for every event.

Instead:

- define a hub-level default cancellation/refund policy
- allow an event-level override when needed

This gives a production-grade balance:

- most hubs can use a sensible default
- specific events can tighten or relax the rule

### 3.2 Recommended initial policy model

Phase 2 should support:

- `refundWindowMode`
  - `default`
  - `custom`
- `refundWindowHours`
  - integer hours before event start
- `refundPolicy`
  - `full_refund_before_window`
  - `non_refundable`

Recommended initial operational behavior:

- full refund if member cancels before the allowed cutoff
- no automatic refund once inside the cutoff window
- admin may still perform a manual override refund later

This keeps the member-facing rule simple while still giving admins an escape hatch.

### 3.3 Why admin-configurable is better than hardcoding 24 or 48 hours

Some events need:

- 24 hours
- 48 hours
- a week
- no refunds at all

So a hardcoded platform window will quickly become wrong for real hubs.

The better production-grade design is:

- hub default
- optional per-event override

with a sensible default such as `48` hours for new hubs or events.

## 4) Locked Stripe Refund Position

Phase 2 should treat refunds as first-class operational work, not a later patch.

For the direct-charge Connect model we are using:

- refunds are created on the connected account
- Hubforj performs the refund while authenticated as that connected account
- if Hubforj took an application fee, the refund flow must explicitly handle that fee too

Stripe documents that application fees are not automatically refunded on direct-charge refunds. The refund flow must intentionally refund the application fee as well, otherwise the connected account loses that amount:

- https://docs.stripe.com/connect/direct-charges

Therefore the locked rule for Phase 2 is:

- a full event refund should also refund the Hubforj application fee
- a partial event refund should proportionally refund the Hubforj application fee

We should not leave the connected hub owner holding the platform fee on a refunded event payment.

## 5) Scope For Phase 2

Phase 2 should include:

1. Growth-only event checkout initiation
2. native event payment transaction persistence
3. webhook reconciliation for event purchases
4. member-facing event cancellation flow
5. Stripe-backed refund handling according to the event policy
6. admin visibility of event-native transactions and refunds

Phase 2 should exclude:

- courses
- recurring memberships
- charge disputes/chargebacks workflow
- payout/export reporting
- generalized provider abstraction beyond Stripe

## 6) Repo-Aware Implementation Direction

Phase 2 should build on existing event surfaces rather than inventing new ones.

Primary candidate surfaces:

- event detail CTA flow
- event booking / next-steps route
- admin event registrations
- admin payments queue

The same pattern established in Phase 1 should be reused:

1. member starts checkout from a truthful event booking flow
2. native transaction record is created
3. Stripe Checkout runs on the connected account
4. browser return is not treated as authoritative payment truth
5. webhook reconciliation updates operational records
6. cancellation/refund rules are applied from server-side policy

## 7) Recommended Data Additions

Phase 2 should add explicit event payment-policy fields to the event model, for example:

- `refundWindowMode`
- `refundWindowHours`
- `refundPolicy`

It should also extend the native transaction domain with event-specific linkage, for example:

- `kind = "event_registration"`
- `eventId`
- `eventTitle`
- `registrationId`
- `refundStatus`
- `refundAmount`
- `refundedAt`
- `stripeRefundId`

This should remain a dedicated native transaction model, not an overload of generic event registration payment fields.

## 8) Admin UX Ownership

The route ownership should remain:

- `Stripe setup`
  - connected-account readiness only
- `Payments`
  - transaction queue and refund operations
- `Membership plans`
  - plan configuration

Phase 2 should not move finance operations into event settings or account settings just because events are the new payment surface.

The finance workspace remains the canonical operations surface.

## 9) Member UX Position

Member event UX should be explicit and honest:

- if the event is Starter paid:
  - external/manual flow stays unchanged
- if the event is Growth paid:
  - native card checkout is available
- if cancellation is still eligible for refund:
  - member can cancel and receive the configured refund
- if the event is inside the cutoff:
  - UI should say the payment is no longer automatically refundable

The member should never have to guess whether a cancellation still qualifies for reimbursement.

## 10) Delivery Sequence

Recommended sequence:

1. policy model and event-field additions
2. event native transaction model additions
3. Growth event checkout initiation
4. webhook reconciliation
5. member cancellation and refund flow
6. admin refund visibility and controls
7. QA and regression sweep

This keeps the refund model designed before checkout behavior hardens around the wrong assumptions.

## 11) Acceptance Criteria

Phase 2 is complete when:

- Growth paid events can use native Stripe checkout
- Starter paid events still use the existing external/manual path
- the event cancellation/refund policy is explicit and enforced
- members can clearly see whether cancellation is still refundable
- Stripe refunds are issued correctly on the connected account
- application fees are refunded appropriately on refunded event payments
- admin payments visibility distinguishes event-native transactions from membership-native transactions
- webhook reconciliation, cancellation, and refund flows are all test-covered and operationally truthful
