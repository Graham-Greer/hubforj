import test from "node:test";
import assert from "node:assert/strict";
import { splitRegistrationsByTimeline } from "../../src/lib/domain/registrations.js";

test("splitRegistrationsByTimeline prioritizes future bookings into upcoming", () => {
  const result = splitRegistrationsByTimeline(
    [
      { id: "past", eventStartAt: "2026-03-01T10:00:00.000Z" },
      { id: "upcoming", eventStartAt: "2026-04-01T10:00:00.000Z" },
      { id: "missing" },
    ],
    new Date("2026-03-15T10:00:00.000Z")
  );

  assert.deepEqual(result.upcoming.map((row) => row.id), ["upcoming"]);
  assert.deepEqual(result.history.map((row) => row.id), ["past", "missing"]);
});
