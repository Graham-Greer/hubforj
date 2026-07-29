import test from "node:test";
import assert from "node:assert/strict";
import {
  assertHubNativePaymentsReady,
  getHubPaymentSetupState,
  hubUsesInternalNativePayments,
  isHubNativePaymentsReady,
  normalizeHubPaymentConfiguration,
} from "../../src/lib/domain/hub-payment-configuration.js";

test("hub payment configuration defaults to not configured without a connected account", () => {
  const configuration = normalizeHubPaymentConfiguration({});

  assert.equal(configuration.status, "not_configured");
  assert.equal(configuration.statusLabel, "Not configured");
  assert.equal(configuration.hasConnectedAccount, false);
  assert.equal(configuration.isReady, false);
});

test("hub payment configuration resolves enabled when charges and payouts are ready", () => {
  const configuration = normalizeHubPaymentConfiguration({
    stripeAccountId: "acct_123",
    detailsSubmitted: true,
    chargesEnabled: true,
    payoutsEnabled: true,
  });

  assert.equal(configuration.status, "enabled");
  assert.equal(configuration.statusLabel, "Ready");
  assert.equal(configuration.hasConnectedAccount, true);
  assert.equal(configuration.isReady, true);
});

test("hub payment configuration resolves requirements due when Stripe still needs information", () => {
  const configuration = normalizeHubPaymentConfiguration({
    stripeAccountId: "acct_123",
    detailsSubmitted: false,
    chargesEnabled: false,
    payoutsEnabled: false,
    requirementsCurrentlyDue: ["company.tax_id"],
  });

  assert.equal(configuration.status, "requirements_due");
  assert.equal(configuration.hasOutstandingRequirements, true);
});

test("hub payment setup state stays locked outside Growth native payments", () => {
  const setupState = getHubPaymentSetupState(
    {
      packagePaymentProcessingMode: "external",
      packageCapabilities: { nativePaymentsEnabled: false },
    },
    {}
  );

  assert.equal(setupState.key, "locked");
  assert.equal(setupState.statusLabel, "Growth required");
});

test("hub payment setup state becomes ready for an enabled connected account", () => {
  const setupState = getHubPaymentSetupState(
    {
      packagePaymentProcessingMode: "internal",
      packageCapabilities: { nativePaymentsEnabled: true },
    },
    {
      stripeAccountId: "acct_123",
      detailsSubmitted: true,
      chargesEnabled: true,
      payoutsEnabled: true,
    }
  );

  assert.equal(setupState.key, "ready");
  assert.equal(setupState.configuration.status, "enabled");
});

test("hub payment readiness helpers only enforce Stripe setup on Growth native payment flows", () => {
  assert.equal(
    hubUsesInternalNativePayments({
      packagePaymentProcessingMode: "external",
      packageCapabilities: { nativePaymentsEnabled: false },
    }),
    false
  );
  assert.equal(
    isHubNativePaymentsReady(
      {
        packagePaymentProcessingMode: "external",
        packageCapabilities: { nativePaymentsEnabled: false },
      },
      {}
    ),
    true
  );
  assert.equal(
    isHubNativePaymentsReady(
      {
        packagePaymentProcessingMode: "internal",
        packageCapabilities: { nativePaymentsEnabled: true },
      },
      {
        stripeAccountId: "acct_123",
        detailsSubmitted: true,
        chargesEnabled: true,
        payoutsEnabled: true,
      }
    ),
    true
  );
  assert.throws(
    () =>
      assertHubNativePaymentsReady(
        {
          packagePaymentProcessingMode: "internal",
          packageCapabilities: { nativePaymentsEnabled: true },
        },
        {},
        "creating paid events on Growth"
      ),
    /Complete Stripe setup before creating paid events on Growth\./
  );
});
