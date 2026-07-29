# Greenfield Architecture Decision Record v2

Status:
- Proposed
- To govern a fresh implementation in a new subfolder/app

Purpose:
- Define the architectural decisions that prevent repetition of the current repo's drift.

---

## ADR-001: Rebuild in a new app boundary

Decision:
- Build the next implementation in a new subfolder/app instead of continuing from the current project as the production foundation.

Reason:
- current implementation shows architectural drift
- CMS complexity has distorted the product shape
- route/component boundaries are not consistently trustworthy
- a clean boundary is lower risk than continued patching

Consequence:
- current repo becomes reference material, not the primary implementation base
- code must be selectively salvaged, not wholesale copied

---

## ADR-001A: One shared Firebase project with hub-scoped multi-tenancy

Decision:
- The greenfield product will use one shared Firebase project for all hubs.

Reason:
- the product goal is multiple hubs on one evolving platform
- rolling out schema/rules/index/feature changes across many separate Firebase projects would create operational drag
- a true platform layer is only coherent if the backend is shared

Consequence:
- all data access and authorization must be rigorously scoped by `hubId`
- rules and repository boundaries must be designed for strict tenant isolation
- backend feature rollout remains centralized

---

## ADR-001B: Deployment topology remains flexible

Decision:
- The frontend deployment model may be shared or split by surface, but it will sit on top of one shared backend.

Reason:
- deployment flexibility is valuable
- backend fragmentation is not

Consequence:
- the product can support:
  - one shared deployment
  - or separate deployed site instances
  - while keeping one Firebase backend
- platform/admin deployment should remain shared unless a strong reason emerges later

---

## ADR-002: Product is operations-first, not CMS-first

Decision:
- The new app will center on hub operations and branded site delivery, not a general-purpose page-builder CMS.

Reason:
- this matches the actual business need
- it reduces complexity dramatically
- it concentrates engineering effort on commercially relevant workflows

Consequence:
- no generic page-builder in the initial product foundation
- no drag-and-drop page composition system in the initial product foundation
- structured site config replaces arbitrary content composition

---

## ADR-002A: Production-grade v1, not MVP shortcuts

Decision:
- The rebuild will be treated as a production-grade v1 foundation, not a limited-thinking minimal implementation.

Reason:
- minimal-first framing often encourages weak abstractions and compromised UX
- the product needs to be simple for users without being simplistic in architecture
- rebuilding core decisions later is more expensive than designing them correctly now

Consequence:
- core architecture must be designed for longevity
- quality of navigation, shells, reusable components, and workflows is a first-order requirement
- “we can fix it later” is not an acceptable reason for weak foundational decisions

---

## ADR-003: Developer-owned site composition

Decision:
- Public pages are route/code composed by the product team using shared sections and tokens.

Reason:
- consistent quality
- faster, safer delivery for early-stage product
- lower runtime/editor complexity

Consequence:
- client admins do not assemble arbitrary pages
- route map remains intentional and stable
- shared component library remains valuable

---

## ADR-003A: Component and section system must be product-grade

Decision:
- The shared section/component system must be designed as a high-quality developer platform, not just a convenience layer.

Reason:
- weak building blocks create recurring rework
- developers need flexible, well-thought composition tools to build branded pages confidently

Consequence:
- sections must have intentional layout flexibility
- components must provide strong defaults and clear extension points
- prop models should stay controlled and coherent
- variation should be designed, not improvised

---

## ADR-004: Structured content over arbitrary blocks

Decision:
- Dynamic public-site content should come from structured models such as site settings, testimonials, featured items, and section-specific configuration.

Reason:
- keeps data contracts simple
- supports predictable rendering
- avoids CMS editor/publish complexity

Consequence:
- content modules must be explicitly designed
- each site surface has a clear backing model

---

## ADR-005: Server-first App Router architecture

Decision:
- Use server-first route composition and isolate client components to interactive leaves only.

Reason:
- aligns with standards
- reduces hydration cost
- improves determinism around auth/session

Consequence:
- route files remain thin
- data access and normalization live below routes
- client state is localized to UI interactions

---

## ADR-006: Strict layer ownership

Decision:
- Enforce the existing dependency direction:
  - `tokens/globals -> primitives -> ui -> patterns -> sections -> routes`

Reason:
- prevents architectural entanglement
- keeps reusable building blocks reusable

Consequence:
- no reverse imports
- routes only compose
- business/data logic cannot leak into presentational layers

---

## ADR-007: Token-first design system

Decision:
- All styling remains token-driven and colocated in component-level `.module.css` files.

Reason:
- supports multi-brand site delivery
- keeps theming scalable
- avoids ad-hoc style drift

Consequence:
- no inline styles by default
- no hardcoded px/rem overrides where tokens should exist
- theme architecture is a first-class foundation, not an afterthought

---

## ADR-008: Admin shell and public shell are separate product concerns

Decision:
- Build distinct shell patterns for:
  - superadmin/internal product
  - hub admin
  - public/member surfaces

Reason:
- different navigation, IA, and task patterns
- avoids one-shell-fits-all drift

Consequence:
- shell architecture is intentional
- admin UX can optimize for workflow density
- public UX can optimize for presentation and trust

---

## ADR-008A: Admin UX must minimize cognitive overload

Decision:
- Community admin and superadmin surfaces must be designed around single-focus task flow and low mental overhead.

Reason:
- operational users need clarity more than feature density
- overloaded admin surfaces create friction, mistakes, and training burden

Consequence:
- navigation should be shallow and obvious
- one primary action should dominate each major screen
- dense or multi-panel layouts should be used only when clearly justified
- page hierarchy, status visibility, and action grouping must be deliberate

---

## ADR-009: Media is a supporting capability, not the product center

Decision:
- Media handling exists as a dedicated hub-scoped workspace in support of structured content and operational records.

Reason:
- media library/editor complexity should not dominate product scope
- current repo over-invested in media/CMS coupling

Consequence:
- media workflows should stay focused:
  - upload
  - select
  - alt text
  - folders
  - usage references
  - safe delete/move operations
- the media workspace should remain operationally bounded and must not become a generic CMS asset studio

---

## ADR-010: Operational state machines are canonical

Decision:
- Membership, registration, payment, attendance, event, and course state transitions are explicit domain contracts.

Reason:
- operational systems fail when state transitions are vague
- these rules are central to product correctness

Consequence:
- implement explicit validators and transition guards early
- keep status changes out of ad-hoc UI logic

---

## ADR-011: Reference repo is salvage-only

Decision:
- Existing code may be reused only after deliberate review against standards and target architecture.

Reason:
- copying current implementation wholesale will reproduce the same problems

Consequence:
- salvage candidates should be reviewed by category:
  - keep
  - rewrite
  - discard

Recommended salvage categories:
- likely keep after review:
  - tokens
  - some primitives/ui
  - some validation/state-machine logic
  - some repository contracts
- likely rewrite:
  - CMS/editor surfaces
  - shell/navigation
  - media workflows
  - bloated patterns/hooks
- likely discard:
  - generic CMS/page-builder logic
  - preview/live CMS scaffolding

---

## ADR-012: Build by bounded slices

Decision:
- Implement the greenfield product in bounded domains, not broad horizontal rewrites.

Order:
1. foundations
2. auth/session and route guards
3. superadmin/hub provisioning
4. admin operations
5. public/member site delivery
6. structured content modules

Reason:
- keeps momentum
- makes QA and rollback easier
- prevents another sprawling rewrite

---

## ADR-013: Documentation is implementation authority

Decision:
- Before coding the new app, create and lock:
  - product scope
  - architecture plan
  - route map
  - data model/state machines
  - roadmap

Reason:
- the new app must not drift from undocumented assumptions

Consequence:
- implementation only begins after these documents are aligned
- scope changes must update docs first

---

## ADR-014: Route authority must remain explicit

Decision:
- The new app must maintain a strict approved route map for each surface.

Reason:
- route sprawl and shell drift are common failure points

Consequence:
- no “just add a route” behavior without doc updates
- settings/config flows should be intentionally placed either:
  - as routes
  - or as panels within canonical routes

---

## ADR-015: New implementation folder naming

Decision:
- Create a new app boundary under a clearly versioned or purpose-specific path.

Recommended options:
- `project-v2/`
- `apps/hub-platform/`

Preferred:
- `apps/hub-platform/`

Reason:
- makes long-term repo organization cleaner
- supports future extraction if needed

Consequence:
- old project remains intact temporarily
- cutover can be deliberate instead of destructive
