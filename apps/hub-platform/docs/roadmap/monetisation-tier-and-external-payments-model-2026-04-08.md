# Monetisation Tier And External Payments Model

Status:
- Locked
- Product and engineering decision document

Date:
- 2026-04-08

Purpose:
- Lock the monetisation model across `Free`, `Starter`, and `Growth`
- Define the difference between paid offerings and native payment infrastructure
- Ensure the product remains commercially useful before Growth
- Define the admin UX and public UX rules for memberships, events, and courses by package tier

Related:
- [SaaS Package Tier And Entitlement Model](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/saas-package-tier-and-entitlement-model-2026-03-29.md)
- [SaaS Package Authority And Enforcement Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/saas-package-authority-and-enforcement-plan-2026-03-29.md)
- [Admin Account Settings Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/admin-account-settings-plan-2026-03-31.md)

## 1) Executive Summary

The product is a **community operations platform**, not primarily a payment processor.

Therefore, package gating must distinguish between:

- the ability to create and sell paid offerings
- the ability to collect and manage payments natively inside the platform

That distinction is now locked as:

- `Free`
  - no courses
  - no paid offerings
- `Starter`
  - courses unlocked
  - paid memberships, paid events, and paid courses allowed
  - payment collection is external
- `Growth`
  - all Starter capabilities
  - native/internal monetisation

This model is intended to prevent Starter from becoming operationally useful but commercially unusable.

## 2) Core Product Positioning

The commercial ladder should feel like:

- `Free` -> start your community
- `Starter` -> run your community and begin monetising with your existing tools
- `Growth` -> run and monetise your community natively in one platform

This is a healthier product ladder than:

- `Free` -> start
- `Starter` -> still cannot monetise
- `Growth` -> first usable monetisation tier

The product should gate **native payment infrastructure**, not **all monetisation**.

## 3) Locked Tier Model

## 3.1 Free

Purpose:
- attract
- reduce friction
- support lightweight early-stage community operation

Included:
- members
- free memberships
- free events
- platform subdomain
- basic public site
- basic admin operations

Not included:
- courses
- paid memberships
- paid events
- paid courses
- custom domain
- native payments

## 3.2 Starter

Purpose:
- make the product commercially useful for real communities before they need full financial infrastructure

Included:
- courses
- paid memberships
- paid events
- paid courses
- external payment link support
- payment instructions for members/visitors
- lightweight operational handling for off-platform payment flows

Not included:
- native/internal checkout
- automated payment capture
- automated internal payment-state reconciliation
- custom domain
- advanced commercial reporting

Starter monetisation model:
- the community can charge people
- payment is completed outside the platform
- the platform remains the operational system of record for the offering, registration intent, and follow-up flow

## 3.3 Growth

Purpose:
- unify operations and monetisation in one product

Included:
- everything in Starter
- native/internal payments
- automated payment-state handling
- richer finance/commercial reporting
- custom domain

Growth monetisation model:
- the community can charge people
- payment is collected and tracked inside the platform

## 4) Locked Entitlement Concepts

The product must no longer rely on a single coarse `paymentsEnabled` concept.

The model should distinguish:

- `canCreatePaidMemberships`
- `canCreatePaidEvents`
- `canCreatePaidCourses`
- `paymentProcessingMode`

Recommended normalized meaning:

```js
{
  capabilities: {
    coursesEnabled: boolean,
    paidMembershipsEnabled: boolean,
    paidEventsEnabled: boolean,
    paidCoursesEnabled: boolean,
    nativePaymentsEnabled: boolean,
  },
  paymentProcessingMode: "none" | "external" | "internal",
}
```

Per tier:

- `Free`
  - `coursesEnabled = false`
  - `paidMembershipsEnabled = false`
  - `paidEventsEnabled = false`
  - `paidCoursesEnabled = false`
  - `nativePaymentsEnabled = false`
  - `paymentProcessingMode = "none"`

- `Starter`
  - `coursesEnabled = true`
  - `paidMembershipsEnabled = true`
  - `paidEventsEnabled = true`
  - `paidCoursesEnabled = true`
  - `nativePaymentsEnabled = false`
  - `paymentProcessingMode = "external"`

- `Growth`
  - `coursesEnabled = true`
  - `paidMembershipsEnabled = true`
  - `paidEventsEnabled = true`
  - `paidCoursesEnabled = true`
  - `nativePaymentsEnabled = true`
  - `paymentProcessingMode = "internal"`

## 5) Admin UX Rules

## 5.1 Free admin UX

Admins should be able to:
- create free memberships
- create free events
- manage members and basic community operations

Admins should not be able to:
- create courses
- configure paid memberships
- configure paid events
- configure paid courses

UX requirements:
- course creation should clearly explain that courses unlock on Starter
- paid pricing controls should be hidden or disabled with upgrade guidance
- messaging should describe the next operational capability, not only a restriction

Preferred language:
- `Courses are available on Starter and above.`
- `Upgrade to Starter to create and run courses.`
- `Paid registrations are available from Starter.`

## 5.2 Starter admin UX

Admins should be able to create:
- paid memberships
- paid events
- paid courses

Starter paid-offering setup should support:
- price
- currency or display amount
- external payment link
- short payment instructions
- a clear registration/payment handling mode

Starter must not be framed as broken or half-disabled.

Preferred language:
- `External payments`
- `Use your existing checkout link`
- `Upgrade to Growth for built-in payments and automated payment tracking`

Avoid:
- `Payments locked`
- `Monetisation unavailable`

## 5.3 Growth admin UX

Growth should present:
- native payment collection
- built-in payment-state handling
- streamlined monetisation setup

Preferred language:
- `Built-in payments`
- `Collect payments inside the platform`

## 6) Public Registration UX Rules

The public-site experience must also adapt cleanly by tier.

## 6.1 Free public UX

Visitors and members should see:
- free memberships only
- free events only
- no courses

There should be no references to external checkout or paid registration for Free hubs.

## 6.2 Starter public UX

For paid memberships, events, and courses:
- price should be visible clearly
- the primary CTA should clearly indicate off-platform payment
- the user should not be misled into thinking payment is happening natively

Recommended CTA patterns:
- `Continue to payment`
- `Pay externally`

Recommended support copy:
- `Payment is completed on an external checkout page.`
- `Your registration will be confirmed after payment is completed.`

Allowed operational patterns:

1. external payment first, then return
2. registration request pending admin confirmation
3. external payment plus admin-side confirmation workflow

The important rule is clarity:
- the platform must be honest about where payment happens
- the next step after payment must be understandable

## 6.3 Growth public UX

For paid offerings:
- checkout should remain inside the platform
- payment and confirmation should feel native to the product

This creates a clear upgrade value without making Starter unusable.

## 7) Registration And Offer Rules By Product Surface

### Membership plans

- `Free`
  - free plans only
- `Starter`
  - paid plans allowed with external payment link
- `Growth`
  - paid plans allowed with native/internal payments

### Events

- `Free`
  - free events only
- `Starter`
  - paid events allowed with external payment link
- `Growth`
  - paid events allowed with native/internal payments

### Courses

- `Free`
  - unavailable
- `Starter`
  - courses available
  - paid courses allowed with external payment link
- `Growth`
  - courses available
  - paid courses allowed with native/internal payments

## 8) Product Boundary Clarification

This decision does **not** mean the product should immediately implement complex manual back-office finance tooling for Starter.

Starter should remain lightweight:
- external payment link
- clear user guidance
- minimal operational handling

Growth remains the tier where financial operations become native and more automated.

## 9) Final Decisions Locked By This Document

Locked:

- Starter is allowed to monetise
- Starter monetisation is external, not internal
- Growth is the native/internal monetisation tier
- Free does not include courses
- Starter does include courses
- admin UX and public UX must both adapt to package tier and payment-processing mode
- the product should gate payment infrastructure, not all monetisation
