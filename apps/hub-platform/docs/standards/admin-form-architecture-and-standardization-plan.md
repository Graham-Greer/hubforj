# Admin Form Architecture And Standardization Plan

## Status

Draft for review before implementation.

This document is the production-grade refactor plan for admin form architecture across `apps/hub-platform`.

It exists to solve the current fragmentation in:

- dirty-state handling
- submit-button behavior
- save feedback
- field validation surfacing
- media field integration
- controlled vs uncontrolled field patterns
- page settings growth
- performance characteristics of large admin forms

This plan is intentionally detailed. It is not an MVP cleanup note. It should be treated as the implementation source of truth for admin form standardization.

## 1) Problem Statement

The admin currently has multiple incompatible form architectures:

- forms using `useDirtyFormState`
- forms implementing local dirty logic manually
- forms with no dirty-state handling at all
- forms that are fully controlled client-side
- forms that are mostly uncontrolled
- forms that show feedback in a footer
- forms that show feedback above the form
- forms that always enable submit
- forms that disable submit unless dirty

This inconsistency creates both product and engineering problems.

### Product problems

- admins cannot predict when a save button should be enabled
- admins cannot predict where validation or success feedback will appear
- the same kind of edit behaves differently across sections of the workspace
- large forms feel less trustworthy when media/library changes do not count as real edits
- “save succeeded” states are not consistently reflected in the visible UI

### Engineering problems

- form logic is being re-authored per route
- field behavior and save behavior are tightly coupled in page-level files
- page settings architecture is vulnerable to route-by-route drift
- media field integration is fragile because it is not normalized into one form standard
- future routes such as rebuilt `About`, `Events`, `Courses`, and `Contact` risk repeating this divergence

The goal of this refactor is to make admin forms predictable, reusable, performant, and maintainable.

This is a standardization refactor, not a rewrite-from-scratch exercise.

Existing field implementations must be respected unless a field is itself incorrect, missing, or in conflict with an agreed section/component contract.

## 2) Product Standard We Are Targeting

The desired admin UX standard is:

1. each full edit/create form starts in a clean state
2. save/submit actions are disabled until the form becomes meaningfully dirty
3. required fields are communicated clearly in the UI
4. server validation remains authoritative
5. feedback appears in a predictable location near the submit actions
6. on successful save, the form returns to a clean state and the visible values match the saved values
7. media picker changes, toggles, hidden inputs, and rich text changes all participate in dirty tracking
8. shared logic is not rebuilt per page
9. page settings forms are extensible by page, not trapped in hero-only special cases

For avoidance of doubt:

- this standard applies to full admin forms
- small inline row/action forms are a separate class and should follow a separate compact standard

## 3) Form Taxonomy

We should stop treating all forms as one category.

There are at least two legitimate classes of admin form in this codebase.

### A. Full forms

These are multi-field create/edit experiences.

Examples:

- branding
- site settings
- homepage settings
- events create/edit
- courses create/edit
- testimonials create/edit
- what-we-do create/edit
- future page settings forms

These need:

- dirty-state tracking
- disabled submit when clean
- stable footer feedback
- consistent required indicators
- saved-state reconciliation
- reusable snapshot logic

### B. Inline action forms

These are small operational actions embedded in tables/cards/workspace sections.

Examples:

- attendance status update
- registration status update
- membership payment status update
- membership assignment update
- invite resend/revoke
- support mode exit
- member status transition

These do not necessarily need full dirty-state architecture, but they do need a consistent compact standard.

They need:

- predictable pending states
- predictable compact feedback
- no surprising page refreshes
- clear separation between destructive and non-destructive actions

This document focuses primarily on the full-form system, but it also defines the inline-action standard so the admin remains coherent.

## 4) Target Architecture

We should standardize admin form behavior through a small set of reusable layers.

### 4.1 Full-form architecture

Every full form should be built from the following pieces:

1. form state contract
2. form snapshot utilities
3. shared dirty/save hook
4. shared footer feedback/action layout
5. structural section scaffolding for repeated admin form hierarchy
6. optional field-level composition helpers only where reuse is truly stable

The page-level form should mostly declare:

- initial values
- server action
- fields
- user-facing labels

The page-level form should not be reimplementing:

- dirty comparison logic
- success reconciliation logic
- media dirty handling patterns
- save button rules
- feedback scrolling logic

This does not mean the page-level form field content should be rewritten from zero.

In most cases, the existing field implementations should be preserved and reorganized into the new standard rather than replaced wholesale.

The page-level form should usually remain explicit about its fields.

This is especially important for page settings forms, where different editable sections on the same page may:

- expose different subsets of fields
- need different labels and hints for admins
- have different required-field rules
- evolve independently over time

So the core reuse target is not identical field groups everywhere.

The core reuse target is:

- form behavior
- form structure
- feedback placement
- snapshot/save handling
- field integration contracts

### 4.2 Inline-action architecture

Inline action forms should use a separate lighter pattern.

They should not be forced into the full snapshot/dirty system unless the action truly edits a multi-field record inline.

They should instead share:

- compact pending button behavior
- compact error/success rendering
- stable placement contract
- optional optimistic UI hooks where safe

## 5) Proposed Reusable Building Blocks

### 5.1 `useAdminDirtyForm`

We should replace ad hoc dirty implementations with a stronger shared hook.

Current state:

- `useDirtyFormState` already exists
- `HomepageSettingsForm` does not use it
- some edit forms still need extra manual handling for media/rich text updates

Target hook responsibilities:

- store current saved snapshot
- expose `formRef`
- expose `isDirty`
- expose `updateDirtyState`
- expose `markSaved`
- expose optional `resetToSnapshot`
- expose optional `replaceSavedSnapshot`

The hook should remain small and not absorb field-level behavior.

It should not know about:

- specific page settings structures
- media assets
- rich text
- domain-level validation

It should only own snapshot comparison and saved-state transitions.

### 5.2 Snapshot utilities per form family

Each form still needs explicit snapshot logic, but we should reduce repetition.

We should introduce a reusable helper pattern such as:

- `createFormSnapshotFromKeys(form, keys)`
- `createSavedSnapshotFromKeys(baseValues, values, keys)`

This avoids every form re-writing the same `Object.keys(...).reduce(...)` shape.

This should live in a shared admin-form utility module, not page-local files.

Special cases such as rich text normalization can still opt in locally.

### 5.3 `AdminFormFooter`

We should introduce a reusable footer component for full forms.

Responsibilities:

- render error message
- render success message
- render actions area
- ensure stable spacing and placement
- provide a consistent scroll target

This component should standardize:

- footer message placement
- footer actions row
- relationship between submit and secondary buttons

It should be reusable across:

- site settings
- branding
- homepage settings
- page settings
- content-type edit forms

### 5.4 `AdminFormSection`

We should strongly consider a thin presentational wrapper for grouped sections inside large forms.

Responsibilities:

- title
- optional description
- grouped content spacing

This is especially valuable for:

- site settings
- homepage settings
- future page settings

This would reduce repeated `section` / `h2` / `styles.group` scaffolding and make large forms easier to scan consistently.

### 5.5 `AdminFormSeparator`

We should strongly consider a simple section separator primitive for long forms.

Responsibilities:

- visually separate major editable sections
- reduce perceived density in large forms
- help admins understand progression through the form

This is especially valuable for:

- homepage settings
- future page settings forms
- any longer settings surface that edits multiple conceptual sections

### 5.6 Optional field-level composition helpers

Field-level reuse should be used sparingly and only where the content contract is truly stable.

This is the exception, not the default.

Examples of places where reuse may still be justified:

- hero media
- hero eyebrow
- hero title
- hero description
- action link field blocks

But even here, we should be cautious.

If a helper becomes too opinionated about labels, hints, required rules, or exact included fields, it stops being a helpful abstraction and becomes a source of drift.

So any field-level helper must remain:

- opt-in
- configurable
- lightweight
- non-authoritative

Non-responsibilities of any field-level helper:

- save logic
- page-specific validation
- page-level defaults
- route-specific action fields

The authoritative source of truth for field shape must remain the planned section/component contract.

### 5.7 Media-field integration contract

`MediaAssetField` should support a clear, reusable admin-form contract:

- it can operate in uncontrolled mode
- it can operate in controlled mode when explicitly asked
- it can always notify the parent form of asset/alt changes without forcing controlled mode

This is essential because hidden input updates via pickers/uploads must count as real edits.

This contract should be documented and reused consistently anywhere `MediaAssetField` appears inside a full form.

### 5.8 Rich text integration contract

Any rich text field used in full admin forms must define:

- how the saved snapshot is normalized
- how dirty changes are triggered
- what constitutes meaningful content vs empty content

This should be part of the full-form standard, not solved ad hoc inside whichever page first uses rich text.

## 6) Validation Strategy

Validation needs to remain layered.

### 6.1 Server validation remains authoritative

All important validation must continue to live in:

- domain normalization
- server actions

This ensures correctness regardless of client state.

### 6.2 UI validation signaling must be consistent

Every full form should clearly signal required fields through the same UI convention.

That means:

- `required` attribute where appropriate
- `requiredIndicator` / `Required` mark shown consistently
- hints that clarify conditional requirements where needed

Examples:

- event title
- event start/end dates
- category
- site name
- SEO title/description

### 6.3 Conditional validation should be explained at field level

Examples:

- paid pricing requires price
- homepage section replacement requires certain core fields
- future route page settings may allow blank values to fall back to system defaults

If the server has a rule, the UI should help the admin understand it before submit.

## 7) Dirty-State Standard

### 7.1 Full forms

All full forms should:

- initialize clean
- become dirty only when the current serialized form snapshot differs from the saved snapshot
- disable submit when clean
- return to clean after successful save

### 7.2 Save success reconciliation

On successful save:

- update the saved snapshot
- update any internal refs to the new canonical saved values
- ensure the visible field UI reflects the newly saved values

This is especially important for uncontrolled inputs and any field with local UI state.

Examples:

- pricing mode toggles
- media pickers
- switch fields
- rich text editors

### 7.3 Dirty-state must include non-typing interactions

Dirty tracking must respond to:

- text input
- select change
- switch/toggle change
- media picker selection
- media upload
- media alt edit
- rich text changes

If a user performs a meaningful edit, the save button must reflect it immediately.

## 8) Performance Considerations

This refactor must improve consistency without making the admin heavy or overly client-driven.

### 8.1 Prefer uncontrolled inputs for large forms

For large content/settings forms, uncontrolled inputs plus snapshot comparison remain the right baseline.

Why:

- fewer re-renders per keystroke
- simpler large-form composition
- lower client overhead
- good fit for form-action architecture

Controlled inputs should be used selectively when the UI genuinely needs them.

Examples:

- dependent UI where a field changes visible neighboring controls
- constrained custom widgets
- cases where local immediate state is part of the experience

### 8.2 Keep server actions as the write path

The admin should continue to rely on:

- server actions
- normalized payloads
- cache revalidation

We do not want a client-heavy mutation layer for standard content/settings forms.

### 8.3 Avoid full route refreshes for standard save behavior

Patterns like `router.refresh()` after save should not be the norm for full forms.

Why:

- unnecessary server/client work
- inconsistent UX
- can reset local context in surprising ways

Use save-state reconciliation in-form wherever possible.

### 8.4 Separate field groups from form controllers

Field groups should remain presentational and focused.

They should not own:

- persistence
- saved-state logic
- route-level behavior

This keeps file sizes down and prevents monoliths.

## 9) Page Settings Architecture

Page settings need special clarity because they will grow route by route.

### 9.1 Do not create hero-only page forms as the long-term pattern

A page settings form should remain page-shaped, not hero-shaped.

Why:

- the route will almost certainly gain more settings later
- a hero-only form creates an architectural dead end
- it guarantees another future form refactor for the same page

So for `/events`, the correct long-term shape is:

- `EventsPageSettingsForm`

And inside it:

- clearly structured explicit fields for the route hero
- future route-specific sections later if needed

The better default should be:

- explicit field markup inside a strongly structured page form
- not a library of rigid reusable field groups

This should still preserve the current field implementations where they are already correct.

### 9.2 Page settings forms should prioritize hierarchy over abstraction

As page settings forms grow, the admin should not experience them as one long wall of inputs.

So page settings forms should be structured with clear hierarchy:

1. section title
2. optional section description
3. that section’s fields
4. a clear visual separator
5. the next section

This is the primary mechanism for keeping larger page forms approachable.

In other words:

- do not over-abstract the field content
- do standardize the structure around the field content

### 9.3 Keep page hero defaults system-driven

For routes like `/events`, system defaults should remain valid when admin fields are blank.

That means:

- empty admin values do not break the route
- route hero can still render a strong default state

### 9.4 Respect route-specific exceptions

The page settings standard must allow constrained route behavior where needed.

Example:

- events page hero should not expose CTA actions in v1

That is a valid route-specific exception and should be modeled intentionally, not hacked around.

## 10) Current Admin Form Audit Classification

### 10.1 Full forms already near target

- `SiteSettingsForm`
- `CreateEventForm`
- `EditEventForm`
- `CreateWhatWeDoForm`
- `EditWhatWeDoForm`
- `CreateTestimonialForm`
- `EditTestimonialForm`

These are closest to the desired standard, though not all are fully aligned.

### 10.2 Full forms requiring structural refactor

- `HomepageSettingsForm`
- `BrandingSettingsForm`
- `CreateCourseForm`
- `EditCourseForm`
- page-level settings forms that still drift toward narrow one-off editors instead of page-shaped form ownership

These should not just receive piecemeal fixes. They need to be brought onto the shared standard.

### 10.3 Inline forms requiring separate compact standard

- `AttendanceStatusForm`
- `RegistrationStatusForm`
- membership plan create/edit/delete flows
- membership assignment/payment status forms
- admin invite lifecycle actions
- member state transitions
- support mode exit

These should be standardized separately and should not be forced into the full-form model unless they become true editors.

## 11) Detailed Inconsistencies To Resolve

### 11.1 Dirty-state inconsistency

Problems:

- some forms use `useDirtyFormState`
- homepage uses custom local logic
- branding uses controlled local values and no dirty-state standard
- courses have no dirty-state handling
- payment plan forms have no dirty-state handling

Target:

- all full forms use the same dirty-state architecture

### 11.2 Submit enablement inconsistency

Problems:

- some full forms disable submit until dirty
- some do not
- some allow resubmitting identical content endlessly

Target:

- every full edit/create form disables submit unless dirty

### 11.3 Feedback placement inconsistency

Problems:

- some forms render messages above the form
- some render them in a footer
- some inline forms render messages beside controls

Target:

- full forms use one footer feedback pattern
- inline forms use one compact feedback pattern

### 11.4 Success reconciliation inconsistency

Problems:

- some forms update saved state cleanly
- some use `router.refresh()`
- some have no visible success handling
- some may visually drift after save due to uncontrolled fields/local UI state

Target:

- full forms reconcile saved values in place
- visible UI matches saved data without refresh

### 11.5 Required-field surfacing inconsistency

Problems:

- server-required fields are not always visibly marked required in the UI

Target:

- schema-required fields always show required affordance in the UI

### 11.6 Media-field integration inconsistency

Problems:

- some forms rely on generic DOM events
- some forms do not wire media changes into dirty-state explicitly
- controlled vs uncontrolled behavior is not standardized

Target:

- one documented integration contract for media fields inside full forms

### 11.7 Field-group reuse inconsistency

Problems:

- hero field rendering is duplicated
- action link rendering is local to homepage settings
- create/edit forms often duplicate nearly identical snapshot helpers

Target:

- repeated helpers are extracted only when the reuse is real and stable
- page settings forms remain explicit where that improves clarity and avoids overfitting abstractions
- structural hierarchy is standardized even when field markup remains page-specific

### 11.9 Rewrite risk during standardization

Problems:

- it is easy to mistake architecture cleanup for permission to rebuild forms from scratch
- unnecessary field rewrites increase regression risk
- replacing already-correct fields creates churn without improving the admin UX

Target:

- preserve current field implementations wherever they are already correct
- refactor the surrounding behavior and structure first
- only change field implementations when:
  - the field itself is broken
  - the field conflicts with the agreed section/component contract
  - the field’s UX is materially wrong

### 11.8 Section/component contract drift risk

Problems:

- admin forms can drift from planned section/component contracts if fields are improvised ad hoc
- the same underlying content contract may be labeled or validated inconsistently across forms
- required rules may diverge from the agreed section plans

Target:

- admin fields must always derive from the relevant planned section/component contract
- where a section uses `SectionHeader`, the admin editing surface must expose the correct `SectionHeader` fields
- required rules must align with the section/component plan, not local guesses
- page-specific labels and hints may vary, but the underlying field contract must not

## 12) Proposed Shared Modules / Components

These are the likely reusable pieces we should formally introduce or evolve.

### Shared hooks/utilities

- `useAdminDirtyForm` or evolve `useDirtyFormState`
- `admin-form-snapshots.js`
- `admin-form-media.js` helper functions if needed

### Shared layout/presentation

- `AdminFormFooter`
- `AdminFormSection`
- `AdminFormActions`
- `AdminFormSeparator`

### Shared field groups

- field groups are optional and should be introduced only when the contract is stable enough to justify them
- `ActionLinkField` may remain a field-level helper because it already represents a bounded repeated sub-structure
- future `AddressFieldGroup` or `HoursFieldGroup` should only be introduced if the UX and data model justify them
- page settings forms should not depend on rigid field-group abstractions for every editable section

### Shared compact action pattern

- a compact inline action wrapper for status/payment/update rows if the repetition proves stable

## 13) Migration Strategy

This refactor should not be done randomly by page.

It should move in layers.

### Phase 1: establish the standard

1. finalize the full-form standard
2. finalize the inline-action standard
3. implement shared hook/utilities/components:
   - upgraded dirty hook
   - snapshot utilities
   - footer component
   - section wrapper if approved

### Phase 2: migrate the core settings surfaces

1. `HomepageSettingsForm`
2. `BrandingSettingsForm`
3. `SiteSettingsForm`
4. page settings forms beginning with `Events`

Reason:

- these are the most architecturally important forms
- they influence every new route/page setting we add

### Phase 3: migrate content-type editors

1. testimonials create/edit
2. what-we-do create/edit
3. events create/edit
4. courses create/edit

Reason:

- these are repeated domain editors
- they benefit heavily from one standard

### Phase 4: migrate inline action forms

1. attendance
2. registration status
3. membership payment and assignment
4. invite actions
5. member state transitions
6. payment plan management

Reason:

- these should follow a compact action standard rather than the full-form system

## 14) Guardrails During Implementation

To prevent drift during the refactor:

1. no new full admin form should be introduced without the shared dirty/save pattern
2. no new page settings form should be hero-only unless the page is provably hero-only forever
3. page settings forms should default to explicit field markup inside standardized structural sections
4. if field-level helpers are introduced, they must remain presentational and must not absorb persistence logic
5. admin field contracts must follow the planned section/component contracts exactly
6. route-specific exceptions must be explicit
7. media/rich-text fields must define how they participate in dirty-state
8. controlled inputs should be introduced only when the UX genuinely requires them
9. forms should not be rebuilt from scratch during standardization
10. current field implementations should be preserved unless they are incorrect, missing, or contract-breaking

## 15) Quality Gates

Every migrated full form should pass these checks:

### UX checks

- button starts disabled when form is clean
- any meaningful change enables submit
- save returns form to clean state
- success feedback appears in footer
- error feedback appears in footer
- feedback scrolls into view
- visible field values match saved state after save
- long page forms are broken into clear sections with visual separation
- page settings forms are easy to scan without feeling like one continuous block
- existing correct fields have been preserved rather than unnecessarily replaced

### Validation checks

- required fields visibly marked
- server validation errors surface correctly
- conditional validation is understandable
- field shape matches the planned section/component contract
- required rules match the planned section/component contract

### Interaction checks

- media picker marks form dirty
- media upload marks form dirty
- toggles/switches mark form dirty
- selects mark form dirty
- rich text marks form dirty

### Performance checks

- no avoidable full-route refresh after normal save
- no large-form controlled re-render churn unless justified
- field groups remain modular and not monolithic

## 16) Open Design Decisions Requiring Confirmation

These should be confirmed before implementation begins.

1. Naming:
- do we keep `useDirtyFormState` and evolve it
- or rename to `useAdminDirtyForm` to make the standard explicit

2. Footer abstraction:
- should we introduce `AdminFormFooter`
- or keep footer markup inline but standardized through strict conventions

3. Section abstraction:
- should we introduce `AdminFormSection`
- or keep `styles.group` markup inline

4. Separator abstraction:
- should we introduce `AdminFormSeparator`
- or handle section separation purely in section wrapper styling

5. Inline action standard:
- do we want explicit compact success states for row forms
- or only compact error/pending behavior

6. Page settings architecture:
- confirm that page settings forms should be page-shaped and extensible, not hero-only
- confirm that page settings forms should prefer explicit section field markup over reusable field groups by default

7. Section/component contract enforcement:
- confirm that admin field sets must be derived directly from planned section/component contracts, with local labels/hints allowed but not local field-shape invention

8. Branding scope:
- confirm whether `BrandingSettingsForm` remains separate from `SiteSettingsForm`
- or whether there is any future intent to consolidate some parts of those surfaces

9. Preservation rule:
- confirm that implementation should preserve existing correct field implementations and refactor only the surrounding form architecture/behavior unless a field itself is wrong

## 17) Immediate Next Step

Before code refactoring begins, we should do one short confirmation pass on the shared building blocks:

1. full-form standard
2. inline-action standard
3. whether we are introducing:
   - `AdminFormFooter`
   - `AdminFormSection`
   - `AdminFormSeparator`
   - upgraded dirty hook name/shape
4. confirm page settings architecture should be page-shaped, not hero-only
5. confirm page settings forms should prioritize structural hierarchy and explicit field markup
6. confirm admin field contracts must follow planned section/component contracts exactly
7. confirm current correct field implementations should be preserved rather than rebuilt

Once that is confirmed, implementation should start with the settings surfaces, not the smaller content forms.
