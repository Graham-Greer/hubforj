# FormStepProgress Plan

## Status

Proposed

## Purpose

Define a reusable `FormStepProgress` component for guided multi-step form experiences.

This component is being introduced first to support the planned course create flow, but it must be designed as a durable shared form component that can later support:

- course creation
- large page-settings setup flows
- operational onboarding/setup forms
- future multi-step admin workflows

The component must be production-grade, accessible, token-aware, theme-aware, and visually consistent with the existing design system.

## Why This Component Exists

Once a form becomes complex enough to justify a stepped flow, the progress treatment stops being decorative and becomes part of the usability contract.

Admins need to understand:

- where they are in the process
- what they have already completed
- what remains
- whether the flow feels finite and manageable

Without a dedicated reusable progress component, we risk:

- ad-hoc progress bars embedded into individual forms
- inconsistent step labeling and completion treatment
- weak accessibility semantics
- inconsistent spacing, active states, and responsive behavior
- course-specific UI logic that cannot be reused later

`FormStepProgress` exists to prevent that drift and make stepped forms feel reliable and intuitive.

## Component Role

`FormStepProgress` should be a reusable form-navigation indicator.

It should communicate progress and current position inside a stepped flow.

It should not:

- own the stepped form state itself
- own form validation rules
- decide whether a step is complete based on business logic
- own step content layout
- own next/back/save actions
- own route-level navigation

Those responsibilities belong to:

- the consuming stepped form controller
- shared form state/runtime
- the form action/footer layer

So `FormStepProgress` is not a wizard engine.
It is a progress/navigation presentation component with a clear and bounded contract.

## Primary Use Case

The first target use case is:

- course creation flow

Expected initial structure:

- create route/form shell
  - `FormStepProgress`
  - current step content
  - create-flow actions

Likely future reuse:

- onboarding/setup flows
- long structured create forms
- potentially future page settings setup journeys

## User Experience Goals

`FormStepProgress` should make a stepped form feel:

- clear
- finite
- calm
- easy to resume mentally

The admin should never need to wonder:

- how many steps exist
- which step they are currently on
- whether prior steps are done
- whether they are near the end

So the component must always present:

- current step
- total number of steps
- completed steps
- remaining steps

## Responsibilities

`FormStepProgress` should own:

- ordered step presentation
- active step indication
- completed step indication
- remaining step indication
- responsive layout for step labels/progress treatment
- accessible current/completed semantics
- token/theme-aware visual states

`FormStepProgress` should not own:

- field validation
- dirty-state behavior
- step transition logic
- save/cancel actions
- server state
- route transitions

## Information Model

Each step should be representable through a small, explicit metadata contract.

Likely step item shape:

- `id`
- `label`
- `description`
  - optional, if the design needs supporting context
- `status`
  - `upcoming`
  - `current`
  - `complete`
  - optional future `error` if we later need validation-aware summaries
- `optional`
  - boolean, only if we genuinely support optional steps later

Initial recommendation:

- keep the first version simple
- do not introduce optional-step semantics unless a real workflow needs them

## Required UX Behavior

### Always-visible progress context

The component should clearly surface:

- `Step X of Y`
- visible step labels in order
- completion state for prior steps
- active state for current step

This should remain obvious even when the flow has only four steps.

### Completion treatment

Completed steps should feel clearly distinct from upcoming steps.

That distinction should come from the design system through:

- color/state tokens
- iconography or progress markers where appropriate
- typography contrast/state treatment

The component should not rely on fragile local color choices.

### Current step treatment

The current step must be the strongest visual state.

It should be obvious at a glance:

- which step is active
- which content panel currently corresponds to that step

### Upcoming steps

Upcoming steps should remain visible enough to help orientation, but visually subordinate to:

- completed steps
- active step

## Interaction Model

This needs an explicit product decision boundary.

### Recommended v1 behavior

For v1, `FormStepProgress` should support:

- display of all steps
- click/select navigation only if the consuming flow explicitly allows it

Default recommendation:

- backward navigation should be allowed
- forward jumping should be allowed only if prior requirements are satisfied and the consuming flow supports it

This means the component should not hardcode one interaction philosophy.

Instead, it should support a bounded API where the form decides:

- whether steps are clickable
- whether only completed/current steps are selectable
- whether progress is informational only

### Why this matters

Some flows should allow flexible revisiting.
Others may want stricter linearity.

`FormStepProgress` should stay reusable across both without becoming overly abstract.

## Accessibility Requirements

This component must be built accessibly from the start.

Requirements:

- current step must be communicated to assistive technology
- interactive steps, if enabled, must be keyboard reachable
- active and completed states must not rely on color alone
- focus states must be visible and token-driven
- step labels must remain readable at common admin viewport widths

If steps are interactive, the implementation should use a semantically appropriate pattern rather than a row of generic styled buttons with no clear relationship.

Accessibility should not be treated as follow-up polish.

## Responsive Behavior

### Desktop / wider admin layouts

The component should support a horizontal progress layout where all step labels can be understood in sequence.

The preferred feeling is:

- clear linear progress
- enough breathing space between steps
- no cramped, low-contrast UI

### Tablet and narrower layouts

The component should remain readable and navigable without collapsing into an unusable ribbon.

Potential strategies:

- condensed labels
- horizontal scroll only if done intentionally and accessibly
- wrapping to a stacked or segmented format if that reads better

The exact responsive behavior should be chosen intentionally in implementation, but the key rule is:

- do not let responsiveness degrade the progress clarity

### Mobile/admin narrow widths

If a stepped flow is used on narrow widths, the admin must still understand:

- current step
- total steps
- surrounding progress context

It is acceptable to simplify the visual density on small widths, but not to hide core progress understanding.

## Visual Design Direction

The component should feel:

- structured
- calm
- precise
- supportive rather than flashy

This is an admin productivity component, not a marketing progress indicator.

The visual direction should take inspiration from explicit linear progress patterns, but it must still remain clearly aligned with the admin portal design language.

That means:

- clear step markers
- clear completed/current/upcoming distinction
- a visible connecting progress rail
- labels that stay closely associated with each step

But it does **not** mean copying external stepper visuals literally.

It should visually align with:

- existing admin surfaces
- semantic token usage
- form action hierarchy
- neutral, readable state transitions

### Marker shape direction

The step marker shape should align with the admin portal’s existing component language rather than defaulting to circular markers.

Recommended direction:

- use a compact square or rounded-rectangle marker
- apply border radius consistent with existing input and control shapes
- keep the marker large enough to show:
  - a step number
  - or a completed-state check icon

This is preferable to introducing circles if circles would feel visually inconsistent with:

- admin inputs
- switches
- buttons
- current surface geometry

So the marker should feel like it belongs to the admin design system first, and to a stepper second.

### Progress rail direction

The progress rail should be clearly visible and slightly more substantial than a hairline divider.

Recommended direction:

- a thicker rail than a standard border line
- strong enough to communicate continuity between steps
- subtle enough not to overpower the marker and label states

The rail should support at least two visual states:

- completed-progress rail
- upcoming/inactive rail

These should be expressed through semantic tokens, not hardcoded styling.

### State treatment direction

The component should visually distinguish:

- completed steps
- current step
- upcoming steps

Recommended direction:

- completed step:
  - filled marker
  - check icon
  - completed rail segment
- current step:
  - strongest emphasis
  - bordered or highlighted marker
  - clear label emphasis
- upcoming step:
  - quieter marker and label treatment
  - lower visual priority than completed/current states

This should make the stepped flow readable at a glance without relying on decorative styling.

The design should avoid:

- novelty for its own sake
- over-ornamented progress markers
- overly subtle active/completed states
- hardcoded colors or spacing that bypass the design system

## Design-System Requirements

`FormStepProgress` must be:

- token aware
- theme aware
- compatible with the broader template/design-system direction where applicable

Implementation rules:

- use semantic tokens rather than hardcoded visual values
- spacing should come from shared spacing scales
- state colors should come from semantic state/surface/text tokens
- borders, radii, and shadows must align with the design system

Specific expectations:

- marker border radius should come from the same semantic radius direction used by admin controls
- progress rail thickness should be tokenized or derived from semantic sizing rules rather than chosen ad hoc
- marker sizing, label spacing, and rail spacing should be based on the shared spacing scale
- completed/current/upcoming states should be driven by semantic text, border, background, and accent tokens
- hover/focus/active states, if steps are interactive, must also be token-driven

This component should strengthen the system, not create a parallel visual language.

## Likely API Direction

The API should stay bounded and practical.

Likely props:

- `steps`
- `currentStepId` or `currentStepIndex`
- `onStepSelect`
  - optional
- `interactive`
  - optional
- `className`

Potential future props only if truly needed:

- `ariaLabel`
- `size`
- `orientation`

Initial recommendation:

- do not over-generalize the first API
- support the actual stepped-form needs we know are coming

## Completion Semantics

The component should not infer completion from form internals.

The parent stepped-form controller should pass completion state explicitly.

That keeps responsibilities clean and avoids coupling the component to:

- validation engines
- form libraries
- local route state

This is important for reuse and testing.

## Relationship To Form Actions

`FormStepProgress` should sit above or alongside the stepped form content, but it must remain clearly distinct from:

- next/back controls
- save/publish controls
- form footer actions

Those actions should remain owned by the form flow controller or shared footer pattern.

The component should help orientation, not absorb action responsibilities.

## Course Create-Specific Expectations

For the planned course create flow, `FormStepProgress` should be able to represent:

1. Core details
2. Delivery
3. Schedule and enrolment
4. Pricing

The component should make this four-step structure feel:

- bounded
- easy to understand
- not intimidating

This is one of the main reasons the component needs to be handled carefully rather than improvised.

## What This Component Must Not Become

`FormStepProgress` should not become:

- a full workflow engine
- a general route stepper for unrelated app shells
- a visual-only marketing component
- a dumping ground for business logic

Keep it narrow and strong.

## Planning and Implementation Guardrails

Before implementation:

- confirm the step metadata contract
- confirm interaction rules for clickable vs informational steps
- confirm responsive behavior expectations
- confirm token/state mappings if any are missing

During implementation:

- build as a shared reusable component
- do not embed it locally in the course create form
- do not hardcode colors or spacing
- test keyboard and responsive behavior deliberately

## Recommended Next Step After This Doc

Before implementing the course create flow, the next steps should be:

1. finalize `FormSectionTabs` planning as the edit-flow companion
2. confirm the course create flow interaction rules for step navigation
3. implement `FormStepProgress` as a shared reusable component
