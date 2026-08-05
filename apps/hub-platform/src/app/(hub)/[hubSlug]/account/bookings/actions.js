"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentMemberSessionForHub } from "@/lib/auth/member-session";
import { getCourseById } from "@/lib/data/courses";
import { getCourseRegistrationByUser } from "@/lib/data/course-registrations";
import { requireHubBySlug } from "@/lib/data/hubs";
import { getEventById } from "@/lib/data/events";
import { getEventBookingById } from "@/lib/data/event-bookings";
import { cancelCourseRegistrationWithRefundHandling } from "@/lib/server/course-registration-cancellation";
import { cancelEventBookingWithRefundHandling } from "@/lib/server/event-booking-cancellation";
import {
  queueCourseRegistrationCancellationNotification,
  queueEventBookingCancellationNotification,
} from "@/lib/server/booking-notification-outbox";

function normalizeString(value) {
  return String(value || "").trim();
}

function revalidateMemberBookingPaths(hubSlug, bookingHref = "") {
  revalidatePath(`/${hubSlug}/admin`);
  revalidatePath(`/${hubSlug}/account`);
  revalidatePath(`/${hubSlug}/account/bookings`);

  if (bookingHref) {
    revalidatePath(bookingHref);
  }
}

async function queueEventBookingCancellationNotificationSafely(args) {
  try {
    await queueEventBookingCancellationNotification(args);
  } catch (error) {
    console.error("[hub-platform] unable to queue member event booking cancellation notification", error);
  }
}

async function queueCourseRegistrationCancellationNotificationSafely(args) {
  try {
    await queueCourseRegistrationCancellationNotification(args);
  } catch (error) {
    console.error("[hub-platform] unable to queue member course registration cancellation notification", error);
  }
}

export async function cancelMemberBookingAction(_previousState, formData) {
  const hubSlug = normalizeString(formData.get("hubSlug"));
  const kind = normalizeString(formData.get("kind")).toLowerCase();
  const parentId = normalizeString(formData.get("parentId"));
  const registrationId = normalizeString(formData.get("registrationId"));
  const bookingHref = normalizeString(formData.get("bookingHref"));

  if (!hubSlug || !kind || !parentId || !registrationId) {
    return {
      error: "Unable to cancel this booking right now.",
      success: "",
    };
  }

  const hub = await requireHubBySlug(hubSlug);
  const memberSession = await requireCurrentMemberSessionForHub(hub, `/${hub.slug}/account/bookings`);
  const actorId = memberSession.user.id;

  try {
    if (kind === "event") {
      const booking = await getEventBookingById(hub.id, parentId, registrationId);
      const event = await getEventById(hub.id, parentId);

      if (!booking || booking.bookerUserId !== actorId || !event) {
        throw new Error("Booking not found.");
      }

      const result = await cancelEventBookingWithRefundHandling({
        hub,
        event,
        booking,
        actorId,
      });

      await queueEventBookingCancellationNotificationSafely({
        hub,
        event,
        booking: result.booking,
        bookerUser: memberSession.user,
        actorId,
        cancellation: {
          scope: "booking",
          refundSummary: result.message,
          refunded: result.refunded,
          refundState: result.refundEvaluation,
        },
      });

      revalidateMemberBookingPaths(hub.slug, bookingHref);

      return {
        error: "",
        success: result.message,
      };
    } else if (kind === "course") {
      const [registration, course] = await Promise.all([
        getCourseRegistrationByUser(hub.id, parentId, actorId),
        getCourseById(hub.id, parentId),
      ]);

      if (!registration || registration.id !== registrationId || !course) {
        throw new Error("Booking not found.");
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
        user: memberSession.user,
        actorId,
        cancellation: {
          refundSummary: result.message,
        },
      });

      revalidateMemberBookingPaths(hub.slug, bookingHref);

      return {
        error: "",
        success: result.message,
      };
    } else {
      throw new Error("Unsupported booking type.");
    }
  } catch (error) {
    return {
      error: String(error?.message || "Unable to cancel booking."),
      success: "",
    };
  }

  revalidateMemberBookingPaths(hub.slug, bookingHref);

  return {
    error: "",
    success: "Booking cancelled.",
  };
}
