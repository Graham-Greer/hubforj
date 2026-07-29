# SaaS Domain, Onboarding, And Tier Audit

Date: 2026-03-29  
App: `apps/hub-platform`  
Scope:
- SaaS direction and route-model docs versus current implementation
- Admin and member onboarding/provisioning flows
- Tier, capability, and package enforcement readiness

Related:
- [SaaS Direction And Next Steps](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/saas-direction-and-next-steps-2026-03-15.md)
- [SaaS Domain And Route Model](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/saas-domain-and-route-model-2026-03-15.md)
- [Hub Site Config Schema And Package Gating](/mnt/c/local/community-app/apps/hub-platform/docs/public-site/hub-site-config-schema-and-package-gating.md)
- [SaaS Site Settings Schema And Ownership Model](/mnt/c/local/community-app/apps/hub-platform/docs/public-site/saas-site-settings-schema-and-ownership-model-2026-03-15.md)
- [SaaS Site Settings Code Schema Plan](/mnt/c/local/community-app/apps/hub-platform/docs/public-site/saas-site-settings-code-schema-plan-2026-03-15.md)
- [Member Account Dashboard And Profile Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/member-account-dashboard-and-profile-plan.md)

## Executive Summary

The product is now in a strong enough state that the next bottleneck is no longer UI structure or shell architecture. The bottleneck is product authority.

The current implementation already supports:
- hub provisioning
- public, member, and admin route families
- member join/sign-in
- admin invite acceptance
- memberships, events, courses, registrations, and payments visibility
- bounded public-site settings

However, the current SaaS implementation is still only **partially aligned** with the SaaS planning docs.

The main gap is not route scaffolding. The main gap is that the codebase does **not yet have a locked commercial and capability model**.

Specifically:
- package tier is not an authoritative provisioning input
- tier-based limits are not defined or enforced
- tier-based capabilities are only partially represented in code
- onboarding does not yet bind a hub to a commercial package model
- host/domain resolution from the SaaS route docs is not implemented

This means the app is functionally ahead of the SaaS product model.  
That is workable in the short term, but it is now the main source of architectural risk.

## 1) Audit Against The SaaS Direction Docs

### 1.1 Confirmed direction: one shared multi-tenant app

Status: **implemented**

Evidence:
- public hub routes live under [`src/app/(hub)/[hubSlug]`](/mnt/c/local/community-app/apps/hub-platform/src/app/(hub)/[hubSlug])
- hub admin routes live under [`src/app/(admin)/[hubSlug]/admin`](/mnt/c/local/community-app/apps/hub-platform/src/app/(admin)/[hubSlug]/admin)
- platform/superadmin routes live under [`src/app/(platform)`](/mnt/c/local/community-app/apps/hub-platform/src/app/(platform))

Assessment:
- the product is clearly one shared application
- public, member, and admin all exist inside `apps/hub-platform`
- the client-site split is no longer driving implementation

This is aligned with:
- [SaaS Direction And Next Steps](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/saas-direction-and-next-steps-2026-03-15.md)

### 1.2 Confirmed direction: one coherent hub experience

Status: **implemented at route-family level**

Evidence:
- public shell is hub-scoped in [`src/app/(hub)/[hubSlug]/layout.jsx`](/mnt/c/local/community-app/apps/hub-platform/src/app/(hub)/[hubSlug]/layout.jsx)
- member account is hub-scoped under [`/account`](/mnt/c/local/community-app/apps/hub-platform/src/app/(hub)/[hubSlug]/account)
- admin is hub-scoped under [`/admin`](/mnt/c/local/community-app/apps/hub-platform/src/app/(admin)/[hubSlug]/admin)

Assessment:
- the product already behaves like one hub-owned experience
- member continuity from public site is materially implemented
- admin is still a distinct operational surface, which matches the intended model

### 1.3 Confirmed direction: host/domain-based hub resolution

Status: **not implemented**

Evidence:
- no host-resolution layer was found in `src`
- no custom-domain-to-hub runtime resolution was found
- no canonical-domain redirect policy was found
- hub resolution is still slug-based through [`requireHubBySlug`](/mnt/c/local/community-app/apps/hub-platform/src/lib/data/hubs.js)

Current reality:
- the runtime model is still path-based around `/{hubSlug}`
- the docs describe a future host-based model such as `bobsyoga.ourplatform.com` and `bobsyoga.com`

Assessment:
- this is one of the largest remaining gaps between SaaS planning and the codebase
- the route docs are future-state in this area, not current-state

## 2) Audit Against The SaaS Route Model Doc

### 2.1 Public routes

Status: **partially aligned**

Implemented examples:
- `/{hubSlug}`
- `/{hubSlug}/about`
- `/{hubSlug}/events`
- `/{hubSlug}/events/{eventSlug}`
- `/{hubSlug}/courses`
- `/{hubSlug}/courses/{courseSlug}`
- `/{hubSlug}/contact`
- `/{hubSlug}/join`
- `/{hubSlug}/sign-in`

Drift:
- `testimonials` route exists but is still placeholder-like in [`testimonials/page.jsx`](/mnt/c/local/community-app/apps/hub-platform/src/app/(hub)/[hubSlug]/testimonials/page.jsx)
- `announcements` routes from the SaaS route doc are not implemented
- legal/privacy/terms routes are not part of the current delivered public route set

Assessment:
- public routes are strong enough for current product use
- they are not yet aligned to the full SaaS route inventory described in the planning docs

### 2.2 Member routes

Status: **implemented, but planning docs are stale**

Current code:
- [`/account`](/mnt/c/local/community-app/apps/hub-platform/src/app/(hub)/[hubSlug]/account/page.jsx)
- [`/account/bookings`](/mnt/c/local/community-app/apps/hub-platform/src/app/(hub)/[hubSlug]/account/bookings/page.jsx)
- [`/account/membership`](/mnt/c/local/community-app/apps/hub-platform/src/app/(hub)/[hubSlug]/account/membership/page.jsx)
- [`/account/billing`](/mnt/c/local/community-app/apps/hub-platform/src/app/(hub)/[hubSlug]/account/billing/page.jsx)
- [`/account/profile`](/mnt/c/local/community-app/apps/hub-platform/src/app/(hub)/[hubSlug]/account/profile/page.jsx)
- legacy [`/account/courses`](/mnt/c/local/community-app/apps/hub-platform/src/app/(hub)/[hubSlug]/account/courses/page.jsx) still exists

Planning drift:
- [SaaS Domain And Route Model](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/saas-domain-and-route-model-2026-03-15.md) still lists:
  - `/account/registrations`
  - `/account/courses`
  - `/account/payments`

Assessment:
- the member account implementation has moved ahead of the SaaS route doc
- the doc should be updated to the current V1 member IA
- `/account/courses` is now a legacy route that should be explicitly retained or retired

### 2.3 Admin routes

Status: **materially implemented**

Implemented route families include:
- `/admin`
- `/admin/admins`
- `/admin/members`
- `/admin/events`
- `/admin/courses`
- `/admin/payments`
- `/admin/settings`
- `/admin/media`
- `/admin/testimonials`

Assessment:
- admin route coverage is strong
- route depth is real enough to support operations
- this area is ahead of the commercial SaaS model rather than blocked by it

## 3) Site Settings And Package Gating Audit

### 3.1 Bounded site settings

Status: **implemented in meaningful first-pass form**

Evidence:
- persistence and normalization in [`src/lib/data/site-settings.js`](/mnt/c/local/community-app/apps/hub-platform/src/lib/data/site-settings.js)
- domain normalization in [`src/lib/domain/site-settings.js`](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/site-settings.js)
- public normalization in [`src/lib/domain/public-site.js`](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/public-site.js)
- admin settings routes under [`src/app/(admin)/[hubSlug]/admin/settings`](/mnt/c/local/community-app/apps/hub-platform/src/app/(admin)/[hubSlug]/admin/settings)

Assessment:
- bounded public-site settings are real
- hub admins can manage structured public-site data
- this area is much closer to product-ready than the older planning docs suggest

### 3.2 Package-aware capabilities

Status: **implemented only as a thin first-pass adapter**

Evidence:
- capability adapter exists in [`site-settings-capabilities.js`](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/site-settings-capabilities.js)

Current capability model:
- `packageTier`
- `announcementsEnabled`
- `eventsEnabled`
- `coursesEnabled`
- `testimonialsEnabled`
- `paymentsEnabled`
- `customDomainAllowed`
- `advancedHomepageVariantsEnabled`

Assessment:
- this is the right module boundary
- but the model is still too thin to serve as real SaaS package authority

### 3.3 Package gating enforcement

Status: **partial and inconsistent**

Implemented:
- public header navigation hides gated pages via [`public-routes.js`](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/public-routes.js)
- site settings normalization exposes capability context
- My Bookings UI uses capabilities to shape browse/filter behavior

Not implemented:
- route blocking for gated public routes
- route blocking for gated admin capabilities
- onboarding-time package assignment
- capability enforcement tied to commercial entitlements
- limits enforcement based on tier

Important example:
- [`/courses/page.jsx`](/mnt/c/local/community-app/apps/hub-platform/src/app/(hub)/[hubSlug]/courses/page.jsx) exists and renders regardless of tier
- `coursesEnabled` currently affects nav exposure, but not authoritative route availability

Assessment:
- current package gating is mostly presentation-layer gating, not product-enforcement gating

## 4) Admin And Member Onboarding Audit

### 4.1 Hub provisioning

Status: **implemented, but not package-aware**

Evidence:
- platform hub creation form in [`CreateHubForm.jsx`](/mnt/c/local/community-app/apps/hub-platform/src/app/(platform)/platform/hubs/create/CreateHubForm.jsx)
- action in [`create/actions.js`](/mnt/c/local/community-app/apps/hub-platform/src/app/(platform)/platform/hubs/create/actions.js)
- normalization in [`domain/hubs.js`](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/hubs.js)
- persistence in [`hub-mutations.js`](/mnt/c/local/community-app/apps/hub-platform/src/lib/data/hub-mutations.js)

Current provisioning inputs:
- name
- slug
- primary domain
- template
- theme
- contact email
- description
- timezone
- locale

Not captured:
- package tier
- billing plan
- admin/member limits
- entitlements
- whether courses are enabled by package
- whether custom domains are allowed by package

Current default behavior:
- `features.courses: true`
- `features.stripePayments: false`
- `supportState: "onboarding"`

Assessment:
- new hubs are provisioned with a hardcoded product stance, not a selected commercial tier
- this is the clearest sign that onboarding and SaaS packaging are not yet connected

### 4.2 Member onboarding

Status: **implemented**

Evidence:
- join route in [`join/page.jsx`](/mnt/c/local/community-app/apps/hub-platform/src/app/(hub)/[hubSlug]/join/page.jsx)
- client form in [`MemberJoinForm.jsx`](/mnt/c/local/community-app/apps/hub-platform/src/app/(hub)/[hubSlug]/join/MemberJoinForm.jsx)
- API route in [`api/auth/member/join/route.js`](/mnt/c/local/community-app/apps/hub-platform/src/app/api/auth/member/join/route.js)

Current behavior:
- member self-registers with name, email, password
- Firebase auth user is created
- a hub-scoped user record is created with role `member`
- session cookie is created

Not present:
- tier-specific member onboarding behavior
- plan selection at join time
- membership purchase at join time
- package-aware gating of public join
- member-capacity enforcement

Assessment:
- member onboarding works as identity provisioning
- it does not yet connect to the commercial model or membership purchase model

### 4.3 Member sign-in

Status: **implemented**

Evidence:
- [`sign-in/page.jsx`](/mnt/c/local/community-app/apps/hub-platform/src/app/(hub)/[hubSlug]/sign-in/page.jsx)
- [`MemberSignInForm.jsx`](/mnt/c/local/community-app/apps/hub-platform/src/app/(hub)/[hubSlug]/sign-in/MemberSignInForm.jsx)
- [`api/auth/member/session/route.js`](/mnt/c/local/community-app/apps/hub-platform/src/app/api/auth/member/session/route.js)
- [`member-auth.js`](/mnt/c/local/community-app/apps/hub-platform/src/lib/auth/member-auth.js)

Assessment:
- sign-in is solid enough for current use
- it assumes the hub user record already exists
- it is not involved in package enforcement

### 4.4 Admin onboarding

Status: **implemented as invite acceptance**

Evidence:
- invite creation from platform in [`PlatformInviteAdminForm.jsx`](/mnt/c/local/community-app/apps/hub-platform/src/app/(platform)/platform/hubs/[hubId]/invite-admin/PlatformInviteAdminForm.jsx)
- invite persistence in [`invites.js`](/mnt/c/local/community-app/apps/hub-platform/src/lib/data/invites.js)
- admin acceptance on the public `join` route in [`join/page.jsx`](/mnt/c/local/community-app/apps/hub-platform/src/app/(hub)/[hubSlug]/join/page.jsx)
- invite acceptance API in [`api/auth/admin-invite/accept/route.js`](/mnt/c/local/community-app/apps/hub-platform/src/app/api/auth/admin-invite/accept/route.js)

Current behavior:
- platform operator sends admin invite
- invited admin accepts through the hub join route
- accepted invite creates a hub user with role `admin`
- admin session is established and redirects to `/admin`

Not present:
- tier-based max-admin enforcement
- non-admin staff role matrix
- onboarding steps beyond identity creation

Assessment:
- admin onboarding is real and usable
- it is not yet constrained by package/tier policy

## 5) Tier And Commercial Model Audit

### 5.1 Is the client’s tier captured during onboarding?

Answer: **No**

Current state:
- no package-tier field in hub provisioning form
- no package-tier selection in hub creation action
- no billing-plan binding when a hub is created

The only package signal found in code is:
- `hub.packageTier` read by [`resolveSiteSettingsCapabilities`](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/site-settings-capabilities.js)

But:
- hub creation does not populate it
- no authoritative package management flow was found

### 5.2 Are features available per tier formally defined?

Answer: **No**

Current state:
- a small capability adapter exists
- there is no locked feature matrix in code
- there is no authoritative product-tier model

Examples of unresolved feature questions:
- custom domains by tier
- courses by tier
- advanced public pages by tier
- testimonials by tier
- payments by tier
- advanced template variants by tier

### 5.3 Are admin/member limits enforced per tier?

Answer: **No**

Current state:
- admin and member counts are derived and displayed
- no max-admin or max-member fields were found
- no enforcement logic was found in onboarding or invite flows

### 5.4 Are extra pages or route inventory controlled by tier?

Answer: **Only partially, and mostly not authoritatively**

Current state:
- public nav can hide capability-driven routes
- there is no proven authoritative route blocking for most gated capabilities
- no custom-page registry implementation was found that is tied to tier limits

### 5.5 Is pricing model direction locked?

Answer: **No**

The project does not yet answer these commercially important questions:
- should tiers be feature-based?
- should tiers be member-count-based?
- should tiers be hybrid?
- should custom domains be premium-only?
- should courses be tier-gated?
- should admin count be capped?
- should member count be capped?
- should additional public pages be tier-gated?

This is now one of the biggest product-definition gaps in the system.

## 6) Document Drift And Internal Contradictions

### 6.1 Site configuration ownership docs are not fully aligned

There is drift between:
- [Hub Site Config Schema And Package Gating](/mnt/c/local/community-app/apps/hub-platform/docs/public-site/hub-site-config-schema-and-package-gating.md)
- [SaaS Site Settings Schema And Ownership Model](/mnt/c/local/community-app/apps/hub-platform/docs/public-site/saas-site-settings-schema-and-ownership-model-2026-03-15.md)

The first document says:
- product/platform team configures the public site for the hub

The second document says:
- hub admins manage bounded site settings directly

Current implementation clearly aligns more with the second model:
- hub-admin-managed bounded settings inside admin are real

Recommendation:
- the older platform-managed assumption should be retired or explicitly reframed

### 6.2 Member route docs are stale

The SaaS route doc still reflects:
- `/account/registrations`
- `/account/payments`

Current code has moved to:
- `/account/bookings`
- `/account/billing`

Recommendation:
- update the SaaS route doc so it no longer trails actual member-account delivery

### 6.3 Capability planning is ahead of enforcement

Docs assume:
- package-aware route and capability control as first-class product behavior

Code reality:
- capability adapter exists
- enforcement is still patchy and mostly UI-level

Recommendation:
- the next planning slice should move from abstract capability language to a locked entitlement matrix and enforcement plan

## 7) Clear Current-State Answers To The Product Questions

These are the direct answers based on current code inspection.

### 7.1 Have we implemented functionality to dictate which tier the client has registered for?

**No.**

There is no authoritative package-tier onboarding path yet.

### 7.2 Have we defined what features are available for each tier?

**No.**

There is a capability adapter stub, but no locked tier matrix.

### 7.3 Does tier one currently exclude custom domains, courses, or extra pages?

**No authoritative rule exists in code.**

Current state:
- custom domains are allowed in provisioning input
- courses default to enabled on hub creation
- custom-domain allowance is hardcoded `true` in the capability adapter

### 7.4 Do we know how many admins or members each tier allows?

**No.**

Counts are tracked, but limits are not modeled or enforced.

### 7.5 Is the product currently set up for pricing by member count versus feature bundle?

**No.**

That commercial model is not yet locked in the product or codebase.

## 8) Recommended Next Decisions To Lock

Before Stripe or broader SaaS completion work, the product needs explicit decisions on:

1. package structure
- base / growth / premium or equivalent

2. pricing basis
- feature bundle
- member count
- hybrid

3. hard entitlements
- custom domains
- courses
- testimonials
- advanced public pages
- advanced templates
- payments

4. limits
- max admins
- max members
- max custom pages
- max domains

5. onboarding authority
- who assigns package tier
- when it is assigned
- whether it can change after provisioning

6. enforcement model
- what is hidden in UI only
- what is actually blocked at route/data layer

## 9) Recommended Next Engineering Work

### 9.1 First

Create a locked SaaS package and entitlement decision document.

That document should define:
- tiers
- capability matrix
- limits matrix
- commercial model basis
- upgrade/downgrade assumptions

### 9.2 Second

Update the current SaaS docs so they match reality:
- host resolution remains planned, not implemented
- member routes updated to current V1 naming
- bounded site-settings ownership clarified

### 9.3 Third

Implement a real package authority model in code:
- `packageTier`
- package-derived capabilities
- package-derived limits
- provisioning-time assignment

### 9.4 Fourth

Only after that, wire capability enforcement through:
- route access
- settings UI
- booking/membership/payment flows
- later Stripe product mapping

## Audit Conclusion

The product is structurally ready for the SaaS-commercial-definition phase.

The next serious risk is no longer frontend fragmentation.  
It is product ambiguity around package tier, limits, entitlements, and onboarding authority.

The codebase already has enough implementation that these decisions will now affect:
- provisioning
- onboarding
- route authority
- package gating
- future Stripe integration

So the next best move is not “implement more features first.”

The next best move is to lock the SaaS commercial and capability model, then bring the codebase into line with it.
