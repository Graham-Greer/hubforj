# Client Site Split Planning Docs

Status:
- Proposed planning set for splitting the current single-app model into:
  - a separate client-site starter architecture
  - a separate platform/superadmin architecture
- Intended to replace the shared-host assumption for future client-facing delivery

Authority:
- Must be read together with:
  - `docs/standards/source-of-truth.md`
  - `docs/standards/design-system-and-theming.md`
  - `docs/standards/firebase-data-auth-and-security.md`
  - `docs/roadmap/greenfield-product-scope-v2.md`
  - `docs/roadmap/current-delivery-status-and-next-steps-2026-03-09.md`
- This folder represents a planning pivot away from the current shared-host route model in `apps/hub-platform`.

Purpose:
- Define the architecture for a separate client-site repo per client/domain
- Keep one shared Firebase project across all hubs
- Move public, member, and hub-admin surfaces onto the client domain
- Reduce hub-admin scope so it focuses on community operations rather than site composition or branding setup
- Define the starter-app model for building new client sites from a shared foundation
- Lock the initial sharing strategy to a starter-copy workflow rather than shared private packages

Interpretation rule:
- These docs describe the target direction if the product commits to:
  - client-owned domains
  - separate client-site repos
  - separate platform app
- They should not be mixed casually with the current single-app assumptions.

---

## Recommended reading order

1. `client-site-split-architecture.md`
2. `client-site-starter-repo-plan.md`
3. `client-site-route-and-auth-plan.md`
4. `hub-admin-scope-after-split.md`
5. `migration-plan-from-apps-hub-platform.md`

---

## Core product decision

The client-facing experience must live on the client's domain.

That means:
- public site lives on the client domain
- member sign-in and account live on the client domain
- hub admin lives on the client domain
- the separate platform/superadmin experience can remain elsewhere

The client site is therefore not just a public marketing layer.
It is the full client-facing product surface for that hub.

---

## What this planning set optimizes for

- client-domain ownership
- clearer white-label positioning
- better flexibility for bespoke client pages
- separation between product operations and client-facing delivery
- reuse of one shared backend with strict hub isolation
- ability to build new client sites from a starter without giving admins page-building authority
- the lowest-complexity early-stage delivery model: one strong starter repo copied into client repos

---

## What this planning set does not permit

- hub admins creating arbitrary routes
- hub admins composing public pages
- generic tenant-facing CMS/page-builder complexity
- assuming the current `[hubSlug]` route model can simply be stretched into this future state

This is a separate architecture, not a small extension of the current app.
