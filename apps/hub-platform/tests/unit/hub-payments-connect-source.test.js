import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("hub Stripe connect helper creates express accounts and account sessions", () => {
  const source = readFileSync(
    new URL("../../src/lib/server/hub-payment-connect.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /resolveHubStripeCountry/);
  assert.match(source, /type: "express"/);
  assert.match(source, /country: hubCountry/);
  assert.match(source, /card_payments: \{ requested: true \}/);
  assert.match(source, /transfers: \{ requested: true \}/);
  assert.match(source, /Connect is not supported for this hub country yet/);
  assert.match(source, /requires support-led onboarding/);
  assert.match(source, /stripe\.accountSessions\.create/);
  assert.match(source, /account_onboarding/);
});

test("admin payment API routes are present for onboarding sessions and status sync", () => {
  const accountSessionRoute = readFileSync(
    new URL("../../src/app/api/admin/hubs/[hubSlug]/payments/account-session/route.js", import.meta.url),
    "utf8"
  );
  const syncRoute = readFileSync(
    new URL("../../src/app/api/admin/hubs/[hubSlug]/payments/sync/route.js", import.meta.url),
    "utf8"
  );

  assert.match(accountSessionRoute, /createHubStripeOnboardingAccountSession/);
  assert.match(accountSessionRoute, /requireHubOperatorRouteAccess/);
  assert.match(syncRoute, /syncHubStripeConnectedAccount/);
  assert.match(syncRoute, /requireHubOperatorRouteAccess/);
});

test("Stripe webhook route verifies signatures and delegates to the hub payment processor", () => {
  const routeSource = readFileSync(
    new URL("../../src/app/api/stripe/webhooks/route.js", import.meta.url),
    "utf8"
  );
  const processorSource = readFileSync(
    new URL("../../src/lib/server/hub-payment-webhooks.js", import.meta.url),
    "utf8"
  );

  assert.match(routeSource, /stripe-signature/);
  assert.match(routeSource, /constructEvent/);
  assert.match(routeSource, /processHubStripeWebhookEvent/);
  assert.match(processorSource, /account\.updated/);
  assert.match(processorSource, /checkout\.session\.completed/);
  assert.match(processorSource, /approveMembershipUpgradeRequest/);
  assert.match(processorSource, /recordProcessedStripeWebhookEvent/);
});

test("embedded onboarding panel detects an already-loaded Connect.js runtime", () => {
  const source = readFileSync(
    new URL("../../src/components/patterns/hub-payments-workspace/StripeEmbeddedOnboardingPanel.jsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /window\.StripeConnect\?\.init/);
  assert.match(source, /onReady=\{\(\) => setScriptLoaded\(true\)\}/);
});
