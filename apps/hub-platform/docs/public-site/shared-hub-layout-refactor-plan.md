# Shared Hub Layout Refactor Plan

Status:
- Implemented
- Detailed implementation planning document for unifying public and member routes under one hub-scoped layout boundary inside `apps/hub-platform`

Purpose:
- Eliminate avoidable header/footer remounts between public and member routes
- Make the "one hub site" experience technically true, not just visually similar
- Define a production-grade route/layout refactor that preserves auth boundaries while sharing the same branded shell
- Establish the correct ownership boundary for hub-scoped shell data such as theme, template, site settings, and header model

Implementation outcome:
- shared hub routes now live beneath `src/app/(hub)/[hubSlug]`
- the shared hub shell is mounted in `src/app/(hub)/[hubSlug]/layout.jsx`
- member account auth is enforced in `src/app/(hub)/[hubSlug]/account/layout.jsx`
- legacy separate `(public)` and `(member)` hub route trees have been removed

---

## 1) Problem statement

The current route structure keeps public routes and member-account routes under separate App Router layout trees:

- `src/app/(public)/[hubSlug]/layout.jsx`
- `src/app/(member)/[hubSlug]/account/layout.jsx`

Even though both trees now render the same modern `PublicShell`, they still mount from different layout boundaries.

That means:
- navigating between `/{hubSlug}/events` and `/{hubSlug}/account`
- navigating between `/{hubSlug}/courses/{courseSlug}` and `/{hubSlug}/account/registrations`
- navigating back from member routes to public routes

causes:
- header remount
- footer remount
- mobile drawer state reset
- avoidable shell re-initialization
- a subtle but real break in continuity

This is not aligned with the intended product experience for members.

Members should feel like they are moving around one hub site.

They should:
- keep the same branded shell
- keep the same primary public navigation
- access member tasks through utility navigation under the avatar
- move between public discovery and member tasks without feeling dropped into a separate portal

The current route boundary undermines that.

---

## 2) Product decision

The hub shell should be shared across:
- public routes
- member routes

It should remain separate from:
- admin routes
- platform routes

Therefore:
- public and member routes should be refactored under one shared hub-scoped layout
- admin routes should continue to use the separate admin shell
- member auth protection should move below the shared shell boundary, not remain attached to a competing layout tree

This is the production-grade direction.

---

## 3) Core architecture principle

### 3.1 One hub shell, multiple protected surfaces

The correct route model is:
- one shared hub layout for all hub-facing non-admin routes
- protected member-only areas inside that shared hub layout

This means:
- `/{hubSlug}`
- `/{hubSlug}/about`
- `/{hubSlug}/events`
- `/{hubSlug}/events/[eventSlug]`
- `/{hubSlug}/courses`
- `/{hubSlug}/courses/[courseSlug]`
- `/{hubSlug}/sign-in`
- `/{hubSlug}/join`
- `/{hubSlug}/account`
- `/{hubSlug}/account/*`

should all live beneath one shared layout boundary.

The shared layout should provide:
- `ThemeScope`
- branded shell
- shared public/member header
- footer
- hub/site settings context inputs

It should not enforce member auth itself.

### 3.2 Auth enforcement must remain route-specific

The shared hub layout must not become an auth gate.

Instead:
- public routes remain open
- member routes continue enforcing auth in route-local layouts or route files beneath the shared shell

This is critical because:
- public pages must stay publicly accessible
- member routes must remain protected
- the shell should not become a mixed responsibility boundary

---

## 4) Target route-tree direction

### 4.1 Current high-level structure

Current relevant route groups:
- `(public)`
- `(member)`
- `(admin)`

Current hub shell duplication:
- `(public)/[hubSlug]/layout.jsx`
- `(member)/[hubSlug]/account/layout.jsx`

### 4.2 Target high-level structure

The target direction should be:

- `(hub)/[hubSlug]/layout.jsx`
  - shared shell for public + member-facing routes

Under that:
- public pages
- auth pages
- member account pages

Admin remains separate:
- `(admin)/[hubSlug]/admin/layout.jsx`

Platform remains separate:
- `(platform)/platform/layout.jsx`

### 4.3 Conceptual example

The exact route-group naming can vary, but the target shape should be conceptually similar to:

- `src/app/(hub)/[hubSlug]/layout.jsx`
- `src/app/(hub)/[hubSlug]/page.jsx`
- `src/app/(hub)/[hubSlug]/about/page.jsx`
- `src/app/(hub)/[hubSlug]/events/page.jsx`
- `src/app/(hub)/[hubSlug]/events/[eventSlug]/page.jsx`
- `src/app/(hub)/[hubSlug]/courses/page.jsx`
- `src/app/(hub)/[hubSlug]/courses/[courseSlug]/page.jsx`
- `src/app/(hub)/[hubSlug]/sign-in/page.jsx`
- `src/app/(hub)/[hubSlug]/join/page.jsx`
- `src/app/(hub)/[hubSlug]/account/layout.jsx`
- `src/app/(hub)/[hubSlug]/account/page.jsx`
- `src/app/(hub)/[hubSlug]/account/membership/page.jsx`
- `src/app/(hub)/[hubSlug]/account/registrations/page.jsx`
- `src/app/(hub)/[hubSlug]/account/payments/page.jsx`
- `src/app/(hub)/[hubSlug]/account/profile/page.jsx`

The important architectural point is:
- `account/layout.jsx` remains allowed
- but it must sit beneath the shared hub layout
- and it should not re-wrap the app in a second competing shell

It may still enforce auth or provide account-specific context if needed.

---

## 5) Shared hub layout responsibilities

The new shared hub layout should own only shell-level concerns.

### 5.1 It should load

- hub
- site settings
- public header model
- theme
- template

### 5.2 It should render

- `ThemeScope`
- `PublicShell`
- shared branded header
- footer

### 5.3 It should not own

- member auth enforcement
- account-only business data
- public route data
- route-specific CTA decisions
- admin concerns

This keeps the layout clean and stable.

---

## 6) Member route responsibilities after refactor

Member account routes should remain protected, but the protection should move lower in the tree.

### 6.1 Account layout / route boundary

The member account subtree may still have:
- `src/app/(hub)/[hubSlug]/account/layout.jsx`

That layout should be responsible for:
- requiring current member session for this hub
- optionally preparing member-only context if truly needed

It should not:
- mount another shell
- render a second header
- render a legacy member navigation system

### 6.2 Account pages

Account pages should continue loading their own page-specific data.

Examples:
- membership data
- registrations
- payment items
- profile form state

This should remain route-local and not be pushed into the shared shell.

---

## 7) Header/navigation behavior after refactor

### 7.1 Primary nav remains public-site-oriented

Members should still see the same primary site navigation on:
- public pages
- member account pages

This is a deliberate product decision to avoid the account feeling like a separate portal.

Primary nav should continue surfacing:
- home
- about
- events
- courses
- contact
- any other system-owned public routes

### 7.2 Member tasks remain utility-driven

Member-specific tasks should remain under the avatar utility menu.

The avatar menu should remain the main access point for:
- account
- membership
- registrations
- payments
- profile
- sign out

This keeps the top-level site IA focused and prevents the member area from taking over the entire shell.

### 7.3 Admin behavior on hub routes remains unchanged

Admins visiting public/member-facing hub routes should still:
- use the shared hub shell
- see admin-aware utility affordances
- retain access to `Admin` through the utility menu

Admin operational pages remain on the separate admin shell.

---

## 8) Data-loading responsibilities after refactor

### 8.1 Shared shell-level loading

The shared hub layout should centralize these loads:
- `requireHubBySlug(...)`
- `getSiteSettingsByHub(...)`
- `getPublicHeaderModel(...)`

This replaces the current duplication across:
- public layout
- member account layout

### 8.2 Route-level data loading remains local

Public/member page data should stay in the route/page layer where it already belongs.

Examples:
- events listing data
- event detail data
- courses listing data
- course detail data
- member registrations
- member membership
- member payments

This avoids overloading the shared layout.

### 8.3 Caching and correctness

During implementation, we must be careful that:
- member-aware header state remains correct per request
- hub/site settings do not drift between routes
- shared loads are not duplicated unnecessarily

The correct principle is:
- centralize shell data
- do not centralize everything

---

## 9) Auth and redirect rules

### 9.1 Shared layout must remain auth-neutral

The new shared hub layout must render for:
- anonymous visitors
- signed-in members
- signed-in admins

It must not assume:
- the user is a member
- the user is anonymous

It should rely on the header model to adapt utility behavior by current session state.

### 9.2 Member route protection remains explicit

Member-only routes must continue to use:
- `requireCurrentMemberSessionForHub(...)`

This should happen:
- in the nested account layout
- or in account route files where appropriate

### 9.3 Return-path behavior must not regress

The existing return-path/auth continuity work must remain intact:
- sign in preserves current public route
- join preserves current public route
- sign out preserves current public route

The refactor must not break those rules.

---

## 10) Risks

### 10.1 Route-tree regressions

Changing App Router layout boundaries can cause:
- route resolution mistakes
- accidental route moves
- wrong layouts applying to wrong routes

Mitigation:
- treat this as a route-architecture change
- perform the move in one coherent pass
- do not leave half the hub routes in the old tree

### 10.2 Auth leakage or over-blocking

The biggest functional risk is getting auth boundaries wrong.

Possible failure modes:
- account pages accidentally become public
- public pages accidentally require auth

Mitigation:
- keep auth enforcement below the shared shell
- explicitly audit every account route after the move

### 10.3 Header behavior regressions

Possible failure modes:
- wrong utility menu state on member routes
- wrong admin/member differentiation
- stale header model assumptions

Mitigation:
- ensure the shared layout always loads the same header model path
- verify anonymous/member/admin behavior on both public and account routes

### 10.4 Visual regressions

Possible failure modes:
- changed spacing around shell content
- sticky header behavior drift
- mobile drawer layering issues
- footer mount order changes

Mitigation:
- preserve `PublicShell` as the shell boundary
- avoid altering visual structure unnecessarily during the route-tree move

### 10.5 Legacy code drift

If we move the account routes to the shared shell but keep legacy member-shell files around indefinitely, the codebase will become misleading.

Mitigation:
- define cleanup explicitly
- remove `MemberShell` and `MemberShellNav` once the refactor is complete and verified

---

## 11) Implementation phases

### Phase 1: Route-tree preparation

- define the target shared hub route boundary
- identify all current public/member hub routes
- identify all route imports that will need updating after moves

Output:
- final route move map

### Phase 2: Shared hub layout creation

- create new shared hub layout
- centralize:
  - hub loading
  - site settings loading
  - header model loading
  - `ThemeScope`
  - `PublicShell`

Output:
- one canonical shared hub shell

### Phase 3: Public route migration

- move or rebind public routes beneath the shared hub layout
- confirm public route behavior remains unchanged

Output:
- public routes running under shared shell

### Phase 4: Member route migration

- move or rebind account routes beneath the shared hub layout
- keep member auth enforcement in nested account boundary
- remove shell duplication

Output:
- member routes running under shared shell with auth still protected

### Phase 5: Legacy cleanup

- remove `MemberShell`
- remove `MemberShellNav`
- remove old member-shell CSS and references
- ensure no dead imports remain

Output:
- one shell system instead of two parallel ones

### Phase 6: QA pass

Verify:
- anonymous public routes
- member public routes
- member account routes
- admin on public routes
- sign in/join continuity
- sign out continuity
- mobile drawer persistence/behavior
- header non-remount behavior between public and member routes

---

## 12) QA checklist

### 12.1 Anonymous

- `/{hubSlug}`
- `/{hubSlug}/events`
- `/{hubSlug}/courses`
- `/{hubSlug}/sign-in`
- `/{hubSlug}/join`

Confirm:
- shared shell renders
- public nav is correct
- header state is anonymous

### 12.2 Member

- `/{hubSlug}/events`
- `/{hubSlug}/courses`
- `/{hubSlug}/account`
- `/{hubSlug}/account/membership`
- `/{hubSlug}/account/registrations`
- `/{hubSlug}/account/payments`
- `/{hubSlug}/account/profile`

Confirm:
- header stays visually/behaviorally continuous
- avatar utility menu remains correct
- no legacy member-nav shell remains
- account routes remain protected

### 12.3 Admin on public/member-facing routes

- `/{hubSlug}`
- `/{hubSlug}/events`
- `/{hubSlug}/courses`

Confirm:
- shared shell renders
- utility menu remains admin-aware
- `Admin` path remains reachable

### 12.4 Continuity

Confirm:
- navigating between public and member routes does not remount the shell/header
- mobile drawer behaves consistently after route transitions
- sign in preserves `next`
- sign out preserves current public/member path where appropriate

---

## 13) Non-goals for this refactor

This refactor should not attempt to:
- merge admin routes into the same shell
- redesign the public header again
- redesign member account page content
- change the site-settings admin model
- change package gating rules
- redesign account utility IA beyond what is already agreed

Those are separate concerns.

---

## 14) Implementation recommendation

This refactor should be treated as:
- one bounded architecture stream
- not a series of opportunistic incremental tweaks

The correct implementation standard is:
- one shared hub layout
- one shared shell
- lower auth boundary for member routes
- deliberate cleanup of the old member-shell system

That is the production-grade direction and the correct foundation for a hub experience that genuinely feels like one site.
