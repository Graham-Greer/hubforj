# Public Header And Navigation Plan

Status:
- Proposed
- Detailed implementation-planning document

Purpose:
- Define the production-grade header and navigation system for hub-scoped public routes
- Lock auth-aware behavior for anonymous visitors, signed-in members, and signed-in admins viewing public routes
- Define the relationship between system-owned navigation/auth behavior, site-settings-managed brand inputs, and template-driven presentation
- Prevent the public header, sign-in continuity, and account-entry behavior from drifting into route-by-route ad hoc logic

Related:
- [Public Site Architecture And Delivery Plan](/mnt/c/local/community-app/apps/hub-platform/docs/public-site/public-site-architecture-and-delivery-plan.md)
- [Public Auth-Aware UX And CTA Rules](/mnt/c/local/community-app/apps/hub-platform/docs/public-site/public-auth-aware-ux-and-cta-rules.md)
- [SaaS Site Settings Code Schema Plan](/mnt/c/local/community-app/apps/hub-platform/docs/public-site/saas-site-settings-code-schema-plan-2026-03-15.md)
- [SaaS Site Settings Schema And Ownership Model](/mnt/c/local/community-app/apps/hub-platform/docs/public-site/saas-site-settings-schema-and-ownership-model-2026-03-15.md)
- [SaaS Domain And Route Model](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/saas-domain-and-route-model-2026-03-15.md)
- [Greenfield Shell Navigation Spec V2](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/greenfield-shell-navigation-spec-v2.md)

---

## 1) Product decision

The public header and navigation system is a first-class product surface.

It must:
- present a clear branded entry point for hub public routes
- remain stable as visitors move between homepage, listings, details, sign-in, join, and account entry
- adapt utility actions based on session state without destroying public-route continuity
- preserve a visitor's current task when they authenticate
- remain template-aware in presentation while staying shared in information architecture and behavior

It must not:
- be hand-authored per hub as arbitrary navigation chrome
- fork into unrelated anonymous, member, and admin public headers
- redirect members into account prematurely when they were acting from a public route
- hardcode logo, nav, or auth-utility rules directly inside page routes

The header/navigation system must therefore be implemented as:
- one canonical public-header contract
- one canonical public utility-navigation contract
- one shared auth-aware return-path model
- one system-derived route-availability model
- one template-aware presentation boundary

---

## 2) Boundary with the SaaS product site

The SaaS product marketing site is not part of the hub public-site system.

This must be explicit.

### 2.1 Product-site decision

The SaaS product site should:
- sit separately from hub public/member/admin surfaces
- sit in a separate codebase from `apps/hub-platform`
- own customer acquisition, pricing, demos, and first-customer onboarding

The hub public-site system should:
- serve the actual client/community public site
- serve member sign-in and join for that hub
- serve the hub-scoped member account continuity
- coexist with hub admin on the same hub host model

### 2.2 Why this separation is required

The product site and a hub site have different:
- audiences
- goals
- route structures
- information architecture
- conversion logic

The product site is for:
- explaining the platform
- acquiring customers
- onboarding the first customer admin

The hub site is for:
- presenting a community or organisation
- exposing public content and operations
- handling member and admin transitions for that hub

Merging those concerns into one site surface would create:
- confusing ownership boundaries
- muddled auth and onboarding flows
- poor public-site information architecture
- avoidable complexity in site settings

### 2.3 First admin account implication

The first customer admin account should be created through the separate SaaS product-site onboarding flow.

That onboarding flow should:
- create the hub/tenant
- create the first admin account
- provision the initial hub host/context
- bootstrap initial site settings

This flow should not be modeled as:
- joining a hub as a member
- accepting an admin invite inside an already-existing client site

Invite-based admin onboarding remains valid for:
- subsequent admins invited into an existing hub

But first-customer acquisition and bootstrap belongs to the product site, not this repo's hub public/member surface.

---

## 3) Core header/navigation principle

The public header must remain public-route-oriented even when the viewer is authenticated.

This is the key principle that prevents shell confusion.

That means:
- the main navigation remains about the public site
- auth state changes utility actions, not the fundamental route identity

So:
- a signed-in member viewing `/events` is still on the public site
- a signed-in admin viewing `/courses/{courseSlug}` is still on the public site

The header should not abruptly turn into:
- a member dashboard header
- an admin workspace header

Instead:
- public navigation stays anchored to public route families
- the utility area becomes auth-aware

---

## 4) Goals for the public header

The header must achieve all of the following:

### 4.1 Branding clarity

- show the hub brand clearly
- use site-settings-managed identity inputs
- preserve trust and continuity across public pages

### 4.2 Navigation clarity

- expose the main public route families cleanly
- keep route choices shallow and understandable
- avoid overloading the header with workflow actions

### 4.3 Auth-awareness

- adapt the utility area by viewer state
- make sign-in/join/account/admin entry obvious
- preserve the current public task after auth

### 4.4 Template flexibility

- support meaningful presentation variation by template family
- keep information architecture and logic centralized
- prevent template-specific forks in route behavior

### 4.5 Responsive quality

- remain clear and discoverable on mobile
- avoid stacked clutter and duplicate nav affordances
- preserve auth utility clarity in collapsed/drawer patterns

---

## 5) Header ownership model

Ownership should be separated cleanly.

### 5.1 System-owned

The platform/system should own:
- which core route families exist
- which public pages are enabled
- whether events/courses/other route families are package-enabled
- which auth utility actions are valid for the current session state
- how post-auth return paths behave
- when account/admin entry is shown

### 5.2 Site-settings-owned

Site settings should own bounded brand inputs such as:
- site name
- logo asset
- logo alt text

Important clarification:
- when this document refers to `site settings`, it means the canonical settings area at `/{hubSlug}/admin/settings/site`
- it does not mean page settings such as `/{hubSlug}/admin/settings/pages/home`
- it does not mean page settings such as `/{hubSlug}/admin/settings/pages/events`
- it does not mean branding settings such as `/{hubSlug}/admin/settings/branding`

Branding settings should not own:
- hub name
- site name
- contact email
- tagline

Those fields should live under the canonical site-settings area to avoid overlapping ownership and admin confusion.

Site settings should not own:
- primary public navigation structure
- role-aware utility menus
- avatar identity behavior
- return-path logic
- auth-driven menu contents

If the product later introduces carefully bounded visibility or member-experience flags, those must remain:
- subordinate to system-owned route authority
- subordinate to system-owned auth behavior
- non-authoritative over the actual header navigation structure

### 5.3 Template-owned

Template families should own:
- header layout personality
- spacing and emphasis
- nav alignment
- utility treatment
- mobile nav presentation

### 5.4 Routes should not own

Public route files should not own:
- custom header composition decisions
- auth utility branching
- logo fallback rules
- route-specific header variants except where explicitly approved by architecture

---

## 6) Header data contract

The public header should consume one normalized contract, not scattered props from routes.

The exact shape can evolve, but conceptually it should look like:

```js
{
  brand: {
    siteName: "",
    logoAsset: null,
    logoAlt: "",
    homeHref: "/{hubSlug}",
  },
  navigation: {
    items: [],
    mobileBehavior: "drawer",
  },
  utility: {
    viewerState: "anonymous" | "member" | "admin",
    signInHref: "",
    joinHref: "",
    accountHref: "",
    adminHref: "",
    signOutEnabled: true,
    avatar: {
      imageUrl: "",
      initials: "",
      fallbackLabel: "",
    },
    menuItems: [],
  },
  template: {
    key: "",
    variant: "",
  },
}
```

This contract should be derived centrally from:
- hub
- site settings
- capability model
- session state
- template family

Within that contract:
- brand inputs may come from site settings
- primary navigation must come from system-owned route and capability logic
- utility behavior must come from system-owned session and role logic

Not assembled piecemeal inside `layout.jsx` or route pages.

---

## 7) Brand inputs

### 7.1 Logo source of truth

The header logo must come from site settings.

For the avoidance of doubt:
- `logoAsset`
- `logoAlt`
- `siteName`

should be treated as canonical site-settings-owned brand inputs, not split across overlapping admin settings surfaces.

The current settings split should be cleaned up so the ownership model matches this rule.

The brand block should resolve in this order:

1. logo asset + alt if available
2. site name text when no logo exists
3. bounded default fallback only if settings are incomplete

### 7.2 Brand behavior

The brand block should:
- always link to the hub homepage
- remain stable across anonymous/member/admin public browsing
- not change just because auth state changed

---

## 8) Primary navigation model

### 8.1 Navigation should remain system-derived

Admins should not manually author header links in v1.

Header navigation should continue to be derived from:
- approved route families
- package/capability availability
- enabled page families

This keeps navigation:
- consistent
- safe
- route-authority-aligned

This means:
- site settings do not choose the primary nav items
- site settings do not author the member/admin menu contents
- site settings do not drive avatar identity behavior

### 8.2 Public primary navigation candidates

The header should expose approved public route families such as:
- Home
- About
- Events
- Courses
- Announcements
- Contact

Legal links such as:
- Privacy
- Terms

should typically remain in the footer rather than the primary header.

### 8.3 Navigation item rules

Each header item should correspond to:
- a real route family
- an enabled page
- a route the current hub is allowed to expose

Items should not point to:
- arbitrary tenant-authored URLs
- unsupported route inventions
- hidden operational/member/account pages

### 8.4 Public nav and auth state

Primary public navigation should not materially change by auth state.

That means:
- anonymous users see the same core site routes
- signed-in members see the same core site routes
- signed-in admins on public routes see the same core site routes

This preserves public-site continuity.

---

## 9) Utility navigation by viewer state

The utility area is where auth-aware variation belongs.

That variation is system-driven, not site-settings-driven.

It should be derived from:
- current session state
- current viewer role
- route authority
- approved public/member/admin behavior rules

### 9.1 Anonymous visitor

Anonymous visitors should typically see:
- `Sign in`
- `Join` when membership/join is relevant and enabled

They should not see:
- `Account`
- `Admin`
- sign out
- a fake avatar placeholder

### 9.2 Signed-in member on public routes

Signed-in members should see:
- avatar trigger
- account-oriented utility menu

Recommended menu items:
- `Account`
- `Membership`
- `Registrations`
- `Sign out`

`Registrations` should be treated as the consolidated self-service entry for:
- event registrations
- course enrolments

The utility menu should not split event and course participation into separate top-level shortcuts because that bloats the menu unnecessarily.

They should not keep seeing:
- generic `Sign in`
- generic `Join`

### 9.3 Signed-in admin on public routes

Signed-in admins should see:
- avatar trigger
- admin-aware utility menu

Recommended menu items:
- `Admin`
- `Sign out`

Optional:
- `Account` only if the product explicitly supports admins also acting as members for that same hub

The default should not assume:
- every admin also has a meaningful member dashboard path

### 9.4 Multi-role caution

If a user can be both:
- admin
- and member

the utility model must not become ambiguous.

The header should still present:
- one clear primary utility identity for the current session role

If multi-role support expands later, it should do so deliberately rather than through opportunistic mixed menu states.

---

## 10) Auth continuity and return-path rules

This is one of the most important pieces of the system.

### 10.1 Core rule

Authentication should preserve the visitor's current public task whenever possible.

That means:
- if a visitor signs in from an event detail page, they should return there
- if a visitor signs in from a course detail page, they should return there
- if a visitor signs in from a members-only page request, they should return to the originally requested route when permitted

### 10.2 What should not happen

The system should not default members to `/account` immediately after sign-in when they initiated sign-in from:
- an event detail page
- a course detail page
- another public route with an obvious next action

That behavior interrupts the user's task and weakens conversion.

### 10.3 Default fallback

When there is no meaningful originating public route, the default member post-auth fallback may be:
- `/{hubSlug}/account`

But that is only the fallback, not the primary rule.

### 10.4 Redirect model

The auth system should standardize around:
- one `next` path contract
- one sanitizer/validator for allowed return paths
- one role-aware redirect resolver

That resolver should:
- preserve the current route when appropriate
- prevent invalid or unsafe redirects
- route admins to admin when they intentionally sign in for admin work

### 10.5 Join flow continuity

The same continuity rule should apply to member join where appropriate.

If a visitor joins from:
- a booking/enrolment intent
- a members-only route prompt

the system should preserve the original destination after successful account creation.

---

## 11) Avatar and signed-in identity model

### 11.1 Avatar requirement

When members or admins are authenticated on public routes, the header should present a signed-in identity affordance.

That should be an avatar trigger rather than plain utility text links.

### 11.2 V1 approach

V1 should support:
- initials-based avatar fallback
- optional display name
- optional future image support

This is the correct first implementation because it:
- gives a polished signed-in identity cue
- does not block on profile-image upload infrastructure
- works for both members and admins

### 11.3 Future extension

Later, the avatar model may support:
- uploaded profile image
- media-backed avatar references

But the header/navigation system should not wait on that.

### 11.4 Registration implication

Member/admin registration flows should ensure the system can derive:
- display name
- initials

So the signed-in header never lacks a usable identity fallback.

---

## 12) Template-driven design model

The public header must be template-driven in presentation.

### 12.1 What template may vary

Template families may vary:
- header density
- logo position
- nav alignment
- utility-button treatment
- drawer style on mobile
- sticky vs non-sticky behavior if approved

### 12.2 What template may not vary

Template families must not fork:
- route availability logic
- auth return-path rules
- utility behavior contracts
- public/member/admin state semantics

So the correct model is:
- shared behavioral contract
- template-specific rendering expression

### 12.3 Implementation implication

The code should likely expose:
- one normalized header contract
- one public header wrapper
- template-specific presentation components or variants beneath that boundary

Not:
- separate template-owned route logic branches

---

## 13) Mobile navigation rules

The mobile public header needs explicit planning, not desktop-first fallback.

### 13.1 Mobile goals

It should:
- keep brand clear
- keep utility actions accessible
- keep route discovery straightforward
- avoid stacking too many controls in the top bar

### 13.2 Recommended v1 pattern

Recommended v1:
- brand on the left
- on the right:
  - avatar trigger when signed in, or `Sign in` when signed out
  - burger menu trigger to the right of that
- the primary menu slides in from the right
- the mobile menu opens beneath the header, not on top of it

### 13.3 Mobile utility behavior

The mobile menu should preserve auth-aware utility clarity.

Examples:
- anonymous: sign in + join visible clearly
- member: account shortcuts + sign out
- admin: admin shortcut + sign out

The mobile menu should:
- open from the right
- sit under the header rather than covering it
- leave the header visible at all times
- allow the burger trigger to animate into a clean `X`

The burger/X control should be custom-built and feel modern, clean, and intentional.

The mobile menu should not become:
- a dumping ground for every possible action
- a full-screen overlay that hides the header entirely

### 13.4 Responsive consistency

The mobile and desktop header should represent the same information architecture, not two unrelated systems.

### 13.5 Component-responsibility implication

This mobile behavior is compatible with the currently documented component responsibilities.

It does not require changing the ownership model.

It simply means:
- `PublicHeader` continues to own composition of brand, utility trigger, and menu trigger
- `PublicNav` continues to own route-family navigation rendering
- `PublicUtilityMenu` continues to own auth-aware menu actions
- `PublicMobileNav` should render as a right-side panel beneath the persistent header rather than as a full-screen takeover

So this is a presentation and interaction refinement within the existing architectural boundaries, not a contradiction of them.

---

## 14) Site settings implications

The current site-settings implementation is too narrow for the target header/navigation system.

### 14.1 Already implemented

Current code supports:
- branding identity basics
- homepage settings
- events page hero settings
- courses page hero settings

### 14.2 Still needed

To support the target header/navigation system, the normalized site-settings model should grow to cover:
- any missing bounded brand inputs required by the header
- only carefully bounded member-experience flags if we confirm they are actually necessary

This does not mean site settings should grow to own:
- primary navigation structure
- role-aware utility menus
- avatar behavior
- return-path behavior
- auth utility logic

### 14.3 Navigation settings principle

This should not reintroduce tenant-authored arbitrary navigation.

Instead:
- primary navigation should stay system-derived
- utility behavior should stay system-derived
- header presentation should stay template-driven
- site settings should remain limited to brand inputs and any narrowly-approved bounded flags

### 14.4 Member-experience settings principle

`memberExperience` should stay behavior-oriented, not message-authoring-heavy.

Even here, the boundary must remain strict.

`memberExperience` should not own:
- primary navigation structure
- member/admin utility menus
- avatar identity behavior
- auth redirect rules

At most, it may support tightly bounded experience-level flags if the product later proves they are necessary.

---

## 15) Public and member shell relationship

The public shell and member shell should feel related, but not identical.

### 15.1 Public shell

Public shell should emphasize:
- brand
- public navigation
- public discovery
- auth-aware utility entry

### 15.2 Member shell

Member shell should emphasize:
- account tasks
- self-service workflows
- member workspace navigation

### 15.3 Relationship rule

They should feel like:
- part of the same hub experience

But they should not blur into:
- one shell pretending to serve both purposes equally well

So:
- public routes keep the public header
- member account routes keep the member shell
- continuity happens through auth utility and return-path behavior, not shell collapse

This needs a more concrete interpretation:

- the public header remains the public-site identity and navigation system
- the member shell remains the account/workspace navigation system
- signing in from a public page does not mean the user has changed surfaces yet
- the user only changes surfaces when they intentionally enter account

Examples:
- if a member signs in from an event detail page, they should remain on that event detail page
- if a member signs in from a course detail page, they should remain on that course detail page
- if a member later chooses `Account` from the utility menu, that is the point where they intentionally move into the member shell

So the continuity rule is not:
- "merge public and member into one shell"

It is:
- "keep them distinct, but make the transition between them feel intentional and frictionless"

This is the correct production model because:
- public browsing remains public browsing
- account management remains account management
- auth does not prematurely force a context change
- the user stays oriented about where they are

---

## 16) Public header component architecture

The implementation should stay layered and reusable.

### 16.1 Likely component boundaries

The exact names can evolve, but the architecture should likely include:
- `PublicHeader`
- `PublicNav`
- `PublicUtilityMenu`
- `PublicAvatar`
- `PublicMobileNav`

Potential domain/data helpers:
- `resolvePublicHeaderModel(...)`
- `resolvePublicUtilityModel(...)`
- `resolvePublicViewerState(...)`

### 16.2 Component responsibilities

`PublicHeader` should:
- compose brand, primary nav, and utility area
- accept normalized model data
- remain template-aware

`PublicNav` should:
- render primary route-family navigation
- support desktop/mobile presentations

`PublicUtilityMenu` should:
- render auth-aware utility actions
- switch behavior by viewer state

`PublicAvatar` should:
- render initials fallback
- support future image-based avatar input

### 16.3 What components should not do

These components should not:
- own database queries
- own redirect decisions
- infer unsafe return paths
- hardcode route availability in many places

---

## 17) Role/state matrix

The header should respect a clear viewer-state model.

### 17.1 Anonymous visitor

- public primary nav visible
- `Sign in`
- `Join` where applicable
- no avatar
- no account/admin shortcuts

### 17.2 Signed-in member

- same public primary nav
- avatar trigger
- member utility menu
- preserved return path after auth

### 17.3 Signed-in admin on public routes

- same public primary nav
- avatar trigger
- admin utility menu
- public browsing preserved; admin route entry remains explicit

### 17.4 Signed-in admin on admin routes

This is outside the public header scope.

Admin shell rules remain governed separately.

---

## 18) Non-goals

This header/navigation work should not attempt to solve:
- the separate SaaS product marketing site
- customer acquisition funnel design
- first-admin onboarding implementation inside this repo
- generic CMS navigation editing
- full avatar-media management in v1
- redesign of the admin shell

Those may connect conceptually, but they are not the same implementation stream.

---

## 19) Implementation phases

### 19.1 Phase 1: Planning and model authority

Lock:
- viewer-state rules
- utility menu rules
- return-path rules
- site-settings implications
- template boundary

### 19.2 Phase 2: Domain/model layer

Implement:
- normalized public viewer state resolver
- normalized header model resolver
- safe return-path handling utilities
- site-settings schema additions for bounded navigation/member-experience concerns

### 19.3 Phase 3: Public shell implementation

Implement:
- shared public header components
- avatar fallback behavior
- auth-aware utility menu
- mobile navigation
- template-aware presentation variants

### 19.4 Phase 4: Auth continuity integration

Update:
- sign-in flow
- join flow
- route CTA entry points
- member/admin post-auth redirects

### 19.5 Phase 5: Member/public continuity QA

Verify:
- event/course CTA flows
- members-only route continuity
- account entry
- admin public-route behavior
- mobile header behavior

---

## 20) Acceptance criteria

This work should only be considered complete when:

- the header logo is sourced from site settings
- public primary navigation is system-derived and template-aware
- the same public nav remains available for anonymous, member, and admin viewers on public routes
- utility actions adapt correctly by viewer state
- member/admin avatar identity and role menus are system-driven
- signed-in members are not unnecessarily dumped into `/account`
- sign-in/join preserve valid return paths from public-route actions
- signed-in viewers see a proper identity affordance via avatar/initials
- the implementation does not reintroduce arbitrary admin-managed navigation authoring
- the product-site/customer-acquisition boundary remains explicitly outside this repo

---

## 21) Recommended next planning/implementation sequence

The next work after this document should be:

1. public header model and viewer-state planning refinement if needed
2. site-settings `navigation` and `memberExperience` schema/code-plan expansion
3. public header component implementation
4. auth return-path implementation pass
5. member/public continuity QA and polish

This sequence keeps architecture ahead of UI implementation and avoids hardcoding header behavior into the current public routes.
