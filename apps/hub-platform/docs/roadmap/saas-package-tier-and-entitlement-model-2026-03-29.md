# SaaS Package Tier And Entitlement Model

Status:
- Proposed
- Product and engineering decision document

Date:
- 2026-03-29

Purpose:
- Lock the SaaS package model for the product
- Define which capabilities and limits belong to each package tier
- Define how package authority should enter `hub-platform`
- Give engineering a concrete basis for provisioning, gating, onboarding, and later Stripe integration

Related:
- [SaaS Domain, Onboarding, And Tier Audit](/mnt/c/local/community-app/apps/hub-platform/docs/audits/2026-03-29-saas-domain-onboarding-and-tier-audit.md)
- [SaaS Direction And Next Steps](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/saas-direction-and-next-steps-2026-03-15.md)
- [SaaS Domain And Route Model](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/saas-domain-and-route-model-2026-03-15.md)
- [Custom Domain Management Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/custom-domain-management-plan-2026-03-31.md)
- [Monetisation Tier And External Payments Model](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/monetisation-tier-and-external-payments-model-2026-04-08.md)
- [Hub Site Config Schema And Package Gating](/mnt/c/local/community-app/apps/hub-platform/docs/public-site/hub-site-config-schema-and-package-gating.md)
- [SaaS Site Settings Schema And Ownership Model](/mnt/c/local/community-app/apps/hub-platform/docs/public-site/saas-site-settings-schema-and-ownership-model-2026-03-15.md)

## 1) Executive Summary

The product package model is:

- `Free`
- `Starter`
- `Growth`

This is not a pricing model based primarily on individual features.  
This is a pricing model based on **capability level**.

The intended progression is:

- `Free` -> experiment
- `Starter` -> operate and begin monetising with existing tools
- `Growth` -> monetise natively

This is the core commercial ladder for the product:

1. get hubs in
2. get them active
3. monetise once they are deriving operational value

This document is now the working reference for:

- package naming
- package pricing direction
- package capabilities
- package limits
- entitlement ownership
- upgrade triggers
- reporting scope
- monetisation scope

## 2) Core Commercial Positioning

The product is not charging only for more buttons or more routes.

The product is charging for a deeper operating capability:

- `Free` lets a community get started
- `Starter` helps a community run operationally
- `Growth` helps a community run and monetise

This is important because it affects:

- upgrade messaging
- onboarding language
- enforcement strategy
- reporting strategy
- Stripe integration planning

The product positioning should feel like:

- "Run your community"
- then
- "Run and monetise your community"

Not:

- "Unlock random advanced features"

## 3) Package Authority Model

### 3.1 Source of truth

Package authority should **not** originate inside `apps/hub-platform`.

Package assignment should happen on the **product site**, where the client:

- signs up
- chooses a plan
- creates or provisions their hub
- establishes the commercial relationship

`hub-platform` should then **consume** that package decision as product authority.

### 3.2 What `hub-platform` should own

`hub-platform` should own:

- reading package tier
- resolving package-derived capabilities
- resolving package-derived limits
- enforcing those limits and capabilities
- showing package/usage information in admin
- showing upgrade prompts and conversion moments
- operational custom-domain management for entitled hubs

### 3.3 What `hub-platform` should not own

`hub-platform` should not be the primary system for:

- initial plan selection
- package sales checkout
- first-time SaaS signup
- primary commercial subscription authority

Admin inside `hub-platform` may later support:

- viewing current package
- viewing usage against limits
- linking to manage or upgrade package
- operational domain management inside admin `Account settings`

But the product site remains the canonical entry point for package assignment.

## 4) Early Pricing Strategy

Recommended launch pricing:

- `Free`
- `Starter` at `£15–£20 / month`
- `Growth` at `£35–£45 / month`

Current preferred positioning:

- `Free`
- `Starter` at approximately `£15`
- `Growth` at approximately `£35`

This may still shift during launch refinement, but the relative ladder is now locked:

- low-friction free entry
- modest operational tier
- clear monetisation tier

## 5) Package Tier Definitions

## 5.1 Free

Purpose:
- attract
- reduce friction
- prove value quickly

Positioning:
- get your community online
- test the product
- start running a small number of events

Included:
- platform subdomain only
- basic public site
- basic core pages
- events capability with a strict active-event cap

Not included:
- payments
- custom domain
- remove product branding
- courses

Current recommended limits:
- maximum `3` active upcoming events
- active member cap: `30`

Important behavior:
- event limit is based on **active upcoming events**, not total historical events
- once an event passes, it frees a slot
- this creates a natural and understandable upgrade moment

Canonical upgrade message example:

> You've reached your limit of 3 active events. Upgrade to publish more.

This is intentionally a conversion trigger, not just a restriction.

## 5.2 Starter

Purpose:
- operational value

Positioning:
- run your community reliably

Included:
- unlimited events
- RSVP tracking
- email reminders
- member list
- courses
- paid memberships via external payments
- paid events via external payments
- paid courses via external payments

Still included:
- product branding remains visible as `Powered by ...`

Not included:
- native/internal payments
- custom domain
- remove branding
- advanced commercial reporting

Current recommended limits:
- active member cap: `200`

Interpretation:
- Starter is for communities that are actively operating and may already be charging through external checkout tools, without yet needing native payment infrastructure

## 5.3 Growth

Purpose:
- monetisation and maturity

Positioning:
- run and monetise your community

Included:
- all monetisation features
- native/internal payments for:
  - events
  - courses
  - memberships
- custom domain
- remove product branding
- unlimited members
- reporting
- courses

Reporting at this tier should focus on:
- revenue visibility
- event performance
- member growth
- engagement visibility

Interpretation:
- Growth is the tier where the platform becomes part of the hub’s operating and revenue system

## 6) Locked Capability Matrix

This is the current recommended entitlement model.

### 6.1 Free

Enabled:
- public site
- subdomain site
- basic public pages
- events
- member accounts
- member sign-in/join
- bookings for free events

Disabled:
- payments
- memberships as paid monetisation products
- paid events
- paid courses
- paid memberships
- courses
- custom domain
- remove branding
- advanced reporting

Limits:
- `3` active upcoming events
- `30` active members

### 6.2 Starter

Enabled:
- everything in Free except its limits
- unlimited events
- RSVP tracking
- email reminders
- member list and operational member management

Disabled:
- all monetisation features
- courses
- custom domain
- remove branding
- advanced reporting

Limits:
- `200` active members

### 6.3 Growth

Enabled:
- all operational features from Starter
- monetisation features
- Stripe-powered payments
- paid events
- paid memberships
- courses
- paid courses
- custom domain
- branding removal
- reporting
- unlimited members

Limits:
- no member cap in the first released model

## 7) Locked Limit Semantics

### 7.1 Member cap semantics

Member caps must be based on **active members only**.

This means:
- inactive or suspended members should not count toward the active-member limit

This is the correct long-term rule because it aligns commercial value with real active usage.

### 7.2 Event cap semantics

The Free plan event cap must be based on:

- **active upcoming published events**

Not:
- total events ever created
- events created in a calendar month

Reason:
- easier to explain
- easier to enforce
- creates a natural ongoing upgrade trigger
- aligns with real visible usage

### 7.3 Branding rules

Branding entitlement is:

- `Free`: powered-by branding remains
- `Starter`: powered-by branding remains
- `Growth`: powered-by branding removable

This is one of the highest perceived-value package upgrades and should remain protected.

## 8) Monetisation Model

## 8.1 Tier access

All monetisation features are **Growth only**.

That includes:
- paid events
- paid courses
- paid memberships
- Stripe-based payment processing

This creates the clean mental model:

- `Starter`: run your community
- `Growth`: run + monetise your community

## 8.2 Transaction fees

Recommended early model:

- platform fee of approximately `2%–3%`
- plus Stripe fees

The preferred payments architecture is:

- Stripe Connect
- client-led Stripe accounts
- funds should not flow through the platform as the merchant of record unless there is a strong later reason to do so

This is the preferred direction because it:

- reduces operational complexity
- aligns payments more directly to the client
- better supports the SaaS platform model

Exact fee handling should be locked once the Stripe integration architecture is finalized.

## 8.3 Optional add-on later

Potential later add-on:

- `Done-for-you setup`
- one-time fee of approximately `£200–£500`

This is intentionally separate from the core recurring SaaS tiers.

It should be treated as:
- a service add-on
- not a package tier

## 9) Reporting Scope

Reporting belongs in `Growth`.

The reporting product should reinforce the product position:

> We help you grow and understand your community.

It should **not** become:

> A complex business intelligence suite.

### 9.1 Must-have reporting for Growth

Revenue:
- total monthly revenue
- revenue per event
- revenue per course
- number of paid versus free events
- average ticket price

Event and course performance:
- registrations or RSVPs
- attendance
- conversion from published event/course to bookings where meaningful

Member growth:
- total members
- new members by week or month
- active versus inactive members

Engagement:
- engagement rate
- operational summaries around participation

### 9.2 Future reporting candidates

Potential later additions:
- site visits
- event page views
- top-performing events
- top-performing courses

These are useful, but they should follow the core revenue, participation, and growth reporting rather than precede it.

### 9.3 What not to build early

Do not build early:
- advanced filtering
- custom report builders
- export-heavy reporting
- cohort analysis
- complex graphs

The first reporting model should be:
- simple
- clean
- insight-driven
- immediately understandable

## 10) Package-To-Capability Engineering Model

The codebase should stop treating capabilities as ad hoc booleans and move to a package-derived entitlement model.

Recommended shape:

```js
{
  packageTier: "free" | "starter" | "growth",
  limits: {
    activeUpcomingEvents: number | null,
    activeMembers: number | null,
  },
  capabilities: {
    eventsEnabled: true,
    rsvpTrackingEnabled: boolean,
    emailRemindersEnabled: boolean,
    memberListEnabled: boolean,
    coursesEnabled: boolean,
    paymentsEnabled: boolean,
    customDomainEnabled: boolean,
    brandingRemovalEnabled: boolean,
    reportingEnabled: boolean,
  },
}
```

This should be derived from package authority, not hand-authored per hub in arbitrary ways.

## 11) Enforcement Expectations

Package rules should be enforced in three layers.

### 11.1 UI exposure

Use package entitlement to:
- hide unavailable settings
- hide unavailable routes from primary navigation
- show upgrade prompts clearly

### 11.2 Route and feature authority

Use package entitlement to:
- block gated product routes where appropriate
- block gated creation/publish actions
- block monetisation setup outside Growth

### 11.3 Usage-limit enforcement

Use package limits to:
- stop Free hubs publishing more than 3 active upcoming events
- stop Free and Starter hubs exceeding active-member limits where the product chooses to enforce them

The publish-time event limit is especially important because it creates a clean conversion moment without making the product feel arbitrary.

## 12) Onboarding And Package Lifecycle

### 12.1 Product-site onboarding

The product site should:
- capture signup
- capture selected package
- create the hub
- assign package tier
- initialize hub entitlements

### 12.2 Hub-platform behavior

`hub-platform` should:
- consume the package assignment
- enforce package-derived capabilities
- show usage and upgrade context
- allow the owner/admin to view package status inside admin

### 12.3 Admin package management inside hub-platform

The admin portal may later support:
- view current package
- view current usage against limits
- view upgrade options
- follow a managed path to the product site or billing system

It should not become the primary source of package truth.

## 13) Recommended Immediate Follow-On Work

1. update the capability adapter to this package model
- replace current thin package flags with authoritative tier-derived capabilities and limits

2. add package authority to hub provisioning inputs from the product system
- even if that authority is initially mocked or seeded from upstream

3. define usage counters and enforcement rules
- especially:
  - active upcoming events
  - active members

4. wire package gating into route and action authority
- not just header navigation

5. use this package model as the prerequisite for Stripe planning
- Stripe should plug into the Growth entitlement model, not define it

## 14) Final Decision Summary

The package model is:

- `Free`
- `Starter`
- `Growth`

The commercial progression is:

- attract
- operate
- monetise

The most important locked decisions are:

- active-member caps are based on active members only
- Free allows up to 3 active upcoming events
- all monetisation is Growth-only
- custom domain is Growth-only
- custom-domain operations live in `hub-platform` admin, not on the product site
- custom-domain verification is background-job based with manual recheck
- V1 custom-domain support is one primary domain per hub with strong root + `www` handling
- downgrade off Growth takes effect at the end of the paid billing period and removes active custom-domain service
- branding removal is Growth-only
- Starter still includes powered-by branding
- package authority originates on the product site, not in `hub-platform`
- reporting should be simple, operational, and insight-driven rather than analytics-heavy

This is now the recommended product and engineering basis for the next SaaS implementation phase.
