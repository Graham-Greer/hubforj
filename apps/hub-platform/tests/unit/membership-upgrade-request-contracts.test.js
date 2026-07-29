import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("membership upgrade request data source keeps requestability and approval explicit", () => {
  const source = readFileSync(
    new URL("../../src/lib/data/membership-upgrade-requests.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /collection\("membershipUpgradeRequests"\)/);
  assert.match(source, /status: "pending"/);
  assert.match(source, /getAvailableMembershipUpgradePlans/);
  assert.match(source, /You already have a membership upgrade request awaiting review\./);
  assert.match(source, /upsertMembershipForUser/);
  assert.match(source, /Approved from membership upgrade request\./);
  assert.match(source, /syncPaymentRecordToLedger: !normalizeString\(request\.nativePaymentTransactionId\)/);
  assert.match(source, /status: "approved"/);
  assert.match(source, /export async function cancelMembershipUpgradeRequest/);
  assert.match(source, /This membership upgrade request can no longer be cancelled\./);
  assert.match(source, /status: "cancelled"/);
});

test("membership assignment can preserve membership history without duplicating native Stripe upgrade ledger records", () => {
  const membershipUserSource = readFileSync(
    new URL("../../src/lib/data/membership-user-records.js", import.meta.url),
    "utf8"
  );
  const membershipSharedSource = readFileSync(
    new URL("../../src/lib/data/membership-shared.js", import.meta.url),
    "utf8"
  );

  assert.match(membershipUserSource, /syncToLedger: payload\.syncPaymentRecordToLedger !== false/);
  assert.match(membershipSharedSource, /syncToLedger = true/);
  assert.match(membershipSharedSource, /if \(syncToLedger\) \{/);
  assert.match(membershipSharedSource, /syncMembershipPaymentRecordToLedger/);
});

test("membership payment history de-duplicates native Stripe upgrade payments from membership cycle rows", () => {
  const source = readFileSync(
    new URL("../../src/lib/data/membership-payment-records.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /normalizeMembershipCommercialTitle/);
  assert.match(source, /buildMembershipPaymentMatchKey/);
  assert.match(source, /nativeUpgradePaymentKeys/);
  assert.match(source, /membershipHistoryRows/);
  assert.match(source, /!nativeUpgradePaymentKeys\.has\(buildMembershipPaymentMatchKey\(row\)\)/);
  assert.match(source, /userId: record\.userId/);
});

test("admin member detail source exposes pending upgrade request review", () => {
  const source = readFileSync(
    new URL("../../src/components/patterns/admin-member-detail-workspace/MemberMembershipSection.jsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /Upgrade request pending/);
  assert.match(source, /The member has started an upgrade request for this plan/i);
  assert.match(source, /Approve upgrade request/);
  assert.match(source, /Approval payment status/);
});
