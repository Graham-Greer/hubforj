# Product Site

`apps/product-site` is the standalone commercial boundary for Hubforj.

It owns:

- product marketing and acquisition pages
- package presentation and package signup entry
- commercial account authentication and recovery
- SaaS billing lifecycle for Hubforj packages
- first-owner onboarding handoff into `hub-platform`

It does not own:

- `hub-platform` frontend implementation
- community operations, member management, or public community-site rendering
- the second Stripe domain for community-native payments inside Growth hubs

## Architecture Rules

- keep product-site frontend implementation local to this app
- do not import frontend sections, shells, or CSS from `apps/hub-platform`
- only share app-agnostic contracts or explicit backend boundaries
- treat Stripe on the product-site as the package-billing system for Hubforj itself
- treat Stripe inside `hub-platform` as a separate future payment domain for community commerce

## Current State

As of 2026-04-24, the product-site implementation now includes the following live foundations.

### Marketing and commercial shell

- standalone Next.js product-site app boundary
- local product-site design system, token set, and marketing shells
- rebuilt overview, pricing, signup, sign-in, and supporting marketing routes
- marketing header includes a portal-based mobile drawer so the mobile menu can layer independently from the sticky header
- branded account-area shell with protected `/account/*` routes

### Commercial account and signup flow

- commercial account records persisted in Firestore
- owned-hub linkage persisted from product-site signup
- signed commercial-account session established after signup/sign-in
- duplicate signup protection for owner email
- current rule: one owner email maps to one Hubforj commercial account/workspace

### Auth, verification, and recovery

- Firebase-backed commercial sign-in
- branded owner email verification flow through Resend
- branded verification route on the product-site
- branded forgot-password and reset-password flow on the product-site
- resend verification support from the account area
- session-aware verification completion and sign-in handoff

### Billing and package lifecycle

- Stripe customer creation and reuse
- Stripe Checkout for first paid-package activation
- Stripe Billing Portal access for existing subscriptions
- verified Stripe webhook processing
- webhook claim/process/fail lifecycle for safer retry handling
- account-level billing audit events written to Firestore
- package intent tracking for pending paid-package selection
- truthful pending, payment-issue, and scheduled-cancellation states in the account area
- live Stripe subscription refresh on account-route load
- canonical package-authority write-through into `hub-platform`

### Paid signup contract

- `Free` signup provisions directly
- `Starter` and `Growth` signups provision the commercial account and hub baseline first
- paid package authority is not granted until Stripe checkout and webhook sync succeed
- paid checkout returns to a branded next-steps route
- verification and admin activation continue from the commercial account area

### Admin activation handoff

- verified owner can trigger first-owner admin provisioning into `hub-platform`
- admin activation uses the existing Firebase auth identity instead of creating a second auth account
- owner is then redirected into the hub sign-in route with the same credentials

### Account-area UX

- `/account` is now a summary workspace shell
- `/account/package`, `/account/billing`, and `/account/upgrade` are live commercial routes
- account navigation now sits in the persistent header
- package and billing pages reflect real subscription state instead of placeholders

## Intentional Product Rules

- one owner email = one Hubforj commercial account/workspace
- product-site Stripe billing is the source of truth for Hubforj package lifecycle
- `hub-platform` consumes package authority; it does not own SaaS billing
- paid signup starts from a free operational baseline and only becomes paid after verified Stripe lifecycle success
- account UI should be client-facing and commercially understandable, not developer-facing

## Known Remaining Work

The product-site is now credible enough for controlled launch hardening, but it is not the end of the SaaS implementation.

Still outstanding:

- final production deployment verification
- live production env validation across product-site and hub-platform
- support/runbook tooling for operational recovery
- broader reconciliation and support views if needed
- the second Stripe domain inside `hub-platform` for community-native payments in Growth hubs

## Environment Contract

### App routing

- `PRODUCT_SITE_BASE_URL`
  - canonical product-site origin
  - used for Stripe return URLs and branded Firebase action links
- `HUB_PLATFORM_BASE_URL`
  - canonical operational app origin
  - used for protected internal calls to `hub-platform`
  - in production, tenant handoff links derive `{tenantSlug}.hubforj.com` from this origin instead of sending customers to the operational root

### Internal cross-app trust

- `INTERNAL_AUTOMATION_SECRET`
  - must match the protected automation secret accepted by `hub-platform`
  - required for provisioning and admin-activation internal calls
- `PRODUCT_SITE_SESSION_SECRET`
  - secret for commercial-account session signing

### Resend

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

Required for branded verification and reset-password delivery.

### Stripe

- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_PRICE_STARTER_GBP_MONTHLY`
- `STRIPE_PRICE_GROWTH_GBP_MONTHLY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_BILLING_PORTAL_CONFIGURATION_ID`
  - optional, but recommended when you want consistent billing-portal behavior

Hubforj package billing on the product-site is intentionally **GBP-only**. The product-site creates the
commercial account and the initial hub shell, but it does not ask the customer to configure the hub's
operating country, timezone, or community currency during SaaS signup. Those settings are now part of the
hub-platform onboarding flow, while the SaaS subscription itself always uses the GBP Stripe prices above.

### Firebase Admin

- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PRIVATE_KEY`

Required for server-side commercial-account persistence and trusted Firebase operations.

### Firebase Client

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

Required for commercial sign-in, verification, and reset flows in the browser.

## Local Development Notes

### Stripe CLI

For local paid-flow testing, run the Stripe CLI listener while the product-site dev server is running:

```powershell
& "C:\Users\GreerG\AppData\Local\Microsoft\WinGet\Packages\Stripe.StripeCli_Microsoft.Winget.Source_8wekyb3d8bbwe\stripe.exe" listen --forward-to localhost:3001/api/stripe/webhooks
```

Then copy the returned signing secret into:

- `STRIPE_WEBHOOK_SECRET`

### Failed-payment test card

Use this Stripe test card for declined-payment testing:

- `4000 0000 0000 9995`

Use any future expiry, any 3-digit CVC, and any postcode.

## Production Setup Checklist

Use this before claiming launch readiness.

### DNS and app origins

- set the production `PRODUCT_SITE_BASE_URL`
- set the production `HUB_PLATFORM_BASE_URL` to the operational app root, for example `https://community.hubforj.com`
- verify the product site root, operational app root, and wildcard tenant hosts all resolve to the intended Vercel projects

### Firebase

- add the production product-site domain to Firebase auth allowed domains
- verify email action links return to the product-site branded routes
- verify sign-in and reset-password flows use the production Firebase project

### Resend

- verify sending domain
- confirm `RESEND_FROM_EMAIL` uses the verified domain
- send a real verification email and reset email in production/test environment

### Stripe

- create recurring Stripe prices for the two paid GBP packages
- add the correct GBP price ids into product-site env
- configure webhook endpoint at `/api/stripe/webhooks`
- copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`
- configure billing portal settings if package-change behavior should be constrained

### Cross-app trust

- confirm `INTERNAL_AUTOMATION_SECRET` matches between product-site and hub-platform
- confirm provisioning and admin activation routes are reachable from product-site

## Test Checklist

Use this checklist as the current manual verification baseline.

### Marketing and public routes

- overview page loads cleanly on desktop and mobile
- pricing page loads cleanly on desktop and mobile
- signup page loads cleanly on desktop and mobile
- account header/nav layout remains stable across account routes

### Free signup flow

- submit signup with `Free`
- verify hub is provisioned
- verify commercial account record is created
- verify owner verification email is sent
- verify product-site next step is clear

### Paid signup happy path

- submit signup with `Starter` or `Growth`
- verify Stripe Checkout opens immediately
- complete successful test payment
- verify return to branded next-steps route
- verify verification email arrives
- verify branded verification route completes successfully
- verify sign-in returns to commercial account area
- verify package and billing state become truthful after webhook sync
- verify Firebase commercial account and hub linkage are correct

### Checkout cancellation and recovery

- start paid signup
- cancel/back out of Stripe Checkout
- verify account surfaces show pending or incomplete state truthfully
- verify there is a clear CTA back into secure checkout

### Failed payment recovery

- start paid signup or paid package change
- use the declined Stripe test card
- verify account surfaces show payment issue or incomplete payment state
- verify recovery CTA leads back to the right package/billing flow

### Duplicate-signup protection

- attempt signup with an owner email that already owns a workspace
- verify no duplicate hub is created
- verify the user is clearly directed toward sign-in or using a different email

### Verification flow

- verify owner email from the product-site branded email
- verify signed-in and signed-out states both behave correctly
- verify reused or expired verification link produces a sensible recovery path
- verify resend verification works from the account area

### Password reset flow

- request password reset
- verify branded reset email arrives
- verify link lands on product-site branded reset route
- verify password reset succeeds
- verify sign-in works with the new password

### Billing portal flow

- open billing portal from `/account/billing`
- return without changes and verify route state remains stable
- schedule cancellation and verify account/package/billing pages reflect the scheduled end
- if available in test mode, verify package change or cancellation state remains truthful after return

### Admin activation and hub handoff

- verify owner email
- open account area
- trigger admin activation
- verify redirect into hub-platform sign-in
- verify the same email/password works in the hub admin

### Data and audit verification

- confirm `commercialAccounts` document exists and is correct
- confirm owned-hub linkage exists
- confirm Stripe fields sync onto the commercial account
- confirm billing audit events are being written
- confirm package authority updates are reflected in hub records

## Suggested Next Engineering Step

Once the checklist above is passing consistently, the best next implementation layer is:

- the second Stripe domain in `hub-platform`

That work should cover:

- Growth hub Stripe connection
- member checkout for memberships, events, and courses
- webhook-driven payment state sync inside the operational admin

This should be treated as separate from the product-site SaaS billing layer documented above.
