# Superadmin + CMS UX Upgrade Specification
Version: `v2.1-aligned`
Status: `Implementation authority`
Audience: `Codex / engineering implementation`
Scope: `Platform superadmin shell, hub-scoped workspace navigation, CMS editor UX, preview parity, performance hardening, architectural guardrails`
Authority: `This document replaces v2.0 and resolves conflicts with the current product/source-of-truth docs.`

---

# 0. Mandatory Directive

This document is intentionally prescriptive. Codex must not infer product structure, routes, or architecture outside what is defined here.

Implementation priorities in order:
1. preserve route/auth/session correctness,
2. preserve site performance,
3. preserve architectural standards and layering,
4. improve UX quality and visual polish,
5. avoid broad rewrites.

If a requirement in this document appears to conflict with an existing implementation detail, Codex must prefer the approach that keeps the existing server/auth/data contract stable and isolates change to the UI/shell/workspace layer.

Codex must **not**:
- create monolith files,
- place large mixed-responsibility logic inside route files,
- add speculative routes not listed in this document,
- move server authority to the client,
- bypass existing services/repositories with direct ad hoc data code,
- introduce global state where route-local or component-local state is sufficient,
- introduce broad rerender surfaces across the admin shell.

---

# 1. Alignment Summary

This revision brings the plan into alignment with the uploaded standards and source documents.

Resolved alignment changes:
- route authority is now explicit,
- `Support Mode` is treated as a context-switch action, not a normal workspace tab route,
- global invites are removed from the required route map for this phase,
- `Domains` and `Settings` are not new routes in this phase,
- CMS route creation is explicitly approved and listed here so Codex does not guess,
- performance and non-monolith constraints are elevated to first-class implementation rules,
- shell/component extraction rules are explicit.

---

# 2. Non-Negotiable Engineering Rules

## 2.1 Layering
All work must follow:

`tokens -> primitives -> ui -> patterns -> sections -> routes`

Interpretation:
- `tokens`: colors, spacing, radii, shadows, motion, typography, z-index, sizing scales.
- `primitives`: low-level reusable building blocks.
- `ui`: reusable components with bounded responsibility.
- `patterns`: composed product patterns such as shell, nav, workspace layout.
- `sections`: larger composed surfaces if needed.
- `routes`: composition entry points only.

Route files must remain thin.

## 2.2 No Monolith Rule
Codex must not create any new file that becomes a mixed-responsibility monolith.

A file is considered a monolith if it does multiple of the following at once:
- owns data fetching,
- owns route composition,
- owns local interaction logic,
- owns complex rendering branches,
- owns business rules,
- owns modal/drawer state for multiple independent features,
- owns large CSS surface by direct inline styles or giant class sprawl.

### Required decomposition pattern
For each major surface:
- route file: compose server data + shell + leaf boundaries,
- pattern component: own layout structure,
- ui components: own bounded interaction surfaces,
- hooks/utilities: own local state logic only where justified,
- service/repository layer: own data operations.

## 2.3 Server-First Rule
Use server components and server data loading by default.

Use client components only for:
- interactive nav controls,
- drawers/menus/tooltips,
- drag-and-drop,
- editor form interactions,
- local layout controls,
- preview refresh controls.

Do not turn route trees into client trees unnecessarily.

## 2.4 Performance Rule
Every implementation decision must protect both real and perceived performance.

Required performance posture:
- persistent shell where possible,
- minimal client hydration,
- isolated client islands,
- narrow prop surfaces,
- no shell rerenders on editor typing,
- lazy-load secondary tools,
- no full-page refresh patterns for local editor actions,
- no oversized single components that rerender everything.

## 2.5 Auth/Session Rule
- server auth/session gating remains authoritative,
- protected navigation must not occur before canonical session readiness,
- support mode must preserve its session/context semantics,
- preview must stay server-protected,
- no client-only route authorization assumptions.

## 2.6 Styling Rule
- use token-only styling in colocated `.module.css`,
- do not hardcode values where tokens should exist,
- no inline style usage except truly dynamic values that cannot reasonably be expressed through class/tokens,
- admin surfaces must visually align with platform design tokens.

---

# 3. Exact Approved Route Map

This section is route-authoritative for this upgrade.

## 3.1 Existing routes to preserve
These routes are existing and must continue to work:

- `/platform`
- `/platform/hubs`
- `/platform/hubs/create`
- `/platform/hubs/[hubId]`
- `/platform/hubs/[hubId]/invite-admin`
- `/platform/support/[hubId]`

## 3.2 New routes approved by this upgrade
These routes are explicitly approved to be created as part of this upgrade and should be added to the canonical route map after implementation:

- `/platform/hubs/[hubId]/cms`
- `/platform/hubs/[hubId]/cms/[pageId]`
- `/platform/hubs/[hubId]/cms/[pageId]/preview`

## 3.3 Routes that must **not** be created in this phase
Codex must **not** create any of the following in this phase:

- `/platform/invites`
- `/platform/support`
- `/platform/hubs/[hubId]/settings`
- `/platform/hubs/[hubId]/domains`
- `/platform/hubs/[hubId]/preview`
- `/platform/hubs/[hubId]/cms/[pageId]/published`
- any parallel or duplicate CMS route tree

## 3.4 How settings/domains are handled in this phase
`Settings` and `Domains` are **UI sections inside** `/platform/hubs/[hubId]`.

They are not standalone routes in this phase.

## 3.5 How support mode is handled in this phase
`Support Mode` is **not** a regular workspace route.

It is an action entry point that starts a support context transition:
- user invokes support mode for a hub,
- session/context is established according to existing auth/session rules,
- user is redirected through `/platform/support/[hubId]`,
- user lands in the hub admin area with persistent support-mode banner/context,
- exiting support mode clears context and returns to `/platform`.

The workspace navigation may expose a `Support Mode` action, but it must invoke the existing support flow rather than behave like a normal tab route.

---

# 4. Information Architecture

## 4.1 Core IA model
The admin experience must clearly separate three things:

1. global platform navigation,
2. current hub context,
3. current workspace inside that hub.

These must not be conflated visually or structurally.

## 4.2 Primary left sidebar
The left sidebar is the global platform navigation surface.

It must contain:
- platform identity/header,
- collapse/expand control,
- hub switcher,
- global nav items,
- optional recent items section,
- bottom utilities/account section.

### Required top-level nav items
- `Hubs` -> `/platform/hubs`
- `Create Hub` -> `/platform/hubs/create`

### Optional top-level nav items in this phase
Only include these if already backed by existing implementation or clearly useful without route invention:
- `Recent`
- `Quick Access`

Do **not** include global invites in required top-level nav for this phase.

## 4.3 Hub switcher
The hub switcher establishes current hub context.

Behavior:
- lives near the top of sidebar,
- shows current hub name + compact visual identity,
- opens a searchable switcher panel/popover/drawer,
- supports recent hubs,
- supports direct select and navigate.

### Hub switch navigation rules
When the user switches hubs while inside a hub-scoped route:
- if currently on `/platform/hubs/[hubId]`, navigate to the target hub overview route,
- if currently on `/platform/hubs/[hubId]/invite-admin`, navigate to the same invite-admin route for the target hub,
- if currently on `/platform/hubs/[hubId]/cms`, navigate to the CMS list for the target hub,
- if currently on `/platform/hubs/[hubId]/cms/[pageId]` or `/preview`, navigate to `/platform/hubs/[targetHubId]/cms` unless an equivalent page mapping is explicitly available.

Do not guess page equivalence across hubs.

## 4.4 Hub workspace navigation
Hub-scoped navigation appears inside the content frame, below page heading/breadcrumbs.

Required workspace items:
- `Overview` -> `/platform/hubs/[hubId]`
- `Invite Admin` -> `/platform/hubs/[hubId]/invite-admin`
- `CMS` -> `/platform/hubs/[hubId]/cms`
- `Support Mode` -> action invoking `/platform/support/[hubId]`

### Non-route workspace anchors allowed inside overview
Within `/platform/hubs/[hubId]`, page-local navigation may expose anchored sections such as:
- `Settings`
- `Domains`

These must remain page-local sections, not new routes.

---

# 5. Shell Architecture

## 5.1 Required shell model
Use one persistent platform shell for `/platform/*`.

The shell must provide:
- left sidebar,
- top bar with account utilities only,
- main content frame,
- responsive behavior,
- breadcrumbs/page heading region,
- optional workspace subnav region.

The shell must not contain CMS editor-specific state.

## 5.2 Top bar responsibilities
Top bar is limited to global account/utilities concerns.

Allowed content:
- user avatar/initials,
- account menu,
- theme toggle,
- sign out.

Do not place workflow navigation in the top bar.

## 5.3 Responsive behavior
### Large screens
- fixed or sticky left sidebar,
- wide content frame,
- CMS can use immersive workspace width,
- workspace subnav visible inline.

### Medium screens
- sidebar may collapse to icon rail,
- workspace subnav may become horizontally scrollable,
- CMS preview/inspector rails may collapse.

### Small screens
- sidebar becomes drawer,
- CMS becomes pane-switched rather than 3-column,
- avoid overcrowded simultaneous panels.

## 5.4 Sidebar collapse persistence
Persist collapse state per device/browser with local storage.

Do not add server-side settings persistence in this phase.

---

# 6. Performance Architecture

This section is mandatory. Codex must implement within these boundaries.

## 6.1 Persistent shell, isolated workspaces
The platform shell must remain stable across route changes under `/platform/*` where App Router structure allows.

Do not cause shell remounts for routine hub/page navigation if avoidable.

## 6.2 Thin route shells
Each route file must do only what is necessary:
- validate/gate,
- fetch minimal route data,
- compose layout/patterns,
- hand off interactive concerns to leaf components.

Route files must not become UI orchestration monoliths.

## 6.3 Fetch boundaries
### Sidebar fetch budget
Sidebar/hub switcher data must be lightweight.

Allowed sidebar data shape per hub:
- `id`
- `name`
- `slug` or compact identifier if needed
- small status flags only if cheap
- optional recent metadata if already available cheaply

Do not load full hub configs, page trees, media, or CMS page bodies in the global shell.

### CMS list route budget
`/platform/hubs/[hubId]/cms` may fetch:
- page list metadata,
- draft/published status,
- updated timestamps,
- readiness flags,
- minimal counts.

Do not fetch full composition payloads for the whole page list.

### CMS editor route budget
`/platform/hubs/[hubId]/cms/[pageId]` may fetch:
- page metadata,
- draft composition for that page,
- minimal supporting lookup data required to edit.

Do not preload unrelated pages or heavyweight media collections by default.

### Preview budget
`/preview` must fetch only what is required to render the preview.

Avoid loading unrelated admin workspace data into the preview surface.

## 6.4 Client boundary rules
Use client components for:
- sidebar collapse control,
- hub switcher search/select UI,
- tooltips,
- CMS editor field interactions,
- section reorder interactions,
- pane switching,
- preview refresh controls.

Do not make the entire shell or entire route tree client-side because of a few interactive controls.

## 6.5 Lazy loading rules
Lazy-load non-critical or secondary heavy surfaces when practical:
- media panel/modal,
- right-rail inspector tabs,
- large preview helper overlays,
- advanced settings groups.

Do not lazy-load core orientation/navigation surfaces that should be immediately available.

## 6.6 Rerender isolation
Codex must ensure that editor typing or local field changes do not rerender:
- the full platform shell,
- the sidebar,
- unrelated workspace nav surfaces,
- unrelated editor panes.

Prefer narrow prop passing and local state ownership.

## 6.7 No speculative optimistic complexity
Do not implement realtime collaboration, distributed editor presence, or high-complexity live preview streaming in this phase.

Prefer correctness, debounced updates, and stable deterministic rendering.

---

# 7. File and Component Decomposition Rules

## 7.1 Route-level file constraints
Each route file should remain composition-first and compact.

Recommended route responsibilities:
- session/auth validation,
- minimal data acquisition,
- metadata if needed,
- pattern composition.

If a route file grows to handle multiple independent interactive responsibilities, Codex must extract.

## 7.2 Required pattern components
Create or update these patterns as needed:

- `patterns/superadmin-shell/SuperadminShell`
- `patterns/superadmin-sidebar/SuperadminSidebar`
- `patterns/superadmin-topbar/SuperadminTopbar`
- `patterns/hub-switcher/HubSwitcher`
- `patterns/workspace-subnav/WorkspaceSubnav`
- `patterns/admin-page-header/AdminPageHeader`
- `patterns/cms-workspace-layout/CmsWorkspaceLayout`
- `patterns/page-render-frame/PageRenderFrame`
- `patterns/page-preview-chrome/PagePreviewChrome`

## 7.3 Required reusable UI components
Create or update these reusable components as needed:

- `ui/nav-item/NavItem`
- `ui/nav-group/NavGroup`
- `ui/status-badge/StatusBadge`
- `ui/breadcrumbs/Breadcrumbs`
- `ui/empty-state/EmptyState`
- `ui/loading-skeleton/AdminSkeleton`
- `ui/tree-item/TreeItem`
- `ui/inline-action-group/InlineActionGroup`
- `ui/pane-tabs/PaneTabs`
- `ui/split-pane/SplitPane` (only if truly needed)

## 7.4 CMS-specific components
Create or update CMS-specific surfaces with bounded responsibility:

- `patterns/cms-page-list/CmsPageList`
- `patterns/cms-page-header/CmsPageHeader`
- `patterns/cms-sections-tree/CmsSectionsTree`
- `patterns/cms-section-editor/CmsSectionEditor`
- `patterns/cms-preview-panel/CmsPreviewPanel`
- `patterns/cms-preview-toolbar/CmsPreviewToolbar`
- `patterns/cms-media-panel/CmsMediaPanel`

## 7.5 Hook decomposition rule
Do not create one giant `useCmsEditorEverything` hook.

Instead separate by concern where justified, for example:
- route data hydration,
- section selection,
- pane state,
- reorder handling,
- draft save state,
- preview refresh state.

---

# 8. Navigation UX Details

## 8.1 Sidebar item states
Every sidebar item must support:
- default,
- hover,
- active,
- focus-visible,
- pressed,
- disabled.

### Visual requirements
Default:
- quiet surface,
- muted icon,
- readable label.

Hover:
- subtle raised or tinted surface,
- icon emphasis increase,
- label contrast increase,
- no layout shift.

Active:
- clear selected container,
- high-contrast label,
- stronger icon emphasis,
- optional internal accent rail or accent inset.

Focus-visible:
- visible accessible ring,
- not reliant on hover treatment.

## 8.2 Modern hover guidance
Use modern restrained admin styling:
- rounded item container,
- subtle tokenized surface tint,
- soft motion,
- no exaggerated translations,
- no decorative noise.

## 8.3 Sidebar collapsed mode
Collapsed mode requirements:
- icon-only display,
- tooltip on hover/focus,
- `aria-label` for every actionable item,
- no ambiguous icons without labels.

## 8.4 Workspace subnav states
Workspace subnav must clearly distinguish:
- current workspace,
- available destinations,
- action item (`Support Mode`) vs standard route tabs.

`Support Mode` must visually read as an action entry, not just another passive tab.

## 8.5 Breadcrumbs
Breadcrumbs must appear where route depth or editor context benefits from orientation.

Examples:
- `Platform / Hubs`
- `Platform / Hubs / {HubName}`
- `Platform / Hubs / {HubName} / CMS`
- `Platform / Hubs / {HubName} / CMS / {PageName}`
- `Platform / Hubs / {HubName} / CMS / {PageName} / Preview`

---

# 9. Hub Overview Surface

Route: `/platform/hubs/[hubId]`

This route becomes the hub workspace overview/config surface.

## 9.1 Responsibilities
Must provide:
- hub heading + identity,
- high-level hub summary,
- anchored sections for settings/domains if those exist in current product,
- clear actions to `Invite Admin`, `CMS`, and `Support Mode`.

## 9.2 Page-local sections
The overview page may contain internal anchored sections such as:
- `Settings`
- `Domains`
- `Configuration`

These are page sections inside the route, not standalone routes.

## 9.3 UX requirement
The overview must reduce hunting for hub-level administration actions.

It should feel like a workspace landing page, not a sparse details page.

---

# 10. Invite Admin Surface

Route: `/platform/hubs/[hubId]/invite-admin`

## 10.1 Scope
Preserve existing invitation flow and business logic.

This upgrade may improve shell integration, layout, orientation, and polish, but must not rewrite invitation domain logic unless required for bug fixes.

## 10.2 Shell behavior
This route must render inside the persistent platform shell and use the workspace subnav.

---

# 11. CMS Route Design

## 11.1 CMS list route
Route: `/platform/hubs/[hubId]/cms`

### Responsibilities
- list pages for the current hub,
- show page status metadata,
- allow navigation to a page editor,
- support create page entry if current product behavior allows,
- support search/filter/sort if already justified by data volume.

### Each row/card should support
- page title,
- page slug/path if relevant,
- draft/live status,
- updated timestamp,
- readiness/status badge,
- open editor action,
- optional open preview action.

## 11.2 CMS editor route
Route: `/platform/hubs/[hubId]/cms/[pageId]`

### Responsibilities
- provide stable editing workspace,
- show page status/header,
- render structure/editor/preview regions,
- preserve save/guard/conflict logic,
- improve section workflow ergonomics.

## 11.3 CMS preview route
Route: `/platform/hubs/[hubId]/cms/[pageId]/preview`

### Responsibilities
- show draft preview for that page,
- use explicit preview chrome/banner,
- preserve parity with live rendering,
- maintain server auth protection,
- remain `no-store` / dynamic per canonical preview rules.

### Do not create separate published preview route in this phase
If a published comparison mode is desired later, it must be an approved enhancement, not a separate unapproved route.

---

# 12. CMS Workspace Architecture

## 12.1 Desktop workspace model
Desktop editing uses a 3-region logical workspace:
- left: structure / sections tree,
- center: section settings editor,
- right: preview or inspector/media depending on mode.

This does not require all three to be equally heavy at all times.

## 12.2 Mobile/narrow workspace model
On smaller widths, switch to pane-based model:
- `Structure`
- `Editor`
- `Preview`

Do not attempt dense multi-column layout on narrow screens.

## 12.3 Left structure rail
Must support:
- section order visibility,
- section selection,
- drag handle reorder,
- quick actions,
- status indicators,
- add section affordances.

### Section row anatomy
Each section row should support:
- drag handle,
- type/icon,
- label/name,
- status chip,
- quick actions on hover/focus,
- active/selected state.

### Quick actions
Allow when supported by current CMS behavior:
- duplicate,
- hide/show,
- delete,
- move up/down fallback,
- scroll to preview.

## 12.4 Center editor panel
Must support:
- sticky section/page header,
- grouped fields,
- progressive disclosure for advanced fields,
- inline validation,
- dirty state cues,
- clear save status.

## 12.5 Right preview/inspector/media region
Do not overload one region with uncontrolled complexity.

Preferred model:
- mode tabs or segmented controls,
- one primary mode visible at a time,
- preview default when useful,
- inspector/media secondary when explicitly selected.

## 12.6 Add section UX
Do not limit add-section to one bottom action only.

Support at least one of:
- top-level add action,
- inline insert affordance between sections,
- section picker with search/categories if available.

---

# 13. Preview Parity Contract

Preview parity is a hard engineering contract.

## 13.1 Shared rendering rule
Draft preview and live rendering must use the same underlying composition/render path where possible.

Required shared concerns:
- section registry mapping,
- shell/container width logic for the content canvas,
- theme application,
- spacing rules,
- header/footer composition logic where applicable,
- render normalization.

## 13.2 Allowed differences between draft preview and live
Allowed differences only:
- draft uses draft composition,
- live uses published composition,
- preview route uses stricter dynamic/no-store behavior,
- preview includes admin chrome/banner,
- live may use revalidate/cached behavior.

Any other difference is presumed a bug.

## 13.3 Preview chrome requirements
Preview route must include a clear admin preview banner/chrome that states:
- current hub,
- page name,
- previewing draft,
- return-to-editor action,
- optional open-live-page action if available.

## 13.4 Performance requirement for preview
Preview must not load unrelated shell/editor data beyond what is required for preview page rendering and minimal admin chrome.

---

# 14. Support Mode Contract

This section overrides any prior ambiguity.

## 14.1 Nature of support mode
`Support Mode` is a supervised context transition into the hub admin experience.

It is not a standard route tab in the same sense as Overview or CMS.

## 14.2 Entry behavior
Any support-mode entry UI in the superadmin shell must:
- call the existing support-mode flow,
- route through `/platform/support/[hubId]`,
- establish the required session/context,
- land in the hub admin area under support context.

## 14.3 Exit behavior
Exit must:
- clear support context,
- return to `/platform`,
- restore clear admin orientation.

## 14.4 Visual requirement
Any UI entry for support mode should look intentional and slightly differentiated from passive nav items so users understand it changes context.

---

# 15. Media Library Integration Rules

Any CMS media UX introduced or refined in this phase must preserve the canonical media contract.

Codex must not create a simplified custom media picker that bypasses the real media rules.

Preserve/support the canonical media behaviors already defined by the product docs, including as applicable:
- hub-scoped media context,
- media categories/tabs,
- folder model,
- details panel,
- alt-text requirements,
- protected deletion behavior,
- paginated/cursor loading,
- proper image component usage.

If the existing media surface is dense, improve the presentation layer only; do not invent a new incompatible media domain model.

---

# 16. Drag-and-Drop Rules

Any section reordering introduced or refined in CMS must follow the project drag-and-drop standard.

Implementation requirements:
- drag handle only,
- accessible keyboard support,
- tokenized hover/drag states,
- transform-based dragging,
- no layout-jank implementation,
- persistence through the proper data layer,
- stable order field semantics.

Do not invent a custom drag implementation outside the approved DnD approach.

---

# 17. State Model

## 17.1 Shell state
- sidebar collapsed / expanded,
- current hub selection,
- workspace subnav active item,
- mobile drawer open/closed.

## 17.2 CMS view state
- selected section,
- active pane/mode,
- preview panel mode,
- tree expansion state,
- media panel open/closed if applicable.

## 17.3 Draft state
- clean,
- dirty,
- saving,
- saved,
- save failed,
- conflict/stale.

## 17.4 Page lifecycle state
- draft exists,
- published exists,
- preview available,
- readiness incomplete,
- publishable.

Codex must keep these concerns separated. Do not collapse all state into one giant object if it creates unnecessary rerender surfaces.

---

# 18. Loading, Empty, Error, and Recovery States

These states must be designed intentionally.

## 18.1 Empty states required
- no hubs,
- no CMS pages for a hub,
- page has no sections,
- hub switcher search returns no matches,
- preview unavailable.

Each empty state must provide:
- clear title,
- concise explanation,
- primary next action,
- no dead end.

## 18.2 Error states required
- failed to load hub,
- failed to load CMS list,
- failed to load CMS page,
- preview render/load failure,
- save failure,
- stale/conflict state.

Each error state must define:
- user-safe message,
- retry if appropriate,
- fallback navigation path,
- no data-destructive default behavior.

---

# 19. Accessibility Requirements

## 19.1 Navigation
- icon-only items require `aria-label`,
- active route requires correct semantics,
- collapse controls must announce state,
- keyboard traversal must be predictable.

## 19.2 Tree interactions
If tree semantics are used, implement the proper keyboard model.
If full tree keyboard semantics are not implemented, use simpler list/disclosure semantics rather than fake tree roles.

## 19.3 Editor/form surfaces
- labels/help/error relationships must be accessible,
- save/publish state changes should be announced where appropriate,
- focus order must remain logical across pane changes.

## 19.4 Preview
- preview chrome must not trap focus,
- return-to-editor actions must be keyboard accessible,
- preview and admin chrome must remain readable and distinct.

---

# 20. Testing and Verification Requirements

## 20.1 Component tests
Must cover at minimum:
- sidebar collapse persistence,
- hub switcher search/select behavior,
- nav active states,
- workspace subnav rendering,
- support-mode action entry,
- section tree row interactions,
- preview toolbar behaviors.

## 20.2 Route integration tests
Must cover at minimum:
- `/platform/hubs` -> `/platform/hubs/[hubId]`
- `/platform/hubs/[hubId]` -> `/invite-admin`
- `/platform/hubs/[hubId]` -> `/cms`
- `/cms` -> `/cms/[pageId]`
- `/cms/[pageId]` -> `/preview`
- support mode entry via `/platform/support/[hubId]`

## 20.3 Regression checks
Must cover at minimum:
- existing session/auth gating remains authoritative,
- no protected-route churn before session readiness,
- preview remains draft + no-store,
- live remains published + revalidated,
- unsaved change guards still function,
- stale conflict logic still functions.

## 20.4 Visual QA
Must verify:
- sidebar expanded/collapsed states,
- hover/active/focus-visible states,
- CMS workspace desktop/narrow layouts,
- preview parity against live shared content contract.

## 20.5 Performance QA
Must verify at minimum:
- shell does not remount unnecessarily on internal route changes,
- sidebar does not load heavyweight hub/CMS data,
- editor typing does not rerender the shell,
- preview route does not overfetch admin workspace data.

---

# 21. Implementation Phases

## Phase A: Route-authoritative shell foundation
Deliver:
- persistent superadmin shell,
- sidebar/topbar extraction,
- hub switcher,
- workspace subnav scaffold,
- exact approved routes only.

Must not yet broaden scope into unnecessary hub-admin changes.

## Phase B: Hub workspace alignment
Deliver:
- improved `/platform/hubs/[hubId]` overview surface,
- anchored settings/domains sections inside overview,
- strong actions to invite admin, CMS, support mode.

## Phase C: CMS route rollout
Deliver:
- `/platform/hubs/[hubId]/cms`
- `/platform/hubs/[hubId]/cms/[pageId]`
- `/platform/hubs/[hubId]/cms/[pageId]/preview`

Preserve auth/session/data correctness while improving workspace UX.

## Phase D: Preview parity hardening
Deliver:
- shared render frame,
- explicit preview chrome,
- parity verification,
- fetch budget hardening.

## Phase E: Quality hardening
Deliver:
- a11y completion,
- regression tests,
- performance checks,
- loading/error/empty state polish.

---

# 22. Definition of Done

This upgrade is complete only when all of the following are true:

- platform superadmin uses one consistent persistent shell,
- route map matches the exact approved routes in this document,
- no prohibited routes were created,
- support mode remains a context-switch flow rather than a generic tab route,
- hub overview, invite-admin, and CMS surfaces are clearly connected,
- CMS editor is materially easier to navigate,
- preview parity with live is maintained except for explicitly allowed differences,
- shell/navigation changes do not regress session/auth correctness,
- implementation is decomposed into reusable patterns/ui components rather than monolith files,
- performance posture is preserved or improved,
- docs/checklists are updated to reflect actual implementation.

---

# 23. Codex Execution Rule

When implementing from this specification, Codex must behave like a senior software engineer:
- do not guess missing route structure,
- do not overbuild,
- do not couple shell concerns to editor concerns,
- do not create giant components/hooks/files,
- preserve stable contracts,
- extract reusable patterns where repetition appears,
- keep route files thin,
- keep performance visible in every decision.

If a tradeoff appears, prefer:
1. correctness,
2. performance,
3. architectural cleanliness,
4. UX polish.
