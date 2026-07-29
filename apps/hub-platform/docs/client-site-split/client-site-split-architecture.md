# Client Site Split Architecture

Status:
- Proposed
- Architecture decision and delivery model for separating the client-facing site from the current shared-host app

Purpose:
- Define the target operating model where each client has its own site repo and own domain
- Keep one shared Firebase project across all hubs
- Separate client-facing delivery from the future platform/superadmin app

---

## 1) Product decision

The product should move to a split frontend architecture:

- one client-site repo per client
- one separate platform app for superadmin/product operations
- one shared Firebase project across all hubs

The client-site repo should own:
- public site
- member sign-in and account
- hub-admin routes

The platform app should eventually own:
- hub provisioning
- internal support access
- superadmin workflows
- package/commercial/internal operations as approved later

For the immediate next phase, platform is not the priority.
The priority is the client-site app model.

---

## 2) Why this architecture is being chosen

The current single-app model is not aligned with the desired client experience.

The client requirement is:
- client domain is the real site
- admins and members should use that domain
- client-specific public routes and pages must be possible

The current shared-host model does not satisfy that cleanly because it assumes:
- slug-based hub routing
- admin under the shared product host
- one shared public route map for all hubs

The split model is preferred because it provides:
- clean domain ownership
- better white-label positioning
- flexibility to build client-specific pages
- the ability to start from a reusable starter while still allowing bespoke additions

---

## 3) Target topology

### 3.1 Backend

One shared Firebase project remains the backend for:
- all client hubs
- all client-site repos
- the future platform app

This remains the correct backend decision.

### 3.2 Frontend

The target frontend topology is:

- separate platform app/repo
- separate client-site starter repo
- separate instantiated client-site repo per client

Each client-site repo is deployed to its own domain.

Examples:
- `https://client-one.org`
- `https://client-two.org`
- `https://our-product.com/platform`

### 3.3 Hub resolution

A client-site repo should not depend on `[hubSlug]` in the route path.

Instead, the repo should resolve one fixed hub through configuration such as:
- `HUB_ID`
- `HUB_SLUG`
- environment-level site identity values where needed

The client-site repo is therefore a single-hub frontend.

---

## 4) Surface ownership after the split

### 4.1 Client-site repo

Owns:
- home
- about
- events list/detail
- courses list/detail
- articles list/detail
- contact
- privacy policy
- terms
- sign in
- join
- member account
- hub admin

### 4.2 Platform app

Owns later:
- superadmin sign-in
- hub creation/provisioning
- internal support access
- internal commercial/package operations

---

## 5) Admin scope after the split

The client-site admin should focus on community operations only.

It should keep and continue to deepen:
- events
- courses
- testimonials
- memberships and plans
- registrations
- attendance
- people/member operations
- payments/payment visibility

It should not own:
- public-site page composition
- site templates
- header/footer authoring
- branding setup
- route creation
- public-site section composition

Those are handled when the client site is created from the starter and extended by the product/dev team.

---

## 6) Public-site build model

Each new client site should be built from a shared starter repo.

The starter provides:
- base route structure
- shared design-system foundations
- shared public/member/admin shells
- shared reusable section/component library
- shared auth/session integration
- shared Firebase integration

The dev team then:
- configures the client's hub identity
- applies branding/theme decisions
- builds any client-specific routes required
- composes those routes from the shared section library

This gives bespoke delivery without giving clients CMS-style control.

---

## 7) Shared backend rules

One shared Firebase backend remains viable only if:
- every hub-owned record stores `hubId`
- all queries remain hub-scoped
- auth/session checks remain explicit
- client-site repos never infer authority from frontend route shape alone

This remains consistent with the current app standards.

---

## 8) Shared code strategy

The initial sharing strategy is `starter-copy model only`.

That means:
- one strong client-site starter repo is maintained by the product/dev team
- each new client repo is created by copying from that starter
- client repos may diverge where needed for market testing and bespoke delivery
- no shared private package infrastructure is required in the first phase

Even with separate repos, the product must still treat some capabilities as shared foundations inside the starter itself.

The client-site starter should carry:
- shared domain logic
- shared Firebase access patterns
- shared auth/session helpers
- shared primitives/UI/patterns
- shared public section library
- shared admin/member workspace foundations

The goal is:
- reuse by starter/template lineage
- controlled divergence only where a client truly needs custom pages or bespoke presentation

This is not a repo-per-client free-for-all, but it is deliberately a copy-first model rather than a package-driven multi-repo system.

---

## 9) Route model after the split

The client site should use clean client-domain routes:

- `/`
- `/about`
- `/events`
- `/events/[eventSlug]`
- `/courses`
- `/courses/[courseSlug]`
- `/articles`
- `/articles/[articleSlug]`
- `/contact`
- `/privacy-policy`
- `/terms`
- `/join`
- `/sign-in`
- `/account/*`
- `/admin/*`

No hub slug is required in these URLs because the repo is single-hub.

---

## 10) Auth model after the split

The client-site repo must support:
- member auth on client domain
- admin auth on client domain
- session-backed server-first route protection

This replaces the current assumption that hub-admin lives on the shared product host.

Support-mode and superadmin cross-domain access should be treated as a later planning problem, not a blocker for the client-site split.

---

## 11) Consequences

Positive consequences:
- cleaner client-facing UX
- own-domain admin/member/public experience
- more flexibility for client-specific routes
- stronger white-label story

Negative consequences:
- separate repo and deployment per client
- more release/upgrade management across clients
- more planning required for long-term shared code maintenance
- current `apps/hub-platform` route assumptions become transitional

---

## 12) Immediate planning implication

The current `docs/public-site/*` plan assumed a single shared app.
That is no longer sufficient on its own.

The immediate planning focus should now be:
- client-site starter repo
- route/auth model for one-hub client sites
- reduced hub-admin scope
- migration/extraction from the current app

The future platform app can be planned in parallel, but it is not the first implementation priority.
