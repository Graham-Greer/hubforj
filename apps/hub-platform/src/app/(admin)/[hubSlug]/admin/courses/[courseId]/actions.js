"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertActionHubIdMatches, requireHubOperatorActionAccess } from "@/lib/auth/action-access";
import { revalidatePublicCoursesCache } from "@/lib/cache/public-content";
import { deleteCourseById, getCourseById, updateCourseById } from "@/lib/data/courses";
import { assertHubRegionalSetupComplete } from "@/lib/domain/hub-regional-setup";
import { queueCourseCancelledByAdminNotifications } from "@/lib/server/booking-notification-outbox";

function revalidateCoursePaths(hubSlug, courseId, hubId) {
  revalidatePath(`/${hubSlug}/admin/courses`);
  revalidatePath(`/${hubSlug}/admin/courses/${courseId}`);
  revalidatePath(`/${hubSlug}/courses`);
  revalidatePath(`/${hubSlug}/admin/media`);
  revalidatePublicCoursesCache(hubId);
}

async function queueCourseCancelledByAdminNotificationsSafely(args) {
  try {
    await queueCourseCancelledByAdminNotifications(args);
  } catch (error) {
    console.error("[hub-platform] unable to queue whole-course cancellation notifications", error);
  }
}

export async function updateCourseAction(_previousState, formData) {
  const hubId = String(formData.get("hubId") || "").trim();
  const hubSlug = String(formData.get("hubSlug") || "").trim();
  const courseId = String(formData.get("courseId") || "").trim();
  const previousSlug = String(formData.get("previousSlug") || "").trim();
  const values = {
    title: String(formData.get("title") || ""),
    slug: String(formData.get("slug") || ""),
    summary: String(formData.get("summary") || ""),
    description: String(formData.get("description") || ""),
    imageAssetId: String(formData.get("imageAssetId") || ""),
    imageAlt: String(formData.get("imageAlt") || ""),
    courseType: String(formData.get("courseType") || ""),
    subtypeLabel: String(formData.get("subtypeLabel") || ""),
    courseLevel: String(formData.get("courseLevel") || ""),
    customLevelLabel: String(formData.get("customLevelLabel") || ""),
    format: String(formData.get("format") || "in-person"),
    location: String(formData.get("location") || ""),
    onlineMeetingLink: String(formData.get("onlineMeetingLink") || ""),
    timezone: String(formData.get("timezone") || ""),
    accessInstructions: String(formData.get("accessInstructions") || ""),
    startDate: String(formData.get("startDate") || ""),
    endDate: String(formData.get("endDate") || ""),
    startTime: String(formData.get("startTime") || ""),
    endTime: String(formData.get("endTime") || ""),
    registrationOpenDate: String(formData.get("registrationOpenDate") || ""),
    registrationCloseDate: String(formData.get("registrationCloseDate") || ""),
    sessionCount: String(formData.get("sessionCount") || ""),
    capacity: String(formData.get("capacity") || ""),
    pricingMode: String(formData.get("pricingMode") || "free"),
    price: String(formData.get("price") || ""),
    currency: String(formData.get("currency") || "USD"),
    externalPaymentUrl: String(formData.get("externalPaymentUrl") || ""),
    paymentInstructions: String(formData.get("paymentInstructions") || ""),
    requiresDeposit: String(formData.get("requiresDeposit") || "false"),
    depositAmount: String(formData.get("depositAmount") || ""),
    paymentDeadline: String(formData.get("paymentDeadline") || ""),
    refundWindowMode: String(formData.get("refundWindowMode") || "custom"),
    refundWindowHours: String(formData.get("refundWindowHours") || "48"),
    refundPolicy: String(formData.get("refundPolicy") || "full_refund_before_window"),
    registrationEligibility: "members-only",
    visibility: String(formData.get("visibility") || "public"),
    allowWaitlist: String(formData.get("allowWaitlist") || "true"),
    status: String(formData.get("status") || "draft"),
  };
  let course;
  let previousCourse = null;

  try {
    const { hub, actorId } = await requireHubOperatorActionAccess(hubSlug);
    assertActionHubIdMatches(hub, hubId, { allowEmpty: false });
    assertHubRegionalSetupComplete(hub);
    previousCourse = await getCourseById(hub.id, courseId);
    course = await updateCourseById(hub.id, courseId, values, actorId);

    if (
      String(previousCourse?.status || "").trim() !== "cancelled" &&
      String(course?.status || "").trim() === "cancelled"
    ) {
      await queueCourseCancelledByAdminNotificationsSafely({
        hub,
        course,
        actorId,
      });
    }
  } catch (error) {
    return { error: String(error?.message || "Unable to update course."), success: "", values };
  }

  revalidateCoursePaths(hubSlug, courseId, hubId);
  if (previousSlug) {
    revalidatePath(`/${hubSlug}/courses/${previousSlug}`);
  }
  if (course?.slug) {
    revalidatePath(`/${hubSlug}/courses/${course.slug}`);
  }
  return { error: "", success: "Course details updated.", values };
}

export async function deleteCourseAction(_previousState, formData) {
  const hubId = String(formData.get("hubId") || "").trim();
  const hubSlug = String(formData.get("hubSlug") || "").trim();
  const courseId = String(formData.get("courseId") || "").trim();

  if (!hubId || !hubSlug || !courseId) {
    return { error: "Course context is required." };
  }

  try {
    const { hub } = await requireHubOperatorActionAccess(hubSlug);
    assertActionHubIdMatches(hub, hubId, { allowEmpty: false });
    assertHubRegionalSetupComplete(hub);
    await deleteCourseById(hub.id, courseId);
  } catch (error) {
    return { error: String(error?.message || "Unable to delete course.") };
  }

  revalidateCoursePaths(hubSlug, courseId, hubId);
  redirect(`/${hubSlug}/admin/courses?deleted=1`);
}
