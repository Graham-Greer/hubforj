# Superadmin + CMS UX Upgrade Implementation Checklist
Version: `v2.1-aligned`
Status: `Execution checklist for Codex`
Use: `Update this file as implementation progresses.`

---

# 0. Execution Rules

- [ ] Read and follow `superadmin-cms-ux-upgrade-spec-v2.1-aligned.md` before writing code.
- [ ] Do not create any route outside the approved route map.
- [ ] Do not create monolith files.
- [ ] Keep route files thin.
- [ ] Preserve server-auth/session authority.
- [ ] Preserve site performance as a first-class concern.

---

# 1. Route Map Compliance

## 1.1 Preserve existing routes
- [ ] Confirm `/platform` remains functional.
- [ ] Confirm `/platform/hubs` remains functional.
- [ ] Confirm `/platform/hubs/create` remains functional.
- [ ] Confirm `/platform/hubs/[hubId]` remains functional.
- [ ] Confirm `/platform/hubs/[hubId]/invite-admin` remains functional.
- [ ] Confirm `/platform/support/[hubId]` remains functional.

## 1.2 Create newly approved routes
- [ ] Create `/platform/hubs/[hubId]/cms`.
- [ ] Create `/platform/hubs/[hubId]/cms/[pageId]`.
- [ ] Create `/platform/hubs/[hubId]/cms/[pageId]/preview`.

## 1.3 Prohibited routes
- [ ] Do **not** create `/platform/invites`.
- [ ] Do **not** create `/platform/support`.
- [ ] Do **not** create `/platform/hubs/[hubId]/settings`.
- [ ] Do **not** create `/platform/hubs/[hubId]/domains`.
- [ ] Do **not** create `/platform/hubs/[hubId]/preview`.
- [ ] Do **not** create a separate published preview route.

---

# 2. Architecture and File Decomposition

## 2.1 Route shells
- [ ] Keep route files composition-first.
- [ ] Keep data fetching minimal per route.
- [ ] Extract layout/workspace logic into pattern components.
- [ ] Avoid mixed-responsibility route files.

## 2.2 Pattern components
- [ ] Create/update `SuperadminShell`.
- [ ] Create/update `SuperadminSidebar`.
- [ ] Create/update `SuperadminTopbar`.
- [ ] Create/update `HubSwitcher`.
- [ ] Create/update `WorkspaceSubnav`.
- [ ] Create/update `AdminPageHeader`.
- [ ] Create/update `CmsWorkspaceLayout`.
- [ ] Create/update `PageRenderFrame`.
- [ ] Create/update `PagePreviewChrome`.

## 2.3 Reusable UI
- [ ] Create/update `NavItem`.
- [ ] Create/update `NavGroup`.
- [ ] Create/update `StatusBadge`.
- [ ] Create/update `Breadcrumbs`.
- [ ] Create/update `EmptyState`.
- [ ] Create/update `AdminSkeleton`.
- [ ] Create/update `TreeItem`.
- [ ] Create/update `InlineActionGroup`.
- [ ] Create/update `PaneTabs`.
- [ ] Create `SplitPane` only if truly needed.

## 2.4 Hooks/state
- [ ] Do not create one giant all-purpose CMS hook.
- [ ] Separate shell state from CMS editor state.
- [ ] Separate preview refresh state from general editor state.
- [ ] Separate reorder logic from general form logic.

---

# 3. Shell Foundation

## 3.1 Persistent platform shell
- [ ] Ensure `/platform/*` uses one consistent shell.
- [ ] Ensure shell remains mounted across internal platform navigation where App Router structure allows.
- [ ] Ensure shell does not own CMS editor-specific state.

## 3.2 Sidebar
- [ ] Add platform identity/header.
- [ ] Add collapse/expand control.
- [ ] Add hub switcher.
- [ ] Add required top-level items: `Hubs`, `Create Hub`.
- [ ] Add optional recent section only if lightweight.
- [ ] Add bottom account/utilities region.

## 3.3 Top bar
- [ ] Restrict top bar to account/global utilities.
- [ ] Include avatar/account menu.
- [ ] Include theme toggle if already supported.
- [ ] Include sign out.
- [ ] Remove workflow links from top bar.

## 3.4 Sidebar states
- [ ] Implement default state.
- [ ] Implement hover state.
- [ ] Implement active state.
- [ ] Implement focus-visible state.
- [ ] Implement icon-only collapsed state.
- [ ] Add tooltips and `aria-label`s in collapsed mode.

## 3.5 Collapse persistence
- [ ] Persist collapsed state in local storage.
- [ ] Do not add server-stored sidebar preference in this phase.

---

# 4. Hub Switcher

- [ ] Add current hub display.
- [ ] Add searchable switcher surface.
- [ ] Add recent hubs if lightweight.
- [ ] Ensure hub selection updates route deterministically.
- [ ] On hub switch from overview, navigate to target overview.
- [ ] On hub switch from invite-admin, navigate to target invite-admin.
- [ ] On hub switch from CMS list, navigate to target CMS list.
- [ ] On hub switch from CMS editor/preview, navigate to target CMS list unless a safe equivalent mapping exists.
- [ ] Do not guess page equivalence across hubs.

---

# 5. Workspace Navigation

- [ ] Add workspace subnav inside content frame.
- [ ] Add `Overview` item -> `/platform/hubs/[hubId]`.
- [ ] Add `Invite Admin` item -> `/platform/hubs/[hubId]/invite-admin`.
- [ ] Add `CMS` item -> `/platform/hubs/[hubId]/cms`.
- [ ] Add `Support Mode` entry as action -> `/platform/support/[hubId]` flow.
- [ ] Ensure `Support Mode` is visually distinct from passive tabs.
- [ ] Do not add `Settings` or `Domains` as routes.
- [ ] If needed, expose `Settings`/`Domains` as anchored sections inside the overview route only.

---

# 6. Hub Overview Route

- [ ] Upgrade `/platform/hubs/[hubId]` into a stronger workspace landing surface.
- [ ] Add clear hub identity/header.
- [ ] Add strong entry points to `Invite Admin`, `CMS`, and `Support Mode`.
- [ ] Add page-local sections for `Settings` and `Domains` if relevant.
- [ ] Keep these as in-page sections, not routes.

---

# 7. Invite Admin Route

- [ ] Keep existing invitation logic intact unless a bug fix is required.
- [ ] Integrate route into shell/workspace nav cleanly.
- [ ] Improve layout/orientation only where safe.

---

# 8. CMS List Route

Route: `/platform/hubs/[hubId]/cms`

- [ ] Create route.
- [ ] Fetch only page list metadata.
- [ ] Do not fetch full compositions for all pages.
- [ ] Render page list with status metadata.
- [ ] Show page title.
- [ ] Show slug/path if appropriate.
- [ ] Show draft/live status.
- [ ] Show updated timestamp.
- [ ] Show readiness/status badge.
- [ ] Add open editor action.
- [ ] Add open preview action if appropriate.
- [ ] Add empty state for no pages.
- [ ] Add loading state.
- [ ] Add error state.

---

# 9. CMS Editor Route

Route: `/platform/hubs/[hubId]/cms/[pageId]`

- [ ] Create route.
- [ ] Fetch only page metadata + current draft composition + minimal supporting lookups.
- [ ] Do not preload unrelated heavy data.
- [ ] Add page header/status surface.
- [ ] Add desktop 3-region logical workspace.
- [ ] Add narrow-screen pane-switch model.
- [ ] Add structure/sections tree.
- [ ] Add section editor panel.
- [ ] Add preview/inspector/media mode region.
- [ ] Preserve existing unsaved-change guard behavior.
- [ ] Preserve existing readiness/publish guard behavior.
- [ ] Preserve stale/conflict handling.

## 9.1 Sections tree
- [ ] Add drag handle only.
- [ ] Add section type/icon.
- [ ] Add label.
- [ ] Add status chip.
- [ ] Add hover/focus quick actions.
- [ ] Add active selection state.
- [ ] Add add-section affordance.

## 9.2 Editor panel
- [ ] Group fields logically.
- [ ] Add sticky section/page header if appropriate.
- [ ] Add inline validation cues.
- [ ] Add dirty/save status cues.
- [ ] Avoid one giant editor component.

## 9.3 Preview/inspector/media region
- [ ] Keep one primary mode visible at a time.
- [ ] Use tabs/segmented control if needed.
- [ ] Lazy-load heavy secondary panels where appropriate.
- [ ] Do not overload one panel with unrelated concerns.

---

# 10. CMS Preview Route

Route: `/platform/hubs/[hubId]/cms/[pageId]/preview`

- [ ] Create route.
- [ ] Keep route server-protected.
- [ ] Keep route draft-based.
- [ ] Keep route dynamic / `no-store` per canonical preview behavior.
- [ ] Add explicit preview chrome/banner.
- [ ] Include current hub and page name.
- [ ] Include `previewing draft` status.
- [ ] Include return-to-editor action.
- [ ] Include open-live-page action only if safe and already supported.
- [ ] Do not create separate published preview route in this phase.

---

# 11. Preview Parity

- [ ] Use shared rendering path/frame between preview and live where possible.
- [ ] Align content width behavior.
- [ ] Align spacing behavior.
- [ ] Align theme application.
- [ ] Align header/footer composition rules where applicable.
- [ ] Keep only allowed differences: data source, caching behavior, admin chrome.
- [ ] Treat all other divergence as a bug.

---

# 12. Support Mode

- [ ] Keep support mode as a context-switch flow, not a normal workspace tab route.
- [ ] Route through `/platform/support/[hubId]`.
- [ ] Preserve existing session/context establishment.
- [ ] Preserve persistent support banner/context in hub admin.
- [ ] Preserve deterministic exit back to `/platform`.

---

# 13. Performance Hardening

## 13.1 Shell and hydration
- [ ] Keep shell server-first where possible.
- [ ] Keep client interactivity in leaf boundaries.
- [ ] Do not make the whole shell a client tree for small interactions.

## 13.2 Fetch budgets
- [ ] Keep sidebar fetch payload minimal.
- [ ] Keep hub switcher data lightweight.
- [ ] Keep CMS list data lightweight.
- [ ] Keep preview route free of unrelated admin data.

## 13.3 Rerender isolation
- [ ] Ensure shell does not rerender on editor typing.
- [ ] Ensure sidebar does not rerender on CMS local state changes.
- [ ] Ensure unrelated editor panes do not rerender unnecessarily.

## 13.4 Lazy loading
- [ ] Lazy-load heavy secondary tools where appropriate.
- [ ] Do not lazy-load primary navigation/orientation surfaces.

---

# 14. Media and DnD Standards

## 14.1 Media
- [ ] Preserve canonical media-library contract.
- [ ] Do not invent a simplified incompatible media picker.
- [ ] Preserve alt-text and protected deletion behavior.

## 14.2 Drag and drop
- [ ] Follow approved DnD standard.
- [ ] Use drag handle only.
- [ ] Support keyboard accessibility.
- [ ] Use transform-based dragging.
- [ ] Persist order through proper data layer.

---

# 15. Loading / Empty / Error States

- [ ] Add no-hubs empty state where needed.
- [ ] Add no-pages empty state.
- [ ] Add no-sections empty state.
- [ ] Add hub-switcher no-results state.
- [ ] Add preview-unavailable state.
- [ ] Add hub load error state.
- [ ] Add CMS list load error state.
- [ ] Add CMS editor load error state.
- [ ] Add preview error state.
- [ ] Add save failure recovery UI.
- [ ] Add stale/conflict state UI.

---

# 16. Accessibility

- [ ] Add `aria-label`s to icon-only controls.
- [ ] Add visible focus-visible states.
- [ ] Use correct active-route semantics.
- [ ] Ensure keyboard traversal is predictable.
- [ ] Ensure tree/list semantics are correct.
- [ ] Ensure form labels/errors/help are accessible.
- [ ] Ensure preview chrome is keyboard-accessible.

---

# 17. Tests and QA

## 17.1 Component tests
- [ ] Sidebar collapse persistence.
- [ ] Hub switcher search/select.
- [ ] Sidebar active state.
- [ ] Workspace subnav state.
- [ ] Support-mode entry control.
- [ ] Sections tree interactions.
- [ ] Preview toolbar/chrome actions.

## 17.2 Route integration tests
- [ ] Hubs list -> hub overview.
- [ ] Hub overview -> invite-admin.
- [ ] Hub overview -> CMS list.
- [ ] CMS list -> CMS editor.
- [ ] CMS editor -> draft preview.
- [ ] Support mode entry via `/platform/support/[hubId]`.

## 17.3 Regression checks
- [ ] Session/auth flow unchanged in authority.
- [ ] No protected-route churn before session readiness.
- [ ] Unsaved change guards still work.
- [ ] Stale conflict handling still works.
- [ ] Draft preview remains `no-store`.
- [ ] Live rendering remains published/revalidated.

## 17.4 Visual QA
- [ ] Sidebar expanded state.
- [ ] Sidebar collapsed state.
- [ ] Hover state quality.
- [ ] Active state quality.
- [ ] Focus-visible quality.
- [ ] CMS desktop layout.
- [ ] CMS narrow layout.
- [ ] Preview parity against live baseline.

## 17.5 Performance QA
- [ ] Shell does not remount unnecessarily.
- [ ] Sidebar does not fetch heavyweight data.
- [ ] Editor typing does not rerender shell.
- [ ] Preview does not overfetch admin workspace data.

---

# 18. Completion Gate

Mark this implementation complete only when:
- [ ] all approved routes exist and work,
- [ ] no prohibited routes were created,
- [ ] support mode remains a context switch,
- [ ] shell is persistent and decomposed,
- [ ] CMS UX is improved without monolith files,
- [ ] preview parity is enforced,
- [ ] performance posture is preserved or improved,
- [ ] tests/regression checks pass,
- [ ] this checklist is updated to reflect actual completion state.
