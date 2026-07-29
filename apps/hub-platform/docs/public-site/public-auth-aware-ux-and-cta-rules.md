# Public Auth-Aware UX And CTA Rules

Status:
- Proposed
- Interaction and navigation planning document for auth-aware public-site behavior

Purpose:
- Define how the public site should adapt for anonymous visitors, signed-in members, and signed-in admins
- Define CTA rules for event/course discovery and detail pages
- Prevent auth-aware behavior from being reimplemented differently on each route or section

---

## 1) Why this document exists

The public site is not a disconnected marketing layer.

It is also:
- the member sign-in entry point
- the join/onboarding entry point
- the event/course discovery surface
- the account entry point
- the admin entry point for authenticated admins

Because of that, public UX must adapt cleanly when the visitor is:
- anonymous
- a signed-in member
- a signed-in admin

This needs shared rules.

Without shared rules, the app will drift into:
- inconsistent CTA wording
- duplicated sign-in logic
- navigation mismatches
- event/course flows that behave differently across pages

---

## 2) Viewer states

The public-site system should normalize viewer state into one shared model.

### 2.1 Anonymous visitor

Characteristics:
- no active hub session
- can browse public content
- may need prompting to sign in or join before taking gated actions

### 2.2 Signed-in member

Characteristics:
- authenticated for the current hub
- can access account/member routes
- may be eligible to register/book directly
- should see member-specific next actions where relevant

### 2.3 Signed-in admin

Characteristics:
- authenticated admin for the current hub
- can access admin routes
- may still browse the public site
- should not be routed into member-only dead ends

### 2.4 Error and edge states

The system should also account for:
- signed-in user with mismatched hub context
- partially onboarded user
- stale session or invalid next-destination
- unavailable event/course booking path due to state restrictions

These states should be handled through shared session and redirect rules, not improvised by public components.

---

## 3) Navigation behavior

Public navigation should adapt by viewer state.

### 3.1 Anonymous navigation

Expected utility actions:
- sign in
- join, where allowed

Expected primary nav:
- normal public information architecture

### 3.2 Member navigation

Expected utility actions:
- account
- sign out

Expected primary nav:
- same public navigation plus any approved member-relevant shortcuts

Members should not be pushed toward redundant join/sign-in actions once authenticated.

### 3.3 Admin navigation

Expected utility actions:
- admin
- sign out

Admins may also retain the normal public navigation because they are still on the public site surface.

The key rule is:
- do not strand admins in member-only flows
- do not hide the admin entry point when an admin is already signed in

---

## 4) CTA categories

The public-site system should support a shared CTA resolution model.

CTA categories include:
- authentication CTAs
- registration/booking CTAs
- account-management CTAs
- admin-entry CTAs
- informational fallback CTAs

Components should not hardcode these decisions independently.

Instead they should receive normalized CTA state such as:
- label
- destination
- interaction mode
- disabled reason
- helper text

---

## 5) Event and course list rules

Dynamic list sections such as event lists and course lists must support viewer-state-aware cards.

### 5.1 Anonymous viewer on list cards

Possible CTA outcomes:
- `View details`
- `Sign in to register`
- `Join to register`
- `Registration closed`
- `Sold out`

The card should not pretend the user can complete a booking immediately if sign-in is required first.

### 5.2 Signed-in member on list cards

Possible CTA outcomes:
- `Register now`
- `Continue booking`
- `View registration`
- `Registration closed`
- `Sold out`
- `Members only`

The card should reflect the member's actual state where known.

### 5.3 Signed-in admin on list cards

Possible CTA outcomes:
- `View details`
- `Open admin`
- `Manage event`
- `Manage course`

Admins should not be nudged into member booking flow if the more appropriate action is operational.

---

## 6) Event and course detail rules

Detail pages need a stronger auth-aware CTA system than list cards.

### 6.1 Anonymous viewer on detail pages

Possible primary CTA states:
- `Sign in to register`
- `Join to register`
- `Registration closed`
- `Sold out`

Supporting text may explain:
- registration requirements
- membership requirements
- date/status restrictions

### 6.2 Signed-in member on detail pages

Possible primary CTA states:
- `Register now`
- `View registration`
- `Manage registration`
- `Continue booking`
- `Registration closed`
- `Sold out`
- `Unavailable for your account`

The system should support member-aware explanatory text where helpful.

### 6.3 Signed-in admin on detail pages

Possible primary CTA states:
- `Manage event`
- `Manage course`
- `Open registrations`
- `Open attendance`

Admins may still need to see public-page content, but their action system should respect their role.

---

## 7) Join and sign-in behavior

Join and sign-in flows are part of the public-site experience and must obey public-site state rules.

### 7.1 Anonymous user

Expected behavior:
- may access join/sign-in normally
- may be redirected back to a safe public destination or booking flow after completion

### 7.2 Signed-in member

Expected behavior:
- should not be shown redundant join/sign-in screens
- should resolve to account or the requested safe destination

### 7.3 Signed-in admin

Expected behavior:
- should not be routed into member account pages by default
- should resolve to admin or another safe public destination

This is especially important for invite, next-destination, and booking-related redirects.

---

## 8) Navigation item visibility rules

The platform should define a visibility matrix for public navigation items.

Examples:
- `Account` is visible only to signed-in members
- `Admin` is visible only to signed-in admins
- `Join` and `Sign in` are hidden once authenticated
- package-gated pages should disappear completely when disabled

This should be resolved through a shared nav-state adapter, not duplicated in every shell component.

---

## 9) Shared CTA resolver requirement

The implementation should introduce one shared resolver or adapter system for public CTAs.

That resolver should consider:
- viewer auth state
- viewer role
- hub context
- entity state
- capacity/availability
- registration state
- package and feature gates where relevant

The goal is to avoid:
- one event card saying `Book now`
- another saying `Register`
- detail pages using different role rules
- admins being directed into member destinations

The public product needs one coherent CTA language.

---

## 10) Empty, disabled, and fallback messaging

Dynamic public sections should have consistent fallback states.

Examples:
- no upcoming events
- no open courses
- registration unavailable
- page disabled by package or config

These states should:
- explain the situation clearly
- provide the next sensible action if one exists
- avoid product-internal or developer-facing language

---

## 11) Accessibility and clarity requirements

Auth-aware behavior must remain accessible and clear.

Requirements:
- CTA labels must be explicit
- disabled or unavailable states must not rely on color alone
- focus order must remain stable as viewer state changes
- public nav must not hide the user's current access path unexpectedly
- helper copy must explain why an action is unavailable where necessary

---

## 12) Implementation sequence

### Step 1

Define:
- normalized viewer-state model
- navigation visibility matrix
- CTA categories and resolver contract

### Step 2

Define:
- event and course list/detail CTA matrices
- redirect safety rules for sign-in/join/account/admin transitions

### Step 3

Implement:
- shared auth-aware nav adapter
- shared CTA resolver
- shared entity presentation contracts

### Step 4

Wire:
- public shell
- list sections
- detail sections
- join/sign-in/account entry points

### Step 5

Verify:
- anonymous flow
- member flow
- admin flow
- bad-next-destination handling
- mixed-role edge cases

---

## 13) Acceptance criteria

This area is ready when:
- public navigation adapts correctly for anonymous, member, and admin states
- event and course CTAs are consistent across list and detail pages
- join/sign-in redirects never create role-mismatched loops
- admins are never incorrectly funneled into member-only destinations
- members are never incorrectly prompted to join again
- auth-aware public behavior feels like one product system rather than a patchwork of exceptions
