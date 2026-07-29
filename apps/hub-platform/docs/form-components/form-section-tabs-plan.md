# FormSectionTabs Plan

## Status

Proposed

## Purpose

Define a reusable `FormSectionTabs` component for large edit forms that need:

- clear section navigation
- reduced visual overload
- fast switching between groups of fields
- one unified underlying form state

This component is being introduced first to support the planned course edit experience, but it must remain reusable for future long-form form surfaces such as:

- homepage settings
- page settings forms
- other complex operational edit forms

The component must be production-grade, accessible, token-aware, theme-aware, and easy for admins to navigate confidently.

## Why This Component Exists

Large forms become difficult to use when they rely on one of two extremes:

- a single long page with weak hierarchy
- a stepper that forces linear progression even for simple edits

For editing existing entities, the better UX is often:

- one form
- multiple clearly named sections
- quick movement between them

Without a dedicated reusable tabs component, we risk:

- local button rows pretending to be tabs
- inconsistent active states
- weak accessibility semantics
- different spacing and interaction patterns across forms
- repeated ad-hoc logic each time a large edit form appears

`FormSectionTabs` exists to prevent that drift and give the admin a reliable editing pattern.

## Component Role

`FormSectionTabs` should be a reusable section-navigation component for forms.

It should help the admin navigate between logical groups of fields within one unified form experience.

It should not:

- create separate forms per tab
- own field state
- own save/cancel actions
- own dirty-state logic
- own validation rules
- own section content layout beyond the navigation relationship

Those responsibilities belong to:

- the parent form
- shared form state/runtime
- shared footer/action patterns

So `FormSectionTabs` is not a workflow engine and not a set of isolated tab panels with separate save cycles.

## Primary Use Case

The first target use case is:

- course edit form

Expected initial structure:

- edit form shell
  - `FormSectionTabs`
  - current section content
  - persistent save/cancel actions

Likely future reuse:

- homepage settings
- page settings forms
- any long structured edit form where the admin usually edits one area at a time

## User Experience Goals

`FormSectionTabs` should make long edit forms feel:

- organized
- easy to scan
- easy to jump around in
- low-friction for quick edits

The admin should be able to:

- immediately understand which sections exist
- jump straight to the relevant section
- make targeted updates without scrolling through unrelated content
- always know where save/cancel actions live

This should reduce overwhelm without fragmenting the form into disconnected pieces.

## Responsibilities

`FormSectionTabs` should own:

- ordered section navigation
- active section indication
- switching between sections
- responsive handling of section labels/navigation layout
- accessible tab semantics and focus behavior
- token/theme-aware active/inactive states

`FormSectionTabs` should not own:

- form submission
- validation business logic
- dirty-state behavior
- whether section content is valid
- course-specific or homepage-specific section definitions

## Information Model

Each tab/section should be representable through a small, explicit metadata contract.

Likely tab item shape:

- `id`
- `label`
- `description`
  - optional, if the design benefits from it
- `disabled`
  - optional
- `status`
  - optional future state if we later surface validation/dirty summaries

Initial recommendation:

- keep the first version focused on section navigation
- do not overload the first API with stepper-like completion semantics

## Relationship To Unified Form State

This is one of the most important architectural rules.

`FormSectionTabs` must operate over one shared form.

That means:

- one form element wraps all editable content
- tabs only control which section is currently visible or emphasized
- tabs do not split the form into separately saved panels
- tabs do not create separate dirty states
- tabs do not create separate save buttons per section

The intended architecture is:

- one shared form state
- one validation system
- one save/update action
- one cancel-updates pattern
- section navigation only for information architecture and usability

This must remain explicit in planning and implementation.

## Required UX Behavior

### Clear active state

The current section must be obvious at a glance.

Active treatment should be stronger than inactive treatment through:

- typography/state contrast
- indicator treatment
- token-based active styling

### Easy section switching

Switching between sections should feel fast and low-friction.

The admin should not feel punished for needing to jump between:

- core details
- delivery
- schedule and enrolment
- pricing

### Save actions stay independent

Switching tabs should not move or hide the save/cancel behavior in a confusing way.

The admin must still feel that:

- this is one edit surface
- their changes live in one shared draft state

### Preserve confidence during editing

Section navigation should reduce overload, not create fear that:

- changes in one tab are isolated
- switching tabs might lose work
- saving applies only to the current tab

The UI should reinforce the shared-form model clearly.

## Accessibility Requirements

This component must be built accessibly from the start.

Requirements:

- use appropriate tab semantics if the chosen pattern is true tabbed navigation
- keyboard navigation must be deliberate and tested
- active tab must be communicated to assistive technology
- focus states must be visible and token-driven
- the component must remain understandable at common admin viewport widths

If the implementation chooses a pattern that is closer to segmented navigation than classic tabs, the semantics must still be correct for the chosen interaction model.

Accessibility should be deliberate, not retrofitted.

## Responsive Behavior

### Desktop / wider layouts

The component should comfortably support a horizontal tab row where section labels are easy to scan.

It should feel:

- structured
- clean
- efficient

### Tablet and narrower layouts

The component should continue to work without the tab row becoming cramped or unreadable.

Potential strategies:

- responsive wrapping
- controlled horizontal overflow
- condensed tab styling

The exact solution should be chosen intentionally, but the rule is:

- responsiveness must preserve navigation clarity

### Smaller admin widths

The admin should still be able to:

- see which section is active
- reach other sections easily
- understand that this is a tabbed section model

The component should not degrade into a row of clipped labels with poor usability.

## Visual Design Direction

The component should feel:

- stable
- precise
- low-friction
- consistent with other admin controls

It should visually support productivity and comprehension rather than trying to feel novel.

The design should avoid:

- decorative-only tab treatments
- low-contrast active states
- locally hardcoded color choices
- per-form restyling that changes the interaction feel

## Design-System Requirements

`FormSectionTabs` must be:

- token aware
- theme aware
- consistent with the broader design system

Implementation rules:

- use semantic tokens rather than hardcoded visual values
- use shared spacing and typography scales
- active/inactive/hover/focus states should come from tokenized semantics
- preserve consistency with other reusable form/navigation primitives

This should become part of the reusable form toolkit, not a course-only visual language.

## Likely API Direction

The API should stay bounded and practical.

Likely props:

- `tabs`
- `activeTabId`
- `onTabChange`
- `className`

Potential future props only if a real need emerges:

- `ariaLabel`
- `variant`
- `size`

Initial recommendation:

- keep the first version focused on the needs of long form editing
- avoid over-generalizing before the second use case exists

## Content Relationship

The component should pair naturally with a form section/content structure like:

- `FormSectionTabs`
- visible section panel/content below
- shared form footer/actions outside local section content

The tab component should not own the entire content rendering contract if that would make it overly rigid.

A flexible but bounded composition model is preferable.

## Course Edit-Specific Expectations

For the planned course edit experience, `FormSectionTabs` should be able to represent:

1. Core details
2. Delivery
3. Schedule and enrolment
4. Pricing

The component should help that experience feel:

- manageable
- quick to navigate
- suitable for both small edits and deeper review

## Relationship To Save/Cancel Actions

This is a key UX requirement.

The save action should remain easy to reach regardless of which tab is active.

Recommended pattern:

- `Save updates` remains available at all times
- `Cancel updates` follows the shared dirty-state rules
- actions live outside the local tab content so the admin is not forced to scroll within one section to save

If a shared persistent action region is needed, it should also be planned as a reusable pattern rather than embedded locally into the course form.

## What This Component Must Not Become

`FormSectionTabs` should not become:

- a page-level route navigation system
- a replacement for shared form state management
- a course-only control strip
- a set of independently submitted mini-forms

Keep it narrow and strong.

## Planning and Implementation Guardrails

Before implementation:

- confirm the tab metadata contract
- confirm the responsive navigation behavior
- confirm the semantic model for tabs vs segmented section navigation
- confirm whether any token additions are needed

During implementation:

- build as a shared reusable component
- do not implement tabs locally in the course form with bespoke styling
- test keyboard and focus behavior deliberately
- test the component with realistically long section labels

## Recommended Next Step After This Doc

Before implementing the course edit flow, the next steps should be:

1. confirm any shared persistent action-bar needs
2. finalize the course edit section structure against the course refactor plan
3. implement `FormSectionTabs` as a shared reusable component

