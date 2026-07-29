function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeBoolean(value) {
  return value === true;
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((entry) => normalizeString(entry)).filter(Boolean);
}

export const hubPaymentConfigurationStatusLabels = {
  not_configured: "Not configured",
  onboarding_in_progress: "Onboarding in progress",
  requirements_due: "Requirements due",
  pending_review: "Pending review",
  enabled: "Ready",
  restricted: "Restricted",
  disabled: "Disabled",
};

export const hubPaymentConfigurationStatusTones = {
  not_configured: "neutral",
  onboarding_in_progress: "warning",
  requirements_due: "warning",
  pending_review: "warning",
  enabled: "success",
  restricted: "danger",
  disabled: "danger",
};

const allowedHubPaymentConfigurationStatuses = new Set(Object.keys(hubPaymentConfigurationStatusLabels));

function normalizeHubPaymentConfigurationStatus(value, fallback = "not_configured") {
  const normalized = normalizeString(value);

  if (allowedHubPaymentConfigurationStatuses.has(normalized)) {
    return normalized;
  }

  return fallback;
}

function deriveHubPaymentConfigurationStatus(record = {}) {
  const explicitStatus = normalizeHubPaymentConfigurationStatus(record.status, "");

  if (explicitStatus) {
    return explicitStatus;
  }

  const stripeAccountId = normalizeString(record.stripeAccountId);
  const detailsSubmitted = normalizeBoolean(record.detailsSubmitted);
  const chargesEnabled = normalizeBoolean(record.chargesEnabled);
  const payoutsEnabled = normalizeBoolean(record.payoutsEnabled);
  const requirementsCurrentlyDue = normalizeStringArray(record.requirementsCurrentlyDue);
  const requirementsPastDue = normalizeStringArray(record.requirementsPastDue);
  const requirementsPendingVerification = normalizeStringArray(record.requirementsPendingVerification);
  const disabledReason = normalizeString(record.disabledReason);

  if (!stripeAccountId) {
    return "not_configured";
  }

  if (disabledReason) {
    return "disabled";
  }

  if (requirementsPastDue.length || requirementsCurrentlyDue.length) {
    return "requirements_due";
  }

  if (requirementsPendingVerification.length) {
    return "pending_review";
  }

  if (chargesEnabled && payoutsEnabled && detailsSubmitted) {
    return "enabled";
  }

  if (detailsSubmitted && !chargesEnabled) {
    return "restricted";
  }

  return "onboarding_in_progress";
}

export function normalizeHubPaymentConfiguration(record = {}) {
  const status = deriveHubPaymentConfigurationStatus(record);
  const stripeAccountId = normalizeString(record.stripeAccountId);
  const provider = normalizeString(record.provider) || "stripe";
  const chargesEnabled = normalizeBoolean(record.chargesEnabled);
  const payoutsEnabled = normalizeBoolean(record.payoutsEnabled);
  const detailsSubmitted = normalizeBoolean(record.detailsSubmitted);
  const requirementsCurrentlyDue = normalizeStringArray(record.requirementsCurrentlyDue);
  const requirementsEventuallyDue = normalizeStringArray(record.requirementsEventuallyDue);
  const requirementsPastDue = normalizeStringArray(record.requirementsPastDue);
  const requirementsPendingVerification = normalizeStringArray(record.requirementsPendingVerification);

  return {
    provider,
    status,
    statusLabel: hubPaymentConfigurationStatusLabels[status] || hubPaymentConfigurationStatusLabels.not_configured,
    statusTone: hubPaymentConfigurationStatusTones[status] || hubPaymentConfigurationStatusTones.not_configured,
    stripeAccountId,
    country: normalizeString(record.country),
    defaultCurrency: normalizeString(record.defaultCurrency).toUpperCase(),
    businessType: normalizeString(record.businessType),
    chargesEnabled,
    payoutsEnabled,
    detailsSubmitted,
    requirementsCurrentlyDue,
    requirementsEventuallyDue,
    requirementsPastDue,
    requirementsPendingVerification,
    createdAt: normalizeString(record.createdAt),
    updatedAt: normalizeString(record.updatedAt),
    onboardingStartedAt: normalizeString(record.onboardingStartedAt),
    onboardingCompletedAt: normalizeString(record.onboardingCompletedAt),
    disabledReason: normalizeString(record.disabledReason),
    updatedBy: normalizeString(record.updatedBy),
    hasConnectedAccount: Boolean(stripeAccountId),
    isReady: status === "enabled",
    hasOutstandingRequirements:
      requirementsCurrentlyDue.length > 0
      || requirementsPastDue.length > 0
      || requirementsPendingVerification.length > 0,
  };
}

export function getHubPaymentSetupState(hub = {}, paymentConfiguration = null) {
  const paymentProcessingMode = normalizeString(hub?.packagePaymentProcessingMode);
  const supportsNativePayments = hub?.packageCapabilities?.nativePaymentsEnabled === true;
  const configuration = normalizeHubPaymentConfiguration(paymentConfiguration || {});

  if (!supportsNativePayments || paymentProcessingMode !== "internal") {
    return {
      key: "locked",
      title: "Built-in payments start on Growth",
      description:
        "Package management with Hubforj stays in your commercial account area. Native member payments only unlock inside the hub once the current package supports built-in payments.",
      statusLabel: "Growth required",
      statusTone: "warning",
      configuration,
    };
  }

  if (configuration.status === "not_configured") {
    return {
      key: "not_configured",
      title: "Stripe is not connected yet",
      description:
        "Create the connected Stripe account record from Hubforj, then complete embedded onboarding here before members can pay natively inside the hub.",
      statusLabel: configuration.statusLabel,
      statusTone: configuration.statusTone,
      configuration,
    };
  }

  if (configuration.status === "enabled") {
    return {
      key: "ready",
      title: "Native payments are ready",
      description:
        "This hub has completed Stripe setup and can use built-in member payments on eligible Growth payment flows.",
      statusLabel: configuration.statusLabel,
      statusTone: configuration.statusTone,
      configuration,
    };
  }

  if (configuration.status === "disabled") {
    return {
      key: "disabled",
      title: "Stripe setup needs attention",
      description:
        "A connected account exists, but Stripe is not currently allowing this hub to take payments. Review the account status and resolve the underlying issue before using native checkout.",
      statusLabel: configuration.statusLabel,
      statusTone: configuration.statusTone,
      configuration,
    };
  }

  if (configuration.status === "restricted") {
    return {
      key: "restricted",
      title: "Stripe setup is restricted",
      description:
        "The connected account exists, but Stripe has not fully enabled charges yet. Keep native payment flows blocked until the remaining account restrictions are cleared.",
      statusLabel: configuration.statusLabel,
      statusTone: configuration.statusTone,
      configuration,
    };
  }

  if (configuration.status === "pending_review") {
    return {
      key: "pending_review",
      title: "Stripe is reviewing the account",
      description:
        "Setup is mostly complete, but Stripe still has verification work pending. Native payment flows should stay blocked until the account becomes fully ready.",
      statusLabel: configuration.statusLabel,
      statusTone: configuration.statusTone,
      configuration,
    };
  }

  return {
    key: "in_progress",
    title: "Stripe onboarding is in progress",
    description:
      "The connected account exists, but onboarding still has outstanding requirements. Keep setup inside Hubforj until Stripe confirms the account is ready.",
    statusLabel: configuration.statusLabel,
    statusTone: configuration.statusTone,
    configuration,
  };
}

export function hubUsesInternalNativePayments(hub = {}) {
  const paymentProcessingMode = normalizeString(hub?.packagePaymentProcessingMode);
  const supportsNativePayments = hub?.packageCapabilities?.nativePaymentsEnabled === true;

  return supportsNativePayments && paymentProcessingMode === "internal";
}

export function isHubNativePaymentsReady(hub = {}, paymentConfiguration = null) {
  if (!hubUsesInternalNativePayments(hub)) {
    return true;
  }

  return getHubPaymentSetupState(hub, paymentConfiguration).key === "ready";
}

export function assertHubNativePaymentsReady(
  hub = {},
  paymentConfiguration = null,
  actionLabel = "using paid Growth payment flows"
) {
  if (isHubNativePaymentsReady(hub, paymentConfiguration)) {
    return;
  }

  throw new Error(`Complete Stripe setup before ${actionLabel}.`);
}
