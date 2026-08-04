try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { getHubBySlug } from "@/lib/data/hubs";
import { canViewPublishedEvent, isEventPubliclyVisible, normalizeEventSlug } from "@/lib/domain/events";
import { normalizeEventRecord, normalizeString, withEventMedia, withPublicEventMedia } from "./event-shared.js";

const PUBLIC_EVENTS_QUERY_LIMIT = 120;

function isBoundedPublicOfferingQueriesEnabled() {
  return normalizeString(process.env.HUB_PLATFORM_PUBLIC_BOUNDED_OFFERING_QUERIES_ENABLED).toLowerCase() === "true";
}

function normalizeDateForFirestoreBoundary(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 16);
  }

  return date.toISOString().slice(0, 16);
}

function sortEventsByStartAt(events) {
  return [...events].sort((left, right) => String(left.startAt || "").localeCompare(String(right.startAt || "")));
}

async function listFirestoreEventsByHubId(hubId) {
  const snapshot = await getFirebaseAdminDb()
    .collection("hubs")
    .doc(hubId)
    .collection("events")
    .orderBy("startAt", "asc")
    .get();

  const events = snapshot.docs.map((doc) => normalizeEventRecord({ id: doc.id, hubId, ...doc.data() }));
  return withEventMedia(hubId, events);
}

async function listFirestorePublishedEventsByHubId(hubId) {
  if (!isBoundedPublicOfferingQueriesEnabled()) {
    const snapshot = await getFirebaseAdminDb()
      .collection("hubs")
      .doc(hubId)
      .collection("events")
      .where("status", "==", "published")
      .get();

    const events = snapshot.docs.map((doc) => normalizeEventRecord({ id: doc.id, hubId, ...doc.data() }));
    return withPublicEventMedia(hubId, sortEventsByStartAt(events));
  }

  const eventsCollection = getFirebaseAdminDb().collection("hubs").doc(hubId).collection("events");
  const cutoff = normalizeDateForFirestoreBoundary();
  const [startingSnapshot, endingSnapshot] = await Promise.all([
    eventsCollection
      .where("status", "==", "published")
      .where("startAt", ">=", cutoff)
      .orderBy("startAt", "asc")
      .limit(PUBLIC_EVENTS_QUERY_LIMIT)
      .get(),
    eventsCollection
      .where("status", "==", "published")
      .where("endAt", ">=", cutoff)
      .orderBy("endAt", "asc")
      .limit(PUBLIC_EVENTS_QUERY_LIMIT)
      .get(),
  ]);
  const byId = new Map();

  [...startingSnapshot.docs, ...endingSnapshot.docs].forEach((doc) => {
    byId.set(doc.id, normalizeEventRecord({ id: doc.id, hubId, ...doc.data() }));
  });

  return withPublicEventMedia(hubId, sortEventsByStartAt([...byId.values()]));
}

async function countFirestoreActiveUpcomingPublishedEventsByHubId(hubId, now = new Date()) {
  const cutoff = normalizeDateForFirestoreBoundary(now);
  const snapshot = await getFirebaseAdminDb()
    .collection("hubs")
    .doc(hubId)
    .collection("events")
    .where("status", "==", "published")
    .select("startAt", "endAt")
    .get();

  return snapshot.docs.filter((doc) => {
    const data = doc.data() || {};
    return normalizeString(data.endAt) >= cutoff || normalizeString(data.startAt) >= cutoff;
  }).length;
}

async function getFirestoreEventBySlug(hubId, eventSlug) {
  const snapshot = await getFirebaseAdminDb()
    .collection("hubs")
    .doc(hubId)
    .collection("events")
    .where("slug", "==", eventSlug)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  const [event] = await withEventMedia(hubId, [normalizeEventRecord({ id: doc.id, hubId, ...doc.data() })]);
  return event || null;
}

export async function listEventsByHubSlug(hubSlug) {
  const hub = await getHubBySlug(hubSlug);

  if (!hub) {
    return [];
  }

  return listEventsByHub(hub);
}

export async function listEventsByHub(hub) {
  const hubId = normalizeString(hub?.id);

  if (!hubId) {
    return [];
  }

  return listFirestoreEventsByHubId(hubId);
}

export async function countActiveUpcomingPublishedEventsByHub(hubId, options = {}) {
  const normalizedHubId = normalizeString(hubId);
  const now = options.now ?? new Date();
  const excludeEventId = normalizeString(options.excludeEventId);

  if (!normalizedHubId) {
    return 0;
  }

  const count = await countFirestoreActiveUpcomingPublishedEventsByHubId(normalizedHubId, now);

  if (!excludeEventId) {
    return count;
  }

  const event = await getEventById(normalizedHubId, excludeEventId);

  if (!event) {
    return count;
  }

  const nowIso = normalizeDateForFirestoreBoundary(now);
  const excludedEventMatches =
    normalizeString(event.status) === "published" &&
    (normalizeString(event.endAt) >= nowIso || normalizeString(event.startAt) >= nowIso);

  return excludedEventMatches ? Math.max(0, count - 1) : count;
}

export async function listPublicEventsByHubSlug(hubSlug) {
  const events = await listEventsByHubSlug(hubSlug);
  return events.filter(isEventPubliclyVisible);
}

export async function listPublicEventsByHub(hub) {
  const events = await listEventsByHub(hub);
  return events.filter(isEventPubliclyVisible);
}

export async function listVisibleEventsByHubSlug(hubSlug, { isMember = false } = {}) {
  const events = await listEventsByHubSlug(hubSlug);
  return events.filter((event) => canViewPublishedEvent(event, { isMember }));
}

export async function listVisibleEventsByHub(hub, { isMember = false } = {}) {
  const hubId = normalizeString(hub?.id);

  if (!hubId) {
    return [];
  }

  const events = await listFirestorePublishedEventsByHubId(hubId);
  return events.filter((event) => canViewPublishedEvent(event, { isMember }));
}

export async function getEventById(hubId, eventId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedEventId = normalizeString(eventId);

  if (!normalizedHubId || !normalizedEventId) {
    return null;
  }

  const doc = await getFirebaseAdminDb()
    .collection("hubs")
    .doc(normalizedHubId)
    .collection("events")
    .doc(normalizedEventId)
    .get();

  if (!doc.exists) {
    return null;
  }

  const [event] = await withEventMedia(
    normalizedHubId,
    [normalizeEventRecord({ id: doc.id, hubId: normalizedHubId, ...doc.data() })]
  );
  return event || null;
}

export async function getEventBySlug(hubSlug, eventSlug) {
  const hub = await getHubBySlug(hubSlug);
  const normalizedEventSlug = normalizeEventSlug(eventSlug);

  if (!hub || !normalizedEventSlug) {
    return null;
  }

  return getEventBySlugForHub(hub, normalizedEventSlug);
}

export async function getEventBySlugForHub(hub, eventSlug) {
  const hubId = normalizeString(hub?.id);
  const normalizedEventSlug = normalizeEventSlug(eventSlug);

  if (!hubId || !normalizedEventSlug) {
    return null;
  }

  return getFirestoreEventBySlug(hubId, normalizedEventSlug);
}

export async function getPublicEventBySlug(hubSlug, eventSlug) {
  const event = await getEventBySlug(hubSlug, eventSlug);
  return isEventPubliclyVisible(event) ? event : null;
}

export async function getPublicEventBySlugForHub(hub, eventSlug) {
  const event = await getEventBySlugForHub(hub, eventSlug);
  return isEventPubliclyVisible(event) ? event : null;
}

export async function getVisibleEventBySlug(hubSlug, eventSlug, { isMember = false } = {}) {
  const event = await getEventBySlug(hubSlug, eventSlug);
  return canViewPublishedEvent(event, { isMember }) ? event : null;
}

export async function getVisibleEventBySlugForHub(hub, eventSlug, { isMember = false } = {}) {
  const event = await getEventBySlugForHub(hub, eventSlug);
  return canViewPublishedEvent(event, { isMember }) ? event : null;
}
