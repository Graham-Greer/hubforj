import "server-only";
import crypto from "node:crypto";
import { getDataProvider } from "@/lib/data/shared/provider";
import { getMediaByIds } from "@/lib/data/media/media-repository";
import { validateEventStatusTransition } from "@/lib/validation/events";

function eventToViewModel(event) {
  return {
    id: event.id,
    hubId: event.hubId,
    slug: event.slug,
    status: event.status,
    title: event.title,
    description: event.description,
    imageMediaIds: event.imageMediaIds || [],
    startAt: event.startAt,
    endAt: event.endAt,
    location: event.location,
    capacity: event.capacity,
    category: event.category,
    tags: event.tags || [],
    pricingMode: event.pricingMode,
    price: event.price ?? null,
    registrationEligibility: event.registrationEligibility,
    visibility: event.visibility,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
    createdBy: event.createdBy || null,
    updatedBy: event.updatedBy || null,
  };
}

function buildUsageRef(eventId, eventTitle, eventSlug) {
  return {
    kind: "event",
    label: eventTitle,
    eventId,
    eventSlug,
  };
}

async function countRegistrations(provider, hubId, eventId) {
  if (provider.type === "firestore") {
    const snapshot = await provider.db
      .collection("hubs")
      .doc(hubId)
      .collection("events")
      .doc(eventId)
      .collection("registrations")
      .where("status", "!=", "cancelled")
      .limit(1)
      .get();

    return snapshot.empty ? 0 : snapshot.size;
  }

  const events = provider.db.events.get(hubId) || [];
  const registrations = provider.db.registrations?.get(`${hubId}:${eventId}`) || [];
  if (registrations.length) {
    return registrations.filter((item) => item.status !== "cancelled").length;
  }
  const target = events.find((item) => item.id === eventId);
  return Number(target?.registrationCount || 0);
}

async function assertUniqueSlug(provider, hubId, slug, excludeEventId = null) {
  if (provider.type === "firestore") {
    const snapshot = await provider.db
      .collection("hubs")
      .doc(hubId)
      .collection("events")
      .where("slug", "==", slug)
      .limit(2)
      .get();

    const conflicting = snapshot.docs.find((doc) => doc.id !== excludeEventId);
    if (conflicting) {
      throw new Error("An event with this slug already exists for this hub.");
    }

    return;
  }

  const events = provider.db.events.get(hubId) || [];
  const conflicting = events.find((event) => event.slug === slug && event.id !== excludeEventId);
  if (conflicting) {
    throw new Error("An event with this slug already exists for this hub.");
  }
}

async function assertMediaSelectionValid(hubId, imageMediaIds) {
  const ids = Array.isArray(imageMediaIds)
    ? imageMediaIds.map((item) => String(item || "").trim()).filter(Boolean)
    : [];

  if (!ids.length) return [];

  const media = await getMediaByIds(hubId, ids);
  if (media.length !== new Set(ids).size) {
    throw new Error("One or more selected media assets were not found in this hub.");
  }

  return media;
}

async function assertPublishMediaReady(hubId, payload) {
  if (payload.status !== "published") return;

  const media = await assertMediaSelectionValid(hubId, payload.imageMediaIds || []);
  const missingAlt = media.find((item) => !String(item.alt || "").trim());
  if (missingAlt) {
    throw new Error("Cannot publish event: selected media is missing alt text.");
  }
}

function nextUsageRefs(existingRefs, eventRef, shouldInclude) {
  const refs = Array.isArray(existingRefs) ? existingRefs : [];
  const filtered = refs.filter((ref) => !(ref?.kind === "event" && ref?.eventId === eventRef.eventId));
  if (shouldInclude) {
    return [...filtered, eventRef];
  }
  return filtered;
}

async function syncEventMediaUsage(provider, {
  hubId,
  eventId,
  eventTitle,
  eventSlug,
  previousMediaIds,
  nextMediaIds,
}) {
  const previous = new Set((previousMediaIds || []).map((item) => String(item || "").trim()).filter(Boolean));
  const next = new Set((nextMediaIds || []).map((item) => String(item || "").trim()).filter(Boolean));
  const affected = new Set([...previous, ...next]);
  if (!affected.size) return;

  const eventRef = buildUsageRef(eventId, eventTitle, eventSlug);

  if (provider.type === "firestore") {
    const mediaCollection = provider.db.collection("hubs").doc(hubId).collection("media");

    await Promise.all(
      Array.from(affected).map(async (mediaId) => {
        const mediaRef = mediaCollection.doc(mediaId);
        const doc = await mediaRef.get();
        if (!doc.exists) return;

        const current = doc.data() || {};
        const usageRefs = nextUsageRefs(current.usageRefs, eventRef, next.has(mediaId));
        await mediaRef.update({
          usageRefs,
          usageCount: usageRefs.length,
          updatedAt: new Date().toISOString(),
        });
      })
    );

    return;
  }

  const media = provider.db.media.get(hubId) || [];
  const updated = media.map((item) => {
    if (!affected.has(item.id)) return item;

    const usageRefs = nextUsageRefs(item.usageRefs, eventRef, next.has(item.id));
    return {
      ...item,
      usageRefs,
      usageCount: usageRefs.length,
      updatedAt: new Date().toISOString(),
    };
  });

  provider.db.media.set(hubId, updated);
}

export async function listEventsByHub(hubId) {
  const provider = getDataProvider();

  if (provider.type === "firestore") {
    const snapshot = await provider.db
      .collection("hubs")
      .doc(hubId)
      .collection("events")
      .orderBy("startAt", "desc")
      .get();

    return snapshot.docs.map((doc) => eventToViewModel({ id: doc.id, hubId, ...doc.data() }));
  }

  const records = provider.db.events.get(hubId) || [];
  return records.map(eventToViewModel);
}

export async function listPublishedEventsByHub(hubId) {
  const events = await listEventsByHub(hubId);
  return events
    .filter((event) => event.status === "published")
    .sort((left, right) => String(left.startAt || "").localeCompare(String(right.startAt || "")));
}

export async function getEventBySlug(hubId, slug) {
  const provider = getDataProvider();
  const normalizedSlug = String(slug || "").trim();
  if (!normalizedSlug) return null;

  if (provider.type === "firestore") {
    const snapshot = await provider.db
      .collection("hubs")
      .doc(hubId)
      .collection("events")
      .where("slug", "==", normalizedSlug)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return eventToViewModel({ id: doc.id, hubId, ...doc.data() });
  }

  const records = provider.db.events.get(hubId) || [];
  const found = records.find((item) => item.slug === normalizedSlug);
  return found ? eventToViewModel(found) : null;
}

export async function getPublishedEventBySlug(hubId, slug) {
  const event = await getEventBySlug(hubId, slug);
  if (!event || event.status !== "published") {
    return null;
  }

  return event;
}

export async function getEventById(hubId, eventId) {
  const provider = getDataProvider();

  if (provider.type === "firestore") {
    const doc = await provider.db
      .collection("hubs")
      .doc(hubId)
      .collection("events")
      .doc(eventId)
      .get();

    if (!doc.exists) return null;
    return eventToViewModel({ id: doc.id, hubId, ...doc.data() });
  }

  const records = provider.db.events.get(hubId) || [];
  const event = records.find((item) => item.id === eventId);
  return event ? eventToViewModel(event) : null;
}

export async function createEvent(hubId, payload, actorId = "system") {
  const provider = getDataProvider();
  const now = new Date().toISOString();

  await assertUniqueSlug(provider, hubId, payload.slug);
  await assertMediaSelectionValid(hubId, payload.imageMediaIds);
  await assertPublishMediaReady(hubId, payload);

  if (provider.type === "firestore") {
    const ref = provider.db.collection("hubs").doc(hubId).collection("events").doc();
    const next = {
      ...payload,
      hubId,
      createdAt: now,
      updatedAt: now,
      createdBy: actorId,
      updatedBy: actorId,
    };

    await ref.set(next);
    await syncEventMediaUsage(provider, {
      hubId,
      eventId: ref.id,
      eventTitle: next.title,
      eventSlug: next.slug,
      previousMediaIds: [],
      nextMediaIds: next.imageMediaIds,
    });

    return eventToViewModel({ id: ref.id, ...next });
  }

  const id = `event_${crypto.randomUUID().slice(0, 8)}`;
  const next = {
    id,
    hubId,
    ...payload,
    createdAt: now,
    updatedAt: now,
    createdBy: actorId,
    updatedBy: actorId,
    registrationCount: 0,
  };

  const current = provider.db.events.get(hubId) || [];
  provider.db.events.set(hubId, [next, ...current]);

  await syncEventMediaUsage(provider, {
    hubId,
    eventId: id,
    eventTitle: next.title,
    eventSlug: next.slug,
    previousMediaIds: [],
    nextMediaIds: next.imageMediaIds,
  });

  return eventToViewModel(next);
}

export async function updateEvent(hubId, eventId, patch, actorId = "system") {
  const provider = getDataProvider();
  const now = new Date().toISOString();
  const existing = await getEventById(hubId, eventId);
  if (!existing) return null;

  const nextStatus = patch.status ?? existing.status;
  const hasRegistrations =
    existing.status !== nextStatus ? (await countRegistrations(provider, hubId, eventId)) > 0 : false;
  validateEventStatusTransition(existing.status, nextStatus, hasRegistrations);

  const nextPayload = {
    ...existing,
    ...patch,
    status: nextStatus,
  };

  await assertUniqueSlug(provider, hubId, nextPayload.slug, eventId);
  await assertMediaSelectionValid(hubId, nextPayload.imageMediaIds);
  await assertPublishMediaReady(hubId, nextPayload);

  if (provider.type === "firestore") {
    const ref = provider.db.collection("hubs").doc(hubId).collection("events").doc(eventId);
    await ref.update({
      ...patch,
      status: nextStatus,
      updatedAt: now,
      updatedBy: actorId,
    });

    const updated = await ref.get();
    const viewModel = eventToViewModel({ id: updated.id, hubId, ...updated.data() });

    await syncEventMediaUsage(provider, {
      hubId,
      eventId,
      eventTitle: viewModel.title,
      eventSlug: viewModel.slug,
      previousMediaIds: existing.imageMediaIds,
      nextMediaIds: viewModel.imageMediaIds,
    });

    return viewModel;
  }

  const records = provider.db.events.get(hubId) || [];
  const index = records.findIndex((item) => item.id === eventId);
  if (index === -1) return null;

  const next = {
    ...records[index],
    ...patch,
    status: nextStatus,
    updatedAt: now,
    updatedBy: actorId,
  };

  const cloned = [...records];
  cloned[index] = next;
  provider.db.events.set(hubId, cloned);

  await syncEventMediaUsage(provider, {
    hubId,
    eventId,
    eventTitle: next.title,
    eventSlug: next.slug,
    previousMediaIds: existing.imageMediaIds,
    nextMediaIds: next.imageMediaIds,
  });

  return eventToViewModel(next);
}

export async function transitionEventStatus(hubId, eventId, nextStatus, actorId = "system") {
  const provider = getDataProvider();
  const event = await getEventById(hubId, eventId);
  if (!event) return null;

  const hasRegistrations = (await countRegistrations(provider, hubId, eventId)) > 0;
  const resolvedStatus = validateEventStatusTransition(event.status, nextStatus, hasRegistrations);
  return updateEvent(hubId, eventId, { status: resolvedStatus }, actorId);
}
