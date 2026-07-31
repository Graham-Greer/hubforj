try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { formatCourseDateRange, getCourseFormatLabel, getCourseTypeLabel } from "@/lib/domain/courses";
import { getFallbackRegionalMarket } from "@/lib/domain/regional-markets";
import {
  countEnrolledCourseRegistrations,
  getCourseRegistrationDoc,
  getLatestCourseRegistrationDocByUser,
  getCoursesByIds,
  getUsersByIds,
  listCourseRegistrationDocsByUser,
  listUserCourseRegistrationsAcrossHub,
  normalizeCourseRegistrationRecord,
  normalizeString,
} from "./course-registration-shared.js";

export async function listCourseRegistrations(hubId, courseId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedCourseId = normalizeString(courseId);

  if (!normalizedHubId || !normalizedCourseId) {
    return [];
  }

  const snapshot = await getFirebaseAdminDb()
    .collection("hubs")
    .doc(normalizedHubId)
    .collection("courses")
    .doc(normalizedCourseId)
    .collection("registrations")
    .orderBy("createdAt", "desc")
    .get();

  const baseRows = snapshot.docs.map((doc) =>
    normalizeCourseRegistrationRecord({
      id: doc.id,
      hubId: normalizedHubId,
      courseId: normalizedCourseId,
      ...doc.data(),
    })
  );

  const usersById = await getUsersByIds(baseRows.map((row) => row.userId));

  return baseRows.map((row) => normalizeCourseRegistrationRecord(row, usersById.get(row.userId)));
}

export async function listCourseRegistrationsByUser(hubId, userId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedUserId = normalizeString(userId);

  if (!normalizedHubId || !normalizedUserId) {
    return [];
  }

  const rows = (await listUserCourseRegistrationsAcrossHub(normalizedHubId, normalizedUserId)).filter(
    (row) => row.hubId === normalizedHubId && row.courseId
  );
  const coursesById = await getCoursesByIds(
    normalizedHubId,
    rows.map((row) => row.courseId)
  );

  return rows
    .map((row) => {
      const course = coursesById.get(row.courseId);

      return {
        ...row,
        courseTitle: normalizeString(course?.title),
        courseSlug: normalizeString(course?.slug),
        courseImageUrl: normalizeString(course?.imageAsset?.publicUrl),
        courseImageAlt: normalizeString(course?.imageAlt || course?.imageAsset?.alt || course?.title),
        courseStartAt: normalizeString(course?.startAt),
        courseEndAt: normalizeString(course?.endAt),
        courseScheduleSummary: formatCourseDateRange(course),
        courseFormat: normalizeString(course?.format),
        courseFormatLabel: getCourseFormatLabel(course?.format),
        courseLocation: normalizeString(course?.location),
        price: normalizeString(course?.price),
        currency: normalizeString(course?.currency).toUpperCase() || getFallbackRegionalMarket().defaultCurrency,
        pricingMode: normalizeString(course?.pricingMode) || "free",
        externalPaymentUrl: normalizeString(course?.externalPaymentUrl),
        paymentInstructions: normalizeString(course?.paymentInstructions),
        refundWindowMode: normalizeString(course?.refundWindowMode) || "default",
        refundWindowHours: Number.parseInt(String(course?.refundWindowHours || ""), 10) || 48,
        refundPolicy: normalizeString(course?.refundPolicy) || "full_refund_before_window",
      };
    })
    .sort((left, right) => String(left.courseStartAt || "").localeCompare(String(right.courseStartAt || "")));
}

export async function listCoursePaymentItemsByHub(hubId) {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId) {
    return [];
  }

  const db = getFirebaseAdminDb();
  const courseSnapshot = await db.collection("hubs").doc(normalizedHubId).collection("courses").get();

  if (courseSnapshot.empty) {
    return [];
  }

  const registrationSnapshots = await Promise.all(
    courseSnapshot.docs.map((courseDoc) => courseDoc.ref.collection("registrations").get())
  );

  const baseRows = registrationSnapshots
    .flatMap((snapshot) =>
      snapshot.docs.map((doc) => normalizeCourseRegistrationRecord({ id: doc.id, ...doc.data() }))
    )
    .filter((row) => row.hubId === normalizedHubId && row.courseId);

  const [coursesById, usersById] = await Promise.all([
    getCoursesByIds(normalizedHubId, baseRows.map((row) => row.courseId)),
    getUsersByIds(baseRows.map((row) => row.userId)),
  ]);

  return baseRows
    .map((row) => {
      const course = coursesById.get(row.courseId);
      const user = usersById.get(row.userId);

      return {
        id: `course_${row.id}`,
        recordId: row.id,
        kind: "course",
        title: normalizeString(course?.title) || getCourseTypeLabel(course) || "Course enrolment",
        status: row.status,
        paymentStatus: row.paymentStatus,
        amount: normalizeString(course?.price),
        currency: normalizeString(course?.currency).toUpperCase() || getFallbackRegionalMarket().defaultCurrency,
        dueDate: normalizeString(course?.startAt),
        detail: formatCourseDateRange(course) || "Course enrolment payment state.",
        userId: row.userId,
        userName: normalizeString(user?.name),
        userEmail: normalizeString(user?.email).toLowerCase(),
        courseId: row.courseId,
        nativePaymentTransactionId: normalizeString(row.nativePaymentTransactionId),
        nativePaymentStatus: normalizeString(row.nativePaymentStatus),
        paymentCompletedAt: normalizeString(row.paymentCompletedAt),
        createdAt: normalizeString(row.createdAt),
        updatedAt: normalizeString(row.updatedAt),
      };
    });
}

export async function listCourseRegistrationPaymentAttentionUserIdsByHub(hubId) {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId) {
    return [];
  }

  const snapshot = await getFirebaseAdminDb()
    .collectionGroup("registrations")
    .where("hubId", "==", normalizedHubId)
    .select("userId", "courseId", "status", "paymentStatus")
    .get();

  return snapshot.docs
    .map((doc) => normalizeCourseRegistrationRecord({ id: doc.id, ...doc.data() }))
    .filter((row) => row.courseId && row.status !== "cancelled" && ["unpaid", "overdue", "failed"].includes(row.paymentStatus))
    .map((row) => row.userId)
    .filter(Boolean);
}

export async function getCourseRegistrationByUser(hubId, courseId, userId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedCourseId = normalizeString(courseId);
  const normalizedUserId = normalizeString(userId);

  if (!normalizedHubId || !normalizedCourseId || !normalizedUserId) {
    return null;
  }

  const docs = await listCourseRegistrationDocsByUser(normalizedHubId, normalizedCourseId, normalizedUserId);

  if (!docs.length) {
    return null;
  }

  for (const candidate of docs) {
    const normalized = normalizeCourseRegistrationRecord({
      id: candidate.id,
      hubId: normalizedHubId,
      courseId: normalizedCourseId,
      ...candidate.data(),
    });

    if (normalizeString(normalized?.status) !== "cancelled") {
      return normalized;
    }
  }

  return null;
}

export async function getLatestCourseRegistrationByUser(hubId, courseId, userId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedCourseId = normalizeString(courseId);
  const normalizedUserId = normalizeString(userId);

  if (!normalizedHubId || !normalizedCourseId || !normalizedUserId) {
    return null;
  }

  const doc = await getLatestCourseRegistrationDocByUser(normalizedHubId, normalizedCourseId, normalizedUserId);

  if (!doc) {
    return null;
  }

  return normalizeCourseRegistrationRecord({
    id: doc.id,
    hubId: normalizedHubId,
    courseId: normalizedCourseId,
    ...doc.data(),
  });
}

export async function getCourseRegistrationById(hubId, courseId, registrationId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedCourseId = normalizeString(courseId);
  const normalizedRegistrationId = normalizeString(registrationId);

  if (!normalizedHubId || !normalizedCourseId || !normalizedRegistrationId) {
    return null;
  }

  const doc = await getCourseRegistrationDoc(normalizedHubId, normalizedCourseId, normalizedRegistrationId);

  if (!doc.exists) {
    return null;
  }

  return normalizeCourseRegistrationRecord({
    id: doc.id,
    hubId: normalizedHubId,
    courseId: normalizedCourseId,
    ...doc.data(),
  });
}

export { countEnrolledCourseRegistrations };
