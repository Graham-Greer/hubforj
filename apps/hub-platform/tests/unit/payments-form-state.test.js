import test from "node:test";
import assert from "node:assert/strict";
import {
  extractDeleteMembershipPlanFormValues,
  extractMembershipPlanFormValues,
  validateMembershipPlanDeletionConfirmation,
} from "../../src/app/(admin)/[hubSlug]/admin/payments/form-state.js";

test("membership plan form values include pricing mode and visibility for plan actions", () => {
  const formData = new FormData();
  formData.set("title", "Standard");
  formData.set("description", "Annual access");
  formData.set("pricingMode", "free");
  formData.set("price", "");
  formData.set("currency", "GBP");
  formData.set("externalPaymentUrl", "https://payments.example.com/standard");
  formData.set("paymentInstructions", "Complete payment first, then we will confirm access.");
  formData.set("durationUnit", "months");
  formData.set("durationValue", "12");
  formData.set("visibility", "private");
  formData.set("status", "active");

  assert.deepEqual(extractMembershipPlanFormValues(formData), {
    title: "Standard",
    description: "Annual access",
    pricingMode: "free",
    price: "",
    currency: "GBP",
    externalPaymentUrl: "https://payments.example.com/standard",
    paymentInstructions: "Complete payment first, then we will confirm access.",
    durationUnit: "months",
    durationValue: "12",
    visibility: "private",
    status: "active",
  });
});

test("membership plan form values fall back to USD when currency is omitted", () => {
  const formData = new FormData();
  formData.set("title", "Standard");
  formData.set("description", "Annual access");

  assert.equal(extractMembershipPlanFormValues(formData).currency, "USD");
});

test("membership plan delete confirmation requires the exact plan title", () => {
  const formData = new FormData();
  formData.set("confirmation", "Standard");
  formData.set("expectedTitle", "Standard");

  assert.deepEqual(extractDeleteMembershipPlanFormValues(formData), {
    confirmation: "Standard",
    expectedTitle: "Standard",
  });
  assert.equal(validateMembershipPlanDeletionConfirmation(extractDeleteMembershipPlanFormValues(formData)), "");
  assert.match(
    validateMembershipPlanDeletionConfirmation({
      confirmation: "standard",
      expectedTitle: "Standard",
    }),
    /Type the full plan title/i
  );
});
