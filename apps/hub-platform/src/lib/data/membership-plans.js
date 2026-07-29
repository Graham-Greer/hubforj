try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { getHubById } from "@/lib/data/hubs";
import { getHubPaymentConfigurationByHubId } from "@/lib/data/hub-payment-configurations";
import {
  buildDefaultMembershipPlanPayload,
  findDefaultMembershipPlan,
  normalizeMembershipPlanPayload,
  resolveMembershipPlanPaymentConfiguration,
  resolveMembershipPlanPricingMode,
} from "@/lib/domain/memberships";
import { assertHubNativePaymentsReady } from "@/lib/domain/hub-payment-configuration";
import { assertHubCapability, hasHubCapability } from "@/lib/domain/package-guards";
import { normalizeMembershipPlanRecord, normalizeString } from "./membership-shared.js";

export async function listMembershipPlansByHub(hubId) {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId) {
    return [];
  }

  const snapshot = await getFirebaseAdminDb()
    .collection("hubs")
    .doc(normalizedHubId)
    .collection("membershipPlans")
    .get();

  return snapshot.docs
    .map((doc) => normalizeMembershipPlanRecord({ id: doc.id, hubId: normalizedHubId, ...doc.data() }))
    .sort((left, right) => {
      if (left.isDefault === right.isDefault) {
        return String(left.title || "").localeCompare(String(right.title || ""));
      }

      return left.isDefault ? -1 : 1;
    });
}

export async function getDefaultMembershipPlanByHub(hubId) {
  const plans = await listMembershipPlansByHub(hubId);
  return findDefaultMembershipPlan(plans);
}

export function buildDefaultMembershipPlanWriteModel(
  hubId,
  actorId = "system",
  now = new Date().toISOString(),
  defaultCurrency = "USD"
) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedActorId = normalizeString(actorId) || "system";
  const next = normalizeMembershipPlanPayload(buildDefaultMembershipPlanPayload({ currency: defaultCurrency }));

  return {
    hubId: normalizedHubId,
    title: next.title,
    description: next.description,
    pricingMode: next.pricingMode,
    price: next.price,
    currency: next.currency,
    externalPaymentUrl: "",
    paymentInstructions: "",
    durationUnit: next.durationUnit,
    durationValue: next.durationValue,
    isDefault: true,
    visibility: next.visibility,
    status: next.status,
    createdAt: now,
    updatedAt: now,
    createdBy: normalizedActorId,
    updatedBy: normalizedActorId,
  };
}

export async function createDefaultMembershipPlan(hubId, actorId = "system") {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId) {
    throw new Error("Hub id is required.");
  }

  const hub = await getHubById(normalizedHubId);

  if (!hub) {
    throw new Error("Hub not found.");
  }

  const existingDefaultPlan = await getDefaultMembershipPlanByHub(normalizedHubId);

  if (existingDefaultPlan) {
    throw new Error("Default membership plan already exists for this hub.");
  }

  const now = new Date().toISOString();
  const ref = getFirebaseAdminDb().collection("hubs").doc(normalizedHubId).collection("membershipPlans").doc();
  const writeModel = buildDefaultMembershipPlanWriteModel(
    normalizedHubId,
    actorId,
    now,
    hub.defaultCurrency || "USD"
  );

  await ref.set(writeModel);
  return normalizeMembershipPlanRecord({ id: ref.id, ...writeModel });
}

export async function createMembershipPlan(hubId, payload, actorId = "system") {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId) {
    throw new Error("Hub id is required.");
  }

  const hub = await getHubById(normalizedHubId);

  if (!hub) {
    throw new Error("Hub not found.");
  }

  const next = normalizeMembershipPlanPayload(payload);

  if (next.pricingMode === "paid") {
    assertHubCapability(hub, "paidMembershipsEnabled", "Paid memberships are available on Starter and above.");
    const paymentConfigurationRecord = await getHubPaymentConfigurationByHubId(normalizedHubId);
    assertHubNativePaymentsReady(hub, paymentConfigurationRecord, "creating paid membership plans on Growth");
  }

  const paymentConfiguration = resolveMembershipPlanPaymentConfiguration(next, hub.packagePaymentProcessingMode);

  const now = new Date().toISOString();
  const ref = getFirebaseAdminDb().collection("hubs").doc(normalizedHubId).collection("membershipPlans").doc();

  const writeModel = {
    hubId: normalizedHubId,
    title: next.title,
    description: next.description,
    pricingMode: next.pricingMode,
    price: next.price,
    currency: next.currency,
    externalPaymentUrl: paymentConfiguration.externalPaymentUrl,
    paymentInstructions: paymentConfiguration.paymentInstructions,
    durationUnit: next.durationUnit,
    durationValue: next.durationValue,
    isDefault: false,
    visibility: next.visibility,
    status: next.status,
    createdAt: now,
    updatedAt: now,
    createdBy: actorId,
    updatedBy: actorId,
  };

  await ref.set(writeModel);
  return normalizeMembershipPlanRecord({ id: ref.id, ...writeModel });
}

export async function updateMembershipPlan(hubId, planId, payload, actorId = "system") {
  const normalizedHubId = normalizeString(hubId);
  const normalizedPlanId = normalizeString(planId);

  if (!normalizedHubId || !normalizedPlanId) {
    throw new Error("Hub id and plan id are required.");
  }

  const hub = await getHubById(normalizedHubId);

  if (!hub) {
    throw new Error("Hub not found.");
  }

  const ref = getFirebaseAdminDb().collection("hubs").doc(normalizedHubId).collection("membershipPlans").doc(normalizedPlanId);
  const existing = await ref.get();
  if (!existing.exists) {
    throw new Error("Membership plan not found.");
  }

  const next = normalizeMembershipPlanPayload(payload);
  const existingPlan = normalizeMembershipPlanRecord({ id: normalizedPlanId, hubId: normalizedHubId, ...existing.data() });
  const canUsePaidMemberships = hasHubCapability(hub, "paidMembershipsEnabled");
  const existingPricingMode = resolveMembershipPlanPricingMode(existingPlan);

  if (existingPlan.isDefault === true) {
    const defaultPlanChanged =
      next.pricingMode !== existingPlan.pricingMode ||
      normalizeString(next.price) !== normalizeString(existingPlan.price) ||
      normalizeString(next.currency).toUpperCase() !== normalizeString(existingPlan.currency).toUpperCase() ||
      normalizeString(next.externalPaymentUrl) !== normalizeString(existingPlan.externalPaymentUrl) ||
      normalizeString(next.paymentInstructions) !== normalizeString(existingPlan.paymentInstructions) ||
      normalizeString(next.durationUnit).toLowerCase() !== normalizeString(existingPlan.durationUnit).toLowerCase() ||
      Number(next.durationValue) !== Number(existingPlan.durationValue) ||
      normalizeString(next.visibility).toLowerCase() !== normalizeString(existingPlan.visibility).toLowerCase() ||
      normalizeString(next.status).toLowerCase() !== normalizeString(existingPlan.status).toLowerCase();

    if (defaultPlanChanged) {
      throw new Error("The default membership plan can only be updated by changing its title or description.");
    }
  }

  if (next.pricingMode === "paid" && !canUsePaidMemberships) {
    const preservesExistingPaidPricing =
      existingPricingMode === "paid" &&
      normalizeString(next.price) === normalizeString(existingPlan?.price) &&
      normalizeString(next.currency).toUpperCase() === normalizeString(existingPlan?.currency).toUpperCase() &&
      normalizeString(next.externalPaymentUrl) === normalizeString(existingPlan?.externalPaymentUrl) &&
      normalizeString(next.paymentInstructions) === normalizeString(existingPlan?.paymentInstructions);

    if (!preservesExistingPaidPricing) {
      assertHubCapability(hub, "paidMembershipsEnabled", "Paid memberships are available on Starter and above.");
    }
  }

  if (next.pricingMode !== "paid" && existingPricingMode === "paid" && !canUsePaidMemberships) {
    throw new Error(
      "This paid membership plan is protected on your current package. Upgrade to Starter to edit paid membership pricing, or to Growth for built-in payments."
    );
  }

  if (next.pricingMode === "paid") {
    const paymentConfigurationRecord = await getHubPaymentConfigurationByHubId(normalizedHubId);
    assertHubNativePaymentsReady(hub, paymentConfigurationRecord, "saving paid membership plans on Growth");
  }

  const paymentConfiguration = resolveMembershipPlanPaymentConfiguration(next, hub.packagePaymentProcessingMode);

  const update = {
    title: next.title,
    description: next.description,
    pricingMode: next.pricingMode,
    price: next.price,
    currency: next.currency,
    externalPaymentUrl: paymentConfiguration.externalPaymentUrl,
    paymentInstructions: paymentConfiguration.paymentInstructions,
    durationUnit: next.durationUnit,
    durationValue: next.durationValue,
    isDefault: existingPlan.isDefault === true,
    visibility: existingPlan.isDefault === true ? "public" : next.visibility,
    status: next.status,
    updatedAt: new Date().toISOString(),
    updatedBy: actorId,
  };

  await ref.set(update, { merge: true });
  return normalizeMembershipPlanRecord({ id: normalizedPlanId, hubId: normalizedHubId, ...existing.data(), ...update });
}

export async function deleteMembershipPlan(hubId, planId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedPlanId = normalizeString(planId);

  if (!normalizedHubId || !normalizedPlanId) {
    throw new Error("Hub id and plan id are required.");
  }

  const hub = await getHubById(normalizedHubId);

  if (!hub) {
    throw new Error("Hub not found.");
  }

  const db = getFirebaseAdminDb();
  const planRef = db.collection("hubs").doc(normalizedHubId).collection("membershipPlans").doc(normalizedPlanId);
  const planSnapshot = await planRef.get();

  if (!planSnapshot.exists) {
    throw new Error("Membership plan not found.");
  }

  const plan = normalizeMembershipPlanRecord({ id: planSnapshot.id, hubId: normalizedHubId, ...planSnapshot.data() });

  if (plan.isDefault) {
    throw new Error("The default membership plan cannot be deleted.");
  }

  const assignedMemberships = await db
    .collection("hubs")
    .doc(normalizedHubId)
    .collection("memberships")
    .where("planId", "==", normalizedPlanId)
    .limit(1)
    .get();

  if (!assignedMemberships.empty) {
    throw new Error("This plan is assigned to one or more members. Reassign those memberships before deleting the plan.");
  }

  await planRef.delete();
}
