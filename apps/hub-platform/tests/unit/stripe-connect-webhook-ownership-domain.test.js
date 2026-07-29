import test from "node:test";
import assert from "node:assert/strict";
import { assertStripeConnectEventOwnsTransaction } from "../../src/lib/domain/stripe-connect-webhook-ownership.js";

test("Stripe Connect ownership assertion accepts matching event transaction and configuration accounts", () => {
  assert.deepEqual(
    assertStripeConnectEventOwnsTransaction({
      event: { id: "evt_123", type: "checkout.session.completed", account: "acct_123" },
      transaction: { id: "txn_123", stripeAccountId: "acct_123" },
      hubPaymentConfiguration: { stripeAccountId: "acct_123" },
      context: "event_booking_checkout",
    }),
    {
      eventAccountId: "acct_123",
      transactionAccountId: "acct_123",
      configurationAccountId: "acct_123",
    }
  );
});

test("Stripe Connect ownership assertion rejects missing event account", () => {
  assert.throws(
    () =>
      assertStripeConnectEventOwnsTransaction({
        event: { id: "evt_123", type: "checkout.session.completed" },
        transaction: { id: "txn_123", stripeAccountId: "acct_123" },
      }),
    /missing event account/
  );
});

test("Stripe Connect ownership assertion rejects mismatched transaction account", () => {
  assert.throws(
    () =>
      assertStripeConnectEventOwnsTransaction({
        event: { id: "evt_123", type: "checkout.session.completed", account: "acct_attacker" },
        transaction: { id: "txn_123", stripeAccountId: "acct_123" },
      }),
    /event account does not match transaction account/
  );
});

test("Stripe Connect ownership assertion rejects mismatched hub payment configuration account", () => {
  assert.throws(
    () =>
      assertStripeConnectEventOwnsTransaction({
        event: { id: "evt_123", type: "refund.updated", account: "acct_123" },
        transaction: { id: "txn_123", stripeAccountId: "acct_123" },
        hubPaymentConfiguration: { stripeAccountId: "acct_other" },
      }),
    /event account does not match hub payment configuration/
  );
});
