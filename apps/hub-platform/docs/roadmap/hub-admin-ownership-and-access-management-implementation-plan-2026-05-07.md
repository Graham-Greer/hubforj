# Hub Admin Ownership And Access Management Implementation Plan

Date: 2026-05-07
Status: Ready for implementation
Scope: `apps/hub-platform`
Depends on: [`hub-admin-ownership-and-access-management-plan-2026-05-07.md`](./hub-admin-ownership-and-access-management-plan-2026-05-07.md)

## Purpose

This document turns the locked owner/admin access model into a concrete implementation sequence.

It is designed to:

- keep the first pass safe and focused
- avoid a scattered auth refactor
- preserve a clean extension path for future `moderator` support
- give us a step-by-step delivery plan we can execute against

## Locked Product Outcomes

This implementation must deliver the following outcomes:

1. Each hub has exactly one `owner`.
2. The first hub operator is provisioned as `owner`.
3. Invited hub operators are created as `admin`.
4. Both `owner` and `admin` can access the admin portal.
5. Only the `owner` can manage admin access.
6. Owners can suspend/reactivate admins.
7. Owners can transfer ownership to an active admin.
8. Admin management actions use confirmation modals.
9. The backend enforces the owner invariants.
10. The system remains easy to extend with a future `moderator` role.

## Delivery Strategy

This work should be delivered in six implementation phases:

1. role and domain foundation
2. provisioning and invite lifecycle updates
3. auth and authorization refactor
4. owner-only admin-management backend actions
5. `/admin/admins` UI upgrade
6. verification and regression hardening

Do not start with the UI.

The backend role model and access checks must be in place first so the route is built on real permissions instead of temporary UI assumptions.

## Phase 1: Role And Domain Foundation

### Goal

Introduce `owner` as a first-class hub operator role and centralize the new role semantics.

### Primary changes

- update user role labels and tones to include `owner`
- update user normalization and any role-safe helpers
- add central helper functions for hub operator role checks

### Files likely affected

- [`src/lib/domain/users.js`](../../../src/lib/domain/users.js)
- [`src/lib/data/user-shared.js`](../../../src/lib/data/user-shared.js)
- [`src/lib/data/users.js`](../../../src/lib/data/users.js)

### New helper direction

Add or centralize helpers such as:

- `isHubOperatorRole(role)`
- `isOwnerRole(role)`
- `canAccessHubAdmin(role)`
- `canManageHubAdmins(role)`
- `canTransferHubOwnership(role)`

These helpers should become the source of truth for hub operator permissions.

### Acceptance criteria

- `owner` is a recognized and normalized role
- role labels/tone helpers support `owner`
- there is a single place to reason about hub operator permissions

## Phase 2: Provisioning And Invite Lifecycle Updates

### Goal

Ensure the first hub operator is created as `owner` while invited operators remain `admin`.

### Primary changes

- update first-owner provisioning route to create `owner`
- keep invite creation constrained to `admin`
- keep invite acceptance creating `admin`

### Files likely affected

- [`src/app/api/internal/provision-owner-admin/route.js`](../../../src/app/api/internal/provision-owner-admin/route.js)
- [`src/lib/data/invites.js`](../../../src/lib/data/invites.js)
- [`src/lib/domain/invites.js`](../../../src/lib/domain/invites.js)

### Important detail

The invite flow should stay intentionally narrow in v1:

- owners invite admins
- no invite-time role choice beyond `admin`

That keeps the first pass simple and avoids prematurely exposing future role complexity.

### Acceptance criteria

- newly provisioned first hub operator is `owner`
- invited operators are still `admin`
- no existing invite flow behavior regresses

## Phase 3: Auth And Authorization Refactor

### Goal

Refactor hub admin access so it works for both `owner` and `admin`, while keeping management actions restricted to the owner.

### Primary changes

- update hub session resolution to accept both `owner` and `admin`
- update admin-shell access gating accordingly
- update action-level access helpers to distinguish:
  - admin portal access
  - admin-access management authority

### Files likely affected

- [`src/lib/auth/member-session.js`](../../../src/lib/auth/member-session.js)
- [`src/lib/auth/hub-access.js`](../../../src/lib/auth/hub-access.js)
- [`src/app/(admin)/[hubSlug]/admin/layout.jsx`](../../../src/app/(admin)/[hubSlug]/admin/layout.jsx)

### Required implementation rule

Do not hardcode new behavior with scattered conditions like:

- `role === "owner" || role === "admin"`

Instead, move route and action logic through the centralized helper layer introduced in Phase 1.

### Acceptance criteria

- owners can access all existing hub admin routes
- admins can still access the hub admin portal
- admin-management authority is not granted to admins

## Phase 4: Owner-Only Admin Management Backend

### Goal

Add the backend actions and invariants required for owner-led admin management.

### Primary changes

- add suspend-admin action
- add reactivate-admin action
- add transfer-ownership action
- add owner-only authorization checks on admin-management actions
- ensure all admin-management mutations record the real acting operator

### Files likely affected

- [`src/lib/data/user-mutations.js`](../../../src/lib/data/user-mutations.js)
- [`src/lib/data/user-queries.js`](../../../src/lib/data/user-queries.js)
- new or updated admin action files under:
  - [`src/app/(admin)/[hubSlug]/admin/admins/`](../../../src/app/(admin)/[hubSlug]/admin/admins)

### New backend rules

The backend must enforce:

- only the owner can manage admin access
- owner cannot suspend themselves through the hub admin UI
- admin cannot manage other admins
- ownership transfer target must be an active admin
- transfer must leave exactly one owner

### Strong recommendation

Ownership transfer should be implemented as an atomic operation, ideally in one batch/transaction-style update against the two operator records.

### Actor tracking requirement

Current hardcoded actor labels like `hub-admin` must be replaced with the real authenticated operator id.

This should apply to:

- invite creation
- invite revoke/resend
- admin suspension/reactivation
- ownership transfer

### Acceptance criteria

- owner-only backend actions exist
- actor ids are recorded properly
- invariants are enforced even if the UI is bypassed

## Phase 5: `/admin/admins` UI Upgrade

### Goal

Turn the current read-only admin list into a real owner-led access management route.

### Primary changes

- update active-admin section to show role-aware rows
- surface `owner` distinctly
- surface `last seen`
- show owner-only controls for admin rows
- preserve invite lifecycle controls
- add confirmation modals for high-risk actions

### Files likely affected

- [`src/app/(admin)/[hubSlug]/admin/admins/page.jsx`](../../../src/app/(admin)/[hubSlug]/admin/admins/page.jsx)
- [`src/components/patterns/person-list/PersonList.jsx`](../../../src/components/patterns/person-list/PersonList.jsx)
- [`src/components/patterns/invite-lifecycle-list/InviteLifecycleList.jsx`](../../../src/components/patterns/invite-lifecycle-list/InviteLifecycleList.jsx)
- any new owner-admin management component extracted from the route

### Recommended route structure

1. page header
2. active operators section
3. pending invites section
4. optional secondary access history section later

### Active operator row content

Each row should show:

- name
- email
- role badge
- status badge
- last seen
- created date

For the owner row:

- show `Owner`
- do not show destructive self-management controls

For admin rows, when viewed by owner:

- `Suspend` or `Reactivate`
- `Transfer ownership`

For admin rows, when viewed by admin:

- no management controls

### Confirmation modal requirement

The UI must use confirmation modals for:

- suspending an admin
- reactivating an admin if the UX warrants confirmation in context
- transferring ownership

Ownership transfer should use the strongest wording and clearest consequence explanation.

### Acceptance criteria

- owner sees actionable admin-management controls
- admin sees an informational admin-access view only
- owner transfer and suspension actions are gated behind confirmation modals

## Phase 6: Verification And Regression Hardening

### Goal

Lock the new model down with tests and a focused regression pass.

### Test coverage to add or update

- first-owner provisioning creates `owner`
- admin invite acceptance creates `admin`
- owner and admin session access both work
- admin portal layout allows owner/admin but not member
- only owner can manage admins
- admin cannot suspend/reactivate/transfer ownership
- owner cannot leave the hub with zero owners
- ownership transfer results in exactly one owner
- confirmation-modal UI states appear for destructive actions

### Likely tests affected

- existing user/auth tests
- invite tests
- admin portal UX route tests
- new owner-admin management tests

### Manual verification checklist

1. Provision a new hub and confirm first operator shows as owner.
2. Invite a second operator and accept invite.
3. Confirm invited operator shows as admin.
4. Confirm invited admin can access the admin portal.
5. Confirm invited admin cannot manage admin access.
6. Confirm owner can suspend and reactivate that admin.
7. Confirm owner can transfer ownership.
8. Confirm previous owner becomes admin after transfer.
9. Confirm there is never more than one owner.

## Implementation Order In Practice

This is the recommended working order for actual coding:

1. Phase 1 role/domain helpers
2. Phase 2 provisioning changes
3. Phase 3 auth/session changes
4. Phase 4 backend admin-management mutations
5. Phase 5 route/component UI work
6. Phase 6 tests and verification

This order matters because:

- the route should not be built before permissions are real
- owner transfer logic should not ship before owner invariants exist
- UI controls should not appear before backend checks are trustworthy

## Out Of Scope For This Pass

These items are intentionally excluded from the first implementation pass:

- moderator role implementation
- multi-owner support
- billing-only operator roles
- fine-grained content permissions matrix
- hard-delete operator records
- self-service ownership acceptance flow
- full audit log timeline UI

## Risks And How To Avoid Them

### Risk: scattered admin checks

If raw `role === "admin"` checks are patched one-by-one, the codebase will become harder to extend later.

Mitigation:

- centralize role and permission helpers first

### Risk: UI-only protection

If admin-management rules only exist in the route UI, the model will be unsafe.

Mitigation:

- enforce owner-only rules in backend actions and data-layer mutations

### Risk: ownership-transfer inconsistency

If owner transfer is not atomic, the system could temporarily end up with zero or multiple owners.

Mitigation:

- perform both role changes in one atomic operation

### Risk: weak actor attribution

If access changes continue using placeholder actor labels, the system will remain weak operationally.

Mitigation:

- record the real acting operator id on all access mutations

## Definition Of Done

This implementation is done when:

- first hub operator is `owner`
- invited operators are `admin`
- owner and admin can both access the admin portal
- only owner can manage admin access
- ownership transfer works safely
- exactly one owner invariant is enforced
- owner-facing admin-management UI is live
- high-risk actions use confirmation modals
- tests cover the new role and ownership model

## Suggested Next Execution Step

Start with Phase 1 and Phase 2 together:

- introduce `owner` role
- update first-owner provisioning
- keep invite-created operators as `admin`

That gives the rest of the implementation a stable foundation before touching sessions or UI.
