"use server";

import { revalidatePath } from "next/cache";
import { assertActionHubIdMatches, requireHubOperatorActionAccess } from "@/lib/auth/action-access";
import { getCourseById } from "@/lib/data/courses";
import {
  getCourseRegistrationById,
  updateCourseRegistrationPaymentStatus,
  updateCourseRegistrationStatus,
} from "@/lib/data/course-registrations";
import { cancelCourseRegistrationWithRefundHandling } from "@/lib/server/course-registration-cancellation";
import {
  queueCourseRegistrationCancellationNotification,
  queueCourseRegistrationConfirmedAfterPayment,
} from "@/lib/server/booking-notification-outbox";

async function queueCourseRegistrationConfirmedAfterPaymentSafely(args) {
  try {
    await queueCourseRegistrationConfirmedAfterPayment(args);
  } catch (error) {
    console.error("[hub-platform] unable to queue course registration paid confirmation", error);
  }
}

async function queueCourseRegistrationCancellationNotificationSafely(args) {
  try {
    await queueCourseRegistrationCancellationNotification(args);
  } catch (error) {
    console.error("[hub-platform] unable to queue course registration cancellation notification", error);
  }
}

function revalidateCoursePaths(hubSlug, courseId) {
  revalidatePath(`/${hubSlug}/admin`);
  revalidatePath(`/${hubSlug}/admin/courses/${courseId}`);
  revalidatePath(`/${hubSlug}/admin/courses/${courseId}/registrations`);
  revalidatePath(`/${hubSlug}/admin/courses/${courseId}/attendance`);
}

export async function updateCourseRegistrationStatusAction(_previousState, formData) {
  const hubId = String(formData.get("hubId") || "").trim();
  const hubSlug = String(formData.get("hubSlug") || "").trim();
  const courseId = String(formData.get("courseId") || "").trim();
  const registrationId = String(formData.get("registrationId") || "").trim();
  const status = String(formData.get("status") || "").trim();

  try {
    const { hub, actorId } = await requireHubOperatorActionAccess(hubSlug);
    assertActionHubIdMatches(hub, hubId, { allowEmpty: false });

    if (status === "cancelled") {
      const [course, registration] = await Promise.all([
        getCourseById(hub.id, courseId),
        getCourseRegistrationById(hub.id, courseId, registrationId),
      ]);

      if (!course || !registration) {
        throw new Error("Course registration not found.");
      }

      const result = await cancelCourseRegistrationWithRefundHandling({
        hub,
        course,
        registration,
        actorId,
      });

      await queueCourseRegistrationCancellationNotificationSafely({
        hub,
        course,
        registration: result.registration,
        actorId,
        cancellation: {
          refundSummary: result.message,
        },
      });
    } else {
      await updateCourseRegistrationStatus(hub.id, courseId, registrationId, status, actorId);
    }
  } catch (error) {
    return { error: String(error?.message || "Unable to update course registration status.") };
  }

  revalidateCoursePaths(hubSlug, courseId);
  return { error: "" };
}

export async function updateCourseRegistrationPaymentStatusAction(_previousState, formData) {
  const hubId = String(formData.get("hubId") || "").trim();
  const hubSlug = String(formData.get("hubSlug") || "").trim();
  const courseId = String(formData.get("courseId") || "").trim();
  const registrationId = String(formData.get("registrationId") || "").trim();
  const paymentStatus = String(formData.get("paymentStatus") || "").trim();

  try {
    const { hub, actorId } = await requireHubOperatorActionAccess(hubSlug);
    assertActionHubIdMatches(hub, hubId, { allowEmpty: false });
    const previousRegistration = await getCourseRegistrationById(hub.id, courseId, registrationId);
    const updatedRegistration = await updateCourseRegistrationPaymentStatus(
      hub.id,
      courseId,
      registrationId,
      paymentStatus,
      actorId
    );

    if (
      String(previousRegistration?.paymentStatus || "").trim() !== "paid" &&
      String(updatedRegistration?.paymentStatus || "").trim() === "paid"
    ) {
      const course = await getCourseById(hub.id, courseId);

      if (hub && course) {
        await queueCourseRegistrationConfirmedAfterPaymentSafely({
          hub,
          course,
          registration: updatedRegistration,
          actorId,
        });
      }
    }
  } catch (error) {
    return { error: String(error?.message || "Unable to update course registration payment status.") };
  }

  revalidateCoursePaths(hubSlug, courseId);
  return { error: "" };
}
