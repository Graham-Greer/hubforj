# Admin Portal Theming Implementation Plan

## Purpose

This document defines the concrete admin-only theming plan for hub-platform before any implementation begins.

It maps:
- the exact theming strategy
- the token approach
- the component areas affected
- the scope boundaries that must protect public hub pages
- the rollout order

Related docs:
- [admin-portal-design-system-audit.md](/mnt/c/local/community-app/docs/admin-portal-design-system-audit.md)
- [admin-mobile-nav-implementation-plan.md](/mnt/c/local/community-app/docs/admin-mobile-nav-implementation-plan.md)

---

## Primary Goal

Bring the hub-platform admin portal closer to the product-site level of visual polish in terms of:

- surfaces
- backgrounds
- depth
- elevation
- chrome hierarchy

without:

- changing public hub theming behavior
- breaking shared component contracts
- requiring a deep UI architecture refactor

---

## Non-Negotiable Guardrails

These rules must be upheld during implementation:

1. All visual changes must be admin-only.
2. Public-site templates and public hub theme behavior must remain untouched.
3. Shared root tokens must not be broadly changed as a shortcut.
4. The admin portal should move closer to product-site polish, not copy product-site styling literally.
5. Readability and operational clarity must take priority over decorative styling.
6. Dark mode and light mode must both remain coherent.
7. The rollout should begin with shell and surface hierarchy before any wider component restyling.
8. Dense operational regions such as forms, tables, record lists, and filter toolbars must not receive decorative treatment that harms scanability.
9. Embedded public previews inside admin must be able to opt out of the admin theme layer.
10. Portaled overlays must be explicitly validated because they may not inherit admin-scoped variables automatically.

---

## Recommended Strategy

## 1. Introduce an admin-only theme scope

Implementation should begin by creating a dedicated admin shell theme scope.

Recommended shape:
- a wrapper on the admin shell root
- for example an admin-only data attribute or class such as:
  - `[data-admin-theme="workspace"]`
  - or `.adminThemeScope`

This scope should wrap only the admin workspace subtree.

Inside that scope, we can safely override shared semantic variables without changing global application behavior.

## 2. Prefer scoped semantic overrides over global token replacement

There are two possible approaches:

### Option A. Introduce new admin-specific variables and rewrite component CSS to use them

Pros:
- explicit
- easy to reason about

Cons:
- higher implementation cost
- touches more files
- duplicates semantic vocabulary that already exists

### Option B. Override existing semantic variables within the admin scope

Pros:
- lower churn
- broader visual impact
- existing components update naturally

Cons:
- requires careful validation
- can affect more admin components at once

Recommended approach:
- use **admin-scoped overrides of shared semantic variables**
- add a small number of truly admin-specific variables only where needed

This gives the best balance of control and leverage.

Explicit tradeoff:
- this approach gives broad visual leverage with low churn
- but it also creates a wider blast radius inside the admin scope than per-component rewrites would
- we accept that tradeoff because the admin workspace is the intended target, and we mitigate it with route validation and preview/portal escape handling

---

## Token Strategy

## Layer 1. New admin-scoped foundation variables

Inside the admin theme scope, define a small admin vocabulary that expresses the desired visual hierarchy.

Recommended tokens:

```css
--admin-bg-canvas
--admin-bg-shell
--admin-surface-1
--admin-surface-2
--admin-surface-3
--admin-surface-muted
--admin-surface-elevated
--admin-border-subtle
--admin-border-strong
--admin-shadow-card
--admin-shadow-elevated
--admin-shadow-overlay
--admin-nav-hover
--admin-nav-active
--admin-nav-indicator
--admin-overlay-scrim
```

These should not be public-facing or template-facing tokens.

They exist only to help construct the admin visual system cleanly.

## Layer 2. Scoped remapping of shared semantic tokens

Within the admin shell scope, remap shared semantic variables to the admin foundation values.

Recommended shared tokens to override inside the admin scope:

```css
--bg-canvas
--surface-primary
--surface-secondary
--surface-tertiary
--panel-bg
--panel-border
--template-accent-band
--border-subtle
--border-strong
--shadow-sm
--shadow-md
--shadow-lg
--admin-nav-item-indicator
```

Important:
- these overrides should happen only inside the admin theme scope
- they must never replace the global default values
- if a component renders outside the admin theme scope via a portal, these overrides will not reach it automatically

---

## Visual Direction To Implement

## 1. Canvas and shell

Desired outcome:
- the admin workspace canvas should feel more intentional and layered
- the shell should have clearer separation from the content surfaces

Implementation direction:
- use a richer admin canvas than the current flat neutral
- keep it restrained and operational, not highly decorative
- allow slightly deeper tonal separation between background and panel layers
- do not rely solely on inherited root background behavior if the admin shell itself owns the visible workspace canvas

## 2. Sidebar and topbar

Desired outcome:
- admin chrome should feel more premium and modern
- sidebar and topbar should visually belong to the same system

Implementation direction:
- introduce stronger shell/chrome surface treatment
- create better contrast between shell chrome and content surfaces
- preserve readability of nav labels and status indicators

## 3. Panels and cards

Desired outcome:
- panels should feel more elevated and intentional
- hierarchy between standard, muted, and elevated surfaces should be clearer

Implementation direction:
- strengthen panel contrast subtly
- adjust border treatment so surfaces are not relying on flat grey fills alone
- use elevation and tonal hierarchy more deliberately
- avoid strong translucency, glow, or decorative gradients in dense operational regions

## 4. Navigation states

Desired outcome:
- nav items should feel more polished and more clearly interactive

Implementation direction:
- stronger hover surface
- more deliberate active background
- keep active indicator behavior
- ensure current route remains easy to scan

## 5. Overlays and utility surfaces

Desired outcome:
- menus, drawers, onboarding panels, and floating surfaces should feel like part of the refreshed admin shell

Implementation direction:
- align compact menus, mobile drawer, onboarding panels, and other admin overlays with the new admin surface hierarchy
- validate focus states and contrast in both light and dark modes
- confirm whether each overlay renders within the admin scope or through a portal, then theme accordingly

---

## Component Map

The following component areas should be covered by the theming pass.

## Phase 1: shell and major chrome

- [HubAdminShell.module.css](/mnt/c/local/community-app/apps/hub-platform/src/components/patterns/hub-admin-shell/HubAdminShell.module.css)
- [HubAdminTopbar.module.css](/mnt/c/local/community-app/apps/hub-platform/src/components/patterns/hub-admin-shell/HubAdminTopbar.module.css)
- [AdminMobileNav.module.css](/mnt/c/local/community-app/apps/hub-platform/src/components/patterns/hub-admin-shell/AdminMobileNav.module.css)
- [PlatformSidebar.module.css](/mnt/c/local/community-app/apps/hub-platform/src/components/patterns/platform-sidebar/PlatformSidebar.module.css)

Goals:
- shell background
- chrome background
- drawer surface
- shell-to-content separation

## Phase 2: shared admin surface primitives

- [Surface.module.css](/mnt/c/local/community-app/apps/hub-platform/src/components/primitives/surface/Surface.module.css)
- [NavItem.module.css](/mnt/c/local/community-app/apps/hub-platform/src/components/ui/nav-item/NavItem.module.css)
- [Button.module.css](/mnt/c/local/community-app/apps/hub-platform/src/components/ui/button/Button.module.css)
- shared admin menu/panel surfaces that already consume semantic tokens

Goals:
- standard surface hierarchy
- muted surface hierarchy
- active and hover states
- secondary button harmony with refreshed surfaces only

Clarification:
- this is not a general shared-button redesign
- button work in this pass should only ensure admin-scoped variants remain harmonious against refreshed admin surfaces

## Phase 3: admin-only overlays and utilities

- admin onboarding surfaces
- compact menus
- dialogs and popovers used inside the admin workspace

Goals:
- visual consistency with the new shell
- no regressions in accessibility or contrast

## Phase 4: route-level validation

Validate representative routes:
- `/admin`
- `/admin/settings`
- `/admin/settings/branding`
- `/admin/settings/account`
- `/admin/media`
- `/admin/payments?view=setup`
- `/admin/payments?view=plans`
- `/admin/payments?view=payments`
- `/admin/members`
- `/admin/members/[memberId]`
- `/admin/events`
- `/admin/events/[eventId]/registrations`
- `/admin/events/[eventId]/attendance`
- `/admin/courses`
- `/admin/courses/[courseId]/registrations`
- `/admin/courses/[courseId]/attendance`

Goals:
- confirm hierarchy works in content-dense screens
- confirm tables and forms remain clear
- confirm onboarding and help surfaces still sit correctly
- confirm preview and embedded-content escape hatches still work where needed

---

## Suggested Rollout Order

## Step 1. Add admin theme scope

Deliverables:
- add admin-only wrapper/class/attribute
- define initial admin theme token set
- identify any preview regions that require opt-out behavior
- identify any portaled overlay roots that require explicit theming propagation
- no broad component changes yet

Acceptance:
- no public visual regressions possible from scope alone
- known preview and portal edge cases are identified before theming broadens

## Step 2. Remap shell and chrome surfaces

Deliverables:
- admin canvas
- sidebar
- topbar/mobile header
- mobile drawer

Acceptance:
- shell already feels meaningfully closer to product-site polish
- public routes unchanged

## Step 3. Remap shared surface semantics inside admin scope

Deliverables:
- panel background
- muted surfaces
- border hierarchy
- elevation hierarchy

Acceptance:
- cards and panels feel more intentional
- form screens remain readable
- dense data regions remain operational rather than decorative

## Step 4. Refresh nav states

Deliverables:
- hover background
- active background
- indicator harmony

Acceptance:
- navigation feels more polished without becoming noisy

## Step 5. Validate overlays and utilities

Deliverables:
- mobile drawer
- onboarding panels
- compact menus
- dialogs/popovers
- portal propagation or portal-local theme hooks where required

Acceptance:
- admin-only overlays still feel coherent and accessible
- no overlay silently falls back to the old visual system because it renders outside scope

## Step 6. Final polish

Deliverables:
- small spacing, shadow, and border tuning
- light/dark balancing

Acceptance:
- no route feels visually out of family

---

## What Should Be Introduced vs Overridden

## Introduce

Introduce only what is needed for a clean admin theme vocabulary:

- admin theme scope hook
- small admin foundation token set
- any admin-only overlay variables not well represented in shared semantics

## Override in admin scope

Prefer to override, within admin scope only:

- semantic surface tokens
- semantic border tokens
- semantic shadow tokens
- nav indicator and nav-state colors
- panel background contracts
- overlay contracts where they remain within the admin scope

## Avoid introducing

Avoid:
- a full second design system
- parallel component primitives just for admin
- public-site token reuse by direct copy-paste
- route-level one-off color hacks

---

## Product-Site Alignment Principles

These principles define what “closer to the product site” means for the admin portal:

1. stronger surface hierarchy
2. more intentional shell chrome
3. richer canvas/background separation
4. more expressive but still restrained elevation
5. cleaner visual depth

These principles do not mean:

1. identical gradients
2. identical translucency
3. identical mood
4. identical marketing-style treatment

Additional anti-drift rules:

1. no heavy translucency on dense forms and tables
2. no decorative gradient treatments behind operational data regions
3. no reduced text contrast for atmosphere
4. no “marketing shell” treatment that weakens the admin portal’s utility

The admin portal should remain operational first.

---

## Validation Checklist

Before considering the theming work complete, verify:

1. Public hub pages are visually unchanged.
2. Public-site templates are visually unchanged.
3. Admin shell feels more modern in both light and dark mode.
4. Surface hierarchy is clearer on settings, payments, members, events, and media routes.
5. Tables and forms remain easy to scan.
6. Onboarding overlays still read correctly against the updated shell.
7. Mobile drawer still feels coherent with the header and shell.
8. Secondary buttons, compact menus, and panels still look consistent.
9. No admin route relies on one-off overrides to look correct.
10. Focus rings, hover states, and active states remain visible in both modes.
11. Embedded public previews do not inherit unintended admin theming.
12. Portaled overlays receive the intended admin styling or are explicitly left on the default system by design.

---

## Final Recommendation

Proceed with an admin-only scoped theming pass built around:

1. a dedicated admin theme scope
2. a small admin visual token foundation
3. scoped remapping of shared semantic surface tokens
4. a phased rollout beginning with shell and surfaces

This is the lowest-risk and highest-leverage path to modernising the admin portal while protecting the existing hub-platform design system.
