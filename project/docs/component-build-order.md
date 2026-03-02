# Component Build Order (Milestone-Mapped)

Purpose:
- Provide a deterministic build sequence so Codex never guesses what to build next.
- Prevent premature section/pattern work before foundational UI exists.
- Keep delivery aligned with product milestones and repo layering rules.

Authority:
- Must comply with:
  - `AGENTS.md`
  - `docs/standards/engineering-source-of-truth.md`
  - `docs/standards/repo-structure-and-conventions.md`
  - `docs/component-registry.md`

Hard rules:
- Build bottom-up: primitives -> ui -> patterns -> sections -> routes.
- Do not create new components outside `docs/component-registry.md` without updating the registry first.
- Prefer adding variants to existing components over creating new siblings.

---

## Milestones (Product Delivery Order)

M1) Superadmin hub provisioning
M2) Hub admin events + memberships
M3) CMS pages (superadmin CMS, hub-admin CMS later as add-on)
M4) Public/member site (hub landing, events, pages, membership join)

> Note: Some foundational UI is shared across all milestones. Those components are built first.

---

## Phase 0 — Token contract + global shell prerequisites (Gate)

Before any component work:
- `globals.css` token contract exists and is stable enough for MVP.
- Google Material Symbols are available globally and `primitives/icon/Icon.jsx` is the only way icons are rendered.
- Next.js route groups and layout skeleton folders exist (no feature logic yet).

Deliverables:
- Token readiness checklist passed (focus tokens, surfaces, text, borders, button/field recipe tokens).
- Decide layout groups:
  - `(platform)` `/platform/*`
  - `(admin)` `/{hubSlug}/admin/*` (platform domain only)
  - `(public)` hub public routes
  - `(member)` member account routes

---

## Phase 1 — Primitives (must exist before UI)

Build in this order:
1) `primitives/visually-hidden/VisuallyHidden`
2) `primitives/icon/Icon` (Material Symbols wrapper)
3) `primitives/text/Text`
4) `primitives/heading/Heading`
5) `primitives/stack/Stack`
6) `primitives/inline/Inline`
7) `primitives/grid/Grid`
8) `primitives/surface/Surface`

Definition of Done:
- Each primitive has token-only styling, no hardcoded colors.
- Each primitive supports `className`, `data-*`, `aria-*`.
- Icon enforces `decorative` vs `ariaLabel` usage.

---

## Phase 2 — UI Kernel (required for all milestones)

Build in this order:

### 2.1 Buttons, Links, Feedback
1) `ui/spinner/Spinner`
2) `ui/button/Button`
3) `ui/link/Link`
4) `ui/badge/Badge`
5) `ui/toast/Toast` + `ui/toast/ToastProvider`

### 2.2 Surfaces & states
6) `ui/card/Card`
7) `ui/empty-state/EmptyState`
8) `ui/error-state/ErrorState`

### 2.3 Skeleton system (foundation for loading UX)
9) `ui/skeleton/Skeleton`
10) `ui/skeleton/SkeletonText` (supports per-line widths)
11) `ui/skeleton/SkeletonBox`
12) `ui/skeleton/SkeletonAvatar`

### 2.4 Overlays
13) `ui/modal/Modal`
14) `ui/confirm-modal/ConfirmModal`
15) `ui/drawer/Drawer`
16) `ui/tooltip/Tooltip` (if required early; otherwise delay to Phase 4)

### 2.5 Media
17) `ui/image/AppImage` (wraps `next/image`, requires `alt`, supports skeleton)
18) `ui/file-upload/FileUpload` (multi-file, used by CMS and event images)

### 2.6 Navigation helpers
19) `ui/tabs/Tabs`
20) `ui/accordion/Accordion`
21) `ui/pagination/Pagination`
22) `ui/avatar/Avatar` (image + initials)
23) `ui/theme-toggle/ThemeToggle`
24) `ui/scroll-to-top/ScrollToTop` (can be later if not required)

Definition of Done:
- Button supports icon-only and requires `ariaLabel` when icon-only.
- Modal/Drawer trap focus and are keyboard accessible.
- Skeleton components preserve layout footprint (no CLS).
- FileUpload supports multi-select and displays queued items.

---

## Phase 3 — Form System (required for admin + CMS)

Build in this order:

### 3.1 Field wrappers
1) `ui/form/field/FieldLabel`
2) `ui/form/field/FieldHint`
3) `ui/form/field/FieldError`
4) `ui/form/field/Field`
5) `ui/form/fieldset/Legend`
6) `ui/form/fieldset/Fieldset`
7) `ui/form/form-row/FormRow`
8) `ui/form/form-grid/FormGrid`
9) `ui/form/form-group/FormGroup`

### 3.2 Controls (custom designed)
10) `ui/form/input/Input`
11) `ui/form/textarea/Textarea`
12) `ui/form/select/Select` (custom UI; start non-searchable MVP, add searchable later)
13) `ui/form/checkbox/Checkbox`
14) `ui/form/radio/Radio`
15) `ui/form/switch/Switch`
16) `ui/form/checkbox-group/CheckboxGroup`
17) `ui/form/radio-group/RadioGroup`
18) `ui/form/date-time-picker/DateTimePicker`
19) `ui/form/wysiwyg/WysiwygEditor` (wrapper; editor adapter can be swapped later)

Definition of Done:
- Field wrapper handles label/hint/error consistently.
- Custom controls are fully keyboard-accessible and tokenized.
- DateTimePicker works in mobile and desktop (modal-based).
- Wysiwyg supports: bold/italic/underline/bullets/numbered/link only.

---

## Phase 4 — App Patterns (admin + CMS foundation)

These patterns enable the admin portals and CMS builder. Build in this order:

1) `patterns/page-header/PageHeader`
2) `patterns/feature-locked/FeatureLocked` (feature flags visible to hub admins)
3) `patterns/filter-bar/FilterBar`
4) `patterns/data-table/DataTable`

CMS (superadmin-only initially):
5) `patterns/cms/media-library/MediaLibrary`
6) `patterns/cms/page-settings/PageSettingsForm`
7) `patterns/cms/block-picker/BlockPicker`
8) `patterns/cms/block-list/BlockList`
9) `patterns/cms/block-editor/BlockEditor`
10) `patterns/cms/publish-bar/PublishBar`

Definition of Done:
- DataTable handles loading/empty/error via shared UI.
- FeatureLocked is reusable and consistent across locked routes.
- CMS patterns support draft/publish workflow.

---

## Milestone M1 — Superadmin hub provisioning (build targets)

Goal:
- Provision hubs, set templateKey/token overrides, toggle features.
- Invite hub admins (invite-only).
- Support mode: superadmin can enter hub admin surface with a banner.

Required UI/pattern readiness:
- Phase 1–4 complete.

Additional components (if gaps emerge):
- If a missing piece is discovered, update `docs/component-registry.md` first, then implement.

---

## Milestone M2 — Hub admin events + memberships (build targets)

Goal:
- Events CRUD (draft/publish/cancelled)
- Registrations table (registered/waitlisted/cancelled)
- Payment status (offline/paid)
- Attendance tracking (unknown/attended/no-show)
- Membership plans CRUD + membership lifecycle (pending/active/expired/inactive/cancelled)

Component usage:
- DataTable + FilterBar + Status badges + ConfirmModal
- DateTimePicker + FileUpload + WysiwygEditor (event description)
- Toasts for mutation feedback

No new section work required yet.

---

## Milestone M3 — CMS pages (superadmin CMS first)

Goal:
- Superadmin creates/edits hub pages and page composition blocks.
- Draft vs Published content.
- Preview (no-store) vs Live (cached/revalidated).
- Header/footer selection + per-page overrides.
- Hub-admin CMS feature remains locked (FeatureLocked) unless enabled later.

Required components:
- CMS patterns (Phase 4) complete.
- Sections (Phase 5) implemented.

---

## Phase 5 — Sections (CMS block registry)

Build the section components now that primitives/ui/patterns exist.

Build in this order:
1) `sections/headers/HeaderSection` (variants: standard|minimal|landing)
2) `sections/footers/FooterSection` (variants: simple|columns|cta)

Core blocks:
3) `sections/hero/HeroSection` (variants: centered|split)
4) `sections/rich-text/RichTextSection`
5) `sections/cta/CTASection` (variants: centered|split)
6) `sections/feature-grid/FeatureGridSection` (variants: 2col|3col|4col)
7) `sections/faq/FAQSection` (variants: compact|detailed)
8) `sections/event-list/EventListSection` (variants: upcoming|featured|category)
9) `sections/contact/ContactSection` (variants: card|split)
10) `sections/logo-marquee/LogoMarqueeSection` (variants: marquee|grid)

Optional sections (now MVP per decision):
11) `sections/pricing/PricingSection` (variants: 3tier|enterprise)
12) `sections/stats/StatsSection` (variants: row|cards)
13) `sections/team/TeamSection` (variants: grid|withLead)
14) `sections/testimonials/TestimonialsSection` (variants: grid|spotlight)
15) `sections/legal/LegalDocumentSection`
16) `sections/fallback/SectionRenderFallback`

Definition of Done:
- Each section is variant-driven (no duplicate files per variant).
- All visuals use tokens/semantic variables (no template branching).
- Sections have stable prop contracts suitable for structured CMS forms.

---

## Milestone M4 — Public/member site (build targets)

Goal:
- Hub landing + events list/detail + custom pages:
  - `/{hubSlug}/pages/{pageSlug}` on platform domain
  - custom domains for public/member only
- Member signup:
  - Create account -> choose plan
  - Stripe enabled: activate membership on payment
  - Stripe disabled: membership pending/unpaid until admin marks paid
- Event registration:
  - members-only vs guests-allowed per event
  - waitlist creation + admin promotion
- Consistent loading/error/empty UX across pages

Required components:
- All phases complete, plus route-level loading/error boundaries (`loading.jsx`, `error.jsx`, `not-found.jsx`) for major segments.

---

## Preventing Codex guessing (hard rules)

When new UI needs arise:
1) Check `docs/component-registry.md` for an existing component.
2) If missing, update the registry FIRST (add component + layer + contract).
3) Implement component under correct layer and folder structure.
4) Only then use it in patterns/sections/routes.

No ad-hoc component creation.

---

## Lock-in note (functionality docs)

Once Milestones M1–M4 scope and the component registry are stable, produce:
- product overview + role matrix
- route map + gating rules
- data model + state machines
- CMS pages spec
- acceptance criteria per milestone

These docs should reference:
- `docs/component-registry.md`
- this build order document
- the engineering standards/gates

Reference:
- `docs/component-registry.md`
- `docs/roadmap/milestones.md`
