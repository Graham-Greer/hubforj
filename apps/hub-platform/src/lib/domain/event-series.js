import { normalizeCreateEventPayload, normalizeEventSlug, deriveEventTimestamps } from "@/lib/domain/events";
import { getFallbackRegionalMarket } from "@/lib/domain/regional-markets";

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeInteger(value, fallback = 1) {
  const next = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(next) ? next : fallback;
}

function isValidDateString(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(normalizeString(value));
}

function parseDateUtc(value) {
  const normalized = normalizeString(value);

  if (!isValidDateString(normalized)) {
    return null;
  }

  const date = new Date(`${normalized}T12:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateUtc(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function addUtcDays(date, days) {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function addUtcMonths(date, months) {
  const next = new Date(date.getTime());
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
}

function monthHasDay(year, zeroIndexedMonth, dayOfMonth) {
  const probe = new Date(Date.UTC(year, zeroIndexedMonth, dayOfMonth, 12, 0, 0, 0));
  return probe.getUTCFullYear() === year && probe.getUTCMonth() === zeroIndexedMonth && probe.getUTCDate() === dayOfMonth;
}

function toMondayIndexedWeekday(date) {
  const weekday = date.getUTCDay();
  return weekday === 0 ? 7 : weekday;
}

export const recurringEventFrequencyOptions = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export const recurringEventWeekdayOptions = [
  { value: "1", label: "Mon" },
  { value: "2", label: "Tue" },
  { value: "3", label: "Wed" },
  { value: "4", label: "Thu" },
  { value: "5", label: "Fri" },
  { value: "6", label: "Sat" },
  { value: "7", label: "Sun" },
];

export function normalizeRecurringEventFrequency(value, fallback = "weekly") {
  const normalized = normalizeString(value).toLowerCase();
  return new Set(["daily", "weekly", "monthly"]).has(normalized) ? normalized : fallback;
}

export function normalizeRecurringEventInterval(value, fallback = 1) {
  const next = normalizeInteger(value, fallback);
  return next > 0 ? next : fallback;
}

export function normalizeRecurringEventWeekdays(values = []) {
  const input = Array.isArray(values)
    ? values
    : normalizeString(values)
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

  return [...new Set(input.map((value) => normalizeInteger(value, 0)).filter((value) => value >= 1 && value <= 7))].sort(
    (left, right) => left - right
  );
}

export function normalizeRecurringEventDayOfMonth(value, fallback = 1) {
  const next = normalizeInteger(value, fallback);
  return next >= 1 && next <= 31 ? next : fallback;
}

export function normalizeEventSeriesTimezone(value, fallback = getFallbackRegionalMarket().defaultTimezone) {
  return normalizeString(value) || fallback;
}

export function normalizeEventSeriesSlugBase(value, fallbackTitle = "") {
  return normalizeEventSlug(value || fallbackTitle);
}

export function normalizeCreateEventSeriesPayload(payload = {}, options = {}) {
  const frequency = normalizeRecurringEventFrequency(payload.recurrenceFrequency);
  const interval = normalizeRecurringEventInterval(payload.recurrenceInterval, 1);
  const recurrenceStartDate = normalizeString(payload.recurrenceStartDate || payload.startDate);
  const recurrenceUntilDate = normalizeString(payload.recurrenceUntilDate || payload.untilDate);
  const recurrenceDaysOfWeek = normalizeRecurringEventWeekdays(payload.recurrenceDaysOfWeek);
  const recurrenceDayOfMonth = normalizeRecurringEventDayOfMonth(
    payload.recurrenceDayOfMonth,
    parseDateUtc(recurrenceStartDate)?.getUTCDate() || 1
  );
  const timezone = normalizeEventSeriesTimezone(payload.timezone, options.hubTimezone || getFallbackRegionalMarket().defaultTimezone);
  const baseEvent = normalizeCreateEventPayload({
    ...payload,
    startDate: recurrenceStartDate,
    endDate: recurrenceStartDate,
  });
  const slugBase = normalizeEventSeriesSlugBase(payload.slugBase || payload.slug || baseEvent.slug, baseEvent.title);
  const startDate = parseDateUtc(recurrenceStartDate);
  const untilDate = parseDateUtc(recurrenceUntilDate);

  if (!recurrenceStartDate || !startDate) {
    throw new Error("Recurring event start date is required.");
  }

  if (!recurrenceUntilDate || !untilDate) {
    throw new Error("Recurring event until date is required.");
  }

  if (untilDate.getTime() < startDate.getTime()) {
    throw new Error("Recurring event until date must be on or after the start date.");
  }

  const maxUntilDate = addUtcDays(startDate, 184);

  if (untilDate.getTime() > maxUntilDate.getTime()) {
    throw new Error("Recurring event until date cannot be more than 6 months after the start date.");
  }

  if (frequency === "weekly" && recurrenceDaysOfWeek.length === 0) {
    throw new Error("Weekly recurring events require at least one weekday.");
  }

  if (frequency === "monthly" && (recurrenceDayOfMonth < 1 || recurrenceDayOfMonth > 31)) {
    throw new Error("Monthly recurring events require a valid day of month.");
  }

  return {
    slugBase,
    status: baseEvent.status,
    title: baseEvent.title,
    summary: baseEvent.summary,
    description: baseEvent.description,
    imageAssetId: baseEvent.imageAssetId,
    imageAlt: baseEvent.imageAlt,
    location: baseEvent.location,
    timezone,
    category: baseEvent.category,
    visibility: baseEvent.visibility,
    allowWaitlist: baseEvent.allowWaitlist,
    pricingMode: baseEvent.pricingMode,
    price: baseEvent.price,
    currency: baseEvent.currency,
    externalPaymentUrl: baseEvent.externalPaymentUrl,
    paymentInstructions: baseEvent.paymentInstructions,
    refundWindowMode: baseEvent.refundWindowMode,
    refundWindowHours: baseEvent.refundWindowHours,
    refundPolicy: baseEvent.refundPolicy,
    registrationEligibility: baseEvent.registrationEligibility,
    bookingMode: baseEvent.bookingMode,
    maxAttendeesPerBooking: baseEvent.maxAttendeesPerBooking,
    guestDetailsMode: baseEvent.guestDetailsMode,
    capacity: baseEvent.capacity,
    recurrenceEnabled: true,
    recurrenceFrequency: frequency,
    recurrenceInterval: interval,
    recurrenceStartDate,
    recurrenceUntilDate,
    recurrenceDaysOfWeek,
    recurrenceDayOfMonth,
    startTime: baseEvent.startTime,
    endTime: baseEvent.endTime,
    occurrenceGenerationWindowStartDate: recurrenceStartDate,
    occurrenceGenerationWindowEndDate: recurrenceUntilDate,
  };
}

export function buildRecurringEventOccurrenceSlug(slugBase, occurrenceDate, sequence = 1) {
  const base = normalizeEventSeriesSlugBase(slugBase);
  const date = normalizeString(occurrenceDate);
  const stem = `${base}-${date}`.replace(/-+/g, "-").replace(/^-+|-+$/g, "");

  if (sequence <= 1) {
    return stem;
  }

  return `${stem}-${sequence}`;
}

export function generateEventSeriesOccurrenceSchedules(series = {}) {
  const frequency = normalizeRecurringEventFrequency(series.recurrenceFrequency);
  const interval = normalizeRecurringEventInterval(series.recurrenceInterval, 1);
  const startDate = parseDateUtc(series.recurrenceStartDate);
  const untilDate = parseDateUtc(series.recurrenceUntilDate);
  const weekdays = normalizeRecurringEventWeekdays(series.recurrenceDaysOfWeek);
  const dayOfMonth = normalizeRecurringEventDayOfMonth(series.recurrenceDayOfMonth, startDate?.getUTCDate() || 1);
  const startTime = normalizeString(series.startTime);
  const endTime = normalizeString(series.endTime);

  if (!startDate || !untilDate) {
    return [];
  }

  const occurrences = [];

  if (frequency === "daily") {
    let cursor = new Date(startDate.getTime());
    let ordinal = 1;

    while (cursor.getTime() <= untilDate.getTime()) {
      const occurrenceDate = formatDateUtc(cursor);
      const timestamps = deriveEventTimestamps({
        startDate: occurrenceDate,
        endDate: occurrenceDate,
        startTime,
        endTime,
      });

      occurrences.push({
        occurrenceDate,
        occurrenceOrdinal: ordinal,
        startDate: occurrenceDate,
        endDate: occurrenceDate,
        startTime,
        endTime,
        ...timestamps,
      });

      cursor = addUtcDays(cursor, interval);
      ordinal += 1;
    }

    return occurrences;
  }

  if (frequency === "weekly") {
    let cursor = new Date(startDate.getTime());
    let ordinal = 1;

    while (cursor.getTime() <= untilDate.getTime()) {
      const diffDays = Math.floor((cursor.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
      const weekIndex = Math.floor(diffDays / 7);
      const weekday = toMondayIndexedWeekday(cursor);

      if (weekIndex % interval === 0 && weekdays.includes(weekday)) {
        const occurrenceDate = formatDateUtc(cursor);
        const timestamps = deriveEventTimestamps({
          startDate: occurrenceDate,
          endDate: occurrenceDate,
          startTime,
          endTime,
        });

        occurrences.push({
          occurrenceDate,
          occurrenceOrdinal: ordinal,
          startDate: occurrenceDate,
          endDate: occurrenceDate,
          startTime,
          endTime,
          ...timestamps,
        });
        ordinal += 1;
      }

      cursor = addUtcDays(cursor, 1);
    }

    return occurrences;
  }

  let monthCursor = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), 1, 12, 0, 0, 0));
  let ordinal = 1;

  while (monthCursor.getTime() <= untilDate.getTime()) {
    const year = monthCursor.getUTCFullYear();
    const month = monthCursor.getUTCMonth();

    if (monthHasDay(year, month, dayOfMonth)) {
      const occurrenceDate = formatDateUtc(new Date(Date.UTC(year, month, dayOfMonth, 12, 0, 0, 0)));
      const occurrence = parseDateUtc(occurrenceDate);

      if (
        occurrence &&
        occurrence.getTime() >= startDate.getTime() &&
        occurrence.getTime() <= untilDate.getTime()
      ) {
        const timestamps = deriveEventTimestamps({
          startDate: occurrenceDate,
          endDate: occurrenceDate,
          startTime,
          endTime,
        });

        occurrences.push({
          occurrenceDate,
          occurrenceOrdinal: ordinal,
          startDate: occurrenceDate,
          endDate: occurrenceDate,
          startTime,
          endTime,
          ...timestamps,
        });
        ordinal += 1;
      }
    }

    monthCursor = addUtcMonths(monthCursor, interval);
  }

  return occurrences;
}

export function buildEventSeriesSchedulePreview(series = {}, options = {}) {
  const occurrences = generateEventSeriesOccurrenceSchedules(series);
  const previewCount = normalizeInteger(options.previewCount, 5);

  return {
    totalOccurrences: occurrences.length,
    firstOccurrenceDate: occurrences[0]?.occurrenceDate || "",
    lastOccurrenceDate: occurrences[occurrences.length - 1]?.occurrenceDate || "",
    previewDates: occurrences.slice(0, previewCount).map((occurrence) => occurrence.occurrenceDate),
  };
}
