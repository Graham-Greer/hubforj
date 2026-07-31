try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getMediaAssetsByIds, getPublicMediaAssetsByIds } from "@/lib/data/media";
import {
  deriveEventScheduleFromLegacyTimestamps,
  deriveEventTimestamps,
  normalizeEventCurrency,
  normalizeEventRefundPolicy,
  normalizeEventRefundWindowHours,
  normalizeEventRefundWindowMode,
  normalizeEventInteger,
} from "@/lib/domain/events";
import { resolveEventBookingConfiguration } from "@/lib/domain/event-bookings";
import { coerceSectionRichTextInput } from "@/lib/domain/section-rich-text";

export function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeBoolean(value, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }

  const normalized = normalizeString(value).toLowerCase();

  if (normalized === "true") {
    return true;
  }

  if (normalized === "false") {
    return false;
  }

  return fallback;
}

export function normalizeEventRecord(event) {
  if (!event) {
    return null;
  }

  const legacySchedule = deriveEventScheduleFromLegacyTimestamps(event.startAt, event.endAt);
  const startDate = normalizeString(event.startDate) || legacySchedule.startDate;
  const endDate = normalizeString(event.endDate) || legacySchedule.endDate || startDate;
  const startTime = normalizeString(event.startTime) || legacySchedule.startTime;
  const endTime = normalizeString(event.endTime) || legacySchedule.endTime;
  const derivedTimestamps = deriveEventTimestamps({
    startDate,
    endDate,
    startTime,
    endTime,
  });

  const bookingConfiguration = resolveEventBookingConfiguration(event);

  return {
    id: normalizeString(event.id),
    hubId: normalizeString(event.hubId),
    slug: normalizeString(event.slug),
    eventKind: normalizeString(event.eventKind) || "single",
    seriesId: normalizeString(event.seriesId),
    seriesSlugBase: normalizeString(event.seriesSlugBase),
    occurrenceDate: normalizeString(event.occurrenceDate),
    occurrenceOrdinal: normalizeEventInteger(event.occurrenceOrdinal, 0),
    isSeriesManaged: event.isSeriesManaged === true,
    isSeriesPreserved: event.isSeriesPreserved === true,
    preservedReasons: Array.isArray(event.preservedReasons)
      ? event.preservedReasons.map((value) => normalizeString(value)).filter(Boolean)
      : [],
    sourceSeriesUpdatedAt: normalizeString(event.sourceSeriesUpdatedAt),
    seriesStatusSnapshot: normalizeString(event.seriesStatusSnapshot),
    recurrenceFrequencySnapshot: normalizeString(event.recurrenceFrequencySnapshot),
    recurrenceIntervalSnapshot: normalizeEventInteger(event.recurrenceIntervalSnapshot, 0),
    status: normalizeString(event.status) || "draft",
    title: normalizeString(event.title),
    summary: normalizeString(event.summary),
    description: coerceSectionRichTextInput(event.description),
    imageAssetId: normalizeString(event.imageAssetId),
    imageAlt: normalizeString(event.imageAlt),
    location: normalizeString(event.location),
    startDate,
    endDate,
    startTime,
    endTime,
    startAt: normalizeString(event.startAt) || derivedTimestamps.startAt,
    endAt: normalizeString(event.endAt) || derivedTimestamps.endAt,
    capacity: normalizeEventInteger(event.capacity, 0),
    pricingMode: normalizeString(event.pricingMode) || "free",
    price: normalizeString(event.price),
    currency: normalizeEventCurrency(event.currency),
    externalPaymentUrl: normalizeString(event.externalPaymentUrl),
    paymentInstructions: normalizeString(event.paymentInstructions),
    refundWindowMode: normalizeEventRefundWindowMode(event.refundWindowMode),
    refundWindowHours: normalizeEventRefundWindowHours(event.refundWindowHours),
    refundPolicy: normalizeEventRefundPolicy(event.refundPolicy),
    registrationEligibility: bookingConfiguration.registrationEligibility,
    bookingMode: bookingConfiguration.bookingMode,
    maxAttendeesPerBooking: bookingConfiguration.maxAttendeesPerBooking,
    guestDetailsMode: bookingConfiguration.guestDetailsMode,
    registeredAttendeeCount: normalizeEventInteger(event.registeredAttendeeCount, 0),
    waitlistedAttendeeCount: normalizeEventInteger(event.waitlistedAttendeeCount, 0),
    cancelledAttendeeCount: normalizeEventInteger(event.cancelledAttendeeCount, 0),
    activeBookingCount: normalizeEventInteger(event.activeBookingCount, 0),
    visibility: normalizeString(event.visibility) || "public",
    allowWaitlist: normalizeBoolean(event.allowWaitlist, true),
    category: normalizeString(event.category) || "Workshop",
    createdAt: normalizeString(event.createdAt),
    updatedAt: normalizeString(event.updatedAt),
  };
}

export function attachEventMedia(events, assets) {
  const byId = new Map(assets.map((asset) => [asset.id, asset]));

  return events.map((event) => ({
    ...event,
    imageAsset: event.imageAssetId ? byId.get(event.imageAssetId) || null : null,
  }));
}

export async function withEventMedia(hubId, events) {
  const assetIds = [...new Set(events.map((event) => event.imageAssetId).filter(Boolean))];
  const assets = await getMediaAssetsByIds(hubId, assetIds);
  return attachEventMedia(events, assets);
}

export async function withPublicEventMedia(hubId, events) {
  const assetIds = [...new Set(events.map((event) => event.imageAssetId).filter(Boolean))];
  const assets = await getPublicMediaAssetsByIds(hubId, assetIds);
  return attachEventMedia(events, assets);
}
