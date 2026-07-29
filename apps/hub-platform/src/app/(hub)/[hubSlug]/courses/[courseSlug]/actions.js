"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireHubBySlug } from "@/lib/data/hubs";
import { getCourseBySlug } from "@/lib/data/courses";
import { createCourseRegistrationForMember, getCourseRegistrationByUser } from "@/lib/data/course-registrations";
import { requireCurrentMemberSessionForHub } from "@/lib/auth/member-session";
import { getRequestHostWithPortFromHeaders, resolveHubRuntimeRouteMode } from "@/lib/domain/hub-hosts";
import { startCourseRegistrationCheckout } from "@/lib/server/course-registration-checkout";
import { queueInitialCourseRegistrationNotification } from "@/lib/server/booking-notification-outbox";

function normalizeString(value) {
  return String(value || "").trim();
}

async function queueInitialCourseRegistrationNotificationSafely(args) {
  try {
    await queueInitialCourseRegistrationNotification(args);
  } catch (error) {
    console.error("[hub-platform] unable to queue initial course registration notification", error);
  }
}

export async function enrolPublicCourseAction(formData) {
  const hubSlug = normalizeString(formData.get("hubSlug"));
  const courseId = normalizeString(formData.get("courseId"));
  const courseSlug = normalizeString(formData.get("courseSlug"));

  if (!hubSlug || !courseId || !courseSlug) {
    redirect(hubSlug ? `/${hubSlug}/courses` : "/");
  }

  const hub = await requireHubBySlug(hubSlug);
  const detailPath = `/${hub.slug}/courses/${courseSlug}`;
  const nextStepsPath = `/${hub.slug}/courses/${courseSlug}/enrolment/next-steps`;
  const memberSession = await requireCurrentMemberSessionForHub(hub, detailPath);
  const course = await getCourseBySlug(hub.slug, courseSlug);

  if (!course || course.id !== courseId) {
    redirect(detailPath);
  }

  let registration;

  try {
    registration = await createCourseRegistrationForMember(hub.id, courseId, memberSession.user.id, memberSession.user.id);
  } catch (error) {
    const message = String(error?.message || "");

    if (message.includes("already have an enrolment")) {
      registration = await getCourseRegistrationByUser(hub.id, courseId, memberSession.user.id);
    } else {
      throw error;
    }
  }

  if (
    hub.packagePaymentProcessingMode === "internal" &&
    normalizeString(course.pricingMode) === "paid" &&
    normalizeString(registration?.status) === "enrolled" &&
    normalizeString(registration?.paymentStatus) !== "paid" &&
    normalizeString(registration?.nativePaymentStatus) !== "checkout_open" &&
    normalizeString(registration?.nativePaymentStatus) !== "payment_received"
  ) {
    const requestHeaders = await headers();
    const requestHost = getRequestHostWithPortFromHeaders(requestHeaders);
    const routeMode = resolveHubRuntimeRouteMode(requestHost);
    const checkout = await startCourseRegistrationCheckout({
      hub,
      course,
      registration,
      memberSession,
      actorId: memberSession.user.id,
      requestHost,
      routeMode,
    });

    revalidatePath(`/${hub.slug}/courses`);
    revalidatePath(detailPath);
    revalidatePath(`/${hub.slug}/account/bookings`);
    revalidatePath(nextStepsPath);
    await queueInitialCourseRegistrationNotificationSafely({
      hub,
      course,
      registration,
      user: memberSession.user,
      actorId: memberSession.user.id,
      paymentUrl: checkout.checkoutUrl,
    });
    redirect(checkout.checkoutUrl);
  }

  revalidatePath(`/${hub.slug}/courses`);
  revalidatePath(detailPath);
  revalidatePath(`/${hub.slug}/account/bookings`);
  revalidatePath(nextStepsPath);
  await queueInitialCourseRegistrationNotificationSafely({
    hub,
    course,
    registration,
    user: memberSession.user,
    actorId: memberSession.user.id,
  });
  redirect(nextStepsPath);
}
