import {
  hasSectionRichTextContent,
  parseSectionRichTextInput,
} from "@/lib/domain/section-rich-text";
import {
  normalizeOfferingPaymentConfiguration,
  resolveOfferingPaymentConfiguration,
} from "@/lib/domain/offering-payments";
import {
  normalizeEventRegistrationEligibility,
  resolveEventBookingConfiguration,
} from "@/lib/domain/event-bookings";
import { formatMoney } from "@/lib/domain/memberships";
import {
  getFallbackRegionalMarket,
  resolveLaunchFormattingLocale,
} from "@/lib/domain/regional-markets";

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeAssetId(value) {
  return normalizeString(value);
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

function isValidDateString(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidTimeString(value) {
  return /^\d{2}:\d{2}$/.test(value);
}

function parseDateString(value) {
  const normalized = normalizeString(value);

  if (!isValidDateString(normalized)) {
    return null;
  }

  const date = new Date(`${normalized}T00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseTimeStringToMinutes(value) {
  const normalized = normalizeString(value);

  if (!isValidTimeString(normalized)) {
    return null;
  }

  const [hours, minutes] = normalized.split(":").map(Number);
  return (hours * 60) + minutes;
}

export function normalizeEventSlug(value) {
  return normalizeString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeEventInteger(value, fallback = 0) {
  const next = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(next) ? next : fallback;
}

export function normalizeEventCurrency(value) {
  return normalizeString(value).toUpperCase() || getFallbackRegionalMarket().defaultCurrency;
}

function parseIsoDate(value) {
  const normalized = normalizeString(value);
  if (!normalized) {
    return null;
  }

  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function resolveEventVisibilityTimestamp(event) {
  return parseIsoDate(event?.endAt) || parseIsoDate(event?.startAt);
}

export function isActiveUpcomingPublishedEvent(event, now = new Date()) {
  if (!event || normalizeString(event.status) !== "published") {
    return false;
  }

  const startAt = resolveEventVisibilityTimestamp(event);

  if (!startAt) {
    return false;
  }

  const reference = now instanceof Date ? now : new Date(now);

  if (Number.isNaN(reference.getTime())) {
    return false;
  }

  return startAt.getTime() >= reference.getTime();
}

export function deriveEventScheduleFromLegacyTimestamps(startAt, endAt) {
  const normalizedStartAt = normalizeString(startAt);
  const normalizedEndAt = normalizeString(endAt);

  const [startDatePart = "", startTimePartRaw = ""] = normalizedStartAt.split("T");
  const [endDatePart = "", endTimePartRaw = ""] = normalizedEndAt.split("T");
  const startTimePart = startTimePartRaw.slice(0, 5);
  const endTimePart = endTimePartRaw.slice(0, 5);

  if (!isValidDateString(startDatePart)) {
    return {
      startDate: "",
      endDate: "",
      startTime: "",
      endTime: "",
    };
  }

  return {
    startDate: startDatePart,
    endDate: isValidDateString(endDatePart) ? endDatePart : startDatePart,
    startTime: isValidTimeString(startTimePart) ? startTimePart : "",
    endTime: isValidTimeString(endTimePart) ? endTimePart : "",
  };
}

export function deriveEventTimestamps({
  startDate = "",
  endDate = "",
  startTime = "",
  endTime = "",
}) {
  const normalizedStartDate = normalizeString(startDate);
  const normalizedEndDate = normalizeString(endDate) || normalizedStartDate;
  const normalizedStartTime = normalizeString(startTime);
  const normalizedEndTime = normalizeString(endTime);

  if (!normalizedStartDate) {
    return {
      startAt: "",
      endAt: "",
    };
  }

  const startAt = `${normalizedStartDate}T${normalizedStartTime || "00:00"}`;
  const resolvedEndTime = normalizedEndTime || normalizedStartTime || "23:59";
  const endAt = `${normalizedEndDate}T${resolvedEndTime}`;

  return { startAt, endAt };
}

function resolveEventScheduleInput(input, legacyEndAt = "") {
  if (input && typeof input === "object" && !Array.isArray(input)) {
    const startDate = normalizeString(input.startDate);
    const endDate = normalizeString(input.endDate) || startDate;
    const startTime = normalizeString(input.startTime);
    const endTime = normalizeString(input.endTime);
    const derived = deriveEventTimestamps({ startDate, endDate, startTime, endTime });

    return {
      startDate,
      endDate,
      startTime,
      endTime,
      startAt: derived.startAt,
      endAt: derived.endAt,
    };
  }

  const derived = deriveEventScheduleFromLegacyTimestamps(input, legacyEndAt);
  const timestamps = deriveEventTimestamps(derived);

  return {
    ...derived,
    ...timestamps,
  };
}

export const eventStatusLabels = {
  draft: "Draft",
  published: "Published",
  cancelled: "Cancelled",
};

export const eventStatusTones = {
  draft: "warning",
  published: "success",
  cancelled: "danger",
};

export const eventCategoryOptions = [
  { value: "Class / Training", label: "Class / Training" },
  { value: "Workshop", label: "Workshop" },
  { value: "Meet up", label: "Meet up" },
  { value: "Social / Gathering", label: "Social / Gathering" },
  { value: "Competition / Match", label: "Competition / Match" },
  { value: "Outreach / Community Service", label: "Outreach / Community Service" },
  { value: "Special Event", label: "Special Event" },
];

export const eventVisibilityOptions = [
  { value: "public", label: "Public" },
  { value: "members-only", label: "Members only" },
];

export const eventRefundWindowModeOptions = [
  { value: "default", label: "Use hub default" },
  { value: "custom", label: "Set event-specific window" },
];

export const eventRefundPolicyOptions = [
  { value: "full_refund_before_window", label: "Full refund before cutoff" },
  { value: "non_refundable", label: "Non-refundable" },
];

export function normalizeEventRefundWindowMode(value) {
  const normalized = normalizeString(value).toLowerCase();
  return normalized === "custom" ? "custom" : "default";
}

export function normalizeEventRefundPolicy(value) {
  const normalized = normalizeString(value).toLowerCase();
  return normalized === "non_refundable" ? "non_refundable" : "full_refund_before_window";
}

export function normalizeEventRefundWindowHours(value, fallback = 48) {
  const next = Number.parseInt(String(value || ""), 10);

  if (!Number.isFinite(next) || next <= 0) {
    return fallback;
  }

  return next;
}

export function resolveEventRefundWindowHours(event, fallback = 48) {
  const refundWindowMode = normalizeEventRefundWindowMode(event?.refundWindowMode);

  if (refundWindowMode === "custom") {
    return normalizeEventRefundWindowHours(event?.refundWindowHours, fallback);
  }

  return fallback;
}

export function resolveEventRefundCutoffAt(event, fallbackHours = 48) {
  const startAt = parseIsoDate(event?.startAt);

  if (!startAt) {
    return null;
  }

  const refundWindowHours = resolveEventRefundWindowHours(event, fallbackHours);
  return new Date(startAt.getTime() - (refundWindowHours * 60 * 60 * 1000));
}

export function evaluateEventRefundEligibility(event, options = {}) {
  const paymentStatus = normalizeString(options.paymentStatus) || "paid";
  const refundPolicy = normalizeEventRefundPolicy(event?.refundPolicy);
  const refundWindowHours = resolveEventRefundWindowHours(event, 48);
  const startAt = parseIsoDate(event?.startAt);
  const cutoffAt = resolveEventRefundCutoffAt(event, 48);
  const now = options.now instanceof Date ? options.now : new Date(options.now || Date.now());

  if (
    normalizeString(event?.pricingMode) !== "paid" ||
    !new Set(["paid", "partially_refunded"]).has(paymentStatus)
  ) {
    return {
      refundable: false,
      reason: "payment_not_refundable",
      refundPolicy,
      refundWindowHours,
      cutoffAt,
      startAt,
    };
  }

  if (refundPolicy === "non_refundable") {
    return {
      refundable: false,
      reason: "policy_non_refundable",
      refundPolicy,
      refundWindowHours,
      cutoffAt,
      startAt,
    };
  }

  if (!startAt || Number.isNaN(now.getTime())) {
    return {
      refundable: false,
      reason: "timing_unavailable",
      refundPolicy,
      refundWindowHours,
      cutoffAt,
      startAt,
    };
  }

  if (now.getTime() >= startAt.getTime()) {
    return {
      refundable: false,
      reason: "event_started",
      refundPolicy,
      refundWindowHours,
      cutoffAt,
      startAt,
    };
  }

  const refundable = !cutoffAt || now.getTime() <= cutoffAt.getTime();

  return {
    refundable,
    reason: refundable ? "before_cutoff" : "outside_refund_window",
    refundPolicy,
    refundWindowHours,
    cutoffAt,
    startAt,
  };
}

export function getEventStatusLabel(status) {
  return eventStatusLabels[normalizeString(status)] || "Unknown";
}

export function getEventStatusTone(status) {
  return eventStatusTones[normalizeString(status)] || "neutral";
}

export function formatEventDateRange(
  eventOrStartAt,
  endAtOrLocale = getFallbackRegionalMarket().defaultLocale,
  localeArg
) {
  const locale =
    typeof eventOrStartAt === "object" && eventOrStartAt !== null
      ? (endAtOrLocale || getFallbackRegionalMarket().defaultLocale)
      : (localeArg || getFallbackRegionalMarket().defaultLocale);
  const resolvedLocale = resolveLaunchFormattingLocale(locale);
  const schedule =
    typeof eventOrStartAt === "object" && eventOrStartAt !== null
      ? resolveEventScheduleInput(eventOrStartAt)
      : resolveEventScheduleInput(eventOrStartAt, endAtOrLocale);
  const startDate = parseDateString(schedule.startDate);
  const endDate = parseDateString(schedule.endDate || schedule.startDate);

  if (!startDate) {
    return "Date to be confirmed";
  }

  const sameDay = !endDate || startDate.toDateString() === endDate.toDateString();
  const dateFormatter = new Intl.DateTimeFormat(resolvedLocale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  if (!schedule.startTime) {
    if (sameDay) {
      return dateFormatter.format(startDate);
    }

    return `${dateFormatter.format(startDate)} - ${dateFormatter.format(endDate)}`;
  }

  const startTime = schedule.startTime;
  const endTime = normalizeString(schedule.endTime);

  if (sameDay) {
    if (endTime) {
      return `${dateFormatter.format(startDate)} • ${startTime} - ${endTime}`;
    }

    return `${dateFormatter.format(startDate)} • ${startTime}`;
  }

  if (endTime) {
    return `${dateFormatter.format(startDate)} - ${dateFormatter.format(endDate)} • ${startTime} - ${endTime}`;
  }

  return `${dateFormatter.format(startDate)} - ${dateFormatter.format(endDate)} • ${startTime}`;
}

export function formatEventPrice(event, locale = getFallbackRegionalMarket().defaultLocale) {
  if (!event || normalizeString(event.pricingMode) !== "paid") {
    return "Free";
  }

  const rawPrice = Number.parseFloat(normalizeString(event.price));
  const currency = normalizeEventCurrency(event.currency);

  if (!Number.isFinite(rawPrice)) {
    return `Paid • ${currency}`;
  }

  return formatMoney(rawPrice, currency, resolveLaunchFormattingLocale(locale));
}

export function formatEventCapacity(capacity, registeredCount = 0) {
  return formatEventCapacityAvailability(capacity, registeredCount);
}

export function formatEventCapacityAvailability(capacity, registeredCount = 0) {
  const normalized = Number.parseInt(String(capacity || ""), 10);
  if (!Number.isFinite(normalized) || normalized <= 0) {
    return "Open capacity";
  }

  const occupied = Math.max(0, Number.parseInt(String(registeredCount || ""), 10) || 0);
  const remaining = Math.max(0, normalized - occupied);
  return `${remaining}/${normalized} places left`;
}

export function getEventVisibilityLabel(visibility) {
  const normalized = normalizeString(visibility);
  if (normalized === "members-only") {
    return "Members only";
  }

  return "Public";
}

export function getEventEligibilityLabel(eligibility) {
  const normalized = normalizeEventRegistrationEligibility(eligibility);
  if (normalized === "guests-allowed") {
    return "Members may book guests";
  }

  return "Members only";
}

export function isEventPubliclyVisible(event) {
  return isActiveUpcomingPublishedEvent(event);
}

export function canViewPublishedEvent(event, { isMember = false } = {}) {
  if (!isEventPubliclyVisible(event)) {
    return false;
  }

  const visibility = normalizeString(event?.visibility) || "public";

  if (visibility === "members-only") {
    return isMember;
  }

  return true;
}

export function normalizeCreateEventPayload(payload) {
  const title = normalizeString(payload.title);
  const slug = normalizeEventSlug(payload.slug || title);
  const summary = normalizeString(payload.summary);
  const description = parseSectionRichTextInput(payload.description);
  const location = normalizeString(payload.location);
  const startDate = normalizeString(payload.startDate);
  const endDate = normalizeString(payload.endDate) || startDate;
  const startTime = normalizeString(payload.startTime);
  const endTime = normalizeString(payload.endTime);
  const capacity = normalizeEventInteger(payload.capacity, 0);
  const pricingMode = normalizeString(payload.pricingMode) || "free";
  const price = normalizeString(payload.price);
  const currency = normalizeEventCurrency(payload.currency);
  const bookingConfiguration = resolveEventBookingConfiguration(payload);
  const registrationEligibility = bookingConfiguration.registrationEligibility;
  const visibility = normalizeString(payload.visibility) || "public";
  const allowWaitlist = normalizeBoolean(payload.allowWaitlist, true);
  const category = normalizeString(payload.category);
  const status = normalizeString(payload.status) || "draft";
  const imageAssetId = normalizeAssetId(payload.imageAssetId);
  const imageAlt = normalizeString(payload.imageAlt);
  const paymentConfiguration = normalizeOfferingPaymentConfiguration(payload);
  const refundWindowMode = normalizeEventRefundWindowMode(payload.refundWindowMode);
  const rawRefundWindowHours = Number.parseInt(String(payload.refundWindowHours || ""), 10);
  const refundWindowHours =
    refundWindowMode === "custom"
      ? rawRefundWindowHours
      : normalizeEventRefundWindowHours(payload.refundWindowHours);
  const refundPolicy = normalizeEventRefundPolicy(payload.refundPolicy);

  if (!title) {
    throw new Error("Event title is required.");
  }

  if (!slug) {
    throw new Error("Event slug is required.");
  }

  if (!hasSectionRichTextContent(description)) {
    throw new Error("Event description is required.");
  }

  if (!location) {
    throw new Error("Event location is required.");
  }

  if (!startDate) {
    throw new Error("Event start date is required.");
  }

  if (!parseDateString(startDate)) {
    throw new Error("Event start date must be valid.");
  }

  if (!parseDateString(endDate)) {
    throw new Error("Event end date must be valid.");
  }

  if (parseDateString(endDate) < parseDateString(startDate)) {
    throw new Error("Event end date must be on or after the start date.");
  }

  if (startTime && !isValidTimeString(startTime)) {
    throw new Error("Event start time must be valid.");
  }

  if (endTime && !isValidTimeString(endTime)) {
    throw new Error("Event end time must be valid.");
  }

  if (endTime && !startTime) {
    throw new Error("Event end time requires a start time.");
  }

  if (startTime && endTime && startDate === endDate) {
    const startMinutes = parseTimeStringToMinutes(startTime);
    const endMinutes = parseTimeStringToMinutes(endTime);

    if (endMinutes !== null && startMinutes !== null && endMinutes <= startMinutes) {
      throw new Error("For a single-day event, end time must be after start time.");
    }
  }

  if (!category) {
    throw new Error("Event category is required.");
  }

  if (pricingMode === "paid" && !price) {
    throw new Error("Paid events require a price.");
  }

  if (refundWindowMode === "custom" && (!Number.isFinite(rawRefundWindowHours) || rawRefundWindowHours <= 0)) {
    throw new Error("Custom refund window hours must be greater than zero.");
  }

  const { startAt, endAt } = deriveEventTimestamps({
    startDate,
    endDate,
    startTime,
    endTime,
  });

  return {
    title,
    slug,
    summary,
    description,
    imageAssetId,
    imageAlt,
    location,
    startDate,
    endDate,
    startTime,
    endTime,
    startAt,
    endAt,
    capacity,
    pricingMode,
    price,
    currency,
    externalPaymentUrl: paymentConfiguration.externalPaymentUrl,
    paymentInstructions: paymentConfiguration.paymentInstructions,
    refundWindowMode,
    refundWindowHours,
    refundPolicy,
    registrationEligibility,
    bookingMode: bookingConfiguration.bookingMode,
    maxAttendeesPerBooking: bookingConfiguration.maxAttendeesPerBooking,
    guestDetailsMode: bookingConfiguration.guestDetailsMode,
    visibility,
    allowWaitlist,
    category,
    status,
  };
}

export function resolveEventPaymentConfiguration(event, paymentProcessingMode = "none") {
  return resolveOfferingPaymentConfiguration({
    pricingMode: event?.pricingMode,
    paymentProcessingMode,
    externalPaymentUrl: event?.externalPaymentUrl,
    paymentInstructions: event?.paymentInstructions,
    offeringLabel: "Paid events",
  });
}
