try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import crypto from "node:crypto";
import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { getHubById, getHubBySlug } from "@/lib/data/hubs";
import { assertHubCapability } from "@/lib/domain/package-guards";
import { normalizeCreateEventSeriesPayload } from "@/lib/domain/event-series";
import { getFallbackRegionalMarket } from "@/lib/domain/regional-markets";
import { normalizeEventSeriesRecord } from "./event-series-shared.js";
import { listEventSeriesOccurrences } from "./event-series-queries.js";
import { syncEventSeriesOccurrences } from "@/lib/server/event-series-generation.js";
import { maintainHubAdminOnboardingSummaryForSourceChange } from "./admin-onboarding-summary.js";
import { createMediaUsageReference, syncMediaUsageReferenceForAssetChange } from "./media-usage-projection.js";

function normalizeString(value) {
  return String(value || "").trim();
}

async function maintainDashboardProjectionsForEventSeriesChange(hubId, actorId, reason = "event-series-change") {
  try {
    const { maintainHubAdminDashboardProjectionsByHubId } = await import("./hub-dashboard-stats.js");
    return maintainHubAdminDashboardProjectionsByHubId(hubId, actorId, { reason });
  } catch (error) {
    console.warn("Unable to start dashboard projection maintenance after event series change", {
      hubId: normalizeString(hubId),
      actorId: normalizeString(actorId) || "system",
      reason,
      error: String(error?.message || "Unable to maintain dashboard projections."),
    });
    return null;
  }
}

async function maintainAdminOnboardingSummaryForEventSeriesChange(hubId, actorId, reason = "event-series-change") {
  return maintainHubAdminOnboardingSummaryForSourceChange(hubId, actorId, { reason });
}

async function assertUniqueEventSeriesSlugBase(hubId, slugBase, excludeSeriesId = "") {
  const normalizedHubId = normalizeString(hubId);
  const normalizedSlugBase = normalizeString(slugBase);

  if (!normalizedHubId || !normalizedSlugBase) {
    throw new Error("Recurring event slug base is required.");
  }

  const snapshot = await getFirebaseAdminDb()
    .collection("hubs")
    .doc(normalizedHubId)
    .collection("eventSeries")
    .where("slugBase", "==", normalizedSlugBase)
    .limit(1)
    .get();

  if (!snapshot.empty && snapshot.docs.some((doc) => doc.id !== excludeSeriesId)) {
    throw new Error("A recurring event series with this slug base already exists for this hub.");
  }
}

function buildSeriesWriteModel(hub, payload, actorId, now, existingSeries = null) {
  const next = normalizeCreateEventSeriesPayload(payload, {
    hubTimezone: normalizeString(hub?.timezone) || getFallbackRegionalMarket().defaultTimezone,
  });

  return {
    hubId: hub.id,
    slugBase: next.slugBase,
    status: next.status,
    title: next.title,
    summary: next.summary,
    description: next.description,
    imageAssetId: next.imageAssetId,
    imageAlt: next.imageAlt,
    location: next.location,
    timezone: next.timezone,
    category: next.category,
    visibility: next.visibility,
    allowWaitlist: next.allowWaitlist,
    pricingMode: next.pricingMode,
    price: next.pricingMode === "paid" ? next.price : "",
    currency: next.currency,
    externalPaymentUrl: next.externalPaymentUrl,
    paymentInstructions: next.paymentInstructions,
    refundWindowMode: next.refundWindowMode,
    refundWindowHours: next.refundWindowHours,
    refundPolicy: next.refundPolicy,
    registrationEligibility: next.registrationEligibility,
    bookingMode: next.bookingMode,
    maxAttendeesPerBooking: next.maxAttendeesPerBooking,
    guestDetailsMode: next.guestDetailsMode,
    capacity: next.capacity,
    recurrenceEnabled: true,
    recurrenceFrequency: next.recurrenceFrequency,
    recurrenceInterval: next.recurrenceInterval,
    recurrenceStartDate: next.recurrenceStartDate,
    recurrenceUntilDate: next.recurrenceUntilDate,
    recurrenceDaysOfWeek: next.recurrenceDaysOfWeek,
    recurrenceDayOfMonth: next.recurrenceDayOfMonth,
    startTime: next.startTime,
    endTime: next.endTime,
    occurrenceGenerationWindowStartDate: next.occurrenceGenerationWindowStartDate,
    occurrenceGenerationWindowEndDate: next.occurrenceGenerationWindowEndDate,
    generatedOccurrenceCount: Number.parseInt(String(existingSeries?.generatedOccurrenceCount || "0"), 10) || 0,
    packageCountsAsScheduledOffering: true,
    createdAt: normalizeString(existingSeries?.createdAt) || now,
    updatedAt: now,
    createdBy: normalizeString(existingSeries?.createdBy) || normalizeString(actorId),
    updatedBy: normalizeString(actorId),
  };
}

export async function createEventSeriesByHubSlug(hubSlug, payload, actorId = "system") {
  const hub = await getHubBySlug(hubSlug);

  if (!hub) {
    throw new Error("Hub not found.");
  }

  assertHubCapability(hub, "recurringEventsEnabled", "Recurring events are not available on the current package.");

  const now = new Date().toISOString();
  const writeModel = buildSeriesWriteModel(hub, payload, actorId, now);
  await assertUniqueEventSeriesSlugBase(hub.id, writeModel.slugBase);

  const ref = getFirebaseAdminDb()
    .collection("hubs")
    .doc(hub.id)
    .collection("eventSeries")
    .doc(`series_${crypto.randomUUID().slice(0, 12)}`);

  await ref.set(writeModel);
  await syncMediaUsageReferenceForAssetChange({
    hubId: hub.id,
    previousAssetId: "",
    nextAssetId: writeModel.imageAssetId,
    usageRef: createMediaUsageReference({
      entityType: "eventSeries",
      entityId: ref.id,
      field: "image",
      label: writeModel.title || "Event series image",
      href: "",
    }),
    updatedAt: now,
  });

  const record = normalizeEventSeriesRecord({
    id: ref.id,
    ...writeModel,
  });
  const sync = await syncEventSeriesOccurrences(record, actorId, { now });
  const occurrences = await listEventSeriesOccurrences(hub.id, ref.id);
  await maintainAdminOnboardingSummaryForEventSeriesChange(hub.id, actorId, "event-series-create");
  await maintainDashboardProjectionsForEventSeriesChange(hub.id, actorId, "event-series-create");

  return {
    ...record,
    sync,
    firstOccurrenceId: occurrences[0]?.id || "",
    occurrences,
  };
}

export async function updateEventSeriesById(hubId, seriesId, payload, actorId = "system") {
  const normalizedHubId = normalizeString(hubId);
  const normalizedSeriesId = normalizeString(seriesId);

  if (!normalizedHubId || !normalizedSeriesId) {
    throw new Error("Hub and recurring event series ids are required.");
  }

  const [hub, existingSeriesDoc] = await Promise.all([
    getHubById(normalizedHubId),
    getFirebaseAdminDb()
      .collection("hubs")
      .doc(normalizedHubId)
      .collection("eventSeries")
      .doc(normalizedSeriesId)
      .get(),
  ]);

  if (!hub) {
    throw new Error("Hub not found.");
  }

  if (!existingSeriesDoc.exists) {
    throw new Error("Recurring event series not found.");
  }

  assertHubCapability(hub, "recurringEventsEnabled", "Recurring events are not available on the current package.");

  const now = new Date().toISOString();
  const existingSeries = { id: existingSeriesDoc.id, hubId: normalizedHubId, ...existingSeriesDoc.data() };
  const writeModel = buildSeriesWriteModel(hub, payload, actorId, now, existingSeries);
  await assertUniqueEventSeriesSlugBase(normalizedHubId, writeModel.slugBase, normalizedSeriesId);

  await existingSeriesDoc.ref.set(writeModel, { merge: true });
  await syncMediaUsageReferenceForAssetChange({
    hubId: normalizedHubId,
    previousAssetId: existingSeries.imageAssetId,
    nextAssetId: writeModel.imageAssetId,
    usageRef: createMediaUsageReference({
      entityType: "eventSeries",
      entityId: normalizedSeriesId,
      field: "image",
      label: writeModel.title || "Event series image",
      href: "",
    }),
    updatedAt: now,
  });

  const record = normalizeEventSeriesRecord({
    ...existingSeries,
    ...writeModel,
    id: normalizedSeriesId,
  });
  const sync = await syncEventSeriesOccurrences(record, actorId, { now });
  const occurrences = await listEventSeriesOccurrences(normalizedHubId, normalizedSeriesId);
  await maintainAdminOnboardingSummaryForEventSeriesChange(normalizedHubId, actorId, "event-series-update");
  await maintainDashboardProjectionsForEventSeriesChange(normalizedHubId, actorId, "event-series-update");

  return {
    ...record,
    sync,
    firstOccurrenceId: occurrences[0]?.id || "",
    occurrences,
  };
}
