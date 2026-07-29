# Hub-Platform Stripe Native Payments Phase 1 Plan

Status:
- Historical planning snapshot
- Implemented locally
- Superseded for current state by `hub-platform-stripe-native-payments-phase-1-closeout-2026-04-29.md`

Date:
- 2026-04-29

Purpose:
- Define the first production-grade Stripe implementation slice inside `hub-platform`
- Translate the existing monetisation model, member flows, and payment-status model into a realistic native-payments plan
- Prevent the Growth native-payments track from becoming an unbounded “Stripe everywhere” initiative

Authority:
- [Stripe Two-Domain Architecture Note](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/stripe-two-domain-architecture-note-2026-04-20.md)
- [Monetisation Tier And External Payments Model](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/monetisation-tier-and-external-payments-model-2026-04-08.md)
- [Membership Plan Default And Upgrade Model](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/membership-plan-default-and-upgrade-model-2026-04-08.md)
- [Membership Plan Visibility And Upgrade Operations](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/membership-plan-visibility-and-upgrade-operations-2026-04-08.md)
- [Offering Next-Steps Pages Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/offering-next-steps-pages-plan-2026-04-09.md)
- [Product Site And Commercial Platform Implementation Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-and-commercial-platform-implementation-plan-2026-04-20.md)
- app-local standards in `docs/standards/*`

Related:
- [Hubforj Domain Alignment And Host Resolution Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/hubforj-domain-alignment-and-host-resolution-plan-2026-04-29.md)
- [Hubforj Domain Cutover Checklist](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/hubforj-domain-cutover-checklist-2026-04-29.md)
- [Product Site Phase 6 Execution Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-phase-6-execution-plan-2026-04-20.md)

## 1) Executive Position

The first Stripe implementation inside `hub-platform` should be narrow, honest, and operationally complete.

It should not attempt to deliver:

- full native monetisation for memberships, events, and courses at once
- recurring billing
- refunds and disputes
- payouts reporting
- a generic payments platform abstraction before real flows exist

The first production-grade slice should be:

1. Growth-only native payment setup readiness for a hub
2. one self-serve member-facing native checkout flow
3. webhook-driven payment-state reconciliation
4. admin and member visibility that truthfully reflects the implemented state

The recommended first self-serve flow is:

- **paid membership upgrade on Growth**

That is the smallest, cleanest native-payments entry point in the current product.

## 1.1 Locked Stripe ownership and funds-flow position

Before implementation begins, the following decisions are now locked.

### Connected account ownership

Each client should use **their own Stripe account**.

Hubforj should not operate as the day-to-day owner of each customer’s Stripe business account.

The intended model is:

- client connects their own Stripe account to the hub
- Stripe remains the payment processor relationship for that client
- Hubforj orchestrates checkout and payment-state synchronization as the platform layer

### Connected account creation and onboarding route

Hubforj should create the connected-account record programmatically when a Growth hub enables native payments or reaches the payment-setup flow.

However, Hubforj should **not** assume that creating the account object means the account is ready to charge.

The locked route is:

1. Hubforj creates the connected account record
2. Hubforj presents Stripe onboarding inside Hubforj
3. the client completes onboarding and verification requirements
4. Hubforj reads Stripe account readiness and only then enables native payment flows

The onboarding experience should be embedded in Hubforj rather than requiring the admin to manage setup in Stripe as a separate day-to-day workflow.

### Embedded onboarding is the intended onboarding UX

The intended onboarding UX is:

- client begins payment setup inside Hubforj
- Hubforj renders Stripe embedded onboarding
- Stripe collects:
  - business details
  - identity verification
  - payout/bank details
  - other compliance requirements
- client completes onboarding without leaving the Hubforj application shell

This preserves the “one platform” user experience while still respecting Stripe’s compliance and verification requirements.

Hubforj should not attempt to bypass the client’s participation in onboarding.

### Connected-account configuration for Phase 1

Phase 1 should use **Stripe Express connected accounts** with Stripe-managed onboarding requirements and Hubforj-hosted embedded onboarding.

This is the best fit for the current product boundary because it allows:

- the client to own their Stripe relationship
- Hubforj to keep the setup flow inside `/admin/payments`
- Stripe to manage onboarding and verification requirements
- Hubforj to orchestrate the operational flow without forcing the client to build their catalogue in Stripe manually

### Operational source of truth

Hubforj should remain the operational source of truth for:

- membership plans
- paid events
- paid courses
- member/payment status visibility

Stripe should be treated as the payment rail, not the content or offering-management system.

That means the client should **not** be expected to:

- create membership products manually in Stripe
- create prices manually in Stripe for normal Hubforj usage
- maintain a parallel Stripe-side content catalogue by hand

Where Stripe objects are required, Hubforj should create them programmatically on the connected account.

### Fee model

Hubforj may still take a platform fee per transaction.

The intended commercial posture is:

- client owns the connected Stripe account
- client pays Stripe processing fees on that account
- Hubforj takes an application/platform fee from eligible native payments

This does **not** conflict with client-owned Stripe accounts.

### Phase 1 billing complexity limit

Phase 1 should not begin with true recurring subscription billing.

The first production-grade Stripe slice should use:

- one-time native checkout for the implemented membership-upgrade flow

and should explicitly avoid introducing, in the same phase:

- recurring subscription lifecycle
- self-serve cancellation
- proration
- saved payment methods as a product promise
- subscription-management UX

This keeps the first Stripe slice operationally credible instead of prematurely simulating a subscription platform.

## 1.2 Locked admin-portal ownership boundary

The admin-portal ownership boundary is now explicit.

### `/admin/payments` owns hub-native payment operations

All hub-native payment setup and operation should live in the `hub-platform` admin payments module:

- Stripe connected-account setup
- embedded onboarding
- payment readiness state
- native transaction visibility
- membership-plan payment-mode behavior
- member-facing native payment operational follow-up

This is the canonical admin route for the native-payments domain:

- `/{hubSlug}/admin/payments`

Recommended subviews:

- `view=setup`
- `view=payments`
- `view=plans`

### `/admin/settings/account` remains package and account context only

The account settings route should continue to represent:

- package visibility
- package limits
- custom-domain capability/status
- commercial package-management handoff back to the product site

It should **not** become the main Stripe setup workspace.

At most, it should show a compact payment-readiness summary with a CTA into `/admin/payments`.

### External package management remains outside `hub-platform`

The following commercial concerns remain owned by the product site and must not be conflated with native payments:

- Free / Starter / Growth package choice
- package upgrades and downgrades
- Hubforj SaaS billing
- commercial account management with Hubforj

This distinction is mandatory:

- **product site** = the hub’s commercial relationship with Hubforj
- **`hub-platform` payments module** = the hub’s own ability to take money from its members

The admin copy, route ownership, and data model should preserve this separation explicitly.

## 2) Why Membership Upgrades Should Be First

The repo currently already treats membership upgrades as the cleanest candidate for later self-serve payment handling.

### 2.1 Existing code and UX are already shaped around this seam

Current member flow:

- members join on the default free plan
- members discover public upgrade plans later
- Starter uses external payment plus admin confirmation
- Growth currently stays intentionally honest and does not pretend self-serve native checkout exists yet

Relevant files:

- [MemberMembershipWorkspace.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/patterns/member-membership-workspace/MemberMembershipWorkspace.jsx)
- [memberships.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/memberships.js)
- [membership-upgrade-requests.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/data/membership-upgrade-requests.js)
- [membership-user-records.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/data/membership-user-records.js)

### 2.2 It has lower operational complexity than event and course checkout

Membership upgrades do not currently depend on:

- capacity handling
- waitlist transitions
- event/course schedule windows
- offering-specific next-steps timing

By contrast, paid event and paid course journeys already combine:

- availability logic
- booking/enrolment state
- payment state
- next-steps guidance

That makes them valid later slices, but a poor first Stripe slice.

### 2.3 The roadmap already expected Growth membership upgrades to evolve first

Relevant docs already establish that:

- Growth membership upgrades should remain honest until native self-serve checkout really exists
- Starter remains external/manual
- Growth can later become built-in/native

This plan is therefore an implementation continuation of the current product position, not a new product decision.

## 3) Repo-Audited Current State

This section reflects the code as it exists today.

### 3.1 Package entitlement boundary is already correct

`hub-platform` already consumes package authority and resolves:

- `paymentProcessingMode = "none" | "external" | "internal"`
- Growth-only native payment capability

Relevant files:

- [hub-package.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/hub-package.js)
- [package-guards.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/package-guards.js)
- [data/hubs.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/data/hubs.js)

### 3.2 Current “payments” are operational status records, not Stripe-backed transactions

Current payment handling in code is based on:

- `paymentStatus`
- operational records for memberships, event registrations, and course registrations
- admin-side manual payment-status updates

Relevant files:

- [payments.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/payments.js)
- [hub-payments.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/data/hub-payments.js)
- [membership-payment-records.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/data/membership-payment-records.js)
- [event-registration-mutations.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/data/event-registration-mutations.js)
- [course-registration-mutations.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/data/course-registration-mutations.js)

### 3.3 There is no native Stripe transaction model yet

The repo does **not** yet have:

- Stripe account connection for hubs
- Stripe customer creation for members
- checkout-session creation inside `hub-platform`
- payment-intent persistence
- Stripe webhook endpoint inside `hub-platform`
- canonical mapping between Stripe payment objects and membership/event/course records

### 3.4 Growth public/member UX is still intentionally non-committal

Current Growth behavior stays honest:

- membership upgrades still use contact-led messaging on Growth
- paid event/course booking creates an operational record and next-steps guidance, not native payment confirmation

That honesty is useful. We should preserve it until each native flow is actually implemented.

## 4) Locked Scope For Phase 1

Phase 1 should include:

1. hub-level native payment setup readiness for Growth hubs
2. embedded connected-account onboarding inside Hubforj
2. Stripe-backed membership upgrade checkout for Growth hubs
3. webhook-driven reconciliation from Stripe back into membership upgrade and membership payment state
4. admin and member UI that reflects the implemented truth
5. regression coverage and recovery guidance for the new flow
6. Hubforj-managed Stripe object orchestration on the connected account where required

Phase 1 should exclude:

- native event checkout
- native course checkout
- recurring membership subscriptions
- platform-wide transaction reporting
- refunds/disputes/payout reconciliation
- multi-hub platform finance tooling
- a hub-owned billing portal

## 5) First-Phase Product Contract

### 5.1 Growth-only native membership upgrade flow

For a Growth hub with a public paid upgrade plan:

1. member opens the membership page
2. member selects a paid public upgrade plan
3. platform creates a native checkout session
4. member completes payment in Stripe-hosted checkout
5. Stripe notifies `hub-platform`
6. `hub-platform` marks the upgrade as completed
7. `hub-platform` applies the upgraded membership
8. member sees the upgraded plan and a truthful payment status

The member should experience this as a Hubforj-native flow:

- the member does not need to know how Stripe products/prices are represented
- the hub admin does not need to log into Stripe to create the plan first
- Hubforj manages the required payment objects behind the scenes

### 5.2 Starter remains unchanged

Starter must continue to behave exactly as it does now:

- external payment link and/or instructions
- manual hub-team confirmation
- no implied automatic native upgrade

### 5.3 Events and courses remain unchanged in Phase 1

For Growth paid events/courses in Phase 1:

- do not pretend native checkout exists if it does not
- keep current booking/enrolment + next-steps behavior truthful
- do not partially wire Stripe into those flows until they have their own complete slice

### 5.4 Hubforj-managed payment object creation

The intended user experience is “one platform,” not “configure in Hubforj and then repeat setup in Stripe.”

Therefore, when native payments require Stripe-side objects, Hubforj should create or maintain them programmatically on the connected account.

This rule means:

- Hubforj-owned membership plan configuration remains canonical
- Stripe-side payment objects are implementation detail, not primary admin workflow
- clients only need Stripe directly for:
  - initial account connection/onboarding
  - finance review/reporting inside their Stripe dashboard
  - Stripe-managed compliance or payout operations

Clients should not have to keep returning to Stripe merely to keep their Hubforj membership catalogue usable.

## 6) Recommended Data And System Model

Phase 1 needs a dedicated native-payments model instead of overloading generic payment status fields.

### 6.1 New domain concepts

Add explicit domain records for:

- hub payment configuration
- member-native checkout attempts
- native payment transactions
- Stripe event application audit

Recommended first-pass conceptual collections:

```txt
hubs/{hubId}/paymentConfiguration
hubs/{hubId}/nativePaymentTransactions/{transactionId}
hubs/{hubId}/stripeEvents/{eventId}
```

The exact storage layout can vary, but the architectural distinction matters:

- membership record = community entitlement state
- membership payment record = operational payment history
- native transaction record = Stripe lifecycle truth for a specific payment attempt

Those should not be collapsed into one generic record.

### 6.2 Hub payment configuration should be explicit

Growth-native payments should depend on a hub-level configuration record, for example:

```js
{
  provider: "stripe",
  status: "not_configured" | "pending" | "connected" | "restricted" | "disabled",
  stripeAccountId: string,
  chargesEnabled: boolean,
  payoutsEnabled: boolean,
  detailsSubmitted: boolean,
  onboardingCompletedAt: string,
  updatedAt: string,
}
```

Even if some fields are initially thin, Phase 1 should establish the dedicated model.

This model should be compatible with client-owned connected accounts and should not imply that Hubforj is the merchant-of-record for the client’s business.

### 6.3 Membership upgrade requests need a native-payment evolution path

Current membership upgrade requests already exist and are the best anchor for the first slice.

They should evolve so a request can carry native checkout context, for example:

- checkout provider
- checkout session id
- transaction id
- payment state
- paid at

The key rule:

- a pending membership upgrade request is not the transaction itself
- but it should be able to reference the transaction that resolves it

## 7) Recommended Implementation Tracks

Phase 1 should be delivered in five tracks.

### Track A: Hub payment-setup foundation

Outcome:
- Growth hubs can be configured for native Stripe payments explicitly and safely

Deliverables:

1. define the hub payment-configuration model
2. define connected-account creation flow
3. add embedded onboarding initiation and return model
4. add Growth-only admin settings surface for payment setup status
5. add internal server helpers to read/write payment configuration
6. add package guards so native checkout cannot start unless:
   - hub is Growth
   - payment processing mode is `internal`
   - hub payment configuration is connected enough to charge

Important note:

This track is about payment setup state, not about creating a full Stripe Connect platform UX in one pass.

It should still result in a real embedded-onboarding flow inside Hubforj, not a doc-only placeholder.

### Track B: Membership native checkout initiation

Outcome:
- a Growth member can start a real Stripe-backed membership upgrade checkout

Deliverables:

1. define a canonical server action for Growth membership upgrade checkout
2. create a native transaction record before redirecting to Stripe
3. create the Stripe checkout session
4. redirect to Stripe-hosted checkout
5. return the member to a truthful post-checkout route

If Stripe product/price objects are needed for the chosen checkout pattern, this track should also define the programmatic object-creation/update strategy on the connected account.

The membership page should stop saying “contact the hub” once this flow exists for eligible Growth plans.

### Track C: Stripe webhook and reconciliation

Outcome:
- Stripe payment completion updates the platform state safely and deterministically

Deliverables:

1. add a verified Stripe webhook endpoint inside `hub-platform`
2. persist event-application audit by event id
3. resolve checkout completion to the native transaction record
4. update the related membership upgrade request
5. apply the upgraded membership record
6. write membership payment history
7. ensure idempotent event handling

This is the most important production-grade requirement of the phase.

### Track D: Member and admin UX truthfulness

Outcome:
- the UI reflects implemented payment truth without pretending more exists

Deliverables:

1. member membership page:
   - real “upgrade with Stripe” CTA for eligible Growth paid plans
   - pending/completed/failed upgrade messaging
2. member billing page:
   - payment history for completed native membership upgrades
3. admin payments workspace:
   - distinguish externally managed vs natively processed payments
   - expose native transaction visibility for membership upgrades
4. admin membership plan manager:
   - explain when a Growth public paid plan supports native checkout
   - make it clear that Hubforj handles the payment setup flow without requiring plan creation in Stripe

### Track E: Recovery, observability, and tests

Outcome:
- the first Stripe slice is supportable rather than fragile

Deliverables:

1. unit coverage for native-payment state normalization
2. integration coverage for checkout initiation and webhook resolution
3. audit trail for event application
4. replay/retry strategy for failed webhook application
5. operator notes for reconciling:
   - paid in Stripe but membership not upgraded
   - duplicate webhook event
   - abandoned checkout

## 8) Recommended Route And UX Surfaces

### 8.1 Admin-side surfaces

Primary touch points:

- [admin payments page](/mnt/c/local/community-app/apps/hub-platform/src/app/(admin)/[hubSlug]/admin/payments/page.jsx)
- [MembershipPlanManager.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/patterns/hub-payments-workspace/MembershipPlanManager.jsx)
- account settings payment-setup area, likely adjacent to package/domain operational settings

Recommended Phase 1 additions:

- treat `/admin/payments` as the canonical native-payments route
- `Payment setup` status panel for Growth
- `Native payments not configured` locked/pending state
- `Connected to Stripe` status once enabled
- `Complete Stripe onboarding` embedded setup flow inside Hubforj when requirements are outstanding
- keep account settings limited to a summary + CTA into payments, not a duplicated payment setup workflow

### 8.2 Member-side surfaces

Primary touch points:

- [MemberMembershipWorkspace.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/patterns/member-membership-workspace/MemberMembershipWorkspace.jsx)
- [member membership actions](/mnt/c/local/community-app/apps/hub-platform/src/app/(hub)/[hubSlug]/account/membership/actions.js)
- [member-account.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/member-account.js)

Recommended Phase 1 additions:

- Growth paid plan CTA should move from contact-led messaging to native checkout initiation
- pending upgrade request card should distinguish:
  - awaiting payment
  - payment completed, awaiting confirmation/reconciliation
  - upgrade applied

### 8.3 Out-of-scope member surfaces for now

Keep these unchanged in Phase 1:

- event booking checkout
- course enrolment checkout
- event next-steps Stripe confirmation
- course next-steps Stripe confirmation

## 9) Key Engineering Rules

### 9.1 Do not overload `paymentStatus` as the only source of truth

`paymentStatus` is useful operationally, but it is not sufficient to model:

- checkout creation
- session completion
- webhook retries
- payment-provider identifiers
- reconciliation failures

### 9.2 Do not update membership state directly from UI optimism

The authoritative membership upgrade should happen from verified server-side payment completion, not from a client assumption that checkout succeeded.

### 9.3 Do not skip the transaction record

If we redirect to Stripe without a local transaction record first, we create support and reconciliation debt immediately.

### 9.4 Do not spread Stripe logic across membership, event, and course codepaths in Phase 1

Stripe helpers should be organized around:

- payment configuration
- checkout initiation
- transaction persistence
- webhook application

The membership flow should be the first consumer of that infrastructure.

### 9.5 Do not make Stripe the admin-facing catalogue source of truth

Hubforj should own plan/offering configuration.

If Stripe-side products or prices are needed, they should be treated as derived infrastructure objects created on the connected account, not as the objects the admin must manage manually.

### 9.7 Do not treat account creation as onboarding completion

Creating the connected account record is only the start of the payment-setup lifecycle.

Native payment flows must remain blocked until the connected account is sufficiently onboarded and charge-ready according to Stripe’s requirements.

### 9.8 Do not blur native hub payments with Hubforj package billing

The following concerns must remain separated in implementation, UI copy, and route ownership:

- native member payments inside the hub
- commercial package management between the hub owner and Hubforj

In practical terms:

- `/{hubSlug}/admin/payments` should never become a package-billing or plan-upgrade route for Free/Starter/Growth
- `/{hubSlug}/admin/settings/account` may explain the current package and link out to commercial package management
- product-site billing and package management must remain outside this native-payments implementation

### 9.6 Keep the fee model explicit in code and docs

If Hubforj takes a per-transaction fee, the implementation should make that behavior explicit and testable.

At minimum, the system should define:

- whether a fee applies to the payment flow
- how that fee amount is derived
- where that fee is passed into checkout creation
- how that fee is represented in audit/reconciliation records

## 10) Recommended Delivery Order

### Slice 1: Define native-payment foundation

Deliver:

- payment configuration model
- connected-account creation model
- embedded onboarding entry/return flow
- transaction model
- package/setup guards
- minimal admin payment-setup UI
- explicit route/view contract for `/admin/payments?view=setup`
- compact account-settings summary contract that links into payments without duplicating finance workflows

Acceptance:

- Growth hub can have explicit payment-setup state
- non-Growth hubs cannot enter native payment flows
- a Growth hub can begin onboarding inside Hubforj
- native payments remain unavailable until onboarding is complete
- route ownership between `/admin/payments` and `/admin/settings/account` is clear and enforced by implementation

### Slice 2: Implement Growth membership native checkout

Deliver:

- membership upgrade checkout server action
- transaction creation
- Stripe checkout session creation
- return/cancel route handling
- application-fee handling for the implemented flow
- any required Stripe object synchronization on the connected account

Acceptance:

- eligible Growth member can start checkout from the membership page
- abandoned checkout does not incorrectly upgrade the member
- client does not need to create the plan manually in Stripe for the flow to work

### Slice 3: Implement webhook resolution

Deliver:

- verified webhook endpoint
- event idempotency
- membership upgrade application
- payment-history write-through

Acceptance:

- paid checkout results in upgraded membership
- duplicate webhook events do not double-apply changes

### Slice 4: Harden UI and recovery

Deliver:

- truthful pending/completed/failed messages
- admin visibility into native membership transactions
- operator reconciliation notes

Acceptance:

- support can explain and recover the most common failures

### Slice 5: Membership lifecycle cleanup after first live native upgrades

This is the immediate follow-on slice once Phase 1 native payments are stable locally.

Purpose:

- separate current membership entitlement from historical payment records
- stop payment history from reading like multiple competing live memberships
- lock the cancellation/end-of-upgrade rule before broader native-payment coverage expands

Deliver:

- explicit differentiation between:
  - current membership assignment
  - historical membership payment cycles
  - native upgrade transaction history
  - superseded or cancelled payment records
- an admin action that is named explicitly as:
  - `Revert to default plan`
  instead of a vague `Cancel membership`
- a clear rule for how paid upgrades end:
  - the member returns to the hub’s default plan unless the admin intentionally removes membership access
- payment-history presentation that distinguishes:
  - current cycle
  - prior cycle
  - cancelled/failed native upgrade attempt
  - superseded assignment history
- removal of ambiguous admin copy that suggests cancelling a paid upgrade leaves the member with no baseline plan

Acceptance:

- admins can clearly tell which membership is current and which records are historical
- ending a paid membership upgrade reverts the member to the default plan by default
- “remove all membership access” remains a distinct and more explicit operation
- payment history no longer reads as multiple simultaneous live memberships for the same member
- native Stripe membership upgrade records and legacy membership payment records are both truthful but not visually conflated

## 11) Explicit Non-Goals For Phase 1

Do not add these in the first slice:

- recurring membership subscriptions
- automatic renewal
- saved payment methods
- self-serve downgrade/cancellation
- Stripe billing portal behavior inside `hub-platform`
- event native checkout
- course native checkout
- revenue dashboards
- payout exports
- refunds/disputes tooling

Those are valid later phases, but they are not the right first target.

Also do not add this anti-pattern:

- a requirement that clients log into Stripe to manually recreate Hubforj plans or offerings just to use native payments

For the follow-on membership lifecycle slice, also avoid this anti-pattern:

- a vague admin action called `Cancel membership` that hides whether the outcome is:
  - revert to default plan
  - end at renewal
  - remove all access

## 12) Acceptance Criteria

Phase 1 is complete when:

1. Growth hubs can be marked as payment-ready through an explicit native-payment configuration model.
2. A Growth hub can start and complete Stripe onboarding from inside Hubforj through embedded onboarding.
3. A Growth member can start a paid membership upgrade with Stripe-hosted checkout.
4. Stripe webhook completion upgrades the membership record safely and idempotently.
5. Membership payment history reflects the native transaction truthfully.
6. The member membership page and billing page describe the payment and upgrade state honestly.
7. Starter external membership upgrade behavior remains unchanged.
8. Event and course paid flows remain unchanged unless explicitly covered by a later plan.
9. Lint, tests, and builds are clean with the new payment flow in place.
10. A basic recovery path exists for failed webhook application or abandoned checkout.
11. The implemented flow works with a client-owned connected Stripe account.
12. The implemented flow does not require the client to create the membership plan manually in Stripe.
13. The implemented flow can apply Hubforj’s platform fee explicitly if that fee policy is enabled.
14. Creating the connected account alone does not unlock payments until onboarding requirements are satisfied.

## 13) Final Recommendation

The first `hub-platform` Stripe implementation should be:

- **Growth native membership upgrade payments**

and not:

- “all Growth payments”

That is the smallest slice that:

- matches the current roadmap
- fits the current code seams
- gives the product a real native-payments capability
- does not force us to solve every payment problem at once

Once that slice is stable, the next candidates can be:

1. membership lifecycle cleanup and explicit default-plan reversion
2. Growth native event checkout
3. Growth native course enrolment checkout
4. broader transaction reporting and reconciliation tooling
