try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { getHubBySlug } from "@/lib/data/hubs";
import { getMediaAssetsByIds } from "@/lib/data/media";
import { normalizeEventRecord, withEventMedia } from "@/lib/data/event-shared";
import { normalizeEventSeriesRecord } from "./event-series-shared.js";

function normalizeString(value) {
  return String(value || "").trim();
}

function canViewPublishedEventSeries(series, { isMember = false } = {}) {
  if (!series || normalizeString(series.status) !== "published") {
    return false;
  }

  const visibility = normalizeString(series.visibility) || "public";
  return visibility === "public" || (visibility === "members-only" && isMember);
}

async function attachSeriesMedia(hubId, series = []) {
  const assetIds = [...new Set(series.map((item) => item.imageAssetId).filter(Boolean))];
  const assets = await getMediaAssetsByIds(hubId, assetIds);
  const assetsById = new Map(assets.map((asset) => [asset.id, asset]));

  return series.map((item) => ({
    ...item,
    imageAsset: item.imageAssetId ? assetsById.get(item.imageAssetId) || null : null,
  }));
}

export async function listEventSeriesByHubSlug(hubSlug) {
  const hub = await getHubBySlug(hubSlug);

  if (!hub) {
    return [];
  }

  return listEventSeriesByHub(hub);
}

export async function listEventSeriesByHub(hub) {
  const hubId = normalizeString(hub?.id);

  if (!hubId) {
    return [];
  }

  const snapshot = await getFirebaseAdminDb()
    .collection("hubs")
    .doc(hubId)
    .collection("eventSeries")
    .orderBy("createdAt", "desc")
    .get();

  const series = snapshot.docs
    .map((doc) => normalizeEventSeriesRecord({ id: doc.id, hubId, ...doc.data() }))
    .filter(Boolean);
  return attachSeriesMedia(hubId, series);
}

export async function getEventSeriesById(hubId, seriesId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedSeriesId = normalizeString(seriesId);

  if (!normalizedHubId || !normalizedSeriesId) {
    return null;
  }

  const doc = await getFirebaseAdminDb()
    .collection("hubs")
    .doc(normalizedHubId)
    .collection("eventSeries")
    .doc(normalizedSeriesId)
    .get();

  if (!doc.exists) {
    return null;
  }

  const [series] = await attachSeriesMedia(
    normalizedHubId,
    [normalizeEventSeriesRecord({ id: doc.id, hubId: normalizedHubId, ...doc.data() })]
  );

  return series || null;
}

export async function getEventSeriesBySlugBase(hubSlug, slugBase) {
  const hub = await getHubBySlug(hubSlug);
  const normalizedSlugBase = normalizeString(slugBase);

  if (!hub || !normalizedSlugBase) {
    return null;
  }

  return getEventSeriesBySlugBaseForHub(hub, normalizedSlugBase);
}

export async function getEventSeriesBySlugBaseForHub(hub, slugBase) {
  const hubId = normalizeString(hub?.id);
  const normalizedSlugBase = normalizeString(slugBase);

  if (!hubId || !normalizedSlugBase) {
    return null;
  }

  const snapshot = await getFirebaseAdminDb()
    .collection("hubs")
    .doc(hubId)
    .collection("eventSeries")
    .where("slugBase", "==", normalizedSlugBase)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const [series] = await attachSeriesMedia(
    hubId,
    [normalizeEventSeriesRecord({ id: snapshot.docs[0].id, hubId, ...snapshot.docs[0].data() })]
  );

  return series || null;
}

export async function getVisibleEventSeriesBySlugBase(hubSlug, slugBase, { isMember = false } = {}) {
  const series = await getEventSeriesBySlugBase(hubSlug, slugBase);
  return canViewPublishedEventSeries(series, { isMember }) ? series : null;
}

export async function getVisibleEventSeriesBySlugBaseForHub(hub, slugBase, { isMember = false } = {}) {
  const series = await getEventSeriesBySlugBaseForHub(hub, slugBase);
  return canViewPublishedEventSeries(series, { isMember }) ? series : null;
}

export async function listEventSeriesOccurrences(hubId, seriesId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedSeriesId = normalizeString(seriesId);

  if (!normalizedHubId || !normalizedSeriesId) {
    return [];
  }

  const snapshot = await getFirebaseAdminDb()
    .collection("hubs")
    .doc(normalizedHubId)
    .collection("events")
    .where("seriesId", "==", normalizedSeriesId)
    .get();

  const events = snapshot.docs
    .map((doc) => normalizeEventRecord({ id: doc.id, hubId: normalizedHubId, ...doc.data() }))
    .filter(Boolean)
    .sort((left, right) => String(left.occurrenceDate || "").localeCompare(String(right.occurrenceDate || "")));

  return withEventMedia(normalizedHubId, events);
}
