# Product Site Phase 5 Execution Plan

Status:
- In progress
- Execution-ready delivery breakdown with repo-backed implementation now started

Date:
- 2026-04-20

Purpose:
- Turn Phase 5 of the product-site/commercial-platform work into an implementation-ready plan
- Define how Stripe should be integrated into the product site without moving billing authority into `hub-platform`
- Lock the billing lifecycle, webhook model, package-authority update flow, and operational recovery expectations before production payment work begins

Authority:
- [Product Site And Commercial Platform Implementation Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-and-commercial-platform-implementation-plan-2026-04-20.md)
- [Product Site Phase 1 Execution Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-phase-1-execution-plan-2026-04-20.md)
- [Product Site Phase 2 Execution Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-phase-2-execution-plan-2026-04-20.md)
- [Product Site Phase 3 Execution Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-phase-3-execution-plan-2026-04-20.md)
- [Product Site Phase 4 Execution Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-phase-4-execution-plan-2026-04-20.md)
- [Roadmap Docs README](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/README.md)
- app-local standards in `docs/standards/*`

Related:
- [Product-Site Package Authority Contract](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-package-authority-contract-2026-03-31.md)
- [SaaS Package Authority And Enforcement Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/saas-package-authority-and-enforcement-plan-2026-03-29.md)
- [SaaS Package Tier And Entitlement Model](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/saas-package-tier-and-entitlement-model-2026-03-29.md)

## 1) Phase 5 Goal

Phase 5 exists to make the product site the authoritative billing and subscription system for package lifecycle changes.

This phase introduces:

- Stripe customer creation
- Stripe checkout and subscription handling
- webhook-driven lifecycle processing
- package-authority updates written back into the canonical hub record

It does **not** move entitlement logic into Stripe.

It keeps `hub-platform` as the operational consumer of package authority while Stripe becomes the commercial event source.

## 1.1) Repo-audited implementation status on 2026-04-22

The repo now includes the Phase 5 foundation in code:

- Stripe server client and environment contract in `apps/product-site`
- commercial account Stripe fields for customer, subscription, status, and event sync state
- checkout session creation for first paid-package activation
- billing portal session creation for existing commercial billing context
- verified webhook endpoint at `apps/product-site/src/app/api/stripe/webhooks/route.js`
- webhook-driven package-authority write-through into `hub-platform`
- protected internal package-authority update route inside `hub-platform`
- account-route billing and upgrade surfaces that now distinguish:
  - first paid checkout
  - existing-subscription management through the billing portal
  - not-configured or not-started billing states
- paid marketing signup now hands off directly into Stripe Checkout for `Starter` and `Growth` instead of treating paid onboarding as complete before billing succeeds
- signup provisions those paid selections onto a free baseline first, so the hub is not left in a falsely-active paid state if checkout is cancelled or fails
- paid checkout for new signup now returns to a branded product-site next-steps route instead of dropping straight into the account area without guidance
- owner verification emails now enter a branded product-site verification route, which applies the Firebase action code without exposing the customer to Firebase-hosted UI during onboarding

What still remains before Phase 5 can be treated as production-complete:

- live Stripe account configuration
- real Stripe product and price setup
- webhook registration against the deployed product-site origin
- end-to-end verification of:
  - checkout success
  - webhook-driven package sync
  - billing portal access
  - downgrade and cancellation behavior
- support-grade reconciliation and recovery tooling

## 1.2) Current source of truth on 2026-04-24

The implementation has now moved beyond the original Phase 5 foundation described above.

For the current repo-backed product-site state, environment contract, and manual verification checklist, use:

- [Product Site README](/mnt/c/local/community-app/apps/product-site/README.md)

That README should now be treated as the working operational reference for:

- current implemented capability
- live environment contract
- local Stripe testing setup
- production setup checklist
- manual QA and end-to-end testing checklist

## 2) Locked Delivery Position

These decisions should be treated as fixed for Phase 5.

### 2.1 Stripe lives on the product site, not in `hub-platform`

All customer billing, subscription management, checkout, and webhook handling should be owned by the product site.

`hub-platform` must not become the billing application.

### 2.2 Stripe writes outcomes; it does not define the package model

Stripe should drive changes to:

- `packageTier`
- `packageStatus`
- `packageUpdatedAt`
- optional approved overrides where explicitly supported

The package entitlement model remains defined in code, not in Stripe product assumptions.

### 2.3 Webhooks must update canonical package authority through the formal mutation boundary

Stripe lifecycle events must not mutate hub records ad hoc.

Webhook processing should write package changes through the canonical package-authority update contract and mutation path established in Phase 1.

### 2.4 Route contracts from Phase 4 remain stable

Phase 5 should attach payment lifecycle behavior to the package and billing routes created in Phase 4.

It should not redesign those routes.

## 3) Phase 5 Scope

Phase 5 includes:

1. Stripe customer creation and mapping on the product site
2. package checkout initiation
3. subscription creation and lifecycle handling
4. webhook verification and event processing
5. package-authority update writes into the hub record
6. package cancellation, downgrade, and recovery-state handling
7. operational visibility for pending or failed commercial lifecycle changes
8. test coverage and recovery guidance for billing events

Phase 5 excludes:

- redesigning the package model
- moving entitlement resolution into Stripe
- moving operational custom-domain UI into the product site
- broad financial reporting beyond what is needed for package lifecycle correctness

## 4) Core Deliverables

At the end of Phase 5, the repo must provide:

### 4.1 Stripe-backed package checkout on the product site

The product site must be able to start package purchase or package-change flows through Stripe.

### 4.2 Canonical lifecycle update path into hub package authority

Successful Stripe lifecycle events must update the hub’s package authority through the formal contract and mutation layer.

### 4.3 Observable failure and recovery handling

Webhook failures, delayed updates, or inconsistent lifecycle states must be detectable and recoverable.

### 4.4 Stable commercial account experience

The Phase 4 package and billing routes must now become live lifecycle surfaces rather than placeholders.

## 5) Recommended Lifecycle Model

Phase 5 should lock the following payment and package lifecycle.

### 5.1 New purchase or upgrade flow

1. Customer starts from the product site package account area
2. Product site creates or resolves the Stripe customer
3. Product site initiates checkout or subscription change flow
4. Stripe processes the commercial event
5. Stripe webhook notifies the product site backend
6. Product site verifies the webhook
7. Product site translates the event into canonical package-authority updates
8. `hub-platform` reads the updated package authority and applies existing entitlement logic

### 5.2 Downgrade or cancellation flow

The downgrade path should preserve correct end-of-period or lifecycle semantics.

If downgrade effects are deferred, the resulting package status and operational consequences must be explicit and testable.

### 5.3 Failure and retry rule

Webhook and package-authority update failures must be:

- observable
- retryable
- recoverable without manual data patching as the only strategy

## 6) Recommended Code Touch Points

Phase 5 should primarily extend the product-site backend and consume the canonical `hub-platform` package-authority update path.

### 6.1 Product-site billing backend

Expected new or expanded areas inside `apps/product-site`:

- Stripe client/server integration modules
- checkout/session handlers
- billing route data loaders
- webhook endpoint handlers
- customer/subscription mapping persistence

### 6.2 Product-site account routes

Existing Phase 4 route destinations should now become live lifecycle surfaces:

- `/account/package`
- `/account/billing`
- `/account/upgrade`

Expected responsibilities:

- launch checkout
- show current billing/package state
- reflect pending, active, past-due, or cancelled status accurately

### 6.3 Canonical `hub-platform` package update boundary

Relevant Phase 1 touch points:

- package-authority update contract
- package-authority update mutation

Phase 5 should write through those entry points rather than bypassing them.

### 6.4 `hub-platform` read-model and admin/account visibility

Expected verification touch points:

- package status visibility
- usage and entitlement behavior after package changes
- account settings messaging when commercial lifecycle changes are pending or degraded

## 7) Execution Tracks

Phase 5 should be delivered in six tracks.

### Track A: Stripe product and customer integration

Outcome:
- the product site can create or resolve the commercial customer context cleanly

Primary outputs:

- customer mapping
- package product/price mapping
- billing integration configuration

### Track B: Checkout and subscription flows

Outcome:
- the customer can start package purchase or change flows from the product site

Primary outputs:

- checkout/session creation
- upgrade/change flow handling
- billing route activation

### Track C: Webhook verification and event processing

Outcome:
- Stripe events are verified, normalized, and translated into canonical package-authority updates

Primary outputs:

- webhook endpoint
- verified event handler
- event-to-authority mapping logic

### Track D: Package authority write-through

Outcome:
- Stripe outcomes update hub package state through the formal contract boundary

Primary outputs:

- package-authority update calls
- timestamp and status updates
- recovery-safe write semantics

### Track E: Commercial account UX completion

Outcome:
- package and billing pages become live lifecycle surfaces

Primary outputs:

- live package state display
- billing state display
- pending/action-required messaging

### Track F: Recovery and observability

Outcome:
- failures can be diagnosed and repaired safely

Primary outputs:

- event logging guidance
- retry/reconciliation strategy
- support/operator notes

## 8) Execution-Ready Backlog

This backlog is ordered so commercial correctness lands before UX polish.

### Slice 1: Define Stripe mapping and lifecycle vocabulary

Implementation tasks:

1. Define package-to-Stripe product/price mapping
2. Define the Stripe customer model for the product site
3. Define lifecycle event mapping into canonical package statuses
4. Ensure the mapping does not redefine package entitlement semantics

Review checklist:

- Stripe vocabulary is mapped onto the package model, not the other way around
- status transitions remain compatible with canonical package authority

### Slice 2: Implement checkout and subscription entry flows

Implementation tasks:

1. Add checkout/session creation for eligible package changes
2. Add subscription change flow entry points
3. Keep account/package/billing routes as the user-facing entry points
4. Surface truthful pending states while Stripe is processing

Review checklist:

- no payment logic lives in `hub-platform`
- commercial routes remain the single billing surface

### Slice 3: Implement webhook processing

Implementation tasks:

1. Add the Stripe webhook endpoint on the product site
2. Verify signatures
3. Normalize relevant lifecycle events
4. Translate events into canonical package-authority updates

Review checklist:

- event verification happens before processing
- only relevant lifecycle events can mutate package authority
- duplicate event handling is safe

### Slice 4: Write package-authority updates through the canonical contract

Implementation tasks:

1. Call the canonical package-authority update path from webhook processing
2. Update only package-related fields
3. Preserve audit and timestamp semantics
4. Keep unrelated hub state untouched

Review checklist:

- webhook processing does not bypass the formal mutation boundary
- write semantics are idempotent or safely repeatable

### Slice 5: Complete live billing/account UX

Implementation tasks:

1. Replace Phase 4 placeholders with live lifecycle messaging
2. Show current package and billing state clearly
3. Show action-required, past-due, or pending states where applicable
4. Keep downgrade and cancellation timing explicit

Review checklist:

- the commercial account surface feels real and understandable
- operational consequences are not hidden

### Slice 6: Add recovery and observability safeguards

Implementation tasks:

1. Define logging and event-correlation expectations
2. Define retry strategy for failed webhook-to-authority updates
3. Define support/operator recovery guidance
4. Add tests around delayed, repeated, or failed events

Review checklist:

- failures are diagnosable
- replay or retry does not corrupt package authority

## 9) File-By-File Touch Point Map

### Product-site additions

- `apps/product-site/src/app/(account)/*`
- `apps/product-site/src/app/api/*` for webhook handling
- `apps/product-site/src/lib/*` for Stripe integration, billing lifecycle, and package event mapping

### `hub-platform` contract touch points

- Phase 1 package-authority contract module
- Phase 1 package-authority update mutation
- any `hub-platform` read-model or account-visibility modules affected by package status changes

### Docs likely to update

- [product-site-and-commercial-platform-implementation-plan-2026-04-20.md](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-and-commercial-platform-implementation-plan-2026-04-20.md)
- [product-site-phase-4-execution-plan-2026-04-20.md](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-phase-4-execution-plan-2026-04-20.md)
- [product-site-package-authority-contract-2026-03-31.md](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-package-authority-contract-2026-03-31.md)

## 10) PR Sequencing Recommendation

### PR 1: Stripe integration foundation

Scope:

- product/price mapping
- customer model
- billing integration scaffolding

Success condition:

- the product site has a real billing integration foundation

### PR 2: Checkout and subscription entry flows

Scope:

- account/package/billing route activation
- checkout/session creation
- upgrade/change entry flows

Success condition:

- customers can start live package billing flows from the product site

### PR 3: Webhooks and package-authority updates

Scope:

- webhook endpoint
- verified event handling
- canonical package-authority write-through

Success condition:

- Stripe lifecycle events update hub package state correctly

### PR 4: Recovery, observability, and documentation

Scope:

- retry/reconciliation behavior
- support notes
- roadmap updates

Success condition:

- payment lifecycle failures are operationally manageable

## 11) Engineering Standards For This Phase

### 11.1 Keep Stripe as a commercial integration, not a domain model

The package model remains ours. Stripe is an event source layered on top of it.

### 11.2 Keep package-authority updates behind the canonical mutation boundary

Do not patch hub records directly from webhook code.

### 11.3 Keep route contracts stable

The customer-facing package and billing routes created in Phase 4 should remain the live surfaces for Phase 5.

### 11.4 Treat webhook processing as production infrastructure

Webhook handlers must be verified, idempotent-aware, observable, and recoverable.

### 11.5 Keep `hub-platform` operational

Do not add checkout, billing forms, or Stripe-specific lifecycle UI to the operational app.

## 12) Test Plan

Minimum required checks:

### Billing integration checks

- checkout/session creation works for valid package changes
- unsupported package changes fail cleanly

### Webhook checks

- signature verification is enforced
- relevant lifecycle events are accepted
- irrelevant or malformed events are rejected safely
- duplicate or repeated events do not corrupt state

### Package-authority update checks

- Stripe lifecycle outcomes write the correct package authority values
- `hub-platform` reflects updated package status correctly
- downgrade/cancellation timing semantics remain explicit and correct

### UX/source checks

- package and billing routes now reflect live lifecycle state
- `hub-platform` messaging remains consistent with the updated package status

## 13) Risk Register And Controls

### Risk: Stripe assumptions leak into entitlement logic

Control:

- keep package semantics in the canonical domain model
- map Stripe events onto package authority, not the reverse

### Risk: webhook failures leave the product in inconsistent state

Control:

- add verification, retries, and reconciliation guidance
- make failures observable and repairable

### Risk: direct record patching bypasses the mutation boundary

Control:

- require all package-authority writes to go through the formal contract and mutation layer

### Risk: billing routes need to be redesigned once Stripe arrives

Control:

- attach Stripe to the stable Phase 4 routes
- do not rebuild the information architecture during billing integration

## 14) Definition Of Done

Phase 5 is done when:

1. the product site can initiate live package billing flows
2. Stripe lifecycle events are verified and processed safely
3. hub package authority updates are written through the canonical contract
4. `hub-platform` reflects those commercial state changes correctly
5. recovery and retry expectations are documented
6. the billing and package account routes are now live lifecycle surfaces
7. lint and billing/webhook checks are clean

## 15) Recommended Immediate Coding Slice

When coding begins for Phase 5, the first implementation slice should be:

1. define the Stripe customer and product/price mapping
2. activate checkout/session creation from the product-site package routes
3. add the verified webhook endpoint
4. write Stripe lifecycle outcomes through the canonical package-authority update path
5. add duplicate-event and failure-path coverage

This is the highest-leverage first slice because it establishes the full commercial event loop from billing initiation to authoritative package-state update without collapsing the operational boundary.

## 16) Final Recommendation

Phase 5 should be treated as the commercial billing-lifecycle milestone.

If implemented well, it will ensure that:

- the product site becomes the real billing authority
- Stripe integrates on top of a stable app and contract foundation
- `hub-platform` continues to enforce entitlements without owning commercial complexity

That is the correct production architecture for this SaaS model.
