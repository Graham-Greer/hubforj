import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  filterOperationalRecords,
  normalizeSearchTerm,
} from "../../src/components/patterns/operational-records-table/operational-records-helpers.js";

test("normalizeSearchTerm trims and lowercases search input", () => {
  assert.equal(normalizeSearchTerm("  Alex Member "), "alex member");
  assert.equal(normalizeSearchTerm(null), "");
});

test("filterOperationalRecords applies search and filter predicates together", () => {
  const records = [
    { id: "1", userName: "Alex Member", userEmail: "alex@example.com", status: "registered", attendanceStatus: "pending" },
    { id: "2", userName: "Jordan Learner", userEmail: "jordan@example.com", status: "waitlisted", attendanceStatus: "present" },
  ];

  const filters = [
    {
      key: "registrationStatus",
      options: [{ value: "all" }, { value: "registered" }, { value: "waitlisted" }],
      getValue: (record) => record.status,
    },
    {
      key: "attendanceStatus",
      options: [{ value: "all" }, { value: "pending" }, { value: "present" }],
      getValue: (record) => record.attendanceStatus,
    },
  ];

  assert.deepEqual(
    filterOperationalRecords(records, "alex", ["userName", "userEmail"], { registrationStatus: "all", attendanceStatus: "all" }, filters).map((record) => record.id),
    ["1"]
  );
  assert.deepEqual(
    filterOperationalRecords(records, "", ["userName", "userEmail"], { registrationStatus: "waitlisted", attendanceStatus: "present" }, filters).map((record) => record.id),
    ["2"]
  );
});

test("registration record helpers keep free-payment and unmarked labels explicit in source", () => {
  const helperSource = readFileSync(
    new URL("../../src/components/patterns/registration-records/registration-records-helpers.js", import.meta.url),
    "utf8"
  );

  assert.match(helperSource, /Attendance unmarked/);
  assert.match(helperSource, /Progress unmarked/);
  assert.match(helperSource, /if \(pricingMode !== "paid"\)/);
  assert.match(helperSource, /label: "Free"/);
});
