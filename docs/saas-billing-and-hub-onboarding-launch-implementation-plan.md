# SaaS Billing and Hub Onboarding Launch Implementation Plan

## Objective

Separate `product-site` SaaS billing from `hub-platform` community configuration so launch behavior is operationally clean:

- `product-site` sells Hubforj itself
- `hub-platform` configures how the client's community operates
- SaaS billing stays simple, English-only, and GBP-denominated
- hub country, timezone, community currency, and formatting are configured inside hub onboarding, not during SaaS signup

This plan replaces the earlier direction where `product-site` signup preconfigured the hub's regional settings.

## Locked launch decisions

1. `product-site` billing is `GBP-only`.
- pricing page, signup, Stripe checkout, invoices, subscription summaries, and account pages must all use `GBP`
- formatting locale on `product-site` is fixed to `en-GB`

2. `product-site` is not responsible for configuring the hub's operating region.
- signup should not ask for hub country, hub timezone, hub community currency, or hub locale
- Stripe billing identity for the SaaS customer is handled by Stripe checkout/customer records, not reused as the hub's operating region

3. `hub-platform` onboarding is responsible for community regional setup.
- the hub owner chooses:
  - operating country
  - community timezone
  - community default currency
  - English date/number formatting locale for launch

4. Launch is English-only.
- UI copy, emails, and support are English only
- non-English date formatting must not appear at launch
- country must not automatically switch the product into Spanish, German, French, or other non-English locale behavior

5. Country, currency, locale, timezone, and language remain separate concepts.
- country controls business region and Stripe Connect context
- currency controls community money
- timezone controls scheduling
- locale controls formatting only
- language remains English-only for launch

6. Hubs must complete regional onboarding before using monetized or scheduling-sensitive workflows.
- no paid offerings
- no Stripe Connect setup
- no event/course creation that depends on timezone/currency
- no membership plan management that depends on community currency

## Why this split is correct

`product-site` and `hub-platform` solve different problems.

### `product-site`

- markets Hubforj
- sells the SaaS subscription
- bills the client
- should be low-friction and commercially simple

### `hub-platform`

- runs the client's community
- controls member-facing payments
- controls event/course scheduling
- controls local operating rules

This means a valid launch setup can be:

- SaaS billing: `GBP`
- product UI: `English`, `en-GB`
- hub operating country: `Spain`
- hub community currency: `EUR`
- hub timezone: `Europe/Madrid`
- hub formatting locale: `en-GB`

That avoids the earlier issue of English UI with mixed localized date fragments such as `jue, 25 jun 2026`.

## Launch target

At the end of this work:

- `product-site` is GBP-only, English-only, and does not ask for hub region
- Stripe SaaS billing is entirely separate from hub operating settings
- a newly created hub is placed into a required onboarding state
- first-run hub onboarding collects country, timezone, community currency, and English formatting locale
- `hub-platform` uses those hub settings as the single source of truth for:
  - event/course defaults
  - membership plan defaults
  - Stripe Connect country context
  - member/community currency handling
  - date/time formatting in English

## Revised source-of-truth model

### Product-site

The SaaS/customer domain owns:

- commercial account
- chosen package tier
- Stripe subscription/customer ids
- SaaS billing currency: `GBP`
- SaaS billing locale: `en-GB`

It does **not** own:

- hub operating country
- hub timezone
- hub community currency
- hub formatting locale

### Hub-platform

The hub domain owns:

- `country`
- `timezone`
- `locale`
- `defaultCurrency`
- `regionalSetupStatus`

For launch, `locale` should be treated as an English formatting locale only, even for non-English countries.

## Canonical hub fields

The hub should keep these canonical settings:

```js
{
  country: "ES",
  timezone: "Europe/Madrid",
  locale: "en-GB",
  defaultCurrency: "EUR",
  regionalSetupStatus: "required" | "complete",
  regionalSetupCompletedAt: "2026-06-04T12:00:00.000Z"
}
```

### Field meanings

#### `country`

- business/operating country for the community
- used for community configuration and Stripe Connect context

#### `timezone`

- IANA timezone
- used for events, courses, recurring schedules, reminders, and operational timestamps

#### `locale`

- formatting locale only
- restricted to English launch values
- recommended launch values:
  - `en-GB`
  - `en-US`
  - optionally `en-CA`
  - optionally `en-AU`

#### `defaultCurrency`

- ISO 4217 community currency
- used for paid offerings and membership defaults

#### `regionalSetupStatus`

- blocks operational workflows until the hub owner confirms the regional settings

## Product-site implementation plan

### Scope

Keep `product-site` focused on SaaS signup and billing only.

### Product-site route rules

#### `/pricing`

- always show GBP package pricing
- no country selector for hub setup
- no regional currency switching
- English copy only
- any “product/support currently provided in English” note can remain if desired

#### `/signup`

- only collect SaaS/account setup information needed to create the commercial account and initial hub
- remove hub region controls:
  - country
  - timezone
  - locale
  - default currency
- keep package selection and package summary GBP-only

#### Stripe checkout

- use GBP Stripe prices only
- required env names should become explicitly GBP-oriented, for example:
  - `STRIPE_PRICE_STARTER_GBP_MONTHLY`
  - `STRIPE_PRICE_GROWTH_GBP_MONTHLY`
- all checkout validation and account pages must align to those GBP prices

### Product-site data changes

Do not persist hub regional defaults from signup anymore.

Create the hub with:

- name/slug/package data
- technical regional placeholders only if required by current code
- `regionalSetupStatus: "required"`

### Product-site cleanup tasks

1. Remove hub regional controls and hidden fields from signup.
2. Remove request-based hub regional guessing from pricing/signup.
3. Make pricing/account/checkout docs explicitly GBP-only.
4. Rename Stripe package env contract from USD-oriented to GBP-oriented.
5. Ensure webhook/account sync continues to work unchanged after the currency rename.

## Hub creation strategy

### Important product rule

The client should not be asked to choose their hub operating country on `product-site`.

### Technical requirement

The system still needs safe provisional values before onboarding completes.

Recommended approach:

```js
{
  country: "GB",
  timezone: "Europe/London",
  locale: "en-GB",
  defaultCurrency: "GBP",
  regionalSetupStatus: "required",
  regionalSetupCompletedAt: ""
}
```

These are **technical placeholders only**, not trusted business settings.

Why this is acceptable:

- many existing flows currently expect non-empty values
- onboarding will immediately replace them
- gated workflows prevent those placeholders from being used for real community operations

If the codebase is later hardened to tolerate null/blank regional values safely, this can be revisited. For launch, provisional placeholders plus gating is the safer production route.

## Hub onboarding implementation plan

### Entry point

After the hub owner first enters `hub-platform`, route them to a required onboarding flow before they can use normal monetized/scheduling workflows.

Recommended route:

- `/{hubSlug}/admin/onboarding`

or a dedicated first-run checkpoint within the admin shell.

### Onboarding step contents

Regional onboarding should collect:

1. `Country`
2. `Timezone`
3. `Community currency`
4. `Formatting locale`

It may also collect site basics if that fits the onboarding journey, but the regional step should be clearly separated.

### Launch locale policy

For launch, locale options must remain English-only.

Recommended default:

- `en-GB`

Allowed launch options:

- `en-GB`
- `en-US`
- optionally `en-CA`
- optionally `en-AU`

Do **not** expose:

- `es-ES`
- `de-DE`
- `fr-FR`
- other non-English formatting locales

unless multilingual product support becomes an intentional product feature.

### Country/timezone/currency behavior

- selecting country suggests a default timezone and default currency
- selecting country does **not** force a non-English locale
- timezone remains editable
- currency remains editable only within allowed community currencies for that market, if you keep market restrictions

## Workflow gating rules

Until `regionalSetupStatus === "complete"`, the following should be blocked or redirected to onboarding:

- `/admin/events`
- `/admin/events/create`
- `/admin/events/series/*`
- `/admin/courses`
- `/admin/courses/create`
- `/admin/payments`
- membership plan creation/editing
- Stripe Connect setup
- any flow that relies on scheduling or community currency defaults

Recommended admin behavior:

- dashboard can still load
- settings overview can still load
- onboarding route is fully accessible
- blocked routes should show a clear onboarding-required state with a CTA back to onboarding

## Stripe implications

### Product-site Stripe

- SaaS billing is `GBP` only
- product-site Stripe pricing and account pages stay simple

### Hub-platform Stripe Connect

Stripe Connect country must come from completed hub onboarding, not from SaaS signup.

Therefore:

- Connect setup must remain unavailable until `regionalSetupStatus === "complete"`
- once onboarding is complete, `hub.country` becomes the source of truth for connected account creation
- the existing “country locked after onboarding starts” rule still applies

## Default data reconciliation after onboarding

When onboarding completes, reconcile any provisional regional defaults that were created before configuration.

### Safe reconciliation targets

1. Default free membership plan
- if the default plan is still free, update its `currency` to `hub.defaultCurrency`

2. Empty or unmodified create-form defaults
- future form seeds will already follow the updated hub settings

### Do not rewrite historical commercial records

Do not mutate:

- historical payment records
- historical transaction currencies
- existing paid offerings that were intentionally configured

Only reconcile safe derived defaults created before onboarding completed.

## Country support model for launch

Keep a country registry, but do not tie it to multilingual locale behavior.

Recommended launch levels:

### Tier 1: primary launch markets

- United Kingdom
- United States
- Canada
- Australia

### Tier 2: available but English-only

Selected non-English countries can still be allowed for community setup if:

- legal/compliance review is acceptable
- Stripe support is acceptable
- timezone/currency mapping is correct
- the client is clearly told the product and support remain English-only

Examples:

- Spain
- Germany
- France
- Ireland
- Netherlands
- Belgium
- Austria
- Nordics

### Tier 3: unsupported/manual review

Countries not yet ready for launch due to:

- compliance uncertainty
- payment/risk concerns
- support burden
- sanctions/manual review concerns

## Data model and naming recommendation

If renaming is too disruptive before launch, keep the existing field name:

- `locale`

But treat it semantically as:

- English formatting locale for launch

Longer term, a clearer model would be:

```js
{
  language: "en",
  formatLocale: "en-GB"
}
```

For launch, avoid broad renaming churn unless necessary. Behavioral correctness matters more than perfect naming.

## Detailed execution order

### Phase 1: lock product-site to SaaS billing only

1. Remove hub regional fields from `/pricing` and `/signup`.
2. Remove server/client hub region guessing from `product-site`.
3. Convert Stripe SaaS price config and package docs to `GBP` only.
4. Ensure account/package/billing pages show only GBP SaaS pricing.

### Phase 2: create provisional hub setup state

1. Adjust hub creation to stop trusting product-site for hub regional settings.
2. Create hubs with provisional regional values plus `regionalSetupStatus: "required"`.
3. Keep SaaS account creation and hub provisioning independent from hub regional selection.

### Phase 3: build required hub onboarding

1. Add onboarding route/state.
2. Add regional setup form in hub admin.
3. Save:
  - country
  - timezone
  - defaultCurrency
  - English formatting locale
4. Mark `regionalSetupStatus: "complete"` when saved successfully.

### Phase 4: gate critical workflows

1. Redirect blocked admin routes to onboarding until setup is complete.
2. Block Stripe Connect setup before onboarding completion.
3. Add clear onboarding-required UI states.

### Phase 5: restrict locale behavior to English-only

1. Remove non-English locale options from launch-facing forms.
2. Update country mapping so country no longer auto-implies non-English locale.
3. Keep currency/timezone local per country.

### Phase 6: reconcile provisional defaults

1. Update default free membership plan currency after onboarding if needed.
2. Verify create/edit defaults across:
  - events
  - courses
  - membership plans
  - payments

### Phase 7: final audit and acceptance pass

Run end-to-end through:

1. product-site signup and GBP checkout
2. webhook/account sync
3. first login to hub admin
4. forced onboarding
5. post-onboarding creation of:
  - event
  - course
  - membership plan
6. Stripe Connect setup from completed hub country
7. public/member/admin date and currency behavior

## Acceptance criteria

The launch implementation is complete only when all of the following are true:

1. `product-site` pricing, signup, checkout, invoices, and account pages are GBP-only.
2. `product-site` does not ask for hub country/timezone/community currency/locale.
3. Hubs are created in a required onboarding state.
4. The hub owner must complete regional onboarding before monetized/scheduling-sensitive admin flows.
5. Hub onboarding sets:
  - country
  - timezone
  - defaultCurrency
  - English formatting locale
6. Hub date formatting stays English at launch, even for Spain/Germany/etc.
7. Hub currency and timezone behave locally for the selected country.
8. Stripe Connect setup uses hub onboarding country, not SaaS signup assumptions.
9. Existing hub-platform pricing forms seed from hub settings after onboarding completion.
10. Free membership/default-plan displays no longer leak placeholder currencies.

## Execution checklist by module

This checklist is the implementation-ready breakdown. Each item should be treated as incomplete until the code, tests, and route behavior all align.

### Phase 1 checklist: product-site SaaS billing only

#### `apps/product-site/src/lib/domain/package-pricing.js`

- [ ] Replace USD-only package catalog copy/data with GBP-only package pricing.
- [ ] Ensure `Free`, `Starter`, and `Growth` all expose GBP display labels.
- [ ] Remove country-to-package-currency logic entirely.

#### `apps/product-site/src/lib/domain/package-catalog.js`

- [ ] Ensure package cards always derive pricing from the GBP catalog.
- [ ] Remove any remaining regional package pricing branching.

#### `apps/product-site/src/lib/server/stripe.js`

- [ ] Replace package Stripe env resolution with GBP-only keys:
  - `STRIPE_PRICE_STARTER_GBP_MONTHLY`
  - `STRIPE_PRICE_GROWTH_GBP_MONTHLY`
- [ ] Remove tier-plus-country or tier-plus-currency package resolution logic that is no longer needed for SaaS billing.
- [ ] Keep strict preflight validation so missing GBP package prices fail safely.

#### `apps/product-site/src/lib/server/commercial-billing.js`

- [ ] Ensure package change flows and subscription sync assume GBP SaaS billing only.
- [ ] Remove stale references to USD-only SaaS assumptions.
- [ ] Confirm account billing summaries remain aligned with GBP package pricing.

#### `apps/product-site/src/app/(marketing)/pricing/page.jsx`

- [ ] Remove hub-region setup concerns from the pricing route.
- [ ] Keep the page purely about SaaS pricing and package selection.

#### `apps/product-site/src/components/patterns/package-catalog/PackageCatalog.jsx`

- [ ] Ensure package CTAs only carry the selected tier.
- [ ] Remove country/region propagation from pricing-card links.

#### `apps/product-site/src/components/patterns/package-catalog/PricingPackageExplorer.jsx`

- [ ] Remove remaining country-driven pricing behavior.
- [ ] Remove copy that implies the pricing page is configuring the hub region.
- [ ] Keep English-only product/support messaging if desired.

#### `apps/product-site/src/app/(marketing)/signup/page.jsx`

- [ ] Stop hydrating hub regional defaults from query params or request geolocation logic.
- [ ] Limit hydration to SaaS/account/package context only.

#### `apps/product-site/src/app/(marketing)/signup/SignupProvisionForm.jsx`

- [ ] Remove hub country, timezone, locale, and default currency controls.
- [ ] Keep the form focused on account/package creation.
- [ ] Keep package labels and summaries GBP-only.

#### `apps/product-site/src/app/(marketing)/signup/actions.js`

- [ ] Stop forwarding hub regional configuration into hub provisioning payloads.
- [ ] Continue passing SaaS package/account fields only.
- [ ] Ensure post-checkout pending state still works without regional signup fields.

#### `apps/product-site/src/app/(account)/*`

- [ ] Audit:
  - `account/page.jsx`
  - `account/package/page.jsx`
  - `account/billing/page.jsx`
  - `account/upgrade/page.jsx`
- [ ] Ensure all package pricing is GBP-only and uses the same package registry.

#### `apps/product-site/.env.example` and `apps/product-site/README.md`

- [ ] Update env docs to the GBP-only package price contract.
- [ ] Remove stale USD product-site pricing references.
- [ ] Keep Stripe webhook/setup instructions aligned with the active dev ports and routes.

### Phase 2 checklist: hub provisioning placeholder state

#### `apps/hub-platform/src/lib/domain/hubs.js`

- [ ] Ensure hub creation payload normalization supports provisional regional placeholders plus:
  - `regionalSetupStatus`
  - `regionalSetupCompletedAt`

#### `apps/hub-platform/src/lib/data/hub-mutations.js`

- [ ] Update hub creation to use placeholder regional values only.
- [ ] Mark every newly created hub as `regionalSetupStatus: "required"`.
- [ ] Ensure default membership plan creation uses the provisional hub currency consistently.

#### `apps/hub-platform/src/lib/data/hubs.js`

- [ ] Ensure hub reads expose:
  - `country`
  - `timezone`
  - `locale`
  - `defaultCurrency`
  - `regionalSetupStatus`
  - `regionalSetupCompletedAt`

#### `apps/product-site` to `apps/hub-platform` provisioning contract

- [ ] Remove hub regional fields from the provisioning request body.
- [ ] Confirm provisioning still succeeds with only package/account/hub identity data.

### Phase 3 checklist: hub onboarding flow

#### `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/onboarding/*`

- [ ] Create a dedicated onboarding route or flow shell.
- [ ] Add a first-run regional setup step.
- [ ] Save:
  - `country`
  - `timezone`
  - `defaultCurrency`
  - English formatting locale
- [ ] Mark onboarding complete with:
  - `regionalSetupStatus: "complete"`
  - `regionalSetupCompletedAt`

#### `apps/hub-platform/src/lib/domain/regional-markets.js`

- [ ] Keep country, currency, and timezone mappings.
- [ ] Restrict launch locale options to English-only values.
- [ ] Remove country-driven non-English locale defaults for launch.

#### `apps/hub-platform/src/lib/domain/site-settings.js`

- [ ] Rework regional validation to support English-only locale choices at launch.
- [ ] Keep country/timezone/currency validation intact.

#### `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/settings/site/*`

- [ ] Ensure post-onboarding site settings still allow safe edits.
- [ ] Keep the Stripe country lock rule after onboarding/Connect begins.

### Phase 4 checklist: gating and access control

#### `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/layout.jsx`

- [ ] Introduce onboarding-required detection at the admin shell level.
- [ ] Make the onboarding route itself accessible while gated.

#### Route pages to gate

- [ ] `admin/events/page.jsx`
- [ ] `admin/events/create/*`
- [ ] `admin/events/series/*`
- [ ] `admin/courses/page.jsx`
- [ ] `admin/courses/create/*`
- [ ] `admin/payments/page.jsx`
- [ ] membership plan management surfaces

For each route:

- [ ] Redirect to onboarding or render a locked onboarding-required state when `regionalSetupStatus !== "complete"`.

#### `apps/hub-platform/src/lib/server/hub-payment-connect.js`

- [ ] Block Stripe Connect account creation before onboarding completion.
- [ ] Continue to require explicit hub country for Connect creation after onboarding is complete.

### Phase 5 checklist: hub defaults and monetization surfaces

#### Event flows

- [ ] `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/events/create/CreateEventForm.jsx`
- [ ] `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/events/[eventId]/EditEventForm.jsx`
- [ ] `apps/hub-platform/src/components/patterns/event-form-fields/EventFormFields.jsx`
- [ ] `apps/hub-platform/src/lib/domain/events.js`

Checks:

- [ ] currency seeds from hub settings after onboarding
- [ ] scheduling uses hub timezone assumptions correctly
- [ ] public/admin price formatting remains English but currency-correct

#### Course flows

- [ ] `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/courses/create/CreateCourseForm.jsx`
- [ ] `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/courses/[courseId]/EditCourseForm.jsx`
- [ ] `apps/hub-platform/src/components/patterns/course-form-fields/CourseFormFields.jsx`
- [ ] `apps/hub-platform/src/lib/domain/courses.js`

Checks:

- [ ] timezone seeds from hub settings after onboarding
- [ ] currency seeds from hub settings after onboarding
- [ ] date formatting stays English-only

#### Membership/payment flows

- [ ] `apps/hub-platform/src/components/patterns/hub-payments-workspace/MembershipPlanManager.jsx`
- [ ] `apps/hub-platform/src/components/patterns/hub-payments-workspace/hub-payments-helpers.js`
- [ ] `apps/hub-platform/src/lib/data/membership-plans.js`
- [ ] `apps/hub-platform/src/lib/domain/memberships.js`

Checks:

- [ ] default plan currency uses hub currency after onboarding
- [ ] paid plan creation seeds from hub currency
- [ ] all money formatting stays English but currency-correct

### Phase 6 checklist: date formatting and locale cleanup

#### Shared formatting modules

- [ ] `apps/hub-platform/src/lib/domain/events.js`
- [ ] `apps/hub-platform/src/lib/domain/courses.js`
- [ ] `apps/hub-platform/src/lib/domain/public-events.js`
- [ ] `apps/hub-platform/src/lib/domain/public-courses.js`
- [ ] `apps/hub-platform/src/lib/domain/memberships.js`
- [ ] `apps/hub-platform/src/lib/domain/member-account.js`

Checks:

- [ ] no launch flow produces Spanish/German/French day or month names
- [ ] English date formatting remains consistent
- [ ] local timezone and local currency still work

#### Public/member/admin surfaces to verify

- [ ] event detail pages
- [ ] course detail pages
- [ ] event/course listing pages
- [ ] member account/payment history
- [ ] admin dashboard cards
- [ ] admin payments reporting

### Phase 7 checklist: tests and contracts

#### Product-site tests

- [ ] update package pricing source tests for GBP-only assumptions
- [ ] remove tests that assume signup configures hub regional state
- [ ] keep checkout/account sync coverage intact

#### Hub-platform tests

- [ ] add onboarding-required route coverage
- [ ] add hub creation placeholder regional-state coverage
- [ ] add onboarding completion state-transition coverage
- [ ] update monetization tests for post-onboarding seeding
- [ ] add English-only locale policy coverage

Recommended files to update:

- [ ] `apps/hub-platform/tests/unit/regional-markets-domain.test.js`
- [ ] `apps/hub-platform/tests/unit/site-settings-domain.test.js`
- [ ] `apps/hub-platform/tests/unit/admin-monetisation-ux.test.js`
- [ ] `apps/hub-platform/tests/unit/member-account-domain.test.js`
- [ ] `apps/hub-platform/tests/unit/events-domain.test.js`
- [ ] `apps/hub-platform/tests/unit/courses-domain.test.js`
- [ ] `apps/hub-platform/tests/unit/member-join-membership-contracts.test.js`

### Phase 8 checklist: final end-to-end verification

- [ ] sign up on `product-site`
- [ ] complete GBP Stripe SaaS checkout
- [ ] confirm account/subscription sync
- [ ] enter the new hub
- [ ] confirm onboarding is required
- [ ] complete onboarding with a non-UK country such as Spain
- [ ] verify:
  - `country = ES`
  - `timezone = Europe/Madrid`
  - `defaultCurrency = EUR`
  - `locale = en-GB` or chosen English locale
- [ ] create:
  - event
  - course
  - membership plan
- [ ] confirm all defaults follow hub settings
- [ ] confirm dates remain English
- [ ] confirm Stripe Connect setup uses the onboarded hub country

## Superseded earlier assumptions

This plan supersedes the earlier assumptions that:

- `product-site` should preconfigure hub regional defaults
- SaaS signup should collect hub country
- locale should be inferred directly from country
- SaaS billing and hub operating settings should share one setup flow

The launch-standard architecture is now:

- `product-site` = SaaS billing
- `hub-platform` = community operating configuration
