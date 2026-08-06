try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import crypto from "node:crypto";
import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { countActiveUpcomingPublishedEventsByHub } from "./event-queries.js";
import { getHubById, getHubBySlug } from "@/lib/data/hubs";
import { assertHubCapability, hasHubCapability } from "@/lib/domain/package-guards";
import { resolveHubPackageEntitlements } from "@/lib/domain/hub-package";
import { getHubPaymentConfigurationByHubId } from "@/lib/data/hub-payment-configurations";
import { createPackageLimitError } from "@/lib/domain/package-upgrade";
import {
  isActiveUpcomingPublishedEvent,
  normalizeCreateEventPayload,
  resolveEventPaymentConfiguration,
} from "@/lib/domain/events";
import { canHubUseGroupBookings } from "@/lib/domain/event-bookings";
import { assertHubNativePaymentsReady } from "@/lib/domain/hub-payment-configuration";
import { normalizeEventRecord, normalizeString } from "./event-shared.js";
import { createMediaUsageReference, removeMediaUsageReference, syncMediaUsageReferenceForAssetChange } from "./media-usage-projection.js";
import { rebuildEventMemberActivity } from "./member-activity.js";

async function maintainDashboardProjectionsForEventChange(hubId, actorId, reason = "event-change") {
  try {
    const { maintainHubAdminDashboardProjectionsByHubId } = await import("./hub-dashboard-stats.js");
    return maintainHubAdminDashboardProjectionsByHubId(hubId, actorId, { reason });
  } catch (error) {
    console.warn("Unable to start dashboard projection maintenance after event change", {
      hubId: normalizeString(hubId),
      actorId: normalizeString(actorId) || "system",
      reason,
      error: String(error?.message || "Unable to maintain dashboard projections."),
    });
    return null;
  }
}

async function refreshMemberActivityForEventChange(hubId, eventId, actorId, reason = "event-change") {
  try {
    return await rebuildEventMemberActivity(hubId, eventId, {
      actorId,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.warn("Unable to refresh member activity projection after event change", {
      hubId: normalizeString(hubId),
      eventId: normalizeString(eventId),
      actorId: normalizeString(actorId) || "system",
      reason,
      error: String(error?.message || "Unable to refresh member activity projection."),
    });
    return null;
  }
}

async function assertUniqueEventSlug(hubId, slug, excludeEventId = "") {
  const snapshot = await getFirebaseAdminDb()
    .collection("hubs")
    .doc(hubId)
    .collection("events")
    .where("slug", "==", slug)
    .limit(1)
    .get();

  if (!snapshot.empty && snapshot.docs.some((doc) => doc.id !== excludeEventId)) {
    throw new Error("An event with this slug already exists for this hub.");
  }
}

async function assertHubCanPublishActiveUpcomingEvent(hub, event, { excludeEventId = "" } = {}) {
  if (!isActiveUpcomingPublishedEvent(event)) {
    return;
  }

  const entitlements = resolveHubPackageEntitlements(hub);
  const activeUpcomingEventsLimit = entitlements.limits?.activeUpcomingEvents;

  if (!Number.isFinite(activeUpcomingEventsLimit)) {
    return;
  }

  const currentCount = await countActiveUpcomingPublishedEventsByHub(hub.id, { excludeEventId });

  if (currentCount >= activeUpcomingEventsLimit) {
    throw createPackageLimitError({
      code: "active_upcoming_events_limit",
      message: `You've reached your limit of ${activeUpcomingEventsLimit} active events. Upgrade to publish more.`,
      title: "Active event limit reached",
      description:
        "Your current package allows a limited number of active upcoming events at one time. Upgrade to publish more without waiting for existing events to pass.",
      currentUsage: currentCount,
      limit: activeUpcomingEventsLimit,
      unlocks: [
        "Unlimited active upcoming events",
        "Paid event capability",
        "Access to broader monetisation features",
      ],
    });
  }
}

function assertHubCanUseEventPricing(hub, event, existingEvent = null) {
  const nextPricingMode = normalizeString(event?.pricingMode);
  const canUsePaidEvents = hasHubCapability(hub, "paidEventsEnabled");

  if (nextPricingMode !== "paid") {
    if (normalizeString(existingEvent?.pricingMode) === "paid" && !canUsePaidEvents) {
      throw new Error(
        "This paid event is protected on your current package. Upgrade to Growth to change or downgrade paid event pricing."
      );
    }
    return;
  }

  if (canUsePaidEvents) {
    return;
  }

  const preservesExistingPaidPricing =
    normalizeString(existingEvent?.pricingMode) === "paid" &&
    normalizeString(event?.price) === normalizeString(existingEvent?.price) &&
    normalizeString(event?.currency).toUpperCase() === normalizeString(existingEvent?.currency).toUpperCase() &&
    normalizeString(event?.externalPaymentUrl) === normalizeString(existingEvent?.externalPaymentUrl) &&
    normalizeString(event?.paymentInstructions) === normalizeString(existingEvent?.paymentInstructions);

  if (!preservesExistingPaidPricing) {
    assertHubCapability(hub, "paidEventsEnabled", "Paid events are available on Starter and above.");
  }
}

function assertHubCanUseEventBookingMode(hub, event) {
  const nextEligibility = normalizeString(event?.registrationEligibility) || "members-only";
  const nextBookingMode = normalizeString(event?.bookingMode) || "single_attendee";
  const canUseGroupBookings = canHubUseGroupBookings(hub);

  if (canUseGroupBookings) {
    return;
  }

  if (nextEligibility !== "members-only" || nextBookingMode !== "single_attendee") {
    throw new Error("Group bookings are only available on the Growth package tier.");
  }
}

export async function createEventByHubSlug(hubSlug, payload, actorId = "system") {
  const hub = await getHubBySlug(hubSlug);

  if (!hub) {
    throw new Error("Hub not found.");
  }

  const next = normalizeCreateEventPayload(payload);
  await assertUniqueEventSlug(hub.id, next.slug);
  assertHubCanUseEventPricing(hub, next);
  assertHubCanUseEventBookingMode(hub, next);
  if (next.pricingMode === "paid") {
    const paymentConfigurationRecord = await getHubPaymentConfigurationByHubId(hub.id);
    assertHubNativePaymentsReady(hub, paymentConfigurationRecord, "creating paid events on Growth");
  }
  const paymentConfiguration = resolveEventPaymentConfiguration(next, hub.packagePaymentProcessingMode);
  await assertHubCanPublishActiveUpcomingEvent(hub, next);

  const now = new Date().toISOString();
  const ref = getFirebaseAdminDb()
    .collection("hubs")
    .doc(hub.id)
    .collection("events")
    .doc(`event_${crypto.randomUUID().slice(0, 12)}`);

  const writeModel = {
    hubId: hub.id,
    slug: next.slug,
    status: next.status,
    title: next.title,
    summary: next.summary,
    description: next.description,
    imageAssetId: next.imageAssetId,
    imageAlt: next.imageAlt,
    startDate: next.startDate,
    endDate: next.endDate,
    startTime: next.startTime,
    endTime: next.endTime,
    startAt: next.startAt,
    endAt: next.endAt,
    location: next.location,
    capacity: next.capacity,
    pricingMode: next.pricingMode,
    price: next.pricingMode === "paid" ? next.price : "",
    currency: next.currency,
    externalPaymentUrl: paymentConfiguration.externalPaymentUrl,
    paymentInstructions: paymentConfiguration.paymentInstructions,
    refundWindowMode: next.refundWindowMode,
    refundWindowHours: next.refundWindowHours,
    refundPolicy: next.refundPolicy,
    registrationEligibility: next.registrationEligibility,
    bookingMode: next.bookingMode,
    maxAttendeesPerBooking: next.maxAttendeesPerBooking,
    guestDetailsMode: next.guestDetailsMode,
    registeredAttendeeCount: 0,
    waitlistedAttendeeCount: 0,
    cancelledAttendeeCount: 0,
    activeBookingCount: 0,
    visibility: next.visibility,
    allowWaitlist: next.allowWaitlist,
    category: next.category,
    createdAt: now,
    updatedAt: now,
    createdBy: actorId,
    updatedBy: actorId,
  };

  await ref.set(writeModel);
  await syncMediaUsageReferenceForAssetChange({
    hubId: hub.id,
    previousAssetId: "",
    nextAssetId: next.imageAssetId,
    usageRef: createMediaUsageReference({
      entityType: "event",
      entityId: ref.id,
      field: "image",
      label: next.title || "Event image",
      href: "",
    }),
    updatedAt: now,
  });
  await maintainDashboardProjectionsForEventChange(hub.id, actorId, "event-create");

  return normalizeEventRecord({ id: ref.id, ...writeModel });
}

export async function updateEventById(hubId, eventId, payload, actorId = "system") {
  const normalizedHubId = normalizeString(hubId);
  const normalizedEventId = normalizeString(eventId);

  if (!normalizedHubId || !normalizedEventId) {
    throw new Error("Hub and event ids are required.");
  }

  const ref = getFirebaseAdminDb().collection("hubs").doc(normalizedHubId).collection("events").doc(normalizedEventId);
  const existing = await ref.get();

  if (!existing.exists) {
    throw new Error("Event not found.");
  }

  const next = normalizeCreateEventPayload(payload);
  await assertUniqueEventSlug(normalizedHubId, next.slug, normalizedEventId);
  const hub = await getHubById(normalizedHubId);

  if (!hub) {
    throw new Error("Hub not found.");
  }

  assertHubCanUseEventPricing(hub, next, existing.data());
  assertHubCanUseEventBookingMode(hub, next, existing.data());
  if (next.pricingMode === "paid") {
    const paymentConfigurationRecord = await getHubPaymentConfigurationByHubId(hub.id);
    assertHubNativePaymentsReady(hub, paymentConfigurationRecord, "saving paid events on Growth");
  }
  const paymentConfiguration = resolveEventPaymentConfiguration(next, hub.packagePaymentProcessingMode);
  await assertHubCanPublishActiveUpcomingEvent(hub, next, { excludeEventId: normalizedEventId });

  const update = {
    slug: next.slug,
    status: next.status,
    title: next.title,
    summary: next.summary,
    description: next.description,
    imageAssetId: next.imageAssetId,
    imageAlt: next.imageAlt,
    startDate: next.startDate,
    endDate: next.endDate,
    startTime: next.startTime,
    endTime: next.endTime,
    startAt: next.startAt,
    endAt: next.endAt,
    location: next.location,
    capacity: next.capacity,
    pricingMode: next.pricingMode,
    price: next.pricingMode === "paid" ? next.price : "",
    currency: next.currency,
    externalPaymentUrl: paymentConfiguration.externalPaymentUrl,
    paymentInstructions: paymentConfiguration.paymentInstructions,
    refundWindowMode: next.refundWindowMode,
    refundWindowHours: next.refundWindowHours,
    refundPolicy: next.refundPolicy,
    registrationEligibility: next.registrationEligibility,
    bookingMode: next.bookingMode,
    maxAttendeesPerBooking: next.maxAttendeesPerBooking,
    guestDetailsMode: next.guestDetailsMode,
    visibility: next.visibility,
    allowWaitlist: next.allowWaitlist,
    category: next.category,
    updatedAt: new Date().toISOString(),
    updatedBy: actorId,
  };

  await ref.update(update);
  await syncMediaUsageReferenceForAssetChange({
    hubId: normalizedHubId,
    previousAssetId: existing.data()?.imageAssetId,
    nextAssetId: next.imageAssetId,
    usageRef: createMediaUsageReference({
      entityType: "event",
      entityId: normalizedEventId,
      field: "image",
      label: next.title || "Event image",
      href: "",
    }),
    updatedAt: update.updatedAt,
  });
  await refreshMemberActivityForEventChange(normalizedHubId, normalizedEventId, actorId, "event-update");
  await maintainDashboardProjectionsForEventChange(normalizedHubId, actorId, "event-update");
  return normalizeEventRecord({ id: normalizedEventId, hubId: normalizedHubId, ...existing.data(), ...update });
}

export async function deleteEventById(hubId, eventId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedEventId = normalizeString(eventId);

  if (!normalizedHubId || !normalizedEventId) {
    throw new Error("Hub and event ids are required.");
  }

  const db = getFirebaseAdminDb();
  const eventRef = db.collection("hubs").doc(normalizedHubId).collection("events").doc(normalizedEventId);
  const [existing, bookingSnapshot, legacyRegistrationSnapshot, bookerSnapshot] = await Promise.all([
    eventRef.get(),
    eventRef.collection("bookings").limit(1).get(),
    eventRef.collection("registrations").limit(1).get(),
    eventRef.collection("bookingBookers").get(),
  ]);

  if (!existing.exists) {
    throw new Error("Event not found.");
  }

  if (!bookingSnapshot.empty || !legacyRegistrationSnapshot.empty) {
    throw new Error("This event cannot be deleted because it already has registrations or bookings.");
  }

  const batch = db.batch();
  batch.delete(eventRef);
  bookerSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
  await removeMediaUsageReference({
    hubId: normalizedHubId,
    assetId: existing.data()?.imageAssetId,
    usageRef: createMediaUsageReference({
      entityType: "event",
      entityId: normalizedEventId,
      field: "image",
      label: normalizeString(existing.data()?.title) || "Event image",
      href: "",
    }),
  });
  await maintainDashboardProjectionsForEventChange(normalizedHubId, "event-delete", "event-delete");
}
