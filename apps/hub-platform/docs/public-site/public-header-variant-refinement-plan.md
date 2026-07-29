# Public Header Variant Refinement Plan

Status:
- Proposed
- Detailed implementation-planning document

Purpose:
- Define how the shared hub header should support bounded structural variation without fragmenting into template-specific forks
- Separate header behavior, structural variants, semantic component tokens, and template-family expression
- Lock the next refinement pass for the shared public/member header now that the shared hub shell architecture is in place

Related:
- [Public Header And Navigation Plan](/mnt/c/local/community-app/apps/hub-platform/docs/public-site/public-header-and-navigation-plan.md)
- [Public Header Components Plan](/mnt/c/local/community-app/apps/hub-platform/docs/public-site/public-header-components-plan.md)
- [Shared Hub Layout Refactor Plan](/mnt/c/local/community-app/apps/hub-platform/docs/public-site/shared-hub-layout-refactor-plan.md)
- [Public Page Template Family Matrix](/mnt/c/local/community-app/apps/hub-platform/docs/public-site/public-page-template-family-matrix.md)
- [Design System And Theming](/mnt/c/local/community-app/apps/hub-platform/docs/standards/design-system-and-theming.md)

---

## 1) Why this refinement stream exists

The shared hub layout refactor solved the architectural problem:
- one persistent hub shell for public and member routes
- one shared header/mobile-nav system
- one auth-aware utility model

That was the correct foundation.

However, the current header implementation is still primarily:
- one default visual composition
- one default spacing personality
- one default sticky treatment

It is token-aware, but not yet deliberately varied enough for strong template expression.

If we do not refine this now, the likely failure mode is:
- ad hoc template overrides
- layout exceptions inside component CSS
- increasingly local fixes for width, alignment, and sticky behavior

This refinement stream exists to prevent that.

---

## 2) Product goal

The shared hub header should feel:
- consistent in behavior across all hubs
- clearly branded per hub
- meaningfully different across approved template families

It should not feel like:
- the same header with only colors swapped
- a different bespoke component per template
- a CMS-authored header system with uncontrolled combinations

So the target is:
- one shared behavior model
- one bounded structural-variant model
- one semantic token layer
- template-family-driven expression on top

The refinement model must now explicitly support:
- the base single-row header
- one approved two-row variant where an upper utility/info band sits above the primary nav row
- one optional true CTA slot in the primary header row

The CTA slot is now locked as:
- universally supported across approved templates
- always placed on the right side of the primary nav row
- visually template-driven
- behaviorally system-mapped
- configured from branding settings, alongside template selection

---

## 3) Non-goals

This refinement stream is not for:
- changing which primary nav items exist
- changing utility-menu logic
- changing sign-in/join/account/admin behavior
- making header links tenant-authored
- introducing arbitrary per-route header designs

Those concerns are already covered elsewhere and should remain system-owned.

This stream is specifically about:
- structural presentation
- layout personality
- sticky-state treatment
- mobile-drawer expression
- token/template alignment

This stream is not for:
- turning the header into a CMS-authored content area
- allowing multiple promoted CTA buttons in the primary header
- allowing arbitrary tenant-authored info-band content beyond approved system/site-owned fields
- allowing arbitrary tenant-authored CTA labels and destinations in the header

---

## 4) Variant architecture principle

The header needs four distinct layers of responsibility.

### 4.1 Behavior layer

Behavior remains shared and system-owned.

Examples:
- viewer-state handling
- nav item routing
- utility-menu contents
- mobile drawer open/close behavior
- sticky positioning mechanics
- auth-aware continuity

This layer should not vary by template.

### 4.2 Structural variant layer

Structural variants are bounded and explicit.

Examples:
- constrained vs full-width framing
- nav alignment
- compact vs comfortable density
- subtle vs elevated sticky styling mode

This layer may vary by template family, but only through approved values.

### 4.3 Semantic token layer

This layer controls:
- spacing
- radius
- colors
- shadows
- panel width
- nav-item treatment
- brand-mark treatment

It should be expressed through semantic component tokens in `semantic.css`, overridden by template scope in `src/app/styles/templates/*.css` and by non-template theme scope in `theme-modes.css` where needed.

### 4.4 Template-family mapping layer

Template families should map to:
- approved structural variant defaults
- token overrides

They should not fork component logic.

---

## 5) Approved structural variant categories

The refinement pass should support a small, explicit set of structural controls.

These are product-owned. They are not arbitrary style knobs.

### 5.1 `widthMode`

Allowed values:
- `content`
- `full`

Meaning:
- `content`
  - header content sits inside the shared content-width frame
  - best for calmer, editorial, or more formal templates
- `full`
  - header surface spans full width and inner content may breathe more broadly
  - best for templates that want stronger shell presence or wider nav expression

Important rule:
- this does not mean nav items become edge-to-edge without control
- it means the header architecture supports wider composition where approved

### 5.2 `navAlign`

Allowed values:
- `start`
- `center`

Meaning:
- `start`
  - primary nav begins near the brand cluster and fills the available middle space
  - good for utility-first or operationally clear templates
- `center`
  - nav remains in the middle region but its item group is visually centered
  - good for more editorial or composed templates

Important rule:
- the nav still occupies the space between brand and utility regions
- only the content alignment of the nav cluster changes
- the header must continue to control the main cluster gaps

### 5.3 `density`

Allowed values:
- `comfortable`
- `compact`

Meaning:
- `comfortable`
  - default density
  - more breathing room in header padding and nav item spacing
- `compact`
  - tighter shell for denser or more operationally focused templates

Important rule:
- density should affect semantic spacing tokens
- density should not produce a second behavior model

### 5.4 `stickyMode`

Allowed values:
- `soft`
- `elevated`

Meaning:
- `soft`
  - low-contrast sticky behavior
  - subtle border and restrained shadow
- `elevated`
  - stronger visual separation from content while scrolling
  - more explicit surface and elevation

Important rule:
- sticky behavior remains enabled/disabled by approved product decision
- this variant only changes presentation of the sticky state

### 5.5 `mobileDrawerSurface`

Allowed values:
- `integrated`
- `panel`

Meaning:
- `integrated`
  - drawer feels like a natural extension of the header surface
  - calmer, less contrast-heavy
- `panel`
  - drawer has stronger panel identity and separation from content
  - good for higher-contrast templates

Important rule:
- the drawer behavior remains the same across all templates:
  - right-side panel
  - under the sticky header
  - scrim over page content
- this variant controls surface styling only
- it does not change panel motion, placement, layering, or interaction model

### 5.6 `topBand`

Allowed values:
- `none`
- `info`

Meaning:
- `none`
  - standard single-row header
- `info`
  - an upper utility/info band sits above the main header row
  - the primary row still contains logo, main nav, utility actions, and optional CTA

Important rule:
- this is the only additional structural header variation currently approved
- no third header row
- no arbitrary promotional banners inside the shared header component

### 5.7 `primaryCta`

Allowed values:
- `none`
- `single`

Meaning:
- `none`
  - no emphasized CTA in the primary row
- `single`
  - one true CTA appears in the primary row as a distinct promoted action

Important rule:
- this is one bounded slot only
- it is separate from ordinary nav links and separate from auth utility
- it may use the shared button component or button styling contract
- ordinary nav items and auth links should not be converted into button components just for visual consistency
- this slot is now considered universally available across approved templates
- template families may style it differently, but they should not remove the slot from the structural model

---

## 6) Header layout model to preserve

The refinement stream must preserve the core layout model already agreed.

Desktop:
- brand left
- nav occupies the space between brand and utility
- utility/actions right
- optional CTA lives in the right-side primary-row action area

Mobile:
- brand left
- utility trigger or auth action right
- burger trigger on the far right
- drawer slides in from the right under the sticky header

This must not regress into:
- stacked desktop header clusters
- overlay menu covering the header
- dropdown-style mobile main nav

CTA placement rule:
- the CTA always sits in the right-side action region of the primary row
- templates may alter how it looks and how flush it feels
- templates should not move the CTA into the middle nav cluster or the brand cluster

When `topBand = info`, desktop becomes:
- info band row
- primary header row

On scroll in that variant:
- the upper info band may collapse away
- the primary row remains sticky and visible

This collapse behavior must be implemented centrally and must not create layout jump, sticky-offset drift, or mobile-drawer offset errors.

---

## 7) Width and spacing ownership model

This is one of the most important refinement rules.

The header must cleanly separate:
- outer surface ownership
- inner frame ownership
- cluster spacing ownership
- nav item internal spacing

### 7.1 Outer header surface

The outer header owns:
- sticky positioning
- surface/background
- border
- shadow
- overall inline padding baseline where applicable

### 7.2 Inner frame

The inner frame owns:
- maximum usable width when in `content` mode
- centering
- alignment of brand/nav/utility regions

### 7.3 Cluster spacing

The header composition owns:
- gap between brand and nav cluster
- gap between nav cluster and utility cluster

This must not be pushed down into nav items.

### 7.4 Nav item spacing

Nav items own:
- their internal padding
- their own background shape
- their hover/active treatment

They do not own:
- global shell spacing
- header layout balance

This separation is required so templates can change shell personality without breaking interaction primitives.

### 7.5 CTA placement ownership

The header composition owns:
- the existence of the CTA slot in the right-side primary action region
- the spacing relationship between nav, CTA, and utility actions

The CTA component/button contract owns:
- internal padding
- emphasis treatment
- focus/hover/active behavior

Templates may influence:
- flush vs inset feel
- radius
- height treatment
- surface and border treatment

Templates may not influence:
- the CTA becoming a second main-nav system
- the CTA moving into arbitrary header regions

### 7.6 Info-band ownership

When `topBand = info`:
- the upper band owns its own inline content flow
- it should not change the primary-row information architecture
- it should not own primary nav spacing

The info band may contain only approved header-adjacent information such as:
- contact phone
- contact email
- social links

It should not become:
- a generic announcement strip
- a marketing carousel
- a tenant-authored freeform content area

---

## 8) Token model required for refinement

The next pass should make the header variant system more explicit through dedicated semantic tokens.

Some of these exist already. This plan locks the complete intended model.

### 8.1 Header frame tokens

Required tokens:
- `--public-header-height`
- `--public-header-total-height`
- `--public-header-max-width`
- `--public-header-padding-inline`
- `--public-header-padding-inline-full`
- `--public-header-cluster-gap`
- `--public-header-cluster-gap-compact`
- `--public-header-surface`
- `--public-header-border`
- `--public-header-shadow`
- `--public-header-backdrop-blur`

Meaning:
- `--public-header-height`
  - height of the primary nav row
- `--public-header-total-height`
  - total sticky header footprint when the info band is present and visible

This distinction is important so:
- the mobile drawer offset can stay correct
- sticky transitions do not rely on guessed heights
- info-band collapse behavior can be implemented cleanly

### 8.2 Sticky-state tokens

Required tokens:
- `--public-header-sticky-surface`
- `--public-header-sticky-border`
- `--public-header-sticky-shadow`
- `--public-header-sticky-backdrop-blur`

Reason:
- templates may want a different settled state once the header is sticky over scrolling content

Additional required tokens when `topBand = info`:
- `--public-header-info-band-collapse-duration`
- `--public-header-info-band-collapse-ease`
- `--public-header-info-band-height`
- `--public-header-info-band-border`
- `--public-header-info-band-surface`
- `--public-header-info-band-text`
- `--public-header-info-band-link`
- `--public-header-info-band-link-hover`
- `--public-header-info-band-gap`
- `--public-header-info-band-padding-inline`
- `--public-header-info-band-padding-block`

### 8.3 Brand tokens

Required tokens:
- `--public-header-brand-gap`
- `--public-header-brand-size`
- `--public-header-brand-radius`
- `--public-header-brand-bg`
- `--public-header-brand-color`
- `--public-header-brand-letter-spacing`
- `--public-header-brand-copy-gap`
- `--public-header-subtitle-font-size`

### 8.4 Desktop nav tokens

Required tokens:
- `--public-nav-item-gap`
- `--public-nav-item-pad-y`
- `--public-nav-item-pad-x`
- `--public-nav-item-radius`
- `--public-nav-item-bg`
- `--public-nav-item-bg-hover`
- `--public-nav-item-bg-active`
- `--public-nav-item-border`
- `--public-nav-item-border-hover`
- `--public-nav-item-border-active`
- `--public-nav-item-text`
- `--public-nav-item-text-hover`
- `--public-nav-item-text-active`

Current state note:
- hover/active treatment is already partly tokenized
- refinement should complete the full nav-item contract so templates do not rely on partial defaults

### 8.5 Utility region tokens

Required tokens:
- `--public-header-actions-gap`
- `--public-utility-trigger-gap`
- `--public-utility-menu-offset`

Additional required tokens for the optional primary CTA slot:
- `--public-header-cta-gap`
- `--public-header-cta-order`
- `--public-header-cta-min-height`
- `--public-header-cta-align-self`
- `--public-header-cta-radius`
- `--public-header-cta-padding-inline`
- `--public-header-cta-shadow`
- `--public-header-cta-border`

Important rule:
- the CTA’s internal visual treatment should come from the shared button contract or approved CTA-level semantic tokens
- the header only needs to control placement and separation, not invent a second button design system

Additional CTA styling rule:
- templates must be able to produce a stronger flush treatment when desired
- this includes cases where the CTA:
  - sits tight to the right edge in a fuller-width header
  - has little or no radius
  - visually matches the full height of the primary header row

This must still remain token-driven and accessible, not bespoke component CSS.

### 8.6 Mobile drawer tokens

Required tokens:
- `--public-mobile-nav-width-mobile`
- `--public-mobile-nav-width-tablet`
- `--public-mobile-nav-overlay-bg`
- `--public-mobile-nav-surface`
- `--public-mobile-nav-border`
- `--public-mobile-nav-shadow`
- `--public-mobile-nav-inner-gap`
- `--public-mobile-nav-padding-block-start`
- `--public-mobile-nav-padding-inline`
- `--public-mobile-nav-padding-block-end`
- `--public-mobile-nav-divider`

### 8.7 Mobile nav item tokens

Required tokens:
- `--public-mobile-nav-item-gap`
- `--public-mobile-nav-item-pad-y`
- `--public-mobile-nav-item-pad-x`
- `--public-mobile-nav-item-radius`
- `--public-mobile-nav-item-bg`
- `--public-mobile-nav-item-bg-hover`
- `--public-mobile-nav-item-bg-active`
- `--public-mobile-nav-item-border`
- `--public-mobile-nav-item-border-hover`
- `--public-mobile-nav-item-border-active`
- `--public-mobile-nav-item-text`
- `--public-mobile-nav-item-text-hover`
- `--public-mobile-nav-item-text-active`

### 8.8 Mobile header-row tokens

Required tokens:
- `--public-header-mobile-actions-gap`
- `--public-header-mobile-brand-gap`

Reason:
- templates may need slightly different tension between avatar/auth action and burger trigger
- this should remain token-driven rather than becoming local component CSS

### 8.9 Info-band social/icon tokens

If the info band includes social/contact affordances, required tokens are:
- `--public-header-info-band-icon-size`
- `--public-header-info-band-icon-gap`
- `--public-header-info-band-social-gap`

This prevents info-band chrome from inventing ad hoc icon sizing separate from the broader token system

### 8.10 CTA style tokens

To support meaningful template expression, the CTA should also expose semantic tokens such as:
- `--public-header-cta-surface`
- `--public-header-cta-surface-hover`
- `--public-header-cta-surface-active`
- `--public-header-cta-text`
- `--public-header-cta-text-hover`
- `--public-header-cta-border-color`
- `--public-header-cta-border-color-hover`

These may map through the shared button system, but they should still be expressed as header-aware CTA semantics so templates can control:
- inset CTA treatment
- pill CTA treatment
- flush edge CTA treatment

without forking button logic.

---

## 9) Template-family defaults

Template families should not select arbitrary combinations. They should map to approved defaults.

### 9.1 `civic`

Recommended default:
- `widthMode: content`
- `navAlign: start`
- `density: comfortable`
- `stickyMode: soft`
- `mobileDrawerSurface: integrated`
- `topBand: none`
- `primaryCta: single`

Intent:
- calm, balanced, high-trust default
- strong clarity over art direction

### 9.2 `editorial`

Recommended default:
- `widthMode: content`
- `navAlign: center`
- `density: comfortable`
- `stickyMode: soft`
- `mobileDrawerSurface: integrated`
- `topBand: none`
- `primaryCta: single`

Intent:
- stronger compositional poise
- more centered and deliberate nav presence

### 9.3 `studio`

Recommended default:
- `widthMode: full`
- `navAlign: start`
- `density: comfortable`
- `stickyMode: elevated`
- `mobileDrawerSurface: panel`
- `topBand: info`
- `primaryCta: single`

Intent:
- slightly bolder shell identity
- more expansive header framing
- stronger separation between shell and page content

Important rule:
- these are defaults, not arbitrary tenant controls
- if product later allows header variant selection, that must still be bounded to approved combinations

Important CTA rule:
- all approved template families now support the same bounded CTA slot
- variation happens in styling and emphasis, not slot availability or placement

### 9.4 Two-row variant guidance

The `topBand: info` variant should be treated as:
- a specific approved template-level header option
- not the default for every template family

The current product direction is that this is the only additional structural variation beyond the standard single-row header.

That means the approved header family set is currently:
- standard single-row header
- two-row header with info band above the primary row

---

## 10) Component responsibilities after refinement

### 10.1 `PublicHeader`

Should own:
- structural variant application
- sticky-state styling hook
- desktop/mobile header composition
- header-frame layout logic
- top-band composition when enabled
- primary CTA slot composition when enabled

Should not own:
- viewer-state derivation
- route availability
- site-settings loading
- arbitrary freeform upper-band content authoring
- arbitrary freeform CTA label/destination logic

### 10.2 `PublicShellNav`

Should own:
- nav alignment behavior inside the middle cluster
- rendering of approved primary nav items
- semantic nav-item styling contract

Should not own:
- overall header spacing
- auth branching
- CTA behavior

### 10.3 `PublicMobileNav`

Should own:
- drawer presentation
- mobile nav list rendering
- utility/action rendering inside drawer
- motion and visibility behavior

Should not own:
- header-frame layout
- viewer-state derivation

Refinement rule:
- the mobile drawer does not inherit the top info band as a literal extra row
- mobile may present the same approved contact/social information inside the drawer if product decides that is useful, but it must be intentionally designed for mobile rather than mechanically mirrored

### 10.4 `Avatar`

Should remain:
- a generic primitive

Refinement concern:
- ensure its size, radius, border, and tone remain fully token-driven so it can sit comfortably across template families

### 10.5 `NavToggleButton`

Should remain:
- a generic trigger primitive

Refinement concern:
- ensure shape, stroke weight, spacing, and hover treatment remain template-flexible without changing the trigger behavior model

### 10.6 Header CTA component responsibility

If a true CTA is present in the primary row:
- it should use the shared `Button` component or the shared button styling contract
- it should remain a bounded single slot
- it should not replace ordinary nav items or auth links

Reason:
- navigation items are navigation primitives
- button styling should be reserved for explicit promoted actions

Examples of appropriate CTA use:
- `Become a member`
- `Contact us`
- `Donate`
- `Get involved`

Authority split:
- branding settings should own which approved CTA option is selected for the hub
- the system should own how approved CTA options resolve to routes/actions
- templates should own only CTA expression/styling

That means:
- the admin may choose from a bounded CTA list
- the admin should not author arbitrary CTA labels and arbitrary URLs in the header
- route mapping stays correct and system-safe

Current expected approved CTA examples:
- `Become a member`
  - resolves to the system join route
- `Contact us`
  - resolves to the system contact route

This approved list may grow later, but it must remain bounded and system-mapped.

---

## 11) Sticky header refinement rules

Sticky behavior needs stronger visual planning than the current baseline.

### 11.1 What should remain constant

- header remains sticky at the top
- layering remains above page content
- mobile drawer remains anchored beneath the sticky header

### 11.2 What should be refinable

- resting surface vs sticky surface
- shadow strength once the page scrolls
- border visibility
- blur strength
- info-band collapse behavior where enabled

### 11.3 Scroll-state rule

The header may gain a scroll-settled state only if:
- the behavior is implemented once centrally
- the styling difference is token/variant-driven

It should not:
- be independently re-implemented in template-specific CSS

When `topBand = info`:
- the collapse of the upper band must also be centralized
- the primary row must remain stable while the upper band collapses
- the mobile drawer offset must continue to be correct in both pre-collapse and post-collapse states

The preferred model is:
- the info band visually shrinks away
- the primary row remains the persistent sticky anchor

This should not be implemented as:
- removing one row from the DOM mid-scroll without coordinated height handling
- introducing layout jumps in page content
- hardcoding multiple different sticky offsets in route-level CSS

### 11.4 Accessibility rule

Sticky refinement must not:
- reduce contrast
- make focus styles harder to perceive
- rely on blur or translucency so heavily that the nav becomes harder to read

---

## 12) Accessibility requirements

Header variant refinement must preserve or improve accessibility.

### 12.1 Nav items

Required:
- sufficient contrast in default, hover, active, and sticky states
- active state not reliant on color alone
- visible focus state stronger than hover state

### 12.2 Mobile drawer

Required:
- predictable focus order
- `Escape` close behavior maintained
- visible drawer boundaries
- touch targets remain comfortably tappable even under denser token sets

### 12.3 Brand area

Required:
- logo or initials remain legible against the chosen surface
- site title and subtitle remain readable in all supported template defaults

### 12.4 Info band

If the info band is enabled:
- phone/email/social links must remain clearly actionable
- contrast must remain sufficient even when the band uses a quieter visual treatment
- collapse behavior must not trap focus or hide focused items unexpectedly

### 12.5 CTA

If a true CTA is enabled:
- it must remain visually distinct from ordinary nav items
- it must still meet contrast and focus standards
- it should not visually dominate the header to the point that primary nav clarity is weakened
- flush edge treatments must still remain clearly interactive and accessible
- zero-radius treatments are allowed only if they still preserve obvious hit area and focus visibility

### 12.6 Motion

Required:
- drawer transition remains smooth but restrained
- motion should respect the platform’s reduced-motion behavior if/when the app-wide motion system supports that rule centrally
- info-band collapse should remain restrained and trustworthy rather than flashy

---

## 13) Implementation plan

This should be done in a bounded refinement pass, not as scattered follow-up edits.

### Phase 1: Complete the semantic token contract

Add or complete the header-related semantic tokens for:
- header frame
- sticky state
- info band
- desktop nav items
- mobile drawer
- mobile nav items
- utility offsets
- CTA placement
- CTA styling hooks needed for inset, pill, or flush expressions

### Phase 2: Tighten component contracts

Ensure the components expose only the bounded structural variant inputs:
- `widthMode`
- `navAlign`
- `density`
- `stickyMode`
- `mobileDrawerSurface`
- `topBand`
- `primaryCta`

Do not add low-level props for:
- exact padding
- colors
- radius
- shadow

CTA rule:
- `primaryCta` should express whether the slot is present
- CTA content selection should not be implemented as a loose presentational prop on route files
- CTA selection should be resolved from the shared header model using branding settings + system mapping

### Phase 3: Map template-family defaults

Implement default variant mapping in the shared header model or shell-level resolver.

Important:
- templates should map to approved variant values
- route files should not make their own header variant decisions
- top-band and CTA presence should come from approved product/template decisions, not arbitrary route composition

Also in this phase:
- define how branding settings expose the bounded CTA selector alongside template selection
- define the system resolver that maps approved CTA values to approved destinations

### Phase 4: Refine sticky-state styling

Implement the settled sticky treatment centrally if required.

If `topBand = info`:
- implement the collapse behavior centrally in this phase
- verify height/offset handling for the mobile drawer

### Phase 5: QA across templates and states

Check:
- desktop
- mobile
- signed out
- signed in member
- signed in admin on public routes
- member account routes
- sticky/scroll states
- top-band enabled and disabled variants
- CTA enabled and disabled variants
- approved CTA option switching from branding settings
- correct routing for each approved CTA option

---

## 14) QA checklist

The refinement work is not done until all of the following hold:

- header remains one inline row on desktop
- two-row variant keeps a clear upper info band and a stable primary row
- nav fills the middle space between brand and utility regions
- `start` and `center` nav alignment both behave correctly
- `content` and `full` width modes both hold cleanly
- sticky state remains visually stable and accessible
- info-band collapse remains stable and does not cause header-height drift
- desktop nav item styling changes through tokens, not local CSS hacks
- mobile drawer width changes through tokens, not component edits
- mobile nav item density changes through tokens, not hardcoded height rules
- avatar styling remains template-flexible
- utility menu remains functionally unchanged
- true CTA uses the shared button contract rather than bespoke header-only styling
- ordinary nav items remain links rather than being converted into generic buttons
- CTA remains on the right side of the primary row across all templates
- flush CTA styling can be achieved through tokens without structural hacks
- no template-specific forked header component is created

---

## 15) What success looks like

This refinement stream is successful when:
- the header feels intentionally different across approved template families
- public and member routes still feel like one hub site
- header layout remains behaviorally consistent
- designers or future engineers can adjust header expression mostly through semantic tokens and bounded variants
- we do not need to revisit header architecture again just to support the next template family

It is also successful when:
- the two-row info-band variant behaves like a first-class planned header family, not a special-case hack
- the optional promoted CTA slot is available without corrupting nav semantics
- the system still remains bounded enough that “modern header variation” does not become uncontrolled header sprawl
- branding settings can configure the approved CTA cleanly beside template selection
- templates can express calm inset CTAs or bolder flush CTAs without changing behavior or slot placement

That is the production-grade bar for this work.
