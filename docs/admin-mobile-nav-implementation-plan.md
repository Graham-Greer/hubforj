# Admin Mobile Navigation Implementation Plan

## Goal

Introduce a true mobile navigation system for the admin portal while preserving the current desktop sidebar experience.

Desktop behavior remains unchanged:
- persistent left sidebar
- current grouped nav structure
- current topbar behavior

Mobile and tablet behavior changes:
- replace the inline full-width sidebar stack with a burger-triggered drawer
- open a slide-in admin navigation panel beneath the topbar
- include grouped admin nav items, theme toggle, and sign-out actions
- keep the design visually admin-portal centric rather than copying the public-site styling directly

## Current State

Current admin responsive behavior:
- `HubAdminShell` renders `PlatformSidebar` inline at all breakpoints
- below `64rem`, the shell collapses to one column
- the sidebar becomes full-width and sits above the page content
- the topbar only reflows; it does not expose a burger or drawer

Public-site reference behavior:
- burger trigger appears below desktop breakpoint
- body scroll locks when menu is open
- overlay appears beneath the header
- fixed panel slides in from the right
- drawer closes on route change
- drawer closes on `Escape`
- drawer closes when resizing back to desktop

## Product Intent

The admin mobile nav should:
- feel native to the admin portal
- reuse the existing admin nav grouping and nav item design
- avoid introducing a second navigation IA
- keep small-screen interaction simple and focused

It should not:
- change the desktop experience
- duplicate too many topbar actions both in the header and in the drawer
- feel like a public-site header transplanted into admin unchanged

## Proposed UX

### Desktop

At widths above `64rem`:
- show persistent `PlatformSidebar`
- hide mobile drawer
- hide burger trigger
- keep current topbar actions

### Mobile / Tablet

At widths at or below `64rem`:
- hide persistent sidebar
- show burger trigger in admin topbar
- keep topbar visible and sticky as it is today
- open a right-side drawer beneath the header

Drawer contents, in order:
1. grouped admin navigation
2. divider
3. theme controls
4. `View public site`
5. `Back to platform` when relevant
6. sign-out action

### Drawer interaction rules

- open from burger trigger
- close from burger trigger
- close from overlay click
- close on `Escape`
- close on route change
- close when resizing back above desktop breakpoint
- lock body scroll while open

## Recommended Component Structure

### 1. `HubAdminShell`

Continue as the layout orchestrator.

Responsibilities:
- render desktop sidebar only on desktop
- render topbar at all breakpoints
- mount mobile drawer component
- pass shared nav/action data into both desktop and mobile nav surfaces

### 2. `HubAdminTopbar`

Add mobile navigation trigger here.

Responsibilities:
- render burger trigger on small screens
- keep current desktop actions for larger screens
- simplify visible topbar actions on smaller screens if needed

Recommended mobile header actions:
- burger trigger
- possibly theme toggle only if we deliberately want duplication

Recommended cleaner version:
- burger trigger only in the mobile header cluster
- move theme toggle and sign-out into drawer

### 3. `AdminMobileNav`

New component.

Responsibilities:
- manage the drawer panel surface
- render grouped nav using existing nav data
- render admin-specific secondary actions
- mirror public mobile-nav interaction behavior

Suggested props:
- `hub`
- `navGroups`
- `open`
- `onClose`
- `operatorSession`
- `adminSession`
- `supportMode`
- `operatorTheme`

### 4. `AdminMobileNavSection`

Optional helper if needed.

Use only if the main component starts getting too dense.

Responsibilities:
- render grouped content areas inside the drawer
- keep markup cleaner

### 5. Shared nav rendering

We should avoid duplicating active-item logic if possible.

Best approach:
- continue using `PlatformSidebar` for desktop
- create a shared lower-level renderer for grouped nav lists, or
- let `AdminMobileNav` reuse `NavGroup` and `NavItem` directly with the same `groups` input

The latter is likely enough and keeps implementation light.

## Visual Design Direction

The drawer should use admin tokens, not public-header tokens directly.

Recommended feel:
- overlay uses admin-appropriate dimming
- drawer uses admin surfaces and border tokens
- nav groups retain current title styling
- nav items remain exactly the same as desktop
- spacing should feel slightly roomier than desktop sidebar

Suggested structure:
- drawer panel width:
  - mobile: `min(86vw, 24rem)`
  - tablet: `clamp(22rem, 42vw, 28rem)`
- panel should have:
  - left border
  - elevated shadow
  - internal scroll
  - safe-area bottom padding

## Behavioral Implementation Notes

### State

Use local client state in the admin shell or topbar:
- `const [mobileNavOpen, setMobileNavOpen] = useState(false)`

Recommendation:
- state should live in `HubAdminShell`
- topbar receives `mobileNavOpen` and `onToggleMobileNav`
- mobile nav receives `open` and `onClose`

This keeps the shell in control and avoids duplicated state.

### Body scroll lock

When drawer is open:
- set `document.body.style.overflow = "hidden"`
- restore previous value on close/unmount

### Route-change close

Use pathname and search param changes to close automatically.

This mirrors the public implementation and avoids stale open states.

### Escape close

Register `keydown` listener when drawer is open.

### Breakpoint reset

When viewport returns above desktop breakpoint:
- auto-close the drawer

### Accessibility

Minimum requirements:
- burger trigger has `aria-expanded`
- burger trigger has `aria-controls`
- drawer has accessible label
- overlay is not focusable
- focus should move into the drawer when it opens
- focus should return to burger trigger on close
- `Escape` closes

Recommended:
- trap focus within the drawer while open

This is preferable for production quality, especially because the drawer is modal in behavior.

## Action Placement Recommendations

### Mobile topbar

Recommended visible controls:
- burger trigger
- optional `View public site` only if space allows

Prefer not to keep:
- full sign-out button
- full theme toggle cluster
- multiple secondary actions

Reason:
- the header gets crowded quickly on mobile
- the drawer is the right home for secondary controls

### Drawer utility section

Suggested order:
1. theme toggle
2. `View public site`
3. `Back to platform` if operator session without support mode
4. sign out

If support/operator context changes available actions, mirror the same conditional logic the topbar currently uses.

## Reuse vs New Build

### Reuse from public implementation

Safe to reuse conceptually:
- open/close state behavior
- route-change close
- breakpoint close
- body scroll lock
- overlay + fixed panel pattern

Not recommended to copy directly:
- public token names
- public CTA section structure
- account-focused mobile drawer IA

### Reuse from admin implementation

Should reuse directly:
- `navGroups` data
- `NavGroup`
- `NavItem`
- existing topbar session logic
- `WorkspaceThemeToggle`
- `HubSignOutButton`
- `OperatorSignOutButton`

## Suggested File Changes

Likely files to update:
- `apps/hub-platform/src/components/patterns/hub-admin-shell/HubAdminShell.jsx`
- `apps/hub-platform/src/components/patterns/hub-admin-shell/HubAdminShell.module.css`
- `apps/hub-platform/src/components/patterns/hub-admin-shell/HubAdminTopbar.jsx`
- `apps/hub-platform/src/components/patterns/hub-admin-shell/HubAdminTopbar.module.css`

Likely new files:
- `apps/hub-platform/src/components/patterns/hub-admin-shell/AdminMobileNav.jsx`
- `apps/hub-platform/src/components/patterns/hub-admin-shell/AdminMobileNav.module.css`

Possible optional refactor:
- shared grouped nav renderer if duplication starts to grow

## Rollout Plan

### Phase 1

Foundation:
- add burger trigger
- add drawer component
- hide desktop sidebar at small screens
- show overlay + panel
- render grouped admin nav inside drawer

### Phase 2

Utility actions:
- move theme toggle into drawer
- move sign-out into drawer
- add `View public site`
- add `Back to platform` conditionally

### Phase 3

Hardening:
- focus management
- route-close behavior
- breakpoint-close behavior
- accessibility pass
- responsive spacing polish

## Acceptance Criteria

### Desktop

- sidebar remains fixed at left
- topbar remains unchanged
- no burger is visible
- no drawer can open

### Mobile / Tablet

- sidebar no longer appears inline above content
- burger is visible in the topbar
- opening burger shows dim overlay and right-side drawer
- drawer contains the same grouped nav items as desktop
- active nav item still highlights correctly
- theme toggle is available
- sign-out action is available
- `View public site` is available
- operator-specific actions appear only when appropriate
- drawer closes on:
  - overlay click
  - burger re-click
  - route change
  - `Escape`
  - resize to desktop

### Accessibility

- trigger uses correct ARIA state
- drawer has accessible label
- keyboard users can enter and exit the drawer safely
- focus returns to trigger after close

## Risks / Watchouts

### 1. Duplicate controls across topbar and drawer

Avoid leaving too many actions in both places on mobile.

### 2. Drawer height with support banner

The admin shell can render `SupportModeBanner`.
If the drawer is positioned beneath the topbar only, confirm visual layering when the banner is present.

Recommendation:
- drawer should likely sit beneath the sticky topbar region only
- but we must test with support-mode banner visible

### 3. Onboarding help launcher

The bottom-right onboarding help launcher may visually compete with the drawer overlay.

Recommendation:
- hide the launcher while mobile drawer is open

### 4. Scrollable nav length

Some hubs may have long nav lists.

Recommendation:
- drawer inner content should scroll independently
- top section and utility section spacing should remain stable

## Recommendation Before Coding

Proceed with:
1. shell-owned open state
2. new `AdminMobileNav` component
3. reuse `NavGroup` and `NavItem`
4. move theme/sign-out into drawer on mobile
5. preserve desktop sidebar unchanged

This is the cleanest path and aligns well with the existing public-site interaction model without making the admin portal feel like a copy of it.
