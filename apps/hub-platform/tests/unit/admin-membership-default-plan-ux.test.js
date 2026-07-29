import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("membership plan manager source explains default, public, and private plan semantics", () => {
  const source = readFileSync(
    new URL("../../src/components/patterns/hub-payments-workspace/MembershipPlanManager.jsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /Default plan/);
  assert.match(source, /Upgrade plan/);
  assert.match(source, /default free plan/i);
  assert.match(source, /assigned automatically when someone joins your community/i);
  assert.match(source, /Only the title and description can be edited for the default plan\./);
  assert.match(source, /treated as optional upgrades/i);
  assert.match(source, /Public plans appear to members as upgrade options/i);
  assert.match(source, /Private plans stay admin-assigned only/i);
  assert.match(source, /The default plan stays free so every new member starts on the community baseline before choosing any upgrade\./);
  assert.match(source, /The default membership plan stays active because it is assigned automatically when someone joins\./);
  assert.match(source, /Pending upgrade requests/i);
  assert.match(source, /Approve request/);
  assert.match(source, /Open member/);
});

test("member membership provisioning source distinguishes the default plan from upgrade plans", () => {
  const provisioningSource = readFileSync(
    new URL("../../src/components/patterns/admin-member-detail-workspace/MemberMembershipProvisioningSection.jsx", import.meta.url),
    "utf8"
  );
  const membershipSectionSource = readFileSync(
    new URL("../../src/components/patterns/admin-member-detail-workspace/MemberMembershipSection.jsx", import.meta.url),
    "utf8"
  );

  assert.match(provisioningSource, /Choose the plan to assign to this member\./);
  assert.match(provisioningSource, /\(Default plan\)/);
  assert.match(provisioningSource, /\(Upgrade plan\)/);
  assert.doesNotMatch(provisioningSource, /Cancelled/);
  assert.match(provisioningSource, /Default membership stays active\./);
  assert.match(provisioningSource, /Suspend the member from the profile header if access should be blocked\./);
  assert.match(membershipSectionSource, /membership\.isDefault \? "Default plan" : "Upgrade plan"/);
  assert.match(membershipSectionSource, /<Badge tone="neutral">/);
  assert.doesNotMatch(membershipSectionSource, /Membership payment status/);
  assert.doesNotMatch(membershipSectionSource, /Save payment status/);
});

test("membership payment history source distinguishes current and historical records", () => {
  const paymentHistorySource = readFileSync(
    new URL("../../src/components/patterns/admin-member-detail-workspace/MemberPaymentHistorySection.jsx", import.meta.url),
    "utf8"
  );
  const paymentRecordsSource = readFileSync(
    new URL("../../src/lib/data/membership-payment-records.js", import.meta.url),
    "utf8"
  );

  assert.match(paymentHistorySource, /Payment history/);
  assert.match(paymentHistorySource, /item\.historyLabel/);
  assert.match(paymentRecordsSource, /Current cycle/);
  assert.match(paymentRecordsSource, /Previous assignment/);
  assert.match(paymentRecordsSource, /Previous cycle/);
});
