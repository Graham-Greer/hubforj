import test from "node:test";
import assert from "node:assert/strict";
import {
  filterDuplicateMembershipCyclePaymentRecords,
  getPaymentItemKindLabel,
  summarizeCollectedRevenue,
  summarizeHubPaymentItems,
  summarizePaymentItemCollectedRevenue,
  summarizePaymentItemRefundedRevenue,
} from "../../src/lib/domain/payments.js";
import { resolveOfferingRegistrationLedgerState } from "../../src/lib/domain/payment-records.js";

test("payment item kind labels map supported records", () => {
  assert.equal(getPaymentItemKindLabel("membership"), "Membership");
  assert.equal(getPaymentItemKindLabel("event"), "Event");
  assert.equal(getPaymentItemKindLabel("course"), "Course");
  assert.equal(getPaymentItemKindLabel("unknown"), "Payment item");
});

test("hub payment summary counts action required, settled, and item mix", () => {
  const summary = summarizeHubPaymentItems([
    { kind: "membership", paymentStatus: "unpaid" },
    { kind: "event", paymentStatus: "overdue" },
    { kind: "course", paymentStatus: "failed" },
    { kind: "event", paymentStatus: "paid" },
    { kind: "membership", paymentStatus: "not_required" },
  ]);

  assert.deepEqual(summary, {
    total: 5,
    actionRequired: 3,
    settled: 2,
    membership: 2,
    bookings: 3,
  });
});

test("collected revenue summary preserves zero-decimal currencies", () => {
  const summary = summarizeCollectedRevenue(
    {
      paymentRecords: [
        {
          financialStatus: "paid",
          currency: "JPY",
          amountMinor: 2500,
          refundAmountMinor: 0,
          reportingEligibility: "count_in_revenue",
        },
      ],
      nativeTransactions: [],
    },
    (amount, currency) => `${currency} ${amount}`
  );

  assert.equal(summary.amount, 2500);
  assert.equal(summary.currency, "JPY");
});

test("collected revenue summary de-duplicates native membership upgrade and membership cycle records", () => {
  const summary = summarizeCollectedRevenue(
    {
      paymentRecords: [
        {
          id: "payment_record_membership_upgrade_request_1",
          kind: "membership_upgrade",
          sourceType: "membershipUpgradeRequest",
          userId: "member_1",
          title: "Supporter upgrade",
          financialStatus: "paid",
          currency: "EUR",
          amountMinor: 1900,
          amountDisplay: "19",
          paidAt: "2026-06-10T10:00:00.000Z",
          occurredAt: "2026-06-10T09:55:00.000Z",
          reportingEligibility: "count_in_revenue",
        },
        {
          id: "payment_record_membership_payment_current",
          kind: "membership_cycle",
          sourceType: "membershipPayment",
          sourceId: "membership_current",
          userId: "member_1",
          title: "Supporter membership cycle",
          financialStatus: "paid",
          currency: "EUR",
          amountMinor: 1900,
          amountDisplay: "19",
          paidAt: "2026-06-10T10:05:00.000Z",
          occurredAt: "2026-06-10T10:05:00.000Z",
          reportingEligibility: "count_in_revenue",
        },
      ],
      nativeTransactions: [],
    },
    (amount, currency) => `${currency} ${amount}`
  );

  assert.equal(summary.amount, 19);
  assert.equal(summary.currency, "EUR");
  assert.equal(summary.formatted, "EUR 19");
});

test("membership upgrade de-duplication preserves later renewal records at the same price", () => {
  const paymentRecords = [
    {
      id: "payment_record_membership_upgrade_request_1",
      kind: "membership_upgrade",
      sourceType: "membershipUpgradeRequest",
      userId: "member_1",
      financialStatus: "paid",
      currency: "EUR",
      amountMinor: 1900,
      amountDisplay: "19",
      paidAt: "2026-06-10T10:00:00.000Z",
      reportingEligibility: "count_in_revenue",
    },
    {
      id: "payment_record_membership_payment_current",
      kind: "membership_cycle",
      sourceType: "membershipPayment",
      sourceId: "membership_current",
      userId: "member_1",
      financialStatus: "paid",
      currency: "EUR",
      amountMinor: 1900,
      amountDisplay: "19",
      paidAt: "2026-06-10T10:05:00.000Z",
      reportingEligibility: "count_in_revenue",
    },
    {
      id: "payment_record_membership_payment_renewal",
      kind: "membership_cycle",
      sourceType: "membershipPayment",
      sourceId: "membership_renewal",
      userId: "member_1",
      financialStatus: "paid",
      currency: "EUR",
      amountMinor: 1900,
      amountDisplay: "19",
      paidAt: "2026-09-10T10:00:00.000Z",
      reportingEligibility: "count_in_revenue",
    },
  ];

  const filteredRecords = filterDuplicateMembershipCyclePaymentRecords(paymentRecords);
  const summary = summarizeCollectedRevenue(
    {
      paymentRecords,
      nativeTransactions: [],
    },
    (amount, currency) => `${currency} ${amount}`
  );

  assert.deepEqual(
    filteredRecords.map((record) => record.id),
    ["payment_record_membership_upgrade_request_1", "payment_record_membership_payment_renewal"]
  );
  assert.equal(summary.amount, 38);
  assert.equal(summary.currency, "EUR");
});

test("payment item revenue summaries match the payments workspace visible-card calculation", () => {
  const items = [
    {
      paymentStatus: "paid",
      currency: "GBP",
      amountMinor: 4900,
      refundAmountMinor: 0,
    },
    {
      paymentStatus: "paid",
      currency: "GBP",
      amountMinor: 1900,
      refundAmountMinor: 500,
    },
    {
      paymentStatus: "refunded",
      currency: "GBP",
      amountMinor: 1900,
      refundAmountMinor: 0,
    },
  ];
  const collected = summarizePaymentItemCollectedRevenue(items, (amount, currency) => `${currency} ${amount}`);
  const refunded = summarizePaymentItemRefundedRevenue(items, (amount, currency) => `${currency} ${amount}`);

  assert.equal(collected.amount, 63);
  assert.equal(collected.formatted, "GBP 63");
  assert.equal(refunded.amount, 24);
  assert.equal(refunded.formatted, "GBP 24");
});

test("offering ledger state distinguishes partial refunds from full refunds", () => {
  assert.deepEqual(
    resolveOfferingRegistrationLedgerState("payment_received", {
      refunded: true,
      refundAmountMinor: 500,
      totalAmountMinor: 1500,
    }),
    {
      operationalStatus: "completed",
      financialStatus: "partially_refunded",
    }
  );

  assert.deepEqual(
    resolveOfferingRegistrationLedgerState("payment_received", {
      refunded: true,
      refundAmountMinor: 1500,
      totalAmountMinor: 1500,
    }),
    {
      operationalStatus: "cancelled",
      financialStatus: "refunded",
    }
  );
});
