# Product-Site Commercial Account Auth Plan

Status:
- Proposed
- Partially implemented
- Immediate identity/auth authority until onboarding trust completion supersedes it

Date:
- 2026-04-21

Purpose:
- Lock the next production-grade implementation slice after the current product-site foundation work
- Define the real commercial-account identity and ownership model before any returning-customer sign-in or live Stripe billing is added
- Prevent the product site from drifting into fake account functionality

Authority:
- [Product Site And Commercial Platform Implementation Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-and-commercial-platform-implementation-plan-2026-04-20.md)
- [Product Site Phase 4 Execution Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-phase-4-execution-plan-2026-04-20.md)
- [Product Site Phase 5 Execution Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-phase-5-execution-plan-2026-04-20.md)
- [Stripe Two-Domain Architecture Note](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/stripe-two-domain-architecture-note-2026-04-20.md)
- [Roadmap Docs README](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/README.md)
- app-local standards in `docs/standards/*`

Related:
- [Product Site README](/mnt/c/local/community-app/apps/product-site/README.md)

## 1) Executive Position

The product site has reached the point where marketing, pricing, signup, provisioning, and a provisional commercial account shell all exist.

However, the repo audit shows that the product still does **not** have a first-class commercial customer identity model.

What exists today:

- a signed product-site session created immediately after signup
- protected `/account/*` routes that depend on that session
- package/account pages that are honest placeholders before live billing
- persistent commercial account records
- owned-hub linkage
- returning-customer sign-in
- password reset / recovery

What does **not** exist yet:

- commercial email verification
- first operational admin provisioning in `hub-platform`
- secure first-admin activation or handoff into `hub-platform`
- explicit onboarding lifecycle and recovery states

That means the next implementation slice should now be:

1. add verification and onboarding trust controls
2. provision the first operational admin identity
3. complete secure cross-app activation into `hub-platform`
4. then attach Stripe-backed billing lifecycle work

This is the cleanest production path because it avoids building fake sign-in, fake billing access, or session assumptions that would later need to be rewritten.

## 2) Repo-Audited Current Truth

### 2.1 `hub-platform` auth already exists, but it is not the commercial-account auth model

Relevant files:

- [session.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/auth/session.js)
- [member-auth.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/auth/member-auth.js)
- [platform-auth.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/auth/platform-auth.js)
- [member-session.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/auth/member-session.js)
- [platform-session.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/auth/platform-session.js)

What is already true:

- `hub-platform` has session infrastructure for:
  - hub members
  - hub admins
  - superadmins
- that auth is tied to operational product access
- that auth should remain owned by `hub-platform`

What is not true:

- there is no commercial customer role in the shared user-role model
- there is no product-site sign-in route backed by a first-class business account

### 2.2 The user-role model does not yet include commercial customers

Relevant files:

- [users.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/domain/users.js)
- [user-queries.js](/mnt/c/local/community-app/apps/hub-platform/src/lib/data/user-queries.js)

What is already true:

- current supported roles are operational:
  - `member`
  - `admin`
  - `superadmin`

What is not true:

- there is no `customer`, `owner`, or `commercial_account` role in the current model
- product-site sign-in cannot safely piggyback on the existing operational user-role model without blurring app boundaries

### 2.3 `product-site` now has a real but still incomplete commercial-auth boundary

Relevant files:

- [account-session.js](/mnt/c/local/community-app/apps/product-site/src/lib/server/account-session.js)
- [signup/actions.js](/mnt/c/local/community-app/apps/product-site/src/app/(marketing)/signup/actions.js)
- [account layout](/mnt/c/local/community-app/apps/product-site/src/app/(account)/layout.jsx)

What is already true:

- signup creates a signed product-site session
- the account area is not publicly open
- persistent commercial accounts now exist behind the session
- returning customers can now sign back in
- password reset now exists for the commercial account

What is not true:

- the owner email is not yet verified as part of onboarding
- the first operational admin identity is not yet provisioned automatically
- the system cannot yet claim onboarding into the admin portal is complete

## 3) Locked Delivery Rule

Do **not** treat commercial auth completion as equivalent to production onboarding completion until:

- owner email verification exists
- first admin provisioning exists
- secure operational handoff exists
- onboarding recovery rules exist

## 4) Goal Of This Phase

Create a real commercial-account identity layer for the product site.

At the end of the identity/auth phase, the repo should support:

- a persistent commercial account record
- deterministic ownership of one or more hubs by that account
- signup that creates both the hub and the owning commercial account relationship
- returning-customer sign-in
- product-site account routes backed by a real account model instead of a signup-only session

The next phase after this document is governed by:

- [Product-Site Production Onboarding And Admin Handoff Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-production-onboarding-and-admin-handoff-plan-2026-04-21.md)

## 5) Recommended Architecture

### 5.1 Keep auth boundaries separate

The system should keep two session domains:

- `product-site`
  - commercial account authentication
  - package management
  - future SaaS billing lifecycle
- `hub-platform`
  - hub admin authentication
  - hub member authentication
  - superadmin/operator authentication

These systems may hand off context to each other, but they should not share implicit session state.

### 5.2 Introduce a first-class commercial account model

The product site should gain a durable account entity, for example:

- `commercialAccounts`
- `commercialAccountMemberships` or `commercialAccountHubs`

The exact collection naming can be finalized during implementation, but the model should support:

- primary account id
- owner full name
- owner email
- auth provider uid
- status
- created/updated timestamps
- owned hubs
- Stripe customer id later in Phase 5

### 5.3 Persist ownership separately from operational users

The product site should not treat hub admin membership as the same thing as commercial account ownership.

Reasons:

- one commercial customer may eventually own multiple hubs
- commercial ownership governs package/billing authority
- operational admin access governs day-to-day community management

Those are related, but they are not the same model.

### 5.4 Build sign-in on the product-site side only

The cleanest next move is:

- add product-site auth infrastructure
- establish a commercial account session derived from that auth
- resolve hub ownership inside the product-site account area

Do not attempt to route returning customers through `hub-platform` sign-in first.

## 6) Execution Tracks

### Track A: Commercial account data model

Outcome:
- product-site has a real persistent account entity

Required outputs:

- commercial account record shape
- ownership mapping shape
- normalization rules
- create/read/query helpers

### Track B: Signup write-through hardening

Outcome:
- signup creates the real commercial account relationship, not just a transient session

Required outputs:

- create-or-resolve account during signup
- attach hub ownership during provisioning completion
- write session from persisted account state rather than request payload alone

### Track C: Product-site auth and returning sign-in

Outcome:
- existing commercial customers can sign back in safely

Required outputs:

- sign-in route
- sign-out route
- session creation from authenticated account
- route guard behavior for `/account/*`

### Track D: Account-to-hub resolution

Outcome:
- account routes can load the intended hub or hub list safely

Required outputs:

- ownership query helpers
- current-hub resolver
- multi-hub-safe route assumptions

### Track E: Cross-app handoff hardening

Outcome:
- `hub-platform` can hand a customer into the correct product-site destination without assuming shared auth

Required outputs:

- hub-aware handoff URLs
- return-path preservation
- explicit destination intent

## 6.1 Current implementation note

The repo now satisfies substantial parts of Tracks A to D:

- commercial account data model
- signup write-through into owned-hub linkage
- returning sign-in
- password reset
- account-to-hub resolution

What remains outstanding should now be treated as onboarding trust work rather than basic auth plumbing:

- email verification
- operational admin provisioning
- secure first-admin activation
- resumable onboarding state

## 7) Implementation Priorities

### Slice 1: Define commercial account domain and persistence boundary

Implementation tasks:

1. Add product-site account domain module
2. Add persistence adapter(s) for commercial accounts and owned hubs
3. Define normalization rules for owner identity and ownership links
4. Add unit coverage for normalization and ownership behavior

Acceptance criteria:

- a commercial account record shape exists
- ownership can be represented without depending on hub admin membership

### Slice 2: Change signup from transient account bootstrapping to durable account creation

Implementation tasks:

1. Create or resolve the commercial account during signup
2. Persist ownership of the newly created hub to that account
3. Build the signed session from persisted account data
4. Keep the current success path and account handoff intact

Acceptance criteria:

- signup creates durable account ownership
- the session reflects persisted truth, not just form input

### Slice 3: Implement returning-customer sign-in

Implementation tasks:

1. Add product-site sign-in route and form
2. Authenticate against the commercial account identity layer
3. Establish the commercial account session
4. Add sign-out route/action if needed to complete lifecycle

Acceptance criteria:

- an existing customer can return to `/account/*` without re-running signup
- no fake or placeholder sign-in behavior exists

### Slice 4: Resolve account hub context cleanly

Implementation tasks:

1. Load owned hubs for the signed-in account
2. Resolve default/current hub safely
3. Update package, billing, and upgrade routes to use resolved account state
4. Keep multi-hub growth possible even if V1 only exposes one active hub path

Acceptance criteria:

- account pages load from real ownership state
- no route assumes “the current hub” without resolving it explicitly

### Slice 5: Align docs and UX copy

Implementation tasks:

1. Update product-site docs to describe the real account boundary
2. Update any copy that implies full sign-in exists before implementation
3. Keep billing copy honest until Stripe is attached

Acceptance criteria:

- repo docs match implementation reality
- the site does not imply non-existent functionality

## 8) Why This Must Happen Before Stripe

Stripe customer and subscription state needs a stable owner record.

Without a real commercial account model:

- Stripe customer records would attach to a weak identity seam
- package billing routes would not know who the real commercial customer is
- returning-customer billing access would be brittle
- support and reconciliation would become harder than necessary

Stripe should therefore attach to:

- a real commercial account
- a real ownership model
- a stable account session

Not to a signup-only bootstrap session.

## 9) Final Recommendation

The product site is now ready to move from “commercial surface” to “commercial system.”

The correct next implementation move is not more marketing polish and not Stripe yet.

It is:

1. first-class commercial account records
2. durable hub ownership mapping
3. returning-customer sign-in
4. then Stripe-backed package lifecycle work

That is the smallest production-grade path that keeps the product honest and keeps later billing work on a strong upstream contract.
