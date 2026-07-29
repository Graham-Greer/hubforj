import test from "node:test";
import assert from "node:assert/strict";
import {
  buildDefaultMembershipPlanPayload,
  findDefaultMembershipPlan,
} from "../../src/lib/domain/memberships.js";

test("default membership plan payload seeds a free active baseline plan", () => {
  const payload = buildDefaultMembershipPlanPayload();

  assert.deepEqual(payload, {
    title: "Community Membership",
    description: "Default membership for everyone who joins the hub.",
    pricingMode: "free",
    price: "0",
    currency: "USD",
    externalPaymentUrl: "",
    paymentInstructions: "",
    durationUnit: "months",
    durationValue: 12,
    visibility: "public",
    status: "active",
  });
});

test("findDefaultMembershipPlan returns the explicitly default plan", () => {
  const plans = [
    { id: "plan_free", title: "Community Membership", isDefault: true },
    { id: "plan_plus", title: "Supporter", isDefault: false },
  ];

  assert.deepEqual(findDefaultMembershipPlan(plans), plans[0]);
  assert.equal(findDefaultMembershipPlan([{ id: "plan_plus", isDefault: false }]), null);
});
