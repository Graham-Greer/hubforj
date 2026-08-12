try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import crypto from "node:crypto";
import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import {
  assertNoConflictingCustomDomainClaim,
  buildCustomDomainClaimId,
  upsertCustomDomainClaimForHub,
} from "@/lib/data/custom-domain-claims";
import { getCustomDomainMappingByHostname, writeCustomDomainMappingForHub } from "@/lib/data/custom-domain-mappings";
import { requireHubBySlug } from "@/lib/data/hubs";
import { buildDefaultMembershipPlanWriteModel } from "@/lib/data/membership-plans";
import { getPlatformRootDomain, isReservedHubSlug } from "@/lib/domain/custom-domain-runtime-config";
import { buildCustomDomainVerificationHostname } from "@/lib/domain/custom-domain-verification";
import { provisionCustomDomainWithVercel } from "@/lib/domain/custom-domain-vercel";
import {
  processHubCustomDomainDisconnectRecord,
  processHubCustomDomainVerificationRecord,
  scheduleHubCustomDomainDisconnectRecord,
} from "@/lib/data/custom-domain-verification";
import { normalizeUpdateHubPackageAuthorityPayload } from "@/lib/domain/hub-package-contracts";
import { assertValidCustomDomainHostname, normalizePlatformSubdomainLabel } from "@/lib/domain/hub-domains";
import { resolveHubPackageEntitlements } from "@/lib/domain/hub-package";
import { normalizeCreateHubPayload, normalizeHubDomain } from "@/lib/domain/hubs";

function normalizeString(value) {
  return String(value || "").trim();
}

function addMinutes(value, minutes) {
  return new Date(new Date(value).getTime() + minutes * 60 * 1000).toISOString();
}

function addHours(value, hours) {
  return new Date(new Date(value).getTime() + hours * 60 * 60 * 1000).toISOString();
}

function buildCustomDomainOperationLock({ operation, hostname, actorId, now }) {
  return {
    operation,
    hostname,
    lockedAt: now,
    lockedByUserId: actorId,
    expiresAt: addMinutes(now, 5),
  };
}

function isActiveCustomDomainOperationLock(lock, now) {
  return Boolean(normalizeString(lock?.operation) && normalizeString(lock?.expiresAt) > now);
}

async function writeCustomDomainLifecycleEvent(db, hubId, event) {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId) {
    return;
  }

  try {
    await db.collection("hubs").doc(normalizedHubId).collection("customDomainEvents").add(event);
  } catch (error) {
    console.warn("Custom-domain lifecycle event write failed", {
      hubId: normalizedHubId,
      type: normalizeString(event?.type),
      error: String(error?.message || error),
    });
  }
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
    assertNoConflictingCustomDomainClaim(domain, excludedHubId, { db }),
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

  if (writeModel.customDomain?.hostname) {
    const claimId = buildCustomDomainClaimId(writeModel.customDomain.hostname);

    if (claimId) {
      batch.set(db.collection("customDomainClaims").doc(claimId), {
        hostname: claimId,
        hubId: ref.id,
        hubSlug: next.slug,
        status: writeModel.customDomain.status === "connected" ? "connected" : "pending",
        createdAt: now,
        updatedAt: now,
        expiresAt: "",
        createdByUserId: actorId,
        updatedByUserId: actorId,
        releasedAt: "",
        releasedByUserId: "",
        releaseReason: "",
      });
    }
  }

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

function isCustomDomainConfiguredForEntitlementEnforcement(customDomain = {}) {
  const hostname = normalizeString(customDomain.hostname);
  const status = normalizeString(customDomain.status);

  return Boolean(hostname && status !== "disconnected");
}

function resolveEffectiveCustomDomainEntitlement(entitlements = {}) {
  return (
    entitlements?.capabilities?.customDomainEnabled === true &&
    normalizeString(entitlements.packageStatus) !== "cancelled"
  );
}

async function enforceCustomDomainPackageEntitlement({
  currentHub,
  nextHub,
  previousEntitlements,
  nextEntitlements,
  actorId,
  now,
} = {}) {
  const previousEnabled = resolveEffectiveCustomDomainEntitlement(previousEntitlements);
  const nextEnabled = resolveEffectiveCustomDomainEntitlement(nextEntitlements);
  const metadata = {
    customDomainEntitlementChanged: previousEnabled !== nextEnabled,
    customDomainDisconnectTriggered: false,
    customDomainDisconnectStatus: "",
    customDomainDisconnectError: "",
  };

  if (!previousEnabled || nextEnabled || !isCustomDomainConfiguredForEntitlementEnforcement(currentHub?.customDomain)) {
    return metadata;
  }

  metadata.customDomainDisconnectTriggered = true;

  try {
    await scheduleHubCustomDomainDisconnectRecord(nextHub, {
      actorId,
      disconnectAt: now,
      reason: "package_downgrade",
    });
    const result = await processHubCustomDomainDisconnectRecord(
      {
        ...nextHub,
        customDomain: {
          ...(nextHub.customDomain || {}),
          status: "disconnect_scheduled",
          disconnectAt: now,
          disconnectReason: "package_downgrade",
        },
      },
      actorId
    );

    metadata.customDomainDisconnectStatus = normalizeString(result?.status || result?.reason);
    metadata.customDomainDisconnectError = normalizeString(result?.cleanup?.lastLifecycleError);
    await writeCustomDomainLifecycleEvent(getFirebaseAdminDb(), nextHub.id, {
      type: "custom_domain_disconnected_package_downgrade",
      hostname: normalizeString(currentHub?.customDomain?.hostname),
      actorUserId: actorId,
      actorType: actorId === "system" ? "system" : "automation",
      createdAt: now,
      beforeStatus: normalizeString(currentHub?.customDomain?.status),
      afterStatus: metadata.customDomainDisconnectStatus,
      details: {
        previousPackageTier: normalizeString(currentHub?.packageTier),
        previousPackageStatus: normalizeString(currentHub?.packageStatus),
        previousPackageSource: normalizeString(currentHub?.packageSource),
        nextPackageTier: normalizeString(nextHub?.packageTier),
        nextPackageStatus: normalizeString(nextHub?.packageStatus),
        nextPackageSource: normalizeString(nextHub?.packageSource),
        previousCustomDomainEnabled: previousEnabled,
        nextCustomDomainEnabled: nextEnabled,
      },
      error: metadata.customDomainDisconnectError,
    });
  } catch (error) {
    metadata.customDomainDisconnectStatus = "failed";
    metadata.customDomainDisconnectError = String(error?.message || "Unable to enforce custom-domain entitlement.");
  }

  return metadata;
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
  const previousEntitlements = resolveHubPackageEntitlements(currentHub);
  const writeModel = buildHubPackageAuthorityWriteModel(currentHub, normalizedPayload, actorId, now);
  const nextHub = {
    ...currentHub,
    ...writeModel,
  };
  const nextEntitlements = resolveHubPackageEntitlements(nextHub);

  await ref.update(writeModel);
  const entitlementEnforcement = await enforceCustomDomainPackageEntitlement({
    currentHub,
    nextHub,
    previousEntitlements,
    nextEntitlements,
    actorId,
    now,
  });

  return {
    id: doc.id,
    ...currentHub,
    ...writeModel,
    ...entitlementEnforcement,
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
  const existingCustomDomain = hub?.customDomain || {};
  const sameHostname = normalizeString(existingCustomDomain.hostname) === normalizedHostname;
  const verificationTarget =
    sameHostname && normalizeString(existingCustomDomain.verificationTarget)
      ? normalizeString(existingCustomDomain.verificationTarget)
      : `verify-${crypto.randomUUID().replace(/-/g, "")}`;
  const verificationHost =
    sameHostname && normalizeString(existingCustomDomain.verificationHost)
      ? normalizeString(existingCustomDomain.verificationHost)
      : buildCustomDomainVerificationHostname(normalizedHostname);
  const operationLock = buildCustomDomainOperationLock({
    operation: "request_custom_domain",
    hostname: normalizedHostname,
    actorId,
    now,
  });

  await db.runTransaction(async (transaction) => {
    const hubRef = db.collection("hubs").doc(hub.id);
    const hubDoc = await transaction.get(hubRef);

    if (!hubDoc.exists) {
      throw new Error(`Unknown hub id: ${hub.id}`);
    }

    const currentHub = { id: hubDoc.id, ...hubDoc.data() };
    const currentEntitlements = resolveHubPackageEntitlements(currentHub);

    if (!currentEntitlements.capabilities.customDomainEnabled) {
      throw new Error("Custom domains are only available on the Growth package.");
    }

    if (isActiveCustomDomainOperationLock(currentHub?.customDomain?.operationLock, now)) {
      throw new Error("A custom-domain operation is already in progress. Please wait a moment and try again.");
    }

    await upsertCustomDomainClaimForHub({
      db,
      transaction,
      hostname: normalizedHostname,
      hubId: hub.id,
      hubSlug: hub.slug,
      actorId,
      status: "pending",
      expiresAt: addHours(now, 24),
      now,
    });

    transaction.update(hubRef, {
      customDomain: {
        ...(sameHostname ? existingCustomDomain : {}),
        hostname: normalizedHostname,
        status: "provisioning",
        isPrimary: true,
        verificationMethod: "dns_txt",
        verificationHost,
        verificationTarget,
        requestedAt: normalizeString(existingCustomDomain.requestedAt) || now,
        lastLifecycleRunAt: now,
        lastLifecycleError: "",
        operationLock,
        schemaVersion: 2,
        updatedByUserId: actorId,
      },
      customDomains: [normalizedHostname],
      updatedAt: now,
      updatedBy: actorId,
    });
  });

  const provisioning = await provisionCustomDomainWithVercel(normalizedHostname, { now });
  const nextCustomDomain = {
    hostname: normalizedHostname,
    status: provisioning.status,
    isPrimary: true,
    verificationMethod: "dns_txt",
    verificationHost,
    verificationTarget,
    requestedAt: normalizeString(existingCustomDomain.requestedAt) || now,
    verifiedAt: sameHostname ? normalizeString(existingCustomDomain.verifiedAt) : "",
    connectedAt: "",
    lastCheckedAt: "",
    disconnectAt: "",
    disconnectReason: "",
    disconnectedAt: "",
    failureReason: normalizeString(provisioning.failureReason),
    activationBlockedReason: "",
    dnsRoutingStatus: normalizeString(provisioning.dnsRoutingStatus),
    dnsRoutingLastCheckedAt: normalizeString(provisioning.dnsRoutingLastCheckedAt),
    dnsRoutingFailureReason: normalizeString(provisioning.dnsRoutingFailureReason),
    dnsRoutingRecordType: normalizeString(provisioning.dnsRoutingRecordType),
    dnsRoutingRecordName: normalizeString(provisioning.dnsRoutingRecordName),
    dnsRoutingRecordValue: normalizeString(provisioning.dnsRoutingRecordValue),
    dnsRoutingRecordValues: Array.isArray(provisioning.dnsRoutingRecordValues)
      ? provisioning.dnsRoutingRecordValues
      : [],
    dnsRoutingRecordTtl: normalizeString(provisioning.dnsRoutingRecordTtl),
    vercelProjectId: normalizeString(provisioning.vercelProjectId),
    vercelDomainId: normalizeString(provisioning.vercelDomainId),
    vercelDomainAddedAt: normalizeString(provisioning.vercelDomainAddedAt),
    vercelVerificationStatus: normalizeString(provisioning.vercelVerificationStatus),
    vercelVerificationLastCheckedAt: normalizeString(provisioning.vercelVerificationLastCheckedAt),
    certificateStatus: normalizeString(provisioning.certificateStatus),
    certificateLastCheckedAt: normalizeString(provisioning.certificateLastCheckedAt),
    lastLifecycleRunAt: normalizeString(provisioning.lastLifecycleRunAt) || now,
    lastLifecycleError: normalizeString(provisioning.lastLifecycleError),
    schemaVersion: 2,
    connectedByUserId: "",
    updatedByUserId: actorId,
  };

  await db.runTransaction(async (transaction) => {
    const hubRef = db.collection("hubs").doc(hub.id);
    const hubDoc = await transaction.get(hubRef);

    if (!hubDoc.exists) {
      throw new Error(`Unknown hub id: ${hub.id}`);
    }

    const currentHub = { id: hubDoc.id, ...hubDoc.data() };
    const currentLock = currentHub?.customDomain?.operationLock;

    if (
      normalizeString(currentLock?.operation) &&
      (normalizeString(currentLock?.hostname) !== normalizedHostname ||
        normalizeString(currentLock?.lockedByUserId) !== actorId)
    ) {
      throw new Error("Custom-domain setup changed while this request was running. Please refresh and try again.");
    }

    transaction.update(hubRef, {
      customDomain: nextCustomDomain,
      customDomains: [normalizedHostname],
      updatedAt: now,
      updatedBy: actorId,
    });
  });

  await writeCustomDomainLifecycleEvent(db, hub.id, {
    type: provisioning.ok ? "custom_domain_requested" : "custom_domain_provisioning_failed",
    hostname: normalizedHostname,
    actorUserId: actorId,
    actorType: actorId === "system" ? "system" : "user",
    createdAt: now,
    beforeStatus: normalizeString(existingCustomDomain.status),
    afterStatus: nextCustomDomain.status,
    details: {
      vercelEnabled: provisioning.vercelEnabled === true,
      vercelProjectId: normalizeString(provisioning.vercelProjectId),
      dnsRoutingStatus: normalizeString(provisioning.dnsRoutingStatus),
      vercelVerificationStatus: normalizeString(provisioning.vercelVerificationStatus),
      skipped: provisioning.skipped === true,
    },
    error: normalizeString(provisioning.lastLifecycleError || provisioning.failureReason),
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
