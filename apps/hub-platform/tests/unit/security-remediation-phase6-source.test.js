import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function readTarget(relativePath) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

test("phase 6 adds adapter-based product-site public abuse controls", () => {
  const source = readTarget("../../../product-site/src/lib/server/public-abuse-controls.js");

  assert.match(source, /assertPublicAbuseAllowed/);
  assert.match(source, /assertProductSignupAllowed/);
  assert.match(source, /assertProductPasswordResetAllowed/);
  assert.match(source, /PublicAbuseRateLimitError/);
  assert.match(source, /resolveClientIpFromHeaders/);
  assert.match(source, /cf-connecting-ip/);
  assert.match(source, /x-vercel-forwarded-for/);
  assert.match(source, /x-forwarded-for/);
  assert.match(source, /crypto\.createHash\("sha256"\)/);
  assert.match(source, /consumeMemoryRateLimit/);
  assert.match(source, /consumeUpstashRateLimit/);
});

test("phase 6 protects product signup before provisioning or checkout side effects", () => {
  const source = readTarget("../../../product-site/src/app/(marketing)/signup/actions.js");

  assert.match(source, /assertProductSignupAllowed/);
  assert.match(source, /isPublicAbuseRateLimitError/);
  assert.match(source, /error\.userMessage/);

  const limiterIndex = source.indexOf("await assertProductSignupAllowed");
  const accountLookupIndex = source.indexOf("const existingAccount = await getCommercialAccountByEmail");
  const provisionHubIndex = source.indexOf("hub = await provisionHubFromProductSite");
  const checkoutIndex = source.indexOf("const checkoutSession = await createStripeCheckoutForPackageChange");

  assert.ok(limiterIndex > -1, "signup limiter should be called");
  assert.ok(accountLookupIndex > limiterIndex, "signup limiter should run before account lookup");
  assert.ok(provisionHubIndex > limiterIndex, "signup limiter should run before hub provisioning");
  assert.ok(checkoutIndex > limiterIndex, "signup limiter should run before checkout handoff");
});

test("phase 6 protects product forgot-password while preserving form-state responses", () => {
  const source = readTarget("../../../product-site/src/app/(marketing)/forgot-password/actions.js");

  assert.match(source, /assertProductPasswordResetAllowed/);
  assert.match(source, /isPublicAbuseRateLimitError/);
  assert.match(source, /error\.userMessage/);
  assert.match(source, /If that account exists, a password reset email has been sent\./);

  const limiterIndex = source.indexOf("await assertProductPasswordResetAllowed");
  const emailSendIndex = source.indexOf("const result = await sendCommercialAccountPasswordResetEmail");

  assert.ok(limiterIndex > -1, "password reset limiter should be called");
  assert.ok(emailSendIndex > limiterIndex, "password reset limiter should run before email sending");
});

test("phase 6 documents production abuse-control configuration without forcing local setup", () => {
  const envSource = readTarget("../../../product-site/src/lib/config/env.js");
  const envExample = readTarget("../../../product-site/.env.example");

  assert.match(envSource, /productSiteAbuseRateLimitProvider/);
  assert.match(envSource, /PRODUCT_SITE_ABUSE_RATE_LIMIT_PROVIDER/);
  assert.match(envSource, /productSiteAbuseRateLimitFailClosed/);
  assert.match(envSource, /UPSTASH_REDIS_REST_URL/);
  assert.match(envSource, /UPSTASH_REDIS_REST_TOKEN/);

  assert.match(envExample, /PRODUCT_SITE_ABUSE_RATE_LIMIT_PROVIDER=memory/);
  assert.match(envExample, /PRODUCT_SITE_ABUSE_RATE_LIMIT_FAIL_CLOSED=false/);
  assert.match(envExample, /UPSTASH_REDIS_REST_URL=/);
  assert.match(envExample, /UPSTASH_REDIS_REST_TOKEN=/);
});

test("phase 6 does not apply public form rate limits to Stripe webhooks or internal automation", () => {
  const productStripeWebhook = readTarget("../../../product-site/src/app/api/stripe/webhooks/route.js");
  const hubStripeWebhook = readTarget("../../src/app/api/stripe/webhooks/route.js");
  const bookingProcessor = readTarget("../../src/app/api/internal/booking-notifications/process/route.js");
  const provisionHub = readTarget("../../src/app/api/internal/provision-hub/route.js");

  for (const source of [productStripeWebhook, hubStripeWebhook, bookingProcessor, provisionHub]) {
    assert.doesNotMatch(source, /assertPublicAbuseAllowed/);
    assert.doesNotMatch(source, /assertProductSignupAllowed/);
    assert.doesNotMatch(source, /assertProductPasswordResetAllowed/);
  }
});

test("phase 6 adds narrowly scoped hub-platform member join abuse controls", () => {
  const limiterSource = readTarget("../../src/lib/server/public-abuse-controls.js");
  const envSource = readTarget("../../src/lib/config/env.js");
  const envExample = readTarget("../../.env.example");

  assert.match(limiterSource, /assertHubMemberJoinAllowed/);
  assert.match(limiterSource, /hubMemberJoin/);
  assert.match(limiterSource, /ipHub/);
  assert.match(limiterSource, /emailHub/);
  assert.match(limiterSource, /resolveClientIpFromRequest/);
  assert.match(limiterSource, /cf-connecting-ip/);
  assert.match(limiterSource, /x-vercel-forwarded-for/);
  assert.match(limiterSource, /x-forwarded-for/);
  assert.match(limiterSource, /consumeMemoryRateLimit/);
  assert.match(limiterSource, /consumeUpstashRateLimit/);

  assert.match(envSource, /hubPlatformAbuseRateLimitProvider/);
  assert.match(envSource, /HUB_PLATFORM_ABUSE_RATE_LIMIT_PROVIDER/);
  assert.match(envSource, /hubPlatformAbuseRateLimitFailClosed/);
  assert.match(envSource, /UPSTASH_REDIS_REST_URL/);
  assert.match(envSource, /UPSTASH_REDIS_REST_TOKEN/);

  assert.match(envExample, /HUB_PLATFORM_ABUSE_RATE_LIMIT_PROVIDER=memory/);
  assert.match(envExample, /HUB_PLATFORM_ABUSE_RATE_LIMIT_FAIL_CLOSED=false/);
  assert.match(envExample, /UPSTASH_REDIS_REST_URL=/);
  assert.match(envExample, /UPSTASH_REDIS_REST_TOKEN=/);
});

test("phase 6 protects hub member join without touching session exchange or invite acceptance", () => {
  const joinRoute = readTarget("../../src/app/api/auth/member/join/route.js");
  const sessionRoute = readTarget("../../src/app/api/auth/member/session/route.js");
  const inviteAcceptanceRoute = readTarget("../../src/app/api/auth/admin-invite/accept/route.js");

  assert.match(joinRoute, /assertHubMemberJoinAllowed/);
  assert.match(joinRoute, /resolveClientIpFromRequest\(request\)/);
  assert.match(joinRoute, /await assertHubMemberJoinAllowed\(\{ hubSlug, ipAddress \}\)/);
  assert.match(joinRoute, /await assertHubMemberJoinAllowed\(\{ hubSlug, ipAddress, email \}\)/);
  assert.match(joinRoute, /status: 429/);
  assert.match(joinRoute, /"Retry-After"/);

  assert.doesNotMatch(sessionRoute, /assertHubMemberJoinAllowed/);
  assert.doesNotMatch(inviteAcceptanceRoute, /assertHubMemberJoinAllowed/);
});
