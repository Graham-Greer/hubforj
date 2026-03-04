# CMS Editor UX Foundation Plan (M3)

Purpose:
- Capture agreed CMS editor UX direction before implementation so scope, sequencing, and standards compliance remain explicit.
- Provide a single planning reference for subsequent implementation slices.

Status:
- Planning doc (no implementation in this file).
- Applies to M3 CMS editor enhancements.

Authority alignment:
- `AGENTS.md`
- `docs/codex-workflow.md`
- `docs/standards/engineering-source-of-truth.md`
- `docs/standards/drag-and-drop.md`
- `docs/standards/repo-structure-and-conventions.md`
- `docs/component-registry.md`
- `docs/component-build-order.md`
- `docs/product/cms-pages.md`
- `docs/product/cms-block-registry.md`

## Locked decisions from planning

## 1) Data contract strategy (clean break)
- Project is early-stage with no legacy CMS content migration requirement.
- Do NOT keep delimiter-string fallbacks (e.g. `itemsText` parsing) once structured contracts are implemented.
- Move multi-item section props to structured arrays/objects directly.
- Enforce validation early at editor/save boundaries to prevent invalid contracts.

## 1.1) Section schema single source of truth
- Define one canonical section schema contract per block type used by:
  - editor field rendering
  - section-level validation/readiness
  - preview mock generation
  - publish-time quality checks
- Avoid separate ad-hoc schema definitions across editor/render/validation paths.

## 2) Reusable multi-item editing foundation
- Create a reusable pattern layer for repeatable section items (team, FAQ, feature grid, testimonials, pricing tiers, stats, etc.).
- Foundation responsibilities:
  - add/remove/reorder item rows
  - DnD via dnd-kit (vertical-only, drag-handle-only, keyboard accessible)
  - destructive remove confirmation
- Section-specific responsibilities remain outside the sortable layer:
  - field schema
  - validation rules
  - display labels/help text

## 3) CTA model and UX
- CTA-capable sections support up to 2 CTAs.
- CTA fields are hidden until user explicitly adds a CTA.
- CTA rows are progressive:
  - `Add CTA`
  - `Add second CTA` (disabled at max)
- CTA link behavior:
  - internal paths (e.g. `/about`) render via Next.js `Link`
  - external URLs (e.g. `https://...`) render as external anchors/wrapper external mode
- CTA validation:
  - if CTA exists, `label` and `href` required
  - invalid schemes rejected (`javascript:` etc.)

## 4) Section field grouping and accordion UX
- Section editing uses a shared grouping framework rendered via reusable `Accordion`, but group composition is section/variant specific.
- Framework-level baseline groups:
  - `Core`
  - `Actions`
  - `Media`
  - optional `Advanced`
- Sections MAY define clearer domain groups when more explicit for editors, for example:
  - `Team members`
  - `FAQ items`
  - `Feature items`
  - `Pricing tiers`
- Group definitions, required flags, and default-open behavior are driven by section schema metadata.
- Default open group must be whichever group contains section-required fields for the active variant.
- Non-critical groups are collapsed by default to reduce cognitive load.

## 5) Readiness status model
- Define section-level readiness based on required fields for that section+variant.
- Expose readiness in two places:
  - in-editor (group/section level)
  - `Page Sections` list card badge
- Badge states:
  - `Ready`
  - `Fields required (N)`
- Readiness must come from shared validator logic (single source of truth), not duplicated UI checks.

## 5.2) Draft vs publish quality gates
- Implement separate gate states:
  - `Ready for draft` (minimum required draft validity)
  - `Ready for publish` (strict publish quality, including publish-only constraints)
- Publish must be blocked when publish-gate requirements fail, with actionable messaging.

## 5.1) Section settings heading clarity
- When a section is selected, section settings header MUST include:
  - `Section settings - [Section label]`
  - variant as secondary/subscript text (e.g. `split`, `3col`)
- Purpose:
  - reduce editing ambiguity
  - ensure editor always knows the active section + variant context

## 6) Section quality uplift direction
- Expand section contracts where necessary for meaningful output quality.
- Example: Team cards should support team member images (`imageMediaId`) as part of member item contract.
- Keep variants constrained/documented; avoid ad-hoc per-section custom logic explosions.

## 7) UX guidance expectations
- Improve authoring guidance quality with reusable affordances:
  - field hints and completion guidance
  - character limits/counters where relevant (e.g. SEO/title/description)
  - contextual readiness indicators
- Preserve progressive disclosure to avoid overwhelming initial forms.

## 7.2) Unsaved-change resilience
- Implement explicit `Discard updates` action for in-progress section/page edits.
- Add route-leave protection when unsaved changes exist.
- Editor state affordance should clearly show whether changes are saved or pending.
- Route-level guard architecture:
  - centralize dirty-state guard logic at CMS route level
  - internal transitions use custom confirmation modal flow (`ConfirmModal`)
  - hard unload (refresh/close/external leave) uses native browser fallback (`beforeunload`)
- Navigation coverage expectations:
  - page section switches
  - section-library transitions
  - page-level actions (`Save page draft`, `Publish page`)
  - internal app navigation (e.g. hub/session nav)
  - browser back/forward where route-transition interception is possible

## 7.1) Action control semantics (Button usage)
- Use reusable `ui/button/Button` for all CMS actions.
- `iconOnly` Button usage is preferred for compact utility actions where intent is obvious in context:
  - edit
  - remove/delete
  - duplicate
  - small row-level utilities
- Text Button usage is required for explicit semantic actions where intent must be clear:
  - `Add primary CTA`
  - `Add secondary CTA`
  - `Save draft`
  - `Publish`
  - any content-affecting action where ambiguity risk is non-trivial
- Accessibility rules:
  - every icon-only action MUST provide `ariaLabel`
  - destructive actions MUST use danger intent and confirmation modal flow
  - icon-only buttons MUST NOT be the sole discoverability mechanism for critical actions

## 8) Performance and reusability constraints
- Reuse-first is mandatory: build shared editor primitives before section-specific expansion.
- Avoid one-off editors per section when common behavior exists.
- Keep client complexity controlled:
  - render heavy sub-editors only when selected/expanded
  - avoid unnecessary always-mounted interactive subsurfaces
  - lazy-mount heavy editors/panels (e.g. WYSIWYG/media-heavy groups) where possible
- Maintain layering integrity:
  - primitives -> ui -> patterns -> sections -> routes

## 8.1) Large-page performance guardrails
- Ensure editor remains responsive with large section counts:
  - avoid mounting all section edit surfaces simultaneously
  - keep non-active section editors collapsed/unmounted
  - introduce list virtualization only if profiling indicates it is necessary

## 8.2) Concurrency safety
- Add optimistic concurrency/version protection on save/publish to avoid silent overwrite.
- Provide conflict UI when stale editor state attempts to save over newer server state.

## 9) Page hierarchy (required early)
- Add page settings support for optional parent page selection (`parentPageId`).
- Parent page selector requirements:
  - hub-scoped page options
  - exclude current page
  - clear `No parent` option
- Validation rules (server + editor):
  - cannot set page as its own parent
  - cannot create cyclical ancestry chains
  - enforce clear max depth policy
- UX expectations:
  - parent selection lives in page settings (not block settings)
  - readiness/validation messaging should clearly explain invalid hierarchy selections
- Expected downstream uses:
  - navigation/breadcrumb generation
  - structured page tree management in CMS
  - deterministic page-tree behavior under hierarchy constraints

## 10) Section list card UX rules
- Section list cards should not include timestamps or metadata counters (item/CTA/media counts).
- Card status emphasis remains on validation/readiness:
  - `Ready`
  - `Fields required (N)`

## 11) Testing and quality strategy
- Add/maintain contract tests for:
  - section schema validation
  - readiness computation
  - publish gate blocking reasons
- Add interaction tests for:
  - repeatable item add/remove/reorder
  - keyboard and pointer DnD behavior
  - destructive action confirmation flows

## 12) Content governance helpers
- Provide reusable helpers for:
  - character limits + counters (where applicable)
  - link validation (internal vs external URL rules)
  - completion guidance for required fields

## 13) Deferred for now
- Telemetry/editor diagnostics are deferred:
  - no instrumentation implementation in current scope
  - revisit after foundational UX/editor contracts stabilize

## Implementation approach (phased)

## Phase A — Foundation primitives in CMS editor
1. Shared repeatable item editor with DnD + confirm remove.
2. Shared section readiness validator contract and badge component usage.
3. Shared grouped editor shell using Accordion (`Core`, `Actions`, `Media`, optional `Advanced`).
   - Group taxonomy is not one-size-fits-all: each section+variant defines domain-appropriate groups (e.g. `Team members`, `FAQ items`) via schema metadata.
4. Page settings foundation includes optional parent page selector contract (`parentPageId`).

Exit criteria:
- At least one section can use the shared foundation end-to-end without ad-hoc field parser logic.

## Phase B — Contract migration by section slices
1. Migrate highest-friction sections first:
   - Feature Grid
   - FAQ
   - Team
   - Testimonials
   - Pricing/Stats
2. Replace legacy text-encoded props with structured arrays/objects.
3. Introduce richer contracts where necessary (e.g., team member image support).

Exit criteria:
- Migrated sections no longer rely on delimiter strings.
- Section rendering + editor contracts are structured and validated.

## Phase C — CTA unification
1. Add reusable CTA group (0..2) to relevant sections.
2. Enforce internal/external link validation and rendering behavior.
3. Keep CTA UI hidden unless CTA is added.

Exit criteria:
- CTA-capable sections use one shared CTA model and editing pattern.

## Phase D — UX polish and publishing confidence
1. Add character counters where needed.
2. Add improved guidance/hints.
3. Surface readiness badges consistently in section list and editor groups.
4. Add `Discard updates` flow and unsaved route-leave protection.
5. Finalize `Fields required (N)` card status rendering.

Exit criteria:
- Editors can quickly identify incomplete sections and required fields before save/publish.
- Editors can safely discard unsaved edits and are protected from accidental route-leave loss.

## Tradeoffs and rationale
- Upfront effort is higher than patching one section at a time.
- Long-term maintenance and UX quality are substantially better due to:
  - shared foundations
  - reduced duplicated logic
  - consistent validation/readiness model
- Clean-break contract strategy avoids future technical debt from temporary fallbacks.

## Out of scope for this planning slice
- Firebase schema/rules changes (none required by planning doc itself).
- Public runtime redesign of section visual style beyond contract-driven improvements.
- Broad CMS IA redesign unrelated to section editing workflow.
- Telemetry/editor diagnostics implementation (explicitly deferred).

## Notes for implementation turns
- Each implementation turn should follow QOS CHECK -> plan -> confirmation -> code -> QOS SUMMARY.
- Update `docs/product/cms-pages.md` and `docs/product/cms-block-registry.md` as behavior contracts are finalized.
