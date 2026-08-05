try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { revalidatePublicCoursesCache } from "@/lib/cache/public-content";
import {
  assertCourseAttendanceStatusTransition,
  assertCourseCanAcceptRegistration,
  assertCoursePaymentStatusTransition,
  assertCourseRegistrationStatusTransition,
  resolveInitialCoursePaymentStatus,
  resolveInitialCourseRegistrationStatus,
} from "@/lib/domain/course-registrations";
import { getCourseById } from "@/lib/data/courses";
import { getHubById } from "@/lib/data/hubs";
import {
  countEnrolledCourseRegistrations,
  getCourseRegistrationDoc,
  normalizeCourseRegistrationRecord,
  normalizeString,
  syncCourseRegistrationSummaryForChange,
} from "./course-registration-shared.js";
import { getCourseRegistrationByUser } from "./course-registration-queries.js";
import { getPaymentRecordBySource, upsertPaymentRecordBySource } from "./payment-records.js";
import { getFallbackRegionalMarket } from "@/lib/domain/regional-markets";

function normalizeInteger(value, fallback = 0) {
  const next = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(next) ? next : fallback;
}

function revalidateCourseListingCapacity(hubId) {
  revalidatePublicCoursesCache(hubId);
}

function parsePriceToMinor(price) {
  const numeric = Number.parseFloat(String(price || ""));

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 0;
  }

  return Math.round(numeric * 100);
}

function normalizeMoneyDisplayFromMinor(amountMinor, currency = getFallbackRegionalMarket().defaultCurrency) {
  const normalizedCurrency = normalizeString(currency).toUpperCase() || getFallbackRegionalMarket().defaultCurrency;
  const numeric = Number.isFinite(Number(amountMinor)) ? Number(amountMinor) / 100 : 0;

  return new Intl.NumberFormat(getFallbackRegionalMarket().defaultLocale, {
    style: "currency",
    currency: normalizedCurrency,
  }).format(numeric);
}

function resolvePaymentRecordReportingEligibility(amountMinor, paymentStatus) {
  if (Number.parseInt(String(amountMinor || ""), 10) <= 0) {
    return "informational_only";
  }

  return normalizeString(paymentStatus) === "not_required" ? "informational_only" : "count_in_revenue";
}

function buildCourseRegistrationLedgerState(paymentStatus, registrationStatus, amountMinor, existingRecord = {}, now = new Date().toISOString()) {
  const normalizedPaymentStatus = normalizeString(paymentStatus).toLowerCase();
  const normalizedRegistrationStatus = normalizeString(registrationStatus).toLowerCase();
  const totalAmountMinor = normalizeInteger(amountMinor, 0);
  const existingPaidAt = normalizeString(existingRecord.paidAt);
  const existingRefundedAt = normalizeString(existingRecord.refundedAt);

  if (normalizedPaymentStatus === "paid") {
    return {
      operationalStatus: "completed",
      financialStatus: "paid",
      paidAt: existingPaidAt || now,
      refundedAt: "",
      refundAmountMinor: 0,
      refundDisplay: "",
    };
  }

  if (normalizedPaymentStatus === "refunded") {
    return {
      operationalStatus: "cancelled",
      financialStatus: "refunded",
      paidAt: existingPaidAt || now,
      refundedAt: existingRefundedAt || now,
      refundAmountMinor: totalAmountMinor,
      refundDisplay:
        totalAmountMinor > 0 ? normalizeMoneyDisplayFromMinor(totalAmountMinor, existingRecord.currency || getFallbackRegionalMarket().defaultCurrency) : "",
    };
  }

  if (normalizedPaymentStatus === "failed") {
    return {
      operationalStatus: normalizedRegistrationStatus === "cancelled" ? "cancelled" : "open",
      financialStatus: "failed",
      paidAt: "",
      refundedAt: "",
      refundAmountMinor: 0,
      refundDisplay: "",
    };
  }

  if (normalizedPaymentStatus === "overdue") {
    return {
      operationalStatus: normalizedRegistrationStatus === "cancelled" ? "cancelled" : "open",
      financialStatus: "overdue",
      paidAt: "",
      refundedAt: "",
      refundAmountMinor: 0,
      refundDisplay: "",
    };
  }

  if (normalizedPaymentStatus === "not_required") {
    return {
      operationalStatus: normalizedRegistrationStatus === "cancelled" ? "cancelled" : "completed",
      financialStatus: "not_required",
      paidAt: "",
      refundedAt: "",
      refundAmountMinor: 0,
      refundDisplay: "",
    };
  }

  return {
    operationalStatus: normalizedRegistrationStatus === "cancelled" ? "cancelled" : "open",
    financialStatus: "unpaid",
    paidAt: "",
    refundedAt: "",
    refundAmountMinor: 0,
    refundDisplay: "",
  };
}

export async function syncCourseRegistrationPaymentRecord(hubId, courseId, registration, actorId = "system", options = {}) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedCourseId = normalizeString(courseId);

  if (!normalizedHubId || !normalizedCourseId || !registration?.id) {
    return null;
  }

  const [hub, course, existingRecord] = await Promise.all([
    getHubById(normalizedHubId),
    getCourseById(normalizedHubId, normalizedCourseId),
    getPaymentRecordBySource(normalizedHubId, "courseRegistration", registration.id),
  ]);
  const now = new Date().toISOString();
  const amountMinor =
    parsePriceToMinor(course?.price) || normalizeInteger(existingRecord?.amountMinor, 0);
  const currency = normalizeString(course?.currency || existingRecord?.currency).toUpperCase() || getFallbackRegionalMarket().defaultCurrency;
  const amountDisplay =
    normalizeString(course?.price) ||
    normalizeString(existingRecord?.amountDisplay) ||
    normalizeMoneyDisplayFromMinor(amountMinor, currency);
  const ledgerState = buildCourseRegistrationLedgerState(
    registration.paymentStatus,
    registration.status,
    amountMinor,
    { ...existingRecord, currency },
    now
  );
  const nativeTransactionId =
    normalizeString(registration.nativePaymentTransactionId) || normalizeString(existingRecord?.nativeTransactionId);
  const paymentMode =
    normalizeString(existingRecord?.paymentMode) || (nativeTransactionId ? "native" : "external");
  const provider =
    normalizeString(existingRecord?.provider) || (nativeTransactionId ? "stripe" : "manual");

  return upsertPaymentRecordBySource(
    normalizedHubId,
    {
      userId: normalizeString(registration.userId || existingRecord?.userId),
      kind: "course_registration",
      sourceType: "courseRegistration",
      sourceId: registration.id,
      sourceSlug: normalizeString(course?.slug) || normalizeString(existingRecord?.sourceSlug),
      title:
        normalizeString(course?.title) ||
        normalizeString(existingRecord?.title) ||
        "Course enrolment",
      description:
        normalizeString(existingRecord?.description) ||
        (normalizeString(hub?.name) ? `Course enrolment for ${hub.name}` : "Course enrolment"),
      amountMinor,
      amountDisplay,
      currency,
      paymentMode,
      provider,
      operationalStatus: ledgerState.operationalStatus,
      financialStatus: ledgerState.financialStatus,
      occurredAt:
        normalizeString(existingRecord?.occurredAt) || normalizeString(registration.createdAt) || now,
      dueAt:
        normalizeString(course?.startAt) ||
        normalizeString(existingRecord?.dueAt) ||
        normalizeString(registration.createdAt) ||
        now,
      paidAt: ledgerState.paidAt,
      refundedAt: ledgerState.refundedAt,
      refundAmountMinor: ledgerState.refundAmountMinor,
      refundDisplay: ledgerState.refundDisplay,
      nativeTransactionId,
      stripeCheckoutSessionId: normalizeString(existingRecord?.stripeCheckoutSessionId),
      stripePaymentIntentId: normalizeString(existingRecord?.stripePaymentIntentId),
      stripeRefundId: normalizeString(existingRecord?.stripeRefundId),
      courseId: normalizedCourseId,
      courseRegistrationId: registration.id,
      packageTierAtTime:
        normalizeString(existingRecord?.packageTierAtTime) || normalizeString(hub?.packageTier),
      paymentProcessingModeAtTime:
        normalizeString(existingRecord?.paymentProcessingModeAtTime) ||
        normalizeString(hub?.packagePaymentProcessingMode),
      sourceConfidence:
        normalizeString(existingRecord?.sourceConfidence) || (nativeTransactionId ? "authoritative" : "declared"),
      reportingEligibility: resolvePaymentRecordReportingEligibility(amountMinor, registration.paymentStatus),
    },
    actorId,
    options
  );
}

export async function backfillCourseRegistrationPaymentRecordsToLedger(hubId, actorId = "course-registration-payment-backfill", options = {}) {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId) {
    return { total: 0, scanned: 0, synced: 0, skipped: 0, latestSourceTimestamp: "" };
  }

  const db = getFirebaseAdminDb();
  const courseSnapshot = await db.collection("hubs").doc(normalizedHubId).collection("courses").get();
  let scanned = 0;
  let synced = 0;
  let skipped = 0;
  let latestSourceTimestamp = "";
  const since = normalizeString(options.since);

  for (const courseDoc of courseSnapshot.docs) {
    const registrationSnapshot = await courseDoc.ref.collection("registrations").get();

    for (const registrationDoc of registrationSnapshot.docs) {
      scanned += 1;
      const registration = normalizeCourseRegistrationRecord({
        id: registrationDoc.id,
        hubId: normalizedHubId,
        courseId: courseDoc.id,
        ...registrationDoc.data(),
      });
      const candidateTimestamp = normalizeString(registration.updatedAt || registration.createdAt);

      if (candidateTimestamp && (!latestSourceTimestamp || candidateTimestamp > latestSourceTimestamp)) {
        latestSourceTimestamp = candidateTimestamp;
      }

      if (since && candidateTimestamp && candidateTimestamp <= since) {
        skipped += 1;
        continue;
      }

      await syncCourseRegistrationPaymentRecord(normalizedHubId, courseDoc.id, registration, actorId, {
        rebuildPaymentSummary: false,
        syncMemberDirectory: false,
      });
      synced += 1;
    }
  }

  return {
    total: scanned,
    scanned,
    synced,
    skipped,
    latestSourceTimestamp,
  };
}

export async function createCourseRegistrationForMember(hubId, courseId, userId, actorId = "system") {
  const normalizedHubId = normalizeString(hubId);
  const normalizedCourseId = normalizeString(courseId);
  const normalizedUserId = normalizeString(userId);

  if (!normalizedHubId || !normalizedCourseId || !normalizedUserId) {
    throw new Error("Hub, course, and user ids are required.");
  }

  const [course, existingRegistration, enrolledCount] = await Promise.all([
    getCourseById(normalizedHubId, normalizedCourseId),
    getCourseRegistrationByUser(normalizedHubId, normalizedCourseId, normalizedUserId),
    countEnrolledCourseRegistrations(normalizedHubId, normalizedCourseId),
  ]);

  if (!course) {
    throw new Error("Course not found.");
  }

  assertCourseCanAcceptRegistration(course, enrolledCount);

  if (existingRegistration) {
    throw new Error("You already have an enrolment for this course.");
  }

  const now = new Date().toISOString();
  const status = resolveInitialCourseRegistrationStatus(course, enrolledCount);
  const paymentStatus = resolveInitialCoursePaymentStatus(course);
  const ref = getFirebaseAdminDb()
    .collection("hubs")
    .doc(normalizedHubId)
    .collection("courses")
    .doc(normalizedCourseId)
    .collection("registrations")
    .doc();

  const writeModel = {
    hubId: normalizedHubId,
    courseId: normalizedCourseId,
    userId: normalizedUserId,
    status,
    paymentStatus,
    attendanceStatus: "pending",
    attendanceMarkedAt: "",
    nativePaymentTransactionId: "",
    nativePaymentStatus: "",
    nativePaymentCheckoutUrl: "",
    nativePaymentSessionId: "",
    paymentCompletedAt: "",
    notes: "",
    createdAt: now,
    updatedAt: now,
    createdBy: normalizeString(actorId),
    updatedBy: normalizeString(actorId),
  };

  await ref.set(writeModel);
  await syncCourseRegistrationSummaryForChange({
    hubId: normalizedHubId,
    courseId: normalizedCourseId,
    previousRegistration: null,
    nextRegistration: { id: ref.id, ...writeModel },
    actorId,
    updatedAt: now,
  });
  revalidateCourseListingCapacity(normalizedHubId);

  return normalizeCourseRegistrationRecord({ id: ref.id, ...writeModel });
}

export async function updateCourseRegistrationStatus(hubId, courseId, registrationId, nextStatus, actorId = "system") {
  const normalizedHubId = normalizeString(hubId);
  const normalizedCourseId = normalizeString(courseId);
  const normalizedRegistrationId = normalizeString(registrationId);

  if (!normalizedHubId || !normalizedCourseId || !normalizedRegistrationId) {
    throw new Error("Hub, course, and registration ids are required.");
  }

  const doc = await getCourseRegistrationDoc(normalizedHubId, normalizedCourseId, normalizedRegistrationId);

  if (!doc.exists) {
    throw new Error("Course registration not found.");
  }

  const current = normalizeCourseRegistrationRecord({
    id: doc.id,
    hubId: normalizedHubId,
    courseId: normalizedCourseId,
    ...doc.data(),
  });
  const status = assertCourseRegistrationStatusTransition(current.status, nextStatus);
  const now = new Date().toISOString();
  const update = {
    status,
    updatedAt: now,
    updatedBy: normalizeString(actorId),
  };

  if (status === "cancelled") {
    update.cancelledAt = now;
    update.cancelledByUserId = normalizeString(actorId);
    update.attendanceStatus = "pending";
    update.attendanceMarkedAt = "";
  } else if (current.status === "cancelled") {
    update.cancelledAt = "";
    update.cancelledByUserId = "";
  }

  await doc.ref.update(update);
  await syncCourseRegistrationSummaryForChange({
    hubId: normalizedHubId,
    courseId: normalizedCourseId,
    previousRegistration: current,
    nextRegistration: { ...current, ...update },
    actorId,
    updatedAt: now,
  });
  revalidateCourseListingCapacity(normalizedHubId);

  return normalizeCourseRegistrationRecord({ ...current, ...update });
}

export async function updateCourseRegistrationAttendanceStatus(
  hubId,
  courseId,
  registrationId,
  nextStatus,
  actorId = "system"
) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedCourseId = normalizeString(courseId);
  const normalizedRegistrationId = normalizeString(registrationId);

  if (!normalizedHubId || !normalizedCourseId || !normalizedRegistrationId) {
    throw new Error("Hub, course, and registration ids are required.");
  }

  const doc = await getCourseRegistrationDoc(normalizedHubId, normalizedCourseId, normalizedRegistrationId);

  if (!doc.exists) {
    throw new Error("Course registration not found.");
  }

  const current = normalizeCourseRegistrationRecord({
    id: doc.id,
    hubId: normalizedHubId,
    courseId: normalizedCourseId,
    ...doc.data(),
  });
  const attendanceStatus = assertCourseAttendanceStatusTransition(current.attendanceStatus, nextStatus);
  const now = new Date().toISOString();
  const update = {
    attendanceStatus,
    attendanceMarkedAt: attendanceStatus === "pending" ? "" : now,
    updatedAt: now,
    updatedBy: normalizeString(actorId),
  };

  await doc.ref.update(update);
  await syncCourseRegistrationSummaryForChange({
    hubId: normalizedHubId,
    courseId: normalizedCourseId,
    previousRegistration: current,
    nextRegistration: { ...current, ...update },
    actorId,
    updatedAt: now,
  });

  return normalizeCourseRegistrationRecord({ ...current, ...update });
}

export async function updateCourseRegistrationPaymentStatus(
  hubId,
  courseId,
  registrationId,
  nextPaymentStatus,
  actorId = "system"
) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedCourseId = normalizeString(courseId);
  const normalizedRegistrationId = normalizeString(registrationId);
  const normalizedPaymentStatus = normalizeString(nextPaymentStatus).toLowerCase();

  if (!normalizedHubId || !normalizedCourseId || !normalizedRegistrationId) {
    throw new Error("Hub, course, and registration ids are required.");
  }

  const doc = await getCourseRegistrationDoc(normalizedHubId, normalizedCourseId, normalizedRegistrationId);

  if (!doc.exists) {
    throw new Error("Course registration not found.");
  }

  const current = normalizeCourseRegistrationRecord({
    id: doc.id,
    hubId: normalizedHubId,
    courseId: normalizedCourseId,
    ...doc.data(),
  });
  const paymentStatus = assertCoursePaymentStatusTransition(current.paymentStatus, normalizedPaymentStatus);
  const now = new Date().toISOString();
  const update = {
    paymentStatus,
    paymentCompletedAt:
      paymentStatus === "paid" || paymentStatus === "refunded"
        ? normalizeString(current.paymentCompletedAt) || now
        : "",
    updatedAt: now,
    updatedBy: normalizeString(actorId),
  };

  await doc.ref.update(update);

  const registration = normalizeCourseRegistrationRecord({ ...current, ...update });

  await syncCourseRegistrationPaymentRecord(normalizedHubId, normalizedCourseId, registration, actorId);

  return registration;
}

export async function updateCourseRegistrationNativePaymentState(
  hubId,
  courseId,
  registrationId,
  payload = {},
  actorId = "system"
) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedCourseId = normalizeString(courseId);
  const normalizedRegistrationId = normalizeString(registrationId);

  if (!normalizedHubId || !normalizedCourseId || !normalizedRegistrationId) {
    throw new Error("Hub, course, and registration ids are required.");
  }

  const doc = await getCourseRegistrationDoc(normalizedHubId, normalizedCourseId, normalizedRegistrationId);

  if (!doc.exists) {
    throw new Error("Course registration not found.");
  }

  const current = normalizeCourseRegistrationRecord({
    id: doc.id,
    hubId: normalizedHubId,
    courseId: normalizedCourseId,
    ...doc.data(),
  });
  const hasOwn = (key) => Object.prototype.hasOwnProperty.call(payload, key);
  const update = {
    nativePaymentTransactionId: hasOwn("nativePaymentTransactionId")
      ? normalizeString(payload.nativePaymentTransactionId)
      : current.nativePaymentTransactionId,
    nativePaymentStatus: hasOwn("nativePaymentStatus")
      ? normalizeString(payload.nativePaymentStatus)
      : current.nativePaymentStatus,
    nativePaymentCheckoutUrl: hasOwn("nativePaymentCheckoutUrl")
      ? normalizeString(payload.nativePaymentCheckoutUrl)
      : current.nativePaymentCheckoutUrl,
    nativePaymentSessionId: hasOwn("nativePaymentSessionId")
      ? normalizeString(payload.nativePaymentSessionId)
      : current.nativePaymentSessionId,
    paymentCompletedAt: hasOwn("paymentCompletedAt")
      ? normalizeString(payload.paymentCompletedAt)
      : current.paymentCompletedAt,
    updatedAt: new Date().toISOString(),
    updatedBy: normalizeString(actorId),
  };

  await doc.ref.update(update);

  return normalizeCourseRegistrationRecord({ ...current, ...update });
}
