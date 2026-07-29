# Current Delivery Status And Next Steps (2026-03-09)

Status:
- Current-state delivery audit and handoff for `apps/hub-platform`
- Intended to be the first document read when resuming work in a new chat/session
- Historical snapshot only as of 2026-04-20

Authority:
- `docs/roadmap/greenfield-product-scope-v2.md`
- `docs/roadmap/greenfield-route-map-v2.md`
- `docs/roadmap/greenfield-architecture-decision-record-v2.md`
- `docs/roadmap/greenfield-shell-navigation-spec-v2.md`
- `docs/roadmap/greenfield-implementation-roadmap-v2.md`
- app-local standards in `docs/standards/*`

Hard rule:
- This document is a delivery-status companion to the greenfield docs.
- If this file conflicts with the greenfield scope/route/architecture docs, the greenfield docs win.
- If this file conflicts with newer repo-audited implementation planning, the newer planning wins.

Superseded for next-step sequencing by:
- [Product Site And Commercial Platform Implementation Plan (2026-04-20)](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-and-commercial-platform-implementation-plan-2026-04-20.md)

---

## 1) Executive Summary

Historical note:

This document captured the repo at an earlier stage.
Several areas discussed below, especially package authority, entitlement enforcement, and account-level package visibility, have since advanced materially in code.
Use this document for historical context, not as the canonical next-step source.

The greenfield app is no longer at the bootstrap stage.

It now has a real product foundation across:
- platform superadmin auth
- hub-admin auth
- support mode
- public/member/admin/platform shells
- hub provisioning
- events
- courses
- testimonials
- member auth and self-service
- structured settings
- media workspace foundation
- payments visibility and membership plan administration

The project is now in the **deepening and hardening** stage rather than the route-scaffolding stage.

The main remaining work is not broad route creation. It is:
- operational depth
- payment-model maturity
- media-workspace completion/polish
- final structured-content/theme depth
- final QA and release hardening

---

## 2) Delivery Status Against The Greenfield Roadmap

### 2.1 New app bootstrap
Status: complete

Delivered:
- `apps/hub-platform` app boundary
- app router structure
- local docs/standards/roadmap ownership
- lint and unit test harness

### 2.2 Design-system foundation
Status: materially complete, still open for refinement

Delivered:
- token split (`tokens`, `semantic`, `themes`, `base`)
- primitives, UI controls, modal, nav, form controls, badges, buttons
- icon system using self-hosted Material Symbols outlined font via canonical `Icon` wrapper
- operator light/dark toggle for admin/platform

Remaining:
- ongoing visual refinement only, not foundational redesign

### 2.3 Auth, session, route authority
Status: largely complete

Delivered:
- member auth/session
- hub-admin auth for `admin`
- platform auth/session for `superadmin`
- server-first route protection
- explicit support mode requirement for superadmin access into hub admin

Remaining:
- invite acceptance onboarding is still incomplete as a full user-lifecycle flow

### 2.4 Shell architecture
Status: materially complete

Delivered:
- platform shell
- hub-admin shell
- public shell
- member shell
- route-aware CTA cleanup
- operator theme toggle
- support-mode banner
- back-to-platform and support-exit behavior clarified

Remaining:
- incremental polish only

### 2.5 Community provisioning
Status: complete for current greenfield scope

Delivered:
- hubs list
- create hub
- invite admin from platform
- support entry from platform
- platform sign-in

Remaining:
- deeper provisioning automation only if later approved

### 2.6 Core domain models
Status: materially complete for current implemented product slices

Delivered:
- users
- roles
- memberships
- events
- courses
- registrations
- payments visibility/history foundations
- attendance
- testimonials
- site settings
- media assets/folders/usages (initial model)

Remaining:
- richer payment-history and payment lifecycle modeling beyond the current operational model

### 2.7 Admin operations: members and roles
Status: partial but real

Delivered:
- admins list
- admin invites
- invite lifecycle basics (resend/revoke/visibility)
- members list/detail
- suspend/reactivate member
- membership assignment from member detail

Remaining:
- stronger people-ops lifecycle depth
- cleaner role/state management over time
- invite acceptance flow that provisions admin accounts end-to-end

### 2.8 Admin operations: events
Status: implemented

Delivered:
- list
- create
- edit in canonical detail workspace
- registrations workspace
- attendance workspace
- public event discovery/detail/booking
- event media integration

Remaining:
- deeper payment operations around events where needed
- further polish only

### 2.9 Admin operations: courses
Status: implemented

Delivered:
- list
- create
- edit in canonical detail workspace
- registrations workspace
- attendance workspace
- public course discovery/detail/enrolment
- course media integration

Remaining:
- deeper payment operations around courses where needed
- further polish only

### 2.10 Admin operations: testimonials and structured content
Status: implemented

Delivered:
- testimonial create/edit/list
- publish/archive state
- public testimonials page
- structured settings for branding/navigation/site

Remaining:
- richer homepage/featured content configuration if required

### 2.11 Supporting capability: media
Status: partial but real

Delivered:
- dedicated hub media workspace route
- folder creation/rename/delete with confirmation
- asset upload
- tabs/filters/search
- right-side details panel
- asset metadata updates
- usage references
- safe asset delete blocking when in use
- picker-mode workflow with return-to-origin
- branding/testimonial/event/course integration

Remaining:
- stronger picker-mode polish
- full inline replacement of older field-level assumptions
- broader usage coverage if more asset-backed entities are added
- final UX refinement toward the reference-quality media library

### 2.12 Public site delivery
Status: implemented at meaningful product level

Delivered:
- landing
- about
- contact
- events routes
- courses routes
- testimonials
- branded public shell/header
- media-backed logo

Remaining:
- richer structured homepage content model if desired
- custom-domain runtime validation if not yet verified end-to-end

### 2.13 Member experience
Status: implemented at meaningful product level

Delivered:
- join
- sign-in
- account overview
- membership
- registrations
- courses
- payments visibility
- profile
- booking flows for events/courses

Remaining:
- deeper lifecycle features (cancellations, advanced self-service policies) only if approved

### 2.14 Theme and branding configuration
Status: partial but strong

Delivered:
- public theme/template settings
- operator theme preference for admin/platform
- branded logo integration
- predictable admin/public separation of theme responsibility

Remaining:
- full per-hub token override management if that becomes a product requirement

### 2.15 Cutover and legacy retirement
Status: not started

Notes:
- old app is still present as reference
- no formal cutover/retirement plan has been executed yet

---

## 3) Current Product Areas: Complete vs Partial vs Missing

### 3.1 Complete enough for active use/testing
- platform sign-in and protected platform routes
- superadmin support mode
- hub-admin sign-in and protected admin routes
- hub creation
- admin invite creation and lifecycle basics
- member join/sign-in
- event CRUD + booking operations
- course CRUD + enrolment operations
- testimonial CRUD
- structured site settings
- public hub routes
- member account routes
- media workspace foundation

### 3.2 Partial / needs next-phase depth
- people operations
- payment operations
- membership plan administration UX polish
- membership payment history maturity
- media picker/workspace polish
- structured homepage configuration depth

### 3.3 Missing / not yet delivered
- invite acceptance flow that turns an invite into a fully onboarded admin account
- full payment ledger/accounting-grade model (if desired)
- formal cutover/legacy retirement work
- any future custom-domain verification flow if required by product rollout

---

## 4) Known Important Product / Architecture Decisions Already Locked

These should not be re-litigated casually in a new session.

### 4.1 The product is not a CMS-first product
- generic page-builder/CMS behavior remains out of scope
- structured content/config + developer-owned routes remains the correct model

### 4.2 Admin/theme separation is intentional
- public/member branding theme is hub-configurable
- admin/platform operator theme is separate and intentionally stable
- admin should not inherit hub public light/dark decisions directly

### 4.3 Support mode is explicit
- superadmin access into hub-admin is a context switch
- support mode must be explicitly entered
- support mode must be explicitly exited

### 4.4 Finance has been split conceptually
- `Payments` = operational payment queue / filtering / member lookup
- `Payment plans` = membership plan catalog / configuration
- this split currently lives on the same canonical route with query-based views, not separate route trees

### 4.5 Media should be a dedicated workspace
- the correct direction is a hub media workspace with picker mode
- not reintroducing bloated field-level media logic everywhere

---

## 5) High-Confidence Next Steps

Historical note:

The sequencing in this section is preserved for context only.
It no longer reflects the strongest next-step recommendation for the current repo.
For the current plan, use:

- [Product Site And Commercial Platform Implementation Plan (2026-04-20)](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-and-commercial-platform-implementation-plan-2026-04-20.md)

These are the recommended next steps from the current state.

### 5.1 Immediate next slice
**Deeper people/payment operations**

Rationale:
- this is the biggest remaining product-depth gap
- auth, shells, events, courses, testimonials, settings, and media all exist already
- the highest value now is stronger operational workflows, not more route breadth

Recommended focus:
1. finish the payment-plan delete flow UX polish and verification
2. strengthen member/admin operational lifecycle handling
3. mature payment workflows where they are still shallow

### 5.2 After that
**Media workspace refinement**

Focus:
- picker-mode UX polish
- clearer select/use-media flow
- final parity with the desired reference-quality library UX
- additional entity usage references if needed

### 5.3 After that
**Final structured-content/theme depth**

Focus:
- homepage/featured-content configuration if still needed
- branding depth only if approved by product scope

### 5.4 Then
**Final QA and cutover planning**

Focus:
- responsive/manual QA sweep
- route-by-route regression pass
- old-project retirement strategy

---

## 6) Recommended Next Session Prompt

Use this when opening a new chat and resuming work:

> Read `apps/hub-platform/docs/roadmap/product-site-and-commercial-platform-implementation-plan-2026-04-20.md` first, then use the greenfield docs in `apps/hub-platform/docs/roadmap/*` as authority and keep the app production-grade.

---

## 7) Caution Notes For The Next Session

- Do not reintroduce CMS-style scope.
- Do not expand route sprawl when a query-based view or in-page workflow is sufficient.
- Do not let admin/public theme responsibilities blur again.
- Keep route files thin.
- Keep destructive actions behind explicit confirmation.
- Keep token-driven styling discipline intact.
- Continue using shared UI primitives instead of ad hoc form/workflow controls.

---

## 8) Current Confidence Assessment

Confidence level: **high** on architecture direction, **medium-high** on implementation maturity.

Why not “complete” yet:
- there are still operational depth gaps
- there is still final QA/cutover work to do
- some newer flows have been implemented faster than they have been fully product-hardened

But the app is past the experimental phase.
It is now a real greenfield product foundation with targeted remaining work.
