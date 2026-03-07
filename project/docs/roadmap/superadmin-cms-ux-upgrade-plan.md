# Superadmin + CMS UX Upgrade Plan (Production-Ready)

Status: Draft planning doc (implementation checklist source)  
Scope: Platform superadmin shell, CMS editor UX, draft/live preview architecture parity

## 1) Goals
- Deliver a production-grade superadmin navigation experience with clear information architecture.
- Make draft preview represent live rendering faithfully (layout, spacing, theme, section composition).
- Reduce CMS editor cognitive load and improve speed/safety for common workflows.
- Preserve all existing standards:
  - layering: `tokens -> primitives -> ui -> patterns -> sections -> routes`
  - token-only styling in colocated `.module.css`
  - server auth/session gating remains authoritative
  - no broad rewrites outside touched surfaces

## 2) Non-goals
- No data model/schema migration in this plan.
- No section schema contract redesign in this plan.
- No changes to Firebase rules unless later implementation requires new endpoints.

## 3) Current-State Audit Summary

### 3.1 Platform shell/navigation
- Current top nav is workflow-oriented (`Hubs`, `Session`) rather than account-oriented.
- No persistent left sidebar for superadmin journey navigation.
- Platform shell width behavior is inconsistent and visually flat.

### 3.2 CMS editor workflow
- Editor is feature-rich but dense, with many controls competing in a single canvas.
- Important actions are scattered between tabs, buttons, and inline links.
- Section management and preview are usable but not optimized for orientation and speed.

### 3.3 Draft preview vs live
- Draft preview correctly uses draft composition and `no-store` behavior.
- Preview container/layout is not yet parity-locked with live page shell.
- “Published preview” is effectively “open live page”; there is no dedicated published snapshot route within CMS context.

## 4) Target UX Architecture

### 4.1 Superadmin shell IA
- Top bar (global utilities only):
  - profile/account menu
  - user initials avatar
  - theme toggle (icon-only)
  - sign out
- Left sidebar (primary navigation):
  - Hubs
  - Create hub
  - Invites (global if retained)
  - CMS (hub-scoped entry points where applicable)
  - Support mode entry points
- Sidebar behavior:
  - expanded: icon + text
  - collapsed: icon-only with tooltip + `aria-label`
  - preference persistence per user/device

### 4.2 Hub-scoped contextual nav
- When on `platform/hubs/[hubId]/*`, show secondary contextual navigation:
  - Overview
  - Settings
  - Domains
  - Invites
  - Pages (CMS list)
  - Preview
  - Support mode

### 4.3 CMS editor IA
- Stable 3-region workspace:
  - left rail: page sections tree + ordering/status
  - center: section settings editor
  - right: contextual preview/inspector/media
- Keep existing guardrails:
  - unsaved changes prompts
  - draft readiness and publish readiness gates
  - stale edit conflict handling

### 4.4 Preview parity contract
- Draft preview must match live rendering for:
  - page shell width/spacing
  - header/footer composition
  - theme CSS loading behavior
  - section spacing and rendering
- Allowed differences only:
  - data source (`draftComposition` vs `publishedComposition`)
  - cache policy (`no-store` draft preview, revalidated live)
  - external admin chrome outside content canvas

## 5) Recommended New/Updated Reusable Contracts

Note: registry update required before implementation of new components.

- `patterns/superadmin-shell/SuperadminShell`
  - responsibility: top bar + sidebar + content frame
  - props: `children`, `navItems`, `account`, `activePath`
- `patterns/superadmin-topbar/SuperadminTopbar`
  - responsibility: account utilities only
  - props: `userInitials`, `onSignOut`, `themeValue`, `onThemeToggle`
- `patterns/superadmin-sidebar/SuperadminSidebar`
  - responsibility: collapsible primary nav
  - props: `items`, `collapsed`, `onToggle`, `activePath`
- `patterns/hub-workspace-nav/HubWorkspaceNav` (if split from sidebar)
  - responsibility: hub contextual journey nav
  - props: `hubId`, `hubSlug`, `activePath`

## 6) Implementation Phases

## Phase A: Shell Foundation
Checklist:
- [ ] Update component registry with new shell/nav patterns (if introduced).
- [ ] Implement superadmin shell pattern(s) with tokenized CSS modules.
- [ ] Move workflow links from top bar into sidebar architecture.
- [ ] Top bar becomes account utilities only (avatar initials, account menu, theme toggle, sign out).
- [ ] Ensure responsive behavior (desktop fixed rail, mobile drawer).

Acceptance criteria:
- Superadmin routes share one consistent shell.
- Sidebar supports collapse/expand and icon-only mode accessibly.
- Top bar has no workflow links; only account/global utilities.

## Phase B: Superadmin Journey Navigation
Checklist:
- [ ] Define and apply canonical superadmin nav map.
- [ ] Add hub contextual nav for `platform/hubs/[hubId]/*`.
- [ ] Normalize route-level entry points for `Edit hub`, `Invites`, `CMS`, `Support mode`.
- [ ] Replace scattered inline action links with structured action menus where appropriate.

Acceptance criteria:
- Users can complete core journey without hunting for links:
  - view hubs -> edit hub -> invites -> CMS -> preview -> support mode

## Phase C: Preview Architecture Hardening
Checklist:
- [ ] Explicitly define preview/live parity rules in code comments + docs.
- [ ] Align preview content canvas width/spacing to live shell.
- [ ] Keep draft route `no-store` and live route revalidate policy.
- [ ] Add optional published snapshot preview route in CMS context.
- [ ] Reduce preview data overfetch where safe (avoid loading unnecessary media/events).

Acceptance criteria:
- Draft preview and live page visually match for shared content contracts.
- Preview remains safe and deterministic with proper auth gating.

## Phase D: CMS Editor UX Improvements
Checklist:
- [ ] Refactor editor layout into stable multi-region workspace.
- [ ] Improve section tree usability (status, readiness, quick actions).
- [ ] Improve preview and media interaction ergonomics.
- [ ] Keep existing guard and conflict logic unchanged unless bug-fix required.

Acceptance criteria:
- Faster section editing with lower context switching.
- No regression in publish/readiness safeguards.

## Phase E: Quality + Accessibility + Observability
Checklist:
- [ ] Keyboard and focus traversal across shell/nav/editor.
- [ ] Tooltips/labels for icon-only nav controls.
- [ ] Add stable data attributes for test selectors.
- [ ] Add smoke checks for core journey and preview parity.

Acceptance criteria:
- A11y baseline met for nav and editor shell interactions.
- QA can validate major flows via deterministic test checklist.

## 7) Route and Surface Mapping (Planned)
- Global shell:
  - `/platform/*`
- Primary superadmin nav targets:
  - `/platform/hubs`
  - `/platform/hubs/create`
- Hub contextual routes:
  - `/platform/hubs/[hubId]`
  - `/platform/hubs/[hubId]/invite-admin`
  - `/platform/hubs/[hubId]/cms`
  - `/platform/hubs/[hubId]/cms/[pageId]`
  - `/platform/hubs/[hubId]/cms/[pageId]/preview`
  - `/platform/support/[hubId]`

## 8) Caching/Auth/Session Considerations
- Draft preview:
  - keep `force-dynamic`/`no-store`
  - superadmin-only access remains enforced server-side
- Live pages:
  - keep revalidate policy
- No auth role model changes in this plan.

## 9) Testing Strategy

### 9.1 Unit/component
- Sidebar collapse behavior and persisted state.
- Active route highlighting for global and hub contextual nav.
- Top bar account menu actions and icon-only controls a11y attributes.

### 9.2 Route integration/smoke
- Superadmin journey traversal:
  - hubs list -> hub detail -> invite-admin -> cms list -> page editor -> draft preview
- Draft preview parity checks against published/live shell baseline.

### 9.3 Regression
- Existing unsaved changes guard.
- Publish readiness and stale conflict behavior.
- Support mode entry flow.

## 10) Risks and Mitigations
- Risk: UX refactor introduces regressions in CMS save/publish flows.  
  Mitigation: keep server actions and validation untouched; isolate layout/navigation refactor.
- Risk: Sidebar complexity grows quickly.  
  Mitigation: pattern extraction with strict prop contracts and focused tests.
- Risk: Preview parity work drifts into broad theming changes.  
  Mitigation: constrain to shell/container parity and explicitly documented exceptions.

## 11) Decision Log Items (For Approval During Implementation)
- Should published snapshot preview be a dedicated route or a mode in existing preview route?
- Should global invites remain a top-level nav node or remain hub-contextual only?
- Should sidebar collapsed state persist by local storage only, or also by user profile setting?
- Should CMS media library remain inline panel or become dedicated drawer/modal pattern?

## 12) Definition of Done for This Upgrade
- Superadmin shell/navigation is consistent, accessible, and journey-aligned.
- Draft preview is visually parity-aligned with live output except explicitly allowed differences.
- CMS editing workflow is materially easier to navigate without regressing safety controls.
- Docs updated:
  - this plan doc
  - component registry (if new patterns introduced)
  - any affected route/spec docs
