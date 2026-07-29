# Testimonials Admin Audit And Cleanup Plan

## Purpose

This document records the current state of the testimonial admin workflow in `apps/hub-platform`, the gaps that matter for the SaaS public-site direction, and the cleanup order that should happen before we plan and implement `TestimonialsSection`.

The goal is not to redesign testimonials as a concept. The goal is to make the testimonial content model and admin experience trustworthy enough that the future public section can depend on it without carrying admin inconsistencies into the public-site system.

## Current State

### Data model

The testimonial model currently supports:

- `quote`
- `authorName`
- `authorRole`
- `authorOrganization`
- `authorImageAssetId`
- `authorImageAlt`
- `status`
- `featured`
- `sortOrder`

This is normalized in:

- `src/lib/domain/testimonials.js`
- `src/lib/data/testimonials.js`

This is a reasonable first-pass model for SaaS public social-proof surfaces.

### Validation

Validation currently exists only at the domain layer.

The enforced requirements today are:

- `quote` is required
- `authorName` is required
- `status` must be one of the supported values

This validation exists in:

- `src/lib/domain/testimonials.js`

The create/edit forms do not currently surface this as a mature admin UX:

- no required field indicators
- no field guidance hints
- no dirty-state handling
- no disabled submit state
- no “saved” acknowledgment state
- save feedback remains the older top-of-form pattern

### Rendering

The record does persist `authorOrganization`, and public surfaces already use it.

However, the admin list currently hides `authorOrganization` when `authorRole` is present because the card meta uses:

- `authorRole || authorOrganization`

instead of composing both values.

So the issue is not persistence. The issue is inconsistent presentation across admin and public surfaces.

### Ordering

Ordering is currently implemented at the data layer and works as follows:

1. `featured` testimonials first
2. ascending `sortOrder`
3. newest `updatedAt` last tie-breaker

This is acceptable for a first public testimonials section and gives us a stable ordering contract.

### Naming

The admin form currently exposes a field labelled `Presentation`, but the actual stored concept is just:

- `featured: boolean`

This wording is not ideal for the current SaaS direction. It obscures the actual meaning and suggests broader display control than the model really provides.

## Audit Findings

### 1. Validation exists, but the form experience does not communicate it well enough

This is the main practical gap.

The server will reject invalid payloads, but the admin experience does not currently make it clear:

- which fields are required
- what each field is for
- when the record has changed
- whether the save actually succeeded

This creates avoidable friction and makes the testimonial workflow feel behind the newer homepage settings flow.

### 2. Admin and public attribution rendering are inconsistent

Public surfaces correctly join role and organization when both exist.

Admin surfaces do not.

This inconsistency makes the admin workflow feel unreliable because the saved data and the admin preview/list do not tell the same story.

### 3. `Presentation` is the wrong label for the current model

The stored concept is a featured toggle, not a presentation system.

If we keep the field, the name should reflect the actual behavior:

- `Featured`
- or `Featured placement`

The current wording introduces ambiguity without adding capability.

### 4. The testimonial admin flow still uses the older form pattern

The homepage settings work introduced a stronger admin interaction standard:

- field hints
- required indicators
- save feedback near the action
- scroll-to-feedback
- dirty-state aware submit
- “saved” acknowledgment

Testimonials have not yet been brought up to that standard.

### 5. Ordering is good enough to build on

We do not need to redesign ordering before planning `TestimonialsSection`.

The current model already gives us:

- highlighted/featured control
- manual sort order
- deterministic fallback order

That is sufficient for the next public section phase.

## Recommendations

### Recommendation 1: Normalize the testimonial admin form UX before planning `TestimonialsSection`

This should happen first.

We should not plan the public section against an admin workflow that still feels inconsistent with the newer section-backed homepage settings work.

### Recommendation 2: Keep the existing testimonial data model with small refinements

Do not broaden the model yet.

The current fields are enough for the first public testimonial section.

We should:

- keep `quote`
- keep `authorName`
- keep `authorRole`
- keep `authorOrganization`
- keep `authorImage`
- keep `status`
- keep `sortOrder`
- keep `featured`

### Recommendation 3: Rename `Presentation` to `Featured`

This is the clearest and most honest wording for the current model.

If later we introduce richer testimonial display variants, that should be handled through public templates/sections, not through this boolean field.

### Recommendation 4: Standardize admin form behavior through a shared form standard

We should stop introducing form-quality improvements ad hoc.

At minimum, the emerging admin form standard should cover:

- bottom-anchored save feedback near the submit action
- required field indicators
- concise field hints
- disabled submit when clean
- saved-state label after successful save
- consistent error/success behavior

This should become a reusable admin form pattern, not a one-off homepage-only improvement.

## Cleanup Scope Before `TestimonialsSection`

### Phase 1: Testimonial form UX cleanup

- add required indicators for required fields
- add concise hints for all testimonial fields
- move save feedback near the submit action
- adopt disabled submit when the form is not dirty
- show a saved-state button label after successful save
- keep server-side validation as the source of truth

### Phase 2: Testimonial semantics cleanup

- rename `Presentation` to `Featured`
- make the UI wording reflect the actual public behavior
- review whether the empty-state and helper copy describe the SaaS use case clearly

### Phase 3: Rendering consistency cleanup

- update admin list/detail attribution to show role and organization consistently
- ensure admin and public surfaces compose attribution the same way

### Phase 4: Shared admin form standard

- document the standard explicitly
- identify what can be reused immediately
- apply the same pattern later to:
  - testimonials
  - homepage settings
  - other section-backed content forms

## Recommended Order

1. Clean up testimonial form UX
2. Rename `Presentation` to `Featured`
3. Fix attribution rendering consistency
4. Capture the shared admin form standard
5. Then begin `TestimonialsSection` planning

## Why This Order

`TestimonialsSection` will rely on:

- trustworthy featured state
- trustworthy ordering
- trustworthy attribution display
- confidence that admins understand what content they are managing

The testimonial model is already close enough structurally.

What is missing is the product-quality admin experience around it.

That is why the cleanup should happen before section planning rather than after.
