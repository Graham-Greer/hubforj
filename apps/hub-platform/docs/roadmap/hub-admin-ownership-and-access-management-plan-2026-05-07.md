# Hub Admin Ownership And Access Management Plan

Date: 2026-05-07
Status: Locked for implementation planning
Scope: `apps/hub-platform`

## Purpose

This document locks the hub admin ownership model and the initial access-management implementation direction for the hub admin portal.

The goal is to move from a flat `admin` model to a safer and more extensible operator model that:

- distinguishes the initial hub operator as the `owner`
- allows the owner to invite and manage additional `admins`
- prevents regular admins from managing other admins
- leaves a clean extension path for future roles such as `moderator`

This plan is intentionally focused on the hub-side operator model. It does not change platform `superadmin` authority.

## Locked Decisions

The following decisions are now locked:

1. Each hub has exactly one `owner`.
2. The initial admin provisioned for a hub becomes the `owner`.
3. Additional invited hub operators are created as `admin`.
4. Regular `admins` cannot manage other admins.
5. Admin access management is limited to the `owner`.
6. Ownership is transferred, not duplicated.
7. A hub can never have zero active owners.
8. The product must be implemented so future roles such as `moderator` can be added without another large auth refactor.

## Target Role Model

### Initial roles

- `owner`
- `admin`

### Deferred future role

- `moderator`

### Meaning of each role

#### Owner

The `owner` is the primary hub operator and the only hub-side role with authority over admin access.

Initial responsibilities:

- invite admins
- suspend admins
- reactivate admins
- transfer ownership to another active admin
- retain ultimate authority over hub access

The owner should not be removable or suspendable from the normal hub admin UI.

#### Admin

The `admin` is a general hub operator with operational access to the hub admin portal, but without authority over other admins.

Initial responsibilities:

- manage hub content
- manage members
- manage events and courses
- manage attendance and operational workflows
- manage standard admin portal tasks allowed by package tier and product rules

Initial restrictions:

- cannot invite admins
- cannot suspend/reactivate admins
- cannot transfer ownership
- cannot edit or demote the owner

#### Moderator

`moderator` is not part of the first implementation pass, but the model must leave space for it later.

Intended future use:

- event moderation
- course moderation
- attendance management
- narrower community operations

Not intended future use:

- billing/package management
- admin access management
- ownership transfer

## Current-State Audit Summary

The current system is functional, but structurally too flat.

### First admin creation today

The first admin is not created by `createHub()`. Hub creation currently seeds the hub and supporting records, then a separate internal automation route provisions the initial operator as a generic `admin`.

Relevant current files:

- [`src/lib/data/hub-mutations.js`](../../../src/lib/data/hub-mutations.js)
- [`src/app/api/internal/provision-owner-admin/route.js`](../../../src/app/api/internal/provision-owner-admin/route.js)

### Additional admins today

Additional admins are invited and accepted through the admin invite flow, and they are also created as generic `admin`.

Relevant current files:

- [`src/lib/data/invites.js`](../../../src/lib/data/invites.js)
- [`src/app/api/auth/admin-invite/accept/route.js`](../../../src/app/api/auth/admin-invite/accept/route.js)

### Admin management today

The `/admin/admins` route currently:

- lists active admins
- shows pending/expired invites
- supports resend/revoke for invites
- does not support active-admin moderation
- does not distinguish owner from admin

Relevant current files:

- [`src/app/(admin)/[hubSlug]/admin/admins/page.jsx`](../../../src/app/(admin)/[hubSlug]/admin/admins/page.jsx)
- [`src/components/patterns/person-list/PersonList.jsx`](../../../src/components/patterns/person-list/PersonList.jsx)
- [`src/components/patterns/invite-lifecycle-list/InviteLifecycleList.jsx`](../../../src/components/patterns/invite-lifecycle-list/InviteLifecycleList.jsx)

## Problems This Plan Solves

This plan addresses the following gaps:

1. The first hub operator is not structurally distinct from later invited admins.
2. There is no owner concept for long-term governance.
3. There is no active-admin moderation surface.
4. There is no single clear authority for admin access.
5. The current auth model is not yet prepared for a later `moderator` role.
6. The current system risks future scattered `role === "admin"` assumptions across the codebase.

## Target Product Behaviour

### First hub owner

When a new hub is provisioned:

- the initial hub operator is created as `owner`
- that user becomes the single owner of the hub
- no second owner is created automatically

### Inviting another operator

When the owner invites another operator:

- the invite role is `admin`
- accepted invites create `admin` users
- invited admins gain hub admin access but not access-management authority

### Managing active admins

Only the owner can manage active admins.

Initial active-admin management actions:

- suspend admin
- reactivate admin

Deferred from initial pass:

- hard-delete or remove-access workflow

Rationale:

- suspension is safer and reversible
- it avoids immediate pressure around preserving history for access-linked records

### Promoting another admin

The owner does not casually “promote” another admin into a second owner.

Instead, the product uses a deliberate `Transfer ownership` flow:

- the current owner selects an active admin
- the current owner confirms the transfer
- the selected admin becomes `owner`
- the current owner becomes `admin`

This preserves the exactly-one-owner rule.

### Admin restrictions

Regular admins:

- can access the admin portal
- cannot manage admin access
- cannot change the owner
- cannot suspend other admins
- cannot invite more admins

## Core Invariants

These invariants must be enforced in backend logic, not just UI:

1. A hub must always have exactly one owner.
2. A hub must never have zero owners.
3. Ownership transfer must be atomic.
4. Only the current owner can manage admin access.
5. Only active admins can receive ownership.
6. Suspended admins cannot receive ownership.
7. The owner cannot suspend themselves through the normal hub admin UI.
8. Regular admins cannot manage the owner or other admins.

## Implementation Architecture

## Phase 1: Introduce role model

### Data model changes

The hub user model should support:

- `owner`
- `admin`
- `member`
- `superadmin`

Future:

- `moderator`

Key current files likely affected:

- [`src/lib/data/user-shared.js`](../../../src/lib/data/user-shared.js)
- [`src/lib/domain/users.js`](../../../src/lib/domain/users.js)
- [`src/lib/data/user-queries.js`](../../../src/lib/data/user-queries.js)

### Provisioning changes

The internal first-admin provisioning path must create the initial operator as `owner`, not `admin`.

Key file:

- [`src/app/api/internal/provision-owner-admin/route.js`](../../../src/app/api/internal/provision-owner-admin/route.js)

### Invite changes

The hub invite flow should continue to create invited operators as `admin` only.

Key files:

- [`src/lib/domain/invites.js`](../../../src/lib/domain/invites.js)
- [`src/lib/data/invites.js`](../../../src/lib/data/invites.js)

## Phase 2: Upgrade auth and authorization

The current hub admin access model assumes `role === "admin"` in several places. That needs to become an operator-capability model that initially includes:

- `owner`
- `admin`

### Required auth changes

The following areas should move from raw admin-only checks to role-aware hub-operator checks:

- session resolution
- route gating
- admin-shell access
- action-level authorization

Key current files likely affected:

- [`src/lib/auth/member-session.js`](../../../src/lib/auth/member-session.js)
- [`src/lib/auth/hub-access.js`](../../../src/lib/auth/hub-access.js)
- [`src/app/(admin)/[hubSlug]/admin/layout.jsx`](../../../src/app/(admin)/[hubSlug]/admin/layout.jsx)

### Required policy helpers

Introduce centralized helper functions rather than scattering role checks.

Recommended helper concepts:

- `isHubOperatorRole(role)`
- `canAccessHubAdmin(role)`
- `canManageHubAdmins(role)`
- `canTransferHubOwnership(role)`
- `canManageEvents(role)`
- `canManageCourses(role)`

This is the key step that keeps the system extendable to `moderator`.

## Phase 3: Owner-led access management UI

The `/admin/admins` route should become an owner-led access-management route.

### Route intent

This route should be framed as:

- who currently has hub operator access
- which invites are still pending
- what the owner can do next

### Active admins section

Each active operator row should show:

- name
- email
- role
- status
- created date
- last seen

For the owner:

- show an `Owner` badge
- no destructive self-management controls

For admins:

- show an `Admin` badge
- show owner-only actions where relevant

### Initial owner-only actions

On each admin row:

- `Suspend`
- `Reactivate`
- `Transfer ownership`

Deferred:

- `Remove access`

### Pending invites section

Keep the existing invite actions:

- resend
- revoke
- copy acceptance link

### Optional later section

Later, add a lightweight access history section for:

- accepted invites
- revoked invites
- expired invites

## Phase 4: Ownership transfer flow

Ownership transfer should be a dedicated, high-friction flow.

### Transfer rules

- only the current owner can initiate transfer
- target must be an active admin
- target cannot already be owner
- transfer must update both users atomically

### Result of transfer

- target admin becomes `owner`
- current owner becomes `admin`

### UX expectation

The flow should use explicit confirmation messaging explaining:

- the selected admin will become the owner
- the current owner will become a standard admin
- only the owner can manage admin access

## Auditability Requirements

Every admin-access change should record the real actor.

This includes:

- invite creation
- invite revocation
- invite resend
- admin suspension
- admin reactivation
- ownership transfer

### Current weakness

Some current actions use placeholder actor labels such as:

- `hub-admin`
- `platform-operator`

These must be replaced by the real authenticated actor id and, where useful, role context.

## Access-Control Requirements

Sensitive actions must perform action-level authorization checks, not rely only on route protection.

This especially applies to:

- inviting admins
- revoking/resending invites
- suspending/reactivating admins
- transferring ownership

The payments and export areas already use stronger access-check patterns. The admin-access workflows should be brought up to that standard.

## UI And Copy Direction

### Route framing

Recommended route header direction:

- eyebrow: `Admins`
- title: `Manage admin access`
- description: `See who can access the admin portal, keep invites under control, and make ownership changes deliberately.`

### Owner messaging

The UI should make it clear that:

- the owner manages admin access
- admins help operate the hub
- ownership transfer is deliberate and uncommon

### Avoid

- vague “role management” language
- generic people-list framing
- exposing future role complexity too early

## Confirmation Modal Requirement

Important access-management decisions must use confirmation modals rather than immediate inline execution.

This is a locked UX requirement for the first implementation pass.

### Actions that require confirmation

- suspending an admin
- reactivating an admin, if the action has meaningful access implications in context
- transferring ownership
- any future remove-access action

### Confirmation modal expectations

Each modal should:

- clearly state what is about to happen
- identify the affected operator
- explain the consequence in plain admin-friendly language
- require an explicit confirm action
- use stronger warning treatment for higher-risk actions such as ownership transfer

### Specific expectations for ownership transfer

The ownership-transfer modal should explicitly explain:

- the selected admin will become the owner
- the current owner will become a standard admin
- only one owner can exist at a time
- admin access management will move to the new owner

### Specific expectations for admin suspension

The suspension modal should explicitly explain:

- the admin will lose access to the hub admin portal
- this can be reversed later by the owner
- the action does not delete historical records

## Safest Initial Delivery Scope

The first implementation pass should include:

1. introduce `owner` role
2. provision first hub operator as `owner`
3. keep invited operators as `admin`
4. allow both owner and admin into the admin portal
5. limit `/admin/admins` management actions to owner
6. add suspend/reactivate for admins
7. add ownership transfer flow
8. add backend invariants for exactly one owner
9. add last seen to admin rows
10. add real actor tracking for admin-access mutations

The first implementation pass should not include:

- moderator role
- complex permission matrices
- multi-owner support
- admin self-service access governance
- hard delete of operator accounts

## Non-Negotiable Backend Safeguards

Before this work is considered complete, the backend must enforce:

- exactly one owner per hub
- no suspension of the sole owner
- no transfer to suspended admin
- no admin-management actions by non-owner hub operators
- atomic ownership transfer

## Testing Expectations

The implementation should add or update tests around:

- first owner provisioning
- invite acceptance creating `admin`
- owner/admin session access
- owner-only admin-management permissions
- admin blocked from managing other admins
- suspend/reactivate flows
- ownership transfer invariants
- exactly-one-owner enforcement

## Sequencing

Recommended implementation order:

1. data/domain role updates
2. first-owner provisioning changes
3. auth/session/operator access changes
4. owner-only admin-management backend actions
5. `/admin/admins` UI upgrade
6. ownership-transfer flow
7. tests and regression pass

## Open Items Deferred On Purpose

These are intentionally deferred and not blockers for the first pass:

- moderator role introduction
- per-feature capability matrix for non-owner operators
- billing-only or finance-only hub roles
- owner handoff acceptance flow
- historical access audit timeline UI

## Summary

The hub operator model is now locked as:

- exactly one `owner` per hub
- zero or more `admins`
- owner-only admin management
- ownership transferred deliberately, never duplicated

This gives the product:

- a cleaner authority model
- safer admin governance
- a stable foundation for future `moderator` support
- much less future refactor risk than keeping the current flat admin model
