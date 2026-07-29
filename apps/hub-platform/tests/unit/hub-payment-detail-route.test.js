import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("hub payments data source exposes a payment detail resolver keyed by queue item id", () => {
  const source = readFileSync(
    new URL("../../src/lib/data/hub-payments.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /export async function getHubPaymentItemDetailBySlug/);
  assert.match(source, /normalizedPaymentItemId\.startsWith\("ledger_"\)/);
  assert.match(source, /normalizedPaymentItemId\.startsWith\("native_"\)/);
  assert.match(source, /normalizedPaymentItemId\.startsWith\("membership_payment_"\)/);
  assert.match(source, /normalizedPaymentItemId\.startsWith\("event_"\)/);
  assert.match(source, /normalizedPaymentItemId\.startsWith\("course_"\)/);
  assert.match(source, /buildPaymentDetailHref/);
  assert.match(source, /memberRecordAvailable: usersById\.has\(normalizeString\(item\.userId\)\)/);
  assert.match(source, /item\.userName \|\| item\.userEmail \|\| "Former member"/);
  assert.match(source, /Recorded date/);
  assert.match(source, /lifecycleLabel \? `\$\{lifecycleLabel\} date` : "Recorded date"/);
  assert.match(source, /Booking status/);
  assert.match(source, /Enrolment status/);
  assert.match(source, /Open bookings/);
  assert.match(source, /Open registrations/);
  assert.match(source, /buildEventSnapshotComparison/);
  assert.match(source, /snapshotDrift/);
});

test("payment detail route source renders the dedicated payment workspace", () => {
  const pageSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/payments/[paymentItemId]/page.jsx", import.meta.url),
    "utf8"
  );
  const workspaceSource = readFileSync(
    new URL("../../src/components/patterns/hub-payments-workspace/PaymentDetailWorkspace.jsx", import.meta.url),
    "utf8"
  );

  assert.match(pageSource, /PaymentDetailWorkspace/);
  assert.match(pageSource, /getHubPaymentItemDetailBySlug/);
  assert.match(workspaceSource, /Back to payments/);
  assert.match(workspaceSource, /Payment summary/);
  assert.match(workspaceSource, /Member and linked record/);
  assert.match(workspaceSource, /Payment timeline/);
  assert.match(workspaceSource, /The member linked to this payment/);
  assert.match(workspaceSource, /For \{detail\.member\?\.name \|\| "Former member"\}/);
  assert.match(workspaceSource, /The membership, event, or course this payment is tied to/);
  assert.match(workspaceSource, /Booked snapshot and live event/);
  assert.match(workspaceSource, /This event has changed since the booking was placed\./);
  assert.match(workspaceSource, /buildStatusBadges/);
  assert.match(workspaceSource, /transactionStatus === "payment_received" && primaryStatus === "paid"/);
  assert.match(workspaceSource, /\(\(refundStatus === "refunded" \|\| refundStatus === "partially_refunded"\) && transactionStatus === "payment_received"\)/);
  assert.doesNotMatch(workspaceSource, /business object/);
  assert.doesNotMatch(workspaceSource, /operational payment record/i);
});
