# Roadmap Docs

These roadmap documents are the canonical greenfield planning set for `apps/hub-platform`.

They were originally drafted while the new app was being defined outside the app boundary. They are now copied into this docs tree so the new app owns its own product, route, data, and shell direction.

## Important interpretation rule

Some roadmap documents still reference legacy product docs in their provenance or authority sections.

Those references should be read as historical input only.

For implementation authority inside `apps/hub-platform`, use this precedence:

1. `docs/standards/*`
2. `docs/component-registry.md`
3. `docs/component-build-order.md`
4. `docs/roadmap/*`
5. current app code

## Roadmap set

- `greenfield-product-scope-v2.md`
- `greenfield-architecture-decision-record-v2.md`
- `greenfield-implementation-roadmap-v2.md`
- `greenfield-route-map-v2.md`
- `greenfield-data-model-v2.md`
- `greenfield-shell-navigation-spec-v2.md`

## Current-state note

Some older roadmap documents are point-in-time planning snapshots rather than current implementation truth.

Treat these carefully:

- `current-delivery-status-and-next-steps-2026-03-09.md`
  - historical status snapshot
  - useful for understanding earlier sequencing
  - no longer authoritative for immediate next steps

For current next-step sequencing, read:

- `product-site-and-commercial-platform-implementation-plan-2026-04-20.md`

That document reflects the current repo audit and should be treated as the canonical next-step plan unless a newer document explicitly supersedes it.

For the newer repo-audited correction to older product-site assumptions and the current post-implementation next-step focus, read:

- `product-site-current-state-audit-and-next-steps-2026-05-01.md`

That document is the current-state authority for what `apps/product-site` already delivers and should be used whenever older April planning documents still describe the product site as largely unimplemented.

For the immediate implementation breakdown of Phase 1, read:

- `product-site-phase-1-execution-plan-2026-04-20.md`

That document is the execution authority for the current upstream-contract hardening milestone.

For the standalone product-site app boundary and route-foundation work, read:

- `product-site-phase-2-execution-plan-2026-04-20.md`

That document is the execution authority for the product-site foundation phase.

For the commercial-signup to operational-provisioning bridge, read:

- `product-site-phase-3-execution-plan-2026-04-20.md`

That document is the execution authority for package-aware provisioning from the product site into `hub-platform`.

For the commercial package-management surface and cross-app handoff completion, read:

- `product-site-phase-4-execution-plan-2026-04-20.md`

That document is the execution authority for the package-management phase before Stripe lifecycle work begins.

For the immediate next-step commercial identity and returning-customer auth work on the product site, read:

- `product-site-commercial-account-auth-plan-2026-04-21.md`

That document is the execution authority for turning the current signup-seeded account shell into a real commercial-account system before Stripe is attached.

For the production-grade onboarding, verification, initial-admin provisioning, and secure cross-app activation flow, read:

- `product-site-production-onboarding-and-admin-handoff-plan-2026-04-21.md`

That document is the execution authority for completing the trust and operational-owner bridge between product-site signup and `hub-platform` admin usage.

For the live Stripe billing lifecycle and canonical package-authority write-through, read:

- `product-site-phase-5-execution-plan-2026-04-20.md`

That document is the execution authority for the product-site billing-lifecycle phase.

For release hardening, recovery, downgrade/domain verification, and launch readiness, read:

- `product-site-phase-6-execution-plan-2026-04-20.md`

That document is the execution authority for the production-readiness phase.

For the concrete production-domain cutover from placeholder hosted hub domains to the real Hubforj domain model, read:

- `hubforj-domain-alignment-and-host-resolution-plan-2026-04-29.md`

That document is the execution authority for syncing `hubforj.com` and `{tenantSlug}.hubforj.com` across `product-site` and `hub-platform`.

For the final verification, rollout, and production-only checks needed to close the domain-alignment track, read:

- `hubforj-domain-cutover-checklist-2026-04-29.md`

That checklist is the close-out artifact for separating local/staging verification from production-required cutover work.

For the distinction between SaaS billing Stripe and community native-payments Stripe responsibilities, read:

- `stripe-two-domain-architecture-note-2026-04-20.md`

That note is the architecture reference for keeping commercial billing and community payment processing separate.

For the first production-grade Stripe implementation slice inside `hub-platform`, read:

- `hub-platform-stripe-native-payments-phase-1-plan-2026-04-29.md`

That document is the execution authority for starting Growth native payments with a narrow, webhook-safe first slice instead of a broad undifferentiated Stripe rollout.

For the implemented local-state summary, hardening outcome, and deferred production work for that first Stripe slice, read:

- `hub-platform-stripe-native-payments-phase-1-closeout-2026-04-29.md`

That document is the current-state authority for what Phase 1 actually delivered and what remains deferred.

For the next native-payments implementation slice after membership upgrades, read:

- `hub-platform-stripe-native-payments-phase-2-events-plan-2026-04-29.md`

That document is the execution authority for Growth-only native event payments, including the locked refund and cancellation direction.

For the implemented local-state summary, hardening outcome, and deferred production work for native event payments, read:

- `hub-platform-stripe-native-payments-phase-2-events-closeout-2026-04-30.md`

That document is the current-state authority for what the native event payment slice actually delivered and what remains deferred.

For the next native-payments implementation slice after events, read:

- `hub-platform-stripe-native-payments-phase-3-courses-plan-2026-04-30.md`

That document is the execution authority for Growth-only native course payments.

For the implemented local-state summary, hardening outcome, and deferred production work for native course payments, read:

- `hub-platform-stripe-native-payments-phase-3-courses-closeout-2026-04-30.md`

That document is the current-state authority for what the native course payment slice actually delivered and what remains deferred.

For the current support/operator triage process and finance visibility boundaries around native payments, read:

- `hub-platform-native-payments-support-and-finance-runbook-2026-05-01.md`

That document is the current-state authority for how payment issues should be triaged today using the shipped admin, support-mode, and payment-detail surfaces.

For staging/production verification, release gating, and rollout checks across membership, event, and course native payments, read:

- `hub-platform-native-payments-rollout-and-verification-runbook-2026-05-01.md`

That document is the current rollout authority for native-payments readiness beyond local implementation.

For the target production-grade finance architecture, canonical payment ledger direction, and package-transition-safe reporting model, read:

- `hub-platform-payment-ledger-and-cross-tier-reporting-plan-2026-05-03.md`

That document is the architecture authority for evolving `hub-platform` from the current workable payment model into a production-grade source of truth across Starter, Growth, native Stripe, and external/manual payment eras.

For the concrete engineering rollout sequence, schema contract, write-path ownership, backfill order, and route-by-route migration plan for that ledger, read:

- `hub-platform-payment-ledger-implementation-phase-plan-2026-05-03.md`

That document is the implementation authority for introducing `paymentRecords` incrementally without destabilizing current native-payment flows.
