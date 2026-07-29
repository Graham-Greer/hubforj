# Public Site Semantic Contract Audit

## Purpose

This document defines the current outside-in contract for the public site design system so we can stabilize token ownership and stop fixing visual inconsistencies locally.

The intended ownership model is:

- `tokens.css`
  - raw ramps and scales only
- `theme-modes.css`
  - semantic mode roots only
- `semantic.css`
  - semantic aliases and component/public-surface contracts
- `templates/*.css`
  - template expression only
- runtime branding resolver
  - hub-specific semantic overrides only

## Outside-In Map

### 1. Body / Global Page Root

Source files:

- [base.css](/mnt/c/local/community-app/apps/hub-platform/src/app/styles/base.css)
- [semantic.css](/mnt/c/local/community-app/apps/hub-platform/src/app/styles/semantic.css)
- [theme-modes.css](/mnt/c/local/community-app/apps/hub-platform/src/app/styles/theme-modes.css)
- [civic.css](/mnt/c/local/community-app/apps/hub-platform/src/app/styles/templates/civic.css)

Current contract:

- `body.background` -> `--template-shell-bg`
- `body.color` -> `--text-primary`

Token tree:

1. `base.css` consumes `--template-shell-bg` and `--text-primary`
2. `semantic.css` defines default semantic roots
3. `theme-modes.css` remaps those roots for dark mode
4. `civic.css` can alter template atmosphere through `--template-shell-bg`
5. `tokens.css` provides the underlying ramps:
   - `--palette-neutral-*`
   - `--palette-brand-*`
   - `--palette-accent-*`

Decision:

- body remains on `text-primary`
- body background remains on `template-shell-bg`

### 2. Public Shell Patterns

#### Header

Source files:

- [PublicHeader.module.css](/mnt/c/local/community-app/apps/hub-platform/src/components/patterns/public-shell/PublicHeader.module.css)
- [PublicShellNav.module.css](/mnt/c/local/community-app/apps/hub-platform/src/components/patterns/public-shell/PublicShellNav.module.css)
- [semantic.css](/mnt/c/local/community-app/apps/hub-platform/src/app/styles/semantic.css)
- [civic.css](/mnt/c/local/community-app/apps/hub-platform/src/app/styles/templates/civic.css)
- [public-brand-theme.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/public-brand-theme.js)

Current text hierarchy:

- brand title -> `--public-header-brand-text` -> `--text-primary`
- brand subtitle -> `--public-header-brand-subtext` -> `--text-secondary`
- nav default -> `--public-nav-item-text` -> `--text-secondary`
- nav hover/active -> `--public-nav-item-text-hover` / `active` -> `--text-primary`
- phone/email default -> `--public-header-info-band-meta-link` -> `--text-secondary`
- phone/email hover -> `--public-header-info-band-meta-link-hover` -> `--text-primary`

Current surface hierarchy:

- main header row -> `--public-header-surface`
- sticky elevated header -> `--public-header-sticky-surface-elevated`
- top band -> `--public-header-info-band-surface`

Current border hierarchy:

- header border -> `--public-header-border` -> `--border-ui-subtle`
- top band border -> `--public-header-info-band-border` -> `--border-interactive-hover`
- nav hover border -> `--public-nav-item-border-hover` -> `--border-interactive-hover`
- nav active border -> `--public-nav-item-border-active` -> `--border-interactive-active`

Decision:

- header text should follow the same primary/secondary hierarchy as sections
- header should keep public-shell surface tokens
- header should consume shared border tiers, not bespoke formulas

#### Footer

Source files:

- [PublicSiteFooter.module.css](/mnt/c/local/community-app/apps/hub-platform/src/components/patterns/public-site-footer/PublicSiteFooter.module.css)
- [semantic.css](/mnt/c/local/community-app/apps/hub-platform/src/app/styles/semantic.css)
- [public-brand-theme.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/public-brand-theme.js)

Current contract:

- surface -> `--footer-surface`
- border -> `--footer-border` -> `--border-ui-subtle`
- headings -> `--footer-title`
- body/meta -> `--footer-text` / `--footer-meta`
- links -> `--footer-link` / `--footer-link-hover`

Decision:

- footer is already consuming the right abstraction layer
- keep footer on shared text and border tiers

### 3. Sections

Representative files:

- [InfoSection.module.css](/mnt/c/local/community-app/apps/hub-platform/src/components/sections/info-section/InfoSection.module.css)
- [GridSection.module.css](/mnt/c/local/community-app/apps/hub-platform/src/components/sections/grid-section/GridSection.module.css)
- [TestimonialsSection.module.css](/mnt/c/local/community-app/apps/hub-platform/src/components/sections/testimonials-section/TestimonialsSection.module.css)
- [CTASection.module.css](/mnt/c/local/community-app/apps/hub-platform/src/components/sections/cta-section/CTASection.module.css)

Observed contract:

- section headings / strong content -> `--text-primary`
- section body / meta content -> `--text-secondary`
- accent moments -> `--accent-primary`
- inverse section content -> `--text-inverse`

Decision:

- this is the baseline readability model for the public site
- public shell text should align to this model unless a surface is explicitly inverse

### 4. Section Primitives

#### SectionShell

File:

- [SectionShell.module.css](/mnt/c/local/community-app/apps/hub-platform/src/components/sections/section-shell/SectionShell.module.css)

Contract:

- subtle -> `--section-surface-subtle`
- primary -> `--section-surface-primary`
- inverse -> `--section-surface-inverse`
- dividers -> `--section-divider-color`

#### SectionHeader

File:

- [SectionHeader.module.css](/mnt/c/local/community-app/apps/hub-platform/src/components/sections/primitives/section-header/SectionHeader.module.css)

Contract:

- eyebrow -> `--accent-primary`
- description -> `--text-secondary`
- title inherits stronger section text tier

#### SectionRichText

File:

- [SectionRichText.module.css](/mnt/c/local/community-app/apps/hub-platform/src/components/sections/primitives/section-rich-text/SectionRichText.module.css)

Contract:

- root/body -> `--text-secondary`
- strong/emphasis -> `--text-primary`

#### SectionCard

File:

- [SectionCard.module.css](/mnt/c/local/community-app/apps/hub-platform/src/components/sections/primitives/section-card/SectionCard.module.css)

Contract:

- border -> `--section-card-border`
- surface -> `--section-card-surface`
- shadow -> `--section-card-shadow`

## Shared Semantic Tiers

### Text

- `--text-primary`
  - headings
  - strong copy
  - active interactive text
- `--text-secondary`
  - body copy
  - meta/supporting copy
  - default calm navigation text
- `--text-muted`
  - tertiary metadata only
- `--text-inverse`
  - true inverse surfaces only

### Surfaces

- `--bg-canvas`
  - outer page atmosphere
- `--bg-subtle`
  - atmospheric secondary shell background
- `--surface-primary`
  - default component/content surface
- `--surface-secondary`
  - softer supporting component surface
- `--surface-tertiary`
  - stronger secondary surface
- `--surface-inverse`
  - true inverse surface

### Borders

- `--border-ui-subtle`
  - quiet separators
  - default card/footer/header borders
- `--border-ui-strong`
  - stronger panels and elevated states
- `--border-interactive-hover`
  - hover-state control borders
- `--border-interactive-active`
  - active/accent control borders

## Current Known Seams

1. Runtime branding still injects some section and shell tokens directly in [public-brand-theme.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/public-brand-theme.js) instead of only overriding semantic roots.
2. Header still has a thicker alias layer than sections, even though its text hierarchy is now aligned.
3. Border tiers are now defined in `semantic.css`, but not every interactive surface has been audited against them yet.

## Recommended Next Passes

1. Audit public shell border usage in-browser against the new border tiers.
2. Audit dark-mode header/footer contrast with the now-shared text hierarchy.
3. Reduce runtime branding overrides over time so it prefers overriding semantic roots over component-specific tokens.
