import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("event attendance helper source keeps route-specific labels explicit", () => {
  const helperSource = readFileSync(
    new URL("../../src/components/patterns/event-attendance-workspace/event-attendance-helpers.js", import.meta.url),
    "utf8"
  );

  assert.match(helperSource, /return "Unmarked"/);
  assert.match(helperSource, /return "Attended"/);
  assert.match(helperSource, /return "Absent"/);
});

test("event attendance helper source stays focused on attendance labels", () => {
  const helperSource = readFileSync(
    new URL("../../src/components/patterns/event-attendance-workspace/event-attendance-helpers.js", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(helperSource, /export function filterEventAttendanceRecords/);
  assert.doesNotMatch(helperSource, /export function buildAttendanceFilterMenuItems/);
  assert.doesNotMatch(helperSource, /registration\.userName/);
});
