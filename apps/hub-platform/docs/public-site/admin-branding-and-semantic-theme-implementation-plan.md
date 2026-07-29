# Admin Branding And Semantic Theme Implementation Plan

## 1. Purpose

This document defines how hub-admin branding settings should evolve from the current narrow presentation controls into a production-grade branding system that:

- gives hubs meaningful visual ownership of their public site
- preserves the design-system and template architecture already in place
- keeps structure, visual defaults, and hub-specific brand overrides clearly separated
- allows brand settings to ripple through the public site via semantic tokens rather than component-specific overrides

This plan is the implementation authority for introducing admin-managed brand colors and surface colors into the public site.

## 1.1 Scope

This plan covers:

- branding settings schema
- branding admin form expansion
- domain normalization and validation
- semantic token ownership
- runtime token resolution and injection
- interaction with templates and theme modes
- rollout phases
- QA and accessibility requirements

This plan does not change:

- template registry ownership of structural variants
- member/auth workspace route scope
- the principle that primitives such as `SectionShell` and `SectionContainer` continue to own shared spacing, width, and section scaffolding

## 1.2 Core Goal

The goal is not to build a freeform theme editor.

The goal is to build a bounded branding system where:

- templates own structural defaults
- template stylesheets own visual defaults
- admins own hub-specific brand inputs
- semantic tokens remain the stable contract consumed by the UI
- the public site updates from those brand inputs without needing component-specific configuration

## 2. Current Audited State

### 2.1 Current branding admin settings are narrow

Current branding settings ownership is in:

- [BrandingSettingsForm.jsx](/mnt/c/local/community-app/apps/hub-platform/src/app/(admin)/[hubSlug]/admin/settings/branding/BrandingSettingsForm.jsx)
- [site-settings.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/site-settings.js)
- [site-settings.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/data/site-settings.js)
- [actions.js](/mnt/c/local/community-app/apps/hub-platform/src/app/(admin)/[hubSlug]/admin/settings/actions.js)

Current fields are:

- `themeKey`
- `templateKey`
- `logoAssetId`
- `logoAlt`
- `headerCtaKey`

This means the current branding admin surface controls:

- theme mode
- template family
- public logo
- bounded header CTA selection

It does not currently control brand colors or hub-specific public-site visual identity tokens.

### 2.2 Public-site brand colors are currently fixed semantic defaults

Current semantic color ownership is in:

- [semantic.css](/mnt/c/local/community-app/apps/hub-platform/src/app/styles/semantic.css)
- [theme-modes.css](/mnt/c/local/community-app/apps/hub-platform/src/app/styles/theme-modes.css)

Examples:

- `--accent-primary`
- `--accent-primary-hover`
- `--accent-secondary`
- `--bg-canvas`
- `--bg-subtle`
- `--surface-primary`
- `--surface-secondary`

These values are currently controlled by:

- light semantic defaults
- dark theme-mode overrides
- template stylesheet defaults

They are not currently controlled by hub-specific branding settings.

### 2.3 Templates already consume semantic tokens correctly

Current template visual ownership is in:

- [civic.css](/mnt/c/local/community-app/apps/hub-platform/src/app/styles/templates/civic.css)
- [editorial.css](/mnt/c/local/community-app/apps/hub-platform/src/app/styles/templates/editorial.css)
- [studio.css](/mnt/c/local/community-app/apps/hub-platform/src/app/styles/templates/studio.css)

These files already work as intended:

- they override semantic/template visual defaults
- they do not own hub-specific brand inputs
- they rely on shared tokens such as `--accent-primary`, `--template-accent-band`, `--surface-primary`, and related semantic variables

This is the right foundation for admin-driven branding because it means template CSS can respond to changed semantic tokens without becoming tenant-specific.

### 2.4 Runtime theme scope is currently too narrow

Current runtime theme scoping is in:

- [ThemeScope.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/primitives/theme-scope/ThemeScope.jsx)

Current behavior:

- sets `data-theme`
- sets `data-template`

Current gap:

- it does not inject hub-specific CSS custom properties
- there is no runtime token bridge from saved branding settings into the rendered public-site scope

This is the main technical gap that must be closed.

## 3. Product Direction

The desired product model is:

- hubs can configure a bounded set of brand values
- those brand values ripple through the public site consistently
- templates remain intentional and distinctive
- the system remains semantic rather than becoming a page-by-page styling tool

The intended visual model is:

- primary brand color controls the dominant accent system
- background colors control the page and surface atmosphere
- secondary brand color is used sparingly by templates when appropriate
- light and dark modes can each have different surface character

## 4. Branding Settings Model

### 4.1 Initial branding settings to support

The first production-grade branding model should include:

- shared:
  - primary brand color
  - secondary brand color
- light theme:
  - background primary color
  - background accent color
- dark theme:
  - background primary color
  - background accent color

This is the recommended bounded starting set.

### 4.2 Why this is the right scope

This gives hubs meaningful control over:

- the dominant accent system
- the overall atmosphere of light mode
- the overall atmosphere of dark mode
- selective secondary brand moments

without exposing unsafe low-level controls such as:

- button border color
- header link hover border color
- individual card shadow color
- per-component overrides

### 4.3 Proposed persisted schema shape

Branding should be stored as a bounded nested object under site settings.

Recommended shape:

```js
branding: {
  colors: {
    primary: "#256EF1",
    secondary: "#9C6E35",
  },
  light: {
    backgroundPrimary: "#F8F6F1",
    backgroundAccent: "#F0ECE5",
  },
  dark: {
    backgroundPrimary: "#0F141B",
    backgroundAccent: "#151B24",
  },
}
```

This can live alongside:

- `themeKey`
- `templateKey`
- `logoAssetId`
- `logoAlt`
- `header.primaryCtaKey`

### 4.4 What should not be stored

The following should not be stored in admin branding settings:

- raw component token names
- header-specific colors
- footer-specific colors
- page-specific overrides
- arbitrary CSS strings
- gradients
- typography selections
- unbounded custom token maps

## 5. Semantic Ownership Model

### 5.1 Intended ownership split

The final ownership split should be:

- `tokens.css`
  - foundational palette scales and raw fallback primitives
- `semantic.css`
  - semantic defaults and component/system contracts
- `theme-modes.css`
  - dark-mode semantic overrides and non-template theme concerns
- `templates/*.css`
  - template-specific visual defaults
- admin branding settings
  - hub-specific brand inputs
- runtime token resolver
  - maps admin branding inputs to a bounded semantic token payload
- `ThemeScope`
  - injects the resolved token payload into the public-site scope

### 5.2 Semantic tokens that should be driven by admin branding

At minimum, admin branding should drive:

- `--accent-primary`
- `--accent-primary-hover`
- `--accent-secondary`
- `--bg-canvas`
- `--bg-subtle`

Potentially derived from those:

- `--surface-secondary`
- `--template-accent-band`
- other mixed/tinted tokens already built from semantic values

The important rule is:

- admin settings should drive a small bounded set of semantic roots
- the rest of the system should derive naturally from those roots

### 5.3 What primary brand color should control

Primary brand color should be the dominant accent system.

It should be the source for:

- primary buttons
- CTA surfaces
- active nav states
- emphasis links
- icon accents
- section accent markers
- badge/tone-accent use cases
- token-driven highlight treatments across public UI

This aligns with the user’s intended direction that “everything blue” in the example should respond to the primary brand color.

### 5.4 What background colors should control

The admin-configured background values should control the main page atmosphere.

Recommended mapping:

- light mode:
  - `backgroundPrimary` -> `--bg-canvas`
  - `backgroundAccent` -> `--bg-subtle`
- dark mode:
  - `backgroundPrimary` -> dark-mode `--bg-canvas`
  - `backgroundAccent` -> dark-mode `--bg-subtle`

From there, semantic and template layers may derive additional surfaces with controlled `color-mix(...)` logic.

### 5.5 What secondary brand color should control

Secondary brand color should be:

- optional
- used sparingly
- interpreted by templates where appropriate

Examples:

- supportive decorative accents
- alternate emphasis moments
- specific hero or overlay accent relationships
- selective sub-brand flavor in templates such as `civic`

It should not replace the primary accent system.

## 6. Runtime Resolution Model

### 6.1 Required new layer

The system needs a new runtime brand resolver that:

- reads normalized branding settings
- reads theme mode
- resolves safe semantic token values
- derives limited helper values such as hover states where needed
- returns a CSS-variable payload for `ThemeScope`

### 6.2 Recommended new domain module

Create a dedicated resolver module, for example:

- `src/lib/domain/public-brand-theme.js`

Responsibilities:

- normalize brand settings into mode-aware values
- derive bounded semantic tokens
- expose a stable shape that `ThemeScope` can render as inline CSS variables

### 6.3 Recommended resolver output shape

Example:

```js
{
  light: {
    "--accent-primary": "#256EF1",
    "--accent-primary-hover": "#174FB8",
    "--accent-secondary": "#9C6E35",
    "--bg-canvas": "#F8F6F1",
    "--bg-subtle": "#F0ECE5",
  },
  dark: {
    "--accent-primary": "#72A8FF",
    "--accent-primary-hover": "#8BB7FF",
    "--accent-secondary": "#D8A15A",
    "--bg-canvas": "#0F141B",
    "--bg-subtle": "#151B24",
  },
}
```

The exact output does not need to be this shape, but the contract must stay bounded.

### 6.4 ThemeScope responsibilities after this change

`ThemeScope` should continue to apply:

- `data-theme`
- `data-template`

And should additionally apply:

- hub-specific CSS custom properties for the active scope

This is the correct bridge point because:

- it already defines public/workspace theme scope
- it keeps token injection close to the render boundary
- it avoids pushing style logic into route files or feature components

## 7. Validation And Safety Rules

### 7.1 Input validation

All admin brand color values must be:

- normalized
- format-validated
- bounded to approved color types

For Phase 1, accept:

- hex colors only

This is the safest initial standard.

### 7.2 Accessibility safeguards

The first production implementation must not rely on admins choosing perfect color combinations.

Required safeguards:

- compute contrast against relevant text/surface pairings
- reject obviously unsafe values or fall back to safe derived tokens
- keep text tokens system-derived rather than admin-authored

The system should not allow branding settings to make:

- primary CTA text unreadable
- active nav states unreadable
- focus rings disappear
- dark mode lose sufficient contrast

### 7.3 Derived token rules

Do not ask admins to provide:

- hover colors
- pressed colors
- focus-ring colors
- mixed surface tints

These should be derived by the system from the approved root values.

## 8. Admin UX Requirements

### 8.1 Branding form expansion

The branding form should be expanded carefully, not turned into a long unstructured panel.

Recommended sections:

- Logo
- Presentation
  - theme
  - template
- Brand colors
  - primary brand color
  - secondary brand color
- Light theme surfaces
  - background primary
  - background accent
- Dark theme surfaces
  - background primary
  - background accent
- Header CTA

### 8.2 Admin UX principles

The admin branding surface should:

- feel bounded and trustworthy
- make it clear which values are shared across the public site
- avoid surfacing implementation jargon like “semantic token” to admins
- explain the impact of each field in product language

### 8.3 Future enhancement options

Later, but not required for Phase 1:

- live preview swatches
- contrast warnings
- “reset to template defaults”
- advanced override mode

These should not block the first implementation.

## 9. Implementation Phases

### Phase 1. Schema And Normalization

Add the branding color schema to site settings and implement:

- normalized domain payload handling
- admin-form shape normalization
- persisted storage updates
- read/write support in site settings data layer

Files likely affected:

- [site-settings.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/site-settings.js)
- [site-settings.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/data/site-settings.js)
- [actions.js](/mnt/c/local/community-app/apps/hub-platform/src/app/(admin)/[hubSlug]/admin/settings/actions.js)
- [form-state.js](/mnt/c/local/community-app/apps/hub-platform/src/app/(admin)/[hubSlug]/admin/settings/form-state.js)

### Phase 2. Branding Form Expansion

Add the new admin fields and keep them aligned to existing settings-form standards.

Files likely affected:

- [BrandingSettingsForm.jsx](/mnt/c/local/community-app/apps/hub-platform/src/app/(admin)/[hubSlug]/admin/settings/branding/BrandingSettingsForm.jsx)
- possibly shared color-input primitives if needed

Important rule:

- do not create a branding-only form architecture exception

### Phase 3. Runtime Brand Resolver

Create the dedicated runtime brand-token resolver.

Files likely added:

- `src/lib/domain/public-brand-theme.js`

Responsibilities:

- normalize persisted brand values
- derive semantic token values for the active mode
- expose a bounded token payload

### Phase 4. ThemeScope Token Injection

Teach `ThemeScope` to apply runtime CSS variable overrides for the active scope.

Files likely affected:

- [ThemeScope.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/primitives/theme-scope/ThemeScope.jsx)
- public layout consumers if needed

### Phase 5. Semantic Token Wiring Review

Audit semantic tokens to ensure the new roots drive the expected public surfaces consistently.

Focus on:

- buttons
- nav states
- header
- footer
- section accents
- badges/icons/avatar accent treatments
- placeholder and listing surfaces

Files likely reviewed:

- [semantic.css](/mnt/c/local/community-app/apps/hub-platform/src/app/styles/semantic.css)
- [theme-modes.css](/mnt/c/local/community-app/apps/hub-platform/src/app/styles/theme-modes.css)
- template stylesheets under `src/app/styles/templates/`

### Phase 6. QA And Accessibility Hardening

Verify:

- light mode branding
- dark mode branding
- template interaction with hub brand settings
- contrast safety
- form save/readback correctness
- public-site ripple coverage

## 10. Explicit Guardrails

### Allowed

- admin-managed bounded brand inputs
- system-derived hover/mixed states
- runtime CSS variable injection through `ThemeScope`
- template CSS consuming semantic brand tokens
- templates using secondary brand color sparingly where approved

### Not allowed

- arbitrary CSS authored by admins
- page-level color overrides
- component-specific branding fields in admin
- template registry storing colors
- templates directly persisting hub brand decisions
- feature components reading brand settings directly from storage

## 11. QA Checklist

The implementation is not complete until the following are verified.

### Branding admin behavior

- values save correctly
- values read back correctly
- form state does not revert after save
- values survive refresh

### Public-site ripple coverage

- header brand surfaces update
- CTA/button accents update
- active nav states update
- footer accents update
- section accent markers update
- page canvas/background atmosphere updates

### Template interaction

- `civic` still feels civic
- `editorial` still feels editorial
- `studio` still feels studio
- hub branding changes expression without flattening template identity

### Theme-mode interaction

- light mode uses light background settings
- dark mode uses dark background settings
- accent behavior remains legible in both modes

### Accessibility and resilience

- CTA contrast remains acceptable
- interactive focus treatment remains visible
- text remains readable on branded backgrounds
- missing branding settings fall back safely to defaults

## 12. Success Criteria

This work should be considered successful when:

- admins can set bounded brand colors and surface colors
- those values persist cleanly through the standard settings architecture
- the public site reflects those values through semantic tokens rather than bespoke overrides
- templates retain distinct identity while honoring hub branding
- the system remains maintainable, bounded, and accessible

## 13. Recommended Immediate Next Step

Begin with Phase 1 and Phase 2 together:

- define the branding schema
- add normalization/validation
- expand the branding form

Then implement Phase 3 and Phase 4 together:

- runtime token resolution
- `ThemeScope` token injection

That sequencing keeps:

- admin data model
- runtime token bridge

aligned from the start.
