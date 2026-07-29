# Public Header Components Plan

Status:
- Proposed
- Detailed implementation-planning document

Purpose:
- Define the reusable component plan for the new public header system
- Lock which existing primitives should be reused
- Plan any new generic components required by the public header/mobile nav work
- Lock how these components remain token-, theme-, and template-flexible without degenerating into ad hoc styling props

Related:
- [Public Header And Navigation Plan](/mnt/c/local/community-app/apps/hub-platform/docs/public-site/public-header-and-navigation-plan.md)
- [Public Header Code And Schema Plan](/mnt/c/local/community-app/apps/hub-platform/docs/public-site/public-header-code-schema-plan.md)

---

## 1) Component planning decisions

The public header work requires:
- a shared public header composition layer
- reuse of the existing utility-menu primitive
- one new generic avatar component
- one new custom burger-trigger component with its own module CSS
- token-driven component styling with bounded structural variants
- explicit sticky-header behavior planning

This should be planned before implementation so we avoid:
- ad hoc header-only controls
- multiple menu systems
- non-reusable avatar handling
- prop-surface explosion for styling
- template-specific forks in logic

---

## 1.1 Styling system decision

These components must follow the token/theme/template design system.

That means:
- behavior stays inside the component contract
- presentation flexibility comes primarily from semantic component-scoped CSS variables
- only a small number of bounded structural variants should be exposed as props

This work should not be implemented with:
- large numbers of low-level styling props
- template-specific copies of the same component
- one-off local CSS overrides inside route files

The preferred model is:
- semantic CSS variables
- bounded variants
- clean slot structure

---

## 1.2 Width and spacing strategy

The header must support both:
- content-width / constrained presentation
- full-width / edge-reaching presentation

Because different template families may want:
- a more editorial constrained header
- a broader, more expansive header where nav items sit closer to the edges

So the component architecture must not assume:
- the header always owns all horizontal padding
- the nav cluster always owns all spacing

Instead, the header should be structured so template families can cleanly adjust:
- whether the outer header is full width
- whether an inner frame is constrained
- whether nav items or the header frame own inline spacing

This should be handled through:
- bounded structural variants
- semantic layout variables

Not through ad hoc template overrides scattered around the app.

---

## 2) Reuse requirement: utility menu

The public header should reuse:
- [CompactMenu.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/ui/compact-menu/CompactMenu.jsx)

Reason:
- it already establishes a menu interaction pattern in the product
- reusing it preserves consistency
- it reduces duplicated menu behavior

### 2.1 What reuse means

Reuse does not mean:
- dropping header requirements to match the current exact shape blindly

It means:
- extend or adapt `CompactMenu` where needed
- keep one menu interaction primitive

### 2.2 Likely extensions

Possible future extensions if required:
- richer trigger content support
- alignment and layering refinements
- header-specific sizing hooks
- better menu item composition support
- compatibility with avatar-triggered usage in a public header context

Those should be added to `CompactMenu` thoughtfully rather than creating a new `PublicUtilityMenu` interaction base from scratch.

---

## 3) New generic component: `Avatar`

### 3.1 Naming decision

The avatar component should be named generically:
- `Avatar`

Not:
- `PublicAvatar`
- `MemberAvatar`
- `AdminAvatar`

Reason:
- it will likely be reusable in public, member, and admin surfaces later
- the component itself represents a generic UI primitive

### 3.2 Responsibility

`Avatar` should:
- render initials fallback
- optionally render image when available later
- support size variants
- support accessible labeling

### 3.3 It should not

`Avatar` should not:
- own user lookup logic
- own role logic
- own menu behavior

It is a display primitive, not a session-aware component.

### 3.4 Likely props

Conceptually:

```js
{
  initials: "",
  imageUrl: "",
  alt: "",
  size: "sm" | "md" | "lg",
  tone: "default" | "accent",
  shape: "template" | "rounded" | "pill" | "circle",
}
```

### 3.5 Styling flexibility rules

`Avatar` should support flexible presentation through semantic variables such as:
- `--avatar-size`
- `--avatar-radius`
- `--avatar-padding`
- `--avatar-bg`
- `--avatar-color`
- `--avatar-border`

This allows templates to vary:
- size
- shape
- density
- visual emphasis

without changing the behavioral contract.

The component should not hardcode:
- one radius style
- one padding model
- one visual density

---

## 4) New component: `PublicHeader`

### 4.1 Responsibility

`PublicHeader` should:
- compose the full public header
- receive the normalized header model
- render:
  - brand
  - primary nav
  - utility region
  - mobile-nav trigger

It should also own:
- sticky header behavior
- the structural relationship between:
  - outer header surface
  - inner layout frame
  - nav cluster
  - utility cluster

### 4.2 It should not

`PublicHeader` should not:
- query data
- resolve viewer state
- decide menu items
- sanitize redirects

### 4.3 Structural flexibility requirements

`PublicHeader` should support bounded structural variants such as:
- `width="content" | "full-bleed"`
- `density="comfortable" | "compact"`
- `sticky={true|false}`

These are legitimate structural concerns.

However, exact styling details such as:
- padding
- border radius
- colors
- shadow strength
- nav gap

should come from semantic variables rather than becoming individual props.

### 4.4 Styling variables

`PublicHeader` should expose semantic variables such as:
- `--public-header-min-height`
- `--public-header-inline-padding`
- `--public-header-block-padding`
- `--public-header-surface`
- `--public-header-border`
- `--public-header-shadow`
- `--public-header-radius`
- `--public-header-max-width`
- `--public-header-nav-gap`
- `--public-header-utility-gap`

These variables should be overridable by theme/template layers.

### 4.5 Sticky behavior

Sticky behavior must be explicitly planned rather than improvised.

The header should support:
- sticky positioning when the chosen template requires it
- stable layering above page content
- visual treatment that remains readable when stuck

Sticky styling considerations should include:
- backdrop/surface treatment
- border/shadow reinforcement
- transition behavior if any is used
- mobile compatibility

Sticky behavior should not be hardcoded as always-on for every template.

It should remain:
- template-aware
- bounded by the component contract

---

## 5) New component: `PublicNav`

### 5.1 Responsibility

`PublicNav` should:
- render the system-derived primary route-family navigation
- support desktop and mobile contexts

It should be able to live inside different header layout personalities without changing its data contract.

### 5.2 It should not

`PublicNav` should not:
- build route items itself
- mix account/admin utility actions into the main nav

---

## 5.3 New primitive: `PublicNavItem`

Nav items should be treated as their own reusable header/navigation primitive rather than raw links with incidental styling.

This is important because nav items will likely need to support different template expressions while preserving:
- active state
- hover state
- focus-visible state
- disabled or unavailable handling if ever required

### 5.4 Visual direction

The primary design direction for nav items should use:
- background color treatment

This should be planned deliberately rather than relying only on text-decoration or underline.

Possible bounded presentation variants may include:
- subtle surface chip
- stronger filled active background
- neutral inactive background with accent-active treatment

### 5.5 Accessibility requirements

Nav items must explicitly meet accessibility standards.

That includes:
- sufficient contrast for text and background in all states
- visible focus indication beyond color alone
- clear active-state differentiation
- hover/active/focus treatment that remains usable across templates

The nav-item plan should not assume:
- color alone is enough
- low-contrast decorative backgrounds are acceptable

### 5.6 Styling flexibility

`PublicNavItem` should support semantic variables such as:
- `--public-nav-item-padding-inline`
- `--public-nav-item-padding-block`
- `--public-nav-item-radius`
- `--public-nav-item-bg`
- `--public-nav-item-bg-hover`
- `--public-nav-item-bg-active`
- `--public-nav-item-color`
- `--public-nav-item-color-active`
- `--public-nav-item-border`
- `--public-nav-item-focus-ring`

This allows different template looks while preserving one interaction model.

---

## 6) New component: `PublicUtilityMenu`

### 6.1 Responsibility

`PublicUtilityMenu` should:
- compose the signed-in utility trigger and menu content for public routes

### 6.2 Implementation rule

`PublicUtilityMenu` should be built on top of:
- `CompactMenu`

It should not become a second independent menu primitive.

### 6.3 Trigger behavior

The trigger should usually be:
- an `Avatar` for signed-in users

Signed-out state should generally use:
- a direct `Sign in` action in the utility region rather than a menu trigger

### 6.4 Styling flexibility

Although `CompactMenu` provides the interaction base, the composed header utility menu should still support template-aware presentation through:
- trigger spacing
- trigger shape
- menu surface tokens
- menu item density

This should be achieved through:
- extension points on `CompactMenu`
- semantic variables

Not through a duplicated menu system.

---

## 7) New component: `PublicMobileNav`

### 7.1 Responsibility

`PublicMobileNav` should:
- render the right-side main-menu panel for mobile
- render beneath the persistent header
- keep header visible while open

It should be compatible with sticky-header mode without visual collision.

### 7.2 Contents

The mobile panel should contain:
- primary public nav items
- utility actions appropriate to viewer state
- `Sign out` when signed in

### 7.3 It should not

`PublicMobileNav` should not:
- cover the entire viewport over the header
- become a completely separate information architecture from desktop

### 7.4 Layout and styling flexibility

`PublicMobileNav` should support template-aware adjustment of:
- panel width
- panel surface treatment
- internal padding
- gap between nav items
- separation between primary nav and auth actions

Again, this should come from semantic variables and bounded layout choices.

---

## 8) New component: custom burger trigger

### 8.1 Requirement

We must create a custom burger-trigger component.

This should be a real reusable component with a coupled CSS module, not ad hoc lines in the header file.

### 8.2 Naming

Recommended generic name:
- `NavToggleButton`

This is better than a public-only name because the trigger pattern may be reusable later.

### 8.3 Required files

The implementation should include:
- `NavToggleButton.jsx`
- `NavToggleButton.module.css`

### 8.4 Behavior

It should:
- render a modern, clean burger icon
- animate into an `X` when open
- support accessible pressed/expanded state
- feel intentional rather than decorative

### 8.5 It should not

It should not:
- own the drawer state for the whole header
- encode route logic

It is a trigger primitive, not a header orchestrator.

### 8.6 Styling flexibility

`NavToggleButton` should support template-aware adjustment of:
- size
- stroke weight
- padding
- radius
- hover/focus background treatment

These should be controlled through semantic variables, not hardcoded values.

---

## 9) Token/theme requirements

All new header components must remain aligned with the token/theme/template design system.

That means:
- spacing comes from tokens
- radius comes from tokens
- color state comes from tokens/semantic variables
- motion is deliberate and restrained
- templates may vary presentation without forking behavior

### 9.1 Semantic variable rule

Each major header component should expose its own semantic variable layer rather than reaching directly into low-level token values everywhere.

That keeps:
- component internals understandable
- template overrides clean
- cross-template adaptation maintainable

### 9.2 Variant rule

Use props only for bounded structural variants.

Use semantic CSS variables for:
- padding
- radius
- alignment tuning
- background treatment
- sticky-state styling
- nav-item styling

This prevents prop bloat while preserving template flexibility.

---

## 10) Recommended implementation order

1. `Avatar`
2. `NavToggleButton`
3. extend `CompactMenu` only if needed
4. `PublicUtilityMenu`
5. `PublicNav`
6. `PublicMobileNav`
7. `PublicHeader`

This keeps low-level primitives in place before higher-level header composition.

---

## 11) Acceptance criteria

This component plan should be considered satisfied when:
- the header uses a generic reusable `Avatar`
- the header utility menu reuses `CompactMenu`
- the mobile nav uses a real custom trigger component with its own `.module.css`
- the mobile panel opens beneath the persistent header
- component responsibilities remain separate from route/data logic
