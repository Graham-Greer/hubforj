function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeEmail(value) {
  return normalizeString(value).toLowerCase();
}

function normalizeSlug(value) {
  return normalizeString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeCount(value) {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function normalizeBoolean(value) {
  return Boolean(value);
}

function normalizeTier(value) {
  return normalizeString(value).toLowerCase();
}

export function normalizeCommercialAccountInput(values = {}) {
  const ownerFullName = normalizeString(values.ownerFullName);
  const ownerEmail = normalizeEmail(values.ownerEmail);

  if (!ownerFullName) {
    throw new Error("Owner name is required.");
  }

  if (!ownerEmail) {
    throw new Error("Owner email is required.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)) {
    throw new Error("Owner email must be valid.");
  }

  return {
    ownerFullName,
    ownerEmail,
  };
}

export function normalizeCommercialAccountRecord(record) {
  if (!record) {
    return null;
  }

  return {
    id: normalizeString(record.id),
    ownerFullName: normalizeString(record.ownerFullName),
    ownerEmail: normalizeEmail(record.ownerEmail),
    ownerEmailKey: normalizeString(record.ownerEmailKey),
    authUid: normalizeString(record.authUid),
    status: normalizeString(record.status) || "active",
    emailVerified: normalizeBoolean(record.emailVerified),
    emailVerifiedAt: normalizeString(record.emailVerifiedAt),
    verificationEmailSentAt: normalizeString(record.verificationEmailSentAt),
    stripeCustomerId: normalizeString(record.stripeCustomerId),
    stripeSubscriptionId: normalizeString(record.stripeSubscriptionId),
    stripeSubscriptionScheduleId: normalizeString(record.stripeSubscriptionScheduleId),
    stripePriceId: normalizeString(record.stripePriceId),
    packageCurrency: normalizeString(record.packageCurrency).toUpperCase(),
    stripeSubscriptionStatus: normalizeString(record.stripeSubscriptionStatus),
    stripeCancelAt: normalizeString(record.stripeCancelAt),
    stripeCurrentPeriodEnd: normalizeString(record.stripeCurrentPeriodEnd),
    stripeCancelAtPeriodEnd: normalizeBoolean(record.stripeCancelAtPeriodEnd),
    stripeBillingEmail: normalizeEmail(record.stripeBillingEmail),
    stripeLastCheckoutSessionId: normalizeString(record.stripeLastCheckoutSessionId),
    stripeLastEventId: normalizeString(record.stripeLastEventId),
    stripeLastEventType: normalizeString(record.stripeLastEventType),
    stripeLastSyncedAt: normalizeString(record.stripeLastSyncedAt),
    pendingPackageTier: normalizeTier(record.pendingPackageTier),
    pendingPackageCurrency: normalizeString(record.pendingPackageCurrency).toUpperCase(),
    pendingPackageStatus: normalizeTier(record.pendingPackageStatus),
    pendingPackageEffectiveAt: normalizeString(record.pendingPackageEffectiveAt),
    pendingPackageUpdatedAt: normalizeString(record.pendingPackageUpdatedAt),
    primaryHubId: normalizeString(record.primaryHubId),
    lastHubId: normalizeString(record.lastHubId),
    hubCount: normalizeCount(record.hubCount),
    createdAt: normalizeString(record.createdAt),
    updatedAt: normalizeString(record.updatedAt),
  };
}

export function normalizeCommercialAccountHubRecord(record) {
  if (!record) {
    return null;
  }

  return {
    id: normalizeString(record.id || record.hubId),
    hubId: normalizeString(record.hubId || record.id),
    hubSlug: normalizeSlug(record.hubSlug),
    communityName: normalizeString(record.communityName),
    relationship: normalizeString(record.relationship) || "owner",
    isPrimary: Boolean(record.isPrimary),
    packageTier: normalizeString(record.packageTier).toLowerCase() || "free",
    packageStatus: normalizeString(record.packageStatus).toLowerCase() || "active",
    createdAt: normalizeString(record.createdAt),
    updatedAt: normalizeString(record.updatedAt),
  };
}

export function normalizeProductHubSummary(record) {
  if (!record) {
    return null;
  }

  return {
    id: normalizeString(record.id),
    name: normalizeString(record.name),
    slug: normalizeSlug(record.slug),
    contactEmail: normalizeEmail(record.contactEmail),
    packageTier: normalizeString(record.packageTier).toLowerCase() || "free",
    packageStatus: normalizeString(record.packageStatus).toLowerCase() || "active",
    packageSource: normalizeString(record.packageSource) || "product_site",
    createdAt: normalizeString(record.createdAt),
    updatedAt: normalizeString(record.updatedAt),
  };
}

export function normalizeCommercialAccountSessionAccount(record) {
  const account = normalizeCommercialAccountRecord(record);

  if (!account) {
    return null;
  }

  return {
    id: account.id,
    ownerFullName: account.ownerFullName,
    ownerEmail: account.ownerEmail,
    authUid: account.authUid,
    status: account.status,
    emailVerified: account.emailVerified,
    emailVerifiedAt: account.emailVerifiedAt,
    stripeCustomerId: account.stripeCustomerId,
    stripeSubscriptionId: account.stripeSubscriptionId,
    stripeSubscriptionScheduleId: account.stripeSubscriptionScheduleId,
    stripeSubscriptionStatus: account.stripeSubscriptionStatus,
    packageCurrency: account.packageCurrency,
    pendingPackageTier: account.pendingPackageTier,
    pendingPackageCurrency: account.pendingPackageCurrency,
    pendingPackageStatus: account.pendingPackageStatus,
    pendingPackageEffectiveAt: account.pendingPackageEffectiveAt,
  };
}
