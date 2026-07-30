try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { getPlatformHostedBaseHostname } from "@/lib/domain/custom-domain-runtime-config";

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeHostname(value) {
  return normalizeString(value)
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/[/?#].*$/, "")
    .replace(/:\d+$/, "")
    .replace(/\.+$/, "");
}

function normalizeMappingRecord(record) {
  if (!record) {
    return null;
  }

  return {
    hostname: normalizeHostname(record.hostname),
    hubId: normalizeString(record.hubId),
    hubSlug: normalizeString(record.hubSlug),
    canonicalHost: normalizeHostname(record.canonicalHost || record.hostname),
    redirectTo: normalizeHostname(record.redirectTo),
    matchType: normalizeString(record.matchType) || "canonical",
    companionHost: normalizeHostname(record.companionHost),
    fallbackHost: normalizeHostname(record.fallbackHost),
    status: normalizeString(record.status) || "connected",
    connectedAt: normalizeString(record.connectedAt),
    updatedAt: normalizeString(record.updatedAt),
    updatedBy: normalizeString(record.updatedBy),
  };
}

function buildCompanionHost(hostname) {
  const normalizedHostname = normalizeHostname(hostname);

  if (!normalizedHostname) {
    return "";
  }

  if (normalizedHostname.startsWith("www.")) {
    return normalizeHostname(normalizedHostname.slice(4));
  }

  return normalizeHostname(`www.${normalizedHostname}`);
}

export function buildCustomDomainMappingRecordsForHub(hubRecord, actorId = "system") {
  const hostname = normalizeHostname(hubRecord?.customDomain?.hostname);
  const hubId = normalizeString(hubRecord?.id);
  const hubSlug = normalizeString(hubRecord?.slug);
  const status = normalizeString(hubRecord?.customDomain?.status);
  const connectedAt = normalizeString(hubRecord?.customDomain?.connectedAt);
  const updatedAt = new Date().toISOString();

  if (!hostname || !hubId || !hubSlug || status !== "connected") {
    return null;
  }

  const canonicalHost = hostname;
  const companionHost = buildCompanionHost(hostname);
  const fallbackHost = getPlatformHostedBaseHostname();
  const sharedFields = {
    hubId,
    hubSlug,
    canonicalHost,
    companionHost,
    fallbackHost,
    status: "connected",
    connectedAt: connectedAt || updatedAt,
    updatedAt,
    updatedBy: actorId,
  };

  const records = [
    {
      hostname: canonicalHost,
      matchType: "canonical",
      redirectTo: "",
      ...sharedFields,
    },
  ];

  if (companionHost && companionHost !== canonicalHost) {
    records.push({
      hostname: companionHost,
      matchType: "companion",
      redirectTo: canonicalHost,
      ...sharedFields,
    });
  }

  return records;
}

export function listCustomDomainMappingHostnamesForRemoval(hostname) {
  const normalizedHostname = normalizeHostname(hostname);

  if (!normalizedHostname) {
    return [];
  }

  const companionHost = buildCompanionHost(normalizedHostname);
  return Array.from(new Set([normalizedHostname, companionHost].filter(Boolean)));
}

async function findConnectedHubByHostname(hostname) {
  const normalizedHostname = normalizeHostname(hostname);

  if (!normalizedHostname) {
    return null;
  }

  const snapshot = await getFirebaseAdminDb()
    .collection("hubs")
    .where("customDomain.hostname", "==", normalizedHostname)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  const hub = { id: doc.id, ...doc.data() };
  const status = normalizeString(hub?.customDomain?.status);

  if (status !== "connected") {
    return null;
  }

  return hub;
}

export async function getCustomDomainMappingByHostname(hostname, { hydrateFromHub = true } = {}) {
  const normalizedHostname = normalizeHostname(hostname);

  if (!normalizedHostname) {
    return null;
  }

  const doc = await getFirebaseAdminDb().collection("customDomainMappings").doc(normalizedHostname).get();

  if (doc.exists) {
    const mapping = normalizeMappingRecord(doc.data());

    if (mapping?.status === "connected" && mapping.hostname) {
      return mapping;
    }
  }

  if (!hydrateFromHub) {
    return null;
  }

  const hub = await findConnectedHubByHostname(normalizedHostname);

  if (!hub) {
    return null;
  }

  const mappings = buildCustomDomainMappingRecordsForHub(hub, "mapping-hydrator");
  const mapping = mappings.find((item) => item.hostname === normalizedHostname);

  if (!mapping) {
    return null;
  }

  const batch = getFirebaseAdminDb().batch();
  mappings.forEach((item) => {
    batch.set(getFirebaseAdminDb().collection("customDomainMappings").doc(item.hostname), item);
  });
  await batch.commit();
  return mapping;
}

export async function getCanonicalCustomDomainMappingByHubSlug(hubSlug) {
  const normalizedHubSlug = normalizeString(hubSlug);

  if (!normalizedHubSlug) {
    return null;
  }

  const snapshot = await getFirebaseAdminDb()
    .collection("customDomainMappings")
    .where("hubSlug", "==", normalizedHubSlug)
    .limit(5)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const mappings = snapshot.docs.map((doc) => normalizeMappingRecord(doc.data())).filter(Boolean);
  return mappings.find((item) => item.matchType === "canonical" && item.status === "connected") || null;
}

export async function writeCustomDomainMappingForHub(hubRecord, actorId = "system") {
  const mappings = buildCustomDomainMappingRecordsForHub(hubRecord, actorId);

  if (!mappings?.length) {
    throw new Error("Unable to write a custom-domain mapping unless the custom domain is connected.");
  }

  const batch = getFirebaseAdminDb().batch();

  mappings.forEach((item) => {
    batch.set(getFirebaseAdminDb().collection("customDomainMappings").doc(item.hostname), item);
  });

  await batch.commit();
  return mappings;
}

export async function deleteCustomDomainMappingByHostname(hostname) {
  const hostnames = listCustomDomainMappingHostnamesForRemoval(hostname);

  if (!hostnames.length) {
    return;
  }

  const batch = getFirebaseAdminDb().batch();
  hostnames.forEach((value) => {
    batch.delete(getFirebaseAdminDb().collection("customDomainMappings").doc(value));
  });

  await batch.commit();
}
