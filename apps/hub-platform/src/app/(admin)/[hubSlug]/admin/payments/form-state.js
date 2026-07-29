function readString(formData, key, fallback = "") {
  return String(formData.get(key) ?? fallback);
}

export const initialMembershipPlanActionState = {
  error: "",
  values: {
    title: "",
    description: "",
    pricingMode: "paid",
    price: "",
    currency: "USD",
    externalPaymentUrl: "",
    paymentInstructions: "",
    durationUnit: "months",
    durationValue: "12",
    visibility: "public",
    status: "active",
  },
};

export const initialDeleteMembershipPlanActionState = {
  error: "",
  confirmation: "",
};

export function extractMembershipPlanFormValues(formData) {
  return {
    title: readString(formData, "title"),
    description: readString(formData, "description"),
    pricingMode: readString(formData, "pricingMode", "paid"),
    price: readString(formData, "price"),
    currency: readString(formData, "currency", "USD"),
    externalPaymentUrl: readString(formData, "externalPaymentUrl"),
    paymentInstructions: readString(formData, "paymentInstructions"),
    durationUnit: readString(formData, "durationUnit", "months"),
    durationValue: readString(formData, "durationValue", "12"),
    visibility: readString(formData, "visibility", "public"),
    status: readString(formData, "status", "active"),
  };
}

export function extractDeleteMembershipPlanFormValues(formData) {
  return {
    confirmation: readString(formData, "confirmation"),
    expectedTitle: readString(formData, "expectedTitle"),
  };
}

export function validateMembershipPlanDeletionConfirmation({ confirmation, expectedTitle }) {
  const normalizedConfirmation = confirmation.trim();
  const normalizedExpectedTitle = expectedTitle.trim();

  if (!normalizedExpectedTitle) {
    return "Membership plan title is required before deleting the plan.";
  }

  if (normalizedConfirmation !== normalizedExpectedTitle) {
    return `Type the full plan title (${normalizedExpectedTitle}) to confirm deletion.`;
  }

  return "";
}
