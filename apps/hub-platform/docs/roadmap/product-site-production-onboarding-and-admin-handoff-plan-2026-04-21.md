# Product-Site Production Onboarding And Admin Handoff Plan

Status:
- Implemented in core flow
- Still relevant for verification, audit, and remaining hardening work

Date:
- 2026-04-21

Purpose:
- Define the production-grade onboarding flow from commercial signup to operational hub administration
- Explicitly add trust, verification, recovery, and cross-app activation requirements that must exist before Stripe lifecycle work is treated as launch-ready
- Provide a later audit checklist so implementation can be verified without ambiguity

Authority:
- [Product Site And Commercial Platform Implementation Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-and-commercial-platform-implementation-plan-2026-04-20.md)
- [Product-Site Commercial Account Auth Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-commercial-account-auth-plan-2026-04-21.md)
- [Product Site Phase 5 Execution Plan](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/product-site-phase-5-execution-plan-2026-04-20.md)
- [Stripe Two-Domain Architecture Note](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/stripe-two-domain-architecture-note-2026-04-20.md)
- [Roadmap Docs README](/mnt/c/local/community-app/apps/hub-platform/docs/roadmap/README.md)
- app-local standards in `docs/standards/*`

Related:
- [Product Site README](/mnt/c/local/community-app/apps/product-site/README.md)

## 1) Executive Position

The product site now has enough commercial identity infrastructure to support:

- durable commercial account records
- owned-hub persistence
- signup credential creation
- returning-customer sign-in
- password reset and commercial account recovery

That is a necessary milestone, but it is **not** yet the full production onboarding flow.

The missing production-grade bridge was:

1. verified trust in the owner email
2. first operational admin provisioning inside `hub-platform`
3. secure first-admin activation or handoff into the operational app
4. resilient onboarding state and recovery rules when any step fails

Until those pieces exist, a customer can create a commercial account and a hub, but the system cannot yet honestly claim that the owner is fully onboarded into the operational product.

## 2) Repo-Audited Current Truth

### 2.1 What is now implemented

Product-site now provides:

- commercial account records
- owned-hub linkage
- Firebase-backed commercial auth
- returning sign-in
- password reset / recovery

This means the commercial side is now real enough to support later billing work.

### 2.2 What is now implemented in the core onboarding path

The current flow now provides:

- owner email verification through Resend-backed delivery
- a commercial-account resend path for verification
- first-owner admin provisioning inside `hub-platform` through a protected internal automation route
- explicit handoff from the commercial account area into hub sign-in for the operational admin workspace

### 2.3 What still needs hardening

The current implementation still does **not** fully solve:

- an explicit auditable onboarding lifecycle state model
- richer recovery and support states for every partial-failure branch
- generalized multi-hub owner activation when the same Firebase auth identity needs operational access across more than one hub

### 2.4 Why the remaining gaps still matter

Without these layers, the product would risk:

- confusing support cases where a commercial account exists but the admin portal is not usable
- weak assumptions that the current first-owner activation flow automatically scales to multi-hub ownership

## 3) Locked Delivery Rule

Do **not** claim onboarding is complete until the system can prove all of the following:

- the owner email is verified
- the first hub admin identity exists
- the owner has a secure path into the operational admin product
- partial failures can be resumed or recovered safely

Do **not** use the same session model for:

- commercial account access
- hub admin access

These should remain separate trust domains with an explicit, signed handoff contract between them.

## 4) Production-Grade Target Flow

### Step 1: Commercial signup starts on the product site

Customer submits:

- owner full name
- owner email
- password
- community name
- hub slug
- selected package

System creates:

- commercial account record
- commercial auth user
- hub record
- ownership mapping between commercial account and hub

### Step 2: Verification email is issued

Immediately after signup:

- send a verification email to the commercial owner email
- mark the onboarding state as pending verification
- allow only the correct subset of low-trust actions until verification completes

Recommended rule:

- do not allow irreversible billing/package changes or operational admin activation before verification

### Step 3: First operational admin is provisioned

After the commercial account is created, the system should provision the first admin identity in `hub-platform`.

That record should:

- use the same owner email
- be clearly marked as the initial hub admin
- remain separate from the commercial account record

Recommended rule:

- operational admin creation should happen through a deliberate provisioning boundary, not by directly reusing commercial account session assumptions

### Step 4: Secure first-admin activation or handoff

Once the email is verified and the admin identity exists, the customer should receive a secure path into `hub-platform` admin.

Recommended implementation options:

- a one-time signed activation token
- a one-time signed handoff token
- a secure admin activation route with expiry and replay protection

Recommended rule:

- never silently trust product-site commercial session as a valid hub admin session

### Step 5: Onboarding completion and resumption

The user should be able to:

- resume onboarding if interrupted
- reopen the commercial account and see what is pending
- understand whether they need to:
  - verify email
  - activate admin access
  - finish hub setup

## 5) Required Trust Model

### 5.1 Commercial trust domain

This belongs to `product-site`.

Questions it answers:

- who owns the commercial account?
- who owns package and billing authority?
- is the commercial email verified?

### 5.2 Operational trust domain

This belongs to `hub-platform`.

Questions it answers:

- who can administer the hub?
- who can manage members, content, events, courses, payments, and settings?

### 5.3 Trust bridge

This is the explicit connection between the two systems.

It should answer:

- which verified commercial account owns this hub?
- which operational admin identity is the initial owner/admin?
- has secure activation/handoff been completed?

## 6) Required State Model

The system should track onboarding state explicitly.

Recommended states:

- `commercial_account_created`
- `commercial_email_verification_pending`
- `commercial_email_verified`
- `hub_provisioned`
- `initial_admin_provisioning_pending`
- `initial_admin_provisioned`
- `admin_activation_pending`
- `admin_activation_completed`
- `onboarding_complete`
- `onboarding_attention_required`

Recommended rule:

- state transitions should be explicit and auditable, not inferred only from whether records happen to exist

## 7) Required Email Flows

### 7.1 Verification email

Must send:

- immediately after signup
- on resend request

Must support:

- expiry
- replay-safe verification
- clear success/failure messaging

### 7.2 Admin activation email or secure activation notice

If the operational admin access model requires activation:

- send a distinct activation email or signed handoff entry point
- make the purpose clear:
  - commercial account access
  - operational admin activation

Recommended rule:

- do not blur these two emails into one unclear message if they represent different trust actions

### 7.3 Recovery messaging

Must support:

- password reset for the commercial account
- support path if email ownership is lost
- support path if hub exists but admin activation failed

## 8) Required Recovery Rules

### 8.1 Partial signup failure

If:

- commercial account exists
- hub creation fails

Then:

- mark onboarding as attention required
- surface a resumable recovery path

### 8.2 Hub exists but admin provisioning fails

If:

- commercial account exists
- hub exists
- first admin does not exist

Then:

- block misleading “Open admin” success claims
- mark onboarding as attention required
- provide operator/support repair instructions

### 8.3 Verification incomplete

If:

- the customer has signed up but not verified email

Then:

- show resend verification
- show what remains blocked
- avoid presenting onboarding as complete

### 8.4 Admin activation incomplete

If:

- initial admin exists
- activation/handoff not completed

Then:

- allow the commercial account to resume activation
- do not require a fresh commercial signup

## 9) Implementation Tracks

### Track A: Commercial email verification

Outcome:
- the commercial account has a trustworthy verified-email state

Required outputs:

- verification token model
- send/resend flow
- verification route
- gated high-trust actions

### Track B: Initial hub admin provisioning

Outcome:
- each newly provisioned hub has a corresponding initial admin identity in `hub-platform`

Required outputs:

- operational admin provisioning boundary
- initial admin record model
- link from owned hub to initial admin identity

### Track C: Secure cross-app activation / handoff

Outcome:
- the verified owner can enter the operational admin app securely

Required outputs:

- one-time signed token or activation flow
- expiry
- replay protection
- return-path rules

### Track D: Onboarding state and resumability

Outcome:
- onboarding can be resumed and supported without guesswork

Required outputs:

- explicit onboarding state record or equivalent tracked model
- attention-required states
- resumable customer guidance

### Track E: Audit and support visibility

Outcome:
- support and engineering can diagnose onboarding failures safely

Required outputs:

- lifecycle timestamps
- state transition records
- operator-readable repair guidance

## 10) Verification Checklist For Later Audit

This section is intentionally implementation-verifiable.

### Commercial account checks

- commercial account record exists after signup
- owned-hub linkage exists after signup
- commercial auth user exists after signup
- returning sign-in works for the same owner email
- forgot-password sends recovery email successfully

### Verification checks

- verification email sends on signup
- resend verification works
- unverified accounts are blocked from gated high-trust actions
- verification token expiry behaves correctly
- verification completion updates tracked state explicitly

### Hub admin provisioning checks

- first hub admin record exists for a newly created hub
- admin record is associated with the intended hub
- owner email and initial admin linkage are explicit
- provisioning failures surface as actionable onboarding states

### Handoff checks

- verified customers can reach the correct admin destination
- handoff token or activation token expires correctly
- replayed or tampered tokens are rejected
- product-site session alone does not imply admin session trust

### Recovery checks

- account can resume after interrupted signup
- account can resume after verification delay
- account can resume after admin activation delay
- support can identify whether failure happened in:
  - commercial account creation
  - verification
  - hub provisioning
  - admin provisioning
  - handoff activation

## 11) Completion Criteria

This onboarding slice should only be considered complete when all of the following are true:

1. a customer can sign up and create a commercial account
2. the customer verifies the owner email successfully
3. the hub exists
4. the first hub admin exists
5. the verified owner can securely activate or reach the admin portal
6. onboarding can be resumed after interruption
7. failures are observable and recoverable

## 12) Final Recommendation

The product site is now strong enough to support the next serious onboarding layer.

Before full Stripe lifecycle work becomes the primary focus, the platform should close the trust and operational-owner gap by implementing:

1. commercial email verification
2. first hub admin provisioning
3. secure first-admin activation / handoff
4. explicit onboarding state and recovery rules

That is the production-grade path because it makes the customer journey trustworthy, supportable, and verifiable rather than merely functional in the happy path.
