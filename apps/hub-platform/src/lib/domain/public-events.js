import { buildHubAuthHref } from "@/lib/auth/hub-auth-redirects";
import { buildHubRuntimeHref } from "@/lib/domain/hub-runtime-paths";
import {
  getFallbackRegionalMarket,
  resolveLaunchFormattingLocale,
} from "@/lib/domain/regional-markets";
import { eventCategoryOptions, formatEventPrice } from "./events.js";
import { getSectionRichTextPlainText } from "./section-rich-text.js";

export const ALL_EVENTS_FILTER = "all";
export const MIN_RESULTS_FOR_FEATURED_EVENT = 4;

function normalizeString(value) {
  return String(value || "").trim();
}

function hasActiveEventBooking(booking) {
  const status = normalizeString(booking?.status);
  return Boolean(booking) && status !== "cancelled";
}

function normalizeQuery(value) {
  return normalizeString(value).toLowerCase();
}

function parseIsoDate(value) {
  const normalized = normalizeString(value);

  if (!normalized) {
    return null;
  }

  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseDateString(value) {
  const normalized = normalizeString(value);

  if (!normalized) {
    return null;
  }

  const date = new Date(`${normalized}T00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatEventDayMonth(date, locale = getFallbackRegionalMarket().defaultLocale) {
  return new Intl.DateTimeFormat(resolveLaunchFormattingLocale(locale), {
    day: "numeric",
    month: "short",
  }).format(date);
}

function formatEventTime(date, locale = getFallbackRegionalMarket().defaultLocale) {
  return new Intl.DateTimeFormat(resolveLaunchFormattingLocale(locale), {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function getDefaultEventsPageHero(siteName) {
  const normalizedSiteName = normalizeString(siteName) || "this community";

  return {
    eyebrow: "Events",
    title: `Events at ${normalizedSiteName}`,
    description: `Browse upcoming workshops, meet ups, and community sessions from ${normalizedSiteName}. Use search and category filters to find the right fit.`,
  };
}

export function getPublicEventCategoryOptions(events = []) {
  const presentCategories = new Set(
    events
      .map((event) => normalizeString(event?.category))
      .filter(Boolean)
  );

  return [
    { value: ALL_EVENTS_FILTER, label: "All" },
    ...eventCategoryOptions.filter((option) => presentCategories.has(option.value)),
  ];
}

export function filterPublicEvents(events = [], { query = "", category = ALL_EVENTS_FILTER } = {}) {
  const normalizedQuery = normalizeQuery(query);
  const normalizedCategory = normalizeString(category) || ALL_EVENTS_FILTER;

  return events.filter((event) => {
    const matchesCategory =
      normalizedCategory === ALL_EVENTS_FILTER || normalizeString(event.category) === normalizedCategory;

    if (!matchesCategory) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = [
      event.title,
      event.summary,
      getSectionRichTextPlainText(event.description),
      event.location,
    ]
      .map(normalizeString)
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export function getFeaturedPublicEvent(events = []) {
  return events.length >= MIN_RESULTS_FOR_FEATURED_EVENT ? events[0] : null;
}

export function formatPublicRecurringSeriesLabel(series, nextOccurrence, locale = getFallbackRegionalMarket().defaultLocale) {
  const resolvedLocale = resolveLaunchFormattingLocale(locale);
  const nextOccurrenceLabel = nextOccurrence
    ? formatPublicEventListingDateTime(nextOccurrence, resolvedLocale)
    : "Select an occurrence";

  return `Recurring • ${nextOccurrenceLabel}`;
}

export function groupPublicEventListings(events = [], series = [], locale = getFallbackRegionalMarket().defaultLocale) {
  const seriesById = new Map(series.map((item) => [item.id, item]));
  const groupedSeriesIds = new Set();
  const groupedItems = [];

  for (const event of events) {
    const isSeriesOccurrence = normalizeString(event?.eventKind) === "series_occurrence" && normalizeString(event?.seriesId);

    if (!isSeriesOccurrence) {
      groupedItems.push(event);
      continue;
    }

    const seriesId = normalizeString(event.seriesId);

    if (groupedSeriesIds.has(seriesId)) {
      continue;
    }

    groupedSeriesIds.add(seriesId);
    const seriesRecord = seriesById.get(seriesId);
    const nextOccurrence = event;

    groupedItems.push({
      ...event,
      slug: normalizeString(seriesRecord?.slugBase) || normalizeString(event?.seriesSlugBase) || normalizeString(event?.slug),
      title: normalizeString(seriesRecord?.title) || normalizeString(event?.title),
      summary: normalizeString(seriesRecord?.summary) || normalizeString(event?.summary),
      description: Array.isArray(seriesRecord?.description) ? seriesRecord.description : event?.description,
      imageAsset: seriesRecord?.imageAsset || event?.imageAsset || null,
      imageAlt: normalizeString(seriesRecord?.imageAlt) || normalizeString(event?.imageAlt),
      location: normalizeString(seriesRecord?.location) || normalizeString(event?.location),
      category: normalizeString(seriesRecord?.category) || normalizeString(event?.category),
      pricingMode: normalizeString(seriesRecord?.pricingMode) || normalizeString(event?.pricingMode),
      price: normalizeString(seriesRecord?.price) || normalizeString(event?.price),
      currency: normalizeString(seriesRecord?.currency) || normalizeString(event?.currency),
      eventKind: "public_recurring_series",
      displayDateLabel: formatPublicRecurringSeriesLabel(seriesRecord, nextOccurrence, locale),
      nextOccurrenceStartAt: normalizeString(nextOccurrence?.startAt),
      nextOccurrenceStartDate: normalizeString(nextOccurrence?.startDate),
    });
  }

  return groupedItems.sort((left, right) => {
    const leftDate = normalizeString(left?.nextOccurrenceStartAt || left?.startAt || left?.nextOccurrenceStartDate || left?.startDate);
    const rightDate = normalizeString(right?.nextOccurrenceStartAt || right?.startAt || right?.nextOccurrenceStartDate || right?.startDate);
    return leftDate.localeCompare(rightDate);
  });
}

export function buildPublicEventsContextText({
  totalCount = 0,
  resultCount = 0,
  activeCategoryLabel = "All",
  query = "",
}) {
  if (!totalCount) {
    return "";
  }

  const normalizedQuery = normalizeString(query);
  const normalizedCategoryLabel = normalizeString(activeCategoryLabel) || "All";
  const resultLabel = resultCount === 1 ? "event" : "events";

  if (normalizedQuery && normalizedCategoryLabel !== "All") {
    return `${resultCount} ${resultLabel} for "${normalizedQuery}" in ${normalizedCategoryLabel}`;
  }

  if (normalizedQuery) {
    return `${resultCount} ${resultLabel} for "${normalizedQuery}"`;
  }

  if (normalizedCategoryLabel !== "All") {
    return `Showing ${normalizedCategoryLabel} • ${resultCount} ${resultLabel}`;
  }

  return `${resultCount} upcoming ${resultLabel}`;
}

export function formatPublicEventListingDateTime(
  eventOrStartAt,
  endAtOrLocale = getFallbackRegionalMarket().defaultLocale,
  localeArg
) {
  const locale =
    typeof eventOrStartAt === "object" && eventOrStartAt !== null
      ? (endAtOrLocale || getFallbackRegionalMarket().defaultLocale)
      : (localeArg || getFallbackRegionalMarket().defaultLocale);
  const resolvedLocale = resolveLaunchFormattingLocale(locale);

  if (typeof eventOrStartAt !== "object" || eventOrStartAt === null) {
    const startDate = parseIsoDate(eventOrStartAt);
    const endDate = parseIsoDate(endAtOrLocale);

    if (!startDate || !endDate) {
      return "Date to be confirmed";
    }

    const sameDay = startDate.toDateString() === endDate.toDateString();
    const sameMonth =
      startDate.getMonth() === endDate.getMonth() &&
      startDate.getFullYear() === endDate.getFullYear();
    const startTime = formatEventTime(startDate, resolvedLocale);
    const endTime = formatEventTime(endDate, resolvedLocale);

    if (sameDay) {
      return `${formatEventDayMonth(startDate, resolvedLocale)}, ${startTime}-${endTime}`;
    }

    if (sameMonth) {
      return `${startDate.getDate()}-${endDate.getDate()} ${new Intl.DateTimeFormat(resolvedLocale, {
        month: "short",
      }).format(startDate)}, ${startTime}-${endTime}`;
    }

    return `${formatEventDayMonth(startDate, resolvedLocale)}, ${startTime} - ${formatEventDayMonth(endDate, resolvedLocale)}, ${endTime}`;
  }

  const startDate = parseDateString(eventOrStartAt.startDate);
  const endDate = parseDateString(eventOrStartAt.endDate || eventOrStartAt.startDate);
  const startTime = normalizeString(eventOrStartAt.startTime);
  const endTime = normalizeString(eventOrStartAt.endTime);

  if (!startDate) {
    return "Date to be confirmed";
  }

  const resolvedEndDate = endDate || startDate;
  const sameDay = startDate.toDateString() === resolvedEndDate.toDateString();
  const sameMonth =
    startDate.getMonth() === resolvedEndDate.getMonth() &&
    startDate.getFullYear() === resolvedEndDate.getFullYear();

  if (!startTime) {
    if (sameDay) {
      return formatEventDayMonth(startDate, resolvedLocale);
    }

    if (sameMonth) {
      return `${startDate.getDate()}-${resolvedEndDate.getDate()} ${new Intl.DateTimeFormat(resolvedLocale, {
        month: "short",
      }).format(startDate)}`;
    }

    return `${formatEventDayMonth(startDate, resolvedLocale)} - ${formatEventDayMonth(resolvedEndDate, resolvedLocale)}`;
  }

  if (sameDay) {
    return endTime
      ? `${formatEventDayMonth(startDate, resolvedLocale)}, ${startTime}-${endTime}`
      : `${formatEventDayMonth(startDate, resolvedLocale)}, ${startTime}`;
  }

  if (sameMonth) {
    const dateLabel = `${startDate.getDate()}-${resolvedEndDate.getDate()} ${new Intl.DateTimeFormat(resolvedLocale, {
      month: "short",
    }).format(startDate)}`;
    return endTime ? `${dateLabel}, ${startTime}-${endTime}` : `${dateLabel}, ${startTime}`;
  }

  return endTime
    ? `${formatEventDayMonth(startDate, resolvedLocale)} - ${formatEventDayMonth(resolvedEndDate, resolvedLocale)}, ${startTime}-${endTime}`
    : `${formatEventDayMonth(startDate, resolvedLocale)} - ${formatEventDayMonth(resolvedEndDate, resolvedLocale)}, ${startTime}`;
}

export function formatPublicEventPriceLabel(event, locale = getFallbackRegionalMarket().defaultLocale) {
  return formatEventPrice(event, locale);
}

export function getPublicEventAvailabilityState(event, registeredCount = 0) {
  const capacity = Number.parseInt(String(event?.capacity || ""), 10);

  if (!Number.isFinite(capacity) || capacity <= 0) {
    return "open";
  }

  const normalizedRegisteredCount = Number.isFinite(Number(registeredCount))
    ? Math.max(0, Number(registeredCount))
    : 0;
  const remaining = Math.max(0, capacity - normalizedRegisteredCount);

  if (remaining > 0) {
    return "open";
  }

  return event?.allowWaitlist === false ? "sold-out" : "waitlist";
}

export function formatPublicEventSpacesLeft(event, registeredCount = 0) {
  const capacity = Number.parseInt(String(event?.capacity || ""), 10);

  if (!Number.isFinite(capacity) || capacity <= 0) {
    return "Open capacity";
  }

  const normalizedRegisteredCount = Number.isFinite(Number(registeredCount))
    ? Math.max(0, Number(registeredCount))
    : 0;
  const remaining = Math.max(0, capacity - normalizedRegisteredCount);

  if (remaining <= 0) {
    return getPublicEventAvailabilityState(event, normalizedRegisteredCount) === "sold-out"
      ? "Sold out"
      : "Waitlist only";
  }

  return remaining === 1 ? "1 space left" : `${remaining} spaces left`;
}

export function getPublicEventSummary(event) {
  const summary = normalizeString(event?.summary);

  if (summary) {
    return summary;
  }

  return getSectionRichTextPlainText(event?.description);
}

export function buildPublicEventBookingCta({
  event,
  hubSlug,
  routeMode = "path",
  registeredCount = 0,
  currentMemberSession = null,
  currentBooking = null,
  currentRegistration = null,
  detailAccessMode = "public",
}) {
  const resolvedCurrentBooking = currentBooking || currentRegistration || null;
  const eventSlug = normalizeString(event?.slug);
  const detailPath = buildHubRuntimeHref(hubSlug, `/events/${eventSlug}`, routeMode);
  const nextStepsPath = buildHubRuntimeHref(hubSlug, `/events/${eventSlug}/booking/next-steps`, routeMode);
  const availabilityState = getPublicEventAvailabilityState(event, registeredCount);
  const hasExternalPaymentStep =
    normalizeString(event?.pricingMode) === "paid" &&
    (normalizeString(event?.externalPaymentUrl) || normalizeString(event?.paymentInstructions));

  if (detailAccessMode === "history_member") {
    return {
      heading: "This event has ended",
      supportingText: "You can still review the event details here, but bookings are now closed.",
      buttonLabel: "View bookings",
      href: buildHubRuntimeHref(hubSlug, "/account/bookings", routeMode),
      requiresForm: false,
    };
  }

  if (hasActiveEventBooking(resolvedCurrentBooking)) {
    return {
      heading: "You're booked onto this event",
      buttonLabel: "View booking",
      href: nextStepsPath,
      requiresForm: false,
    };
  }

  if (availabilityState === "sold-out") {
    return {
      heading: "This event is sold out",
      supportingText: "No further bookings are being accepted for this event.",
      buttonLabel: "Sold out",
      requiresForm: false,
      disabled: true,
    };
  }

  if (!currentMemberSession) {
    return {
      heading: "Register for this event",
      supportingText: hasExternalPaymentStep
        ? "Sign in as a member first so the hub can connect your booking and payment with the right account."
        : undefined,
      buttonLabel: availabilityState === "waitlist" ? "Join waitlist" : "Sign in to continue",
      href: buildHubAuthHref(hubSlug, "sign-in", detailPath, routeMode),
      requiresForm: false,
    };
  }

  if (availabilityState === "waitlist") {
    return {
      heading: "Join the waitlist",
      supportingText: "This event is currently full, but you can still join the waitlist.",
      buttonLabel: "Join waitlist",
      requiresForm: true,
    };
  }

  if (hasExternalPaymentStep) {
    return {
      heading: "Register for this event",
      buttonLabel: "Book now",
      requiresForm: true,
    };
  }

  return {
    heading: "Register for this event",
    buttonLabel: "Book now",
    requiresForm: true,
  };
}
