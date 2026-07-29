# Hub-Platform Launch Surface Readiness Roadmap

Status:
- Proposed
- Execution roadmap for launch-focused admin and public-site readiness

Date:
- 2026-05-06

Purpose:
- translate the launch-readiness audit into an implementation-grade roadmap
- prioritize the public site and admin portal work required for a credible initial launch
- separate true launch blockers from important post-launch improvements
- identify the decisions that must be made explicitly before implementation starts

Authority:
- [Product-Site Current State Audit And Next Steps](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-current-state-audit-and-next-steps-2026-05-01.md)
- [Template Architecture And Variant Governance Plan](/mnt/c/local/community-app/apps/hub-platform/docs/public-site/template-architecture-and-variant-governance-plan.md)
- [Hub-Platform Native Payments Rollout And Verification Runbook](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/hub-platform-native-payments-rollout-and-verification-runbook-2026-05-01.md)
- [Hub-Platform Payment Ledger Implementation Phase Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/hub-platform-payment-ledger-implementation-phase-plan-2026-05-03.md)
- app-local standards in `docs/standards/*`

Related repo surfaces:
- public routes in `src/app/(hub)/[hubSlug]/*`
- admin routes in `src/app/(admin)/[hubSlug]/admin/*`
- public composition and data in `src/components/patterns/public-*` and `src/lib/data/public-site.js`
- template registry in `src/lib/templates/*`
- public styling in `src/app/styles/templates/*`

## 1) Executive position

The product is no longer most at risk from missing payment infrastructure.

The bigger launch risk is surface credibility.

At the moment, the repo contains several experiences that are functional enough for internal progress but still feel partially built from an admin or visitor perspective.

The roadmap should therefore optimize for:

1. public trust
2. admin clarity
3. launch-surface completeness
4. only then deeper expansion of reporting, attendance sophistication, and template breadth

This roadmap intentionally does **not** prioritize support/operator tooling for initial launch.

## 2) Launch goals

Launch should satisfy these product-level goals:

- a visitor can land on a hub, understand what it is, explore events/courses, and join with confidence
- a hub admin can configure the public site without discovering obvious “planned” or placeholder surfaces
- a hub admin should have a clear onboarding path through the admin portal before launch
- Growth hubs can see enough member and activity reporting to feel commercially credible
- attendance is trustworthy enough for real use, even if it is not yet a full historical ledger
- templates feel intentionally different rather than cosmetically recolored

## 3) Launch blockers

These should be treated as first-order blockers because they directly damage the launch impression.

### 3.1 Public About route should not be part of launch scope

Current repo state:

- homepage already surfaces hero, About us, what-we-do, testimonials, and CTA sections
- `/about` route exists but is still a placeholder
- a separate About page is not currently necessary to communicate the core community story at launch

Implication:

- the product should not force a weak or redundant About experience into launch simply because the route exists

Required outcome:

- remove About from public navigation and admin page settings for launch
- treat the dedicated About route as deferred until it has a genuinely distinct job from the homepage

### 3.2 Placeholder homepage states can leak to public visitors

Current repo state:

- homepage can render placeholder media and generic scaffolded copy if configuration is incomplete

Implication:

- an underconfigured hub can still render an obviously provisional public site

Required outcome:

- no placeholder or scaffold text/media should be visible to visitors on launch surfaces
- any fallback visuals that remain public should read as neutral polished placeholders rather than setup instructions

### 3.3 Template distinctiveness is not yet strong enough

Current repo state:

- `civic`, `editorial`, and `studio` exist
- structural differences are present but narrow
- many page-level surfaces still share the same variants
- template CSS differences are real but not yet enough to feel like clearly distinct template families

Implication:

- a core product promise is at risk of feeling overstated

Required outcome:

- templates must feel intentionally different in structure, rhythm, and emphasis, not only in token values

### 3.4 Growth reporting lacks last-login visibility

Current repo state:

- Growth members/workspaces do not expose last login / last seen reporting
- normalized user data does not currently surface that field

Implication:

- Growth administration lacks an important operational signal

Required outcome:

- admins can answer “when did this member last access the hub?”

### 3.5 Attendance is operationally present but not yet a proper record

Current repo state:

- event and course attendance pages exist
- attendance status can be marked
- current model behaves more like mutable current state than a robust record

Implication:

- launch messaging must not imply stronger attendance history than the product actually stores

Required outcome:

- attendance should be trustworthy enough for launch and clearly scoped

## 4) Delivery principles

These principles should guide implementation sequencing.

### 4.1 No public placeholders

If a route or section is visible publicly, it must feel intentional.

### 4.2 No roadmap leakage in admin

Admins should see real capabilities and readiness states, not internal “planned” framing on launch-critical surfaces.

### 4.3 Compose, do not over-CMS

For launch, homepage and similar pages should be section-composed and template-driven, not turned into arbitrary page-builder surfaces.

### 4.4 Distinct templates require variant planning first

Do not try to “CSS your way” into differentiated templates without defining the variant contract needed by the components.

### 4.5 Launch v1 data should be trustworthy, even if not exhaustive

For example:

- `lastSignedInAt` can ship before `lastSeenAt`
- attendance metadata can ship before full attendance history

## 5) Workstream roadmap

## Workstream A: About Deferral And Launch-Surface Cleanup

Priority:
- P0

Goal:
- remove About from launch-critical admin and public navigation surfaces until it has a distinct product purpose

### A.1 Scope

Build:

- remove About from public header navigation
- remove About from admin page settings overview
- update launch roadmap and tests so About is explicitly out of launch scope
- keep homepage as the primary trust/story surface for launch

### A.2 Launch rationale

The current homepage already covers the essential launch storytelling needs through:

1. Hero
2. About us / info
3. What we do
4. Testimonials
5. CTA

Because of that, a separate About page would currently be more redundant than helpful unless it is later given a genuinely distinct editorial or trust-building job.

### A.3 Deferred follow-up

Revisit a dedicated About page only if a later product phase needs a route that is meaningfully different from the homepage, for example:

- deeper mission/storytelling
- founder/team credibility
- richer onboarding reassurance
- a more editorial community narrative

### A.4 Dependencies

- public route cleanup
- admin page settings cleanup
- test updates

### A.5 Open decisions requiring explicit planning

1. Should the placeholder `/about` route remain accessible directly but hidden, or should it be retired later?
2. If About returns post-launch, what distinct job should it do that the homepage should not?

### A.6 Acceptance criteria

- public navigation no longer promotes About
- admin page settings no longer promote About
- launch scope treats homepage as the primary trust/story surface

## Workstream B: Public Content Readiness And Placeholder Removal

Priority:
- P0

Goal:
- prevent underconfigured hubs from surfacing obviously unfinished public experiences

### B.1 Scope

Replace public placeholders with:

- omission
- readiness gating
- admin-only incomplete states

### B.2 Recommended readiness rules

Homepage minimum readiness:

- site name
- contact email
- hero title
- hero description
- one meaningful trust/content section

Events page minimum readiness:

- sensible hero copy
- enabled capability

Courses page minimum readiness:

- sensible hero copy
- enabled capability

### B.3 Recommended behavior

- incomplete sections should be hidden publicly, not filled with scaffolding
- sections that intentionally keep seeded defaults should use neutral public-facing placeholder media rather than admin-instructional artwork
- admin settings should surface what is missing
- overview/dashboard may show launch-readiness summaries

### B.4 Open decisions requiring explicit planning

1. Should homepage require media for launch readiness, or only strongly recommend it?
2. Should readiness be advisory only, or should we add a publish-style gating concept?

### B.5 Acceptance criteria

- no visitor sees placeholder media or scaffold text
- admin can identify incomplete surfaces quickly

## Workstream C: Admin Settings And Readiness UX

Priority:
- P0

Goal:
- make admin configuration feel complete, actionable, and launch-oriented

### C.1 Scope

Update settings overview and page settings overview so they describe real capabilities.

Required changes:

- About is removed from launch page settings until it has a distinct product role
- “planned” framing is removed from launch-critical surfaces
- readiness states appear clearly

### C.2 Recommended settings overview additions

- homepage ready / incomplete
- events page ready / incomplete
- courses page ready / incomplete
- contact details ready / incomplete
- branding complete / incomplete

### C.3 Dashboard enhancement candidates

- site launch readiness card
- Stripe setup readiness card
- recent member activity card for Growth
- attendance follow-up card if meaningful

### C.4 Acceptance criteria

- settings overview reads like a product control panel, not a roadmap tracker

## Workstream D: Admin Onboarding And Launch Guidance

Priority:
- P1

Goal:
- guide admins through launch-critical setup inside the admin portal instead of relying on public placeholders or implicit knowledge

### D.1 Scope

Plan and implement an onboarding path for first-time hub admins.

Recommended launch setup areas:

1. Branding and site identity
2. Homepage setup
3. Contact details and footer trust information
4. Events and courses readiness where relevant
5. Payments setup where relevant
6. Final launch-readiness review

### D.2 Recommended launch posture

- public fallback content should stay minimal and neutral
- setup guidance should live in admin onboarding and readiness surfaces
- onboarding should reduce the chance of half-configured sites reaching launch

### D.3 Planning needed before implementation

Create a dedicated onboarding mini-plan that defines:

1. where onboarding starts
2. whether it is checklist-based, wizard-based, or hybrid
3. which steps are mandatory before a site is considered launch-ready
4. how onboarding relates to settings overview and dashboard readiness cards

### D.4 Acceptance criteria

- admins have a clear path to completing launch-critical configuration
- setup guidance is concentrated inside admin rather than leaking into public surfaces

## Workstream E: Growth Member Activity Reporting

Priority:
- P1

Goal:
- give Growth admins meaningful visibility into member recency and engagement

### E.1 Scope

Introduce:

- `lastSignedInAt` at minimum

Possible later extension:

- `lastSeenAt`

### E.2 Recommended launch posture

Launch with:

- `lastSignedInAt`

Defer:

- `lastSeenAt`
- richer activity heartbeat logic

Reason:

- `lastSignedInAt` is easier to make correct quickly
- `lastSeenAt` requires more deliberate event semantics to avoid noise and misleading reporting

### E.3 Surface targets

Members list:

- add last sign-in column or summary label

Member detail:

- show joined date
- show last sign-in

Dashboard:

- optional recent member activity panel or stat

### E.4 Data model and integration considerations

Need to update:

- member sign-in flow
- any admin acceptance/auth flows that should count as sign-in
- normalized user read model

### E.5 Open decisions requiring explicit planning

1. Is `lastSignedInAt` enough for launch, or do you want `lastSeenAt` in scope too?
2. Should Growth-only reporting differ visibly from Starter/Free, or simply appear when data exists?

### E.6 Acceptance criteria

- admin can answer when a member last signed in
- data is captured automatically by normal auth flow

## Workstream F: Member Surface Quality

Priority:
- P1

Goal:
- make member records feel like operational relationship pages rather than raw data views

### E.1 Scope

Enhance members list and member detail.

Recommended additions:

- joined date
- last sign-in
- stronger membership summary
- clearer payment attention meaning
- lightweight activity summary
- attendance/progression summary if we have the data

### E.2 Recommended member detail sections

1. Identity
- name
- email
- status
- joined date
- last sign-in

2. Membership
- current plan
- default vs upgrade
- pending upgrade request if present

3. Payments
- payment history
- outstanding attention

4. Participation
- events booked
- courses enrolled
- attendance/progression summary

### E.3 Acceptance criteria

- admins can understand member state quickly without digging through multiple pages

## Workstream G: Attendance Trustworthiness

Priority:
- P1

Goal:
- keep attendance simple for launch while making it trustworthy enough to stand behind

### F.1 Launch recommendation

Do **not** build a full attendance history ledger for launch.

Do build:

- explicit attendance/progression metadata
- clearer semantics around who marked status and when

### F.2 Recommended data additions

Events:

- `attendanceMarkedAt`
- `attendanceMarkedBy`

Courses:

- `attendanceMarkedAt` or `progressMarkedAt`
- `attendanceMarkedBy` or `progressMarkedBy`

### F.3 UX improvements

- show marked-at metadata in attendance workspace or detail context
- clarify whether course attendance means “session attendance” or “progress state”

### F.4 Open decisions requiring explicit planning

1. For courses, do we want to keep calling this `attendance`, or rename the product language to `progress` more consistently?
2. Do we need an attendance summary surfaced in member detail for launch?
3. Do we want any export/report view for attendance before launch?

### F.5 Acceptance criteria

- admins can trust the marked state
- the system records who changed it and when
- product language matches what the data really means

## Workstream H: Template Differentiation Program

Priority:
- P1, but only after Workstreams A-C are underway

Goal:
- make template families feel materially distinct across public launch routes

### G.1 Important execution rule

This work requires a variant planning step before implementation.

Do not start by only editing template CSS files.

### G.2 Why further planning is required

Current registry and CSS layers support template expression, but many sections still share the same structural variants.

That means stronger differentiation likely requires:

- new component variants
- new page-composition variants
- possibly more template-level route defaults

### G.3 Recommended template identities

`civic`

- grounded
- balanced
- public-service / institution / community-center tone

`editorial`

- story-led
- content-rich
- more asymmetry and visual rhythm

`studio`

- bolder
- campaign-like
- stronger CTA and surface contrast

### G.4 Likely variant-planning backlog

The following areas likely need explicit new variants:

- `HeroSection`
- `InfoSection`
- `GridSection`
- `EventsListingSection`
- `CoursesListingSection`
- `EventDetailsSection`
- `CourseDetailsSection`
- `CTASection`
- possibly `PublicHeader`

### G.5 Required planning deliverable before implementation

Create a dedicated template execution mini-plan that defines:

1. which components need new variants
2. which pages should vary by template at the structural level
3. which distinctions should remain token/CSS-only
4. which templates should own which defaults in the registry

### G.6 Acceptance criteria

- screenshots of each template family feel recognizably different
- differences are visible on homepage, listing pages, and detail pages
- implementation remains variant-driven rather than hardcoding template names into components

## Workstream I: Public Events And Courses Polish

Priority:
- P2

Goal:
- upgrade events/courses public pages from “functional” to “launch-polished”

### H.1 Scope

Improve:

- hero specificity
- trust signals
- CTA hierarchy
- pricing/payment clarity
- booking/enrolment guidance

### H.2 Recommended focus

Events:

- conversion-first detail page
- strong primary booking flow

Courses:

- information-first detail page
- stronger articulation of value, duration, and progression

### H.3 Dependencies

- template differentiation workstream
- public readiness work

### H.4 Acceptance criteria

- pages feel intentionally merchandised, not merely listed

## Workstream J: Join And Sign-In Polish

Priority:
- P2

Goal:
- make auth entry routes feel consistent with the public product quality bar

### J.1 Scope

Improve:

- branded copy
- reassurance language
- join vs sign-in clarity
- mobile presentation

### J.2 Acceptance criteria

- auth routes feel like polished product surfaces, not detached utilities

## 6) Suggested delivery sequence

This is the recommended execution order.

### Phase 1

1. Workstream A: About deferral and launch-surface cleanup
2. Workstream B: Placeholder removal and readiness
3. Workstream C: Admin settings/readiness UX

### Phase 2

4. Workstream D: Admin onboarding and launch guidance
5. Workstream E: Last-sign-in reporting
6. Workstream F: Member surface quality
7. Workstream G: Attendance trustworthiness

### Phase 3

8. Workstream H: Template differentiation mini-plan
9. Workstream H implementation
10. Workstream I: Events/courses polish
11. Workstream J: Join/sign-in polish

### Phase 4

12. launch QA matrix
13. targeted launch-flow tests

## 7) Dependencies and sequencing notes

- About is out of launch scope unless later planning reintroduces it with a distinct purpose
- readiness UX should be designed in parallel with homepage trust-surface cleanup so the admin model does not need rework
- onboarding should be planned before launch so setup guidance does not end up scattered awkwardly across unrelated admin screens
- last-sign-in reporting should land before member-surface redesign is finalized
- attendance naming decisions should be locked before course attendance polish expands
- template differentiation should start with a planning artifact before code changes

## 8) Explicit decisions required before implementation starts

These are the questions that should be answered intentionally rather than guessed during implementation.

### 8.1 About page decisions

1. Should the placeholder route remain hidden-but-available during launch, or should we retire it in a later cleanup pass?
2. If About returns after launch, what unique job should it perform relative to the homepage?

### 8.2 Readiness model decisions

1. Should homepage require media for launch readiness, or only strongly recommend it?
2. Should readiness be advisory only, or should it meaningfully block “launch-ready” status?

### 8.3 Admin onboarding decisions

1. Should onboarding be a guided checklist, a step-by-step wizard, or a hybrid?
2. Which setup tasks should be considered mandatory before a site is launch-ready?
3. Should onboarding live on the overview/dashboard, settings overview, or a dedicated launch/setup route?

### 8.4 Member activity reporting decisions

1. Is `lastSignedInAt` sufficient for launch?
2. Do we want to defer `lastSeenAt` entirely?

### 8.5 Attendance decisions

1. Should course attendance be renamed to progress in more places for clarity?
2. Is mark metadata enough for launch, or do you want true attendance history in scope?

### 8.6 Template program decisions

1. Which template family should be the default showcase for launch marketing?
2. Which sections most need new structural variants first?

## 9) Suggested acceptance checklist by milestone

### Milestone 1: Public credibility restored

- homepage exposes no placeholders
- About is not promoted in launch surfaces
- settings overview reflects real capability

### Milestone 2: Admin credibility strengthened

- last sign-in exists
- member detail shows meaningful recency
- attendance stores marked-by / marked-at metadata

### Milestone 3: Template promise becomes real

- templates feel distinct on homepage
- templates feel distinct on events/courses
- templates feel distinct on detail pages

### Milestone 4: Launch validation complete

- route-by-route QA completed
- launch-critical tests in place

## 10) Immediate next action

The first implementation/planning step should be a focused homepage/readiness pass.

That pass should lock:

1. the minimum public launch-readiness rules
2. how placeholder sections are suppressed or surfaced
3. whether readiness is advisory or publish-gating
4. how homepage content becomes the primary trust/story surface for launch

That is the highest-value decision cluster because it resolves the biggest remaining public-surface credibility risks without creating a redundant About experience.
