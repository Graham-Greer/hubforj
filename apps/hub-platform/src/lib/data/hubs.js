try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { normalizeHubCustomDomain, normalizePlatformSubdomainLabel } from "@/lib/domain/hub-domains";
import { getHubRegionalSetupStatus } from "@/lib/domain/hub-regional-setup";
import { resolveHubPackageEntitlements } from "@/lib/domain/hub-package";
import {
  resolveLaunchFormattingLocale,
  resolveRegionalDefaults,
} from "@/lib/domain/regional-markets";
import { normalizeTemplate, normalizeTheme } from "@/lib/theme/default-theme";
import { isHubOperatorRole } from "@/lib/domain/users";
import { normalizeRegionalSetupPayload } from "@/lib/domain/site-settings";

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeHubRecord(hub) {
  if (!hub) {
    return null;
  }

  const domainState = normalizeHubCustomDomain(hub);
  const entitlements = resolveHubPackageEntitlements(hub);
  const regionalDefaults = resolveRegionalDefaults({
    country: hub.country,
    timezone: hub.timezone,
    locale: resolveLaunchFormattingLocale(hub.locale, hub.country),
    defaultCurrency: hub.defaultCurrency,
  });

  return {
    id: normalizeString(hub.id),
    slug: normalizeString(hub.slug),
    platformSubdomainLabel: normalizePlatformSubdomainLabel(hub?.platformSubdomainLabel || hub?.slug),
    name: normalizeString(hub.name),
    template: normalizeTemplate(hub.templateKey || hub.template),
    theme: normalizeTheme(hub.themeKey || hub.theme),
    domain: domainState.currentHost,
    domainLabel: domainState.currentHostLabel,
    status: normalizeString(hub.status) || "active",
    statusLabel:
      {
        active: "Active",
        provisioning: "Provisioning",
        needs_attention: "Needs attention",
      }[normalizeString(hub.status)] || "Unknown",
    supportState: normalizeString(hub.supportState) || "available",
    supportStateLabel:
      {
        available: "Available",
        onboarding: "Onboarding",
        attention: "Attention needed",
      }[normalizeString(hub.supportState)] || "Unknown",
    adminCount: Number.isFinite(Number(hub.adminCount)) ? Number(hub.adminCount) : 0,
    memberCount: Number.isFinite(Number(hub.memberCount)) ? Number(hub.memberCount) : 0,
    upcomingEventsCount: Number.isFinite(Number(hub.upcomingEventsCount)) ? Number(hub.upcomingEventsCount) : 0,
    pendingInvitesCount: Number.isFinite(Number(hub.pendingInvitesCount)) ? Number(hub.pendingInvitesCount) : 0,
    paymentsAttentionCount: Number.isFinite(Number(hub.paymentsAttentionCount)) ? Number(hub.paymentsAttentionCount) : 0,
    customDomains: domainState.customDomains,
    customDomain: domainState,
    features: hub.features || {},
    packageTier: entitlements.packageTier,
    packageTierLabel: entitlements.packageTierLabel,
    packageStatus: entitlements.packageStatus,
    packageStatusLabel: entitlements.packageStatusLabel,
    packageSource: entitlements.packageSource,
    packageSourceLabel: entitlements.packageSourceLabel,
    packageAssignedAt: entitlements.packageAssignedAt,
    packageUpdatedAt: entitlements.packageUpdatedAt,
    packageOverrides: entitlements.packageOverrides,
    packagePaymentProcessingMode: entitlements.paymentProcessingMode,
    packageCapabilities: entitlements.capabilities,
    packageLimits: entitlements.limits,
    regionalSetupStatus: getHubRegionalSetupStatus(hub),
    regionalSetupCompletedAt: normalizeString(hub.regionalSetupCompletedAt),
    country: regionalDefaults.country,
    timezone: regionalDefaults.timezone,
    locale: regionalDefaults.locale,
    defaultCurrency: regionalDefaults.defaultCurrency,
    globalHeaderId: normalizeString(hub.globalHeaderId),
    globalFooterId: normalizeString(hub.globalFooterId),
    themeRevision: Number.isFinite(Number(hub.themeRevision)) ? Number(hub.themeRevision) : 1,
    themeCssPath: normalizeString(hub.themeCssPath),
    createdAt: normalizeString(hub.createdAt),
    updatedAt: normalizeString(hub.updatedAt),
  };
}

async function deriveHubOperationalCounts(hubId, fallback = {}) {
  const db = getFirebaseAdminDb();
  const nowIso = new Date().toISOString();

  const [usersSnapshot, invitesSnapshot, eventsSnapshot] = await Promise.all([
    db.collection("users").where("hubId", "==", hubId).get(),
    db.collection("hubs").doc(hubId).collection("invites").get(),
    db.collection("hubs").doc(hubId).collection("events").get(),
  ]);

  const users = usersSnapshot.docs.map((doc) => doc.data());
  const invites = invitesSnapshot.docs.map((doc) => doc.data());
  const events = eventsSnapshot.docs.map((doc) => doc.data());

  return {
    adminCount: users.filter((user) => isHubOperatorRole(user.role)).length,
    memberCount: users.filter((user) => normalizeString(user.role) === "member").length,
    pendingInvitesCount: invites.filter((invite) => normalizeString(invite.status) === "pending").length,
    upcomingEventsCount: events.filter((event) => {
      const status = normalizeString(event.status) || "draft";
      const startAt = normalizeString(event.startAt);
      return Boolean(startAt) && startAt >= nowIso && status !== "cancelled";
    }).length,
    paymentsAttentionCount: Number.isFinite(Number(fallback.paymentsAttentionCount))
      ? Number(fallback.paymentsAttentionCount)
      : 0,
  };
}

async function hydrateHubRecord(hub) {
  const normalized = normalizeHubRecord(hub);

  if (!normalized?.id) {
    return normalized;
  }

  const counts = await deriveHubOperationalCounts(normalized.id, normalized);

  return {
    ...normalized,
    ...counts,
  };
}

async function listFirestoreHubs() {
  const db = getFirebaseAdminDb();
  const snapshot = await db.collection("hubs").orderBy("createdAt", "desc").get();

  return Promise.all(snapshot.docs.map((doc) => hydrateHubRecord({ id: doc.id, ...doc.data() })));
}

async function getFirestoreHubById(hubId) {
  const db = getFirebaseAdminDb();
  const doc = await db.collection("hubs").doc(hubId).get();

  if (!doc.exists) {
    return null;
  }

  return hydrateHubRecord({ id: doc.id, ...doc.data() });
}

async function getFirestoreHubBySlug(hubSlug) {
  const db = getFirebaseAdminDb();
  const snapshot = await db.collection("hubs").where("slug", "==", hubSlug).limit(1).get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return hydrateHubRecord({ id: doc.id, ...doc.data() });
}

async function getFirestoreHubByPlatformSubdomainLabel(platformSubdomainLabel) {
  const db = getFirebaseAdminDb();
  const snapshot = await db
    .collection("hubs")
    .where("platformSubdomainLabel", "==", platformSubdomainLabel)
    .limit(1)
    .get();

  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    return hydrateHubRecord({ id: doc.id, ...doc.data() });
  }

  const legacySnapshot = await db.collection("hubs").get();
  const legacyDoc = legacySnapshot.docs.find((doc) => {
    const data = doc.data();
    return normalizePlatformSubdomainLabel(data?.platformSubdomainLabel || data?.slug) === platformSubdomainLabel;
  });

  if (!legacyDoc) {
    return null;
  }

  const hub = { id: legacyDoc.id, ...legacyDoc.data() };
  const nextPlatformSubdomainLabel = normalizePlatformSubdomainLabel(hub?.platformSubdomainLabel || hub?.slug);

  if (!normalizeString(hub.platformSubdomainLabel) && nextPlatformSubdomainLabel) {
    await db.collection("hubs").doc(legacyDoc.id).update({
      platformSubdomainLabel: nextPlatformSubdomainLabel,
    });
    hub.platformSubdomainLabel = nextPlatformSubdomainLabel;
  }

  return hydrateHubRecord(hub);
}

export async function listHubs() {
  return listFirestoreHubs();
}

export async function getHubById(hubId) {
  const normalizedHubId = normalizeString(hubId);
  if (!normalizedHubId) {
    return null;
  }

  return getFirestoreHubById(normalizedHubId);
}

export async function getHubBySlug(hubSlug) {
  const normalizedHubSlug = normalizeString(hubSlug);
  if (!normalizedHubSlug) {
    return null;
  }

  return getFirestoreHubBySlug(normalizedHubSlug);
}

export async function getHubByPlatformSubdomainLabel(platformSubdomainLabel) {
  const normalizedLabel = normalizePlatformSubdomainLabel(platformSubdomainLabel);

  if (!normalizedLabel) {
    return null;
  }

  return getFirestoreHubByPlatformSubdomainLabel(normalizedLabel);
}

export async function getPlatformSummary() {
  const hubs = await listHubs();

  return {
    hubCount: String(hubs.length),
    provisioningCount: String(
      hubs.filter((hub) => hub.status === "provisioning" || hub.supportState === "onboarding").length
    ),
    supportAttentionCount: String(
      hubs.filter((hub) => hub.supportState === "attention" || hub.status === "needs_attention").length
    ),
  };
}

export async function requireHubById(hubId) {
  const hub = await getHubById(hubId);

  if (!hub) {
    throw new Error(`Unknown hub id: ${hubId}`);
  }

  return hub;
}

export async function requireHubBySlug(hubSlug) {
  const hub = await getHubBySlug(hubSlug);

  if (!hub) {
    throw new Error(`Unknown hub slug: ${hubSlug}`);
  }

  return hub;
}

export async function completeHubRegionalSetupBySlug(hubSlug, payload, actorId = "hub-admin") {
  const hub = await requireHubBySlug(hubSlug);
  const next = normalizeRegionalSetupPayload(payload);
  const db = getFirebaseAdminDb();
  const now = new Date().toISOString();
  const hubRef = db.collection("hubs").doc(hub.id);
  const membershipPlansRef = hubRef.collection("membershipPlans");
  const defaultPlanSnapshot = await membershipPlansRef.where("isDefault", "==", true).limit(1).get();
  const batch = db.batch();

  batch.update(hubRef, {
    country: next.country,
    locale: next.locale,
    timezone: next.timezone,
    defaultCurrency: next.defaultCurrency,
    regionalSetupStatus: "complete",
    regionalSetupCompletedAt: normalizeString(hub.regionalSetupCompletedAt) || now,
    updatedAt: now,
    updatedBy: actorId,
  });

  if (!defaultPlanSnapshot.empty) {
    const defaultPlanDoc = defaultPlanSnapshot.docs[0];
    const plan = defaultPlanDoc.data() || {};
    const pricingMode = normalizeString(plan.pricingMode).toLowerCase() || "free";

    if (pricingMode === "free") {
      batch.update(defaultPlanDoc.ref, {
        currency: next.defaultCurrency,
        updatedAt: now,
        updatedBy: actorId,
      });
    }
  }

  await batch.commit();

  return {
    ...hub,
    ...next,
    regionalSetupStatus: "complete",
    regionalSetupCompletedAt: normalizeString(hub.regionalSetupCompletedAt) || now,
  };
}

export async function requireHubByPlatformSubdomainLabel(platformSubdomainLabel) {
  const hub = await getHubByPlatformSubdomainLabel(platformSubdomainLabel);

  if (!hub) {
    throw new Error(`Unknown platform subdomain label: ${platformSubdomainLabel}`);
  }

  return hub;
}
