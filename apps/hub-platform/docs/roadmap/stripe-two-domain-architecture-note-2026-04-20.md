# Stripe Two-Domain Architecture Note

Status:
- Proposed
- Clarifying architecture note

Date:
- 2026-04-20

Purpose:
- Explicitly distinguish the two separate Stripe-related payment domains in the SaaS product
- Prevent package-billing architecture from being conflated with community-native payment processing
- Give implementation work a clear reference before coding begins

Authority:
- [Product Site And Commercial Platform Implementation Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-and-commercial-platform-implementation-plan-2026-04-20.md)
- [Product Site Phase 5 Execution Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-phase-5-execution-plan-2026-04-20.md)
- [Roadmap Docs README](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/README.md)

Related:
- [SaaS Package Tier And Entitlement Model](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/saas-package-tier-and-entitlement-model-2026-03-29.md)
- [Product-Site Package Authority Contract](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-package-authority-contract-2026-03-31.md)

## 1) Executive Position

The product should be designed around two distinct Stripe-related payment domains.

They are both payment concerns, but they do not serve the same payer, the same transaction model, or the same product boundary.

They must not be collapsed into one vague “Stripe integration.”

## 2) Domain A: Product-Site SaaS Billing

This is the commercial platform billing layer.

It belongs to the standalone product site.

Its responsibility is to charge the community owner for access to the SaaS product.

### Responsibilities

- customer acquisition
- package purchase
- package upgrades and downgrades
- SaaS subscription lifecycle
- billing state for the community owner
- writing package-authority outcomes back into the hub record

### Questions this layer answers

- Is this hub on `free`, `starter`, or `growth`?
- Is the community owner’s SaaS subscription active, trialing, past due, or cancelled?
- Should this hub have the entitlements unlocked by its package?

### System boundary

- owned by the product site
- must not be implemented inside `hub-platform`

## 3) Domain B: Community Native Payments

This is the community-operations payment layer.

It belongs to `hub-platform`.

Its responsibility is to let a Growth-plan community collect money from its own members.

### Responsibilities

- member-facing payment setup for eligible hubs
- payment collection for memberships
- payment collection for event registrations
- payment collection for course enrolments
- operational payment-state visibility for community transactions

### Questions this layer answers

- Can this hub take built-in payments from its own members?
- Can this membership, event, or course use native payments?
- What is the payment state of this member-facing transaction?

### System boundary

- owned by `hub-platform`
- gated by the Growth package
- separate from SaaS billing responsibility

## 4) Why These Domains Must Stay Separate

If these domains are blurred together, the product will quickly become confusing in both architecture and support operations.

### Different payer

- Domain A charges the community owner
- Domain B charges the community’s members

### Different transaction model

- Domain A is SaaS subscription/package billing
- Domain B is community commerce and operational payment collection

### Different app boundary

- Domain A belongs to the product site
- Domain B belongs to `hub-platform`

### Different source-of-truth question

- Domain A determines package authority
- Domain B depends on package authority to know whether native payments are available

## 5) Dependency Direction

The correct dependency direction is:

1. product-site SaaS billing determines package authority
2. package authority unlocks or locks native-payment capability
3. `hub-platform` then allows or denies member-facing native payment flows based on that authority

This means:

- SaaS billing does not depend on community transaction state
- community native payments do depend on SaaS package entitlement

## 6) Practical Implementation Rule

When implementation work references “Stripe,” it should be explicit about which domain is being discussed.

### Acceptable wording

- “product-site Stripe billing”
- “SaaS billing Stripe integration”
- “community native-payments Stripe setup”
- “Growth native payments”

### Wording to avoid

- “the Stripe integration”
- “Stripe setup” without domain context
- “billing” when the meaning could be either SaaS subscription billing or member transaction billing

## 7) Phase Alignment

For the current roadmap:

- Phases 1 to 6 in the product-site/commercial-platform plan are about Domain A first
- they establish SaaS billing authority, package management, and Stripe-backed package lifecycle

Domain B should be planned and delivered separately afterward or in a clearly separate workstream.

That later work should treat native payments as:

- a Growth entitlement consumer
- an operational payment domain inside `hub-platform`
- not an extension of the product-site SaaS billing implementation

## 8) Final Recommendation

The product should explicitly preserve two payment domains:

1. product-site SaaS billing for charging community owners
2. `hub-platform` native payments for enabling Growth-plan communities to charge members

That distinction should be treated as an architectural rule, not just a wording preference.
