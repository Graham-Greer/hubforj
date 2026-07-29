try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { buildEventSeriesSchedulePreview, normalizeEventSeriesTimezone } from "@/lib/domain/event-series";
import { getFallbackRegionalMarket } from "@/lib/domain/regional-markets";

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeInteger(value, fallback = 0) {
  const next = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(next) ? next : fallback;
}

export function normalizeEventSeriesRecord(series) {
  if (!series) {
    return null;
  }

  const record = {
    id: normalizeString(series.id),
    hubId: normalizeString(series.hubId),
    slugBase: normalizeString(series.slugBase),
    status: normalizeString(series.status) || "draft",
    title: normalizeString(series.title),
    summary: normalizeString(series.summary),
    description: Array.isArray(series.description) ? series.description : [],
    imageAssetId: normalizeString(series.imageAssetId),
    imageAlt: normalizeString(series.imageAlt),
    location: normalizeString(series.location),
    timezone: normalizeEventSeriesTimezone(series.timezone),
    category: normalizeString(series.category),
    visibility: normalizeString(series.visibility) || "public",
    allowWaitlist: series.allowWaitlist !== false,
    pricingMode: normalizeString(series.pricingMode) || "free",
    price: normalizeString(series.price),
    currency: normalizeString(series.currency).toUpperCase() || getFallbackRegionalMarket().defaultCurrency,
    externalPaymentUrl: normalizeString(series.externalPaymentUrl),
    paymentInstructions: normalizeString(series.paymentInstructions),
    refundWindowMode: normalizeString(series.refundWindowMode) || "default",
    refundWindowHours: normalizeInteger(series.refundWindowHours, 48),
    refundPolicy: normalizeString(series.refundPolicy) || "full_refund_before_window",
    registrationEligibility: normalizeString(series.registrationEligibility) || "members-only",
    bookingMode: normalizeString(series.bookingMode) || "single_attendee",
    maxAttendeesPerBooking: normalizeInteger(series.maxAttendeesPerBooking, 1),
    guestDetailsMode: normalizeString(series.guestDetailsMode) || "name_only",
    capacity: normalizeInteger(series.capacity, 0),
    recurrenceEnabled: series.recurrenceEnabled === true,
    recurrenceFrequency: normalizeString(series.recurrenceFrequency) || "weekly",
    recurrenceInterval: normalizeInteger(series.recurrenceInterval, 1),
    recurrenceStartDate: normalizeString(series.recurrenceStartDate),
    recurrenceUntilDate: normalizeString(series.recurrenceUntilDate),
    recurrenceDaysOfWeek: Array.isArray(series.recurrenceDaysOfWeek)
      ? series.recurrenceDaysOfWeek.map((value) => normalizeInteger(value, 0)).filter((value) => value >= 1 && value <= 7)
      : [],
    recurrenceDayOfMonth: normalizeInteger(series.recurrenceDayOfMonth, 1),
    startTime: normalizeString(series.startTime),
    endTime: normalizeString(series.endTime),
    occurrenceGenerationWindowStartDate: normalizeString(series.occurrenceGenerationWindowStartDate),
    occurrenceGenerationWindowEndDate: normalizeString(series.occurrenceGenerationWindowEndDate),
    generatedOccurrenceCount: normalizeInteger(series.generatedOccurrenceCount, 0),
    packageCountsAsScheduledOffering: series.packageCountsAsScheduledOffering !== false,
    createdAt: normalizeString(series.createdAt),
    updatedAt: normalizeString(series.updatedAt),
    createdBy: normalizeString(series.createdBy),
    updatedBy: normalizeString(series.updatedBy),
  };

  return {
    ...record,
    schedulePreview: buildEventSeriesSchedulePreview(record),
  };
}
