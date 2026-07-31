try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { getHubBySlug } from "@/lib/data/hubs";
import { canViewPublishedEvent, isEventPubliclyVisible, normalizeEventSlug } from "@/lib/domain/events";
import { normalizeEventRecord, normalizeString, withEventMedia } from "./event-shared.js";

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

async function countFirestoreActiveUpcomingPublishedEventsByHubId(hubId, now = new Date()) {
  const nowIso = (now instanceof Date ? now : new Date(now)).toISOString();
  const snapshot = await getFirebaseAdminDb()
    .collection("hubs")
    .doc(hubId)
    .collection("events")
    .where("status", "==", "published")
    .select("startAt")
    .get();

  return snapshot.docs.filter((doc) => normalizeString(doc.data()?.startAt) >= nowIso).length;
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

  const nowIso = (now instanceof Date ? now : new Date(now)).toISOString();
  const excludedEventMatches = normalizeString(event.status) === "published" && normalizeString(event.startAt) >= nowIso;

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
  const events = await listEventsByHub(hub);
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
