# Product Site Current-State Audit And Next Steps

Status:
- Repo-audited current-state document
- Supersedes older “product site still missing” assumptions in roadmap planning docs

Date:
- 2026-05-01

Purpose:
- Record what `apps/product-site` actually delivers today
- Correct outdated roadmap statements that still describe the product site as mostly unimplemented
- Define the next-step focus based on shipped code rather than the earlier greenfield execution plans

Authority:
- [Roadmap Docs README](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/README.md)
- [Product Site And Commercial Platform Implementation Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-and-commercial-platform-implementation-plan-2026-04-20.md)
- [Product Site Phase 3 Execution Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-phase-3-execution-plan-2026-04-20.md)
- [Product Site Production Onboarding And Admin Handoff Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-production-onboarding-and-admin-handoff-plan-2026-04-21.md)

## 1) Executive Summary

The repo is materially ahead of several product-site roadmap assumptions.

`apps/product-site` is no longer just:

- an app boundary
- a marketing shell
- a future billing placeholder

It already contains a real commercial-account, provisioning, and Stripe-billing implementation slice.

What is now implemented in code:

1. marketing routes and package-selection UX
2. signup flow that provisions a hub into `hub-platform`
3. commercial-account creation and ownership linkage
4. Firebase-auth-backed commercial sign-in and password lifecycle routes
5. account session management
6. account overview, package, billing, and upgrade routes
7. Stripe checkout for paid package activation
8. Stripe billing portal access
9. Stripe webhook reconciliation and package-authority sync back into `hub-platform`
10. owner-admin activation handoff back into the hub admin product

The next work is therefore no longer “build the product site.”

The next work is:

- production hardening
- environment verification
- support/runbook maturity
- final lifecycle polish across billing, onboarding, and cross-app handoff

## 2) Repo-Audited Current State

### 2.1 Product-site route foundation is real

Implemented route groups:

- marketing shell and homepage:
  - [src/app/page.jsx](/mnt/c/local/community-app/apps/product-site/src/app/page.jsx)
- pricing:
  - [src/app/(marketing)/pricing/page.jsx](/mnt/c/local/community-app/apps/product-site/src/app/(marketing)/pricing/page.jsx)
- signup:
  - [src/app/(marketing)/signup/page.jsx](/mnt/c/local/community-app/apps/product-site/src/app/(marketing)/signup/page.jsx)
  - [src/app/(marketing)/signup/success/page.jsx](/mnt/c/local/community-app/apps/product-site/src/app/(marketing)/signup/success/page.jsx)
  - [src/app/(marketing)/signup/next-steps/page.jsx](/mnt/c/local/community-app/apps/product-site/src/app/(marketing)/signup/next-steps/page.jsx)
- sign-in and password recovery:
  - [src/app/(marketing)/sign-in/page.jsx](/mnt/c/local/community-app/apps/product-site/src/app/(marketing)/sign-in/page.jsx)
  - [src/app/(marketing)/forgot-password/page.jsx](/mnt/c/local/community-app/apps/product-site/src/app/(marketing)/forgot-password/page.jsx)
  - [src/app/(marketing)/reset-password/page.jsx](/mnt/c/local/community-app/apps/product-site/src/app/(marketing)/reset-password/page.jsx)
  - [src/app/(marketing)/verify-email/page.jsx](/mnt/c/local/community-app/apps/product-site/src/app/(marketing)/verify-email/page.jsx)
- commercial account area:
  - [src/app/(account)/account/page.jsx](/mnt/c/local/community-app/apps/product-site/src/app/(account)/account/page.jsx)
  - [src/app/(account)/account/package/page.jsx](/mnt/c/local/community-app/apps/product-site/src/app/(account)/account/package/page.jsx)
  - [src/app/(account)/account/billing/page.jsx](/mnt/c/local/community-app/apps/product-site/src/app/(account)/account/billing/page.jsx)
  - [src/app/(account)/account/upgrade/page.jsx](/mnt/c/local/community-app/apps/product-site/src/app/(account)/account/upgrade/page.jsx)

Operational meaning:

- the product site already has a meaningful commercial route map
- account management is not hypothetical anymore

### 2.2 Signup and provisioning are implemented

Implemented files:

- [src/app/(marketing)/signup/actions.js](/mnt/c/local/community-app/apps/product-site/src/app/(marketing)/signup/actions.js)
- [src/lib/server/provision-hub.js](/mnt/c/local/community-app/apps/product-site/src/lib/server/provision-hub.js)
- [src/lib/data/commercial-accounts.js](/mnt/c/local/community-app/apps/product-site/src/lib/data/commercial-accounts.js)

What is true in code:

- signup validates owner, workspace, package, and password inputs
- signup provisions a hub into `hub-platform` through the internal provisioning contract
- signup links the created hub to a commercial account record
- signup creates or resolves the commercial auth user
- signup writes a product-site account session
- paid signup paths attempt immediate Stripe checkout handoff for Starter/Growth
- free signup paths complete into success/next-step account flow

Operational meaning:

- Phase 3 provisioning is already real
- the product site is already the commercial initiator for workspace creation

### 2.3 Commercial account auth and session handling are implemented

Implemented files:

- [src/lib/auth/commercial-auth.js](/mnt/c/local/community-app/apps/product-site/src/lib/auth/commercial-auth.js)
- [src/lib/server/account-session.js](/mnt/c/local/community-app/apps/product-site/src/lib/server/account-session.js)
- [src/lib/server/commercial-account-context.js](/mnt/c/local/community-app/apps/product-site/src/lib/server/commercial-account-context.js)

What is true in code:

- commercial accounts are linked to Firebase Auth users
- verification state is synchronized from Auth
- a signed product-site account session cookie exists
- account routes resolve the current commercial account plus its current hub context
- account context refreshes Stripe subscription state before rendering account surfaces

Operational meaning:

- the product site is no longer waiting on a future account/auth layer
- the customer account shell is already a real authenticated product surface

### 2.4 Package, billing, and upgrade flows are implemented

Implemented files:

- [src/app/(account)/account/package/page.jsx](/mnt/c/local/community-app/apps/product-site/src/app/(account)/account/package/page.jsx)
- [src/app/(account)/account/billing/page.jsx](/mnt/c/local/community-app/apps/product-site/src/app/(account)/account/billing/page.jsx)
- [src/app/(account)/account/upgrade/page.jsx](/mnt/c/local/community-app/apps/product-site/src/app/(account)/account/upgrade/page.jsx)
- [src/app/(account)/account/billing/actions.js](/mnt/c/local/community-app/apps/product-site/src/app/(account)/account/billing/actions.js)
- [src/app/(account)/account/upgrade/actions.js](/mnt/c/local/community-app/apps/product-site/src/app/(account)/account/upgrade/actions.js)

What is true in code:

- the customer can view package and billing state
- the customer can start Stripe checkout for paid package activation
- the customer can open a Stripe billing portal
- the customer can apply immediate package upgrades where supported
- the customer can schedule package downgrades or cancellation
- the customer can cancel scheduled package changes

Operational meaning:

- Phase 4 and Phase 5 concerns are no longer merely planned
- the commercial account surface already owns meaningful billing lifecycle behavior

### 2.5 Stripe billing integration is implemented

Implemented files:

- [src/app/api/stripe/webhooks/route.js](/mnt/c/local/community-app/apps/product-site/src/app/api/stripe/webhooks/route.js)
- [src/lib/server/commercial-billing.js](/mnt/c/local/community-app/apps/product-site/src/lib/server/commercial-billing.js)
- [src/lib/server/stripe.js](/mnt/c/local/community-app/apps/product-site/src/lib/server/stripe.js)

What is true in code:

- Stripe checkout sessions are created for package change flows
- Stripe billing portal sessions are created for commercial accounts
- Stripe webhook signature verification exists
- webhook processing updates commercial account billing state
- package-authority updates are pushed back into `hub-platform`

Operational meaning:

- “no Stripe integration exists yet” is no longer true
- Stripe lifecycle work is already underway in the product site

### 2.6 Cross-app package-authority and admin handoff are implemented

Implemented files:

- [src/lib/server/hub-package-authority.js](/mnt/c/local/community-app/apps/product-site/src/lib/server/hub-package-authority.js)
- [src/lib/server/provision-owner-admin.js](/mnt/c/local/community-app/apps/product-site/src/lib/server/provision-owner-admin.js)
- [src/app/(account)/account/actions.js](/mnt/c/local/community-app/apps/product-site/src/app/(account)/account/actions.js)

What is true in code:

- the product site can call the internal package-authority sync endpoint in `hub-platform`
- the product site can trigger owner-admin activation into `hub-platform`
- verified commercial users can open their hub admin area from the product-site account surface

Operational meaning:

- the onboarding/admin-handoff bridge is no longer just a roadmap seam
- the current remaining work is reliability and rollout hardening, not greenfield design

## 3) What The Docs Need To Stop Claiming

The following statements are now outdated and should not be used as current-state truth:

1. “a dedicated product-site app boundary now exists, but no live package-management destination exists outside `hub-platform` yet”
2. “no first-class external package update flow exists yet”
3. “no Stripe integration exists yet”
4. “Phase 3 does not yet implement Stripe-backed checkout” as a current-state description

Those statements remain historically useful, but they are no longer accurate descriptions of the repo.

## 4) Current Gaps That Still Matter

The product site is ahead of older docs, but it is not fully production-closed.

The most important remaining gaps are:

### 4.1 Environment and rollout hardening

- staging and production Stripe verification
- webhook secret and billing-environment validation in deployed environments
- end-to-end verification of provisioning and admin-handoff across real hosts

### 4.2 Operational support maturity

- runbooks for failed checkout, webhook drift, and billing-portal edge cases
- operator-facing recovery guidance when account/package sync falls behind Stripe
- final documentation of expected lifecycle transitions

### 4.3 Product-model maturity

- confirm multi-hub commercial-account expectations
- clarify package-management behavior when a customer owns more than one hub
- continue tightening route-state and account-state messaging as lifecycle breadth grows

## 5) Recommended Next-Step Focus

Based on current shipped code, the next sequence should be:

1. production-grade verification of Stripe-backed commercial flows
2. onboarding/admin-handoff hardening and recovery handling
3. support and audit visibility across package lifecycle events
4. final product-site and `hub-platform` documentation cleanup so current-state authority matches shipped code

This is a hardening and rollout phase, not a product-site bootstrap phase.
