import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("admin payments page source loads pending membership upgrade requests into the plans workspace", () => {
  const source = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/payments/page.jsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /listPendingMembershipUpgradeRequestsByHub/);
  assert.match(source, /pendingUpgradeRequests=\{pendingUpgradeRequests\}/);
  assert.match(source, /approveMembershipUpgradeRequestAction/);
  assert.match(source, /success === "upgradeRequestApproved"/);
});

test("hub payments data source includes native Stripe membership upgrade transactions", () => {
  const source = readFileSync(
    new URL("../../src/lib/data/hub-payments.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /listNativePaymentTransactionsByHub/);
  assert.match(source, /listPendingMembershipUpgradeRequestsByHub/);
  assert.match(source, /filterDuplicateMembershipCyclePaymentRecords/);
  assert.match(source, /reportablePaymentRecords/);
  assert.match(source, /summarizePaymentItemCollectedRevenue/);
  assert.match(source, /summarizePaymentItemRefundedRevenue/);
  assert.match(source, /isMembershipUpgradeRecord/);
  assert.match(source, /isNativeTransactionOperationallyRelevant/);
  assert.match(source, /isPendingNativeUpgradeTransaction/);
  assert.match(source, /membershipUpgradeRequestId/);
  assert.match(source, /status === "checkout_open"/);
  assert.match(source, /status === "checkout_completed"/);
  assert.match(source, /status === "payment_failed"/);
  assert.match(source, /Stripe payment received for a membership upgrade\./);
  assert.match(source, /Stripe checkout is in progress for a membership upgrade\./);
  assert.match(source, /buildPaymentDetailHref/);
});

test("hub payments workspace source passes pending upgrade requests into membership plan administration", () => {
  const source = readFileSync(
    new URL("../../src/components/patterns/hub-payments-workspace/HubPaymentsWorkspace.jsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /pendingUpgradeRequests = \[\]/);
  assert.match(source, /pendingUpgradeRequests=\{pendingUpgradeRequests\}/);
  assert.match(source, /approveMembershipUpgradeRequestAction=\{approveMembershipUpgradeRequestAction\}/);
});

test("hub payments workspace source applies shared pagination controls to the filtered payment queue", () => {
  const workspaceSource = readFileSync(
    new URL("../../src/components/patterns/hub-payments-workspace/HubPaymentsWorkspace.jsx", import.meta.url),
    "utf8"
  );

  assert.match(workspaceSource, /PaginationControls/);
  assert.match(workspaceSource, /totalCount=\{workspace\.filteredItems\.length\}/);
  assert.match(workspaceSource, /items=\{workspace\.paginatedItems\}/);
  assert.match(workspaceSource, /pageSizeOptions=\{\[5, 10, 20\]\}/);
  assert.match(workspaceSource, /itemLabel="payment records"/);
});

test("hub payments table aligns to the shared admin record inset tokens", () => {
  const source = readFileSync(
    new URL("../../src/components/patterns/hub-payments-workspace/HubPaymentsWorkspace.module.css", import.meta.url),
    "utf8"
  );

  assert.match(source, /padding: var\(--admin-record-pad-block\) var\(--admin-record-pad-inline\);/);
  assert.match(source, /padding: 0 var\(--admin-record-header-pad-inline\);/);
});
