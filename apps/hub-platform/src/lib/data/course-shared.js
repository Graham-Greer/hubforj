try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getMediaAssetsByIds, getPublicMediaAssetsByIds } from "@/lib/data/media";
import {
  deriveCourseScheduleFromLegacyTimestamps,
  deriveCourseTimestamps,
  normalizeCourseCurrency,
  normalizeCourseInteger,
  normalizeCourseRefundPolicy,
  normalizeCourseRefundWindowHours,
  normalizeCourseRefundWindowMode,
} from "@/lib/domain/courses";
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

export function normalizeCourseRecord(course) {
  if (!course) {
    return null;
  }

  const legacySchedule = deriveCourseScheduleFromLegacyTimestamps(course.startAt, course.endAt);
  const startDate = normalizeString(course.startDate) || legacySchedule.startDate;
  const endDate = normalizeString(course.endDate) || legacySchedule.endDate || startDate;
  const startTime = normalizeString(course.startTime) || legacySchedule.startTime;
  const endTime = normalizeString(course.endTime) || legacySchedule.endTime;
  const courseLevel = normalizeString(course.courseLevel);
  const derivedTimestamps = deriveCourseTimestamps({
    startDate,
    endDate,
    startTime,
    endTime,
  });

  return {
    id: normalizeString(course.id),
    hubId: normalizeString(course.hubId),
    slug: normalizeString(course.slug),
    status: normalizeString(course.status) || "draft",
    title: normalizeString(course.title),
    summary: normalizeString(course.summary),
    description: coerceSectionRichTextInput(course.description),
    imageAssetId: normalizeString(course.imageAssetId),
    imageAlt: normalizeString(course.imageAlt),
    courseType: normalizeString(course.courseType),
    subtypeLabel: normalizeString(course.subtypeLabel),
    courseLevel,
    customLevelLabel: courseLevel === "custom" ? normalizeString(course.customLevelLabel) : "",
    format: normalizeString(course.format) || "in-person",
    location: normalizeString(course.location),
    onlineMeetingLink: normalizeString(course.onlineMeetingLink),
    timezone: normalizeString(course.timezone),
    accessInstructions: coerceSectionRichTextInput(course.accessInstructions),
    startDate,
    endDate,
    startTime,
    endTime,
    startAt: normalizeString(course.startAt) || derivedTimestamps.startAt,
    endAt: normalizeString(course.endAt) || derivedTimestamps.endAt,
    registrationOpenDate: normalizeString(course.registrationOpenDate),
    registrationCloseDate: normalizeString(course.registrationCloseDate),
    sessionCount: normalizeCourseInteger(course.sessionCount, 0),
    capacity: normalizeCourseInteger(course.capacity, 0),
    pricingMode: normalizeString(course.pricingMode) || "free",
    price: normalizeString(course.price),
    currency: normalizeCourseCurrency(course.currency),
    externalPaymentUrl: normalizeString(course.externalPaymentUrl),
    paymentInstructions: normalizeString(course.paymentInstructions),
    requiresDeposit: normalizeBoolean(course.requiresDeposit, false),
    depositAmount: normalizeString(course.depositAmount),
    paymentDeadline: normalizeString(course.paymentDeadline),
    refundWindowMode: normalizeCourseRefundWindowMode(course.refundWindowMode),
    refundWindowHours: normalizeCourseRefundWindowHours(course.refundWindowHours),
    refundPolicy: normalizeCourseRefundPolicy(course.refundPolicy),
    registrationEligibility: normalizeString(course.registrationEligibility) || "members-only",
    visibility: normalizeString(course.visibility) || "public",
    allowWaitlist: normalizeBoolean(course.allowWaitlist, true),
    registrationCount: normalizeCourseInteger(course.registrationCount, 0),
    enrolledRegistrationCount: normalizeCourseInteger(course.enrolledRegistrationCount, 0),
    waitlistedRegistrationCount: normalizeCourseInteger(course.waitlistedRegistrationCount, 0),
    cancelledRegistrationCount: normalizeCourseInteger(course.cancelledRegistrationCount, 0),
    attendanceInProgressCount: normalizeCourseInteger(course.attendanceInProgressCount, 0),
    attendanceCompletedCount: normalizeCourseInteger(course.attendanceCompletedCount, 0),
    attendanceActiveCount:
      normalizeCourseInteger(course.attendanceActiveCount, 0) ||
      normalizeCourseInteger(course.attendanceInProgressCount, 0) + normalizeCourseInteger(course.attendanceCompletedCount, 0),
    registrationSummarySchemaVersion: normalizeCourseInteger(course.registrationSummarySchemaVersion, 0),
    registrationSummaryUpdatedAt: normalizeString(course.registrationSummaryUpdatedAt),
    registrationSummaryUpdatedBy: normalizeString(course.registrationSummaryUpdatedBy),
    createdAt: normalizeString(course.createdAt),
    updatedAt: normalizeString(course.updatedAt),
  };
}

export function attachCourseMedia(courses, assets) {
  const byId = new Map(assets.map((asset) => [asset.id, asset]));

  return courses.map((course) => ({
    ...course,
    imageAsset: course.imageAssetId ? byId.get(course.imageAssetId) || null : null,
  }));
}

export async function withCourseMedia(hubId, courses) {
  const assetIds = [...new Set(courses.map((course) => course.imageAssetId).filter(Boolean))];
  const assets = await getMediaAssetsByIds(hubId, assetIds);
  return attachCourseMedia(courses, assets);
}

export async function withPublicCourseMedia(hubId, courses) {
  const assetIds = [...new Set(courses.map((course) => course.imageAssetId).filter(Boolean))];
  const assets = await getPublicMediaAssetsByIds(hubId, assetIds);
  return attachCourseMedia(courses, assets);
}
