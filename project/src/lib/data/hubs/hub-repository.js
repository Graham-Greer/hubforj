import "server-only";
import crypto from "node:crypto";
import { getDataProvider } from "@/lib/data/shared/provider";
import {
  DEFAULT_GLOBAL_FOOTER_ID,
  DEFAULT_GLOBAL_HEADER_ID,
  normalizeGlobalFooterId,
  normalizeGlobalHeaderId,
} from "@/lib/data/pages/layout-config";
import {
  assertNoCanonicalDuplicates,
  assertNoCrossHubConflicts,
  assertNoReservedDomains,
  assertValidDomainFormat,
  dedupeByCanonicalDomain,
} from "./domain-policy";
import { getThemeCssPath } from "@/lib/theming/hub-theme";
import { ensureHubThemeCssForCreate, ensureHubThemeCssForUpdate } from "@/lib/theming/theme-css-service";

function normalizeDomain(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/[/?#].*$/, "")
    .replace(/:\d+$/, "")
    .replace(/\.+$/, "");
}

function hubToViewModel(hub) {
  return {
    id: hub.id,
    name: hub.name,
    slug: hub.slug,
    templateKey: hub.templateKey,
    tokenOverrides: hub.tokenOverrides || {},
    globalHeaderId: normalizeGlobalHeaderId(hub.globalHeaderId || DEFAULT_GLOBAL_HEADER_ID),
    globalFooterId: normalizeGlobalFooterId(hub.globalFooterId || DEFAULT_GLOBAL_FOOTER_ID),
    features: hub.features || {},
    customDomains: hub.customDomains || [],
    themeRevision: Number.isFinite(Number(hub.themeRevision)) && Number(hub.themeRevision) > 0
      ? Math.floor(Number(hub.themeRevision))
      : 1,
    themeCssPath: hub.themeCssPath || getThemeCssPath(hub.id),
    createdAt: hub.createdAt,
    updatedAt: hub.updatedAt,
  };
}

async function listAllHubsForPolicy(provider) {
  if (provider.type === "firestore") {
    const snapshot = await provider.db.collection("hubs").get();
    return snapshot.docs.map((doc) => hubToViewModel({ id: doc.id, ...doc.data() }));
  }
  return Array.from(provider.db.hubs.values()).map(hubToViewModel);
}

async function assertDomainPolicy(provider, domains, currentHubId = null) {
  const normalized = Array.isArray(domains) ? domains.map(normalizeDomain).filter(Boolean) : [];
  for (const domain of normalized) {
    assertValidDomainFormat(domain);
  }

  assertNoCanonicalDuplicates(normalized);
  const deduped = dedupeByCanonicalDomain(normalized);
  assertNoReservedDomains(deduped);

  const hubs = await listAllHubsForPolicy(provider);
  assertNoCrossHubConflicts({
    domains: deduped,
    existingHubs: hubs,
    currentHubId,
  });

  return deduped;
}

export async function listHubs() {
  const provider = getDataProvider();

  if (provider.type === "firestore") {
    const snapshot = await provider.db.collection("hubs").orderBy("createdAt", "desc").get();
    return snapshot.docs.map((doc) => hubToViewModel({ id: doc.id, ...doc.data() }));
  }

  return Array.from(provider.db.hubs.values()).map(hubToViewModel);
}

export async function getHubById(hubId) {
  const normalizedHubId = String(hubId || "").trim();
  if (!normalizedHubId) return null;

  const provider = getDataProvider();

  if (provider.type === "firestore") {
    const doc = await provider.db.collection("hubs").doc(normalizedHubId).get();
    if (!doc.exists) return null;
    return hubToViewModel({ id: doc.id, ...doc.data() });
  }

  const hub = provider.db.hubs.get(normalizedHubId);
  return hub ? hubToViewModel(hub) : null;
}

export async function getHubBySlug(slug) {
  const normalizedSlug = String(slug || "").trim();
  if (!normalizedSlug) return null;

  const provider = getDataProvider();

  if (provider.type === "firestore") {
    const snapshot = await provider.db.collection("hubs").where("slug", "==", normalizedSlug).limit(1).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return hubToViewModel({ id: doc.id, ...doc.data() });
  }

  const hub = Array.from(provider.db.hubs.values()).find((item) => item.slug === normalizedSlug);
  return hub ? hubToViewModel(hub) : null;
}

export async function getHubByCustomDomain(domain) {
  const provider = getDataProvider();
  const normalizedDomain = normalizeDomain(domain);
  if (!normalizedDomain) return null;

  if (provider.type === "firestore") {
    const snapshot = await provider.db.collection("hubs").where("customDomains", "array-contains", normalizedDomain).limit(1).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return hubToViewModel({ id: doc.id, ...doc.data() });
  }

  const hub = Array.from(provider.db.hubs.values()).find((item) => {
    const domains = Array.isArray(item.customDomains) ? item.customDomains : [];
    return domains.map(normalizeDomain).includes(normalizedDomain);
  });

  return hub ? hubToViewModel(hub) : null;
}

export async function createHub(payload, actorId = "system") {
  const provider = getDataProvider();
  const now = new Date().toISOString();
  const customDomains = await assertDomainPolicy(provider, payload.customDomains || [], null);

  if (provider.type === "firestore") {
    const ref = provider.db.collection("hubs").doc();
    const next = {
      id: ref.id,
      ...payload,
      globalHeaderId: normalizeGlobalHeaderId(payload.globalHeaderId || DEFAULT_GLOBAL_HEADER_ID),
      globalFooterId: normalizeGlobalFooterId(payload.globalFooterId || DEFAULT_GLOBAL_FOOTER_ID),
      customDomains,
      themeRevision: 1,
      themeCssPath: getThemeCssPath(ref.id),
      createdAt: now,
      updatedAt: now,
      createdBy: actorId,
    };
    await ensureHubThemeCssForCreate(next);
    const { id: _ignoreId, ...writeModel } = next;
    await ref.set(writeModel);
    return hubToViewModel(next);
  }

  const id = `hub_${crypto.randomUUID().slice(0, 8)}`;
  const next = {
    id,
    ...payload,
    globalHeaderId: normalizeGlobalHeaderId(payload.globalHeaderId || DEFAULT_GLOBAL_HEADER_ID),
    globalFooterId: normalizeGlobalFooterId(payload.globalFooterId || DEFAULT_GLOBAL_FOOTER_ID),
    customDomains,
    themeRevision: 1,
    themeCssPath: getThemeCssPath(id),
    createdAt: now,
    updatedAt: now,
    createdBy: actorId,
  };
  try {
    await ensureHubThemeCssForCreate(next);
  } catch {
    // Dev memory mode can continue without remote storage writes.
  }
  provider.db.hubs.set(id, next);
  provider.db.invites.set(id, []);
  return hubToViewModel(next);
}

export async function updateHub(hubId, patch) {
  const provider = getDataProvider();
  const now = new Date().toISOString();
  const nextPatch = { ...patch };
  if (Object.hasOwn(nextPatch, "globalHeaderId")) {
    nextPatch.globalHeaderId = normalizeGlobalHeaderId(nextPatch.globalHeaderId);
  }
  if (Object.hasOwn(nextPatch, "globalFooterId")) {
    nextPatch.globalFooterId = normalizeGlobalFooterId(nextPatch.globalFooterId);
  }
  if (Object.hasOwn(nextPatch, "customDomains")) {
    nextPatch.customDomains = await assertDomainPolicy(provider, nextPatch.customDomains || [], hubId);
  }

  if (provider.type === "firestore") {
    const ref = provider.db.collection("hubs").doc(hubId);
    const doc = await ref.get();
    if (!doc.exists) return null;
    const current = hubToViewModel({ id: doc.id, ...doc.data() });
    const themeUpdate = await ensureHubThemeCssForUpdate(current, nextPatch);
    await ref.update({
      ...nextPatch,
      themeRevision: themeUpdate.themeRevision,
      themeCssPath: themeUpdate.themeCssPath,
      updatedAt: now,
    });
    const updated = await ref.get();
    return hubToViewModel({ id: updated.id, ...updated.data() });
  }

  const current = provider.db.hubs.get(hubId);
  if (!current) return null;
  let themeUpdate = {
    themeRevision: Number.isFinite(Number(current.themeRevision)) && Number(current.themeRevision) > 0
      ? Math.floor(Number(current.themeRevision))
      : 1,
    themeCssPath: current.themeCssPath || getThemeCssPath(hubId),
  };
  try {
    themeUpdate = await ensureHubThemeCssForUpdate(current, nextPatch);
  } catch {
    // Dev memory mode can continue without remote storage writes.
  }

  const next = {
    ...current,
    ...nextPatch,
    themeRevision: themeUpdate.themeRevision,
    themeCssPath: themeUpdate.themeCssPath,
    updatedAt: now,
  };
  provider.db.hubs.set(hubId, next);
  return hubToViewModel(next);
}
