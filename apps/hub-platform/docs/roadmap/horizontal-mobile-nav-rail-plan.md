# Horizontal Mobile Nav Rail Plan

## Status

Locked planning proposal before implementation.

This document defines the recommended approach for introducing a reusable horizontal mobile navigation rail for the hub platform.

Important rules:
- This is not a design overhaul.
- This is not a generic media carousel.
- This should preserve the current design system direction rather than reset it.
- Public and admin styling must remain isolated to avoid token leaks.
- Shared behavior may be reused, but semantic contracts and styling ownership must remain domain-aware.

## Core Objective

Introduce a reusable mobile-first horizontal navigation pattern that:
- works well for narrow viewports
- can be reused in both public/member and admin areas
- preserves correct semantics for different interaction models
- avoids duplicating mobile overflow logic across multiple features

The immediate drivers are:
- member account navigation on mobile
- admin form tabs on mobile

## Problem Statement

The current member account `navFrame` works acceptably for larger screens, but it is not a strong mobile solution. It still behaves like a desktop horizontal nav compressed into a smaller viewport.

We also already have an admin-side tab pattern in:
- [FormSectionTabs.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/patterns/form-section-tabs/FormSectionTabs.jsx)
- [FormSectionTabs.module.css](/mnt/c/local/community-app/apps/hub-platform/src/components/patterns/form-section-tabs/FormSectionTabs.module.css)

That admin pattern has the same mobile overflow problem class:
- multiple items in a row
- strong need for active-state clarity
- poor small-screen behavior if left as a static row

So the real need is not a member-account-only fix. The real need is a shared horizontal mobile rail behavior that can support:
- route navigation
- tabbed in-page navigation

## Design Direction

The desired visual direction should stay close to the existing [SegmentedToggle.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/ui/segmented-toggle/SegmentedToggle.jsx) language:
- compact
- calm
- intentional
- clear active state
- no reinvention of the current control look and feel

This does not mean the new component should literally reuse `SegmentedToggle` for all use cases. It means the new rail should feel related to that visual family:
- grouped row
- clear selected state
- soft surface
- restrained border treatment
- compact spacing

## Key Architectural Decision

We should not build one component that tries to handle both:
- link-based route navigation
- tablist/tab/tabpanel interaction

Those are different semantic patterns.

Instead, we should split the solution into:

1. A shared low-level horizontal rail primitive
2. Two semantic wrappers on top of it

This gives us shared behavior without forcing mismatched semantics into one API.

## Recommended Component Model

### 1. Shared Primitive

Recommended name:
- `HorizontalScrollRail`

Recommended location:
- `apps/hub-platform/src/components/ui/horizontal-scroll-rail/`

Purpose:
- provide the overflow and layout behavior
- handle horizontal scrolling
- support active item reveal
- support responsive mobile treatment
- provide a shared structural shell

This primitive should not know whether items are:
- links
- tabs
- buttons

It should only know how to render a horizontally scrollable rail and optionally help keep the active item visible.

### 2. Route Navigation Wrapper

Recommended name:
- `HorizontalNavRail`

Purpose:
- render route navigation items
- preserve real link semantics
- work for member/public route navigation
- potentially work for other future section navs

Likely first adoption:
- member account nav

### 3. Tab Wrapper

Recommended name:
- `HorizontalTabRail`

Purpose:
- render tablist/tab semantics
- preserve keyboard and focus behavior expected for tabs
- work for admin form tabs

Likely first adoption:
- event edit form tabs

## Why This Split Is Correct

This is the key architectural point:

- shared behavior is reusable
- semantics are not interchangeable

Member account navigation is route navigation:
- links
- URL-driven
- page-to-page transitions

Admin form section tabs are in-page tabs:
- `tablist`
- `tab`
- `tabpanel`
- state-driven
- arrow-key navigation expectations

Trying to collapse both into one single top-level component would make the API confused and create accessibility risk.

Using:
- one shared rail primitive
- plus two semantic wrappers

is the cleanest and most scalable approach.

## Styling Strategy

### Shared Behavior, Domain Styling

The visual system must avoid public/admin token leakage.

That means:
- the shared primitive may own structure and overflow behavior
- domain wrappers should own the semantic styling contract

In practical terms:
- `HorizontalScrollRail` should not hardcode public-looking or admin-looking tokens
- it should expose low-level class hooks or minimal structural tokens only
- `HorizontalNavRail` should use public/member nav contracts where appropriate
- `HorizontalTabRail` should use admin/form tab contracts where appropriate

### Styling Rule

Behavior should be shared.
Surface styling should remain domain-owned.

That is how we avoid:
- public tokens leaking into admin
- admin contracts accidentally driving member/public mobile UI

## Recommended Token Approach

Keep the token layer small and disciplined.

Do not introduce a large new token family up front.

Recommended shared structural tokens only if needed:
- rail gap
- rail padding-inline
- rail edge fade size if we use one

Avoid:
- public-specific tokens in the shared primitive
- admin-specific tokens in the shared primitive
- a generic token explosion for one mobile feature

Domain wrappers may continue to use existing contracts such as:
- public/member nav item radius, background, border, text
- admin form tab radius, background, border, text

If a shared token is introduced, it must justify itself as truly shared behavior or shared structure, not shared appearance.

## Recommended UX Behavior

### Mobile

On mobile, the rail should:
- render as a single horizontal row
- allow horizontal scrolling
- avoid wrapping
- keep active state obvious
- feel intentional rather than accidental overflow

Recommended behaviors:
- horizontal scroll with native touch scrolling
- active item scrolled into view on load/change
- optional edge fade treatment if needed

### Tablet and Desktop

The same component should be able to remain usable at larger breakpoints.

Recommended approach:
- keep the same component
- allow layout behavior to become non-scrolling or less constrained on wider screens where appropriate

This avoids duplicated route matching and item rendering logic across separate mobile/desktop components.

## Accessibility Requirements

### For Route Navigation

`HorizontalNavRail` should preserve:
- nav semantics
- real anchor links
- visible focus states
- correct active-state indication

### For Tabs

`HorizontalTabRail` should preserve:
- `tablist`
- `tab`
- `tabpanel`
- `aria-selected`
- keyboard movement between tabs

The shared primitive must not interfere with those semantics.

## Suggested API Shape

### HorizontalScrollRail

The shared primitive should likely accept:
- `children`
- `className`
- `viewportClassName`
- `trackClassName`
- optional `activeItemSelector` or active-item ref behavior
- optional `ariaLabel`

The primitive should not accept domain-specific concepts such as:
- `tabs`
- `links`
- `activeHref`
- `onTabChange`

Those belong in wrappers.

### HorizontalNavRail

Likely inputs:
- `items`
- `activeHref`
- `ariaLabel`
- `className`

Each item likely includes:
- `href`
- `label`

Optional later:
- icon
- badge count

### HorizontalTabRail

Likely inputs:
- `tabs`
- `activeTabId`
- `onTabChange`
- `ariaLabel`
- `showDescriptions`

This wrapper may adapt from the existing `FormSectionTabs` API to reduce migration friction.

## Adoption Plan

### Phase 1: Shared Primitive

Build:
- `HorizontalScrollRail`

Scope:
- overflow behavior
- horizontal layout
- responsive handling
- optional active-item reveal

Out of scope:
- route matching
- tab semantics
- domain-specific tokens

### Phase 2: Member Account Adoption

Build:
- `HorizontalNavRail`

Adopt in:
- member account nav

Goal:
- replace current mobile `navFrame` behavior with a true horizontal rail
- preserve current desktop/tablet behavior where possible

### Phase 3: Admin Tab Adoption

Build:
- `HorizontalTabRail`
or refactor `FormSectionTabs` to use the shared rail internally

Adopt in:
- event edit form tabs first

Goal:
- improve mobile behavior for current admin form tabs
- keep tab semantics intact

### Phase 4: Broader Evaluation

Review whether the new rail is also suitable for:
- other member/public sectional navs
- other admin tabbed forms

Do not broaden adoption until:
- member account
- first admin form tab use case

have both proven stable.

## Migration Guidance

### Member Account

Current component:
- [MemberAccountNav.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/patterns/member-account-shell/MemberAccountNav.jsx)

Recommended change:
- preserve route matching logic
- swap current mobile presentation to the new route-nav rail wrapper
- avoid duplicating active route logic

### Admin Form Tabs

Current component:
- [FormSectionTabs.jsx](/mnt/c/local/community-app/apps/hub-platform/src/components/patterns/form-section-tabs/FormSectionTabs.jsx)

Recommended change:
- preserve tab semantics and keyboard behavior
- either:
  - refactor `FormSectionTabs` to compose `HorizontalScrollRail`
  - or wrap its tab row in `HorizontalTabRail`

The goal is to reuse the rail behavior without rewriting the tab logic from scratch.

## Explicit Non-Goals

This work should not become:
- a generic content carousel
- a slider-library integration
- a large visual redesign
- a new global nav system
- a public/admin token unification effort

It is a focused structural enhancement for horizontal navigation on mobile.

## Risks And Guardrails

### Risk: Token Leakage

If the shared primitive owns too much appearance, admin/public styles will start to leak into each other.

Guardrail:
- shared primitive owns behavior and structure only
- wrappers own semantic appearance

### Risk: Accessibility Regression

If route nav and tabs are forced into one top-level abstraction, semantics will get muddled.

Guardrail:
- keep separate wrappers for nav and tabs

### Risk: Overengineering

This could turn into a generic carousel platform unnecessarily.

Guardrail:
- use native horizontal scroll
- lightweight active-item reveal only
- no heavy slider dependency

## Recommended First Implementation Slice

Build in this order:

1. `HorizontalScrollRail`
2. member account mobile nav adoption
3. admin `FormSectionTabs` adoption

This sequence gives us:
- the highest-value mobile improvement first
- immediate proof that the abstraction works across both route-nav and tab use cases
- a clear check against token leakage before broader reuse

## Final Recommendation

Proceed with:
- one shared horizontal mobile rail primitive
- one route-navigation wrapper
- one tabs wrapper

Keep the visual language close to the current `SegmentedToggle` family, but do not literally overload `SegmentedToggle` for these use cases.

Most importantly:
- share behavior
- keep semantics distinct
- keep public/admin styling isolated

That is the cleanest implementation path and the lowest-risk way to improve mobile navigation across both the member account and admin forms.
