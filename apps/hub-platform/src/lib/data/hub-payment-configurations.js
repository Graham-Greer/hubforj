try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { normalizeHubPaymentConfiguration } from "@/lib/domain/hub-payment-configuration";

function normalizeString(value) {
  return String(value || "").trim();
}

function getHubPaymentConfigurationRef(hubId) {
  return getFirebaseAdminDb()
    .collection("hubs")
    .doc(hubId)
    .collection("paymentConfiguration")
    .doc("current");
}

async function maintainDashboardProjectionsForPaymentConfigurationChange(hubId, actorId) {
  try {
    const { maintainHubAdminDashboardProjectionsByHubId } = await import("./hub-dashboard-stats.js");
    return maintainHubAdminDashboardProjectionsByHubId(hubId, actorId, {
      reason: "payment-configuration-change",
    });
  } catch (error) {
    console.warn("Unable to start dashboard projection maintenance after payment configuration change", {
      hubId: normalizeString(hubId),
      actorId: normalizeString(actorId) || "system",
      error: String(error?.message || "Unable to maintain dashboard projections."),
    });
    return null;
  }
}

export async function getHubPaymentConfigurationByHubId(hubId) {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId) {
    return normalizeHubPaymentConfiguration({});
  }

  const snapshot = await getHubPaymentConfigurationRef(normalizedHubId).get();

  if (!snapshot.exists) {
    return normalizeHubPaymentConfiguration({});
  }

  return normalizeHubPaymentConfiguration(snapshot.data());
}

export async function getHubPaymentConfigurationByStripeAccountId(stripeAccountId) {
  const normalizedStripeAccountId = normalizeString(stripeAccountId);

  if (!normalizedStripeAccountId) {
    return null;
  }

  const snapshot = await getFirebaseAdminDb()
    .collectionGroup("paymentConfiguration")
    .where("stripeAccountId", "==", normalizedStripeAccountId)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  const hubId = normalizeString(doc.ref.parent?.parent?.id);

  return {
    hubId,
    ...normalizeHubPaymentConfiguration(doc.data()),
  };
}

export async function upsertHubPaymentConfiguration(hubId, payload = {}, actorId = "system") {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId) {
    throw new Error("Hub id is required.");
  }

  const ref = getHubPaymentConfigurationRef(normalizedHubId);
  const existing = await ref.get();
  const now = new Date().toISOString();

  const writeModel = {
    provider: normalizeString(payload.provider) || "stripe",
    status: normalizeString(payload.status),
    stripeAccountId: normalizeString(payload.stripeAccountId),
    country: normalizeString(payload.country),
    defaultCurrency: normalizeString(payload.defaultCurrency).toUpperCase(),
    businessType: normalizeString(payload.businessType),
    chargesEnabled: payload.chargesEnabled === true,
    payoutsEnabled: payload.payoutsEnabled === true,
    detailsSubmitted: payload.detailsSubmitted === true,
    requirementsCurrentlyDue: Array.isArray(payload.requirementsCurrentlyDue) ? payload.requirementsCurrentlyDue : [],
    requirementsEventuallyDue: Array.isArray(payload.requirementsEventuallyDue) ? payload.requirementsEventuallyDue : [],
    requirementsPastDue: Array.isArray(payload.requirementsPastDue) ? payload.requirementsPastDue : [],
    requirementsPendingVerification: Array.isArray(payload.requirementsPendingVerification)
      ? payload.requirementsPendingVerification
      : [],
    onboardingStartedAt: normalizeString(payload.onboardingStartedAt),
    onboardingCompletedAt: normalizeString(payload.onboardingCompletedAt),
    disabledReason: normalizeString(payload.disabledReason),
    updatedAt: now,
    updatedBy: normalizeString(actorId) || "system",
  };

  if (!existing.exists) {
    writeModel.createdAt = now;
  }

  await ref.set(writeModel, { merge: true });
  await maintainDashboardProjectionsForPaymentConfigurationChange(normalizedHubId, actorId);

  return normalizeHubPaymentConfiguration(writeModel);
}
