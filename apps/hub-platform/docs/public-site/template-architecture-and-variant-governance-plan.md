# Template Architecture And Variant Governance Plan

## 1. Purpose

This document defines how template-specific behaviour and styling should be owned, resolved, and maintained across the public/member-facing hub experience.

The goal is to stop template responsibility from spreading organically across:

- domain resolvers
- section composition files
- shell/header/footer components
- `semantic.css`
- monolithic template override files

and replace that with a clear, scalable architecture that remains maintainable when the platform supports many templates rather than three.

This plan is based on an audit of the current codebase and is written as the implementation authority for the template refactor.

## 1.1 Architecture Snapshot

The intended architecture after this refactor is:

- structural template decisions live in:
  - a template registry under `src/lib/templates/`
- visual template overrides live in:
  - `src/app/styles/templates/*.css`
- non-template theme concerns live outside template stylesheets
- foundational scales live in:
  - [tokens.css](/mnt/c/local/community-app/apps/hub-platform/src/app/styles/tokens.css)
- semantic defaults live in:
  - [semantic.css](/mnt/c/local/community-app/apps/hub-platform/src/app/styles/semantic.css)
- reusable components stay:
  - variant-driven
  - template-agnostic

The key design rule is:

- templates choose from approved structural variants
- template stylesheets change visual expression
- components consume resolved variants and semantic tokens

## 1.2 Key Terms

The following terminology should be used consistently throughout implementation.

### Theme

Used for non-template theme concerns such as:

- light mode
- dark mode
- cross-template theme-layer values

Theme should not be used interchangeably with template.

### Template

Used for named public-site presentation families such as:

- civic
- editorial
- studio

A template may influence:

- structural variant defaults
- template-specific visual overrides

### Variant

A bounded structural or component-family choice such as:

- header:
  - `standard`
  - `info-band`
- hero:
  - `centered`
  - `split`
- testimonials:
  - `cards`
  - `spotlight-plus-rail`

Variants are resolved in code, not invented ad hoc in CSS.

### Style

Visual expression applied through semantic tokens and template stylesheet overrides such as:

- radius
- color
- shadow
- spacing
- surface treatment

Style should not be used to describe structural composition choices.

### Site Frame

The canonical content frame for the standard public site experience, including:

- header container
- footer container
- standard section containers

This is currently represented through the `default` container width contract.

### Section Width

The explicit width options exposed by [SectionContainer.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/sections/section-container/SectionContainer.jsx):

- `narrow`
- `default`
- `wide`
- `full`

These are structural width options.

`default` should map to the canonical site frame.

## 2. Audit Scope

The following areas were audited before writing this plan:

- template normalization and supported template ownership
- public shell and header model resolution
- public landing page section variant resolution
- header, footer, and section container behaviour
- public shell patterns
- section components
- section primitives
- CSS responsibility across `tokens.css`, `semantic.css`, non-template theme files, template-specific stylesheet files, and component-level module CSS

## 3. Current Audited State

### 3.1 Template normalization exists, but template composition is not centralized

Current foundation:

- [default-theme.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/theme/default-theme.js)

Current responsibilities:

- `supportedTemplates`
- `defaultTemplate`
- `normalizeTemplate`

This file currently defines allowed template keys, but it does not own template composition or template variant definitions.

### 3.2 Header and footer template behaviour are now registry-backed through surface-specific resolvers

Current shell structural resolution ownership:

- [public-header.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/public-header.js)
- [public-footer.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/public-footer.js)
- [template-registry.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/templates/template-registry.js)

Current state:

- header structural defaults are now sourced from the template registry
- footer structural defaults are now sourced from the template registry
- the header domain remains responsible for translating those defaults into a header view model
- the footer domain remains responsible for translating those defaults into a footer view model
- top-band and CTA availability are still interpreted inside the header domain from registry-backed inputs

This means shell structure is now registry-backed, while the shell domains remain surface-specific resolvers rather than independent template authorities.

### 3.3 Route-level page surfaces are increasingly resolved from the template registry

Current route-level structural resolution ownership:

- [PublicLandingPage.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/patterns/public-landing-page/PublicLandingPage.jsx)
- [events/page.jsx](/mnt/c/local/community-app/apps/hub-platform/src/app/(hub)/[hubSlug]/events/page.jsx)
- [courses/page.jsx](/mnt/c/local/community-app/apps/hub-platform/src/app/(hub)/[hubSlug]/courses/page.jsx)
- [events/[eventSlug]/page.jsx](/mnt/c/local/community-app/apps/hub-platform/src/app/(hub)/[hubSlug]/events/[eventSlug]/page.jsx)
- [courses/[courseSlug]/page.jsx](/mnt/c/local/community-app/apps/hub-platform/src/app/(hub)/[hubSlug]/courses/[courseSlug]/page.jsx)
- [about/page.jsx](/mnt/c/local/community-app/apps/hub-platform/src/app/(hub)/[hubSlug]/about/page.jsx)
- [contact/page.jsx](/mnt/c/local/community-app/apps/hub-platform/src/app/(hub)/[hubSlug]/contact/page.jsx)
- [testimonials/page.jsx](/mnt/c/local/community-app/apps/hub-platform/src/app/(hub)/[hubSlug]/testimonials/page.jsx)
- [template-registry.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/templates/template-registry.js)

Current state:

- `hero`
- `info`
- `whatWeDo`
- `testimonials`
- `cta`

are all selected from registry-backed `landingPage` surface defaults and then passed into generic section components by route-level composition.

- `eventsPage.hero`
- `eventsPage.listing`
- `coursesPage.hero`
- `coursesPage.listing`
- `eventDetailPage.detail`
- `courseDetailPage.detail`
- `staticPage.variant`

are now also selected from registry-backed surface defaults and then passed into generic route consumers or section components.

This preserves the intended ownership boundary:

- route-level composition selects the sections present on the surface
- the template registry provides structural defaults for that surface
- section components remain variant-driven rather than template-aware

### 3.4 Shell and section variant ownership is now centralized structurally and split correctly by responsibility

Current split:

- template normalization:
  - [default-theme.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/theme/default-theme.js)
- structural template defaults:
  - [template-registry.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/templates/template-registry.js)
- header view-model resolution:
  - [public-header.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/public-header.js)
- footer view-model resolution:
  - [public-footer.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/public-footer.js)
- route-level composition:
  - [PublicLandingPage.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/patterns/public-landing-page/PublicLandingPage.jsx)
  - events / courses / detail / static public routes under `src/app/(hub)/[hubSlug]/`
- visual template overrides:
  - template-specific stylesheet files under `src/app/styles/templates/`

This is the healthier long-term split:

- one normalization layer
- one structural registry
- one visual override layer
- surface-specific resolvers and route-level composition consuming the registry rather than redefining template maps

### 3.5 Components are mostly variant-driven rather than template-aware

This is good and should be preserved.

Examples:

- [HeroSection.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/sections/hero-section/HeroSection.jsx)
  - receives `variant`
  - receives `height`
- [TestimonialsSection.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/sections/testimonials-section/TestimonialsSection.jsx)
  - receives `variant`
- [CTASection.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/sections/cta-section/CTASection.jsx)
  - receives `variant`
  - receives `surface`
- [PublicHeader.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/patterns/public-shell/PublicHeader.jsx)
  - receives resolved `variants`, `topBand`, and `cta`

This is the correct direction:

- components should consume approved variants
- components should not need to know template names

### 3.6 CSS layers are mostly well separated, and structural template decisions are no longer spread across feature-local template maps

Current CSS layer roles:

- [tokens.css](/mnt/c/local/community-app/apps/hub-platform/src/app/styles/tokens.css)
  - foundational scales
  - spacing
  - typography
  - raw layout foundations
- [semantic.css](/mnt/c/local/community-app/apps/hub-platform/src/app/styles/semantic.css)
  - default semantic and component contract values
  - site frame contract
  - header/footer/nav/mobile drawer semantic contracts
- [theme-modes.css](/mnt/c/local/community-app/apps/hub-platform/src/app/styles/theme-modes.css)
  - non-template theme-mode overrides such as light/dark
- `src/app/styles/templates/*.css`
  - per-template overrides

This general direction is good.

Current caution:

- some semantic defaults still rely on conventional rather than strongly documented override ownership
- structural surface coverage is broader now, but future section families must still be added to the registry instead of being hardcoded in new route files

### 3.7 Header/footer/section width contract has recently been improved, but template ownership is still conceptual rather than explicit

Current container foundation:

- [SectionContainer.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/sections/section-container/SectionContainer.jsx)
- [SectionContainer.module.css](/mnt/c/local/community-app/apps/hub-platform/src/components/sections/section-container/SectionContainer.module.css)
- [HeaderContainer.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/primitives/header-container/HeaderContainer.jsx)
- [FooterContainer.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/primitives/footer-container/FooterContainer.jsx)

Current site frame contract:

- [semantic.css](/mnt/c/local/community-app/apps/hub-platform/src/app/styles/semantic.css)
  - `--site-frame-max-width`
  - `--site-frame-max-width-wide`
  - `--site-frame-max-width-narrow`
  - `--site-frame-gutter`

This is a healthy improvement.

Important current understanding:

- `default` should represent the canonical site frame
- `wide`, `narrow`, and `full` remain explicit structural exceptions

This is the correct direction and should be preserved in the template architecture.

## 3.8 Current-State Inventory

The following table captures the major current ownership boundaries that matter for the refactor.

| Surface / Concern | Current Owner | Target Owner | Notes |
| --- | --- | --- | --- |
| supported template keys | [default-theme.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/theme/default-theme.js) + [template-registry.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/templates/template-registry.js) | template registry foundation + normalization layer | `default-theme.js` now consumes registry-backed template keys |
| header structural defaults | [template-registry.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/templates/template-registry.js) | template registry | [public-header.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/public-header.js) now consumes the registry rather than owning a local template map |
| footer structural defaults | [template-registry.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/templates/template-registry.js) | template registry | [public-footer.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/public-footer.js) now resolves the live footer model from the registry |
| landing-page section defaults | [template-registry.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/templates/template-registry.js) | template registry | [PublicLandingPage.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/patterns/public-landing-page/PublicLandingPage.jsx) now consumes registry-backed `landingPage` defaults directly |
| events page defaults | [template-registry.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/templates/template-registry.js) | template registry | events hero + listing are now resolved from `eventsPage` config |
| courses page defaults | [template-registry.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/templates/template-registry.js) | template registry | courses hero + listing are now resolved from `coursesPage` config |
| detail page defaults | [template-registry.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/templates/template-registry.js) | template registry | event/course detail surfaces now resolve from `eventDetailPage` and `courseDetailPage` config |
| static placeholder page defaults | [template-registry.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/templates/template-registry.js) | template registry | about/contact/testimonials placeholder pages now resolve a `staticPage` variant from the registry |
| visual template overrides | `src/app/styles/templates/*.css` | `src/app/styles/templates/*.css` | now split per template |
| semantic defaults | [semantic.css](/mnt/c/local/community-app/apps/hub-platform/src/app/styles/semantic.css) | `semantic.css` | should remain centralized |
| foundational design scales | [tokens.css](/mnt/c/local/community-app/apps/hub-platform/src/app/styles/tokens.css) | `tokens.css` | should remain centralized |
| header rendering | [PublicHeader.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/patterns/public-shell/PublicHeader.jsx) | remains component consumer | should not become template-aware |
| route-level page composition | public route files under `src/app/(hub)/[hubSlug]/` | remains route consumer | should consume resolved template config only |
| standard site frame | [SectionContainer.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/sections/section-container/SectionContainer.jsx) and semantic tokens | same | keep `default` as canonical site frame |

## 4. Core Problems To Solve

### 4.1 Template logic is split by feature area

Current state:

- header config lives in one file
- landing-page section config lives in another
- CSS template overrides live in a third place

Risk:

- adding new templates means updating multiple unrelated files
- template intent becomes harder to inspect and reason about

### 4.2 Feature files are gradually becoming template authorities

Current risk:

- header feature files know about template-specific behaviour
- landing-page composition knows about template-specific section defaults

If this pattern continues into more surfaces:

- footer
- events listing
- course listing
- static pages

the codebase will accumulate many small template maps rather than one coherent template system.

### 4.3 Structural variant ownership is not yet bounded centrally

We already have multiple bounded structural variant families:

- header:
  - standard
  - info-band
- hero:
  - centered
  - split
- testimonials:
  - cards
  - spotlight-plus-rail
- cta:
  - band
  - split

These exist, but there is no single place declaring:

- what variant families exist
- which template selects which one
- which surfaces are allowed to be template-variant-controlled

### 4.4 Scaling to many templates will become expensive and fragile

With 10-20 templates, direct branching in feature-specific files becomes:

- repetitive
- easy to miss during changes
- difficult to audit
- difficult to test

## 5. Target Architecture

## 5.1 One template registry should own structural template behaviour

Introduce a dedicated template architecture layer.

Recommended location:

- `src/lib/templates/`

Recommended initial structure:

- `src/lib/templates/template-registry.js`
- `src/lib/templates/template-types.js`
- `src/lib/templates/templates/civic.js`
- `src/lib/templates/templates/editorial.js`
- `src/lib/templates/templates/studio.js`

Optional later structure if the system grows:

- `src/lib/templates/contracts/header.js`
- `src/lib/templates/contracts/sections.js`
- `src/lib/templates/contracts/footer.js`

### 5.2 Each template definition should be a single source of structural truth

Each template file should define approved structural variant defaults for the public/member-facing site.

Example categories:

- header
- footer
- route or surface-level section defaults
- possibly route-level page shells later

The template definition should not contain raw CSS values.

It should contain bounded structural choices such as:

- header variant family
- nav alignment
- width mode
- sticky mode
- top-band mode
- mobile drawer surface mode
- landing-page hero default variant
- testimonials default variant
- cta default variant

### 5.2.1 Route-level composition should own section-variant selection

The template system should not directly choose component behaviour inside section components.

The correct authority chain is:

1. route or route-level composition decides what surface is being rendered
2. route-level composition asks the template system for the configuration of that surface
3. template registry returns approved structural defaults for that route or surface
4. route-level composition passes resolved variant props into generic section components
5. section components render the variants they were given

This means:

- section components should not inspect template keys
- CSS should not determine structural variants
- route files should not carry independent per-template maps once the registry exists

Example:

- homepage composition resolves:
  - hero variant
  - info media position
  - testimonials variant
  - CTA variant
- then passes those resolved props into:
  - [HeroSection.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/sections/hero-section/HeroSection.jsx)
  - [InfoSection.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/sections/info-section/InfoSection.jsx)
  - [TestimonialsSection.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/sections/testimonials-section/TestimonialsSection.jsx)
  - [CTASection.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/sections/cta-section/CTASection.jsx)

This distinction matters because it prevents structural ownership from becoming muddled between:

- template registry
- route composition
- component internals

It also allows the system to scale route-by-route later for:

- homepage
- events page
- courses page
- about page
- contact page

without turning components into template switchboards.

Implementation rule:

Template registry shape should be organized around route or surface-level defaults, for example:

- `template.header`
- `template.footer`
- `template.landingPage`
- `template.eventsPage`
- `template.coursesPage`
- `template.aboutPage`

This is preferred over a flatter model that mixes unrelated section defaults without route context.

### 5.3 CSS remains template-driven, but styling differences stay in template-specific stylesheets

The CSS side should remain:

- [tokens.css](/mnt/c/local/community-app/apps/hub-platform/src/app/styles/tokens.css)
  - raw scales and foundations
- [semantic.css](/mnt/c/local/community-app/apps/hub-platform/src/app/styles/semantic.css)
  - default semantic contracts
- template-specific stylesheet files
  - per-template visual overrides

This should not change conceptually.

What changes is:

- template-specific stylesheets become the visual override layer
- structural template choices move out of feature-domain files and into the template registry

### 5.4 Template-specific stylesheets should be separated

A single monolithic template stylesheet is acceptable for a small number of templates, but it is not the right long-term maintenance shape once the template system becomes a core product capability.

The CSS architecture should be split so that:

- dark/light theme concerns remain separate from template concerns
- each template has its own visual override stylesheet
- there is one shared import entry point for template styles

Recommended direction:

- keep foundational files:
  - [tokens.css](/mnt/c/local/community-app/apps/hub-platform/src/app/styles/tokens.css)
  - [semantic.css](/mnt/c/local/community-app/apps/hub-platform/src/app/styles/semantic.css)
- keep non-template theme concerns separate
- replace the monolithic template override file with:
  - `src/app/styles/templates/index.css`
  - `src/app/styles/templates/civic.css`
  - `src/app/styles/templates/editorial.css`
  - `src/app/styles/templates/studio.css`

This concrete path is intentional.

The preferred structure is:

- `src/app/styles/templates/...`

and not a detached folder such as:

- `template-styles/...`

Reason:

- it keeps template styles within the existing app-level style system
- it places them alongside the current foundational styling layers
- it makes the ownership boundary immediately obvious:
  - these are application styles
  - specifically template styles
- it scales cleanly if we later add:
  - more templates
  - shared template style helpers
  - template style utilities or composition files

Recommended loading model:

- global style entry imports:
  - `tokens.css`
  - `semantic.css`
  - non-template theme file(s)
  - `templates/index.css`

Recommended responsibility split:

- `tokens.css`
  - foundational scales and raw values
- `semantic.css`
  - default semantic/component/system contracts
- non-template theme file(s)
  - theme-wide concerns such as light/dark mode
- `templates/*.css`
  - template-specific visual overrides only

This keeps template CSS maintainable without turning the style layer into a monolith.

### 5.5 Components remain variant-driven, not template-aware

This is a critical rule.

The following components should continue to receive variant props, not template names:

- [PublicHeader.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/patterns/public-shell/PublicHeader.jsx)
- [HeroSection.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/sections/hero-section/HeroSection.jsx)
- [InfoSection.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/sections/info-section/InfoSection.jsx)
- [GridSection.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/sections/grid-section/GridSection.jsx)
- [TestimonialsSection.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/sections/testimonials-section/TestimonialsSection.jsx)
- [CTASection.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/sections/cta-section/CTASection.jsx)

The template system should resolve variants before these components render.

### 5.6 Structural variant families should be explicitly bounded

We should not allow templates to invent arbitrary component structures.

The template registry should only select from approved, finite variant families.

Examples:

- header:
  - `standard`
  - `info-band`
- hero:
  - `centered`
  - `split`
- testimonials:
  - `cards`
  - `spotlight-plus-rail`
- cta:
  - `band`
  - `split`
- site frame:
  - `default`
  - optional template override via semantic token contract, not new enum values

## 5.7 Implementation Guardrails

The following rules should be treated as hard guardrails during implementation.

### Allowed

- template registry selects approved structural variants
- template registry provides bounded default decisions for public-site surfaces
- template-specific stylesheets override semantic tokens
- `semantic.css` defines default semantic contracts
- `tokens.css` defines foundational scales
- components receive resolved variant props and semantic tokens
- domain resolvers translate template definitions into surface-specific view models

### Not Allowed

- direct template branching inside reusable section components
- direct template branching inside shell components when it can be resolved upstream
- adding raw visual values to template registry JS files
- using template stylesheets to define structural composition
- placing template-specific visual overrides back into a monolithic `themes.css`
- treating `wide` as the default public-site frame by convention rather than by explicit section exception

### Strongly Discouraged

- introducing new structural variants without first defining whether they are:
  - template-governed
  - route-governed
  - content-config-governed
- creating template-specific component forks unless there is a documented architectural exception
- adding more feature-local template maps instead of extending the registry

## 6. Ownership Rules

### 6.1 `tokens.css`

Should own:

- raw foundational values
- spacing scale
- type scale
- radius scale
- foundational layout maxima

Should not own:

- template-specific choices
- feature-specific semantic meaning
- per-template structural decisions

### 6.2 `semantic.css`

Should own:

- system-wide semantic defaults
- component contract defaults
- default site frame contract
- default header/footer/nav/mobile-drawer contracts

Should not own:

- template-specific structural branching
- template-specific named decisions like:
  - studio gets top band
  - editorial gets spotlight testimonials

### 6.3 Non-template theme files

Should own:

- non-template theme concerns only
- theme-wide concerns such as light/dark mode
- theme-layer values that are not tied to a specific public-site template

Should not own:

- structural variant selection
- route or component composition logic
- template-specific visual override blocks

### 6.4 Template-specific stylesheet files

Should own:

- per-template visual expression only
- semantic token overrides for that template
- spacing/radius/shape/surface/shadow/color differences for that template
- site-frame width/gutter overrides when a template deliberately changes the public-site frame

Should not own:

- structural variant selection
- route or component composition logic
- raw foundational scales that belong in `tokens.css`

### 6.5 Template registry

Should own:

- structural variant defaults per template
- bounded shell/route/footer variant choices
- template composition metadata

Should not own:

- raw CSS values
- hardcoded color systems
- feature implementation details

### 6.6 Domain resolvers

Should own:

- translating template definitions into view models for a specific surface
- translating route or surface-level template defaults into section-level variant props for route composition

Should not own:

- hardcoded per-template behaviour maps once the template registry exists

That means:

- [public-header.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/public-header.js)
  should not own template defaults directly
- route-level composition such as [PublicLandingPage.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/patterns/public-landing-page/PublicLandingPage.jsx)
  should consume registry-backed surface config rather than feature-local template maps

### 6.7 Route-level composition

Should own:

- selecting which sections are present on a route
- requesting template configuration for the route or surface being rendered
- passing resolved structural variant props into generic section components

Should not own:

- direct hardcoded per-template branching once the registry exists
- visual styling overrides
- low-level component-specific template logic

## 7. Proposed Template Definition Shape

Example conceptual structure:

```js
export const studioTemplate = {
  key: "studio",
  header: {
    variant: "info-band",
    widthMode: "content",
    navAlign: "start",
    density: "comfortable",
    stickyMode: "elevated",
    mobileDrawerSurface: "panel",
    primaryCtaMode: "single",
  },
  footer: {
    variant: "standard",
  },
  landingPage: {
    hero: {
      variant: "centered",
      height: "screen",
    },
    info: {
      mediaPosition: "end",
    },
    whatWeDo: {
      variant: "default",
    },
    testimonials: {
      variant: "cards",
    },
    cta: {
      variant: "band",
      surface: "primary",
    },
  },
  eventsPage: {
    listing: {
      variant: "standard",
    },
  },
  coursesPage: {
    listing: {
      variant: "standard",
    },
  },
};
```

This keeps:

- structural choices in one place
- feature files generic
- template review simple

## 8. Audited Migration Targets

### 8.1 Files that currently hardcode template structural logic

Primary targets:

- [public-header.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/public-header.js)
- [PublicLandingPage.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/patterns/public-landing-page/PublicLandingPage.jsx)

These should consume template-registry structural defaults without introducing new feature-local template maps.

### 8.2 Files that should become consumers of resolved template configuration only

- [PublicLandingPage.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/patterns/public-landing-page/PublicLandingPage.jsx)
- [PublicHeader.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/patterns/public-shell/PublicHeader.jsx)

They should continue to consume resolved view models and props, not template names.

### 8.2.1 Route-level composition consumers

The following route or route-composition surfaces should ultimately consume template-derived surface config rather than owning their own template logic:

- [PublicLandingPage.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/patterns/public-landing-page/PublicLandingPage.jsx)
- header model resolution consumed by [PublicHeader.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/patterns/public-shell/PublicHeader.jsx)

Future likely consumers:

- events listing route composition
- courses listing route composition
- about page route composition
- contact page route composition

### 8.3 Files that should remain mostly unchanged

These are already sufficiently generic and should remain variant-driven:

- [SectionContainer.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/sections/section-container/SectionContainer.jsx)
- [SectionShell.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/sections/section-shell/SectionShell.jsx)
- [SectionHeader.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/sections/primitives/section-header/SectionHeader.jsx)
- [SectionItemsGrid.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/sections/primitives/section-items-grid/SectionItemsGrid.jsx)
- [SectionCard.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/sections/primitives/section-card/SectionCard.jsx)
- [SectionActions.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/sections/primitives/section-actions/SectionActions.jsx)

### 8.4 Files that should remain CSS override surfaces

- template-specific stylesheet files under:
  - `src/app/styles/templates/`

These files should become the per-template visual override layer.

### 8.5 Files that should be split as part of the CSS architecture cleanup

Previous monolithic template stylesheet ownership has been replaced.

Current direction:

- keep non-template theme concerns separate from template concerns
- move template-specific override blocks into:
  - `src/app/styles/templates/civic.css`
  - `src/app/styles/templates/editorial.css`
  - `src/app/styles/templates/studio.css`
- add:
  - `src/app/styles/templates/index.css`

The implementation should be careful not to mix:

- light/dark theme ownership
- template visual ownership

Those are related but different responsibilities and should remain separated.

Recommended resulting style folder shape:

- `src/app/styles/base.css`
- `src/app/styles/tokens.css`
- `src/app/styles/semantic.css`
- non-template theme file(s)
- `src/app/styles/templates/index.css`
- `src/app/styles/templates/civic.css`
- `src/app/styles/templates/editorial.css`
- `src/app/styles/templates/studio.css`

This should become the normalized public-site style architecture for template-specific visual overrides.

## 8.6 Likely Files To Audit Again During Implementation

The following files should be re-reviewed during implementation because they currently sit on key migration seams.

### Template and normalization layer

- [default-theme.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/theme/default-theme.js)
- [template-registry.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/templates/template-registry.js)
- [public-site.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/public-site.js)
- [site-settings.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/site-settings.js)

### Current template structural decision points

- [public-header.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/public-header.js)
- [PublicLandingPage.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/patterns/public-landing-page/PublicLandingPage.jsx)

### Shell consumers

- [PublicHeader.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/patterns/public-shell/PublicHeader.jsx)
- [PublicLandingPage.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/patterns/public-landing-page/PublicLandingPage.jsx)
- [PublicSiteFooter.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/patterns/public-site-footer/PublicSiteFooter.jsx)

### Shared section/layout primitives

- [SectionContainer.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/sections/section-container/SectionContainer.jsx)
- [SectionShell.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/sections/section-shell/SectionShell.jsx)
- [SectionHeader.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/sections/primitives/section-header/SectionHeader.jsx)
- [SectionItemsGrid.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/sections/primitives/section-items-grid/SectionItemsGrid.jsx)
- [SectionCard.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/sections/primitives/section-card/SectionCard.jsx)
- [SectionActions.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/sections/primitives/section-actions/SectionActions.jsx)

## 9. SectionContainer And Site Frame Rule

`SectionContainer` should keep:

- `narrow`
- `default`
- `wide`
- `full`

The correct rule is:

- `default` maps to the canonical site frame
- template overrides can change what that default site frame means
- `wide`, `narrow`, and `full` remain explicit structural exceptions

This means:

- templates do not need to rewrite component width APIs
- templates can widen or narrow the standard site frame centrally
- sections can still deliberately opt out when genuinely required

This rule should remain intact during the template architecture refactor.

## 10. Implementation Phases

### Phase 1. Introduce template registry foundation

Create:

- template registry
- template type definitions
- per-template config modules

Do not change behaviour yet.

Goal:

- reproduce the current known template structural defaults exactly, but from one registry

### Phase 2. Split template stylesheet ownership

Create:

- [theme-modes.css](/mnt/c/local/community-app/apps/hub-platform/src/app/styles/theme-modes.css)
- `src/app/styles/templates/index.css`
- `src/app/styles/templates/civic.css`
- `src/app/styles/templates/editorial.css`
- `src/app/styles/templates/studio.css`

Goal:

- move template-specific visual overrides out of a monolith
- keep non-template theme concerns separate
- preserve behaviour

### Phase 3. Migrate header domain to registry-backed resolution

Refactor:

- [public-header.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/public-header.js)

Goal:

- remove `headerVariantDefaultsByTemplate`
- resolve from registry instead

### Phase 4. Migrate landing-page section defaults to registry-backed resolution

Refactor:

- [PublicLandingPage.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/patterns/public-landing-page/PublicLandingPage.jsx)
- [template-registry.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/templates/template-registry.js)

Goal:

- remove second independent template config map
- resolve landing-page section defaults from the same registry
- keep route-level composition as the owner of section selection and variant wiring

### Phase 5. Normalize naming and responsibilities

After registry migration:

- remove obsolete duplicate config files if no longer needed
- normalize template-key ownership so `default-theme.js` consumes registry-backed template keys
- ensure naming is consistent between:
  - template registry
  - domain resolvers
  - component variants
  - planning docs

### Phase 6. Extend template architecture to all major public structural surfaces

Target consumers:

- footer structural variants
- events page hero + listing
- courses page hero + listing
- event detail page
- course detail page
- static placeholder pages
- future route-level surfaces such as about/contact/testimonials redesigns

This phase should ensure the product can scale template variants without requiring another architecture pass before new surfaces can participate.

Current implementation status:

- completed for:
  - footer
  - events page
  - courses page
  - event detail page
  - course detail page
  - static placeholder pages
- remaining future extension points:
  - redesigned about/contact/testimonials route structures
  - any new public route families introduced later

### Phase 7. Harden template contracts and guardrails

Goal:

- validate template definition shape centrally
- enforce approved structural variant families
- make it harder for new template modules to drift from the contract silently

Current implementation status:

- introduced through:
  - [template-contract.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/templates/template-contract.js)
- should remain the canonical validation boundary for future template expansion

## 10.1 Review Gates Between Phases

To avoid silent drift during migration, each phase should end with a short review gate.

### After Phase 1

Confirm:

- the template registry reproduces current structural defaults exactly
- no live behaviour changed
- naming across registry files is coherent

### After Phase 2

Confirm:

- template-specific visual overrides have moved cleanly into per-template stylesheets
- non-template theme concerns remain separate
- no visual regressions were introduced by stylesheet splitting

### After Phase 3

Confirm:

- header structural defaults are fully registry-backed
- [public-header.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/public-header.js) no longer acts as an independent template authority
- [PublicHeader.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/patterns/public-shell/PublicHeader.jsx) remains template-agnostic

### After Phase 4

Confirm:

- landing-page section defaults are fully registry-backed
- [PublicLandingPage.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/patterns/public-landing-page/PublicLandingPage.jsx) resolves registry-backed `landingPage` config without a second feature-local template map
- [PublicLandingPage.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/patterns/public-landing-page/PublicLandingPage.jsx) remains a consumer only

### After Phase 6

Confirm:

- footer structural defaults are registry-backed
- events and courses listing routes no longer hardcode hero or listing structural variants
- event and course detail routes no longer hardcode detail-surface structural variants
- static placeholder pages resolve registry-backed variants rather than acting as isolated placeholders

### After Phase 7

Confirm:

- template definitions are validated against the approved structural contract
- the registry can scale to additional surfaces without reintroducing feature-local template maps
- future templates can be added by extending one validated registry path rather than inventing new config shapes

## 11. Risks

### 11.1 Over-designing before real need

Risk:

- creating a very abstract template system before enough surfaces need it

Mitigation:

- keep the first registry small
- only cover current audited template-driven surfaces

### 11.2 Turning template config into a second CSS system

Risk:

- storing too much visual detail in JS config

Mitigation:

- keep JS config structural only
- keep visual differences in template stylesheets

### 11.3 Components becoming template-aware again during migration

Risk:

- temporary shortcuts that pass `templateKey` into components

Mitigation:

- enforce component rule:
  - receive variant props
  - do not inspect template names directly

### 11.4 Split style ownership becoming ambiguous

Risk:

- template-specific CSS and non-template theme CSS may begin overlapping again after initial cleanup

Mitigation:

- keep explicit file ownership rules in this document
- do not place template-specific override blocks back into non-template theme files
- review new style additions against the ownership rules before merging

## 12. Verification And QA Strategy

The following checks should be treated as required during implementation.

### 12.1 Structural parity checks

Verify that the registry-backed system reproduces current behaviour for:

- civic
- editorial
- studio

Surfaces:

- public header
- public landing page sections
- footer if or when it becomes registry-controlled

### 12.2 Styling parity checks

Verify that stylesheet splitting preserves:

- semantic token resolution
- per-template visual differences
- dark/light theme separation
- site frame width and gutter behaviour

### 12.3 Route and auth checks

Verify:

- anonymous public routes
- signed-in member public routes
- signed-in admin public routes
- member account routes using the shared shell

The template architecture refactor must not regress shell continuity.

### 12.4 Responsive checks

Verify:

- desktop header
- mobile drawer
- top-band behaviour
- landing-page section layouts
- default site frame alignment

### 12.5 Regression checks for section variants

Verify:

- hero variants
- testimonials variants
- CTA variants
- info media position handling

These are currently the primary template-driven landing-page variants.

### 12.6 Route-level composition checks

Verify that route-level composition remains the owner of section-variant selection.

Confirm:

- route composition requests template config for the surface it is rendering
- section components receive resolved variant props
- section components do not inspect template keys directly
- no new feature-local template maps have been introduced during migration

## 12. Success Criteria

This refactor is successful when:

- all structural template defaults are sourced from one template registry
- non-template theme files remain separate
- template-specific stylesheets become the visual override layer
- `semantic.css` remains the semantic default layer
- feature-domain files stop hardcoding their own template maps
- section and shell components stay variant-driven and template-agnostic
- adding a new template only requires:
  - one template definition module
  - one template stylesheet if needed
  - no scattered feature-specific template branching

## 13. Immediate Next Step

The next step should be:

- continue widening real route-surface coverage only when a surface gains meaningful structural variants

That means:

- keep header, footer, landing page, listing routes, detail routes, and placeholder static routes on the registry-backed path
- add new public structural surfaces to the registry as they are introduced
- avoid creating fresh feature-local template maps even for transitional pages
- keep primitives and section families variant-driven rather than template-aware

## 14. New Template Onboarding Checklist

When adding a new template, the following checklist should be followed.

### 14.1 Template foundation

1. Add the template key to the supported template normalization layer.
2. Add a template definition module under `src/lib/templates/templates/`.
3. Register that definition in the template registry.

### 14.2 Visual layer

1. Add a stylesheet at:
   - `src/app/styles/templates/<template-key>.css`
2. Import it through:
   - `src/app/styles/templates/index.css`
3. Confirm that only template-specific visual overrides are placed there.

### 14.3 Structural defaults

1. Define header structural defaults.
2. Define route-surface defaults for all eligible public surfaces.
3. Keep all variant choices within approved variant families.

### 14.4 Validation

1. Verify header behaviour and styling.
2. Verify route-surface variants for landing, listing, detail, footer, and static placeholder pages as applicable.
3. Verify site frame width/gutter behaviour.
4. Verify responsive behaviour.
5. Verify dark/light theme separation still behaves correctly.

### 14.5 Review criteria

The new template should not require:

- new direct template branching in feature components
- raw visual values in registry JS files
- reintroduction of monolithic template stylesheet ownership
