try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { getCourseFormatLabel } from "@/lib/domain/courses";
import { getFallbackRegionalMarket } from "@/lib/domain/regional-markets";
import { getCourseById } from "./course-queries.js";
import { getEventById } from "./event-queries.js";
import { normalizeCourseRegistrationRecord } from "./course-registration-shared.js";
import { normalizeEventBookingRecord, normalizeString } from "./event-booking-shared.js";

export const MEMBER_ACTIVITY_SCHEMA_VERSION = 1;

function normalizeInteger(value, fallback = 0) {
  const next = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(next) ? next : fallback;
}

function normalizeLimit(value, fallback = 200) {
  const next = Number.parseInt(String(value || ""), 10);
  return Math.min(Math.max(Number.isFinite(next) ? next : fallback, 1), 500);
}

export function isMemberActivityReadModelEnabled() {
  return normalizeString(process.env.HUB_PLATFORM_MEMBER_ACTIVITY_READ_MODEL_ENABLED).toLowerCase() === "true";
}

function getMemberActivityCollection(hubId) {
  return getFirebaseAdminDb().collection("hubs").doc(hubId).collection("memberActivity");
}

function getMemberActivityDocRef(hubId, kind, recordId) {
  return getMemberActivityCollection(hubId).doc(`${kind}_${recordId}`);
}

function resolveSortAt(primary, fallback) {
  return normalizeString(primary) || normalizeString(fallback) || new Date(0).toISOString();
}

function normalizeCurrency(value) {
  return normalizeString(value).toUpperCase() || getFallbackRegionalMarket().defaultCurrency;
}

export function normalizeMemberActivityRecord(activity) {
  if (!activity) {
    return null;
  }

  return {
    id: normalizeString(activity.id),
    hubId: normalizeString(activity.hubId),
    userId: normalizeString(activity.userId),
    kind: normalizeString(activity.kind),
    recordId: normalizeString(activity.recordId),
    parentId: normalizeString(activity.parentId),
    title: normalizeString(activity.title),
    slug: normalizeString(activity.slug),
    imageUrl: normalizeString(activity.imageUrl),
    imageAlt: normalizeString(activity.imageAlt),
    status: normalizeString(activity.status),
    paymentStatus: normalizeString(activity.paymentStatus) || "not_required",
    attendanceStatus: normalizeString(activity.attendanceStatus),
    attendeeCount: normalizeInteger(activity.attendeeCount, 0),
    activeAttendeeCount: normalizeInteger(activity.activeAttendeeCount, 0),
    waitlistedAttendeeCount: normalizeInteger(activity.waitlistedAttendeeCount, 0),
    cancelledAttendeeCount: normalizeInteger(activity.cancelledAttendeeCount, 0),
    amountMinor: normalizeInteger(activity.amountMinor, 0),
    amountDisplay: normalizeString(activity.amountDisplay),
    price: normalizeString(activity.price),
    currency: normalizeCurrency(activity.currency),
    pricingMode: normalizeString(activity.pricingMode) || "free",
    location: normalizeString(activity.location),
    startDate: normalizeString(activity.startDate),
    endDate: normalizeString(activity.endDate),
    startTime: normalizeString(activity.startTime),
    endTime: normalizeString(activity.endTime),
    startAt: normalizeString(activity.startAt),
    endAt: normalizeString(activity.endAt),
    dateSortValue: normalizeString(activity.dateSortValue),
    endSortValue: normalizeString(activity.endSortValue),
    eventKind: normalizeString(activity.eventKind),
    seriesId: normalizeString(activity.seriesId),
    occurrenceDate: normalizeString(activity.occurrenceDate),
    isSeriesManaged: activity.isSeriesManaged === true,
    courseScheduleSummary: normalizeString(activity.courseScheduleSummary),
    courseFormat: normalizeString(activity.courseFormat),
    courseFormatLabel: normalizeString(activity.courseFormatLabel),
    courseLocation: normalizeString(activity.courseLocation),
    externalPaymentUrl: normalizeString(activity.externalPaymentUrl),
    paymentInstructions: normalizeString(activity.paymentInstructions),
    refundWindowMode: normalizeString(activity.refundWindowMode) || "default",
    refundWindowHours: normalizeInteger(activity.refundWindowHours, 48),
    refundPolicy: normalizeString(activity.refundPolicy) || "full_refund_before_window",
    nativePaymentTransactionId: normalizeString(activity.nativePaymentTransactionId),
    nativePaymentStatus: normalizeString(activity.nativePaymentStatus),
    nativePaymentCheckoutUrl: normalizeString(activity.nativePaymentCheckoutUrl),
    nativePaymentSessionId: normalizeString(activity.nativePaymentSessionId),
    paymentCompletedAt: normalizeString(activity.paymentCompletedAt),
    createdAt: normalizeString(activity.createdAt),
    updatedAt: normalizeString(activity.updatedAt),
    cancelledAt: normalizeString(activity.cancelledAt),
    cancelledByUserId: normalizeString(activity.cancelledByUserId),
    sortAt: normalizeString(activity.sortAt),
    sourceUpdatedAt: normalizeString(activity.sourceUpdatedAt),
    schemaVersion: normalizeInteger(activity.schemaVersion, 0),
  };
}

export function buildEventBookingMemberActivity(booking, event = null, options = {}) {
  const row = normalizeEventBookingRecord(booking);
  const now = normalizeString(options.updatedAt) || new Date().toISOString();
  const eventTitle = normalizeString(event?.title) || row.eventTitleSnapshot || "Event";
  const eventStartAt = normalizeString(event?.startAt) || row.eventStartAtSnapshot;
  const eventEndAt = normalizeString(event?.endAt) || row.eventEndAtSnapshot;
  const currency = normalizeCurrency(row.currency || event?.currency);

  return {
    hubId: row.hubId,
    userId: row.bookerUserId,
    kind: "event",
    recordId: row.id,
    parentId: row.eventId,
    title: eventTitle,
    slug: normalizeString(event?.slug) || row.eventSlugSnapshot,
    imageUrl: normalizeString(event?.imageAsset?.publicUrl),
    imageAlt: normalizeString(event?.imageAlt || event?.imageAsset?.alt || eventTitle),
    status: row.status,
    paymentStatus: row.paymentStatus,
    attendeeCount: row.attendeeCount,
    activeAttendeeCount: row.activeAttendeeCount,
    waitlistedAttendeeCount: row.waitlistedAttendeeCount,
    cancelledAttendeeCount: row.cancelledAttendeeCount,
    amountMinor: row.amountMinor,
    amountDisplay: row.amountDisplay,
    price: normalizeString(event?.price),
    currency,
    pricingMode: normalizeString(row.pricingMode || event?.pricingMode) || "free",
    location: normalizeString(event?.location) || row.eventLocationSnapshot,
    startDate: normalizeString(event?.startDate),
    endDate: normalizeString(event?.endDate),
    startTime: normalizeString(event?.startTime),
    endTime: normalizeString(event?.endTime),
    startAt: eventStartAt,
    endAt: eventEndAt,
    dateSortValue: eventStartAt || normalizeString(event?.startDate) || row.createdAt,
    endSortValue: eventEndAt || normalizeString(event?.endDate),
    eventKind: normalizeString(event?.eventKind) || "single",
    seriesId: normalizeString(event?.seriesId),
    occurrenceDate: normalizeString(event?.occurrenceDate),
    isSeriesManaged: event?.isSeriesManaged === true,
    externalPaymentUrl: normalizeString(event?.externalPaymentUrl),
    paymentInstructions: normalizeString(event?.paymentInstructions),
    refundWindowMode: normalizeString(event?.refundWindowMode) || row.refundWindowModeSnapshot || "default",
    refundWindowHours: normalizeInteger(event?.refundWindowHours || row.refundWindowHoursSnapshot, 48),
    refundPolicy: normalizeString(event?.refundPolicy) || row.refundPolicySnapshot || "full_refund_before_window",
    nativePaymentTransactionId: row.nativePaymentTransactionId,
    nativePaymentStatus: row.nativePaymentStatus,
    nativePaymentCheckoutUrl: row.nativePaymentCheckoutUrl,
    nativePaymentSessionId: row.nativePaymentSessionId,
    paymentCompletedAt: row.paymentCompletedAt,
    createdAt: row.createdAt,
    updatedAt: now,
    cancelledAt: row.cancelledAt,
    cancelledByUserId: row.cancelledByUserId,
    sortAt: resolveSortAt(eventStartAt || normalizeString(event?.startDate), row.createdAt),
    sourceUpdatedAt: row.updatedAt || row.createdAt || now,
    schemaVersion: MEMBER_ACTIVITY_SCHEMA_VERSION,
    updatedBy: normalizeString(options.actorId) || "system",
  };
}

export function buildCourseRegistrationMemberActivity(registration, course = null, options = {}) {
  const row = normalizeCourseRegistrationRecord(registration);
  const now = normalizeString(options.updatedAt) || new Date().toISOString();
  const courseTitle = normalizeString(course?.title) || "Course";
  const courseStartAt = normalizeString(course?.startAt);
  const courseEndAt = normalizeString(course?.endAt);

  return {
    hubId: row.hubId,
    userId: row.userId,
    kind: "course",
    recordId: row.id,
    parentId: row.courseId,
    title: courseTitle,
    slug: normalizeString(course?.slug),
    imageUrl: normalizeString(course?.imageAsset?.publicUrl),
    imageAlt: normalizeString(course?.imageAlt || course?.imageAsset?.alt || courseTitle),
    status: row.status,
    paymentStatus: row.paymentStatus,
    attendanceStatus: row.attendanceStatus,
    amountMinor: normalizeInteger(course?.amountMinor, 0),
    amountDisplay: "",
    price: normalizeString(course?.price),
    currency: normalizeCurrency(course?.currency),
    pricingMode: normalizeString(course?.pricingMode) || "free",
    location: normalizeString(course?.location),
    startAt: courseStartAt,
    endAt: courseEndAt,
    dateSortValue: courseStartAt || row.createdAt,
    endSortValue: courseEndAt,
    courseFormat: normalizeString(course?.format),
    courseFormatLabel: getCourseFormatLabel(course?.format),
    courseLocation: normalizeString(course?.location),
    externalPaymentUrl: normalizeString(course?.externalPaymentUrl),
    paymentInstructions: normalizeString(course?.paymentInstructions),
    refundWindowMode: normalizeString(course?.refundWindowMode) || "default",
    refundWindowHours: normalizeInteger(course?.refundWindowHours, 48),
    refundPolicy: normalizeString(course?.refundPolicy) || "full_refund_before_window",
    nativePaymentTransactionId: row.nativePaymentTransactionId,
    nativePaymentStatus: row.nativePaymentStatus,
    nativePaymentCheckoutUrl: row.nativePaymentCheckoutUrl,
    nativePaymentSessionId: row.nativePaymentSessionId,
    paymentCompletedAt: row.paymentCompletedAt,
    createdAt: row.createdAt,
    updatedAt: now,
    cancelledAt: normalizeString(registration?.cancelledAt),
    cancelledByUserId: normalizeString(registration?.cancelledByUserId),
    sortAt: resolveSortAt(courseStartAt, row.createdAt),
    sourceUpdatedAt: row.updatedAt || row.createdAt || now,
    schemaVersion: MEMBER_ACTIVITY_SCHEMA_VERSION,
    updatedBy: normalizeString(options.actorId) || "system",
  };
}

export async function upsertEventBookingMemberActivity(hubId, eventId, booking, options = {}) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedEventId = normalizeString(eventId || booking?.eventId);
  const row = normalizeEventBookingRecord({
    ...booking,
    hubId: normalizedHubId || booking?.hubId,
    eventId: normalizedEventId || booking?.eventId,
  });

  if (!row?.hubId || !row.eventId || !row.id || !row.bookerUserId) {
    return null;
  }

  const event = options.event || (await getEventById(row.hubId, row.eventId));
  const activity = buildEventBookingMemberActivity(row, event, options);
  await getMemberActivityDocRef(row.hubId, "event", row.id).set(activity, { merge: true });
  return normalizeMemberActivityRecord({ id: `event_${row.id}`, ...activity });
}

export async function upsertCourseRegistrationMemberActivity(hubId, courseId, registration, options = {}) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedCourseId = normalizeString(courseId || registration?.courseId);
  const row = normalizeCourseRegistrationRecord({
    ...registration,
    hubId: normalizedHubId || registration?.hubId,
    courseId: normalizedCourseId || registration?.courseId,
  });

  if (!row?.hubId || !row.courseId || !row.id || !row.userId) {
    return null;
  }

  const course = options.course || (await getCourseById(row.hubId, row.courseId));
  const activity = buildCourseRegistrationMemberActivity(row, course, options);
  await getMemberActivityDocRef(row.hubId, "course", row.id).set(activity, { merge: true });
  return normalizeMemberActivityRecord({ id: `course_${row.id}`, ...activity });
}

export async function listMemberActivityForUser(hubId, userId, options = {}) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedUserId = normalizeString(userId);
  const limit = normalizeLimit(options.limit);

  if (!normalizedHubId || !normalizedUserId) {
    return [];
  }

  const snapshot = await getMemberActivityCollection(normalizedHubId)
    .where("hubId", "==", normalizedHubId)
    .where("userId", "==", normalizedUserId)
    .orderBy("sortAt", "desc")
    .limit(limit)
    .get();

  return snapshot.docs
    .map((doc) => normalizeMemberActivityRecord({ id: doc.id, ...doc.data() }))
    .filter((row) => row.schemaVersion === MEMBER_ACTIVITY_SCHEMA_VERSION);
}

export function splitMemberActivityIntoBookingSources(activityRows = []) {
  const eventBookings = [];
  const courseRegistrations = [];

  for (const activity of activityRows) {
    if (activity.kind === "event") {
      eventBookings.push({
        id: activity.recordId,
        hubId: activity.hubId,
        eventId: activity.parentId,
        bookerUserId: activity.userId,
        status: activity.status,
        paymentStatus: activity.paymentStatus,
        attendeeCount: activity.attendeeCount,
        activeAttendeeCount: activity.activeAttendeeCount,
        waitlistedAttendeeCount: activity.waitlistedAttendeeCount,
        cancelledAttendeeCount: activity.cancelledAttendeeCount,
        amountMinor: activity.amountMinor,
        amountDisplay: activity.amountDisplay,
        currency: activity.currency,
        pricingMode: activity.pricingMode,
        nativePaymentTransactionId: activity.nativePaymentTransactionId,
        nativePaymentStatus: activity.nativePaymentStatus,
        nativePaymentCheckoutUrl: activity.nativePaymentCheckoutUrl,
        nativePaymentSessionId: activity.nativePaymentSessionId,
        paymentCompletedAt: activity.paymentCompletedAt,
        eventTitle: activity.title,
        eventSlug: activity.slug,
        eventKind: activity.eventKind,
        seriesId: activity.seriesId,
        occurrenceDate: activity.occurrenceDate,
        isSeriesManaged: activity.isSeriesManaged,
        eventImageUrl: activity.imageUrl,
        eventImageAlt: activity.imageAlt,
        eventStartDate: activity.startDate,
        eventEndDate: activity.endDate,
        eventStartTime: activity.startTime,
        eventEndTime: activity.endTime,
        eventStartAt: activity.startAt,
        eventEndAt: activity.endAt,
        eventLocation: activity.location,
        price: activity.price,
        externalPaymentUrl: activity.externalPaymentUrl,
        paymentInstructions: activity.paymentInstructions,
        refundWindowMode: activity.refundWindowMode,
        refundWindowHours: activity.refundWindowHours,
        refundPolicy: activity.refundPolicy,
        createdAt: activity.createdAt,
        updatedAt: activity.updatedAt,
        cancelledAt: activity.cancelledAt,
        cancelledByUserId: activity.cancelledByUserId,
      });
    } else if (activity.kind === "course") {
      courseRegistrations.push({
        id: activity.recordId,
        hubId: activity.hubId,
        courseId: activity.parentId,
        userId: activity.userId,
        status: activity.status,
        paymentStatus: activity.paymentStatus,
        attendanceStatus: activity.attendanceStatus,
        nativePaymentTransactionId: activity.nativePaymentTransactionId,
        nativePaymentStatus: activity.nativePaymentStatus,
        nativePaymentCheckoutUrl: activity.nativePaymentCheckoutUrl,
        nativePaymentSessionId: activity.nativePaymentSessionId,
        paymentCompletedAt: activity.paymentCompletedAt,
        courseTitle: activity.title,
        courseSlug: activity.slug,
        courseImageUrl: activity.imageUrl,
        courseImageAlt: activity.imageAlt,
        courseStartAt: activity.startAt,
        courseEndAt: activity.endAt,
        courseScheduleSummary: activity.courseScheduleSummary,
        courseFormat: activity.courseFormat,
        courseFormatLabel: activity.courseFormatLabel,
        courseLocation: activity.courseLocation,
        price: activity.price,
        currency: activity.currency,
        pricingMode: activity.pricingMode,
        externalPaymentUrl: activity.externalPaymentUrl,
        paymentInstructions: activity.paymentInstructions,
        refundWindowMode: activity.refundWindowMode,
        refundWindowHours: activity.refundWindowHours,
        refundPolicy: activity.refundPolicy,
        createdAt: activity.createdAt,
        updatedAt: activity.updatedAt,
        cancelledAt: activity.cancelledAt,
        cancelledByUserId: activity.cancelledByUserId,
      });
    }
  }

  return { eventBookings, courseRegistrations };
}

export async function listMemberActivityBookingSources(hubId, userId, options = {}) {
  const activityRows = await listMemberActivityForUser(hubId, userId, options);
  return splitMemberActivityIntoBookingSources(activityRows);
}

export async function rebuildHubMemberActivity(hubId, actorId = "member-activity-sync") {
  const normalizedHubId = normalizeString(hubId);
  const normalizedActorId = normalizeString(actorId) || "member-activity-sync";

  if (!normalizedHubId) {
    throw new Error("Hub id is required.");
  }

  const db = getFirebaseAdminDb();
  const startedAt = new Date().toISOString();
  const [bookingSnapshot, registrationSnapshot] = await Promise.all([
    db.collectionGroup("bookings").where("hubId", "==", normalizedHubId).get(),
    db.collectionGroup("registrations").where("hubId", "==", normalizedHubId).get(),
  ]);
  const bookings = bookingSnapshot.docs
    .map((doc) => normalizeEventBookingRecord({ id: doc.id, ...doc.data() }))
    .filter((row) => row.hubId === normalizedHubId && row.eventId && row.bookerUserId);
  const registrations = registrationSnapshot.docs
    .map((doc) => normalizeCourseRegistrationRecord({ id: doc.id, ...doc.data() }))
    .filter((row) => row.hubId === normalizedHubId && row.courseId && row.userId);
  let synced = 0;
  let skipped = 0;

  for (const booking of bookings) {
    const result = await upsertEventBookingMemberActivity(normalizedHubId, booking.eventId, booking, {
      actorId: normalizedActorId,
      updatedAt: startedAt,
    });
    if (result) synced += 1;
    else skipped += 1;
  }

  for (const registration of registrations) {
    const result = await upsertCourseRegistrationMemberActivity(normalizedHubId, registration.courseId, registration, {
      actorId: normalizedActorId,
      updatedAt: startedAt,
    });
    if (result) synced += 1;
    else skipped += 1;
  }

  const completedAt = new Date().toISOString();

  return {
    total: bookings.length + registrations.length,
    scanned: bookingSnapshot.size + registrationSnapshot.size,
    synced,
    skipped,
    completedAt,
  };
}

export async function rebuildEventMemberActivity(hubId, eventId, options = {}) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedEventId = normalizeString(eventId);

  if (!normalizedHubId || !normalizedEventId) {
    return { scanned: 0, synced: 0, skipped: 0 };
  }

  const [event, snapshot] = await Promise.all([
    options.event ? Promise.resolve(options.event) : getEventById(normalizedHubId, normalizedEventId),
    getFirebaseAdminDb()
      .collection("hubs")
      .doc(normalizedHubId)
      .collection("events")
      .doc(normalizedEventId)
      .collection("bookings")
      .get(),
  ]);
  let synced = 0;
  let skipped = 0;

  for (const doc of snapshot.docs) {
    const booking = normalizeEventBookingRecord({
      id: doc.id,
      hubId: normalizedHubId,
      eventId: normalizedEventId,
      ...doc.data(),
    });
    const result = await upsertEventBookingMemberActivity(normalizedHubId, normalizedEventId, booking, {
      event,
      actorId: options.actorId || "member-activity-parent-refresh",
      updatedAt: options.updatedAt,
    });
    if (result) synced += 1;
    else skipped += 1;
  }

  return { scanned: snapshot.size, synced, skipped };
}

export async function rebuildCourseMemberActivity(hubId, courseId, options = {}) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedCourseId = normalizeString(courseId);

  if (!normalizedHubId || !normalizedCourseId) {
    return { scanned: 0, synced: 0, skipped: 0 };
  }

  const [course, snapshot] = await Promise.all([
    options.course ? Promise.resolve(options.course) : getCourseById(normalizedHubId, normalizedCourseId),
    getFirebaseAdminDb()
      .collection("hubs")
      .doc(normalizedHubId)
      .collection("courses")
      .doc(normalizedCourseId)
      .collection("registrations")
      .get(),
  ]);
  let synced = 0;
  let skipped = 0;

  for (const doc of snapshot.docs) {
    const registration = normalizeCourseRegistrationRecord({
      id: doc.id,
      hubId: normalizedHubId,
      courseId: normalizedCourseId,
      ...doc.data(),
    });
    const result = await upsertCourseRegistrationMemberActivity(normalizedHubId, normalizedCourseId, registration, {
      course,
      actorId: options.actorId || "member-activity-parent-refresh",
      updatedAt: options.updatedAt,
    });
    if (result) synced += 1;
    else skipped += 1;
  }

  return { scanned: snapshot.size, synced, skipped };
}
