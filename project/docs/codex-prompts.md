# Codex Prompts (Copy/Paste Task Starters)

Purpose:
- Provide consistent, reusable task prompts that keep Codex aligned with:
  - `AGENTS.md` (hard-stop + preflight)
  - standards docs (`docs/standards/*`)
  - `docs/component-registry.md` + `docs/component-build-order.md`
  - product specs (`docs/product/*`)
  - milestone plan (`docs/roadmap/*`)
  - checklists (`docs/checklists/*`)
  - bootstrap (`docs/bootstrap/fresh-install-checklist.md`)

- Reduce ambiguity so Codex does not guess architecture, folder placement, routing, or patterns.

Hard rules:
- Every prompt MUST enforce:
  - Preflight (standards-first reading) when starting a fresh repo or a new milestone
  - QOS CHECK → plan → confirmation → code → QOS SUMMARY
  - registry-first rule for new components
  - build-order compliance for component implementation
- Codex MUST NOT output code before explicit confirmation.

---

## Global prefix (paste at the top of every Codex request)

Paste this block first in every task:

```
Apply `AGENTS.md` and `docs/codex-workflow.md` strictly.

PRE-FLIGHT (required when starting a fresh repo OR starting a new milestone):
- Follow `docs/bootstrap/fresh-install-checklist.md` Step 0 (standards-first required reading + comprehension handshake).
- Output the required Preflight format before QOS CHECK.

Before any code:
1) Run `QOS CHECK` per `docs/checklists/qos-check.md`.
2) MUST read and provide an implementation plan aligned to:
   - `AGENTS.md`
   - `docs/standards/nextjs-runtime-performance.md`
   - `docs/standards/engineering-source-of-truth.md`
   - `docs/standards/theming-architecture.md`
   - `docs/checklists/definition-of-done.md`
   - `docs/checklists/qos-check.md`
   - `docs/checklists/qos-summary.md`
   - `docs/standards/repo-structure-and-conventions.md`
   - `docs/standards/loading-error-and-resilience.md`
   - `docs/standards/ops-quality-and-security.md`
   - `docs/standards/drag-and-drop.md`
   - `docs/component-registry.md`
   - `docs/component-build-order.md`
   - `docs/roadmap/implementation-roadmap.md`
   - `docs/checklists/*`
   - Relevant product specs for the milestone in `docs/product/*` (including `state-machines.md` and `media-library.md` where applicable)
   - Relevant firebase specs for the milestone in `docs/firebase/*`
3) Ask for confirmation using exactly:
   `Implementation plan aligned to standards. Confirm and I will proceed with code edits.`

Do not output code until confirmation is given.

Enforce:
- Reuse-first
- Layering integrity
- Token-only styling in colocated `.module.css`
- No new components outside `docs/component-registry.md` without updating it first
- Obey build order in `docs/component-build-order.md`
```

---

# Bootstrap (M0) — Fresh Next.js install start

> Use these prompts BEFORE M1 when starting from a fresh Next.js install with only `globals.css` in place.

## M0.1 Repo scaffolding + route group shells

```
[M0] Fresh install scaffolding (no feature logic)

Goal:
Starting from a fresh Next.js App Router install with `globals.css` in place, implement ONLY:
- Required folder scaffolding:
  - `src/components/{primitives,ui,patterns,sections}`
  - `src/hooks`
  - `src/lib`
  - `docs` (ensure docs are present)
- Required route group shells (placeholder pages only):
  - `src/app/(platform)/platform/*`
  - `src/app/(admin)/[hubSlug]/admin/*`
  - `src/app/(public)/[hubSlug]/*`
  - `src/app/(member)/[hubSlug]/account/*`
- Wire `globals.css` correctly (import once at app entry)
- Add placeholder `loading.jsx` and `error.jsx` for major route groups (minimal)

Constraints:
- Follow `docs/bootstrap/fresh-install-checklist.md`.
- Do not implement business logic or DB integration.
- Do not add “utility frameworks” globally (beyond minimal `.container` if already present).
- Enforce `.jsx` only and component folder convention.

Deliverables:
- App runs with placeholder pages.
- No feature work yet.

Apply full workflow: Preflight → QOS CHECK → plan → confirmation → code → QOS SUMMARY.
```

## M0.2 UI foundation (primitives + UI kernel + forms + core patterns)

```
[M0] UI foundation build (components only)

Goal:
Implement the UI foundation required before milestone work:
- Primitives
- UI kernel (buttons, modal, drawer, toast, skeleton system, etc.)
- Form system (Field wrappers + custom controls)
- Core patterns needed for admin screens (PageHeader, DataTable, FilterBar, FeatureLocked, CMS patterns as prerequisites)

Constraints:
- Follow `docs/component-build-order.md` strictly.
- Do not implement product business logic (no hubs/events/memberships yet).
- No new components outside `docs/component-registry.md` without updating it first.
- Token-only styling via `.module.css`.

Deliverables:
- Component library is complete per registry and build order.
- Story/demo pages are optional; keep routes minimal.
- Components are accessible and keyboard operable.

Apply full workflow: Preflight → QOS CHECK → plan → confirmation → code → QOS SUMMARY.
```

---

## M0.3 Firebase bootstrap (setup + schema + rules + emulator tests)

```
[M0] Firebase bootstrap (no product feature UI yet)

Goal:
Set up Firebase in a production-grade way so later milestones do not require refactors:
- Add Firebase client/admin split:
  - `src/lib/firebase/client.js`
  - `src/lib/firebase/admin.js`
- Add Firebase repo boundaries:
  - `src/lib/data/**` (repositories/services; server-first)
  - `src/lib/auth/**` (session helpers)
  - `src/lib/validation/**` (schemas)
- Add initial Firestore schema skeleton (collections + minimal doc shapes) aligned to:
  - `docs/firebase/firestore-schema.md`
  - `docs/product/data-model.md`
  - `docs/product/state-machines.md`
  - `docs/product/media-library.md`
- Add Firestore rules + Storage rules aligned to:
  - `docs/firebase/firestore-rules.md`
  - `docs/firebase/storage-rules.md`
- Add emulator + rules test harness aligned to:
  - `docs/firebase/emulators-and-testing.md`
- Add a deployment checklist stub aligned to:
  - `docs/firebase/deployment.md`

Constraints:
- Follow `docs/firebase/firebase-setup.md` and `docs/firebase/nextjs-integration.md`.
- Enforce server/client boundaries:
  - Client components MUST NOT import Admin SDK modules.
  - Middleware MUST NOT use Admin SDK.
- Do not implement superadmin/hub admin/member UIs yet (no milestone features).
- Do not create extra collections outside `docs/firebase/firestore-schema.md`.
- Must keep hub media blobs public-read by URL (Option A) and implement delete prohibition when `usageCount > 0`.

Deliverables:
- Firebase config is wired, env var contract documented, and app boots locally.
- Rules compile and emulator tests run for the minimum cases.
- No product feature screens yet.

Apply full workflow: Preflight → QOS CHECK → plan → confirmation → code → QOS SUMMARY.
```

## Milestone M1 — Superadmin hub provisioning

### M1.1 Hub provisioning screens

```
[M1] Superadmin hub provisioning

Goal:
Implement superadmin screens to create and manage hubs:
- Create hub (name, slug)
- Configure templateKey + token overrides
- Toggle hub features (cmsPages, stripePayments, etc.)
- Invite hub admins (invite-only)
- Support mode entry (superadmin can enter hub admin routes with a visible banner)

Constraints:
- Admin surfaces are platform-domain only.
- Hub admins can view feature flags in their admin portal (including locked upsell screens).
- Use Next.js App Router layouts to keep superadmin nav persistent.
- Use token-based styling and the component registry only.
- Must comply with `docs/product/auth-and-session.md` (determinism) and `docs/product/feature-flags-and-addons.md`.

Deliverables:
- Route/layout structure for `/platform/*`
- UI screens with loading/empty/error states
- Service/repository boundaries in `src/lib/**` (no DB logic in UI)
- Deterministic auth/session gating (no redirect bounce loops)

Apply `AGENTS.md` and `docs/codex-workflow.md` strictly.
```

### M1.2 Invite hub admins flow

```
[M1] Invite hub admins

Goal:
Implement superadmin invite flow:
- Invite by email
- Assign hubId + role=admin
- Show pending invites list and allow revoke

Constraints:
- Invite-only creation (no self-serve hub admins).
- Authorization: superadmin only.
- Centralize write logic in repositories/services in `src/lib/**`.
- Validate inputs server-side.
- Follow `docs/product/auth-and-session.md` (session determinism).

Apply workflow strictly.
```

### M1.3 Support mode (context switch into a hub)

```
[M1] Support mode context switch

Goal:
Implement support mode for superadmin:
- Superadmin selects a hub in `/platform`
- Enters support mode and is redirected into `/{hubSlug}/admin`
- Display a persistent “Support mode” banner in hub admin layout
- Provide a clear way to exit support mode back to `/platform`

Constraints:
- Must not weaken tenant isolation; support mode must be explicit and auditable.
- Admin remains platform-domain only.
- Follow auth/session determinism rules to avoid redirect bounce loops.
- Do not add new components outside `docs/component-registry.md`.

Apply workflow strictly.
```

### M1.4 Hub theming + domain config (platform settings)

```
[M1] Hub theming + domain configuration

Goal:
Implement hub configuration:
- Set templateKey
- Edit token overrides (scoped to templates and/or semantic vars)
- Configure custom domain mapping (public/member only)
- Admin portal remains on platform domain

Constraints:
- Apply `docs/standards/theming-architecture.md`
- No template branching inside components
- CMS preview/live parity must be preserved
- Domain resolution must follow `docs/product/routes-and-gating.md`

Apply workflow strictly.
```

---

## Milestone M2 — Hub admin events + memberships

### M2.1 Hub admin shell (top nav + collapsible side nav)

```
[M2] Hub admin layout shell

Goal:
Implement hub admin layout in `/{hubSlug}/admin/*`:
- Persistent top nav + collapsible side nav
- Side nav items include Icon left of text; collapse to icons-only
- Support mode banner when superadmin has context-switched into hub

Constraints:
- Admin routes are platform domain only.
- Must use Next.js layouts for persistence (avoid remounting nav).
- No inline styles; tokenized `.module.css`.
- Use Google Material Symbols via `primitives/icon/Icon.jsx`.
- Feature-flagged routes must render FeatureLocked if disabled (see `docs/product/feature-flags-and-addons.md`).

Apply workflow strictly.
```

### M2.2 Events CRUD + publish/cancel

```
[M2] Hub admin events CRUD

Goal:
Implement hub admin events:
- Create/edit event
- Draft → published
- Published → cancelled
- Disallow published → draft when registrations exist
- Fields:
  - title
  - WYSIWYG description (bold/italic/underline/bullets/numbered/link only)
  - image(s) via Media Library selector
  - start/end datetime (custom DateTimePicker)
  - location (string)
  - capacity (int)
  - category (Workshop|Meetup|Course)
  - tags (string[])
  - pricingMode (free|paid)
  - price (required if paid)
  - registrationEligibility (members-only|guests-allowed)
  - visibility (public|members-only)

Constraints:
- Must enforce state machines in `docs/product/state-machines.md`.
- Must comply with Media Library rules in `docs/product/media-library.md` (usageRefs, delete prohibition, alt enforcement at publish/save).
- Use `ui/form/wysiwyg/WysiwygEditor.jsx` wrapper; no code/HTML mode.
- Validate server-side; normalize outputs.
- Provide loading/error/empty states using shared primitives.
- Do not implement email sending yet; only scope future hooks/intent.

Apply workflow strictly.
```

### M2.3 Registrations + waitlist + attendance + payment tracking

```
[M2] Registrations + waitlist + attendance + payment tracking

Goal:
Implement hub admin event operations:
- View registrations: registered/waitlisted/cancelled
- Manual promote waitlisted → registered
- Payment status per registration: not-required/unpaid/paid (offline allowed when Stripe disabled)
- Attendance per registration: unknown/attended/no-show (admin-only; not for cancelled registrations)
- Admin can remove/cancel registrations
- Capacity rules:
  - if registeredCount < capacity => new regs become registered
  - else => waitlisted

Constraints:
- Use `patterns/data-table/DataTable.jsx` + `patterns/filter-bar/FilterBar.jsx`.
- Destructive actions require ConfirmModal (no window.confirm).
- State machines are canonical per `docs/product/state-machines.md`.
- Persisted email notifications are out of MVP; do not send emails.

Apply workflow strictly.
```

### M2.4 Membership plans + memberships lifecycle

```
[M2] Membership plans + membership lifecycle

Goal:
Implement hub admin membership management:
- MembershipPlan CRUD:
  - title
  - description (optional WYSIWYG)
  - duration (days/months/years)
  - price
  - active flag
- Membership lifecycle:
  - pending (Stripe off or unpaid)
  - active
  - expired (system-derived only: renewalDate + grace)
  - inactive (admin manual)
  - cancelled (member/admin)
- Admin actions:
  - mark membership paid/unpaid
  - renew membership (sets renewalDate)
  - activate/deactivate
  - cancel membership

Constraints:
- Must enforce membership state machine in `docs/product/state-machines.md`.
- Stripe payments are feature-flagged; offline support required.
- Provide loading/error/empty states.

Apply workflow strictly.
```

### M2.5 Hub admin feature flags screen (visible upsell)

```
[M2] Hub admin feature flags (visible)

Goal:
Implement hub admin screen to view feature flags:
- Show enabled/disabled features
- For disabled features, link to a locked route that renders FeatureLocked (marketing copy)

Constraints:
- Enforcement is server-side; UI visibility is not the gate.
- Locked routes must not 404; they must render FeatureLocked.
- Follow `docs/product/feature-flags-and-addons.md`.

Apply workflow strictly.
```

---

## Milestone M3 — CMS pages (superadmin CMS first)

### M3.1 Superadmin pages builder

```
[M3] Superadmin CMS pages builder (custom pages)

Goal:
Implement superadmin-only CMS pages builder:
- Create custom pages beyond home/events/contact
- Public route: `/{hubSlug}/pages/{pageSlug}`
- Draft vs published:
  - edit draft composition (structured forms)
  - publish copies draft → published
- Preview uses draft (no-store), live uses published (cached/revalidate)
- Page settings:
  - title, slug, status
  - SEO: title/description/image

Constraints:
- CMS editing is superadmin-only for MVP.
- Hub admins see CMS pages as locked upsell unless feature enabled later.
- Page blocks use section registry; no template branching.
- Must comply with:
  - `docs/product/cms-pages.md`
  - `docs/product/cms-block-registry.md`
  - `docs/product/media-library.md` (selection, usageRefs, delete prohibition, alt enforcement).
- Structured forms; WYSIWYG only for rich text blocks/fields.

Apply workflow strictly.
```

### M3.2 Header/footer global config + per-page overrides

```
[M3] Header/footer global config + per-page overrides

Goal:
Implement hub-scoped layout config:
- globalHeaderId, globalFooterId
- per-page overrides: headerIdOverride, footerIdOverride
- CMS UI to select and preview variants

Constraints:
- Headers/footers are sections:
  - HeaderSection variants: standard|minimal|landing
  - FooterSection variants: simple|columns|cta
- Must use Next.js layouts to keep header/footer persistent and resolved server-side.
- Must maintain CMS preview/live parity.

Apply workflow strictly.
```

### M3.3 Block registry + structured prop forms

```
[M3] CMS block registry + structured editor forms

Goal:
Implement CMS composition editor:
- Register all sections as blocks (including optional-now-MVP blocks)
- BlockPicker: add blocks
- BlockList: reorder/remove
- BlockEditor: structured form per block schema
- SectionRenderFallback for unknown blocks

Constraints:
- Variants are props, not separate files.
- No new components outside registry without updating `docs/component-registry.md`.
- Block model MUST follow `docs/product/cms-block-registry.md`.

Apply workflow strictly.
```

---

## Milestone M4 — Public/member site

### M4.1 Hub public site rendering (theme + pages)

```
[M4] Public hub site rendering (theme + pages)

Goal:
Implement public site rendering:
- Hub landing (CMS-driven composition)
- Custom pages: `/{hubSlug}/pages/{pageSlug}`
- Events list + event detail
- Featured events and contact info

Constraints:
- Support custom domains for public/member site only.
- Admin remains platform-domain only.
- Resolve hub by Host header (custom domain) or hubSlug path.
- Apply templateKey + token overrides via theming architecture.
- Use server fetch + caching/revalidate for published content.
- Implement loading/error/not-found boundaries.
- Enforce visibility gates per `docs/product/routes-and-gating.md`.

Apply workflow strictly.
```

### M4.2 Member onboarding: account → plan → membership activation rules

```
[M4] Member onboarding (account → plan → membership)

Goal:
Implement onboarding:
- Create account → choose plan
- If Stripe enabled: membership activates on payment success (future)
- If Stripe disabled: membership becomes pending/unpaid until admin marks paid

Constraints:
- One user belongs to one hub.
- Deterministic auth/session gating (no redirect bounce loops).
- Must comply with `docs/product/auth-and-session.md` and `docs/product/membership-flow.md`.
- Do not implement email sending yet; only scope future hooks/intent.

Apply workflow strictly.
```

### M4.3 Event registration eligibility + waitlist

```
[M4] Event registration eligibility + waitlist

Goal:
Implement event registration flows:
- Events can be members-only OR guests-allowed
- Guests-allowed still requires an account
- Waitlist when capacity reached
- Member can cancel registration (cutoff later)

Constraints:
- Payment tracking supports offline (Stripe disabled) with admin marking paid.
- Attendance is admin-only in hub admin portal.
- Must enforce `docs/product/state-machines.md` and `docs/product/events-and-registrations.md`.

Apply workflow strictly.
```

### M4.4 Member portal screens

```
[M4] Member portal screens

Goal:
Implement member portal:
- Membership status view (pending/active/expired/inactive/cancelled)
- My registrations list (registered/waitlisted/cancelled)
- Cancel membership
- Cancel registration (if allowed)

Constraints:
- Use persistent layouts for portal nav.
- Prefer server fetch + render; keep client components minimal.
- Reuse shared UI primitives (Status badges, cards, empty/error/loading).
- Must comply with `docs/product/state-machines.md`.

Apply workflow strictly.
```

---

## Utility prompts (process constraints)

### Missing component prompt (registry-first rule)

```
A needed UI component is not present in `docs/component-registry.md`.

Do NOT create it yet.
1) Propose an update to `docs/component-registry.md`:
   - layer
   - component name
   - folder path
   - responsibility
   - variants
   - key props
   - what it composes
2) Explain why it cannot be solved by extending an existing component.
3) Ask for confirmation before implementing the new component.
```

### Build order conflict prompt (prerequisites-first rule)

```
This task conflicts with `docs/component-build-order.md` because prerequisites are missing.

1) Identify the missing prerequisites (components/patterns/sections).
2) Propose the smallest prerequisite implementation slice first.
3) Ask for confirmation before implementing prerequisites.
```

### Standards conflict prompt (non-negotiables)

```
This request conflicts with a non-negotiable rule in `docs/standards/engineering-source-of-truth.md`.

1) Name the rule being violated and why.
2) Propose compliant alternative(s).
3) Ask for explicit override if the user wants to proceed on a known breach.
4) If approved, log an exception note (rule, reason, follow-up, deadline).
```
