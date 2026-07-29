import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("member account overview upcoming bookings preview uses image-aware layout and cleaner badges", () => {
  const source = readFileSync(
    new URL("../../src/components/patterns/member-account-overview/MemberAccountOverview.jsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /item\.imageUrl/);
  assert.match(source, /showPaymentBadge/);
  assert.match(source, /showAttendanceBadge/);
  assert.match(source, /statusHelpText/);
  assert.match(source, /item\.dateLabelPrefix \? `\$\{item\.dateLabelPrefix\}: ` : ""/);
  assert.match(source, /membershipSummaryHeader/);
  assert.match(source, /<h2 className=\{styles\.membershipTitle\}>\{membership\.planTitle\}<\/h2>/);
  assert.doesNotMatch(source, /Current membership/);
  assert.doesNotMatch(source, /Keep your plan and renewal details easy to confirm\./);
  assert.doesNotMatch(source, /<Badge tone=\{item\.paymentStatusTone\}>\{item\.paymentStatusLabel\}<\/Badge>\s*<Badge tone=\{item\.attendanceStatusTone\}>\{item\.attendanceStatusLabel\}<\/Badge>/);
});
