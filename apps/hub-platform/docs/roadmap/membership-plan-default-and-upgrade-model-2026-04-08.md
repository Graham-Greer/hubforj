# Membership Plan Default And Upgrade Model

## Purpose

This document locks the membership model for `hub-platform` so implementation can proceed from a clear product and technical contract.

The core correction is:

- hubs manage **membership plans**, not "payment plans"
- every hub should have a **default free membership plan**
- new members should be assigned that default plan during the standard join flow
- paid membership plans are **optional upgrades after joining**, not the entry gate to becoming a member

This aligns membership with the platform mission: a SaaS product for hubs to manage members, events, and courses in one place, with monetisation as an optional layer rather than the barrier to participation.

## Product Position

Membership is the community structure layer.

Payments are secondary.

That means:

- joining a hub should be simple and low-friction
- becoming a member should not require selecting or paying for a plan up front
- hubs should be able to start operating immediately, even before they define any paid upgrade path
- paid membership plans should exist as an upgrade path for engaged members, not the initial join requirement

## Locked Product Decisions

### 1. Rename the concept

The admin concept should be treated as:

- `Membership Plans`

Not:

- `Payment Plans`

Reason:

- the primary object is the membership structure
- payment is a property of some plans, not the identity of the feature

### 2. Every hub must have a default free membership plan

This should be created automatically when the hub is created.

The default plan should:

- be active
- be free
- be the baseline membership plan
- be assignable automatically during join
- be editable later by the hub admin

Suggested initial semantics:

- title: `Community Membership` or equivalent platform default
- pricing mode: `free`
- status: `active`
- default: `true`

### 3. Standard join assigns the default membership plan

When a user joins a hub:

- the user becomes a member
- the user is assigned the hub's default membership plan automatically

This should happen as part of the normal join flow.

This is the baseline onboarding path.

### 4. Members land back on the public site after joining

The post-join experience should not assume a dedicated member dashboard landing flow.

Current product direction:

- after successful join, the user lands on the hub's public home page

The membership assignment should happen in the background as part of joining.

### 5. Additional plans are upgrades

If a hub offers more than the default plan, those plans are treated as upgrades.

Members:

- join first on the default free membership
- upgrade later if the hub offers additional plans

This keeps the top-of-funnel simple while preserving monetisation options.

### 6. Paid plans are never the required first step to joining

Paid membership plans should not block first-time community entry.

That means:

- no mandatory plan selection before joining
- no forced paid commitment in the initial join flow

### 7. Starter and Growth still differ by payment mode

Membership upgrades respect the already-locked monetisation model:

- `Free`
  - no paid membership plans
- `Starter`
  - paid membership plans allowed
  - payment handled externally
- `Growth`
  - paid membership plans allowed
  - built-in/native payment handling

## Why This Model Is Correct

### Lower friction

Requiring plan choice at initial join creates unnecessary friction and suppresses member conversion.

Default-free membership lets hubs grow their community first.

### Better fit for the product mission

The platform is not first and foremost a billing product.

It is a hub operations platform.

The first job is to:

- get members into the hub
- let them participate
- let admins manage them coherently

### Natural upgrade path

This creates a clear progression:

- join the hub
- engage with events/courses/community
- later upgrade membership if relevant

That is a healthier model than making paid membership the entry gate.

## Scope For The Next Membership Slice

This document changes the next implementation focus.

We are **not** building:

- public plan selection as part of initial join

We **are** building toward:

- default membership assignment during join
- later membership upgrade flow for members when hubs offer additional plans

## Recommended Phase Structure

### Phase 1: Foundation

- rename `Payment Plans` UX to `Membership Plans`
- ensure every hub has a default free membership plan
- ensure join flow assigns that default plan automatically
- ensure the member is returned to the public site after joining

### Phase 2: Member upgrade discovery

- expose upgrade-eligible plans after join
- likely from membership/account surfaces first
- possibly later from a public-facing membership plans page

### Phase 3: Paid upgrade handling

- `Starter`: external payment link + clear instructions + pending/confirmation workflow
- `Growth`: built-in/native payment handling

## Membership Plan UX Recommendations

### Admin UX

Admins should be able to understand:

- which plan is the default plan
- which plans are optional upgrades
- which plans are free vs paid
- how paid plans are fulfilled:
  - external on Starter
  - native on Growth

The admin experience should optimize for a small number of clear plans, not a complex pricing engine.

### Member UX

Members should experience:

- fast initial join
- automatic assignment to the default free plan
- no confusing forced pricing decision at the point of joining
- a clear later upgrade path if the hub offers additional plans

## Best-Practice Guidance

For the first implementation:

- optimize for a small plan set
- do not over-design pricing complexity
- avoid pretending recurring billing exists before it truly does

Recommended plan presentation guidance:

- optimize public/member comparison UX for `1-3` active upgrade options
- allow more plans in storage if needed, but do not design for a crowded comparison surface

## Auto-Renew

### Locked decision

Do not introduce true auto-renew in the first membership-upgrade implementation.

Reason:

True auto-renew implies:

- recurring billing authority
- retry/failure handling
- renewal reminders
- cancellation handling
- auditability
- member self-service subscription management

The current product is not ready to support that cleanly yet.

### Interim position

Use renewal timing as informational and operational, not as a promise of automatic recurring billing.

For Starter in particular:

- external payment should not be presented as "auto-renew"

## Data Model Direction

The current model is already strong enough for admin plan management:

- title
- description
- pricing mode
- price
- currency
- external payment url
- payment instructions
- duration unit
- duration value
- status

The next source-of-truth document for member-facing plan discovery and admin-only plans is:

- [Membership Plan Visibility And Upgrade Operations](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/membership-plan-visibility-and-upgrade-operations-2026-04-08.md)

Additional fields likely needed for the next slice:

- `isDefault`
- possibly `sortOrder`
- possibly `isPublic` later, if upgrade plans are exposed outside account surfaces

Fields explicitly not required yet:

- `autoRenewEnabled`
- `trialPeriod`
- `couponing`
- `proration`
- `group memberships`

## Technical Direction

### Required implementation changes

1. Hub creation should seed a default free membership plan.
2. Member join flow should assign that plan automatically.
3. Membership plan logic should guarantee exactly one default plan per hub.
4. Admin UI should clearly distinguish:
   - default free plan
   - optional upgrade plans
5. Member-facing UX should support:
   - viewing current plan
   - discovering available upgrades later

### Invariant strategy

This product has not launched yet, so we should use the cleaner architectural path:

- do **not** add runtime fallbacks for hubs that are missing a default membership plan
- do **not** add lazy repair logic in join or membership assignment flows
- do **not** keep compatibility branches for pre-launch test data

Instead:

- reset the test database operationally before rollout
- enforce the invariant in application logic
- fail fast in development if the invariant is broken

Locked invariant:

- every hub has exactly one default free membership plan

The application should be written on the assumption that this is true.

### Not part of this slice

- a complex public plan comparison/buy flow at initial join
- true recurring subscriptions
- self-serve downgrade/cancellation engine
- full billing portal behavior

## Acceptance Criteria For The Next Implementation Slice

### Foundation acceptance criteria

1. Every new hub receives a default free membership plan automatically.
2. A new member joining a hub is assigned that default plan automatically.
3. The join experience still returns the user to the public site, not a not-yet-implemented member landing area.
4. The system enforces exactly one default free membership plan per hub as a hard invariant.
5. Admins can identify which plan is the default plan.
6. No join flow requires plan selection before the user becomes a member.
7. No runtime fallback or lazy repair logic is added for missing default plans.

### Upgrade-path acceptance criteria

1. Members can discover whether their hub offers upgrade plans after they have joined.
2. Upgrade plans are clearly separated from the default free plan.
3. Starter upgrade plans route to external payment.
4. Growth upgrade plans use built-in/native payment handling when available.
5. Payment and membership state language remains honest and operationally clear.

## Out Of Scope

The following are explicitly out of scope for this locked model:

- forced plan selection at initial join
- true auto-renew
- recurring billing engine
- advanced pricing comparison matrices
- complex upgrade/downgrade billing logic
- group or corporate membership models

## Implementation Priority

The next implementation sequence should follow this order:

1. rename and concept alignment from `Payment Plans` to `Membership Plans`
2. default plan creation on hub setup
3. automatic default-plan assignment in join flow
4. admin visibility of default vs upgrade plans
5. member-facing upgrade discovery and upgrade flow

## Final Position

This model is the correct fit for the platform mission.

It keeps community entry simple.
It makes membership operationally meaningful.
It supports monetisation without letting monetisation become the gate to participation.
It gives hubs a usable default immediately and a natural path to offer upgrades later.
