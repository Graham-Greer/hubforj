import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("hub payments helper source treats not_required items as paid in the admin queue", () => {
  const source = readFileSync(
    new URL("../../src/components/patterns/hub-payments-workspace/hub-payments-helpers.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /export function getOperationalPaymentStatus\(item\)/);
  assert.match(source, /return item\.paymentStatus === "not_required" \? "paid" : item\.paymentStatus;/);
  assert.match(source, /getMembershipPaymentStatusLabel\(getOperationalPaymentStatus\(item\)\)/);
  assert.match(source, /getMembershipPaymentStatusTone\(getOperationalPaymentStatus\(item\)\)/);
});

test("hub payments helper source treats free records as free amounts", () => {
  const source = readFileSync(
    new URL("../../src/components/patterns/hub-payments-workspace/hub-payments-helpers.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /if \(item\.paymentStatus === "not_required"\) \{\s+return "Free";\s+\}/);
  assert.match(source, /if \(item\.kind === "membership" && String\(item\.amount \|\| ""\) === "0"\) \{\s+return "Free";\s+\}/);
  assert.match(source, /if \(!item\.amount\) \{\s+return "Amount to be confirmed";\s+\}/);
});
