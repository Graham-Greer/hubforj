try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import crypto from "node:crypto";
import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { COURSE_REGISTRATION_SUMMARY_SCHEMA_VERSION } from "@/lib/data/course-registration-shared";
import { getHubPaymentConfigurationByHubId } from "@/lib/data/hub-payment-configurations";
import { getHubById, getHubBySlug } from "@/lib/data/hubs";
import { assertHubCapability } from "@/lib/domain/package-guards";
import { assertHubNativePaymentsReady } from "@/lib/domain/hub-payment-configuration";
import {
  normalizeCreateCoursePayload,
  resolveCoursePaymentConfiguration,
} from "@/lib/domain/courses";
import { normalizeCourseRecord, normalizeString } from "./course-shared.js";
import { createMediaUsageReference, removeMediaUsageReference, syncMediaUsageReferenceForAssetChange } from "./media-usage-projection.js";

async function assertUniqueCourseSlug(hubId, slug, excludeCourseId = "") {
  const snapshot = await getFirebaseAdminDb()
    .collection("hubs")
    .doc(hubId)
    .collection("courses")
    .where("slug", "==", slug)
    .limit(1)
    .get();

  if (!snapshot.empty && snapshot.docs.some((doc) => doc.id !== excludeCourseId)) {
    throw new Error("A course with this slug already exists for this hub.");
  }
}

export async function createCourseByHubSlug(hubSlug, payload, actorId = "system") {
  const hub = await getHubBySlug(hubSlug);

  if (!hub) {
    throw new Error("Hub not found.");
  }

  const next = normalizeCreateCoursePayload(payload);
  assertHubCapability(hub, "coursesEnabled", "Courses are available on Starter and above.");
  if (next.pricingMode === "paid") {
    const paymentConfigurationRecord = await getHubPaymentConfigurationByHubId(hub.id);
    assertHubNativePaymentsReady(hub, paymentConfigurationRecord, "creating paid courses on Growth");
  }
  const paymentConfiguration = resolveCoursePaymentConfiguration(next, hub.packagePaymentProcessingMode);
  await assertUniqueCourseSlug(hub.id, next.slug);

  const now = new Date().toISOString();
  const ref = getFirebaseAdminDb()
    .collection("hubs")
    .doc(hub.id)
    .collection("courses")
    .doc(`course_${crypto.randomUUID().slice(0, 12)}`);

  const writeModel = {
    hubId: hub.id,
    slug: next.slug,
    status: next.status,
    title: next.title,
    summary: next.summary,
    description: next.description,
    imageAssetId: next.imageAssetId,
    imageAlt: next.imageAlt,
    courseType: next.courseType,
    subtypeLabel: next.subtypeLabel,
    courseLevel: next.courseLevel,
    customLevelLabel: next.customLevelLabel,
    format: next.format,
    location: next.location,
    onlineMeetingLink: next.onlineMeetingLink,
    timezone: next.timezone,
    accessInstructions: next.accessInstructions,
    startDate: next.startDate,
    endDate: next.endDate,
    startTime: next.startTime,
    endTime: next.endTime,
    startAt: next.startAt,
    endAt: next.endAt,
    registrationOpenDate: next.registrationOpenDate,
    registrationCloseDate: next.registrationCloseDate,
    sessionCount: next.sessionCount,
    capacity: next.capacity,
    pricingMode: next.pricingMode,
    price: next.pricingMode === "paid" ? next.price : "",
    currency: next.currency,
    externalPaymentUrl: paymentConfiguration.externalPaymentUrl,
    paymentInstructions: paymentConfiguration.paymentInstructions,
    requiresDeposit: next.pricingMode === "paid" ? next.requiresDeposit : false,
    depositAmount: next.pricingMode === "paid" ? next.depositAmount : "",
    paymentDeadline: next.pricingMode === "paid" ? next.paymentDeadline : "",
    refundWindowMode: next.refundWindowMode,
    refundWindowHours: next.refundWindowHours,
    refundPolicy: next.refundPolicy,
    registrationEligibility: next.registrationEligibility,
    visibility: next.visibility,
    allowWaitlist: next.allowWaitlist,
    registrationCount: 0,
    enrolledRegistrationCount: 0,
    waitlistedRegistrationCount: 0,
    cancelledRegistrationCount: 0,
    attendanceInProgressCount: 0,
    attendanceCompletedCount: 0,
    attendanceActiveCount: 0,
    registrationSummarySchemaVersion: COURSE_REGISTRATION_SUMMARY_SCHEMA_VERSION,
    registrationSummaryUpdatedAt: now,
    registrationSummaryUpdatedBy: actorId,
    createdAt: now,
    updatedAt: now,
    createdBy: actorId,
    updatedBy: actorId,
  };

  await ref.set(writeModel);
  await syncMediaUsageReferenceForAssetChange({
    hubId: hub.id,
    previousAssetId: "",
    nextAssetId: next.imageAssetId,
    usageRef: createMediaUsageReference({
      entityType: "course",
      entityId: ref.id,
      field: "image",
      label: next.title || "Course image",
      href: "",
    }),
    updatedAt: now,
  });

  return normalizeCourseRecord({ id: ref.id, ...writeModel });
}

export async function updateCourseById(hubId, courseId, payload, actorId = "system") {
  const normalizedHubId = normalizeString(hubId);
  const normalizedCourseId = normalizeString(courseId);

  if (!normalizedHubId || !normalizedCourseId) {
    throw new Error("Hub and course ids are required.");
  }

  const ref = getFirebaseAdminDb().collection("hubs").doc(normalizedHubId).collection("courses").doc(normalizedCourseId);
  const existing = await ref.get();

  if (!existing.exists) {
    throw new Error("Course not found.");
  }

  const next = normalizeCreateCoursePayload(payload);
  const hub = await getHubById(normalizedHubId);

  if (!hub) {
    throw new Error("Hub not found.");
  }

  assertHubCapability(hub, "coursesEnabled", "Courses are available on Starter and above.");
  if (next.pricingMode === "paid") {
    const paymentConfigurationRecord = await getHubPaymentConfigurationByHubId(hub.id);
    assertHubNativePaymentsReady(hub, paymentConfigurationRecord, "saving paid courses on Growth");
  }
  const paymentConfiguration = resolveCoursePaymentConfiguration(next, hub.packagePaymentProcessingMode);
  await assertUniqueCourseSlug(normalizedHubId, next.slug, normalizedCourseId);

  const update = {
    slug: next.slug,
    status: next.status,
    title: next.title,
    summary: next.summary,
    description: next.description,
    imageAssetId: next.imageAssetId,
    imageAlt: next.imageAlt,
    courseType: next.courseType,
    subtypeLabel: next.subtypeLabel,
    courseLevel: next.courseLevel,
    customLevelLabel: next.customLevelLabel,
    format: next.format,
    location: next.location,
    onlineMeetingLink: next.onlineMeetingLink,
    timezone: next.timezone,
    accessInstructions: next.accessInstructions,
    startDate: next.startDate,
    endDate: next.endDate,
    startTime: next.startTime,
    endTime: next.endTime,
    startAt: next.startAt,
    endAt: next.endAt,
    registrationOpenDate: next.registrationOpenDate,
    registrationCloseDate: next.registrationCloseDate,
    sessionCount: next.sessionCount,
    capacity: next.capacity,
    pricingMode: next.pricingMode,
    price: next.pricingMode === "paid" ? next.price : "",
    currency: next.currency,
    externalPaymentUrl: paymentConfiguration.externalPaymentUrl,
    paymentInstructions: paymentConfiguration.paymentInstructions,
    requiresDeposit: next.pricingMode === "paid" ? next.requiresDeposit : false,
    depositAmount: next.pricingMode === "paid" ? next.depositAmount : "",
    paymentDeadline: next.pricingMode === "paid" ? next.paymentDeadline : "",
    refundWindowMode: next.refundWindowMode,
    refundWindowHours: next.refundWindowHours,
    refundPolicy: next.refundPolicy,
    registrationEligibility: next.registrationEligibility,
    visibility: next.visibility,
    allowWaitlist: next.allowWaitlist,
    updatedAt: new Date().toISOString(),
    updatedBy: actorId,
  };

  await ref.update(update);
  await syncMediaUsageReferenceForAssetChange({
    hubId: normalizedHubId,
    previousAssetId: existing.data()?.imageAssetId,
    nextAssetId: next.imageAssetId,
    usageRef: createMediaUsageReference({
      entityType: "course",
      entityId: normalizedCourseId,
      field: "image",
      label: next.title || "Course image",
      href: "",
    }),
    updatedAt: update.updatedAt,
  });
  return normalizeCourseRecord({ id: normalizedCourseId, hubId: normalizedHubId, ...existing.data(), ...update });
}

export async function deleteCourseById(hubId, courseId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedCourseId = normalizeString(courseId);

  if (!normalizedHubId || !normalizedCourseId) {
    throw new Error("Hub and course ids are required.");
  }

  const db = getFirebaseAdminDb();
  const courseRef = db.collection("hubs").doc(normalizedHubId).collection("courses").doc(normalizedCourseId);
  const [existing, registrationSnapshot] = await Promise.all([
    courseRef.get(),
    courseRef.collection("registrations").limit(1).get(),
  ]);

  if (!existing.exists) {
    throw new Error("Course not found.");
  }

  if (!registrationSnapshot.empty) {
    throw new Error("This course cannot be deleted because it already has registrations.");
  }

  await courseRef.delete();
  await removeMediaUsageReference({
    hubId: normalizedHubId,
    assetId: existing.data()?.imageAssetId,
    usageRef: createMediaUsageReference({
      entityType: "course",
      entityId: normalizedCourseId,
      field: "image",
      label: normalizeString(existing.data()?.title) || "Course image",
      href: "",
    }),
  });
}
