import test from "node:test";
import assert from "node:assert/strict";
import {
  assertMembershipPaymentStatusUpdate,
  buildMembershipUpgradeCta,
  deriveMembershipStatus,
  formatMembershipPlanCadence,
  formatMembershipDate,
  formatMoney,
  formatMoneyFromMinor,
  getAvailableMembershipUpgradePlans,
  getMembershipPaymentStatusLabel,
  getMembershipPaymentStatusTone,
  getMembershipStatusLabel,
  getMembershipStatusTone,
  normalizeMembershipAssignmentPayload,
  normalizeMembershipPlanPayload,
  summarizePaymentItems,
} from "../../src/lib/domain/memberships.js";

test("membership status derives expired when renewal has passed", () => {
  assert.equal(
    deriveMembershipStatus({ status: "active", renewalDate: "2026-03-01T10:00:00.000Z" }, new Date("2026-03-15T10:00:00.000Z")),
    "expired"
  );
  assert.equal(deriveMembershipStatus({ status: "cancelled", renewalDate: "2026-04-01T10:00:00.000Z" }), "cancelled");
});

test("membership label and tone helpers map supported states", () => {
  assert.equal(getMembershipStatusLabel("active"), "Active");
  assert.equal(getMembershipStatusTone("expired"), "danger");
  assert.equal(getMembershipPaymentStatusLabel("paid"), "Paid");
  assert.equal(getMembershipPaymentStatusTone("overdue"), "danger");
  assert.equal(getMembershipPaymentStatusTone("refunded"), "info");
});

test("membership formatting helpers produce human-readable values", () => {
  assert.equal(formatMembershipDate("", "en-GB"), "To be confirmed");
  assert.match(formatMembershipDate("2026-03-20T10:00:00.000Z", "en-GB"), /20 Mar 2026/);
  assert.match(formatMoney("12.5", "GBP", "en-GB"), /£12\.50/);
  assert.match(formatMoney("£37.50", "GBP", "en-GB"), /£37\.50/);
  assert.match(formatMoney("GBP 1,250.00", "GBP", "en-GB"), /£1,250\.00/);
  assert.match(formatMoney("12.5", "EUR", "es-ES"), /^€\s?12\.50$/);
  assert.match(formatMoneyFromMinor(3750, "GBP", "en-GB"), /£37\.50/);
  assert.match(formatMoneyFromMinor(1250, "JPY", "en-GB"), /JP¥\s?1,250/);
  assert.equal(formatMembershipPlanCadence({ durationUnit: "months", durationValue: 1 }), "Every 1 month");
  assert.equal(formatMembershipPlanCadence({ durationUnit: "years", durationValue: 2 }), "Every 2 years");
});

test("payment summary counts due and settled items", () => {
  const summary = summarizePaymentItems([
    { paymentStatus: "paid" },
    { paymentStatus: "not_required" },
    { paymentStatus: "unpaid" },
    { paymentStatus: "overdue" },
  ]);

  assert.deepEqual(summary, {
    total: 4,
    due: 2,
    paid: 2,
  });
});

test("payment summary ignores cancelled booking debt in action-required counts", () => {
  const summary = summarizePaymentItems([
    { kind: "event", status: "cancelled", paymentStatus: "unpaid" },
    { kind: "course", status: "cancelled", paymentStatus: "failed" },
    { kind: "event", status: "registered", paymentStatus: "overdue" },
  ]);

  assert.deepEqual(summary, {
    total: 3,
    due: 1,
    paid: 0,
  });
});

test("membership assignment payload derives sensible defaults from the selected plan", () => {
  const payload = normalizeMembershipAssignmentPayload(
    {
      planId: "plan_basic",
      status: " active ",
      paymentStatus: " unpaid ",
      startDate: "2026-03-10T10:00",
      renewalDate: "",
      notes: "  Manual assignment  ",
    },
    {
      id: "plan_basic",
      pricingMode: "paid",
      durationUnit: "months",
      durationValue: 1,
    }
  );

  assert.equal(payload.planId, "plan_basic");
  assert.equal(payload.status, "active");
  assert.equal(payload.paymentStatus, "unpaid");
  assert.match(payload.startDate, /^2026-03-10T10:00:00/);
  assert.match(payload.renewalDate, /^2026-04-10T(09|10):00:00/);
  assert.equal(payload.notes, "Manual assignment");
});

test("membership assignment payload rejects renewal before start or invalid plan", () => {
  assert.throws(
    () =>
      normalizeMembershipAssignmentPayload(
        {
          planId: "plan_basic",
          startDate: "2026-03-10T10:00",
          renewalDate: "2026-03-01T10:00",
        },
        { id: "plan_basic", pricingMode: "paid", durationUnit: "months", durationValue: 1 }
      ),
    /Renewal date must be after the membership start date/
  );

  assert.throws(
    () =>
      normalizeMembershipAssignmentPayload(
        {
          planId: "plan_unknown",
        },
        { id: "plan_basic", pricingMode: "paid", durationUnit: "months", durationValue: 1 }
      ),
    /valid membership plan/i
  );
});

test("membership assignment payload keeps free plans settled", () => {
  assert.throws(
    () =>
      normalizeMembershipAssignmentPayload(
        {
          planId: "plan_free",
          paymentStatus: "unpaid",
        },
        {
          id: "plan_free",
          pricingMode: "free",
          durationUnit: "months",
          durationValue: 1,
        }
      ),
    /Free membership plans are always settled\./
  );
});

test("default membership assignment cannot be made inactive and should use suspension instead", () => {
  assert.throws(
    () =>
      normalizeMembershipAssignmentPayload(
        {
          planId: "plan_default",
          status: "inactive",
          paymentStatus: "paid",
        },
        {
          id: "plan_default",
          isDefault: true,
          pricingMode: "free",
          durationUnit: "months",
          durationValue: 12,
        }
      ),
    /Default membership must stay active\. Suspend the member instead if access should be blocked\./
  );
});

test("membership payment updates reject not-required on paid plans and lock free plans to settled", () => {
  assert.throws(
    () => assertMembershipPaymentStatusUpdate({ pricingMode: "paid" }, "not_required"),
    /Only free membership plans can be marked as not required\./
  );

  assert.equal(assertMembershipPaymentStatusUpdate({ pricingMode: "free" }, "not_required"), "not_required");
  assert.throws(
    () => assertMembershipPaymentStatusUpdate({ pricingMode: "free" }, "overdue"),
    /Free membership plans are always settled\./
  );
  assert.throws(
    () => assertMembershipPaymentStatusUpdate({ pricingMode: "free" }, "paid"),
    /Free membership plans are always settled\./
  );
});

test("membership plan payload normalizes valid plan input and rejects invalid configuration", () => {
  assert.deepEqual(
    normalizeMembershipPlanPayload({
      title: "  Standard ",
      description: "  Annual access ",
      pricingMode: " paid ",
      price: "25.00",
      currency: " gbp ",
      externalPaymentUrl: " https://payments.example.com/plan ",
      paymentInstructions: " Pay before activation. ",
      durationUnit: " months ",
      durationValue: "12",
      visibility: " private ",
      status: " active ",
    }),
    {
      title: "Standard",
      description: "Annual access",
      pricingMode: "paid",
      price: "25",
      currency: "GBP",
      externalPaymentUrl: "https://payments.example.com/plan",
      paymentInstructions: "Pay before activation.",
      durationUnit: "months",
      durationValue: 12,
      visibility: "private",
      status: "active",
    }
  );

  assert.throws(
    () =>
      normalizeMembershipPlanPayload({
        title: "",
        price: "0",
        durationUnit: "weeks",
        durationValue: "0",
      }),
    /membership plan title|required|duration unit/i
  );
});

test("membership plan payload normalizes free plans without requiring price", () => {
  assert.deepEqual(
    normalizeMembershipPlanPayload({
      title: "Community access",
      pricingMode: "free",
      price: "",
      currency: "gbp",
      durationUnit: "months",
      durationValue: "12",
      status: "active",
    }),
    {
      title: "Community access",
      description: "",
      pricingMode: "free",
      price: "0",
      currency: "GBP",
      externalPaymentUrl: "",
      paymentInstructions: "",
      durationUnit: "months",
      durationValue: 12,
      visibility: "public",
      status: "active",
    }
  );
});

test("membership upgrade plans exclude the default, current, inactive, and private plans", () => {
  const plans = [
    { id: "plan_default", isDefault: true, visibility: "public", status: "active" },
    { id: "plan_supporter", isDefault: false, visibility: "public", status: "active" },
    { id: "plan_patron", isDefault: false, visibility: "public", status: "inactive" },
    { id: "plan_partner", isDefault: false, visibility: "private", status: "active" },
    { id: "plan_vip", isDefault: false, visibility: "public", status: "active" },
  ];

  assert.deepEqual(
    getAvailableMembershipUpgradePlans(plans, { planId: "plan_supporter" }).map((plan) => plan.id),
    ["plan_vip"]
  );
});

test("membership upgrade CTA distinguishes external, internal, and contact-led upgrades", () => {
  assert.deepEqual(
    buildMembershipUpgradeCta({
      hubSlug: "oak-hill",
      paymentProcessingMode: "external",
      plan: {
        pricingMode: "paid",
        externalPaymentUrl: "https://payments.example.com/memberships/supporter",
        paymentInstructions: "Complete payment externally and the hub will confirm your upgrade.",
      },
    }),
    {
      label: "Continue to payment",
      href: "https://payments.example.com/memberships/supporter",
      external: true,
      supportingText: "Complete payment externally and the hub will confirm your upgrade.",
      tone: "external",
    }
  );

  assert.deepEqual(
    buildMembershipUpgradeCta({
      hubSlug: "oak-hill",
      paymentProcessingMode: "internal",
      plan: {
        pricingMode: "paid",
      },
    }),
    {
      label: "Upgrade with card",
      href: "",
      supportingText:
        "Complete a secure Stripe checkout to start this upgrade. Your current membership stays active until payment is confirmed and the upgrade is applied.",
      tone: "native",
    }
  );

  assert.deepEqual(
    buildMembershipUpgradeCta({
      hubSlug: "oak-hill",
      paymentProcessingMode: "none",
      plan: {
        pricingMode: "free",
      },
    }),
    {
      label: "Contact the hub to switch plans",
      href: "/oak-hill#footer-contact",
      supportingText:
        "This plan is available, but plan changes are still handled by the hub team.",
      tone: "contact",
    }
  );

  assert.deepEqual(
    buildMembershipUpgradeCta({
      hubSlug: "oak-hill",
      paymentProcessingMode: "internal",
      routeMode: "host",
      plan: {
        pricingMode: "paid",
      },
    }),
    {
      label: "Upgrade with card",
      href: "",
      supportingText:
        "Complete a secure Stripe checkout to start this upgrade. Your current membership stays active until payment is confirmed and the upgrade is applied.",
      tone: "native",
    }
  );
});
