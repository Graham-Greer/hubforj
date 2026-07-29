# Locale, Currency, and Stripe Regionalization Production Implementation Plan

> Superseded launch note: product-site billing and checkout no longer localize by visitor country. Hubforj SaaS package billing is GBP-only, while hub-platform regional settings remain active for community country, timezone, locale, and member-facing currency. Treat this document as historical regionalization context, not the current product-site billing contract.

## Objective

Implement a production-grade regionalization model across `product-site` and `hub-platform` so that:

- the product can infer a likely region for a new client
- the client explicitly confirms the region during setup
- the hub stores one canonical regional configuration
- all new commercial records default from that configuration
- all Stripe usage uses the same canonical locale and currency rules
- the system no longer relies on UK-biased fallback behavior except as a last-resort technical safety

This plan assumes the product is still in development and the database can be wiped before rollout. No backwards-compatible migration path is required.

## Production target

At the end of this work:

- `product-site` infers a likely `country`, `timezone`, `locale`, and `defaultCurrency` for a visitor
- hub creation on `product-site` shows those values as prefilled defaults and requires confirmation
- the created hub stores:
  - `country`
  - `timezone`
  - `locale`
  - `defaultCurrency`
- `hub-platform` uses those hub settings as the single source of truth for:
  - public date and currency formatting
  - paid event defaults
  - paid course defaults
  - membership plan defaults
  - recurring event timezone behavior
  - Stripe checkout and transaction currency behavior
- Stripe usage on both apps is regionally consistent

## Non-negotiable rules

1. Detection is only a starting guess.
- Browser or request signals may prefill values.
- They must not remain the canonical source of truth after hub creation.

2. The hub owns the canonical regional configuration.
- Runtime payment and formatting logic must read from the hub.
- Do not let separate forms or Stripe utilities invent their own regional defaults.

3. Currency must not be inferred from locale at payment time.
- Locale controls formatting.
- Currency controls commercial behavior.
- They are related but not interchangeable.

4. Stripe must use persisted business settings, not visitor guesses.
- A later visitor from another country must not change a hub's Stripe checkout currency or locale.

5. Hardcoded `GBP`, `en-GB`, and `Europe/London` values must be removed from normal business flows.
- They may remain only as defensive last-resort fallbacks in low-level helpers.

6. Stripe capability support must be modeled explicitly by country.
- Do not use one flat "Stripe-supported countries" list.
- Country support must be evaluated per actual product capability.

7. Hub country must be confirmed before Stripe Connect account creation.
- `hub.country` cannot be left implicit when creating connected accounts.

8. Stripe Connect account country must be treated as effectively immutable in self-serve product flows.
- Once Connect onboarding has started, self-serve country changes must be blocked unless a dedicated support-led reprovisioning flow exists.

## Current-state audit summary

The current implementation is not production-safe for regional defaults:

- hub creation persists `timezone` and `locale`, but not `country` or `defaultCurrency`
- hub creation defaults locale to `en-GB`
- many event, course, membership, payment, and Stripe helpers default currency to `GBP`
- normal admin settings do not expose canonical hub locale/timezone/currency management
- `product-site` and `hub-platform` currently have no shared regional configuration contract

## Canonical data model

Add the following fields to the hub record:

```js
{
  country: "GB",
  timezone: "Europe/London",
  locale: "en-GB",
  defaultCurrency: "GBP"
}
```

### Field rules

#### `country`

- ISO 3166-1 alpha-2
- represents the client's business/home region for this hub
- used for setup defaults, Stripe account context, and operational configuration

#### `timezone`

- IANA timezone string
- used for scheduling, recurring event generation, exports, and date/time displays

#### `locale`

- BCP 47 locale string
- used for human-readable formatting only

#### `defaultCurrency`

- ISO 4217 currency code
- used as the default currency for new paid offerings and platform-tracked payments

## Source-of-truth hierarchy

Required resolution order:

1. explicit record-level value
- event currency
- course currency
- membership plan currency
- payment record currency

2. hub-level canonical regional settings
- `hub.defaultCurrency`
- `hub.locale`
- `hub.timezone`

3. technical fallback only
- `USD`
- `en-US`
- `America/New_York`

The goal is that level 3 is almost never reached in real use.

Important distinction:

- the technical fallback should be USD-based
- that does not mean every unknown visitor should be treated as a US business
- country support and onboarding validation must still remain explicit

## Detection model

### Product-site detection

When a new visitor lands on `product-site`, infer likely defaults from:

- browser locale
- browser timezone
- request `Accept-Language`
- optional explicit country picker if you already expose one

Recommended inferred shape:

```js
{
  inferredCountry: "GB",
  inferredTimezone: "Europe/London",
  inferredLocale: "en-GB",
  inferredCurrency: "GBP",
  inferenceConfidence: "high" | "medium" | "low"
}
```

### Best-practice rule

Detection should prefill setup but not silently commit configuration.

Required UX:

- prefill the regional fields on account/hub creation
- show them explicitly
- allow the client to change them before creating the hub

## Regional mapping layer

Create one shared regional mapping contract.

This layer must be backed by an explicit supported-country registry rather than ad hoc conditionals.

Recommended utility:

- `resolveRegionalDefaults({ country, locale, timezone, requestHints })`

Responsibilities:

- normalize the region model
- map `country -> defaultCurrency`
- map `locale -> likely country` only when country is absent
- map `timezone -> likely country` only when locale and country are absent
- validate supported combinations

Recommended output:

```js
{
  country: "GB",
  timezone: "Europe/London",
  locale: "en-GB",
  defaultCurrency: "GBP",
  source: {
    country: "explicit" | "locale_guess" | "timezone_guess" | "fallback",
    timezone: "explicit" | "browser" | "fallback",
    locale: "explicit" | "browser" | "header" | "fallback",
    defaultCurrency: "explicit" | "country_map" | "fallback"
  }
}
```

This mapping logic should live in a shared domain module or be duplicated carefully with test parity if cross-app sharing is not yet practical.

### Supported-country registry

Create a maintained country registry derived from Stripe-supported countries and your own launch policy.

Recommended artifact:

- `supportedRegionalMarkets`

Recommended shape:

```js
[
  {
    country: "AU",
    label: "Australia",
    defaultLocale: "en-AU",
    allowedLocales: ["en-AU"],
    defaultTimezone: "Australia/Sydney",
    allowedTimezones: [
      "Australia/Sydney",
      "Australia/Melbourne",
      "Australia/Brisbane",
      "Australia/Perth",
      "Australia/Adelaide"
    ],
    defaultCurrency: "AUD",
    allowedCurrencies: ["AUD"],
    stripe: {
      connectSupported: true,
      selfServeConnectSupported: true,
      packageCheckoutSupported: true
    }
  },
  {
    country: "DE",
    label: "Germany",
    defaultLocale: "de-DE",
    allowedLocales: ["de-DE", "en-DE"],
    defaultTimezone: "Europe/Berlin",
    allowedTimezones: ["Europe/Berlin"],
    defaultCurrency: "EUR",
    allowedCurrencies: ["EUR"],
    stripe: {
      connectSupported: true,
      selfServeConnectSupported: true,
      packageCheckoutSupported: true
    }
  },
  {
    country: "ZA",
    label: "South Africa",
    defaultLocale: "en-ZA",
    allowedLocales: ["en-ZA"],
    defaultTimezone: "Africa/Johannesburg",
    allowedTimezones: ["Africa/Johannesburg"],
    defaultCurrency: "ZAR",
    allowedCurrencies: ["ZAR"],
    stripe: {
      connectSupported: true,
      selfServeConnectSupported: true,
      packageCheckoutSupported: true
    }
  }
]
```

### Registry rules

1. A country must not appear in the selectable product list unless it is explicitly supported in the registry.

2. The registry must be seeded from Stripe-supported countries for the relevant Stripe capabilities you use:
- package checkout on `product-site`
- Connect onboarding in `hub-platform`
- the currencies you can safely present and settle for those markets

3. Stripe support is necessary but not always sufficient.
- A country may be Stripe-supported but still excluded from the product if tax, support, legal, or operational readiness is incomplete.

4. The product must expose a detailed country selector from this registry.
- Clients should be able to select from a real list of supported countries, not just free-text entry.

5. Locale, timezone, and currency defaults must be generated from the selected registry entry.

### Initial registry creation

Create the first registry by:

1. pulling the current Stripe-supported country set for the relevant account types and flows
2. intersecting that with your intended launch markets
3. assigning:
- canonical label
- default locale
- allowed locales
- default timezone
- allowed timezones
- default currency
- allowed currencies
- Stripe capability flags

4. reviewing the result manually before shipping

### Ongoing maintenance

Because Stripe availability changes over time, the registry must be treated as maintained product configuration.

Required practice:

- document the Stripe source pages used to build the registry
- review the registry on a scheduled cadence or before expanding markets
- update product validation and admin copy when Stripe country support changes

## Product-site implementation

### Workstream 1: regional hint capture

Add request/browser regional hint capture to `product-site`.

Recommended implementation:

- server-side:
  - read `Accept-Language`
- client-side:
  - read `navigator.language`
  - read `Intl.DateTimeFormat().resolvedOptions().timeZone`
- merge server and client hints into one setup-defaults model

### Workstream 2: hub/account creation form changes

Extend the relevant `product-site` creation flow to capture:

- country
- timezone
- locale
- default currency

Rules:

- all four fields should be visible and editable
- the country field should be a searchable select sourced from the supported-country registry
- default currency should default from country
- changing country should update suggested timezone, locale, and currency until the user manually overrides them
- once the user manually overrides a field, auto-sync should stop for that field

For countries with multiple meaningful operational timezones, the timezone field should switch from one default value to a country-scoped timezone select.

### Workstream 3: provisioning contract changes

Extend the product-site to hub provisioning payload so the created hub stores:

- `country`
- `timezone`
- `locale`
- `defaultCurrency`

The provisioning contract should reject incomplete regional payloads for new hubs.

### Workstream 4: product-site Stripe checkout

Review every package-checkout path in `product-site` and ensure:

- Stripe Checkout locale is set from the confirmed setup locale where supported
- customer email and billing context are aligned to the commercial account
- any package/pricing presentation shown before checkout uses the same locale formatting model

Locked constraint:

- package checkout must not rely on passive geolocalized currency selection alone
- the confirmed selected country and default currency must drive checkout behavior explicitly

Important boundary:

- package price IDs may still be environment-driven and Stripe-managed
- do not redesign subscription catalog structure unless required
- the immediate requirement is consistent locale and customer-region handling, not dynamic multi-currency subscriptions unless that is already intended commercially

Locked Stripe decision:

- the product-site billing model must be implemented as one of these two explicit catalog strategies:
  - multi-currency Stripe Prices per package tier with explicit checkout currency
  - per-region price mapping by package tier
- do not leave package currency behavior implicit inside Stripe Checkout auto-localization

## Hub-platform implementation

### Workstream 5: hub domain model and persistence

Extend hub normalization, persistence, and read models to include:

- `country`
- `timezone`
- `locale`
- `defaultCurrency`

Update all hub read helpers so the canonical hub object always exposes them.

### Workstream 6: admin regional settings surface

Add a dedicated admin settings surface for regional configuration.

Recommended section:

- `Regional settings`

Required fields:

- country
- timezone
- locale
- default currency

Rules:

- changing locale affects formatting only
- changing timezone affects future scheduling and display behavior
- changing default currency affects defaults for newly created paid records only
- existing paid records must not be silently rewritten to a new currency

### Workstream 7: offering and membership defaults

Replace current paid-form hardcoded defaults with hub-derived defaults.

This includes:

- event create form
- recurring event series create/edit form
- course create form
- membership plan create defaults

Required behavior:

- new paid event currency defaults to `hub.defaultCurrency`
- new paid course currency defaults to `hub.defaultCurrency`
- new paid membership plan currency defaults to `hub.defaultCurrency`
- edit forms continue preserving each existing record's stored currency

### Workstream 8: timezone defaults

Replace UK-biased scheduling defaults with hub-derived defaults.

Required behavior:

- new course forms default timezone to `hub.timezone`
- new recurring event forms default timezone to `hub.timezone`
- recurring series generation and updates always use `hub.timezone` unless the series explicitly stores its own confirmed timezone

### Workstream 9: public and admin formatting

Audit all date, time, and money formatting so they prefer:

- explicit record currency
- `hub.locale`
- `hub.timezone` where relevant

This includes:

- public listing cards
- public detail pages
- member account surfaces
- admin overview cards
- payments workspace
- CSV export formatting where locale matters

### Workstream 10: payment record normalization

Update ledger and payment normalization so missing currency falls back to:

- record currency if present
- otherwise `hub.defaultCurrency`
- only then final technical fallback

The final technical fallback currency must be `USD`.

This applies to:

- payment records
- native payment transactions
- booking payment snapshots
- course registration payment snapshots
- membership payment snapshots

## Stripe implementation across both apps

### Guiding rule

Stripe should consume the same canonical regional model as the rest of the product.

### Product-site Stripe

Ensure:

- checkout locale follows confirmed setup locale where Stripe supports it
- customer billing context aligns with commercial account region data
- any new commercial account created during checkout stores or confirms regional settings before hub provisioning

### Hub-platform Stripe Connect and checkout

Ensure:

- Stripe Connect onboarding uses the hub's canonical region fields
- event booking checkout uses the booking or event currency, which should default from `hub.defaultCurrency`
- course checkout uses the course currency, which should default from `hub.defaultCurrency`
- membership upgrade checkout uses the plan currency, which should default from `hub.defaultCurrency`
- any Stripe session locale is set from `hub.locale` where supported

Locked Stripe decisions:

- connected Express accounts must be created with explicit `country`
- if `hub.country` is missing, Connect account creation must fail
- self-serve country changes must be blocked after Connect onboarding starts unless a separate support path is built

### Stripe constraints review

Before implementation is considered complete, explicitly verify:

- whether product-site subscriptions are single-currency only or support regional price catalogs
- whether hub-platform native payments should allow per-offering currency overrides across all supported regions
- whether Connect account country restrictions should limit allowed hub currency combinations

If any of those constraints are tighter than the desired product behavior, the plan must adjust the commercial rules rather than hiding the limitation in code.

Resolved interpretation for this plan:

- Connect country support is capability-specific and must be registry-driven
- package billing catalog limitations are real and must be handled through an explicit catalog strategy
- country-by-capability differences are a first-class part of the product model, not an implementation detail

### Required Stripe policy decisions

Before production rollout, make these decisions explicit in product rules and admin copy:

1. Connect account country mutability
- In many Stripe setups, connected account country is effectively fixed after onboarding.
- If that is true for your implementation, changing `hub.country` after Connect onboarding must either:
  - be blocked
  - or require a clearly separate support-led reprovisioning flow

Locked decision for this implementation:

- block self-serve `hub.country` changes after Connect onboarding starts
- do not attempt automatic connected-account country migration in v1

2. Hub default currency mutability
- If a hub has already taken live payments, changing `hub.defaultCurrency` must not rewrite historical records.
- The product should treat this as a future-defaults change only.
- Consider requiring elevated confirmation once a hub has any paid commercial records.

Locked decision for this implementation:

- `hub.defaultCurrency` remains editable for future defaults
- historical records must never be rewritten
- once a hub has live paid records, changing default currency must require explicit elevated confirmation

3. Product-site subscription catalog scope
- If Stripe package checkout uses one fixed price ID per package tier, product-site subscriptions may be single-currency for v1.
- If so, the product must say so explicitly and keep subscription billing scope separate from hub offering currency scope.

Locked decision for this implementation:

- product-site package billing and hub offering currencies are related but separate layers
- if the package catalog is narrower than hub offering support, the UI and validation must state that explicitly

4. Tax and billing-address ownership
- If taxes, VAT, or sales-tax behavior will matter in your launch markets, confirm whether Stripe customer billing country, business country, and hub country must match or may differ.
- Do not leave that behavior implicit.

Locked decision for this implementation:

- tax and billing-country behavior must be documented before market expansion beyond the initial supported-country set
- do not silently assume billing country, business country, and hub country are interchangeable

## Validation rules

### Required validation

- `country` must be a supported ISO country code
- `timezone` must be a supported IANA timezone
- `locale` must be from the supported locale set
- `defaultCurrency` must be a supported ISO currency code

### Cross-field validation

- the chosen `defaultCurrency` must be allowed for the chosen `country` under your Stripe/commercial rules
- if locale is unsupported for a selected country, show a clear validation message
- if timezone does not plausibly belong to the selected country, allow override but warn rather than hard-fail

### Safe initial support scope

For production quality, it is acceptable to launch with a bounded supported region set first.

Example:

- GB / Europe/London / en-GB / GBP
- US / America/New_York plus allowed US zones / en-US / USD
- selected EU regions as explicitly supported

The important thing is consistency and explicit support boundaries.

The important implementation refinement is:

- the UI should still expose a detailed list of supported main countries
- but that list must come from the Stripe-backed registry, not from an unrestricted world-country list

Locked decision for this implementation:

- only countries explicitly present in the Stripe-backed supported-country registry may be selected during signup or hub regional configuration
- inferred unsupported countries must degrade to explicit supported-country selection

## Admin change policy

The admin experience must define what happens when regional settings change after launch.

### Country

- if no Stripe Connect account or live billing relationship exists, allow change
- if Stripe onboarding or live paid billing already exists, block self-serve change or route it to support

### Timezone

- allow change
- show that future scheduling and recurring generation behavior will use the new timezone
- do not silently rewrite past occurrence history

### Locale

- allow change
- treat it as formatting-only

### Default currency

- allow change for future defaults
- do not rewrite historical records
- if the hub already has live paid offerings, require explicit confirmation

## Database reset strategy

Because the product is still in development:

- update the hub schema directly
- remove temporary compatibility logic once the new path is stable
- wipe and reseed the environment
- recreate test hubs through the new product-site setup path

Do not spend implementation effort on:

- legacy backfill scripts
- mixed old/new hub record compatibility beyond short-lived local dev convenience

## Test plan

### Unit tests

Add or update tests for:

- supported-country registry integrity and required fields
- regional default resolution from a selected supported country
- regional default resolution from country, locale, and timezone hints
- hub creation payload normalization
- hub read normalization exposing regional fields
- event create defaults using `hub.defaultCurrency`
- course create defaults using `hub.defaultCurrency`
- membership defaults using `hub.defaultCurrency`
- recurring series timezone behavior using `hub.timezone`
- payment record normalization preferring hub currency over `USD` fallback
- public formatting using `hub.locale`
- Stripe session builders receiving the expected `currency` and `locale`

### Integration tests

Add end-to-end coverage for:

1. product-site visitor with UK hints
- setup prefilled to GB / Europe/London / en-GB / GBP
- hub created with those values

2. product-site visitor with US hints
- setup prefilled to US / US timezone / en-US / USD
- hub created with those values

3. hub owner creates a paid event
- event defaults to hub currency
- checkout session uses event currency

4. hub owner creates a paid course
- course defaults to hub currency
- checkout session uses course currency

5. hub owner creates a paid membership plan
- plan defaults to hub currency
- upgrade checkout uses plan currency

6. admin changes hub locale
- formatting changes
- existing stored currencies do not mutate

7. client selects a supported detailed country
- country selector shows entries such as Australia, Germany, and South Africa when supported
- locale, timezone, and currency defaults update from the selected country registry entry

8. unsupported country handling
- unsupported countries are not offered in the selectable list
- detection can suggest a region, but setup still requires selection from the supported registry when the inferred country is unsupported

### Manual QA

Required manual checks:

- product-site first-visit setup defaults
- explicit override behavior when country changes
- product-site Stripe checkout locale presentation
- hub-platform event/course/plan creation defaults
- hub-platform public money formatting
- admin overview revenue formatting
- Stripe Connect onboarding consistency for different test regions

## Rollout sequence

### Phase 1: canonical model

- add hub fields
- add regional mapping utilities
- update hub read/write contracts

### Phase 2: product-site setup

- add region detection
- add setup form fields
- update provisioning payload

### Phase 3: hub-platform defaults

- add admin regional settings
- switch event/course/membership defaults to hub-derived values
- switch recurring timezone defaults to hub-derived values

### Phase 4: Stripe alignment

- align product-site checkout locale handling
- align hub-platform Stripe checkout and Connect builders
- validate supported country/currency rules

### Phase 5: hardening

- remove stray hardcoded UK defaults from normal paths
- complete regression testing
- wipe database
- recreate reference hubs

## Module-by-module implementation checklist

This checklist is the execution-level breakdown. The product should not be considered production-ready until every applicable item here is complete and verified.

### Product-site: regional model and signup

#### `apps/product-site/src/lib/domain/signup.js`

- replace current hardcoded signup regional defaults
- add normalized signup payload support for:
  - `country`
  - `timezone`
  - `locale`
  - `defaultCurrency`
- add helper(s) to merge inferred regional hints with explicit user selections
- add dirty-override behavior so auto-suggested values stop overwriting manually changed fields

#### `apps/product-site/src/app/(marketing)/signup/SignupProvisionForm.jsx`

- add a searchable supported-country selector
- add locale selector scoped to selected country
- add timezone selector scoped to selected country
- add default-currency field driven by selected country and support rules
- make the regional fields explicit in the signup/provisioning flow
- show validation and support copy when a country is unsupported or partially supported

#### `apps/product-site/src/app/(marketing)/signup/actions.js`

- capture the new regional fields from form submission
- pass the confirmed regional payload into hub provisioning
- persist the same values into the commercial account context if that context is used before hub creation completes
- reject incomplete or unsupported combinations

#### `apps/product-site/src/lib/server/provision-hub.js`

- extend the provisioning payload contract so it sends:
  - `country`
  - `timezone`
  - `locale`
  - `defaultCurrency`
- fail clearly if regional payload is incomplete

#### `apps/product-site/src/lib/data/commercial-accounts.js`

- extend commercial-account persistence where useful to retain regional setup context before or alongside hub provisioning
- ensure any stored pre-hub commercial context can round-trip the selected region cleanly

#### `apps/product-site/src/lib/domain/commercial-accounts.js`

- normalize regional fields if commercial-account domain objects expose setup state
- ensure no separate competing regional default logic exists here

### Product-site: regional detection

#### New recommended module

- `apps/product-site/src/lib/domain/regional-markets.js`

Create:

- `supportedRegionalMarkets`
- `resolveRegionalDefaults(...)`
- `getSupportedCountryOptions()`
- `getCountryRegionalConfig(country)`
- `getAllowedLocalesForCountry(country)`
- `getAllowedTimezonesForCountry(country)`

#### New recommended module

- `apps/product-site/src/lib/server/regional-hints.js`

Create:

- server-side `Accept-Language` parsing
- request-level hint extraction
- normalized regional-hint object for signup flows

#### Signup route layer

- thread server-side hints into the signup page and form
- add client-side browser timezone and language refinement after hydration
- ensure hydration does not clobber explicit user edits

### Product-site: Stripe package checkout

#### `apps/product-site/src/lib/server/stripe.js`

- document and enforce the Stripe regional assumptions used by package checkout
- ensure any Stripe helpers needed for locale-aware checkout session creation are present

Locked constraint:

- this module must expose the chosen package-catalog regional strategy clearly enough that billing logic cannot drift from it

#### `apps/product-site/src/lib/server/commercial-billing.js`

- ensure `stripe.checkout.sessions.create(...)` receives the confirmed locale where Stripe supports it
- ensure package checkout uses the commercial-account/hub regional model consistently
- explicitly document whether package billing is:
  - single-currency by package
  - or regionally priced
- fail safely if selected country is not compatible with the current package billing catalog

Locked constraints:

- do not create checkout sessions for unsupported country/currency combinations
- pass explicit currency if the chosen catalog strategy requires it
- do not rely on Checkout to infer the commercial currency correctly from browser state alone

#### `apps/product-site/src/app/(account)/account/upgrade/actions.js`

- ensure account upgrade flows reuse the same canonical regional model
- prevent drift between signup checkout and later upgrade checkout

#### `apps/product-site/src/app/(account)/account/billing/actions.js`

- ensure billing-management actions do not introduce a separate regional source of truth

### Hub-platform: hub schema and normalization

#### `apps/hub-platform/src/lib/domain/hubs.js`

- extend create/update normalization to require:
  - `country`
  - `timezone`
  - `locale`
  - `defaultCurrency`
- remove implicit assumption that locale/timezone alone are enough

#### `apps/hub-platform/src/lib/domain/hub-package-contracts.js`

- extend provisioning payload normalization to include the new regional fields
- ensure these fields survive end-to-end provisioning without silent dropping

#### `apps/hub-platform/src/lib/data/hubs.js`

- expose the canonical regional fields on all hub read models
- ensure platform, admin, and public read paths all receive the same normalized values

#### Internal provisioning API

Modules involved:
- `apps/hub-platform/src/lib/domain/internal-automation.js`
- corresponding internal provisioning routes under `src/app/api/internal` if present

Tasks:

- extend internal automation/provisioning contracts to accept the new regional fields
- reject invalid or missing regional configuration for new hubs

### Hub-platform: admin regional settings

#### New recommended admin surface

- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/settings/regional`

Create:

- `page.jsx`
- form component
- `actions.js`
- `form-state.js`

Required behavior:

- edit country, timezone, locale, default currency
- enforce change-policy rules from the plan
- block or warn when Stripe/paid-history constraints apply

#### `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/settings/page.jsx`

- add a settings overview card for regional configuration
- surface readiness or warning state if regional configuration is incomplete

### Hub-platform: public settings and presentation

#### `apps/hub-platform/src/lib/domain/public-site.js`

- expose canonical locale from the hub as before
- decide whether limited public-region presentation needs country metadata
- ensure no silent fallback hides missing hub locale in ordinary paths

#### `apps/hub-platform/src/lib/data/public-site.js`

- ensure public-site context always carries the normalized hub regional model
- ensure event and course listing/detail builders consume that model consistently

### Hub-platform: event defaults and event payments

#### `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/events/create/form-state.js`

- replace hardcoded `GBP` default with `hub.defaultCurrency`

#### `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/events/create/CreateEventForm.jsx`

- ensure initial values are seeded from hub regional settings where needed

#### `apps/hub-platform/src/components/patterns/event-form-fields/EventFormFields.jsx`

- update pricing defaults and currency hints to use `hub.defaultCurrency`
- update any timezone-related guidance if the event form later exposes timezone explicitly

#### `apps/hub-platform/src/lib/domain/events.js`

- keep explicit record currency normalization
- adjust fallback chain to prefer hub-derived defaults before technical fallback where appropriate in creation paths
- keep formatting locale-aware via `hub.locale`

#### `apps/hub-platform/src/lib/server/event-booking-checkout.js`

- ensure checkout session locale uses `hub.locale` where supported
- ensure charge currency comes from booking/event currency with hub-derived defaults upstream

#### `apps/hub-platform/src/lib/data/event-booking-mutations.js`
- ensure booking payment snapshots preserve the canonical event currency
- ensure fallback behavior no longer implicitly assumes GBP in normal paths

#### `apps/hub-platform/src/lib/data/event-booking-shared.js`
- update snapshot normalization fallback order to prefer hub/event currency over technical fallback

### Hub-platform: recurring event regional behavior

#### `apps/hub-platform/src/lib/domain/event-series.js`

- ensure recurring series creation and updates use `hub.timezone` as the default timezone source
- remove UK-biased scheduling default assumptions from ordinary paths

#### `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/events/series/[seriesId]/form-state.js`

- replace hardcoded currency default with hub-derived default

#### `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/events/series/[seriesId]/EditEventSeriesForm.jsx`

- ensure edit/create flows preserve explicit series currency and timezone while defaulting new data from the hub

#### `apps/hub-platform/src/lib/data/event-series-mutations.js`

- ensure persisted series records retain canonical regional settings cleanly

### Hub-platform: course defaults and course payments

#### `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/courses/create/form-state.js`

- replace hardcoded `GBP` default with `hub.defaultCurrency`

#### `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/courses/create/CreateCourseForm.jsx`

- keep timezone defaulting from `hub.timezone`
- ensure currency defaults also derive from the hub

#### `apps/hub-platform/src/components/patterns/course-form-fields/CourseFormFields.jsx`

- update pricing defaults and placeholders to reflect hub-derived currency
- ensure timezone control remains hub-derived by default

#### `apps/hub-platform/src/lib/domain/courses.js`

- preserve explicit course currency
- ensure formatting uses `hub.locale`
- keep fallback chain aligned with the new canonical model

#### `apps/hub-platform/src/lib/server/course-registration-checkout.js`

- set Stripe checkout locale from `hub.locale` where supported
- keep checkout currency aligned with course currency

#### `apps/hub-platform/src/lib/data/course-registration-mutations.js`
- remove ordinary-path assumptions that missing currency should mean GBP

#### `apps/hub-platform/src/lib/data/course-registration-shared.js`
- update registration/payment snapshot fallback order

### Hub-platform: membership defaults and membership payments

#### `apps/hub-platform/src/lib/domain/memberships.js`

- replace default membership plan currency seed with `hub.defaultCurrency`
- keep formatter fallback as technical safety only

#### `apps/hub-platform/src/lib/data/membership-plans.js`

- ensure plan persistence preserves explicit plan currency
- ensure create flows default from the hub

#### Membership plan admin forms

Relevant modules are under:
- `apps/hub-platform/src/app/(admin)/[hubSlug]/admin/payments`
- related membership plan components under `src/components/patterns`

Tasks:

- seed new plan defaults from `hub.defaultCurrency`
- preserve existing plan currency on edit

#### `apps/hub-platform/src/lib/server/membership-upgrade-checkout.js`

- set Stripe checkout locale from `hub.locale`
- ensure plan currency is respected end to end

#### `apps/hub-platform/src/lib/data/membership-shared.js`
- update payment snapshot normalization to prefer explicit plan currency and hub-derived defaults before technical fallback

### Hub-platform: payment ledger, revenue, and reporting

#### `apps/hub-platform/src/lib/data/payment-records.js`

- replace ordinary-path GBP fallback assumptions with:
  - explicit record currency
  - hub default currency
  - technical USD fallback

#### `apps/hub-platform/src/lib/data/native-payment-transactions.js`

- apply the same fallback order

#### `apps/hub-platform/src/lib/domain/payments.js`

- ensure revenue summary formatting uses the right locale and safe fallback model
- update zero-state summary formatting to avoid implying hub currency when hub currency should be known

#### `apps/hub-platform/src/lib/data/hub-admin.js`

- ensure `/admin` revenue and overview formatting use `hub.locale`
- ensure empty-state revenue summaries respect the new fallback policy and do not obscure missing regional configuration

#### `apps/hub-platform/src/lib/data/hub-payments.js`

- ensure payment workspace summaries, detail rows, and exports use canonical locale/currency behavior

### Hub-platform: Stripe Connect and webhooks

#### `apps/hub-platform/src/lib/server/stripe.js`

- document the canonical regional data required before Connect operations
- ensure helper interfaces allow locale/country-aware flows where relevant

#### `apps/hub-platform/src/lib/server/hub-payment-connect.js`

- ensure connected account creation/onboarding uses the hub's canonical region
- verify whether account country becomes immutable after onboarding and enforce product policy accordingly

Locked constraints:

- pass explicit account `country` on Express account creation
- refuse account creation when hub regional configuration is incomplete
- block self-serve country change once onboarding has started

#### `apps/hub-platform/src/lib/server/hub-payment-webhooks.js`

- ensure webhook reconciliation preserves canonical transaction currency behavior
- ensure no downstream reconciliation path silently backfills GBP

#### `apps/hub-platform/src/app/api/stripe/webhooks/route.js`

- no major regional logic should live here, but confirm webhook handling continues to work with expanded country/currency support

Locked constraint:

- webhook reconciliation must preserve the currency actually used by the originating record or Stripe object; it must never "normalize" back to a platform default country/currency assumption

### Cross-app shared product configuration

#### New recommended source

Create one canonical market-support definition that both apps can share directly, or mirror with strict test parity.

Recommended contents:

- supported country list
- locale rules
- timezone rules
- default currency rules
- Stripe capability flags
- any launch gating flags

Required Stripe capability flags:

- `packageCheckoutSupported`
- `connectExpressSupported`
- `connectExpressSelfServeSupported`
- `crossBorderPayoutRequired`
- `supportedPaymentCurrencies`
- `supportedTransferCountries`
- `requiresSupportReview`

If direct code sharing is not practical today, create:

- `apps/product-site/src/lib/domain/regional-markets.js`
- `apps/hub-platform/src/lib/domain/regional-markets.js`

and add parity tests that compare their behavior against the same fixtures.

### Tests by module

#### Product-site tests

- signup defaults and override behavior
- supported-country selector options
- provisioning payload completeness
- Stripe checkout locale usage
- unsupported-country degradation behavior

#### Hub-platform tests

- hub normalization with regional fields
- admin regional settings validation and policy
- event/course/membership default currency seeding
- recurring timezone behavior
- payment-record normalization fallback order
- Stripe checkout builders using locale and currency correctly

#### Cross-app fixture tests

- shared supported-country registry examples:
  - Australia
  - Germany
  - South Africa
  - United Kingdom
  - United States
- unsupported-country handling
- country with multiple timezones handling

## Final completion gate

Do not call the initiative complete until all of the following are true in a full end-to-end test environment:

1. A new client can sign up from a supported-country list and create a hub with confirmed regional settings.
2. The resulting hub stores canonical country, timezone, locale, and default currency values.
3. Product-site Stripe checkout behaves consistently with the confirmed regional setup.
4. Hub-platform create flows for events, recurring events, courses, and membership plans all default from the hub.
5. Hub-platform Stripe checkout and Connect flows behave consistently with the hub's canonical region.
6. Public formatting, member surfaces, admin reporting, and exports all reflect the canonical locale and explicit record currencies.
7. No ordinary operational path depends on a UK hardcoded default.
8. No ordinary operational path depends on the USD fallback except as a true last-resort safety case.
9. Unsupported countries degrade cleanly to explicit product-supported choices.
10. A fresh environment can be wiped, reseeded, and operated end to end without manual data patching.
11. Connect account creation fails safely when a selected country is not supported for the exact Connect capability in use.
12. Product-site package checkout fails safely when a selected country/currency combination is not supported by the active package catalog strategy.

## Acceptance criteria

This work is complete only when all of the following are true:

- a new client on `product-site` sees prefilled regional defaults
- the client confirms or edits those values before hub creation
- the created hub persists canonical regional fields
- `hub-platform` create flows default from those hub fields
- Stripe product-site checkout uses the confirmed locale path
- Stripe hub-platform flows use the record/hub currency consistently
- no ordinary commercial flow silently defaults to `USD` because a hub-level currency is missing
- no ordinary formatting flow silently defaults to `en-US` because a hub-level locale is missing

## Tradeoffs and deliberate decisions

### Why store both locale and currency

Because:

- one country can support multiple locales
- locale formatting does not determine commercial currency
- Stripe and accounting logic need explicit currency

### Why store hub-level defaults instead of only per-offering values

Because:

- repeated manual currency entry is error-prone
- cross-surface consistency matters commercially
- Stripe and reporting become safer when defaults are centralized

### Why keep record-level currency overrides

Because:

- existing commercial objects need stable currency identity
- future product rules may allow intentional per-offering overrides
- reporting should follow the record that was actually sold

## Known implementation risks

1. Stripe commercial constraints may be narrower than the desired product behavior.
- This must be validated explicitly during implementation.

2. Cross-app duplication can create drift.
- If `product-site` and `hub-platform` cannot share regional helpers directly, mirrored logic must have test parity.

3. Admin expectations around changing hub currency can be dangerous.
- The UI must state clearly that changing hub default currency affects future defaults, not historical records.

4. Incomplete removal of hardcoded regional fallbacks can produce subtle mixed behavior.
- A final codebase-wide audit is required before calling the work complete.

5. Subscription billing and hub commercial settings may not have the same regional rules.
- Product-site package billing can end up more constrained than hub-level event/course/payment currency behavior.
- If that happens, the product must model those as separate but compatible commercial layers.

6. Unsupported-country ambiguity can create broken guesses during signup.
- The detection layer must degrade to a bounded supported-country selector rather than pretending every inferred region is fully supported.

7. Stripe country support can differ by capability.
- A country may be valid for payments, but not for the exact Connect or self-serve onboarding flow you use.
- The registry must model capability-level support, not just one broad "Stripe supports this country" flag.

## Final recommendation

Build this as a single regionalization initiative across both apps, not as scattered local fixes.

The production-grade version is:

- infer once
- confirm once
- store once
- reuse everywhere

That is the cleanest way to make hub setup, offering creation, reporting, and Stripe behavior all agree.
