# Admin Portal Design System Audit

## Purpose

This document locks in the visual audit findings for the hub-platform admin portal and records the agreed direction before any admin-only theming work begins.

It exists to ensure that:
- the admin portal can be modernised without destabilising the shared hub-platform design system
- public-site theming and template behavior remain untouched
- future implementation work follows clear visual and architectural guardrails

Related docs:
- [admin-mobile-nav-implementation-plan.md](/mnt/c/local/community-app/docs/admin-mobile-nav-implementation-plan.md)
- [admin-onboarding-engineering-plan.md](/mnt/c/local/community-app/docs/admin-onboarding-engineering-plan.md)
- [admin-onboarding-product-spec.md](/mnt/c/local/community-app/docs/admin-onboarding-product-spec.md)

---

## Locked Conclusions

The following points are now the agreed baseline and must be upheld during implementation:

1. The admin portal visual mismatch is primarily a surface/background/elevation problem, not a structural UI architecture problem.
2. The product site has a stronger and more modern surface hierarchy than the admin portal.
3. The hub-platform admin portal is already tokenised enough that we should not begin with a deep component refactor.
4. Any visual refresh must be admin-only and must not alter the theming or template behavior of public hub pages.
5. Shared global hub-platform tokens must not be broadly changed at `:root` as a shortcut.
6. The safest path is an admin-scoped theming layer that remaps surfaces and backgrounds inside the admin shell only.
7. The target outcome is not to make the admin portal look identical to the product site.
8. The correct goal is to bring the admin portal closer to the product-site level of polish, depth, and modernity while preserving admin clarity and operational usability.
9. Any embedded public preview region rendered inside the admin workspace must have an explicit escape hatch so public-facing previews do not inherit admin-only surface styling unintentionally.
10. Portaled overlays must be treated as an explicit theming edge case because admin-scoped variables do not automatically reach surfaces rendered outside the admin subtree.

---

## Current State Audit

## 1. Hub-platform foundation

The hub-platform admin portal currently inherits a shared semantic and theme foundation from:

- [tokens.css](/mnt/c/local/community-app/apps/hub-platform/src/app/styles/tokens.css)
- [theme-modes.css](/mnt/c/local/community-app/apps/hub-platform/src/app/styles/theme-modes.css)
- [semantic.css](/mnt/c/local/community-app/apps/hub-platform/src/app/styles/semantic.css)

Key observations:

- the light-mode canvas and surface tokens are largely neutral/slate driven
- the dark-mode surfaces also remain operational and restrained rather than atmospheric
- panel contracts rely on relatively flat surface fills and subtle border separation
- the system is stable and coherent, but visually conservative

This gives the admin portal a clear but older-feeling grey/neutral shell.

## 2. Product-site foundation

The product site uses a distinct visual system driven from:

- [tokens.css](/mnt/c/local/community-app/apps/product-site/src/app/styles/tokens.css)
- [semantic.css](/mnt/c/local/community-app/apps/product-site/src/app/styles/semantic.css)

Key observations:

- canvas backgrounds are richer and more layered
- surfaces use stronger hierarchy and intentional depth
- borders, gradients, and shadows are more expressive
- the interface has more atmosphere without relying solely on flat neutral fills

This is the primary reason the product site feels more modern.

## 3. Shared component contracts

Important shared primitives already use semantic variables rather than hardcoded colors:

- [Surface.module.css](/mnt/c/local/community-app/apps/hub-platform/src/components/primitives/surface/Surface.module.css)
- [Button.module.css](/mnt/c/local/community-app/apps/hub-platform/src/components/ui/button/Button.module.css)
- [PlatformSidebar.module.css](/mnt/c/local/community-app/apps/hub-platform/src/components/patterns/platform-sidebar/PlatformSidebar.module.css)
- [NavItem.module.css](/mnt/c/local/community-app/apps/hub-platform/src/components/ui/nav-item/NavItem.module.css)

This is a major positive finding:

- we do not need to start by rewriting the component model
- we can get meaningful improvement by changing how the admin shell scopes and consumes tokens

---

## Why The Admin Portal Feels Older

The current admin visual language feels older mainly because of the following:

## 1. Flat shell hierarchy

The admin canvas, sidebar, topbar, and panel surfaces sit too close together visually.

Effects:
- less depth
- weaker shell-to-content separation
- a “grey on grey on white” feel

## 2. Surface hierarchy is too compressed

The difference between:
- app canvas
- shell chrome
- standard card/panel
- muted section
- active or elevated surface

is not strong enough.

Effects:
- interfaces feel flatter
- important surfaces do not stand out enough
- the system feels more utilitarian than intentional

## 3. Borders carry too much of the structure

The admin portal relies heavily on subtle borders for separation.

Effects:
- less atmospheric depth
- fewer opportunities for richer panel contrast
- a more dated enterprise-ui character

## 4. Elevation is restrained

Shadows and elevated surfaces are used conservatively.

Effects:
- panels often read as flat boxes rather than layered workspace surfaces
- overlays and chrome do not feel as intentional as on the product site

## 5. Chrome is functional but not visually expressive

The sidebar, topbar, and drawer structures are good, but their visual treatment remains conservative.

Effects:
- less modern feel
- less personality
- lower perceived craft compared with the product site

---

## What Makes The Product Site Feel More Modern

The product site’s stronger visual quality comes mainly from:

1. stronger background layering
2. clearer separation between canvas and surfaces
3. more expressive but controlled borders
4. deeper elevation and shadow hierarchy
5. more confident accent integration
6. more visual atmosphere in the shell and large surfaces

Important note:

This is not a recommendation to copy the product site literally.

The admin portal has different needs:
- higher information density
- more forms and operational tables
- longer dwell time
- stronger need for scanability and clarity

So the correct interpretation is:
- product-site-inspired depth
- admin-grade restraint

---

## Recommended Direction

## 1. Use an admin-only theming layer

This is the most important architectural conclusion.

The admin portal should gain its own scoped visual layer rather than altering the global shared foundation.

That means:
- no broad shared-token replacement at root scope
- no changes that leak into public hub pages
- no public-site template regressions

## 2. Scope the visual shift to the admin shell subtree

The ideal place for theming scope is the admin shell or an explicit admin theme root.

This allows us to:
- remap semantic surface variables safely
- modernise admin chrome and panels consistently
- leave public and template surfaces untouched

## 3. Start with surfaces and backgrounds first

The highest-value visual refresh should focus on:

- app canvas
- sidebar
- topbar and mobile header
- mobile drawer
- panels and cards
- muted surfaces
- overlays and popovers
- nav hover and active states

This will deliver the biggest perceptual improvement without pulling the entire component library into redesign work.

## 4. Aim for stronger depth, not decorative styling

The admin portal should become:
- more layered
- more intentional
- less flat
- more aligned with the product-site standard of polish

It should not become:
- overly glossy
- highly translucent everywhere
- difficult to scan
- marketing-led at the expense of productivity

---

## What Should Not Change

The following are explicitly out of scope for this theming direction unless separately approved:

1. Public-site template theming behavior
2. Shared public hub theme tokens at the global root
3. The public-site visual identity itself
4. The information architecture of the admin portal
5. Core operational interaction patterns that already work well
6. A full typography redesign
7. A component rewrite of all form, table, and layout primitives

Additional scope clarification:

- in scope:
  - the hub admin shell and routes rendered within it
  - admin onboarding surfaces rendered for hub admins
  - admin compact menus, drawers, and dialogs tied to the hub admin workspace
- out of scope unless separately approved:
  - public hub pages
  - public-site templates and product-site marketing surfaces
  - any non-admin route tree not mounted inside the admin shell
  - support/operator platform areas outside the hub admin shell

---

## Safe Areas For Change

The following are appropriate areas for admin-only modernisation:

1. shell canvas background
2. sidebar surface styling
3. topbar and mobile header surface styling
4. drawer background and border treatment
5. card and panel background hierarchy
6. muted section styling
7. elevated overlay surfaces
8. navigation hover, active, and selected backgrounds
9. admin-only border, shadow, and elevation expressions
10. admin-only chrome treatment for portaled overlays if they are intentionally part of the hub admin experience

---

## Risk Assessment

## Low risk

- admin-only shell surface tokens
- admin-only canvas styling
- admin-only panel and muted-surface overrides
- admin-only nav state styling
- admin-only drawer and header styling
- admin-only preview escape hatches for embedded public previews

## Medium risk

- remapping shared semantic tokens inside the admin subtree
- changing overlay surfaces that are also used by onboarding and menus
- changing surface contrast without validating dark mode thoroughly
- any overlay, menu, or dialog rendered through portals outside the admin subtree
- any admin route that embeds public-facing preview output inside the themed shell

## High risk

- changing shared root tokens globally
- changing theme-mode foundations for the whole hub-platform app
- changing shared public hub template surface semantics without scope isolation

---

## Edge Cases To Account For

The following edge cases must be handled intentionally during implementation:

## 1. Embedded public previews inside admin

If an admin route renders:
- public site previews
- template previews
- branded public blocks

inside the admin shell subtree, those regions must be able to opt out of admin-scoped surface overrides.

Implementation implication:
- provide a nested escape hatch that restores public/default semantic values inside preview regions

## 2. Portaled overlays

Any admin surface rendered outside the admin shell subtree via a portal may not inherit admin-scoped CSS variables automatically.

Examples:
- dialogs
- menus
- popovers
- onboarding layers

Implementation implication:
- either render them within the admin scope
- or propagate admin theme variables to the overlay root deliberately

## 3. Hardcoded surface values

Not every older admin component can be assumed to be fully semantic-token driven.

Implementation implication:
- perform a preflight audit for hardcoded colors, borders, and shadows in representative admin routes before rollout broadens

## 4. Canvas ownership

If the visible workspace background is partially controlled outside the admin scope, overriding `--bg-canvas` alone may not produce the intended result.

Implementation implication:
- the admin shell should explicitly own its visible canvas where necessary

---

## Final Architectural Position

The admin portal does not need a deep design-system refactor before visual improvement can begin.

The correct path is:

1. introduce an admin-only theming scope
2. remap surfaces, backgrounds, borders, and elevation inside that scope
3. preserve shared component behavior
4. validate key admin routes and overlays
5. leave public-site theming and template behavior untouched

This is the locked direction for future implementation work.
