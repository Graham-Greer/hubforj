# Membership Plan Visibility And Upgrade Operations

Status:
- Locked
- Source of truth for the next membership delivery slice

Date:
- 2026-04-08

Related:
- [Membership Plan Default And Upgrade Model](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/membership-plan-default-and-upgrade-model-2026-04-08.md)
- [Monetisation Tier And External Payments Model](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/monetisation-tier-and-external-payments-model-2026-04-08.md)
- [Monetisation Tier Implementation Sequence](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/monetisation-tier-implementation-sequence-2026-04-08.md)

## Purpose

This document locks the production-grade membership-upgrade model for `hub-platform`.

The goal is not only to make the upgrade state machine clean, but to ensure the member and admin experience stays aligned with the product mission:

- a SaaS platform for hubs to manage members, events, and courses in one place
- simple membership onboarding first
- optional monetisation layered on top
- clear operations for hub teams without turning membership upgrades into a pseudo-billing product

## Executive Summary

Membership plans should support two visibility modes:

- `public`
- `private`

This distinction is the next core product rule.

It gives hubs a simple way to decide whether a plan is:

- self-serve discoverable to members
- admin-assigned only

That maps well to real community operations:

- baseline membership plans
- normal upgrade tiers
- sponsor or patron plans
- scholarship plans
- staff or internal plans
- invite-only or negotiated memberships

The platform should optimize the member experience around:

- automatic assignment to the default free membership plan on join
- later discovery of public upgrade plans
- clear explanation of what happens when a member chooses a plan

The platform should optimize the admin experience around:

- one obvious default plan
- clear distinction between public upgrade plans and private/admin-only plans
- lightweight upgrade follow-up for Starter external payments

## Locked Product Decisions

### 1. Membership plans gain explicit visibility

Membership plans must support:

- `visibility = "public"`
- `visibility = "private"`

Meaning:

- `public`
  - members can see the plan in self-serve upgrade discovery
- `private`
  - the plan is hidden from member-facing upgrade discovery
  - only admins can assign or move members onto the plan

### 2. The default membership plan is a system baseline, not an upgrade offer

Every hub has exactly one default free membership plan.

That plan:

- is assigned automatically on join
- is not treated as a self-serve upgrade option
- should remain the baseline starting point for all members

Operationally, the default plan can be considered public in spirit, but it should not be rendered as a competing upgrade choice on the member-facing upgrade surface.

### 3. Public plans are the only plans shown in member self-serve upgrade discovery

Member-facing upgrade discovery must only show plans that are:

- active
- non-default
- public

Private plans must not appear on member-facing upgrade surfaces.

### 4. Private plans are admin-assigned only

Private plans exist for situations where a hub needs controlled assignment, for example:

- sponsor tiers
- scholarship access
- partner memberships
- honorary memberships
- staff or internal roles
- negotiated memberships

Members should not see these plans as options to request or purchase.

### 5. Starter and Growth continue to differ by payment mode

Visibility does not replace payment-mode rules.

The monetisation model remains:

- `Free`
  - no paid membership plans
- `Starter`
  - paid membership plans allowed
  - payment handled externally
- `Growth`
  - paid membership plans allowed
  - payment handled natively/internally

### 6. The first production-grade upgrade flow should stay operationally simple

The first version should not attempt to solve:

- recurring billing
- proration
- self-serve downgrades
- instant self-serve plan switching
- full subscription management
- invite-only token systems

Instead, the platform should support:

- clear public/private plan visibility
- honest CTA behavior
- a lightweight operational follow-up model

## Recommended User Experience

## Admin Experience

### Plan creation and editing

Admins should configure:

- plan title
- plan description
- pricing mode
- price and currency where relevant
- external payment URL and instructions where relevant
- duration
- status
- visibility

Visibility copy should be explicit:

- `Public`
  - `Members can see this plan as an upgrade option.`
- `Private`
  - `Only hub admins can assign this plan. Members will not see it in upgrade options.`

### Default plan behavior

The default plan should remain special:

- marked clearly as the baseline plan
- protected from deletion
- kept free and active
- not positioned as a normal upgrade offer

### Admin mental model

The admin should be able to understand the plan set quickly:

- default free membership
- public upgrade plans
- private admin-only plans

That is a better model than a flat list of plans with unclear semantics.

## Member Experience

### Join

Member join remains simple:

- join the hub
- get the default free membership automatically
- land back on the public site

No plan choice is required during first-time join.

### Upgrade discovery

Members should see:

- their current plan
- whether it is the default plan or an upgrade plan
- any available public upgrade plans

Members should not see:

- private plans
- admin-only tiers
- internal negotiation-only memberships

### Upgrade CTA behavior

The member-facing CTA must remain truthful.

#### Starter

For paid public plans on Starter:

- show price and cadence
- show a clear external-payment CTA
- explain that payment happens off-platform
- explain that the hub team confirms the upgrade after payment

#### Growth

Until true self-serve membership checkout exists, Growth should not pretend it does.

For paid public plans on Growth, the initial production-grade behavior should be:

- clear plan display
- contact-the-hub CTA or equivalent upgrade-handled-by-hub messaging

Once native self-serve membership checkout is actually implemented, this can evolve.

#### Free upgrades or non-payment plan changes

If a public non-paid plan change is available:

- the platform should still avoid implying instant self-serve switching unless that workflow actually exists
- contact-the-hub messaging is acceptable in the first version

## Operational Upgrade Model

The upgrade model should be lightweight and understandable.

### Starter

Starter public paid upgrades should be treated as:

- member discovers plan
- member completes payment externally
- hub confirms the upgrade

The product should communicate this clearly.

The first production-grade member state should be operationally simple, for example:

- `Upgrade requested`
- `Awaiting confirmation`
- or no intermediate request record yet, if the hub is still expected to confirm manually outside the platform

The key rule is:

- do not imply that clicking the payment link upgrades the membership automatically

### Growth

Growth should remain future-compatible, but honest today.

Until native self-serve membership checkout is fully implemented, the member experience should not imply:

- immediate automatic upgrade
- saved payment methods
- auto-renew
- real subscription management

## Best-Practice Guidance

### 1. Keep public plan choice simple

The member-facing upgrade surface should be optimized for:

- 1 plan
- 2 plans
- 3 plans

This aligns with strong pricing and membership UX patterns.

More than 3 public upgrade plans should be possible in storage, but the product should discourage turning the member surface into a crowded matrix.

### 2. Public/private is better than overloading workflow flags

`visibility` is a better first control than adding many workflow toggles.

It gives hubs clear control without introducing:

- approval toggles
- invite token models
- application stages
- hidden combinations of flags

### 3. Do not add auto-renew yet

True auto-renew requires:

- recurring billing
- failure handling
- cancellation handling
- renewal reminders
- member self-service subscription management

The first production-grade membership upgrade model should not imply those capabilities before they exist.

## Data Model Direction

The next membership-plan model should include:

- `isDefault`
- `visibility`
- existing pricing and duration fields

Potential later additions:

- `sortOrder`
- `isRecommended`
- `benefits`

But those are not required to deliver the next slice cleanly.

## Implementation Sequence

The next work should be delivered in this order.

### Step 1: Visibility model in the domain and data layer

Deliver:

- add `visibility` to membership plan normalization and persistence
- default new non-default plans sensibly
- ensure the default plan remains excluded from upgrade discovery

Acceptance criteria:

- membership plans normalize `visibility` consistently
- plans default to a deliberate visibility value, not an implicit accidental state
- only one default plan exists
- private plans are representable without special-case hacks

### Step 2: Admin create/edit UX for visibility

Deliver:

- expose public/private visibility in membership plan admin
- explain the impact in plain language
- reflect default/public/private status in the plan list

Acceptance criteria:

- admins can choose public or private on non-default plans
- admins can understand the difference without documentation
- the default plan remains visually distinct from upgrade plans
- plan list UI clearly communicates:
  - default plan
  - public upgrade plan
  - private plan

### Step 3: Member-facing upgrade filtering

Deliver:

- show only public, active, non-default plans in member upgrade discovery

Acceptance criteria:

- private plans never appear in member-facing upgrade discovery
- default plan never appears as an upgrade option
- inactive plans never appear

### Step 4: Operational messaging and follow-up

Deliver:

- define the member-facing explanation for Starter external upgrades
- define the admin-facing expectation for confirming upgrades

Acceptance criteria:

- Starter members understand payment is external and upgrade confirmation is manual
- admins understand what follow-up is expected
- Growth messaging stays honest until native self-serve checkout actually exists

## Out Of Scope For This Slice

The following should not be added in the same slice:

- true auto-renew
- recurring billing
- downgrade workflows
- proration
- invite-token membership acquisition
- multi-step membership applications
- self-serve instant plan switching
- advanced entitlement gating based on membership tier

## Final Position

`public/private` visibility is the right next product decision.

It keeps the system simple for hubs.
It keeps the member experience uncluttered.
It gives the platform enough flexibility for real communities without turning membership plans into a heavyweight subscription product before the rest of the product is ready.
