# SaaS Package Authority And Enforcement Plan

Status:
- Proposed
- Implementation planning document

Date:
- 2026-03-29

Purpose:
- Translate the locked package tier model into an implementation-ready plan
- Define the package authority data shape that `hub-platform` should consume
- Define the capability adapter redesign
- Define the enforcement strategy for provisioning, routes, actions, and usage limits

Related:
- [SaaS Package Tier And Entitlement Model](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/saas-package-tier-and-entitlement-model-2026-03-29.md)
- [Monetisation Tier And External Payments Model](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/monetisation-tier-and-external-payments-model-2026-04-08.md)
- [SaaS Domain, Onboarding, And Tier Audit](/mnt/c/local/community-app/apps/hub-platform/docs/audits/2026-03-29-saas-domain-onboarding-and-tier-audit.md)
- [SaaS Direction And Next Steps](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/saas-direction-and-next-steps-2026-03-15.md)
- [SaaS Domain And Route Model](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/saas-domain-and-route-model-2026-03-15.md)
- [Custom Domain Management Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/custom-domain-management-plan-2026-03-31.md)

## 1) Executive Summary

The next SaaS implementation phase should not start with Stripe.

It should start with package authority and entitlement enforcement.

The reason is straightforward:

- package tier is now a product-level source of truth
- `hub-platform` must consume and enforce that truth
- Stripe, monetisation, and package-aware onboarding will all sit on top of this model

The current codebase already has:

- hub provisioning
- a first-pass `packageTier` field
- a thin capability adapter
- some UI-level gating

But it does not yet have:

- authoritative package input from upstream
- a locked entitlement object in code
- usage-limit enforcement
- route-level feature enforcement
- a clean package ownership boundary

This document defines the next implementation layer.

## 2) Current Code Reality

## 2.1 Provisioning today

Current provisioning path:

- [`CreateHubForm.jsx`](/mnt/c/local/community-app/apps/hub-platform/src/app/(platform)/platform/hubs/create/CreateHubForm.jsx)
- [`create/actions.js`](/mnt/c/local/community-app/apps/hub-platform/src/app/(platform)/platform/hubs/create/actions.js)
- [`domain/hubs.js`](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/hubs.js)
- [`hub-mutations.js`](/mnt/c/local/community-app/apps/hub-platform/src/lib/data/hub-mutations.js)

Current issue:
- package tier is not provisioned as authoritative input
- provisioning still hardcodes product defaults such as:
  - `features.courses: true`
  - `features.stripePayments: false`

This must be replaced by package-derived authority.

## 2.2 Capability adapter today

Current adapter:
- [`site-settings-capabilities.js`](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/site-settings-capabilities.js)

Current issue:
- it is too thin
- it mixes tier and feature booleans without a full entitlement model
- it does not yet model limits

## 2.3 Gating today

Current examples of partial gating:
- public nav gating in [`public-routes.js`](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/public-routes.js)
- site settings capability exposure in [`site-settings.js`](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/site-settings.js)
- bookings UI adaptation in [`MemberBookingsWorkspace.jsx`](/mnt/c/local/community-app/apps/hub-platform/src/components/patterns/member-bookings-workspace/MemberBookingsWorkspace.jsx)

Current issue:
- these are mostly presentation-level decisions
- they are not yet authoritative enforcement

## 3) Package Authority Boundary

## 3.1 Upstream authority

Package authority should come from the product site or the upstream commercial system.

That upstream system should decide:

- which package tier the hub is on
- when the package was assigned
- whether the package is active, trialing, cancelled, or overdue
- whether there are add-ons or overrides

`hub-platform` should not invent or infer this commercially critical state locally.

## 3.2 Local consumption model

`hub-platform` should persist enough package authority on the hub record to support:

- route and feature gating
- settings visibility
- usage enforcement
- upgrade prompts
- later billing and Stripe UX

The package authority record must be:

- explicit
- normalized
- safe to read in server routes
- separate from arbitrary ad hoc `features.*` flags

## 4) Recommended Hub Package Authority Shape

The hub record should eventually carry a package authority shape like:

```js
{
  packageTier: "free" | "starter" | "growth",
  packageStatus: "active" | "trialing" | "past_due" | "cancelled",
  packageSource: "product-site" | "seed" | "operator",
  packageAssignedAt: "ISO date",
  packageUpdatedAt: "ISO date",
  packageOverrides: {
    customDomainEnabled: boolean | null,
    brandingRemovalEnabled: boolean | null,
    reportingEnabled: boolean | null,
  },
}
```

Notes:
- `packageTier` is the primary commercial tier
- `packageStatus` is not the same as hub status
- `packageSource` helps operational clarity during migration and support
- `packageOverrides` should remain exceptional, not the normal model

## 5) Recommended Entitlement Model

Do not keep package logic as scattered booleans on `hub.features`.

Instead, define one normalized entitlement object.

Recommended shape:

```js
{
  packageTier: "free" | "starter" | "growth",
  packageStatus: "active" | "trialing" | "past_due" | "cancelled",
  limits: {
    activeUpcomingEvents: 3 | null,
    activeMembers: 30 | 200 | null,
  },
  capabilities: {
    subdomainSiteEnabled: true,
    customDomainEnabled: boolean,
    eventsEnabled: true,
    coursesEnabled: boolean,
    rsvpTrackingEnabled: boolean,
    emailRemindersEnabled: boolean,
    memberListEnabled: boolean,
    paymentsEnabled: boolean,
    paidEventsEnabled: boolean,
    paidCoursesEnabled: boolean,
    paidMembershipsEnabled: boolean,
    brandingRemovalEnabled: boolean,
    reportingEnabled: boolean,
    testimonialsEnabled: boolean,
  },
}
```

This object should become the canonical in-app source of truth for:

- public route availability
- admin feature availability
- member experience affordances
- settings visibility
- publish and creation constraints

In addition, the monetisation model must distinguish between:

- permission to create paid offerings
- the payment processing mode used by those offerings

Recommended addition:

```js
{
  paymentProcessingMode: "none" | "external" | "internal"
}
```

Locked interpretation:

- `Free`
  - paid offerings disabled
  - `paymentProcessingMode = "none"`
- `Starter`
  - paid offerings enabled where supported
  - `paymentProcessingMode = "external"`
- `Growth`
  - paid offerings enabled
  - `paymentProcessingMode = "internal"`

## 6) Capability Adapter Redesign

## 6.1 Replace the current adapter

Current module:
- [`site-settings-capabilities.js`](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/site-settings-capabilities.js)

Recommended role after redesign:
- resolve package tier and status
- derive capabilities
- derive limits
- apply allowed overrides
- return one normalized entitlement object

## 6.2 Recommended module responsibilities

Suggested layers:

- `src/lib/domain/package-tiers.js`
  - tier constants
  - package labels
  - pricing display metadata if needed

- `src/lib/domain/package-entitlements.js`
  - canonical per-tier capability and limit rules

- `src/lib/domain/hub-package.js`
  - normalization of stored package authority
  - entitlement resolution

- `src/lib/domain/site-settings-capabilities.js`
  - can become a compatibility adapter or be retired after the new boundary is adopted

The main point is:
- tier definitions should not stay hidden inside site-settings concerns

## 6.3 Transitional compatibility

Because the current app already consumes `resolveSiteSettingsCapabilities`, the migration should be controlled.

Recommended approach:

1. keep the existing function temporarily
2. make it internally delegate to the new package entitlement resolver
3. gradually migrate consumers to a better-named package entitlement function

That avoids a disruptive refactor while improving the model.

## 7) Provisioning Plan

## 7.1 Immediate product rule

Hub creation inside `hub-platform` is no longer the authoritative long-term onboarding path.

However, during transition, local platform provisioning still exists and must remain coherent.

So the provisioning code should be updated to accept package authority explicitly.

## 7.2 Transitional provisioning changes

Current provisioning normalization lives in:
- [`domain/hubs.js`](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/hubs.js)

Current write path lives in:
- [`hub-mutations.js`](/mnt/c/local/community-app/apps/hub-platform/src/lib/data/hub-mutations.js)

Recommended transitional change:
- allow `createHub(payload)` to accept:
  - `packageTier`
  - optional `packageStatus`
  - optional `packageSource`
- stop hardcoding `features.courses` and `features.stripePayments` as product defaults
- instead derive them from the tier

This lets the app stay internally coherent even before the external product-site onboarding is fully wired.

## 7.3 Long-term provisioning direction

Long-term:
- the product site or upstream SaaS system provisions the hub
- `hub-platform` simply consumes the resulting hub package authority

## 8) Enforcement Model

Package rules must be enforced in layers.

## 8.1 Layer 1: Visibility

Purpose:
- show the right UI
- avoid teasing unavailable features unnecessarily

Examples:
- hide courses nav outside Growth
- hide custom-domain settings outside Growth
- hide reporting routes outside Growth
- show upgrade prompts where appropriate

This is necessary, but not sufficient.

## 8.2 Layer 2: Route authority

Purpose:
- prevent direct access to unavailable capabilities

Examples:
- courses public routes should not be available when courses are disabled
- admin routes for package-gated features should not resolve as normal if unavailable
- reporting routes should be unavailable outside Growth

This is the layer that converts package gating from “UI preference” to “product rule.”

## 8.3 Layer 3: Action authority

Purpose:
- block actions even if the user bypasses the UI

Examples:
- do not allow publishing a 4th active upcoming event on Free
- do not allow enabling payments outside Growth
- do not allow creating paid events outside Growth
- do not allow creating courses outside Growth
- do not allow branding removal outside Growth

This is the most important enforcement layer.

## 8.4 Layer 4: Usage accounting

Purpose:
- compute usage accurately against package limits

Required usage counters:
- active upcoming published events
- active members

These counters should be derived centrally and reused by:
- admin surfaces
- upgrade prompts
- publish validation
- package usage summaries

Transitional implementation note:
- during the current implementation phase, active upcoming published event usage is counted through one centralized server-side helper that queries published events and filters future `startAt` values in application logic
- this avoids introducing an untracked runtime dependency on Firestore composite indexes during active development
- this is an intentional transitional choice, not the final production model

Production alignment note:
- before broader scale rollout, usage accounting should be revisited and moved to one of:
  - explicitly managed Firestore indexes committed to infrastructure setup
  - or maintained derived counters on the hub record updated transactionally from event writes
- whichever route is chosen, admin visibility and enforcement must continue using the same shared usage source so the product does not drift

## 9) First Required Usage Rules

## 9.1 Free event limit

Rule:
- Free hubs may have up to `3` active upcoming published events

Definition:
- event is published or otherwise public/active
- event start time is still in the future
- cancelled events do not count
- past events do not count

Enforcement moment:
- publish action
- re-publish action
- any status transition that would make the event active and upcoming

Canonical error:
- "You've reached your limit of 3 active events. Upgrade to publish more."

## 9.2 Active member limit

Rule:
- Free: `30`
- Starter: `200`
- Growth: unlimited

Definition:
- count members with active status only

Enforcement candidates:
- member join
- invite/member creation flows if later added
- reactivation of previously inactive members

Important note:
- this is slightly more sensitive than the event cap
- enforcement should be added only once the status model is confirmed stable enough

## 10) Route And Surface Enforcement Priorities

Recommended priority order:

### 10.1 First wave

High confidence, strong product value:
- event publish limit enforcement
- public route/nav gating for courses
- admin creation/publish gating for courses
- payments feature gating in admin and member surfaces

### 10.2 Second wave

High importance, slightly broader scope:
- branding removal gating
- reporting route gating
- custom-domain management gating
- account-settings-based domain management surface

### 10.3 Third wave

Needs lifecycle confidence:
- active-member cap enforcement
- package-aware onboarding behavior
- package-status-based restrictions if `past_due` or `cancelled` are introduced

## 11) Admin Portal Implications

The admin portal should gain a package-aware surface, but it should not become a billing application first.

Recommended V1 package visibility inside admin:

- current package
- package description
- current usage against limits
- upgrade messaging
- managed upgrade link
- operational custom-domain management inside `Account settings`

Do not build first:
- deep package editing inside admin
- complex billing controls
- custom entitlement toggling

The admin portal should support package comprehension, not package-authority sprawl.

Important clarification:

- admin package comprehension should live in `Account settings`
- operational custom-domain management for entitled hubs should also live there
- billing authority and commercial package mutation must still remain upstream on the product site

## 12) Stripe Readiness Implications

Stripe should only be implemented after this package enforcement model is in place.

Reason:
- monetisation is Growth-only
- Stripe products and flows should map to that entitlement boundary
- otherwise the Stripe integration will hardcode assumptions the package model should own

Required preconditions before Stripe:

1. Growth tier entitlement is implemented
2. payments capability is authoritative
3. paid event/course/membership gating is authoritative
4. package authority is read from the hub model, not inferred ad hoc
5. custom-domain ownership, lifecycle, and downgrade rules are locked before domain implementation proceeds

## 13) Implementation Phases

## Phase 1: Authority model

Goal:
- define and persist package authority cleanly

Tasks:
- define tier constants
- define entitlement resolver
- extend hub normalization to include package authority
- support transitional provisioning input for package tier

Definition of done:
- one canonical entitlement object exists in code

## Phase 2: Read-side adoption

Goal:
- make route and UI consumers read the new entitlement model

Tasks:
- update nav and settings consumers
- update public route resolution
- update member and admin surface capability checks

Definition of done:
- consumers no longer rely on thin ad hoc feature flags

## Phase 3: Action enforcement

Goal:
- turn package rules into real product authority

Tasks:
- enforce Free active-event cap
- gate course creation/publishing
- gate payment-related actions
- add upgrade messaging hooks

Definition of done:
- key package rules cannot be bypassed through direct action calls

## Phase 4: Usage and package visibility

Goal:
- make package usage visible and understandable

Tasks:
- compute usage counts
- expose package summaries in admin
- show upgrade triggers and usage states

Definition of done:
- hubs can understand their package and why an action is blocked

## 14) Recommended Immediate Next Build Slice

The strongest next build slice is:

1. implement canonical package entitlement resolver
2. update hub provisioning model to accept package tier
3. replace current thin site-settings capability logic with package-derived capability logic
4. enforce Free active-event publish limit

That slice gives the best leverage because it:
- turns the commercial model into real code
- creates the first real upgrade trigger
- improves product authority before Stripe

## 15) Final Recommendation

The next engineering phase should be:

- package authority
- package entitlement resolution
- first enforcement layer

Not:
- Stripe first

The first rule to implement should be:

- Free = max 3 active upcoming published events

because it is:
- easy to explain
- easy to perceive
- commercially meaningful
- a natural upgrade trigger

This is the correct bridge from the newly locked package model into the next production implementation phase.
