import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { SourceTextModule, SyntheticModule, createContext } from "node:vm";

async function loadBillingDomain() {
  const context = createContext({ Date, Intl });
  const source = await readFile(new URL("../../src/lib/domain/commercial-billing.js", import.meta.url), "utf8");
  const subject = new SourceTextModule(source, { context });

  await subject.link((specifier) => {
    assert.equal(specifier, "@/lib/domain/package-catalog");
    return new SyntheticModule(["getCommercialPackageIntent"], function () {
      this.setExport("getCommercialPackageIntent", () => ({
        hasPendingPackageIntent: false,
        pendingPackage: null,
        pendingStatus: "",
      }));
    }, { context });
  });

  await subject.evaluate();
  return subject.namespace;
}

test("ended Stripe subscriptions return the hub to Free while retaining cancelled billing history", async () => {
  const billing = await loadBillingDomain();
  const authority = billing.resolveStripeSubscriptionPackageAuthority({
    status: "canceled",
    formerPaidTier: "growth",
  });

  assert.deepEqual(JSON.parse(JSON.stringify(authority)), {
    formerPaidTier: "growth",
    packageTier: "free",
    packageStatus: "active",
    isEnded: true,
  });

  const model = billing.buildCommercialBillingModel({
    account: {
      stripeCustomerId: "cus_test",
      stripeSubscriptionId: "sub_ended",
      stripeSubscriptionStatus: "canceled",
    },
    currentHub: { packageTier: "free" },
    stripeEnvironment: { configuredForCheckout: true },
  });
  const change = billing.buildCommercialPackageChangeModel({
    account: {
      stripeCustomerId: "cus_test",
      stripeSubscriptionId: "sub_ended",
      stripeSubscriptionStatus: "canceled",
    },
    currentHub: { packageTier: "free" },
    targetTier: "growth",
    stripeEnvironment: { configuredForCheckout: true },
  });

  assert.equal(model.status, "Cancelled");
  assert.equal(model.canOpenBillingPortal, false);
  assert.equal(model.canStartCheckout, true);
  assert.equal(change.actionKind, "checkout");
});

test("active subscriptions retain their paid package authority and billing controls", async () => {
  const billing = await loadBillingDomain();
  assert.deepEqual(
    JSON.parse(JSON.stringify(billing.resolveStripeSubscriptionPackageAuthority({ status: "active", formerPaidTier: "growth" }))),
    { formerPaidTier: "growth", packageTier: "growth", packageStatus: "active", isEnded: false }
  );
});

test("billing and upgrade pages refresh Stripe before deciding the available package action", async () => {
  const [billingPage, upgradePage, billingServer] = await Promise.all([
    readFile(new URL("../../src/app/(account)/account/billing/page.jsx", import.meta.url), "utf8"),
    readFile(new URL("../../src/app/(account)/account/upgrade/page.jsx", import.meta.url), "utf8"),
    readFile(new URL("../../src/lib/server/commercial-billing.js", import.meta.url), "utf8"),
  ]);

  assert.match(billingPage, /requireCommercialAccountContext\(\{ refreshSubscription: true \}\)/);
  assert.match(upgradePage, /requireCommercialAccountContext\(\{ refreshSubscription: true \}\)/);
  assert.match(billingServer, /packageTier: packageAuthority\.packageTier/);
  assert.match(billingServer, /packageStatus: packageAuthority\.packageStatus/);
});
