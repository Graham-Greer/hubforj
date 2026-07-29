import test from "node:test";
import assert from "node:assert/strict";
import {
  assertEventCanAcceptRegistration,
  resolveInitialEventRegistrationStatus,
  resolveInitialRegistrationPaymentStatus,
} from "../../src/lib/domain/registrations.js";

test("registration payment status aligns to event pricing mode", () => {
  assert.equal(resolveInitialRegistrationPaymentStatus({ pricingMode: "free" }), "not_required");
  assert.equal(resolveInitialRegistrationPaymentStatus({ pricingMode: "paid" }), "unpaid");
});

test("registration status respects capacity constraints", () => {
  assert.equal(resolveInitialEventRegistrationStatus({ capacity: 0 }, 99), "registered");
  assert.equal(resolveInitialEventRegistrationStatus({ capacity: 10 }, 3), "registered");
  assert.equal(resolveInitialEventRegistrationStatus({ capacity: 10 }, 10), "waitlisted");
});

test("event must be published before it can accept registrations", () => {
  assert.doesNotThrow(() => assertEventCanAcceptRegistration({ status: "published" }));
  assert.throws(
    () => assertEventCanAcceptRegistration({ status: "draft" }),
    /This event is not open for registration\./
  );
});
