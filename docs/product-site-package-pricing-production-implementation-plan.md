# Product Site Package Pricing Production Implementation Plan

> Superseded launch note: product-site SaaS billing is now GBP-only. Active launch configuration uses `STRIPE_PRICE_STARTER_GBP_MONTHLY` and `STRIPE_PRICE_GROWTH_GBP_MONTHLY`; product-site signup no longer collects or seeds hub regional settings. Keep the historical USD strategy below only as background context.

## Status

This document has been superseded by:

- [saas-billing-and-hub-onboarding-launch-implementation-plan.md](/mnt/c/local/community-app/docs/saas-billing-and-hub-onboarding-launch-implementation-plan.md)

The current launch direction is:

- `product-site` SaaS billing is `GBP-only`
- `product-site` no longer configures hub country, timezone, locale, or community currency during signup
- hub regional setup moves into required `hub-platform` onboarding

The older USD-only package-billing strategy below is retained only as historical context.

## Historical Objective

Keep `product-site` package billing intentionally simple:

- all Hubforj SaaS package pricing is shown in `USD`
- all Hubforj SaaS Stripe subscriptions bill in `USD`
- the selected signup `country` still seeds the created hub's:
  - `country`
  - `locale`
  - `timezone`
  - `defaultCurrency`
- the separate `hub-platform` payment domain remains region-aware for the client's community operations

This mirrors the product decision that the SaaS subscription itself is globally USD-denominated, while the client's own community can operate in its local market.

## Locked product decisions

1. `product-site` package billing is `USD-only`.
2. Pricing table, signup, checkout, subscription, invoices, and account pages must all show the same USD package amount.
3. Product-site `country` selection is for hub regional defaults, not SaaS subscription currency switching.
4. The backend is the source of truth for package billing and Stripe price resolution.
5. The hub created from signup must still inherit correct local regional defaults from the selected country.

## Why this split is correct

`product-site` and `hub-platform` solve different problems:

- `product-site`
  - markets Hubforj
  - sells the Hubforj SaaS subscription
  - can remain commercially simple with one billing currency
- `hub-platform`
  - runs the client's actual community
  - needs local country, locale, timezone, and default currency behavior

That means:

- a UK customer can pay Hubforj in USD
- that same customer can create a UK hub that operates in `en-GB`, `Europe/London`, and `GBP`

## Canonical product-site package contract

### Supported package prices

- `Free` -> `$0/month`
- `Starter` -> `$26/month`
- `Growth` -> `$66/month`

### Stripe contract

Required Stripe package price IDs:

- `STRIPE_PRICE_STARTER_USD_MONTHLY`
- `STRIPE_PRICE_GROWTH_USD_MONTHLY`

Legacy compatibility:
- none

Old unsuffixed Stripe price vars should not be reused for the USD-only product-site contract because they may point at pre-existing non-USD prices.

## Route-by-route behavior

### `/pricing`

- package prices are displayed in USD only
- visitor can choose `Country`
- changing country updates the regional defaults that will be used for the created hub
- changing country does **not** change SaaS package currency
- CTA carries:
  - `tier`
  - `country`

### `/signup`

- selected package is hydrated from query params
- package labels show USD prices
- `packageCurrency` is fixed to `USD`
- `country`, `locale`, `timezone`, and `defaultCurrency` remain editable for the hub being created
- paid package helper copy explicitly states that paid packages are billed in USD

### Stripe Checkout

- paid signups resolve the Stripe price from trusted server-side config
- checkout is created against the USD Stripe price for the selected tier
- if the USD price ID is missing, signup must fail safely before provisioning the paid checkout handoff

### `/account`, `/account/package`, `/account/billing`, `/account/upgrade`

- package summaries render from the same USD package pricing registry
- account package change flows resolve USD package prices consistently
- there is no product-site currency switching in the account area

## Regional behavior that must remain

Even though product-site billing is USD-only, signup must still carry correct hub regional defaults:

- `country`
- `locale`
- `timezone`
- `defaultCurrency`

These are persisted so the new hub behaves correctly inside `hub-platform` and on the hub's public-facing community site.

## Acceptance criteria

The product-site package-pricing implementation is production-ready only when all of the following are true:

1. `/pricing` always displays package prices in USD.
2. `/signup` always displays package prices in USD.
3. Stripe checkout for `Starter` and `Growth` always uses the USD Stripe price IDs.
4. Product-site account pages always show the same USD package amounts as pricing and signup.
5. Selecting a different country does not change SaaS billing currency.
6. Selecting a different country does update the created hub's `country`, `locale`, `timezone`, and `defaultCurrency`.
7. Hub-platform continues to use those stored regional defaults throughout the client community experience.
8. Missing USD Stripe price configuration fails safely with a clear operational error.

## Notes

This document supersedes the earlier multi-currency product-site package pricing direction. Multi-currency behavior remains relevant to `hub-platform` community commerce, not to Hubforj's own SaaS subscription billing on `product-site`.
