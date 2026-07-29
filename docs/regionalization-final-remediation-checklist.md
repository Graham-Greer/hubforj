# Regionalization Final Remediation Checklist

> Superseded launch note: this checklist captured the older multi-currency product-site regionalization track. Current launch behavior keeps product-site SaaS billing GBP-only and moves hub country, timezone, locale, and community currency setup into hub-platform onboarding/settings. Use this document only as historical context unless it is explicitly refreshed.

## Objective

Close the remaining production gaps across `product-site` and `hub-platform` so that:

- a client can sign up from a supported market
- package pricing, signup, and Stripe subscription billing stay regionally coherent
- hub country, locale, timezone, and default currency are persisted canonically
- Stripe Connect uses the correct hub country and country lock rules
- the hub admin, payments workspace, public site, and member flows all respect the stored regional configuration

This checklist is ordered by execution priority, not by architectural area.

## Exit rule

Do not treat the implementation as complete until:

- all checklist items below are complete
- the unit suite is green
- a fresh manual end-to-end flow passes for at least:
  - `US / USD`
  - `GB / GBP`
  - one `EUR` market such as `DE / EUR`
  - one non-USD, non-GBP, non-EUR market such as `SE / SEK` or `BR / BRL`

## 1. Encode Stripe country capability rules explicitly

- Replace the current implicit “all supported markets are fully Stripe-capable” behavior with explicit per-country Stripe capability metadata.
- Keep capability fields explicit on every market record:
  - `packageCheckoutSupported`
  - `connectExpressSupported`
  - `connectExpressSelfServeSupported`
  - `crossBorderPayoutRequired`
- Only expose product flows that are truly supported by the market capability profile.
- Add tests that fail if a newly added market omits explicit Stripe capability metadata.

## 2. Gate product-site package billing to actually configured Stripe prices

- Detect the currencies that have real Stripe price IDs configured for both paid package tiers.
- Prevent `/pricing` and `/signup` from offering a billing currency that lacks a configured Stripe price mapping.
- Keep unsupported local package currencies falling back cleanly to `USD` or another configured currency, with clear UI messaging.
- Add a server-side preflight before hub provisioning so a tampered query or form cannot create a paid-signup hub and only fail later at checkout.

## 3. Fix signup regional consistency between server render and hydration

- Ensure `/signup` does not mix:
  - query-selected `country`
  - request-guessed `locale`
  - request-guessed `timezone`
  - request-guessed `defaultCurrency`
- When an explicit country is selected, derive the rest of the regional defaults from that country before the first render.
- Preserve explicit currency overrides only when they remain valid for the configured package billing set.

## 4. Finish the operator-side hub create flow

- Update `/platform/hubs/create` to use the canonical regional model.
- Add:
  - `country`
  - `locale`
  - `timezone`
  - `defaultCurrency`
- Remove the remaining baked-in `en-GB` and `Europe/London` assumptions from that operator workflow.
- Validate that operator-created hubs land on the same canonical regional contract as product-site-created hubs.

## 5. Remove remaining user-facing UK-centric fallback behavior

- Audit the remaining `en-GB`, `GBP`, and `Europe/London` fallbacks.
- Keep only low-level defensive fallbacks where unavoidable.
- Remove or replace the remaining user-facing ones in:
  - public event booking surfaces
  - payments workspace reporting summaries
  - public event/course detail defaults
  - exports and date formatting helpers where the hub locale should always win

## 6. Verify hub-platform commercial and formatting flows against the canonical hub region

- Confirm new events, courses, memberships, recurring series, and payment views all default from:
  - `hub.defaultCurrency`
  - `hub.locale`
  - `hub.timezone`
- Confirm paid event/course/member flows preserve stored record currency rather than re-deriving from locale.
- Confirm the public site and member account surfaces render dates and money from the hub or record-level settings consistently.

## 7. End-to-end acceptance pass

- Product-site:
  - landing guess
  - pricing currency
  - signup defaults
  - manual override behavior
  - package CTA carry-through
- Stripe billing:
  - checkout session currency
  - checkout locale
  - subscription currency persistence
  - upgrade/downgrade continuity
- Hub-platform:
  - site settings country lock after Connect onboarding starts
  - Stripe Connect account creation country
  - admin payments workspace formatting
  - public hub date/currency formatting

## Current execution order

1. Package billing Stripe-price coverage gating
2. Signup SSR regional consistency
3. Explicit Stripe capability metadata per market
4. Operator hub-create flow regional update
5. Remaining UK-centric fallback cleanup
6. Final end-to-end verification
