# Monetisation Tier Implementation Sequence

Status:
- Locked
- Delivery sequencing document

Date:
- 2026-04-08

Purpose:
- Convert the locked monetisation tier model into an implementation sequence
- Keep the work controlled across entitlements, domain rules, admin UX, and public UX
- Prevent drift between package policy, validation logic, and user-facing flows

Related:
- [Monetisation Tier And External Payments Model](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/monetisation-tier-and-external-payments-model-2026-04-08.md)
- [SaaS Package Tier And Entitlement Model](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/saas-package-tier-and-entitlement-model-2026-03-29.md)
- [SaaS Package Authority And Enforcement Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/saas-package-authority-and-enforcement-plan-2026-03-29.md)
- [Admin Account Settings Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/admin-account-settings-plan-2026-03-31.md)

## 1) Executive Summary

The monetisation-tier work should be delivered in a controlled order:

1. entitlement model refactor
2. domain and validation rules
3. admin create/edit UX
4. public registration and join UX
5. operational state handling for external payments
6. package and messaging alignment
7. final regression coverage

This order is deliberate.

The product must first know what each tier is allowed to do.
Only then should it change payload validation, admin setup, and public registration behavior.

## 2) Delivery Principles

The implementation must preserve these rules:

- `Free` has no courses and no paid offerings
- `Starter` has courses and can create paid offerings using external payments
- `Growth` has courses and can create paid offerings using native/internal payments

The implementation must distinguish:

- permission to create paid offerings
- payment processing mode

The implementation must not:

- treat Starter as a broken payments tier
- imply native checkout where payment is external
- build full finance operations into Starter

## 3) Implementation Sequence

## 3.1 Step 1: Entitlement model refactor

Goal:
- replace coarse monetisation assumptions with explicit package-derived capabilities

Deliver:
- add or normalize capability resolution for:
  - `coursesEnabled`
  - `paidMembershipsEnabled`
  - `paidEventsEnabled`
  - `paidCoursesEnabled`
  - `nativePaymentsEnabled`
  - `paymentProcessingMode`

Acceptance criteria:
- `Free` resolves to:
  - `coursesEnabled = false`
  - all paid offering capabilities disabled
  - `paymentProcessingMode = "none"`
- `Starter` resolves to:
  - `coursesEnabled = true`
  - paid memberships, events, and courses enabled
  - `nativePaymentsEnabled = false`
  - `paymentProcessingMode = "external"`
- `Growth` resolves to:
  - `coursesEnabled = true`
  - paid memberships, events, and courses enabled
  - `nativePaymentsEnabled = true`
  - `paymentProcessingMode = "internal"`
- existing entitlement consumers either:
  - use the new model directly, or
  - are covered by an intentional compatibility layer

## 3.2 Step 2: Domain and validation rules

Goal:
- make the source-of-truth domain rules match the locked package model

Deliver:
- update domain validation for:
  - memberships
  - events
  - courses
- validate:
  - free pricing
  - paid pricing
  - external payment links
  - payment instructions where required
  - tier and processing-mode constraints

Acceptance criteria:
- `Free` cannot create paid memberships
- `Free` cannot create paid events
- `Free` cannot create courses
- `Starter` can create paid memberships, events, and courses
- `Starter` paid offerings require external-payment-compatible configuration
- `Growth` can create paid memberships, events, and courses with native/internal payment mode
- invalid tier/pricing combinations fail at the domain layer, not only in UI

## 3.3 Step 3: Admin create/edit UX

Goal:
- make admin setup flows accurate and package-aware

Deliver:
- update create/edit flows for:
  - membership plans
  - events
  - courses
- show/hide or relabel monetisation controls by tier

Acceptance criteria:
- `Free`
  - paid pricing controls are hidden or disabled with clear upgrade messaging
  - course creation is blocked with clear Starter messaging
- `Starter`
  - pricing controls are available
  - external payment link input is available
  - external payment instructions are available where needed
  - UI uses `External payments` rather than `Payments locked`
- `Growth`
  - native payment language and controls are shown
  - the UI does not require an external payment link

## 3.4 Step 4: Public registration and join UX

Goal:
- make public registration flows honest, clear, and tier-aware

Deliver:
- adapt public flows for:
  - membership join
  - event registration
  - course registration

Acceptance criteria:
- `Free`
  - only free join/registration flows are shown
  - no course registration flows exist
- `Starter`
  - paid offerings show clear price
  - the CTA clearly indicates external payment
  - copy clearly explains payment happens off-platform
- `Growth`
  - paid offerings use native/internal payment language and flow
- no public `Starter` flow implies the platform is directly collecting payment

## 3.5 Step 5: Operational state handling

Goal:
- define the minimal operational model after a Starter user pays externally

Deliver:
- determine the post-payment state per surface:
  - memberships
  - events
  - courses
- support lightweight follow-up states without overbuilding finance tooling

Acceptance criteria:
- Starter external-payment flows produce a defined next state such as:
  - pending confirmation
  - request submitted
  - awaiting admin approval
- admin-facing follow-up is understandable
- member-facing status is understandable
- Starter does not gain full payment reconciliation behavior

## 3.6 Step 6: Package and messaging alignment

Goal:
- keep package messaging consistent across admin and public surfaces

Deliver:
- align package copy in:
  - account settings
  - memberships
  - events
  - courses
  - public registration states

Acceptance criteria:
- `Free` messaging promotes Starter for courses and paid offerings
- `Starter` messaging promotes Growth for built-in payments
- wording is consistent and product-facing across surfaces

## 3.7 Step 7: Regression coverage

Goal:
- lock the model into tests so it remains stable during future Stripe and package work

Deliver:
- entitlement tests
- domain validation tests
- admin form-state tests where appropriate
- public flow tests/helpers where appropriate

Acceptance criteria:
- tests cover all three tiers
- tests cover:
  - memberships
  - events
  - courses
- tests cover:
  - no payments
  - external payments
  - internal payments
- the unit suite remains green

## 4) Recommended Delivery Slices

To reduce risk, deliver this work in three slices.

### Slice A

Scope:
- Step 1: entitlement model refactor
- Step 2: domain and validation rules
- Step 7: tests for those layers

Purpose:
- establish the correct product logic before touching UI

### Slice B

Scope:
- Step 3: admin create/edit UX
- Step 6: admin-side messaging alignment

Purpose:
- make admin setup flows usable and truthful

### Slice C

Scope:
- Step 4: public registration and join UX
- Step 5: operational state handling
- final Step 6 messaging alignment
- Step 7 final regression coverage

Purpose:
- make member and visitor flows coherent with the locked package model

## 5) Execution Rule

Do not skip directly to UI changes.

The implementation should always proceed in this order:

1. entitlement logic
2. domain rules
3. admin UX
4. public UX
5. operational follow-up handling
6. final messaging and tests

## 6) Final Decision

This document is now the working implementation sequence for the monetisation-tier redesign.

Future implementation should follow this document rather than re-deciding the order ad hoc in chat.
