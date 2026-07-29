# Admin Select Implementation Plan

## Goal

Introduce an admin-only custom select pattern for the hub admin portal that is:

- visually aligned with the evolving admin portal surface system
- more consistent with compact menus and other admin overlays
- accessible and keyboard-operable
- safe to roll out gradually without breaking shared/public/platform forms

This plan deliberately avoids replacing the shared native `Select` globally.

## Non-Negotiable Boundaries

- Scope must remain admin-portal only.
- Shared `Select` must remain intact for public-site and platform flows.
- Existing focus ring behavior should remain consistent with current form controls.
- Rollout must be incremental, starting with low-risk admin forms.
- Accessibility must be treated as a first-class requirement, not a follow-up polish pass.

## Current State

The current shared select is a native `<select>` with a custom chevron:

- [Select.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/ui/select/Select.jsx)
- [Select.module.css](/mnt/c/local/community-app/apps/hub-platform/src/components/ui/select/Select.module.css)

It inherits shared field styling from:

- [FieldControl.module.css](/mnt/c/local/community-app/apps/hub-platform/src/components/ui/field-control/FieldControl.module.css)

This is low-risk and accessible by default, but visually limited compared with the admin portal’s custom overlay patterns.

## Proposed Component

Create a new component, admin-only in intent and rollout:

- `AdminSelect.jsx`
- `AdminSelect.module.css`

Recommended location:

- `apps/hub-platform/src/components/ui/admin-select/`

This keeps the pattern clearly separated from the existing shared/native `Select`.

## Interaction Model

Recommended pattern:

- closed state renders as a field-like trigger button
- trigger opens a custom listbox/popover
- options are rendered in a controlled menu surface
- selection updates the visible value and closes the list

Recommended semantics:

- trigger button with `aria-haspopup="listbox"`
- `aria-expanded`
- `aria-controls`
- list container with `role="listbox"`
- options with `role="option"`
- selected option with `aria-selected="true"`

## Accessibility Requirements

Must support:

- `Tab` into and out of the control
- `Enter` or `Space` to open
- `Escape` to close
- `ArrowUp` / `ArrowDown` to move active option
- `Home` / `End` to jump to first/last option
- `Enter` / `Space` to select active option
- outside click dismissal
- focus return to trigger on close
- disabled state

Strongly recommended:

- typeahead matching for option labels

## Visual Design Requirements

The component should align with the admin-only theme layer, not the shared public field look.

Visual expectations:

- trigger should use admin field tokens
- dropdown surface should align with admin compact-menu / overlay surfaces
- list items should have clear hover, active, and selected states
- chevron/icon treatment should remain consistent with current admin iconography
- width should follow field/container width cleanly

## Token Strategy

Do not style this with hardcoded colors.

Introduce admin-only tokens as needed, likely including:

- `--admin-select-trigger-bg`
- `--admin-select-trigger-border`
- `--admin-select-trigger-text`
- `--admin-select-trigger-shadow`
- `--admin-select-menu-bg`
- `--admin-select-menu-border`
- `--admin-select-menu-shadow`
- `--admin-select-option-hover-bg`
- `--admin-select-option-active-bg`
- `--admin-select-option-selected-bg`

If the existing admin field and overlay tokens are already sufficient, prefer reusing them over creating unnecessary new tokens.

## Data/API Shape

The component should be able to cover current admin form use cases without becoming overly abstract.

Recommended props:

- `name`
- `label`
- `hint`
- `options`
- `value`
- `defaultValue`
- `onChange`
- `required`
- `disabled`
- `placeholder`
- `size`
- `className`
- `labelVisibility`
- `reserveHintSpace`

Recommended option shape:

```js
{
  value: "draft",
  label: "Draft",
  disabled: false,
}
```

If needed later, this can be extended to richer option metadata, but v1 should stay simple.

## Form Integration Strategy

To preserve compatibility with existing form posts:

- render a hidden native `<input type="hidden">` carrying the selected value
- use the custom UI only for interaction/presentation

This keeps server actions and form submissions simple.

## Rollout Phases

### Phase 1: Build the component

- scaffold `AdminSelect`
- implement trigger, popover, listbox, option rendering
- wire basic keyboard support
- wire hidden input submission
- connect to admin-only tokens

### Phase 2: Low-risk pilot routes

Adopt in small, low-risk admin forms first:

- admin invite
- branding settings
- action-link settings
- testimonials create/edit
- what-we-do create/edit

Goal:

- validate core behavior
- validate spacing and surface alignment
- validate long-label handling

### Phase 3: Operational forms

Adopt in:

- member membership section
- member membership provisioning
- membership plan manager

Goal:

- validate denser admin workflows
- validate multiple selects on the same screen

### Phase 4: Large content forms

Adopt in:

- event form fields
- course form fields

Goal:

- validate broad coverage across many select instances
- validate more complex admin authoring flows

### Phase 5: Special-case dialogs and panels

Adopt in:

- media library dialogs
- media asset details panel
- other constrained overlay contexts

Goal:

- validate stacking, positioning, and modal interplay

## Risks

### Accessibility regression

Custom selects are significantly more complex than native ones.

Mitigation:

- implement keyboard behavior deliberately
- test with real tab/arrow/escape flows before rollout widens

### Overlay positioning and clipping

Menus inside panels, dialogs, or constrained containers may clip or layer poorly.

Mitigation:

- validate in modal and narrow-column contexts early
- decide whether menu stays inline-positioned or uses a portal

### Form submission mismatch

Custom state can drift from server-submitted value if hidden input handling is sloppy.

Mitigation:

- treat hidden input sync as a first-class contract

### Option list scale

Very long option lists may need scrolling or search later.

Mitigation:

- keep v1 for ordinary select lists
- defer searchable combobox behavior unless clearly needed

## Open Decisions

These should be decided before implementation expands too far:

1. Inline-positioned menu or portaled menu?
2. Typeahead in v1 or v1.1?
3. Exact selected-state styling strategy:
   - checkmark
   - background only
   - both
4. Whether `AdminSelect` should support `sm` and `md` immediately, or `md` first

## Acceptance Criteria

The component is ready for broader rollout when:

- it is visually aligned with admin-only surfaces
- it preserves current focus-ring quality
- keyboard selection works reliably
- selected value submits correctly in forms
- it behaves well in both light and dark mode
- it has been validated in at least:
  - one simple settings form
  - one dense operational admin form
  - one modal/dialog context

## Recommendation

Build `AdminSelect` as a new admin-scoped component and migrate to it gradually.

Do not replace the shared native `Select` globally.

That gives the admin portal the visual control it needs while keeping risk contained.
