# CMS Editor Foundation Implementation Checklist (M3)

Purpose:
- Provide an execution checklist for implementing CMS editor foundational updates.
- Translate planning decisions into implementation-ready work items.

Scope:
- CMS page editing route and supporting reusable foundations.
- Focus on code quality, performance, reuse, and UX consistency.

Authority alignment:
- `AGENTS.md`
- `docs/codex-workflow.md`
- `docs/roadmap/cms-editor-ux-foundation-plan.md`
- `docs/standards/*`
- `docs/component-registry.md`

### Pilot Gate (AccordionSection only — Phase A hard constraint)

For Phase A (CMS editor foundation), Codex MUST implement editor foundations using ONLY the `AccordionSection` pilot and MUST NOT migrate other sections until the Phase A exit criteria are met.

Reference:
- `docs/roadmap/cms-accordionsection-pilot.md`

Hard rules:
- No multi-section contract migrations in Phase A.
- No public-facing visual redesign scope creep in Phase A (contract/editor improvements only).
- Pilot must pass end-to-end: schema → editor → preview → publish gate → renderer, with tests.

Implementation status note:
- Status below reflects current progress after the `AccordionSection` pilot slice.
- `[x]` items are completed in pilot scope; `[ ]` items remain open.

## 0) Preconditions
- [x] Confirm current milestone context is `M3 CMS pages`.
- [x] Confirm no legacy CMS migration/fallback path is required.
- [x] Confirm telemetry/editor diagnostics remain deferred.

## 1) Canonical schema foundation
- [x] Define canonical section schema contracts as single source of truth.
- [ ] Ensure schema drives:
  - [x] editor field rendering
  - [x] readiness validation
  - [x] preview defaults
  - [x] publish gate checks
- [x] Remove delimiter-string editing model from targeted section contracts.

## 2) Reusable multi-item editor foundation
- [x] Implement reusable repeatable item editor pattern.
- [x] Implement reusable draggable accordion item row shell for repeatable item editing.
- [x] Support add/remove/reorder item rows.
- [ ] Use dnd-kit with:
  - [x] vertical-only movement
  - [x] drag-handle-only interaction
  - [x] keyboard accessibility
- [x] Use `ConfirmModal` for destructive item removal.

## 3) Grouped section editing shell
- [x] Implement schema-driven group rendering using reusable `Accordion`.
- [x] Support section/variant-specific groups.
- [x] Do not force identical group taxonomy across sections; choose domain-clear group labels per section purpose.
- [ ] Baseline group framework available:
  - [x] `Core`
  - [ ] `Actions`
  - [ ] `Media`
  - [ ] optional `Advanced`
- [x] Support domain-specific groups where clearer (e.g. `Team members`, `FAQ items`).
- [x] Ensure default-open group contains required fields for active section variant.

## 4) CTA foundation
- [x] Implement reusable CTA editor group (`0..2` CTAs).
- [x] Hide CTA fields until user adds CTA.
- [x] Use explicit text actions:
  - [x] `Add CTA`
  - [x] `Add second CTA`
- [x] Validate CTA contract (`label`, `href`, scheme rules).
- [x] Enforce internal/external link behavior:
  - [x] internal path -> Next.js `Link`
  - [x] external URL -> external anchor mode

Implementation note (approved option 2):
- CTA foundation was implemented on CTA-capable sections (`HeroSection`, `CTASection`) while retaining the AccordionSection pilot for non-CTA schema migration scope.

## 5) Section readiness + quality gates
- [x] Implement shared section readiness validator per section+variant.
- [ ] Surface section card badge as:
  - [x] `Ready`
  - [x] `Fields required (N)`
- [x] Do NOT add timestamps or metadata counters to section cards.
- [ ] Implement separate states:
  - [x] `Ready for draft`
  - [x] `Ready for publish`
- [x] Publish gate blocks with actionable reason messaging.

## 6) Section settings UX behavior
- [x] Keep section settings hidden by default.
- [x] Auto-open section settings only immediately after adding a new section.
- [x] Open section settings via explicit section `edit` icon for existing sections.
- [ ] Header format:
  - [x] `Section settings - [Section label]`
  - [x] secondary/subscript variant text

## 7) Section edit buffer controls
- [x] Implement section-level edit buffer state.
- [ ] Add explicit section actions:
  - [x] `Save section`
  - [x] `Discard section updates`
- [x] Ensure page-level actions resolve dirty section state before proceeding.

## 8) Page-level actions
- [ ] Use explicit page actions:
  - [x] `Save page draft`
  - [x] `Publish page`
- [x] Ensure page actions handle unresolved section dirty state through guard flow.

## 9) Unsaved-change protection architecture
- [x] Centralize dirty-state guard logic at CMS route level.
- [x] Internal transitions guarded by custom `ConfirmModal`.
- [x] Hard unload guarded by native `beforeunload` fallback.
- [ ] Cover transition scenarios:
  - [x] section switch
  - [x] section-library switch
  - [x] internal app nav
  - [x] page action transitions
  - [x] browser back/forward where interceptable

## 10) Page hierarchy (required early)
- [x] Add optional `parentPageId` in page settings.
- [ ] Parent selector behavior:
  - [x] hub-scoped options
  - [x] exclude current page
  - [x] include `No parent`
- [ ] Hierarchy validation:
  - [x] no self-parent
  - [x] no cyclical ancestry
  - [x] enforce max depth policy

## 11) Concurrency safety
- [x] Add optimistic concurrency/version checks for save/publish.
- [x] Add stale-edit conflict UI and recovery path.

## 12) Performance guardrails
- [x] Lazy-mount heavy editors/panels.
- [x] Keep non-active section editors unmounted/collapsed.
- [x] Add virtualization only if profiling proves necessity.

Implementation note:
- Virtualization is intentionally not implemented at this stage because profiling evidence is not yet showing a necessity threshold breach.

## 13) Testing baseline
- [x] Add contract tests for schema/readiness/publish gate logic.
- [x] Add interaction tests for repeatable editor add/remove/reorder.
- [x] Add DnD tests for keyboard + pointer behavior.
- [x] Add tests for destructive confirmation and dirty-state guard flows.

## 14) Documentation updates
- [x] Keep `docs/product/cms-pages.md` updated for finalized behavior contracts.
- [x] Keep `docs/product/cms-block-registry.md` updated for schema and editor behavior changes.
- [x] Keep `docs/roadmap/cms-editor-ux-foundation-plan.md` aligned with implemented decisions.
- [x] Update `docs/component-registry.md` before introducing any new reusable component surface.

## 15) Deferred (explicit)
- [x] Do not implement telemetry/editor diagnostics in this foundation slice.

## QOS SUMMARY (Slice: Items 11–12)
### 1) Delivered
- Optimistic concurrency checks for page draft save/publish using `expectedUpdatedAt`.
- Stale-edit conflict handling with explicit `STALE_DRAFT` error code and recovery UI (`Reload latest draft`).
- Lazy-mounting of heavy CMS editor panels (`BlockEditor`, `MediaLibrary`) via dynamic import.
- Non-active section editors remain unmounted/collapsed through single-active editor state.

### 2) Reuse/extractions completed
- Reused: existing CMS route shell, server actions, repository boundaries, `ConfirmModal`, existing readiness/dirty-state flows.
- Extracted: none required in this slice.
- File-size mitigation: kept scope constrained to touched route/repository/test docs only.

### 3) Data + caching outcome
- Fetch/mutation pattern unchanged: server actions + repository writes.
- Cache intent unchanged: CMS editor route remains dynamic/no-store behavior.
- No new invalidation paths introduced in this slice.

### 4) UX outcome
- Added explicit stale-edit conflict notice and recovery action.
- Existing loading/error/confirmation patterns preserved and reused.

### 5) Deferred debt / follow-ups
- Virtualization intentionally deferred until profiling demonstrates necessity.
- Testing item 13 interaction coverage remains open.

### 6) Exceptions
- No standards exceptions logged for this slice.

### 7) Repo structure outcome
- New file added: `tests/unit/pages-repository.test.js`.
- Placement and naming conventions followed.
- No move shims required.

## Completion gate
- [x] QOS CHECK completed before implementation slices.
- [x] QOS SUMMARY completed for items 11–12 implementation slice.
- [x] Definition of Done checklist satisfied for each merged slice.
