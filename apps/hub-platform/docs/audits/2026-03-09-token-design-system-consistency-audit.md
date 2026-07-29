# Token And Design-System Consistency Audit (2026-03-09)

Scope:
- `apps/hub-platform/src/components/ui/*`
- high-traffic admin form surfaces
- the payments membership-plan workspace as the immediate trigger

Authority:
- `docs/roadmap/greenfield-architecture-decision-record-v2.md`
- `docs/roadmap/greenfield-shell-navigation-spec-v2.md`
- token system in `src/app/styles/*`

## Executive Assessment

The app has a credible token foundation, but the field/form layer was not yet strong enough.

The main issue was not a single bad screen. It was that the reusable field primitives were still allowing:
- typography drift between input types
- inconsistent helper-text behavior inside the same form
- duplication of field styling outside the shared UI layer

That is a design-system maturity issue, not just a payments-form issue.

## Rectified In This Slice

### 1. Shared field-control contract

Added a shared field-control style contract for:
- label typography
- control typography
- border, radius, padding, focus, hover
- hint typography

Files:
- `src/components/ui/field-control/FieldControl.module.css`
- `src/components/ui/input/Input.jsx`
- `src/components/ui/select/Select.jsx`
- `src/components/ui/textarea/Textarea.jsx`

Outcome:
- input, select, and textarea now inherit the same token-based baseline instead of drifting by control type

### 2. Membership-plan pricing behavior

The membership-plan form now treats pricing mode as a real domain switch:
- free plans do not render price or currency fields
- paid plans do

This removes the prior "ignored for free plans" helper-text workaround and keeps the form semantically correct.

File:
- `src/components/patterns/hub-payments-workspace/HubPaymentsWorkspace.jsx`

### 3. Helper-text consistency

Rule now applied to the plan form:
- do not selectively add helper text to only one field in a tight grid unless all peer fields in that section follow the same contract

For this form, the correct choice was:
- no helper text on individual plan fields
- conditional field visibility instead

## Remaining Audit Findings

### High priority

1. Media library search field duplicates shared field behavior instead of composing the reusable field contract.
File:
- `src/components/patterns/media-library-workspace/MediaLibraryWorkspace.module.css`

Why it matters:
- this recreates input padding, height, border, font, and focus behavior outside the UI layer
- any future field updates can drift again

Recommended action:
- migrate the media search input to shared field-control primitives or a dedicated search-field primitive built on top of them

2. Icon sizing still uses hardcoded rem values rather than tokenized sizing.
File:
- `src/components/ui/icon/Icon.module.css`

Why it matters:
- icon sizing is part of the shared visual rhythm
- rem literals here bypass the token system

Recommended action:
- introduce semantic icon size tokens and update the icon primitive to consume them

### Medium priority

3. Page-header typography still mixes token usage with hardcoded clamp values.
File:
- `src/components/patterns/page-header/PageHeader.module.css`

Why it matters:
- heading scale is a core design-system concern
- screen-level hero/page headers should use tokenized responsive typography contracts where possible

Recommended action:
- define responsive heading tokens or semantic page-header typography tokens

4. Some layout widths and control widths remain hardcoded across admin/pattern files.
Examples:
- `src/app/(admin)/[hubSlug]/admin/events/page.module.css`
- `src/app/(admin)/[hubSlug]/admin/courses/page.module.css`
- `src/components/patterns/event-registration-workspace/RegistrationStatusForm.module.css`
- `src/components/patterns/course-registration-workspace/RegistrationStatusForm.module.css`

Why it matters:
- repeated fixed widths indicate missing layout tokens or missing utility patterns

Recommended action:
- define semantic sizing tokens for common narrow/wide control widths

5. Blur effects and certain decorative values are repeated as literals.
Examples:
- `src/components/ui/modal/Modal.module.css`
- `src/components/patterns/public-shell/PublicShell.module.css`

Why it matters:
- if these are intentional system effects, they should be tokenized
- if they are one-offs, they should be challenged and minimized

## Design-System Rules To Enforce Going Forward

1. Field controls must inherit from one shared token-driven contract.
2. Form sections should not mix helper-text presence arbitrarily between peer fields.
3. Conditional business logic should hide irrelevant fields instead of showing disabled or ignored inputs with explanatory hints.
4. Pattern-level custom fields are acceptable only when built on top of shared primitives, not when restyling controls from scratch.
5. Repeated literal sizes, effects, and responsive type values should be promoted to semantic tokens once they appear in more than one place.

## Recommended Next Cleanup Sequence

1. Migrate media-library search and any other custom field surfaces onto the shared field-control contract.
2. Tokenize icon sizes.
3. Tokenize page-header responsive typography.
4. Sweep repeated fixed control widths into semantic sizing tokens.
