try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import crypto from "node:crypto";
import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { getCustomDomainMappingByHostname, writeCustomDomainMappingForHub } from "@/lib/data/custom-domain-mappings";
import { requireHubBySlug } from "@/lib/data/hubs";
import { buildDefaultMembershipPlanWriteModel } from "@/lib/data/membership-plans";
import { getPlatformRootDomain, isReservedHubSlug } from "@/lib/domain/custom-domain-runtime-config";
import { buildCustomDomainVerificationHostname } from "@/lib/domain/custom-domain-verification";
import { processHubCustomDomainVerificationRecord } from "@/lib/data/custom-domain-verification";
import { normalizeUpdateHubPackageAuthorityPayload } from "@/lib/domain/hub-package-contracts";
import { assertValidCustomDomainHostname, normalizePlatformSubdomainLabel } from "@/lib/domain/hub-domains";
import { resolveHubPackageEntitlements } from "@/lib/domain/hub-package";
import { normalizeCreateHubPayload, normalizeHubDomain } from "@/lib/domain/hubs";

function normalizeString(value) {
  return String(value || "").trim();
}

async function assertUniqueSlug(db, slug) {
  if (isReservedHubSlug(slug)) {
    throw new Error(
      `This hub slug is reserved for the platform domain and cannot be used. Choose a different subdomain name instead of "${slug}.${getPlatformRootDomain()}".`
    );
  }

  const snapshot = await db.collection("hubs").where("slug", "==", slug).limit(1).get();

  if (!snapshot.empty) {
    throw new Error("A hub with this slug already exists.");
  }
}

async function assertUniquePlatformSubdomainLabel(db, label) {
  if (!label) {
    throw new Error("Platform subdomain label is required.");
  }

  if (isReservedHubSlug(label)) {
    throw new Error(
      `This hosted subdomain is reserved for the platform domain and cannot be used. Choose a different subdomain name instead of "${label}.${getPlatformRootDomain()}".`
    );
  }

  const snapshot = await db.collection("hubs").where("platformSubdomainLabel", "==", label).limit(1).get();

  if (!snapshot.empty) {
    throw new Error("A hub with this hosted subdomain already exists.");
  }

  const legacySnapshot = await db.collection("hubs").get();
  const conflictingLegacyHub = legacySnapshot.docs
    .map((doc) => doc.data())
    .find((hub) => normalizePlatformSubdomainLabel(hub?.platformSubdomainLabel || hub?.slug) === label);

  if (conflictingLegacyHub) {
    throw new Error("A hub with this hosted subdomain already exists.");
  }
}

async function assertUniqueDomain(db, domain, excludedHubId = "") {
  if (!domain) {
    return;
  }

  const [legacySnapshot, structuredSnapshot, mapping] = await Promise.all([
    db.collection("hubs").where("customDomains", "array-contains", domain).limit(1).get(),
    db.collection("hubs").where("customDomain.hostname", "==", domain).limit(1).get(),
    getCustomDomainMappingByHostname(domain, { hydrateFromHub: false }),
  ]);

  const conflictingDoc = [...legacySnapshot.docs, ...structuredSnapshot.docs].find((doc) => doc.id !== excludedHubId);

  if (conflictingDoc || (mapping?.hubId && mapping.hubId !== excludedHubId)) {
    throw new Error("A hub already uses this domain.");
  }
}

export async function createHub(payload, actorId = "system") {
  const db = getFirebaseAdminDb();
  const next = normalizeCreateHubPayload(payload);
  const platformSubdomainLabel = normalizePlatformSubdomainLabel(next.slug);

  await assertUniqueSlug(db, next.slug);
  await assertUniquePlatformSubdomainLabel(db, platformSubdomainLabel);
  await assertUniqueDomain(db, next.customDomains[0] || "");

  const now = new Date().toISOString();
  const ref = db.collection("hubs").doc(`hub_${crypto.randomUUID().slice(0, 12)}`);
  const defaultMembershipPlanRef = db.collection("hubs").doc(ref.id).collection("membershipPlans").doc();

  const writeModel = {
    name: next.name,
    slug: next.slug,
    platformSubdomainLabel,
    status: next.status,
    supportState: next.supportState,
    themeKey: next.theme,
    templateKey: next.templateKey,
    tokenOverrides: next.tokenOverrides,
    contactEmail: next.contactEmail,
    description: next.description,
    country: next.country,
    timezone: next.timezone,
    locale: next.locale,
    defaultCurrency: next.defaultCurrency,
    regionalSetupStatus: next.regionalSetupStatus,
    regionalSetupCompletedAt:
      next.regionalSetupCompletedAt === "AUTO_NOW"
        ? now
        : next.regionalSetupCompletedAt,
    packageTier: next.packageTier,
    packageStatus: next.packageStatus,
    packageSource: next.packageSource,
    packageOverrides: next.packageOverrides,
    packageAssignedAt: now,
    packageUpdatedAt: now,
    customDomain: next.customDomain
      ? {
          ...next.customDomain,
          connectedAt: next.customDomain.status === "connected" ? now : next.customDomain.connectedAt,
          requestedAt: next.customDomain.requestedAt || now,
          updatedByUserId: actorId,
        }
      : null,
    customDomains: next.customDomains,
    features: next.features,
    adminCount: 0,
    memberCount: 0,
    upcomingEventsCount: 0,
    pendingInvitesCount: 0,
    paymentsAttentionCount: 0,
    createdAt: now,
    updatedAt: now,
    createdBy: actorId,
    updatedBy: actorId,
  };

  const batch = db.batch();
  batch.set(ref, writeModel);
  batch.set(
    defaultMembershipPlanRef,
    buildDefaultMembershipPlanWriteModel(ref.id, actorId, now, writeModel.defaultCurrency || "USD")
  );
  await batch.commit();

  if (writeModel.customDomain?.hostname && writeModel.customDomain.status === "connected") {
    await writeCustomDomainMappingForHub(
      {
        id: ref.id,
        slug: next.slug,
        customDomain: writeModel.customDomain,
      },
      actorId
    );
  }

  return {
    id: ref.id,
    ...writeModel,
  };
}

function buildHubPackageAuthorityWriteModel(currentHub, normalizedPayload, actorId, now) {
  const currentAssignedAt = normalizeString(currentHub?.packageAssignedAt);
  const packageAssignedAt = normalizedPayload.packageAssignedAt || currentAssignedAt || now;

  return {
    packageTier: normalizedPayload.packageTier,
    packageStatus: normalizedPayload.packageStatus,
    packageSource: normalizedPayload.packageSource,
    packageOverrides: normalizedPayload.packageOverrides,
    packageAssignedAt,
    packageUpdatedAt: now,
    features: normalizedPayload.features,
    updatedAt: now,
    updatedBy: actorId,
  };
}

export async function updateHubPackageAuthorityById(hubId, payload, actorId = "system") {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId) {
    throw new Error("Hub id is required.");
  }

  const db = getFirebaseAdminDb();
  const ref = db.collection("hubs").doc(normalizedHubId);
  const doc = await ref.get();

  if (!doc.exists) {
    throw new Error(`Unknown hub id: ${normalizedHubId}`);
  }

  const normalizedPayload = normalizeUpdateHubPackageAuthorityPayload(payload);
  const now = new Date().toISOString();
  const currentHub = {
    id: doc.id,
    ...doc.data(),
  };
  const writeModel = buildHubPackageAuthorityWriteModel(currentHub, normalizedPayload, actorId, now);

  await ref.update(writeModel);

  return {
    id: doc.id,
    ...currentHub,
    ...writeModel,
  };
}

export async function requestHubCustomDomainBySlug(hubSlug, hostname, actorId = "system") {
  const hub = await requireHubBySlug(hubSlug);
  const normalizedHostname = assertValidCustomDomainHostname(normalizeHubDomain(hostname));
  const entitlements = resolveHubPackageEntitlements(hub);

  if (!entitlements.capabilities.customDomainEnabled) {
    throw new Error("Custom domains are only available on the Growth package.");
  }

  const db = getFirebaseAdminDb();
  await assertUniqueDomain(db, normalizedHostname, hub.id);

  const now = new Date().toISOString();
  const verificationTarget = `verify-${crypto.randomUUID().replace(/-/g, "")}`;
  const nextCustomDomain = {
    hostname: normalizedHostname,
    status: "pending_verification",
    isPrimary: true,
    verificationMethod: "dns_txt",
    verificationHost: buildCustomDomainVerificationHostname(normalizedHostname),
    verificationTarget,
    requestedAt: now,
    verifiedAt: "",
    connectedAt: "",
    lastCheckedAt: "",
    disconnectAt: "",
    disconnectedAt: "",
    failureReason: "",
    connectedByUserId: "",
    updatedByUserId: actorId,
  };

  await db.collection("hubs").doc(hub.id).update({
    customDomain: nextCustomDomain,
    customDomains: [normalizedHostname],
    updatedAt: now,
    updatedBy: actorId,
  });

  return {
    hubId: hub.id,
    customDomain: nextCustomDomain,
    updatedAt: now,
  };
}

export async function checkHubCustomDomainVerificationBySlug(hubSlug, actorId = "system") {
  const hub = await requireHubBySlug(hubSlug);
  const customDomain = hub.customDomain;

  if (!customDomain?.hostname) {
    throw new Error("No custom-domain request exists for this hub yet.");
  }

  const entitlements = resolveHubPackageEntitlements(hub);

  if (!entitlements.capabilities.customDomainEnabled) {
    throw new Error("Custom domains are only available on the Growth package.");
  }

  return processHubCustomDomainVerificationRecord(hub, actorId);
}
