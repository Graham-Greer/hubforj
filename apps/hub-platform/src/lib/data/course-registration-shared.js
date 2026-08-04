try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { normalizeCourseRecord, withCourseMedia } from "./course-shared.js";

export const COURSE_REGISTRATION_SUMMARY_SCHEMA_VERSION = 1;

export function normalizeString(value) {
  return String(value || "").trim();
}

export function normalizeCourseRegistrationRecord(registration, user = null) {
  if (!registration) {
    return null;
  }

  return {
    id: normalizeString(registration.id),
    hubId: normalizeString(registration.hubId),
    courseId: normalizeString(registration.courseId),
    userId: normalizeString(registration.userId),
    status: normalizeString(registration.status) || "enrolled",
    paymentStatus: normalizeString(registration.paymentStatus) || "not_required",
    attendanceStatus: normalizeString(registration.attendanceStatus) || "pending",
    attendanceMarkedAt: normalizeString(registration.attendanceMarkedAt),
    nativePaymentTransactionId: normalizeString(registration.nativePaymentTransactionId),
    nativePaymentStatus: normalizeString(registration.nativePaymentStatus),
    nativePaymentCheckoutUrl: normalizeString(registration.nativePaymentCheckoutUrl),
    nativePaymentSessionId: normalizeString(registration.nativePaymentSessionId),
    paymentCompletedAt: normalizeString(registration.paymentCompletedAt),
    notes: normalizeString(registration.notes),
    createdAt: normalizeString(registration.createdAt),
    updatedAt: normalizeString(registration.updatedAt),
    userName: normalizeString(user?.name),
    userEmail: normalizeString(user?.email).toLowerCase(),
  };
}

export async function getUsersByIds(userIds) {
  const normalizedUserIds = [...new Set(userIds.map(normalizeString).filter(Boolean))];

  if (!normalizedUserIds.length) {
    return new Map();
  }

  const db = getFirebaseAdminDb();
  const refs = normalizedUserIds.map((userId) => db.collection("users").doc(userId));
  const docs = await db.getAll(...refs);

  return new Map(
    docs
      .filter((doc) => doc.exists)
      .map((doc) => [doc.id, { id: doc.id, ...doc.data() }])
  );
}

export async function getCoursesByIds(hubId, courseIds) {
  const normalizedCourseIds = [...new Set(courseIds.map(normalizeString).filter(Boolean))];

  if (!normalizedCourseIds.length) {
    return new Map();
  }

  const db = getFirebaseAdminDb();
  const refs = normalizedCourseIds.map((courseId) =>
    db.collection("hubs").doc(hubId).collection("courses").doc(courseId)
  );
  const docs = await db.getAll(...refs);

  const normalizedCourses = docs
    .filter((doc) => doc.exists)
    .map((doc) => normalizeCourseRecord({ id: doc.id, hubId, ...doc.data() }))
    .filter(Boolean);
  const coursesWithMedia = await withCourseMedia(hubId, normalizedCourses);

  return new Map(coursesWithMedia.map((course) => [course.id, course]));
}

export async function listUserCourseRegistrationsAcrossHub(hubId, userId) {
  const db = getFirebaseAdminDb();
  const courseSnapshot = await db.collection("hubs").doc(hubId).collection("courses").get();
  const normalizedUserId = normalizeString(userId);

  if (courseSnapshot.empty) {
    return [];
  }

  const registrationSnapshots = await Promise.all(
    courseSnapshot.docs.map((courseDoc) => courseDoc.ref.collection("registrations").get())
  );

  return registrationSnapshots
    .flatMap((snapshot) =>
      snapshot.docs.map((doc) => normalizeCourseRegistrationRecord({ id: doc.id, ...doc.data() }))
    )
    .filter((row) => row.userId === normalizedUserId);
}

export async function getCourseRegistrationDoc(hubId, courseId, registrationId) {
  return getFirebaseAdminDb()
    .collection("hubs")
    .doc(hubId)
    .collection("courses")
    .doc(courseId)
    .collection("registrations")
    .doc(registrationId)
    .get();
}

export function summarizeCourseRegistrationCounterRows(rows = []) {
  return rows.reduce(
    (summary, row) => {
      const status = normalizeString(row?.status) || "enrolled";
      const attendanceStatus = normalizeString(row?.attendanceStatus) || "pending";

      summary.registrationCount += 1;
      if (status === "enrolled") summary.enrolledRegistrationCount += 1;
      if (status === "waitlisted") summary.waitlistedRegistrationCount += 1;
      if (status === "cancelled") summary.cancelledRegistrationCount += 1;
      if (attendanceStatus === "in_progress") summary.attendanceInProgressCount += 1;
      if (attendanceStatus === "completed") summary.attendanceCompletedCount += 1;
      if (attendanceStatus === "in_progress" || attendanceStatus === "completed") summary.attendanceActiveCount += 1;

      return summary;
    },
    {
      registrationCount: 0,
      enrolledRegistrationCount: 0,
      waitlistedRegistrationCount: 0,
      cancelledRegistrationCount: 0,
      attendanceInProgressCount: 0,
      attendanceCompletedCount: 0,
      attendanceActiveCount: 0,
    }
  );
}

export function getCourseRegistrationSummaryFromCourse(course = {}) {
  return {
    ...summarizeCourseRegistrationCounterRows([]),
    registrationCount: Number.parseInt(String(course?.registrationCount || "0"), 10) || 0,
    enrolledRegistrationCount: Number.parseInt(String(course?.enrolledRegistrationCount || "0"), 10) || 0,
    waitlistedRegistrationCount: Number.parseInt(String(course?.waitlistedRegistrationCount || "0"), 10) || 0,
    cancelledRegistrationCount: Number.parseInt(String(course?.cancelledRegistrationCount || "0"), 10) || 0,
    attendanceInProgressCount: Number.parseInt(String(course?.attendanceInProgressCount || "0"), 10) || 0,
    attendanceCompletedCount: Number.parseInt(String(course?.attendanceCompletedCount || "0"), 10) || 0,
    attendanceActiveCount:
      Number.parseInt(String(course?.attendanceActiveCount || "0"), 10) ||
      (Number.parseInt(String(course?.attendanceInProgressCount || "0"), 10) || 0) +
        (Number.parseInt(String(course?.attendanceCompletedCount || "0"), 10) || 0),
  };
}

export function isCourseRegistrationSummaryProjectionCurrent(course = {}) {
  return (
    Number.parseInt(String(course?.registrationSummarySchemaVersion || "0"), 10) ===
      COURSE_REGISTRATION_SUMMARY_SCHEMA_VERSION &&
    Boolean(normalizeString(course?.registrationSummaryUpdatedAt))
  );
}

async function readCourseRegistrationSummaryRows(hubId, courseId) {
  const snapshot = await getFirebaseAdminDb()
    .collection("hubs")
    .doc(hubId)
    .collection("courses")
    .doc(courseId)
    .collection("registrations")
    .select("status", "attendanceStatus")
    .get();

  return summarizeCourseRegistrationCounterRows(snapshot.docs.map((doc) => doc.data() || {}));
}

function getCounterDelta(previousRegistration, nextRegistration) {
  const previous = previousRegistration ? summarizeCourseRegistrationCounterRows([previousRegistration]) : summarizeCourseRegistrationCounterRows([]);
  const next = nextRegistration ? summarizeCourseRegistrationCounterRows([nextRegistration]) : summarizeCourseRegistrationCounterRows([]);

  return Object.fromEntries(Object.keys(next).map((key) => [key, next[key] - previous[key]]));
}

function applyCounterDelta(currentValue, delta) {
  const current = Number.parseInt(String(currentValue || "0"), 10) || 0;
  const next = current + delta;
  return Math.max(0, next);
}

export async function updateCourseRegistrationSummaryProjection(hubId, courseId, summary, options = {}) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedCourseId = normalizeString(courseId);

  if (!normalizedHubId || !normalizedCourseId) {
    return;
  }

  const now = normalizeString(options.updatedAt) || new Date().toISOString();

  await getFirebaseAdminDb()
    .collection("hubs")
    .doc(normalizedHubId)
    .collection("courses")
    .doc(normalizedCourseId)
    .set({
      ...summarizeCourseRegistrationCounterRows([]),
      ...summary,
      registrationSummarySchemaVersion: COURSE_REGISTRATION_SUMMARY_SCHEMA_VERSION,
      registrationSummaryUpdatedAt: now,
      registrationSummaryUpdatedBy: normalizeString(options.actorId) || "system",
    }, { merge: true });
}

export async function repairCourseRegistrationSummaryProjection(hubId, courseId, options = {}) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedCourseId = normalizeString(courseId);

  if (!normalizedHubId || !normalizedCourseId) {
    return summarizeCourseRegistrationCounterRows([]);
  }

  const summary = await readCourseRegistrationSummaryRows(normalizedHubId, normalizedCourseId);
  await updateCourseRegistrationSummaryProjection(normalizedHubId, normalizedCourseId, summary, {
    actorId: options.actorId || "system",
    updatedAt: options.updatedAt,
  });

  return summary;
}

export async function syncCourseRegistrationSummaryForChange({
  hubId,
  courseId,
  previousRegistration = null,
  nextRegistration = null,
  actorId = "system",
  updatedAt = "",
} = {}) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedCourseId = normalizeString(courseId);

  if (!normalizedHubId || !normalizedCourseId) {
    return;
  }

  const db = getFirebaseAdminDb();
  const courseRef = db.collection("hubs").doc(normalizedHubId).collection("courses").doc(normalizedCourseId);
  const delta = getCounterDelta(previousRegistration, nextRegistration);
  const now = normalizeString(updatedAt) || new Date().toISOString();
  const courseSnapshot = await courseRef.get();
  const course = courseSnapshot.exists ? courseSnapshot.data() || {} : {};

  if (!isCourseRegistrationSummaryProjectionCurrent(course)) {
    await repairCourseRegistrationSummaryProjection(normalizedHubId, normalizedCourseId, {
      actorId,
      updatedAt: now,
    });
    return;
  }

  await db.runTransaction(async (transaction) => {
    const courseDoc = await transaction.get(courseRef);
    const course = courseDoc.exists ? courseDoc.data() || {} : {};

    transaction.set(courseRef, {
      registrationCount: applyCounterDelta(course.registrationCount, delta.registrationCount),
      enrolledRegistrationCount: applyCounterDelta(course.enrolledRegistrationCount, delta.enrolledRegistrationCount),
      waitlistedRegistrationCount: applyCounterDelta(course.waitlistedRegistrationCount, delta.waitlistedRegistrationCount),
      cancelledRegistrationCount: applyCounterDelta(course.cancelledRegistrationCount, delta.cancelledRegistrationCount),
      attendanceInProgressCount: applyCounterDelta(course.attendanceInProgressCount, delta.attendanceInProgressCount),
      attendanceCompletedCount: applyCounterDelta(course.attendanceCompletedCount, delta.attendanceCompletedCount),
      attendanceActiveCount: applyCounterDelta(course.attendanceActiveCount, delta.attendanceActiveCount),
      registrationSummarySchemaVersion: COURSE_REGISTRATION_SUMMARY_SCHEMA_VERSION,
      registrationSummaryUpdatedAt: now,
      registrationSummaryUpdatedBy: normalizeString(actorId) || "system",
    }, { merge: true });
  });
}

export async function getCourseRegistrationDocByUser(hubId, courseId, userId) {
  const docs = await listCourseRegistrationDocsByUser(hubId, courseId, userId);
  return docs[0] || null;
}

export async function listCourseRegistrationDocsByUser(hubId, courseId, userId) {
  const snapshot = await getFirebaseAdminDb()
    .collection("hubs")
    .doc(hubId)
    .collection("courses")
    .doc(courseId)
    .collection("registrations")
    .where("userId", "==", userId)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return [];
  }

  return snapshot.docs.sort((left, right) =>
    String(right.data()?.createdAt || "").localeCompare(String(left.data()?.createdAt || ""))
  );
}

export async function getLatestCourseRegistrationDocByUser(hubId, courseId, userId) {
  const docs = await listCourseRegistrationDocsByUser(hubId, courseId, userId);
  return docs[0] || null;
}

export async function countEnrolledCourseRegistrations(hubId, courseId) {
  const snapshot = await getFirebaseAdminDb()
    .collection("hubs")
    .doc(hubId)
    .collection("courses")
    .doc(courseId)
    .collection("registrations")
    .where("status", "==", "enrolled")
    .get();

  return snapshot.size;
}
