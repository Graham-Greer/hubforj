try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import crypto from "node:crypto";
import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import {
  buildRecurringEventOccurrenceSlug,
  generateEventSeriesOccurrenceSchedules,
} from "@/lib/domain/event-series";
import { normalizeString } from "@/lib/data/event-shared";

function normalizeInteger(value, fallback = 0) {
  const next = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(next) ? next : fallback;
}

function todayDateString(now = new Date()) {
  const value = now instanceof Date ? now : new Date(now);
  return value.toISOString().slice(0, 10);
}

function buildPreservedReasons(existingOccurrence, nextSeries) {
  const reasons = new Set(
    Array.isArray(existingOccurrence?.preservedReasons)
      ? existingOccurrence.preservedReasons.map((value) => normalizeString(value)).filter(Boolean)
      : []
  );

  if (normalizeString(existingOccurrence?.price) !== normalizeString(nextSeries?.price)) {
    reasons.add("pricing_locked_from_series_change");
  }

  if (normalizeString(existingOccurrence?.refundPolicy) !== normalizeString(nextSeries?.refundPolicy)) {
    reasons.add("refund_policy_preserved_due_to_existing_bookings");
  }

  return [...reasons];
}

function buildOccurrenceWriteModel(series, occurrence, now, actorId, existingOccurrence = null) {
  const activeAttendeeCount = normalizeInteger(existingOccurrence?.registeredAttendeeCount, 0);
  const hasBookings = activeAttendeeCount > 0 || normalizeInteger(existingOccurrence?.waitlistedAttendeeCount, 0) > 0;
  const capacity = hasBookings
    ? Math.max(normalizeInteger(series.capacity, 0), activeAttendeeCount)
    : normalizeInteger(series.capacity, 0);
  const preservedReasons = hasBookings ? buildPreservedReasons(existingOccurrence, series) : [];
  const preservesCommercialSettings = preservedReasons.length > 0;

  return {
    hubId: normalizeString(series.hubId),
    eventKind: "series_occurrence",
    seriesId: normalizeString(series.id),
    seriesSlugBase: normalizeString(series.slugBase),
    occurrenceDate: normalizeString(occurrence.occurrenceDate),
    occurrenceOrdinal: normalizeInteger(occurrence.occurrenceOrdinal, 0),
    isSeriesManaged: true,
    isSeriesPreserved: preservesCommercialSettings,
    preservedReasons,
    sourceSeriesUpdatedAt: normalizeString(series.updatedAt || now),
    seriesStatusSnapshot: normalizeString(series.status),
    recurrenceFrequencySnapshot: normalizeString(series.recurrenceFrequency),
    recurrenceIntervalSnapshot: normalizeInteger(series.recurrenceInterval, 1),
    slug: normalizeString(existingOccurrence?.slug),
    status: normalizeString(series.status),
    title: normalizeString(series.title),
    summary: normalizeString(series.summary),
    description: Array.isArray(series.description) ? series.description : [],
    imageAssetId: normalizeString(series.imageAssetId),
    imageAlt: normalizeString(series.imageAlt),
    startDate: normalizeString(occurrence.startDate),
    endDate: normalizeString(occurrence.endDate),
    startTime: normalizeString(occurrence.startTime),
    endTime: normalizeString(occurrence.endTime),
    startAt: normalizeString(occurrence.startAt),
    endAt: normalizeString(occurrence.endAt),
    location: normalizeString(series.location),
    capacity,
    pricingMode: preservesCommercialSettings
      ? normalizeString(existingOccurrence?.pricingMode) || normalizeString(series.pricingMode)
      : normalizeString(series.pricingMode),
    price: preservesCommercialSettings
      ? normalizeString(existingOccurrence?.price)
      : normalizeString(series.pricingMode) === "paid"
        ? normalizeString(series.price)
        : "",
    currency: preservesCommercialSettings
      ? normalizeString(existingOccurrence?.currency).toUpperCase() || normalizeString(series.currency).toUpperCase()
      : normalizeString(series.currency).toUpperCase(),
    externalPaymentUrl: preservesCommercialSettings
      ? normalizeString(existingOccurrence?.externalPaymentUrl)
      : normalizeString(series.externalPaymentUrl),
    paymentInstructions: preservesCommercialSettings
      ? normalizeString(existingOccurrence?.paymentInstructions)
      : normalizeString(series.paymentInstructions),
    refundWindowMode: preservesCommercialSettings
      ? normalizeString(existingOccurrence?.refundWindowMode)
      : normalizeString(series.refundWindowMode),
    refundWindowHours: preservesCommercialSettings
      ? normalizeInteger(existingOccurrence?.refundWindowHours, 48)
      : normalizeInteger(series.refundWindowHours, 48),
    refundPolicy: preservesCommercialSettings
      ? normalizeString(existingOccurrence?.refundPolicy)
      : normalizeString(series.refundPolicy),
    registrationEligibility: preservesCommercialSettings
      ? normalizeString(existingOccurrence?.registrationEligibility)
      : normalizeString(series.registrationEligibility),
    bookingMode: preservesCommercialSettings
      ? normalizeString(existingOccurrence?.bookingMode)
      : normalizeString(series.bookingMode),
    maxAttendeesPerBooking: preservesCommercialSettings
      ? normalizeInteger(existingOccurrence?.maxAttendeesPerBooking, 1)
      : normalizeInteger(series.maxAttendeesPerBooking, 1),
    guestDetailsMode: preservesCommercialSettings
      ? normalizeString(existingOccurrence?.guestDetailsMode)
      : normalizeString(series.guestDetailsMode),
    registeredAttendeeCount: normalizeInteger(existingOccurrence?.registeredAttendeeCount, 0),
    waitlistedAttendeeCount: normalizeInteger(existingOccurrence?.waitlistedAttendeeCount, 0),
    cancelledAttendeeCount: normalizeInteger(existingOccurrence?.cancelledAttendeeCount, 0),
    activeBookingCount: normalizeInteger(existingOccurrence?.activeBookingCount, 0),
    visibility: normalizeString(series.visibility),
    allowWaitlist: series.allowWaitlist !== false,
    category: normalizeString(series.category),
    createdAt: normalizeString(existingOccurrence?.createdAt) || now,
    updatedAt: now,
    createdBy: normalizeString(existingOccurrence?.createdBy) || normalizeString(actorId),
    updatedBy: normalizeString(actorId),
  };
}

export async function syncEventSeriesOccurrences(series, actorId = "system", options = {}) {
  const normalizedHubId = normalizeString(series?.hubId);
  const normalizedSeriesId = normalizeString(series?.id);

  if (!normalizedHubId || !normalizedSeriesId) {
    throw new Error("Hub id and series id are required to sync recurring event occurrences.");
  }

  const db = getFirebaseAdminDb();
  const now = normalizeString(options.now) || new Date().toISOString();
  const today = todayDateString(options.now ? new Date(options.now) : new Date());
  const plannedOccurrences = generateEventSeriesOccurrenceSchedules(series);
  const plannedByDate = new Map(plannedOccurrences.map((occurrence) => [occurrence.occurrenceDate, occurrence]));
  const eventsCollection = db.collection("hubs").doc(normalizedHubId).collection("events");
  const existingSeriesSnapshot = await eventsCollection.where("seriesId", "==", normalizedSeriesId).get();
  const existingSeriesOccurrences = existingSeriesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const existingByDate = new Map(
    existingSeriesOccurrences.map((occurrence) => [normalizeString(occurrence.occurrenceDate), occurrence])
  );
  const allEventsSnapshot = await eventsCollection.get();
  const usedSlugs = new Set(
    allEventsSnapshot.docs.map((doc) => normalizeString(doc.data()?.slug)).filter(Boolean)
  );
  const batch = db.batch();
  let createdCount = 0;
  let updatedCount = 0;
  let cancelledCount = 0;
  let preservedCount = 0;

  for (const occurrence of plannedOccurrences) {
    const existing = existingByDate.get(occurrence.occurrenceDate) || null;
    const writeModel = buildOccurrenceWriteModel(series, occurrence, now, actorId, existing);
    let targetRef = existing ? eventsCollection.doc(existing.id) : null;

    if (!existing) {
      let sequence = 1;
      let nextSlug = buildRecurringEventOccurrenceSlug(series.slugBase, occurrence.occurrenceDate, sequence);

      while (usedSlugs.has(nextSlug)) {
        sequence += 1;
        nextSlug = buildRecurringEventOccurrenceSlug(series.slugBase, occurrence.occurrenceDate, sequence);
      }

      usedSlugs.add(nextSlug);
      targetRef = eventsCollection.doc(`event_${crypto.randomUUID().slice(0, 12)}`);
      writeModel.slug = nextSlug;
      batch.set(targetRef, writeModel);
      createdCount += 1;
    } else {
      writeModel.slug = normalizeString(existing.slug);

      if (normalizeString(existing.occurrenceDate) >= today) {
        batch.set(targetRef, writeModel, { merge: true });
        updatedCount += 1;
      }

      if (writeModel.isSeriesPreserved) {
        preservedCount += 1;
      }
    }
  }

  for (const existing of existingSeriesOccurrences) {
    const occurrenceDate = normalizeString(existing.occurrenceDate);

    if (!occurrenceDate || plannedByDate.has(occurrenceDate) || occurrenceDate < today) {
      continue;
    }

    const hasOperationalCommitments =
      normalizeInteger(existing.registeredAttendeeCount, 0) > 0 ||
      normalizeInteger(existing.waitlistedAttendeeCount, 0) > 0 ||
      normalizeInteger(existing.activeBookingCount, 0) > 0;

    const ref = eventsCollection.doc(existing.id);

    if (hasOperationalCommitments) {
      const preservedReasons = new Set(
        Array.isArray(existing.preservedReasons)
          ? existing.preservedReasons.map((value) => normalizeString(value)).filter(Boolean)
          : []
      );
      preservedReasons.add("occurrence_retained_after_schedule_change");

      batch.set(
        ref,
        {
          isSeriesManaged: true,
          isSeriesPreserved: true,
          preservedReasons: [...preservedReasons],
          updatedAt: now,
          updatedBy: normalizeString(actorId),
        },
        { merge: true }
      );
      preservedCount += 1;
      continue;
    }

    batch.set(
      ref,
      {
        status: "cancelled",
        seriesStatusSnapshot: normalizeString(series.status),
        isSeriesManaged: true,
        updatedAt: now,
        updatedBy: normalizeString(actorId),
      },
      { merge: true }
    );
    cancelledCount += 1;
  }

  if (createdCount || updatedCount || cancelledCount) {
    batch.set(
      db.collection("hubs").doc(normalizedHubId).collection("eventSeries").doc(normalizedSeriesId),
      {
        generatedOccurrenceCount: plannedOccurrences.length,
        occurrenceGenerationWindowStartDate: normalizeString(series.recurrenceStartDate),
        occurrenceGenerationWindowEndDate: normalizeString(series.recurrenceUntilDate),
        updatedAt: now,
        updatedBy: normalizeString(actorId),
      },
      { merge: true }
    );
  }

  await batch.commit();

  return {
    totalPlannedOccurrences: plannedOccurrences.length,
    createdCount,
    updatedCount,
    cancelledCount,
    preservedCount,
  };
}
