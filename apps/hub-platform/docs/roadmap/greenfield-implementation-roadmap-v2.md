# Greenfield Implementation Roadmap v2

Status:
- Proposed
- Execution order for a fresh rebuild aligned to the simplified product scope, hub terminology, and production-grade v1 quality standard

Purpose:
- Provide the order of implementation for the new app so the rebuild does not repeat the current repo's drift.

---

## 0) Preconditions

Before coding the new app:
- freeze current repo as reference only
- approve:
  - `docs/roadmap/greenfield-product-scope-v2.md`
  - `docs/roadmap/greenfield-architecture-decision-record-v2.md`
  - this roadmap
- decide target app path:
  - preferred: `apps/hub-platform/`

Required outcome:
- no implementation begins until product scope and architecture are accepted

Quality requirement:
- the rebuild is treated as a durable product foundation
- no phase may use “minimal scope” as justification for weak UX, weak abstractions, or short-lived architecture

Platform operating model:
- one shared Firebase project
- hub-scoped multi-tenancy
- flexible frontend deployment on top of a shared backend

---

## 1) New App Bootstrap

Create the new application boundary and baseline structure.

Deliverables:
- new app folder
- Next.js app-router project shell
- baseline lint/test/tooling
- standards-aligned source folders
- route-group shells

Recommended structure:
- `apps/hub-platform/src/app`
- `apps/hub-platform/src/components`
- `apps/hub-platform/src/lib`
- `apps/hub-platform/src/hooks`
- `apps/hub-platform/tests`

Acceptance:
- app boots
- route groups exist
- no business logic yet

---

## 2) Design System Foundation

Build only the foundations needed for long-term reuse.

Deliverables:
- tokens/globals
- primitives
- UI kernel
- form controls
- modal/confirm states
- table/list states
- skeleton/loading states
- navigation primitives
- page-header and workspace-composition primitives
- section/layout primitives suitable for long-term public-site composition

Acceptance:
- no route-level ad-hoc styling
- token-only styling discipline in place
- reusable-first rules enforced from the start
- foundations are visually and structurally strong enough that they do not need immediate redesign once feature work starts

---

## 3) Auth, Session, and Route Authority

Implement the security and route backbone before feature surfaces.

Deliverables:
- auth/session contract
- tenant-isolation contract for shared backend access
- role-based route gating
- server-first protected route model
- canonical route map for:
  - public
  - member
  - admin
  - superadmin

Acceptance:
- deterministic protected-route behavior
- no client-first protection assumptions
- route authority documented and tested

---

## 4) Shell Architecture

Build the main shells before domain features.

### 4.1 Superadmin shell
- sidebar
- topbar
- account actions
- hub context
- modern navigation hierarchy
- clear visual focus and low cognitive load

### 4.2 Community admin shell
- admin navigation
- workflow-oriented IA
- single-focus page framing
- clear hierarchy between lists, details, and actions

### 4.3 Public/member shell
- branded public layout
- member account surface
- polished reusable site composition structure

Acceptance:
- shells are distinct by product surface
- route files remain thin
- navigation feels modern, clear, and easy to follow

---

## 5) Community Provisioning

Build the platform owner workflow for standing up a new hub.

Deliverables:
- hubs list
- create hub
- invite admin
- support/access flow if still required
- theme/domain/settings baseline

Acceptance:
- a hub can be provisioned end-to-end
- an admin can be invited and onboarded

---

## 6) Core Domain Models

Implement domain contracts before full CRUD UIs.

Required models:
- users
- roles
- memberships
- events
- courses
- registrations/bookings
- payments
- attendance
- testimonials
- site settings

Acceptance:
- validation and normalization rules are explicit
- state machines are wired below the UI layer

---

## 7) Admin Operations: Members and Roles

Deliverables:
- admins list and invite management
- members list/detail
- role assignment where approved
- status visibility and relevant actions

Acceptance:
- admins can manage hub people clearly
- shell/navigation supports these workflows cleanly

---

## 8) Admin Operations: Events

Deliverables:
- event list
- create/edit event
- publish/cancel lifecycle
- registrations view
- payment tracking
- attendance tracking

Acceptance:
- event operations work end-to-end
- operational state transitions are enforced

---

## 9) Admin Operations: Courses

Deliverables:
- course list
- create/edit course
- bookings/registrations
- payment visibility
- attendance/session handling if included in the approved product scope

Acceptance:
- course workflows are parallel to event workflows where appropriate

---

## 10) Admin Operations: Testimonials and Structured Content

Deliverables:
- testimonial CRUD
- publish/archive state
- featured testimonial selection
- structured site settings/editor surfaces

Structured settings include:
- branding
- navigation
- footer
- contact info
- featured content selections

Acceptance:
- public site content can be changed through structured forms
- no generic CMS required
- structured editors remain calm, clear, and easy to navigate

---

## 11) Supporting Capability: Media

Media should be implemented only to support structured content and operational records.

Deliverables:
- upload/select flow
- alt text editing
- reuse where needed
- limited organizational support if justified

Non-goals:
- general-purpose CMS-style media authoring
- media features not tied to hub operations, structured content, or safe asset reuse

Acceptance:
- admins can manage hub-scoped assets in a dedicated media workspace
- admins can attach media where operationally required
- image delivery is reliable and simple

---

## 12) Public Site Delivery

Build the public site using developer-owned routes and structured data/config.

Deliverables:
- homepage
- events routes
- courses routes
- testimonials integration
- contact/about pages as defined
- branded header/footer
- reusable section and layout patterns that are flexible enough for future pages without rethinking the foundation

Acceptance:
- new hubs can receive a polished public site from shared components
- route-level site composition stays intentional and clean
- the section/component library is good enough that future pages can be built efficiently without lowering design quality

---

## 13) Member Experience

Deliverables:
- sign-in/account flow
- membership visibility
- booking history / registration views
- relevant payment/attendance visibility

Acceptance:
- members can understand and manage their relationship with the hub

---

## 14) Theme and Branding Configuration

Deliverables:
- per-hub token overrides
- template/theme variants
- predictable branding application

Acceptance:
- the same base product can be branded efficiently for different hubs

---

## 15) Cutover and Legacy Retirement

Once parity is reached for the approved product scope:
- freeze old implementation
- migrate only required data/contracts
- remove obsolete CMS-heavy assumptions from active roadmap docs

Acceptance:
- new app is authoritative
- old project can be retired safely

---

## 16) Delivery Rules for the Rebuild

During implementation:
- no generic CMS scope may be reintroduced without explicit approval
- route sprawl is prohibited
- route files must remain composition shells
- no monolith hooks/components
- no token bypasses in styling
- no salvage-by-copy without review
- navigation and workflow clarity are first-class acceptance criteria
- reusable components and sections must be evaluated for long-term developer usefulness, not just immediate task completion

---

## 17) Recommended Immediate Next Steps

1. Approve these three greenfield docs
2. Decide new app folder name
3. Produce a canonical route map for v2
4. Produce a canonical data model v2
5. Begin bootstrap of the new app boundary
