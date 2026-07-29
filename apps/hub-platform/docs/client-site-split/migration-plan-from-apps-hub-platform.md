# Migration Plan From `apps/hub-platform`

Status:
- Proposed
- Planning document for moving from the current single-app architecture to the split client-site model

Purpose:
- Define a realistic migration path from the current repo state
- Avoid trying to change architecture and feature delivery in one uncontrolled move

---

## 1) Migration principle

This should be treated as an extraction and refoundation exercise, not as a cosmetic route refactor.

The current app contains:
- useful domain/data logic
- useful design-system foundations
- useful public/member/admin workflows
- incorrect long-term route and deployment assumptions for the new product direction

So the correct approach is:
- salvage intentionally
- rewrite boundaries where needed
- do not blindly copy the current app structure into the client-site starter

---

## 2) Phase 1: Architecture and scope freeze

Before implementation:
- approve the split architecture
- approve the client-site starter route model
- approve reduced hub-admin scope
- accept that current shared-host assumptions are now transitional

Acceptance:
- no ambiguity remains about client domains, admin/member placement, or repo separation

---

## 3) Phase 2: Extraction audit

Audit the current app into four buckets:

### Reuse mostly as-is
- domain modules
- repository/data modules where hub-scoped and not route-coupled
- design-system primitives
- reusable UI controls

### Reuse with adaptation
- public page patterns
- member account patterns
- admin operational workspaces
- auth/session helpers

### Rewrite for the starter
- route tree
- hub resolution boundary
- client-domain session/cookie assumptions
- navigation linking

### Leave behind in the current app
- shared-host route assumptions
- platform/superadmin-specific flows
- support-mode assumptions tied to the current single app
- public-site settings UI that no longer belongs in hub admin

Acceptance:
- every major area is classified before extraction begins

---

## 4) Phase 3: Create the client-site starter

Stand up the starter repo with:
- app structure
- route groups for public/member/admin
- fixed-hub resolution config
- Firebase/config boundary
- baseline auth/session implementation
- shared design-system foundation

Acceptance:
- starter boots for one hub
- no client-specific customization yet
- the starter is explicitly designed to be copied into a new client repo without extra shared-package infrastructure

---

## 5) Phase 4: Rebuild core routes on the starter boundary

Implement first:
- home
- about
- events list/detail
- courses list/detail
- sign-in
- join
- account shell and core routes
- admin shell and core routes

Acceptance:
- the starter supports the core client-domain experience

---

## 6) Phase 5: Reduce admin scope

As admin routes are brought across:
- keep operational routes
- exclude public-site configuration routes
- remove branding/navigation/site-editing concerns from the starter admin IA

Acceptance:
- admin clearly reads as an operations workspace

---

## 7) Phase 6: Add articles and legal routes

Implement:
- articles list/detail
- privacy policy
- terms
- contact

Acceptance:
- baseline public route inventory is complete for the starter

---

## 8) Phase 7: Build first client from the starter

For the first real client:
- configure the fixed hub identity
- apply branding/theme
- customize the base public routes as needed
- add any extra client-specific public pages

Acceptance:
- one client site is fully live on its own domain
- member and admin routes also work on that domain

---

## 9) Phase 8: Validate the operating model

Validate:
- one Firebase project still works cleanly
- hub isolation remains strict
- member/admin auth works on client domain
- client-specific route customization is practical
- the starter is genuinely reusable for the next client

Acceptance:
- the model proves itself with one real client before broader rollout

---

## 10) Risks to manage

### 10.1 Drift across client repos

Risk:
- separate repos diverge too quickly

Mitigation:
- keep the starter strong
- keep shared patterns and standards explicit
- avoid unnecessary bespoke operational logic per client
- accept bounded divergence as a deliberate early-stage tradeoff of the starter-copy model

### 10.2 Over-copying current assumptions

Risk:
- the starter inherits too much `[hubSlug]` and shared-host structure

Mitigation:
- treat route/auth boundaries as rewrite zones

### 10.3 Support-mode complexity

Risk:
- support-mode becomes a blocker

Mitigation:
- do not make it phase-one critical
- treat platform/support access as a later cross-domain design problem

### 10.4 Admin scope creep

Risk:
- public-site settings creep back into hub admin

Mitigation:
- hold the line on admin as community operations only

---

## 11) Success criteria

This migration is successful when:
- a client site can run fully on its own domain
- admin and member flows also run on that domain
- the current operational features remain available
- public-site customization can happen during client-site creation from the starter
- hub admins do not become site builders
- one shared Firebase backend still serves all hubs safely
