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

## 0) Preconditions
- [ ] Confirm current milestone context is `M3 CMS pages`.
- [ ] Confirm no legacy CMS migration/fallback path is required.
- [ ] Confirm telemetry/editor diagnostics remain deferred.

## 1) Canonical schema foundation
- [ ] Define canonical section schema contracts as single source of truth.
- [ ] Ensure schema drives:
  - [ ] editor field rendering
  - [ ] readiness validation
  - [ ] preview defaults
  - [ ] publish gate checks
- [ ] Remove delimiter-string editing model from targeted section contracts.

## 2) Reusable multi-item editor foundation
- [ ] Implement reusable repeatable item editor pattern.
- [ ] Support add/remove/reorder item rows.
- [ ] Use dnd-kit with:
  - [ ] vertical-only movement
  - [ ] drag-handle-only interaction
  - [ ] keyboard accessibility
- [ ] Use `ConfirmModal` for destructive item removal.

## 3) Grouped section editing shell
- [ ] Implement schema-driven group rendering using reusable `Accordion`.
- [ ] Support section/variant-specific groups.
- [ ] Do not force identical group taxonomy across sections; choose domain-clear group labels per section purpose.
- [ ] Baseline group framework available:
  - [ ] `Core`
  - [ ] `Actions`
  - [ ] `Media`
  - [ ] optional `Advanced`
- [ ] Support domain-specific groups where clearer (e.g. `Team members`, `FAQ items`).
- [ ] Ensure default-open group contains required fields for active section variant.

## 4) CTA foundation
- [ ] Implement reusable CTA editor group (`0..2` CTAs).
- [ ] Hide CTA fields until user adds CTA.
- [ ] Use explicit text actions:
  - [ ] `Add CTA`
  - [ ] `Add second CTA`
- [ ] Validate CTA contract (`label`, `href`, scheme rules).
- [ ] Enforce internal/external link behavior:
  - [ ] internal path -> Next.js `Link`
  - [ ] external URL -> external anchor mode

## 5) Section readiness + quality gates
- [ ] Implement shared section readiness validator per section+variant.
- [ ] Surface section card badge as:
  - [ ] `Ready`
  - [ ] `Fields required (N)`
- [ ] Do NOT add timestamps or metadata counters to section cards.
- [ ] Implement separate states:
  - [ ] `Ready for draft`
  - [ ] `Ready for publish`
- [ ] Publish gate blocks with actionable reason messaging.

## 6) Section settings UX behavior
- [ ] Keep section settings hidden by default.
- [ ] Auto-open section settings only immediately after adding a new section.
- [ ] Open section settings via explicit section `edit` icon for existing sections.
- [ ] Header format:
  - [ ] `Section settings - [Section label]`
  - [ ] secondary/subscript variant text

## 7) Section edit buffer controls
- [ ] Implement section-level edit buffer state.
- [ ] Add explicit section actions:
  - [ ] `Save section`
  - [ ] `Discard section updates`
- [ ] Ensure page-level actions resolve dirty section state before proceeding.

## 8) Page-level actions
- [ ] Use explicit page actions:
  - [ ] `Save page draft`
  - [ ] `Publish page`
- [ ] Ensure page actions handle unresolved section dirty state through guard flow.

## 9) Unsaved-change protection architecture
- [ ] Centralize dirty-state guard logic at CMS route level.
- [ ] Internal transitions guarded by custom `ConfirmModal`.
- [ ] Hard unload guarded by native `beforeunload` fallback.
- [ ] Cover transition scenarios:
  - [ ] section switch
  - [ ] section-library switch
  - [ ] internal app nav
  - [ ] page action transitions
  - [ ] browser back/forward where interceptable

## 10) Page hierarchy (required early)
- [ ] Add optional `parentPageId` in page settings.
- [ ] Parent selector behavior:
  - [ ] hub-scoped options
  - [ ] exclude current page
  - [ ] include `No parent`
- [ ] Hierarchy validation:
  - [ ] no self-parent
  - [ ] no cyclical ancestry
  - [ ] enforce max depth policy

## 11) Concurrency safety
- [ ] Add optimistic concurrency/version checks for save/publish.
- [ ] Add stale-edit conflict UI and recovery path.

## 12) Performance guardrails
- [ ] Lazy-mount heavy editors/panels.
- [ ] Keep non-active section editors unmounted/collapsed.
- [ ] Add virtualization only if profiling proves necessity.

## 13) Testing baseline
- [ ] Add contract tests for schema/readiness/publish gate logic.
- [ ] Add interaction tests for repeatable editor add/remove/reorder.
- [ ] Add DnD tests for keyboard + pointer behavior.
- [ ] Add tests for destructive confirmation and dirty-state guard flows.

## 14) Documentation updates
- [ ] Keep `docs/product/cms-pages.md` updated for finalized behavior contracts.
- [ ] Keep `docs/product/cms-block-registry.md` updated for schema and editor behavior changes.
- [ ] Keep `docs/roadmap/cms-editor-ux-foundation-plan.md` aligned with implemented decisions.
- [ ] Update `docs/component-registry.md` before introducing any new reusable component surface.

## 15) Deferred (explicit)
- [ ] Do not implement telemetry/editor diagnostics in this foundation slice.

## Completion gate
- [ ] QOS CHECK completed before implementation slices.
- [ ] QOS SUMMARY completed after each implementation slice.
- [ ] Definition of Done checklist satisfied for each merged slice.
