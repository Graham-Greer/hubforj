# Upstash Rate Limiting Pre-Launch Guide

## Purpose

The product site and hub platform use public abuse controls to reduce automated abuse.

Current protected flows:

- product-site signup
- product-site forgot-password
- hub-platform member join

For local development, the limiter can be disabled or run in memory. For launch, configure a shared production store so rate limits work consistently across serverless instances and deployments.

This guide covers the production setup for Upstash Redis using the REST API. No npm package is required because the app calls Upstash through `fetch`.

## When To Complete This

Complete this before launching the product site and hub platform publicly.

This applies to:

- `apps/product-site`
- `apps/hub-platform`

It does not need to be added to local `.env.local` files unless you specifically want to test the production provider locally.

## 1. Create An Upstash Redis Database

1. Sign in to Upstash.
2. Create a new Redis database.
3. Choose the closest region to the app deployment region where possible.
4. Use a production-appropriate database name, for example:
- `hubforj-public-rate-limits`

Recommended launch posture:

- Use a managed Upstash Redis database.
- Keep eviction/default settings conservative.
- Do not reuse a database that stores unrelated sensitive application data.

## 2. Copy The REST Credentials

From the Upstash database console, copy:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Use the REST values, not the Redis TCP URL.

The REST URL usually looks like:

```env
https://your-db.upstash.io
```

The REST token is a secret. Treat it like any other production credential.

## 3. Add Product-Site Production Environment Variables

In the production environment for `apps/product-site`, add:

```env
PRODUCT_SITE_ABUSE_RATE_LIMIT_PROVIDER=upstash
PRODUCT_SITE_ABUSE_RATE_LIMIT_FAIL_CLOSED=false
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-rest-token
```

## 4. Add Hub-Platform Production Environment Variables

In the production environment for `apps/hub-platform`, add:

```env
HUB_PLATFORM_ABUSE_RATE_LIMIT_PROVIDER=upstash
HUB_PLATFORM_ABUSE_RATE_LIMIT_FAIL_CLOSED=false
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-rest-token
```

Recommended value for launch:

```env
PRODUCT_SITE_ABUSE_RATE_LIMIT_FAIL_CLOSED=false
HUB_PLATFORM_ABUSE_RATE_LIMIT_FAIL_CLOSED=false
```

This means if Upstash has an outage, legitimate customers and members are not blocked from signup, password reset, or hub member join. The app logs a warning and allows the request.

After the product is stable, we can reassess whether any flow should fail closed.

## 5. Deploy Or Restart The Apps

After adding the variables, redeploy or restart the apps so the runtime picks up the new environment.

For Vercel, this usually means:

1. Add the product-site variables to the product-site project.
2. Add the hub-platform variables to the hub-platform project.
3. Redeploy both production deployments.

## 6. Smoke Test The Flow

After deployment, test:

1. Product signup with a new email.
2. Paid signup handoff to Stripe checkout.
3. Product forgot-password with a real account email.
4. Product forgot-password with an unknown email.
5. Hub public member join with a new member email.

Expected behaviour:

- Normal first attempts should work.
- Forgot-password should still use non-enumerating language.
- Hub member join should still create the member, assign the default membership, and open the member session.
- Stripe webhooks and internal automation should not be affected.

## 7. Optional Local Testing

Local testing does not require Upstash.

To test the limiter locally without external services, add this to `apps/product-site/.env.local`:

```env
PRODUCT_SITE_ABUSE_RATE_LIMIT_PROVIDER=memory
PRODUCT_SITE_ABUSE_RATE_LIMIT_FAIL_CLOSED=false
```

Then restart the product-site dev server.

To test the hub-platform limiter locally without external services, add this to `apps/hub-platform/.env.local`:

```env
HUB_PLATFORM_ABUSE_RATE_LIMIT_PROVIDER=memory
HUB_PLATFORM_ABUSE_RATE_LIMIT_FAIL_CLOSED=false
```

Then restart the hub-platform dev server.

To test against Upstash locally, use:

```env
PRODUCT_SITE_ABUSE_RATE_LIMIT_PROVIDER=upstash
PRODUCT_SITE_ABUSE_RATE_LIMIT_FAIL_CLOSED=false
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-rest-token
```

For hub-platform, use:

```env
HUB_PLATFORM_ABUSE_RATE_LIMIT_PROVIDER=upstash
HUB_PLATFORM_ABUSE_RATE_LIMIT_FAIL_CLOSED=false
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-rest-token
```

Do not commit real Upstash credentials.

## 8. Troubleshooting

If signup, forgot-password, or member join unexpectedly shows a rate-limit message:

1. Confirm the user has not repeated the same action many times in a short period.
2. Check whether the same IP is being shared by several testers.
3. Confirm the relevant provider is set correctly:
- `PRODUCT_SITE_ABUSE_RATE_LIMIT_PROVIDER`
- `HUB_PLATFORM_ABUSE_RATE_LIMIT_PROVIDER`
4. Confirm `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are the REST credentials.
5. Check app logs for Upstash warnings.

If Upstash is unavailable and the relevant fail-closed value is `false`, the app should allow requests and log a warning.

If fail-closed is `true`, Upstash failures can block signup/password-reset/member-join attempts. This is not recommended for initial launch.

## Launch Checklist

- Upstash Redis database created.
- REST URL copied.
- REST token copied.
- Product-site production env variables added.
- Hub-platform production env variables added.
- Product site redeployed.
- Hub platform redeployed.
- Signup smoke test passed.
- Paid signup checkout smoke test passed.
- Forgot-password smoke test passed.
- Hub member join smoke test passed.
- Logs checked for unexpected Upstash warnings.
