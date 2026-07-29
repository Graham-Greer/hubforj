import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeOfferingPaymentConfiguration,
  resolveOfferingPaymentConfiguration,
} from "../../src/lib/domain/offering-payments.js";

test("normalizeOfferingPaymentConfiguration trims values and validates URLs when present", () => {
  assert.deepEqual(
    normalizeOfferingPaymentConfiguration({
      externalPaymentUrl: " https://payments.example.com/checkout ",
      paymentInstructions: "  Pay before attending.  ",
    }),
    {
      externalPaymentUrl: "https://payments.example.com/checkout",
      paymentInstructions: "Pay before attending.",
    }
  );

  assert.throws(
    () =>
      normalizeOfferingPaymentConfiguration({
        externalPaymentUrl: "ftp://payments.example.com/checkout",
      }),
    /External payment link must use http or https\./
  );
});

test("resolveOfferingPaymentConfiguration requires external links for external paid offerings", () => {
  assert.deepEqual(
    resolveOfferingPaymentConfiguration({
      pricingMode: "paid",
      paymentProcessingMode: "external",
      externalPaymentUrl: "https://payments.example.com/checkout",
      paymentInstructions: "Bring your confirmation email.",
      offeringLabel: "Paid events",
    }),
    {
      externalPaymentUrl: "https://payments.example.com/checkout",
      paymentInstructions: "Bring your confirmation email.",
    }
  );

  assert.deepEqual(
    resolveOfferingPaymentConfiguration({
      pricingMode: "paid",
      paymentProcessingMode: "external",
      externalPaymentUrl: "",
      paymentInstructions: "Pay by bank transfer using your membership number as the reference.",
      offeringLabel: "Paid events",
    }),
    {
      externalPaymentUrl: "",
      paymentInstructions: "Pay by bank transfer using your membership number as the reference.",
    }
  );

  assert.throws(
    () =>
      resolveOfferingPaymentConfiguration({
        pricingMode: "paid",
        paymentProcessingMode: "external",
        externalPaymentUrl: "",
        paymentInstructions: "",
        offeringLabel: "Paid events",
      }),
    /Paid events must include an external payment link, payment instructions, or both\./
  );
});

test("resolveOfferingPaymentConfiguration clears external fields for free and internal offerings", () => {
  assert.deepEqual(
    resolveOfferingPaymentConfiguration({
      pricingMode: "free",
      paymentProcessingMode: "external",
      externalPaymentUrl: "https://payments.example.com/checkout",
      paymentInstructions: "Bring your confirmation email.",
    }),
    {
      externalPaymentUrl: "",
      paymentInstructions: "",
    }
  );

  assert.deepEqual(
    resolveOfferingPaymentConfiguration({
      pricingMode: "paid",
      paymentProcessingMode: "internal",
      externalPaymentUrl: "https://payments.example.com/checkout",
      paymentInstructions: "Bring your confirmation email.",
    }),
    {
      externalPaymentUrl: "",
      paymentInstructions: "",
    }
  );
});

test("resolveOfferingPaymentConfiguration rejects paid offerings on packages without payment support", () => {
  assert.throws(
    () =>
      resolveOfferingPaymentConfiguration({
        pricingMode: "paid",
        paymentProcessingMode: "none",
        offeringLabel: "Paid memberships",
      }),
    /Paid memberships cannot be configured as paid on the current package\./
  );
});
