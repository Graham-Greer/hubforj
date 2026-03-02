# Implementation Roadmap (Start-to-Finish, Milestone-Mapped)

Goal:
- Provide a deterministic step-by-step build plan so Codex never guesses what to build next.
- Map milestone delivery to component build order and required route shells.

Authority:
- Must comply with:
  - `AGENTS.md`
  - `docs/standards/*`
  - `docs/component-registry.md`
  - `docs/component-build-order.md`
  - `docs/roadmap/milestones.md`
  - `docs/product/*`

Hard rule:
- Codex MUST follow this sequence unless an explicit override is approved and logged.

---

## Phase A — Bootstrap (fresh repo)

A1) Create required folders and route groups (shell only)
- Create `src/components/{primitives,ui,patterns,sections}` empty folders
- Create route group shells:
  - `(platform)` `/platform/*`
  - `(admin)` `/{hubSlug}/admin/*`
  - `(public)` hub public routes
  - `(member)` member portal routes

A2) Wire `globals.css` and verify token availability
- Ensure global import exists and theme mechanism is consistent

A3) Add baseline route boundaries
- Add minimal `loading.jsx`, `error.jsx` for major route groups (placeholders allowed initially)

Acceptance:
- App builds and runs
- No business logic implemented yet
- Documentation Preflight is possible

---

## Phase B — UI Foundation (must be completed before M1 feature work)

Codex MUST follow `docs/component-build-order.md` strictly.
At minimum, complete:
- Primitives
- UI kernel
- Form system
- Core patterns required by admin screens
- Toast + ConfirmModal + Skeleton system

Acceptance:
- UI primitives exist and are tokenized
- ConfirmModal replaces `window.confirm`
- Skeleton primitives exist for lists/forms/media grids

---

## Phase C — M1 Superadmin hub provisioning

C1) Platform layout shells
- Implement `/platform` layout with:
  - top nav
  - collapsible side nav with icon+label items

C2) Hub provisioning
- Screens:
  - hub list
  - create hub
  - edit hub config (templateKey, token overrides)
  - feature flags config
  - custom domain config (public/member only)

C3) Invite hub admins
- invite admin flow (invite-only onboarding)

C4) Support mode entry
- select hub → enter support mode → redirect to `/{hubSlug}/admin`
- hub admin layout MUST show support banner
- exit support mode returns to `/platform`

Acceptance:
- A hub can be provisioned fully
- A hub admin can be invited
- Support mode is explicit and reversible
- Feature flags visible in hub admin routes (locked routes render FeatureLocked)

### Implementation of Firebase — M1.0 and M1.1

MUST read `docs/firebase/*`

---

## Phase D — M2 Hub admin events + memberships

D1) Hub admin layout shells
- top nav + collapsible side nav (icon+label; collapse to icon-only)
- feature list screen and locked feature routes

D2) Events CRUD
- event create/edit
- draft→published→cancelled lifecycle
- fields per product spec (including WYSIWYG and DateTimePicker)
- images via Media Library selection flow

D3) Registrations operations
- DataTable for registrations
- waitlist promote
- payment status marking (offline supported)
- attendance marking (admin-only)
- remove/cancel registration

D4) Membership plans + memberships
- plan CRUD
- membership lifecycle management
- expiry is system-derived; admin renewals and payment marking

Acceptance:
- Events can be published and appear in hub public surface (even if placeholder UI)
- Registrations obey capacity + waitlist rules
- Membership states obey state machine rules

---

## Phase E — M3 CMS pages (superadmin CMS first)

E1) Media Library (admin/superadmin)
- implement `docs/product/media-library.md` in full:
  - folders (single-level)
  - tabs
  - search
  - upload queue UX
  - asset details panel
  - usageRefs maintenance and delete prohibition
  - video support
  - alt enforcement at publish/save

E2) Pages CMS editor (superadmin-only)
- create/edit pages (custom pages beyond home/events/contact)
- draft composition editor
- publish copies draft→published
- preview uses draft (no-store); live uses published (cached/revalidate)

E3) Header/footer configuration
- global header/footer selection
- per-page overrides

Acceptance:
- Published pages render at `/{hubSlug}/pages/{pageSlug}`
- Preview/live parity is preserved
- CMS is locked for hub admins unless enabled later

---

## Phase F — M4 Public/member site + onboarding

F1) Hub resolution + theming
- host header resolution for custom domains
- templateKey + token overrides applied at shell

F2) Public rendering
- landing, events list/detail, custom pages, contact info
- members-only visibility gates

F3) Member onboarding
- account creation → plan selection
- membership active vs pending rules (Stripe off in MVP)
- member portal screens

F4) Event registration flows
- members-only vs guests-allowed (account required regardless)
- waitlist creation
- member cancellation

Acceptance:
- Public site works on platform domain and custom domain
- Member portal works and reflects membership + registrations
- Registration rules and state machines enforced

---

## Definition of “Ready to start coding” (HARD)

Codex can begin implementation ONLY when:
- Preflight handshake is completed (docs/bootstrap/fresh-install-checklist.md)
- `docs/component-registry.md` and `docs/component-build-order.md` are present and authoritative
- `docs/product/*` specs are present (including media library and state machines)
- Standards docs are present and prioritized

If any are missing:
- Codex MUST stop and request missing docs before implementing features.
