function normalizeString(value) {
  return String(value || "").trim();
}

export function normalizeExternalPaymentUrl(value) {
  return normalizeString(value);
}

export function assertValidExternalPaymentUrl(url, label = "External payment link") {
  const normalizedUrl = normalizeExternalPaymentUrl(url);

  if (!normalizedUrl) {
    throw new Error(`${label} is required.`);
  }

  let parsed;

  try {
    parsed = new URL(normalizedUrl);
  } catch {
    throw new Error(`${label} must be a valid URL.`);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`${label} must use http or https.`);
  }
}

export function normalizeOfferingPaymentConfiguration(payload = {}) {
  const externalPaymentUrl = normalizeExternalPaymentUrl(payload.externalPaymentUrl);
  const paymentInstructions = normalizeString(payload.paymentInstructions);

  if (externalPaymentUrl) {
    assertValidExternalPaymentUrl(externalPaymentUrl);
  }

  return {
    externalPaymentUrl,
    paymentInstructions,
  };
}

export function assertExternalPaymentMethodConfigured({
  externalPaymentUrl = "",
  paymentInstructions = "",
  offeringLabel = "Paid offering",
} = {}) {
  const normalizedExternalPaymentUrl = normalizeExternalPaymentUrl(externalPaymentUrl);
  const normalizedPaymentInstructions = normalizeString(paymentInstructions);

  if (!normalizedExternalPaymentUrl && !normalizedPaymentInstructions) {
    throw new Error(
      `${offeringLabel} must include an external payment link, payment instructions, or both.`
    );
  }
}

export function resolveOfferingPaymentConfiguration({
  pricingMode = "free",
  paymentProcessingMode = "none",
  externalPaymentUrl = "",
  paymentInstructions = "",
  offeringLabel = "Paid offering",
} = {}) {
  const normalizedPricingMode = normalizeString(pricingMode).toLowerCase() || "free";
  const normalizedPaymentProcessingMode = normalizeString(paymentProcessingMode).toLowerCase() || "none";
  const normalizedExternalPaymentUrl = normalizeExternalPaymentUrl(externalPaymentUrl);
  const normalizedPaymentInstructions = normalizeString(paymentInstructions);

  if (normalizedPricingMode !== "paid") {
    return {
      externalPaymentUrl: "",
      paymentInstructions: "",
    };
  }

  if (normalizedPaymentProcessingMode === "external") {
    assertExternalPaymentMethodConfigured({
      externalPaymentUrl: normalizedExternalPaymentUrl,
      paymentInstructions: normalizedPaymentInstructions,
      offeringLabel,
    });

    return {
      externalPaymentUrl: normalizedExternalPaymentUrl,
      paymentInstructions: normalizedPaymentInstructions,
    };
  }

  if (normalizedPaymentProcessingMode === "internal") {
    return {
      externalPaymentUrl: "",
      paymentInstructions: "",
    };
  }

  throw new Error(`${offeringLabel} cannot be configured as paid on the current package.`);
}
