import {
  hasSectionRichTextContent,
  parseSectionRichTextInput,
} from "@/lib/domain/section-rich-text";
import {
  normalizeOfferingPaymentConfiguration,
  resolveOfferingPaymentConfiguration,
} from "@/lib/domain/offering-payments";
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

export function normalizeCourseSlug(value) {
  return normalizeString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeCourseInteger(value, fallback = 0) {
  const next = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(next) ? next : fallback;
}

export function normalizeCourseCurrency(value) {
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

function resolveCourseVisibilityTimestamp(course) {
  return parseIsoDate(course?.endAt) || parseIsoDate(course?.startAt);
}

export function deriveCourseScheduleFromLegacyTimestamps(startAt, endAt) {
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

export function deriveCourseTimestamps({
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

function resolveCourseScheduleInput(input, legacyEndAt = "") {
  if (input && typeof input === "object" && !Array.isArray(input)) {
    const startDate = normalizeString(input.startDate);
    const endDate = normalizeString(input.endDate) || startDate;
    const startTime = normalizeString(input.startTime);
    const endTime = normalizeString(input.endTime);
    const derived = deriveCourseTimestamps({ startDate, endDate, startTime, endTime });

    return {
      startDate,
      endDate,
      startTime,
      endTime,
      startAt: derived.startAt,
      endAt: derived.endAt,
    };
  }

  const derived = deriveCourseScheduleFromLegacyTimestamps(input, legacyEndAt);
  const timestamps = deriveCourseTimestamps(derived);

  return {
    ...derived,
    ...timestamps,
  };
}

export const courseStatusLabels = {
  draft: "Draft",
  published: "Published",
  cancelled: "Cancelled",
};

export const courseStatusTones = {
  draft: "warning",
  published: "success",
  cancelled: "danger",
};

export const courseTypeOptions = [
  { value: "Programme", label: "Programme" },
  { value: "Workshop series", label: "Workshop series" },
  { value: "Class", label: "Class" },
  { value: "Training", label: "Training" },
  { value: "Bootcamp", label: "Bootcamp" },
  { value: "Study group", label: "Study group" },
  { value: "Certification", label: "Certification" },
];

export const courseLevelOptions = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "all-levels", label: "All levels" },
  { value: "custom", label: "Custom" },
];

export const courseFormatOptions = [
  { value: "in-person", label: "In person" },
  { value: "online", label: "Online" },
  { value: "hybrid", label: "Hybrid" },
];

export const courseVisibilityOptions = [
  { value: "public", label: "Public" },
  { value: "members-only", label: "Members only" },
  { value: "invite-only", label: "Invite only" },
  { value: "private", label: "Private" },
];

export const courseRefundWindowModeOptions = [
  { value: "default", label: "Use hub default" },
  { value: "custom", label: "Set course-specific window" },
];

export const courseRefundPolicyOptions = [
  { value: "full_refund_before_window", label: "Full refund before cutoff" },
  { value: "non_refundable", label: "Non-refundable" },
];

export function normalizeCourseRefundWindowMode(value) {
  const normalized = normalizeString(value).toLowerCase();
  return normalized === "custom" ? "custom" : "default";
}

export function normalizeCourseRefundPolicy(value) {
  const normalized = normalizeString(value).toLowerCase();
  return normalized === "non_refundable" ? "non_refundable" : "full_refund_before_window";
}

export function normalizeCourseRefundWindowHours(value, fallback = 48) {
  const next = Number.parseInt(String(value || ""), 10);

  if (!Number.isFinite(next) || next <= 0) {
    return fallback;
  }

  return next;
}

export function resolveCourseRefundWindowHours(course, fallback = 48) {
  const refundWindowMode = normalizeCourseRefundWindowMode(course?.refundWindowMode);

  if (refundWindowMode === "custom") {
    return normalizeCourseRefundWindowHours(course?.refundWindowHours, fallback);
  }

  return fallback;
}

export function resolveCourseRefundCutoffAt(course, fallbackHours = 48) {
  const startAt = parseIsoDate(course?.startAt);

  if (!startAt) {
    return null;
  }

  const refundWindowHours = resolveCourseRefundWindowHours(course, fallbackHours);
  return new Date(startAt.getTime() - (refundWindowHours * 60 * 60 * 1000));
}

export function evaluateCourseRefundEligibility(course, options = {}) {
  const paymentStatus = normalizeString(options.paymentStatus) || "paid";
  const refundPolicy = normalizeCourseRefundPolicy(course?.refundPolicy);
  const refundWindowHours = resolveCourseRefundWindowHours(course, 48);
  const startAt = parseIsoDate(course?.startAt);
  const cutoffAt = resolveCourseRefundCutoffAt(course, 48);
  const now = options.now instanceof Date ? options.now : new Date(options.now || Date.now());

  if (normalizeString(course?.pricingMode) !== "paid" || paymentStatus !== "paid") {
    return { refundable: false, reason: "payment_not_refundable", refundPolicy, refundWindowHours, cutoffAt, startAt };
  }

  if (refundPolicy === "non_refundable") {
    return { refundable: false, reason: "policy_non_refundable", refundPolicy, refundWindowHours, cutoffAt, startAt };
  }

  if (!startAt || Number.isNaN(now.getTime())) {
    return { refundable: false, reason: "timing_unavailable", refundPolicy, refundWindowHours, cutoffAt, startAt };
  }

  if (now.getTime() >= startAt.getTime()) {
    return { refundable: false, reason: "course_started", refundPolicy, refundWindowHours, cutoffAt, startAt };
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

export function getCourseStatusLabel(status) {
  return courseStatusLabels[normalizeString(status)] || "Unknown";
}

export function getCourseStatusTone(status) {
  return courseStatusTones[normalizeString(status)] || "neutral";
}

export function formatCourseDateRange(
  courseOrStartAt,
  endAtOrLocale = getFallbackRegionalMarket().defaultLocale,
  localeArg
) {
  const locale =
    typeof courseOrStartAt === "object" && courseOrStartAt !== null
      ? (endAtOrLocale || getFallbackRegionalMarket().defaultLocale)
      : (localeArg || getFallbackRegionalMarket().defaultLocale);
  const resolvedLocale = resolveLaunchFormattingLocale(locale);
  const schedule =
    typeof courseOrStartAt === "object" && courseOrStartAt !== null
      ? resolveCourseScheduleInput(courseOrStartAt)
      : resolveCourseScheduleInput(courseOrStartAt, endAtOrLocale);
  const startDate = parseDateString(schedule.startDate);
  const endDate = parseDateString(schedule.endDate || schedule.startDate);

  if (!startDate) {
    return "Schedule to be confirmed";
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

export function formatCoursePrice(course, locale = getFallbackRegionalMarket().defaultLocale) {
  if (!course || normalizeString(course.pricingMode) !== "paid") {
    return "Free";
  }

  const rawPrice = Number.parseFloat(normalizeString(course.price));
  const currency = normalizeCourseCurrency(course.currency);

  if (!Number.isFinite(rawPrice)) {
    return `Paid • ${currency}`;
  }

  return formatMoney(rawPrice, currency, resolveLaunchFormattingLocale(locale));
}

export function formatCourseCapacity(capacity, enrolledCount = 0) {
  return formatCourseCapacityAvailability(capacity, enrolledCount);
}

export function formatCourseCapacityAvailability(capacity, enrolledCount = 0) {
  const normalized = Number.parseInt(String(capacity || ""), 10);
  if (!Number.isFinite(normalized) || normalized <= 0) {
    return "Open enrolment";
  }

  const occupied = Math.max(0, Number.parseInt(String(enrolledCount || ""), 10) || 0);
  const remaining = Math.max(0, normalized - occupied);
  return `${remaining}/${normalized} places left`;
}

export function formatCourseSessionCount(sessionCount) {
  const normalized = Number.parseInt(String(sessionCount || ""), 10);
  if (!Number.isFinite(normalized) || normalized <= 0) {
    return "Session count to be confirmed";
  }

  return normalized === 1 ? "1 session" : `${normalized} sessions`;
}

export function getCourseVisibilityLabel(visibility) {
  const normalized = normalizeString(visibility);

  if (normalized === "members-only") {
    return "Members only";
  }

  if (normalized === "invite-only") {
    return "Invite only";
  }

  if (normalized === "private") {
    return "Private";
  }

  return "Public";
}

export function getCourseEligibilityLabel(eligibility) {
  return normalizeString(eligibility) === "guests-allowed" ? "Guests allowed" : "Members only";
}

export function getCourseFormatLabel(format) {
  const normalized = normalizeString(format);

  if (normalized === "online") {
    return "Online";
  }

  if (normalized === "hybrid") {
    return "Hybrid";
  }

  return "In person";
}

export function getCourseTypeLabel(course) {
  const subtypeLabel = normalizeString(course?.subtypeLabel);
  return subtypeLabel || normalizeString(course?.courseType) || "Course";
}

export function getCourseLevelLabel(course) {
  const customLevelLabel = normalizeString(course?.customLevelLabel);
  const courseLevel = normalizeString(course?.courseLevel);

  if (courseLevel === "custom") {
    return customLevelLabel || "Custom level";
  }

  return courseLevelOptions.find((option) => option.value === courseLevel)?.label || "Level to be confirmed";
}

export function isActiveUpcomingPublishedCourse(course, now = new Date()) {
  if (!course || normalizeString(course.status) !== "published") {
    return false;
  }

  const visibilityTimestamp = resolveCourseVisibilityTimestamp(course);

  if (!visibilityTimestamp) {
    return false;
  }

  const reference = now instanceof Date ? now : new Date(now);

  if (Number.isNaN(reference.getTime())) {
    return false;
  }

  return visibilityTimestamp.getTime() >= reference.getTime();
}

export function isCoursePubliclyVisible(course) {
  return isActiveUpcomingPublishedCourse(course)
    && normalizeString(course?.visibility) === "public";
}

export function canViewPublishedCourse(course, { isMember = false } = {}) {
  if (!isActiveUpcomingPublishedCourse(course)) {
    return false;
  }

  const visibility = normalizeString(course?.visibility) || "public";

  if (visibility === "members-only") {
    return isMember;
  }

  if (visibility === "invite-only" || visibility === "private") {
    return false;
  }

  return true;
}

export function normalizeCreateCoursePayload(payload) {
  const title = normalizeString(payload.title);
  const slug = normalizeCourseSlug(payload.slug || title);
  const summary = normalizeString(payload.summary);
  const description = parseSectionRichTextInput(payload.description);
  const imageAssetId = normalizeAssetId(payload.imageAssetId);
  const imageAlt = normalizeString(payload.imageAlt);
  const courseType = normalizeString(payload.courseType);
  const subtypeLabel = normalizeString(payload.subtypeLabel);
  const courseLevel = normalizeString(payload.courseLevel);
  const customLevelLabel = normalizeString(payload.customLevelLabel);
  const format = normalizeString(payload.format);
  const location = normalizeString(payload.location);
  const onlineMeetingLink = normalizeString(payload.onlineMeetingLink);
  const timezone = normalizeString(payload.timezone);
  const accessInstructions = parseSectionRichTextInput(payload.accessInstructions);
  const startDate = normalizeString(payload.startDate);
  const endDate = normalizeString(payload.endDate) || startDate;
  const startTime = normalizeString(payload.startTime);
  const endTime = normalizeString(payload.endTime);
  const registrationOpenDate = normalizeString(payload.registrationOpenDate);
  const registrationCloseDate = normalizeString(payload.registrationCloseDate);
  const sessionCount = normalizeCourseInteger(payload.sessionCount, 0);
  const capacity = normalizeCourseInteger(payload.capacity, 0);
  const pricingMode = normalizeString(payload.pricingMode) || "free";
  const price = normalizeString(payload.price);
  const currency = normalizeCourseCurrency(payload.currency);
  const requiresDeposit = normalizeBoolean(payload.requiresDeposit, false);
  const depositAmount = normalizeString(payload.depositAmount);
  const paymentDeadline = normalizeString(payload.paymentDeadline);
  const refundWindowMode = normalizeCourseRefundWindowMode(payload.refundWindowMode);
  const refundWindowHours =
    refundWindowMode === "default" ? 48 : normalizeCourseRefundWindowHours(payload.refundWindowHours);
  const refundPolicy = normalizeCourseRefundPolicy(payload.refundPolicy);
  const registrationEligibility = "members-only";
  const visibility = normalizeString(payload.visibility) || "public";
  const allowWaitlist = normalizeBoolean(payload.allowWaitlist, true);
  const status = normalizeString(payload.status) || "draft";
  const paymentConfiguration = normalizeOfferingPaymentConfiguration(payload);
  const timestamps = deriveCourseTimestamps({ startDate, endDate, startTime, endTime });

  if (!title) {
    throw new Error("Course title is required.");
  }

  if (!slug) {
    throw new Error("Course slug is required.");
  }

  if (!summary) {
    throw new Error("Course summary is required.");
  }

  if (!hasSectionRichTextContent(description)) {
    throw new Error("Course description is required.");
  }

  if (!courseType) {
    throw new Error("Course type is required.");
  }

  if (!courseLevel) {
    throw new Error("Course level is required.");
  }

  if (courseLevel === "custom" && !customLevelLabel) {
    throw new Error("Enter a custom level label when using a custom course level.");
  }

  if (!format) {
    throw new Error("Course format is required.");
  }

  if (!timezone) {
    throw new Error("Course timezone is required.");
  }

  if (!startDate) {
    throw new Error("Course start date is required.");
  }

  if (!startTime) {
    throw new Error("Course start time is required.");
  }

  if (!endTime) {
    throw new Error("Course end time is required.");
  }

  if (!registrationOpenDate) {
    throw new Error("Course registration open date is required.");
  }

  if (!registrationCloseDate) {
    throw new Error("Course registration close date is required.");
  }

  const parsedStartDate = parseDateString(startDate);
  const parsedEndDate = parseDateString(endDate);

  if (parsedStartDate && parsedEndDate && parsedEndDate < parsedStartDate) {
    throw new Error("Course end date must be after the start date.");
  }

  if (endTime && !startTime) {
    throw new Error("Add a start time before setting an end time.");
  }

  if (startTime && !isValidTimeString(startTime)) {
    throw new Error("Course start time must be valid.");
  }

  if (endTime && !isValidTimeString(endTime)) {
    throw new Error("Course end time must be valid.");
  }

  if (
    startDate
    && endDate === startDate
    && startTime
    && endTime
    && parseTimeStringToMinutes(endTime) <= parseTimeStringToMinutes(startTime)
  ) {
    throw new Error("Course end time must be after the start time when the course runs on one day.");
  }

  if ((format === "in-person" || format === "hybrid") && !location) {
    throw new Error("Location is required for in-person and hybrid courses.");
  }

  if ((format === "online" || format === "hybrid") && !onlineMeetingLink) {
    throw new Error("An online meeting link is required for online and hybrid courses.");
  }

  if (pricingMode === "paid" && !price) {
    throw new Error("Paid courses require a price.");
  }

  if (pricingMode === "paid" && !paymentDeadline) {
    throw new Error("Paid courses require a payment deadline.");
  }

  if (paymentDeadline && !parseDateString(paymentDeadline)) {
    throw new Error("Course payment deadline must be valid.");
  }

  if (pricingMode === "paid" && refundWindowMode === "custom" && normalizeCourseRefundWindowHours(payload.refundWindowHours, 0) <= 0) {
    throw new Error("Custom refund window hours must be greater than zero.");
  }

  if (requiresDeposit && pricingMode !== "paid") {
    throw new Error("Deposits are only available for paid courses.");
  }

  if (requiresDeposit && !depositAmount) {
    throw new Error("Enter a deposit amount when deposits are enabled.");
  }

  const parsedRegistrationOpenDate = parseDateString(registrationOpenDate);
  const parsedRegistrationCloseDate = parseDateString(registrationCloseDate);

  if (
    parsedRegistrationOpenDate
    && parsedRegistrationCloseDate
    && parsedRegistrationCloseDate < parsedRegistrationOpenDate
  ) {
    throw new Error("Registration close date must be on or after the open date.");
  }

  return {
    title,
    slug,
    summary,
    description,
    imageAssetId,
    imageAlt,
    courseType,
    subtypeLabel,
    courseLevel,
    customLevelLabel: courseLevel === "custom" ? customLevelLabel : "",
    format,
    location: format === "online" ? "" : location,
    onlineMeetingLink: format === "in-person" ? "" : onlineMeetingLink,
    timezone,
    accessInstructions,
    startDate,
    endDate,
    startTime,
    endTime,
    startAt: timestamps.startAt,
    endAt: timestamps.endAt,
    registrationOpenDate,
    registrationCloseDate,
    sessionCount,
    capacity,
    pricingMode,
    price,
    currency,
    externalPaymentUrl: paymentConfiguration.externalPaymentUrl,
    paymentInstructions: paymentConfiguration.paymentInstructions,
    requiresDeposit: pricingMode === "paid" ? requiresDeposit : false,
    depositAmount: pricingMode === "paid" && requiresDeposit ? depositAmount : "",
    paymentDeadline: pricingMode === "paid" ? paymentDeadline : "",
    refundWindowMode: pricingMode === "paid" ? refundWindowMode : "default",
    refundWindowHours: pricingMode === "paid" ? refundWindowHours : 48,
    refundPolicy: pricingMode === "paid" ? refundPolicy : "full_refund_before_window",
    registrationEligibility,
    visibility,
    allowWaitlist,
    status,
  };
}

export function resolveCoursePaymentConfiguration(course, paymentProcessingMode = "none") {
  return resolveOfferingPaymentConfiguration({
    pricingMode: course?.pricingMode,
    paymentProcessingMode,
    externalPaymentUrl: course?.externalPaymentUrl,
    paymentInstructions: course?.paymentInstructions,
    offeringLabel: "Paid courses",
  });
}
