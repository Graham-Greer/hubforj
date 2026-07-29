# Client Site Starter Repo Plan

Status:
- Proposed
- Planning document for the reusable starter that will seed new client-site repos

Purpose:
- Define what the client-site starter repo must contain
- Define what the dev team customizes when spinning up a new client site
- Keep the public/member/admin experience reusable without giving clients page-building control

---

## 1) Starter purpose

The starter repo exists so new client sites do not begin from scratch.

The chosen delivery model is:
- maintain one starter
- copy it when a new client site is created
- customize the copied repo for that client

This is the intended early-stage approach for testing the market.

It should provide:
- a durable application foundation
- common route structure
- shared auth/session behavior
- shared design system and section library
- common admin/member functionality
- a clean base for client-specific public-site additions

The starter is not a template marketplace.
It is the base product frontend for one client hub.

---

## 2) What the starter must include

### 2.1 Base routes

The starter should include:
- home
- about
- events list/detail
- courses list/detail
- articles list/detail
- contact
- privacy policy
- terms
- sign-in
- join
- account routes
- admin routes

### 2.2 Public foundations

The starter should include:
- public shell
- public navigation
- shared public layout primitives
- production-grade public section library
- dynamic sections for events, courses, testimonials, and articles

### 2.3 Member foundations

The starter should include:
- member sign-in
- member account shell
- membership, registrations, courses, payments visibility, profile

### 2.4 Admin foundations

The starter should include:
- hub admin shell
- members
- events
- courses
- testimonials
- payments
- plans/memberships
- registrations
- attendance

The starter should exclude site-building settings that no longer belong in hub admin.

---

## 3) What gets customized per client

When creating a new client site from the starter, the dev team should customize:
- domain and deployment config
- fixed hub identity config
- branding and theme implementation
- page composition for the base public routes
- any additional client-specific public routes
- any client-specific section selections and page content

This is the right place for:
- bespoke landing pages
- campaign pages
- program pages
- extra informational routes

This is not done by the admin user.

---

## 4) What should stay identical across clients where possible

To keep the product maintainable, the following should remain as shared as possible:
- auth/session foundations
- Firebase integration patterns
- domain models
- operational admin flows
- member-account flows
- design-system primitives
- section library contracts

The goal is bespoke public-site delivery, not bespoke business logic for every client.

This consistency should come from the starter and disciplined copying, not from shared private packages in the first phase.

---

## 5) Recommended starter structure

The exact layout can evolve, but the starter should likely contain:

- `src/app`
- `src/components`
- `src/lib`
- `src/hooks`
- `tests`
- shared route families for:
  - public
  - member
  - admin

The route model should be single-hub, not `[hubSlug]`-driven.

---

## 6) Fixed hub configuration

Each client-site repo should be configured to operate on one hub.

This should likely be supplied through environment/config boundaries such as:
- `HUB_ID`
- `HUB_SLUG`
- client domain
- site display defaults where needed

This configuration should be enough to let the app:
- resolve the hub server-side
- query only that hub's data
- stamp writes with the correct hub identity

---

## 7) Public-page build workflow

The workflow for a new client site should be:

1. copy the starter repo into a new client repo
2. configure the hub identity and environment
3. apply the client's brand and theme direction
4. decide which base routes need custom composition
5. compose those routes from the section library
6. add any extra public routes required
7. connect dynamic sections to the hub's events/courses/testimonials/articles
8. verify admin/member/public flows on the client domain

This should be the core delivery workflow for new clients.

---

## 8) What the starter should not include

The starter should not include:
- a client-facing page builder
- a hub-admin page composition tool
- generic CMS block modeling
- platform superadmin workflows
- support-mode assumptions tied to the current shared-host app

Those would add unnecessary complexity to the client-site repo.

---

## 9) Quality bar

The starter is ready when:
- a new client site can be stood up quickly
- the base routes are already production-grade
- the public section library is strong enough to build bespoke pages efficiently
- member/admin flows work cleanly on the client domain
- no client site has to invent operational workflows from scratch

Operational note:
- manual or semi-manual starter copying is acceptable in this first phase
- stronger multi-repo sync/package strategies can be considered later only if market validation justifies the added engineering overhead
