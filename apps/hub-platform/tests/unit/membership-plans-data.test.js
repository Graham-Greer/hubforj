import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("membership shared module keeps pricing normalization and visibility fields explicit", () => {
  const sharedSource = readFileSync(
    new URL("../../src/lib/data/membership-shared.js", import.meta.url),
    "utf8"
  );

  assert.match(sharedSource, /pricingMode: resolveMembershipPlanPricingMode\(plan\)/);
  assert.match(sharedSource, /externalPaymentUrl: normalizeString\(plan\.externalPaymentUrl\)/);
  assert.match(sharedSource, /paymentInstructions: normalizeString\(plan\.paymentInstructions\)/);
  assert.match(sharedSource, /visibility: normalizeString\(plan\.visibility\)\.toLowerCase\(\) \|\| "public"/);
});

test("membership plan mutations keep package, visibility, and payment configuration invariants explicit", () => {
  const mutationSource = readFileSync(
    new URL("../../src/lib/data/membership-plans.js", import.meta.url),
    "utf8"
  );

  assert.match(mutationSource, /resolveMembershipPlanPaymentConfiguration/);
  assert.match(mutationSource, /Paid memberships are available on Starter and above\./);
  assert.match(mutationSource, /externalPaymentUrl: paymentConfiguration\.externalPaymentUrl/);
  assert.match(mutationSource, /visibility: next\.visibility/);
  assert.match(mutationSource, /visibility: existingPlan\.isDefault === true \? "public" : next\.visibility/);
  assert.match(mutationSource, /The default membership plan can only be updated by changing its title or description\./);
});
