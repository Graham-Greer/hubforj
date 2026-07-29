import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("hub legal summary distinguishes transactional booking emails from automated reminders", () => {
  const source = readFileSync(
    new URL("../../src/lib/legal/buildHubDataUseSummary.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /transactionalBookingEmailsEnabled/);
  assert.match(source, /booking or enrolment confirmations and cancellations/i);
  assert.match(source, /Automated reminder emails are not currently enabled for this hub/i);
  assert.match(source, /booking and enrolment communication state/i);
  assert.match(source, /reminder-related communication state/i);
});
