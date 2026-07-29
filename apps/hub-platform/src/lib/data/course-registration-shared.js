try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { normalizeCourseRecord, withCourseMedia } from "./course-shared.js";

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
