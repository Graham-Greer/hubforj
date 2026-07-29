# Course Domain Model Refactor Plan

Status:
- Proposed
- Production-grade planning document for refactoring the `Course` domain away from the current legacy/transitional shape and toward the canonical SaaS model

Purpose:
- Define the target production model for courses before planning and implementing the public course listing/detail surfaces
- Prevent `CoursesListingSection` and `CourseDetailsSection` from being designed against a course contract we already know is incomplete
- Align courses with the stronger architectural direction already established for events, while preserving the domain differences that make courses distinct

---

## 0) Product constraint

This refactor must respect an important product constraint:

- the SaaS admin experience should remain easy to use

That means this document should not be interpreted as permission to expose every future course capability in one heavy admin setup flow.

The right principle is:

- rich model underneath
- simple authoring on top

So throughout this plan we must distinguish between:

- the canonical model the system should support
- the smaller, clearer v1 admin setup experience that most admins will actually use

This distinction is critical.

The goal is not to build a weak course model.
The goal is to build a strong course model that can still be authored without overwhelming admins.

---

## 1) Why this refactor is needed

The current course model is no longer sufficient as the canonical product shape.

It has drifted behind the event model and behind the public-site architecture in several ways:

- visibility logic is weaker than events
- scheduling is underspecified
- public detail/listing helpers do not exist yet
- `scheduleSummary` is acting as a vague catch-all instead of a durable contract
- location is missing
- the model does not yet reflect the deeper mental model of:
  - course
  - sessions
  - enrolments
  - resources
  - admin settings

If we continue building public course functionality on top of the current shape, we will either:

- duplicate temporary logic
- hardcode assumptions into route sections
- or refactor the course model after the public surfaces already depend on it

That is the wrong order.

The correct order is:

1. define the canonical course domain model
2. identify what is truly v1 vs what is future scaffolding
3. refactor the admin and persistence model
4. then design and implement `CoursesListingSection` and `CourseDetailsSection`

---

## 2) Current state assessment

The current course model still carries several legacy/transitional assumptions:

- schedule is modeled as:
  - `startAt`
  - `endAt`
  - `scheduleSummary`
- no dedicated `location`
- no `courseType`
- no `subtypeLabel`
- no `format`
- no `timezone`
- no registration window fields
- no `paymentDeadline`
- no `accessInstructions`

Strengths already in place:

- `summary` now exists and is distinct from rich `description`
- rich `description` is already supported with `SectionRichTextField`
- `allowWaitlist` is now implemented
- capacity, eligibility, visibility, and pricing already exist
- course admin forms already use the newer shared form system

So this is not a blank-slate problem.

The real task is:

- preserve the good recent improvements
- retire the weak legacy assumptions
- extend the model to the point where public course sections can be designed honestly

---

## 3) Product mental model

The correct conceptual model for courses should be:

- `Course`
  - the parent container and public-facing offering
- `Sessions`
  - the individual scheduled delivery moments
- `Enrolments`
  - the people joining the course
- `Resources`
  - files, links, and supporting materials
- `Admin settings`
  - visibility, permissions, pricing, reporting, operational rules

This mental model is stronger than the current implementation and should guide the schema direction even if all of it is not delivered in v1.

Important:

- the v1 implementation does not need to fully materialize every future child collection
- but the v1 schema should not block that future decomposition

---

## 4) Long-term structural direction

The ideal long-term database split is:

- `courses`
- `course_sessions`
- `course_enrolments`
- `course_instructors`
- `course_resources`

This is the right long-term production design because it separates:

- offering definition
- delivery structure
- people/state
- supporting content

However, that does **not** mean all of these tables/collections must be introduced immediately in the next implementation slice.

The more pragmatic v1 question is:

- what should be canonical on the course record now
- and what should remain a later extraction once the public and admin experience justifies it

---

## 5) Refactor principles

### 5.1 Respect the current section and primitive system

This refactor exists partly to support:

- `CoursesListingSection`
- `CourseDetailsSection`

So the domain contract must support the section system rather than forcing route-level hacks.

### 5.2 Respect current form infrastructure

This must **not** become a rewrite-everything exercise.

We should:

- preserve the current form architecture improvements
- preserve correct existing field implementations
- replace weak field contracts only where the model itself is changing

### 5.3 Do not clone events mechanically

Events and courses should align where the product concepts genuinely overlap:

- summary vs rich body
- visibility
- waitlist
- admin form standards
- public auth-aware CTA rules

They should **not** be forced into identical domain assumptions where they do not belong.

### 5.4 Prefer durable concepts over vague helper fields

Fields like:

- `scheduleSummary`

should not remain central if we already know they are ambiguous.

### 5.5 Keep the v1 authoring flow bounded

Even when a field belongs in the canonical v1 course contract, that does not automatically mean it must create a high-friction or highly branched create flow.

The admin journey should:

- group related fields clearly
- use conditional logic where helpful
- avoid exposing future-complexity concepts too early
- keep the most common create/edit path straightforward

This is especially important for courses because they can easily become the most operationally complex public content type in the product.

---

## 6) What the canonical v1 course record must cover

The course record needs to cover both:

- editorial/public presentation
- operational/enrolment behavior

Those are both first-class concerns.

### 6.1 Editorial / public presentation fields

Required or expected:

- `title`
- `slug`
- `summary`
- `description`
  - rich text
- `imageAssetId`
- `imageAlt`
- `courseType`
- `subtypeLabel`
  - optional custom label
- `courseLevel`
  - `beginner`
  - `intermediate`
  - `advanced`
  - `all-levels`
  - `custom`
- `customLevelLabel`
  - optional custom public level label when `courseLevel = custom`
- `format`
  - `in-person`
  - `online`
  - `hybrid`
- `location`
- `timezone`
- `accessInstructions`
  - rich text

### 6.2 Operational / enrolment fields

Required or expected:

- `capacity`
- `allowWaitlist`
- `registrationEligibility`
- `visibility`
- `status`
- `pricingMode`
- `price`
- `currency`
- `registrationOpenDate`
- `registrationCloseDate`
- `paymentDeadline`
- `requiresDeposit`
- `depositAmount`

### 6.3 Scheduling / delivery fields

These are the most important part of the refactor because they are currently weakest.

The course model should support:

- recurring courses
- date-bounded courses
- potentially custom-date courses later

So the scheduling layer must move beyond the current:

- `startAt`
- `endAt`
- `scheduleSummary`

---

## 6A) Canonical model vs v1 admin surface

The fields above define what the v1 course model must be capable of representing.

That does **not** mean every field must be presented as an equally prominent first-step input in the default admin flow.

The intended reading of this plan is:

- all of the above fields remain in scope for the v1 canonical model
- but the admin surface should still be structured to feel simple and progressive

Important clarification:

The following fields are explicitly still required to remain in scope and must **not** be dropped from the plan:

- `subtypeLabel`
- `courseLevel`
- `customLevelLabel`
- `registrationOpenDate`
- `registrationCloseDate`
- `paymentDeadline`
- `requiresDeposit`
- `depositAmount`
- `accessInstructions`

So the course setup should be simplified through:

- hierarchy
- grouping
- conditional rendering
- progressive disclosure where appropriate

not through removing fields that the product genuinely needs.

---

## 7) Required fields in the new model

The course record should become more explicit than it is today.

### 7.1 Required in v1

- `title`
- `slug`
- `summary`
- `description`
- `courseType`
- `format`
- `timezone`
- `visibility`
- `registrationEligibility`
- `status`
- `pricingMode`

Conditional requirements:

- `price` if `pricingMode = paid`
- `paymentDeadline` if paid and payment is expected before start
- `depositAmount` if deposit is enabled
- `location` if `format = in-person` or `hybrid`
- `onlineMeetingLink` if `format = online` or `hybrid`
- scheduling fields required according to the chosen scheduling mode

### 7.2 Strongly recommended in v1

- `capacity`
- `allowWaitlist`
- `registrationOpenDate`
- `registrationCloseDate`
- `accessInstructions`

### 7.3 Required-in-scope but conditional fields

The following fields remain part of the v1 contract but should be conditional rather than universally prominent:

- `subtypeLabel`
  - only when the canonical type does not communicate enough public context
- `paymentDeadline`
  - only when relevant to the pricing/payment model
- `requiresDeposit`
  - only when `pricingMode = paid`
- `depositAmount`
  - only when deposit is enabled

These are not “future maybe” fields.
They remain in-scope v1 fields that should be surfaced in an admin-friendly way.

### 7.4 Why `summary` should become required

Courses are longer-commitment offerings than events.

That means browse quality matters even more.

The public listing card should not have to derive a summary from rich body content by default.

So unlike the transitional event migration where `summary` remained optional for safety, courses should move toward a stronger requirement once this refactor lands.

---

## 8) Course type and subtype

### 8.1 Why course type matters

Course type is important for:

- listing scan quality
- future filtering
- course detail framing
- admin consistency

The current course model has no such concept, which weakens both public organization and admin authoring clarity.

### 8.2 Proposed structure

- `courseType`
  - canonical controlled value
- `subtypeLabel`
  - optional custom human-facing label

Example types might later include:

- `Programme`
- `Workshop series`
- `Class`
- `Training`
- `Bootcamp`
- `Study group`
- `Certification`

The exact taxonomy should be decided in the dedicated course section planning, but the model should support it now.

### 8.3 Why subtype should be optional

Sometimes the admin will need a more specific public label than the canonical internal type.

For example:

- canonical type: `Programme`
- subtype label: `Leadership cohort`

This gives us:

- consistency for filtering and reporting
- flexibility for public-facing wording

---

## 9) Visibility model

The current course model only supports:

- `public`
- `members-only`

The new target should support:

- `public`
- `members-only`
- `invite-only`
- `private`

### 9.1 Semantics

- `public`
  - visible on public site
  - normal discovery/enrolment rules
- `members-only`
  - visible only to signed-in members
  - enrolment requires member access
- `invite-only`
  - not broadly discoverable
  - visible only through specific invitation-aware pathways or controlled links
- `private`
  - hidden from public/member discovery
  - purely operational/admin-managed

### 9.2 Why this matters

Courses are often more structured and restricted than events.

So course visibility needs to be more expressive than the current simple public/member split.

---

## 10) Scheduling model direction

This is the core modeling decision.

### 10.1 Why the current course schedule model is too weak

`scheduleSummary` is not a reliable canonical field because it does not tell the system:

- how many sessions exist
- what dates those sessions occur on
- what time zone applies
- whether the course is recurring
- whether enrolment should close before the first session

At best, it is descriptive copy.
It should not remain the main scheduling contract.

### 10.2 Target v1 scheduling shape

For v1, the course record should support one of these scheduling modes:

- `date-range`
- `recurring`
- `custom-dates`

And then hold the bounded supporting fields needed for that mode.

#### Mode: `date-range`

Intended for:

- intensive short course
- bootcamp
- retreat-style course
- weekend course

Likely fields:

- `startDate`
- `endDate`
- `startTime`
- `endTime`
- `timezone`

#### Mode: `recurring`

Intended for:

- weekly class
- daily training block
- repeating study group

Likely fields:

- `recurrencePattern`
  - `weekly`
  - `daily`
  - later extensible
- `recurrenceInterval`
  - optional
- `recurrenceDays`
  - if weekly
- `startDate`
- `endDate`
- `startTime`
- `endTime`
- `timezone`

#### Mode: `custom-dates`

Intended for:

- courses with irregular sessions
- manually chosen dates

This mode strongly points toward the eventual `course_sessions` extraction and should likely remain constrained in v1 unless we are ready to introduce session records.

### 10.3 Role of `sessionCount`

`sessionCount` should not be treated as a strong canonical source if sessions become the real concept.

Recommended direction:

- keep it only if needed temporarily in v1
- derive it later from actual sessions or recurrence expansion

So `sessionCount` should be treated as:

- transitional if no `course_sessions` table exists yet
- derived once sessions become first-class

### 10.4 Role of `sessionDuration`

This may be useful for admin convenience and public quick-glance summaries, but it should not replace:

- actual start time
- actual end time
- actual session records

So it should be:

- optional helper field in transitional v1 at most
- or derived later

---

## 11) Format, location, and online delivery fields

Courses need a clearer delivery model than they have now.

### 11.1 Format

Canonical values:

- `in-person`
- `online`
- `hybrid`

### 11.2 Required related fields

- if `in-person`
  - `location` required
- if `online`
  - `onlineMeetingLink` required
- if `hybrid`
  - both required, or at least strongly validated according to the chosen delivery rules

### 11.3 Access instructions

`accessInstructions` should be a structured rich-text field.

This is a strong use case for `SectionRichTextField` because admins may need to communicate:

- parking
- arrival instructions
- what to bring
- access arrangements
- platform joining guidance

This field should not be collapsed into a short text input.

---

## 12) Registration and payment timing fields

Courses often require more controlled enrolment windows than events.

So the model should add:

- `registrationOpenDate`
- `registrationCloseDate`
- `paymentDeadline`

These fields are important because courses are often:

- capacity managed
- longer-running
- higher commitment
- more likely to involve payment workflows

### 12.1 Deposit support

If deposit behavior is genuinely expected, model it explicitly:

- `requiresDeposit`
- `depositAmount`

This should be bounded and conditional:

- only relevant when `pricingMode = paid`

This does not require the full payments system to be redesigned immediately, but the course schema should allow the concept cleanly.

Important clarification:

These fields remain in scope for v1 and should stay in the plan.

The simplification question is not whether they exist.
The simplification question is how and when the admin is asked to set them.

---

## 13) Relationship between course record and future sessions

The course record should remain the parent/public offering record.

It should not become an oversized bucket for every possible session-level detail.

So the correct long-term relationship is:

- course stores the overall offering
- sessions store actual delivery moments

The v1 refactor should be careful not to make later session extraction harder.

That means:

- use explicit scheduling-mode fields now
- avoid overly magical `scheduleSummary`
- avoid over-investing in `sessionCount` as if it were the true source

---

## 14) Admin form implications

The admin form should be refactored to match the new canonical model, but still respect the recent form standardization work.

This means:

- keep the current shared form infrastructure
- preserve existing correct field implementations where possible
- replace field groups only where the underlying domain contract changes

### 14.1 Admin authoring strategy

The course domain may become one of the richest operational models in the product.

That means the admin UX must be structured intentionally.

The recommended authoring strategy is:

- stepped flow for course creation
- sectioned edit experience for course updates

This gives us the right balance:

- creation feels guided and approachable
- editing remains fast and efficient
- the underlying form model can still stay unified and production-grade

This should be treated as a first-class product decision, not a cosmetic preference.

### 14.2 Create flow should use a steps pattern

Course creation should use a linear stepped flow so the admin is guided through setup in a bounded sequence.

The main reason is cognitive load reduction.

Courses require the admin to think about:

- editorial content
- delivery setup
- schedule and enrolment rules
- pricing and payment behavior

Presenting all of that in one long initial form would make the create experience feel heavier than it needs to.

The recommended create steps are:

1. Core details
- title
- slug
- summary
- description
- image
- course type
- subtype label

2. Delivery
- format
- location
- online meeting link
- timezone
- access instructions

3. Schedule and enrolment
- scheduling mode
- scheduling fields appropriate to that mode
- transitional `sessionCount` only if still needed
- capacity
- allow waitlist
- eligibility
- visibility
- registration open date
- registration close date

4. Pricing
- pricing mode
- price
- currency
- requires deposit
- deposit amount
- payment deadline
- status if we decide create should support immediate publish state

This is the recommended v1 create flow because it:

- keeps the number of steps manageable
- groups related decisions together
- avoids making the admin jump across too many separate setup concepts

The `Schedule and enrolment` combination is intentional.

Those concerns belong together in the admin's mental model because they answer a connected set of questions:

- when does the course run
- when can people register
- who can join
- how many people can join
- what happens when the course fills up

### 14.3 Create flow behavior expectations

The stepped create flow should behave as a single guided setup experience, not as disconnected mini-forms.

Recommended behavior:

- one underlying course draft form state
- step-level validation before moving forward where appropriate
- ability to move back without losing entered data
- clear progress indicator
- explicit review/save behavior on the final step

The create experience should feel linear and supportive, not wizard-like in a brittle or over-engineered way.

The progress treatment is important and should be made explicit:

- the admin should always be able to see:
  - current step
  - total number of steps
  - which steps are already completed
  - which steps remain

So the stepped create flow should include a visible step progress bar or equivalent progress rail, not just a next/back button pair.

This is not just visual polish.
It is part of reducing admin anxiety and helping the create flow feel finite and manageable.

Important guardrails:

- do not split the create flow into independently saved route fragments unless there is a strong product reason
- do not make each step feel like a separate standalone form implementation
- do not introduce unnecessary branching in v1

### 14.3A Step progress component expectations

If the stepped create flow is implemented, the progress UI should be treated as a reusable form component, not as a course-specific visual patch.

Recommended responsibilities:

- show ordered steps
- show active step
- show completed steps
- show remaining steps
- support accessible labels and current-step semantics
- remain visually aligned with the admin design system

The progress UI should be:

- token aware
- theme aware
- template aware where applicable within the admin system

It should not introduce hardcoded colors, spacing, or one-off layout rules outside the established design tokens and semantic styling layers.

Recommended component boundary:

- `FormStepProgress`

Naming matters here.

This should not be framed as an admin-only special case because the same pattern may later be useful for:

- homepage settings setup flows
- future page settings journeys
- other multi-step product configuration forms

So the component should be named according to its form behavior, not the current surface where it first appears.

Implementation expectations:

- `FormStepProgress` must be implemented as a shared reusable component
- it must not be embedded as local markup and local styling inside the course create form
- it must encapsulate the interaction and accessibility semantics expected of the progress treatment
- course create should consume it rather than define its own one-off stepper visuals

This should be planned before implementation if it does not already exist in reusable form.

### 14.4 Edit flow should use section navigation, not steps

Once a course already exists, the admin is no longer being guided through first-time setup.

At that point, steps become less useful and can actively slow down quick edits.

So the edit experience should instead use:

- a single shared form
- section navigation across the top
- one visible section at a time
- fast jumping to the relevant section

This should behave more like a tabbed section editor than a linear wizard.

That gives the admin:

- much lower visual overload
- clear information architecture
- faster targeted edits
- no need to click through unrelated steps just to change one field

### 14.5 Recommended edit sections

The edit experience should use the same conceptual grouping as create, but framed as editable sections rather than steps.

Recommended edit sections:

1. Core details
- title
- slug
- summary
- description
- image
- course type
- subtype label

2. Delivery
- format
- location
- online meeting link
- timezone
- access instructions

3. Schedule and enrolment
- scheduling mode
- scheduling fields appropriate to that mode
- transitional `sessionCount` only if still needed
- capacity
- allow waitlist
- eligibility
- visibility
- registration open date
- registration close date

4. Pricing
- pricing mode
- price
- currency
- requires deposit
- deposit amount
- payment deadline
- status

### 14.6 Edit flow interaction pattern

The edit experience should be one unified form, not multiple isolated tab forms.

That is important for both UX and implementation quality.

Recommended pattern:

- one form element wrapping all course edit sections
- top section navigation used for switching visible content
- one dirty-state model
- one save action
- one cancel-updates pattern

This keeps the edit surface aligned with the admin form standard already established elsewhere in the product.

It also avoids:

- cross-tab synchronization bugs
- accidental partial-save assumptions
- duplicated validation plumbing
- fragmented dirty-state behavior

### 14.6A Edit section navigation component expectations

If the edit flow uses top-level section navigation, that navigation should also be treated as a reusable form pattern rather than a course-only control strip.

Recommended responsibilities:

- show available sections
- show active section
- allow quick switching between sections
- work cleanly with one shared underlying form
- remain responsive on smaller viewports

Recommended component boundary:

- `FormSectionTabs`

Naming matters here too.

This should not be framed as an admin-only special case because the same pattern may later be useful for:

- homepage settings
- other page settings forms
- multi-section operational forms
- future long-form admin editing surfaces

So the component should be named according to its form-navigation role, not the first feature area that happens to use it.

This should also remain:

- token aware
- theme aware
- consistent with the admin design language

Implementation requirements:

- `FormSectionTabs` must be implemented as a shared reusable component
- it must not be simulated through local buttons, ad hoc headings, or course-form-specific styling
- it must provide a consistent reusable tabs contract for section-based form editing
- it must encapsulate:
  - tab semantics
  - active-state behavior
  - keyboard/accessibility behavior
  - layout/responsiveness expectations

This is important because if tabs are implemented locally in one large form, we will almost certainly create inconsistency when the pattern is needed again elsewhere.

If a reusable component is needed, it should be planned before implementation rather than improvised inside the course edit form.

### 14.6B Relationship between tab navigation and unified form state

`FormSectionTabs` should be treated as a navigation primitive, not as a form-state boundary.

That means:

- tabs should control which section is currently visible
- tabs should not split the course edit experience into multiple isolated forms
- tabs should not create separate save buttons per section
- tabs should not introduce partial-save assumptions unless explicitly designed for that behavior later

The intended architecture remains:

- one shared form
- one shared dirty-state model
- one shared validation flow
- one shared save/cancel pattern
- tabs used only to reduce visual and cognitive load

This distinction is important and should remain explicit in implementation planning.

### 14.7 Save and cancel behavior in edit

The save action must remain easy to reach regardless of which section the admin is currently viewing.

The recommended behavior is:

- `Save updates` remains available at all times
- `Cancel updates` appears only when dirty, consistent with the shared admin form standard
- save actions live outside the local section content so the admin is not forced to scroll within a section just to save

This may be implemented as:

- a persistent footer action bar
- or another always-available shared form action region

The key requirement is behavioral, not stylistic:

- quick edits must be easy to save from wherever the admin is working

### 14.8 Conditional disclosure remains required

The create and edit structures above do not mean every field should always be shown at once inside each step or section.

Conditional rendering remains important.

Examples:

- `subtypeLabel` should only appear when useful
- `depositAmount` should only appear when `requiresDeposit = true`
- `paymentDeadline` should only become prominent when the course is paid
- `registrationOpenDate` and `registrationCloseDate` should live together inside the schedule/enrolment area, not in core details
- `accessInstructions` should live in delivery, not be mixed into scheduling fields
- `onlineMeetingLink` should be gated by format
- `location` should be gated by format

So simplification should continue to come from:

- grouping
- steps where appropriate
- section navigation where appropriate
- conditional disclosure

not from flattening everything into one long form or removing needed fields

### 14.9 Form controls to use

Likely controls:

- `Input`
- `Select`
- `SwitchField`
- `SectionRichTextField`
- date inputs or future bounded date-range controls where justified

No page-builder-style repeaters should be introduced lightly.

### 14.10 Design-system requirement

All new course admin UX components introduced by this refactor must remain consistent with the token, theme, and template-based design system.

That includes any new reusable form components such as:

- `FormStepProgress`
- `FormSectionTabs`
- any persistent create/edit action bar if a new shared component is required

Implementation rules:

- use semantic tokens rather than hardcoded visual values
- preserve existing admin primitives where they are already correct
- prefer extending reusable admin patterns over embedding course-specific styling logic
- if a new shared primitive or component boundary is required, it must be planned explicitly before implementation

This is important because the course refactor should strengthen the product system, not create a parallel one-off admin UI language.

---

## 15) Public surface implications

This refactor exists specifically to enable better public course surfaces.

### 15.1 Courses listing implications

The course listing should eventually be able to rely on:

- `summary`
- course type
- format
- location or delivery mode
- schedule presentation
- price
- enrolment availability state

without guessing from vague fields.

### 15.2 Course detail implications

The course detail page should eventually be able to rely on:

- rich description
- structured metadata
- delivery info
- schedule info
- enrolment window state
- price / deposit / payment timing
- capacity / waitlist / sold out state

That is only realistic if the course model is clarified first.

---

## 16) Ordering rules

The current public course ordering is based on:

- `createdAt desc`

That should no longer be the public default.

The future public ordering should instead be based on:

- most recently upcoming courses

This implies:

- schedule-aware ordering
- likely derived from start date / next session date

This should align with the way events now prioritize imminence rather than content creation recency.

---

## 17) What should be treated as legacy

The following current assumptions should be treated as legacy/transitional:

- `scheduleSummary` as the main schedule contract
- `startAt` / `endAt` as the only scheduling representation
- no location
- no format
- no timezone
- no registration window
- no course type
- no richer visibility model
- course ordering by `createdAt`

These may remain temporarily during migration, but they should not drive the new public course planning.

---

## 18) Migration direction

This refactor should be staged carefully.

### Phase 1: Planning and contract locking

- lock the canonical course model
- decide exact visibility values
- decide exact course type taxonomy
- decide whether sessions are introduced immediately or deferred

### Phase 2: Domain and persistence refactor

- update course normalization
- update persistence shape
- preserve compatibility for legacy records where needed
- add visibility-aware course query helpers

### Phase 3: Admin course form refactor

- update create/edit forms
- preserve the shared admin form standard
- add new required fields and conditional validation

### Phase 4: Public data helper layer

- build course equivalents of the public event helpers:
  - availability
  - visibility-aware list/detail access
  - summary helpers
  - CTA state helpers

### Phase 5: Public course sections

- plan and implement `CoursesListingSection`
- plan and implement `CourseDetailsSection`

---

## 19) Open implementation decisions

These still need to be locked before implementation begins.

### 19.1 Should sessions become first-class in v1?

Options:

- A. keep scheduling-mode fields on the course record for v1
- B. introduce `course_sessions` now

Recommendation:

- decide this explicitly before code changes
- do not drift into a half-session model accidentally

### 19.2 Exact course type taxonomy

Needs a deliberate list, not improvisation.

### 19.3 Exact visibility semantics for `invite-only` and `private`

These should be defined before the admin form and query rules are changed.

### 19.4 Deposit behavior depth

Need to decide whether v1 should:

- simply capture deposit intent/data
- or actually drive payment workflow behavior

### 19.5 Whether `sessionCount` survives v1 as a transitional field

This depends heavily on the session decision.

### 19.6 How much conditional disclosure the course form should use

This is now an explicit UX decision, not an incidental implementation detail.

We already know the following fields remain in scope:

- `subtypeLabel`
- `registrationOpenDate`
- `registrationCloseDate`
- `paymentDeadline`
- `requiresDeposit`
- `depositAmount`
- `accessInstructions`

So the remaining design question is:

- how much of this should be immediately visible vs progressively revealed in v1

The recommendation of this plan is:

- keep them all in scope
- reveal them with clear conditional logic where appropriate
- do not drop them simply to make the form shorter

---

## 20) Recommended next step after this doc

Before planning `CoursesListingSection`, the next step should be:

- lock the canonical course scheduling approach
  - especially whether sessions are introduced now or deferred

Once that is decided, we should:

1. finalize this course domain model
2. refactor the course domain/admin model
3. then plan `CoursesListingSection`

That is the correct order if we want the public course journey to land on a durable foundation rather than another transitional one.
