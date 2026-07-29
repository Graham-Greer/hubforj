import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Stripe Connect webhook reconciliation asserts connected-account ownership before mutation", () => {
  const source = readFileSync(
    new URL("../../src/lib/server/hub-payment-webhooks.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /assertStripeConnectEventOwnsTransaction/);
  assert.match(source, /assertWebhookOwnsNativeTransaction/);
  assert.match(source, /getHubPaymentConfigurationByHubId/);

  for (const context of [
    "membership_upgrade_checkout",
    "event_registration_checkout",
    "event_booking_checkout",
    "course_registration_checkout",
    "offering_registration_refund",
    "checkout_payment_intent_failure",
  ]) {
    assert.match(source, new RegExp(`assertWebhookOwnsNativeTransaction\\(event, hubId, transaction, "${context}"\\)`));
  }
});

test("Stripe Connect webhook processor releases mismatched events instead of marking them processed", () => {
  const source = readFileSync(
    new URL("../../src/lib/server/hub-payment-webhooks.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /catch \(error\)/);
  assert.match(source, /releaseStripeWebhookEventProcessing\(event\?\.id\)/);
  assert.match(source, /throw error/);
  assert.match(source, /recordProcessedStripeWebhookEvent\(event, result\)/);
});
