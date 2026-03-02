import test from "node:test";
import assert from "node:assert/strict";
import { validateEventInput, validateEventStatusTransition } from "../../src/lib/validation/events.js";

function buildInput(overrides = {}) {
  return {
    title: "Community Workshop",
    description: "Learn together",
    startAt: "2026-03-01T10:00",
    endAt: "2026-03-01T12:00",
    location: "Main Hall",
    capacity: "100",
    category: "Workshop",
    tags: "community, workshop",
    pricingMode: "free",
    price: "",
    registrationEligibility: "members-only",
    visibility: "public",
    ...overrides,
  };
}

test("validateEventInput normalizes valid payload", () => {
  const payload = validateEventInput(buildInput());

  assert.equal(payload.slug, "community-workshop");
  assert.equal(payload.status, "draft");
  assert.equal(payload.capacity, 100);
  assert.deepEqual(payload.tags, ["community", "workshop"]);
  assert.equal(payload.price, null);
  assert.equal(payload.startAt.endsWith("Z"), true);
});

test("validateEventInput requires price when pricing mode is paid", () => {
  assert.throws(
    () => validateEventInput(buildInput({ pricingMode: "paid", price: "" })),
    /price is required/
  );
});

test("validateEventInput enforces endAt after startAt", () => {
  assert.throws(
    () => validateEventInput(buildInput({ endAt: "2026-03-01T09:00" })),
    /endAt must be after startAt/
  );
});

test("validateEventStatusTransition allows draft to published", () => {
  assert.equal(validateEventStatusTransition("draft", "published", false), "published");
});

test("validateEventStatusTransition blocks published to draft when registrations exist", () => {
  assert.throws(
    () => validateEventStatusTransition("published", "draft", true),
    /Cannot move published event back to draft/
  );
});

test("validateEventStatusTransition allows published to cancelled", () => {
  assert.equal(validateEventStatusTransition("published", "cancelled", false), "cancelled");
});
