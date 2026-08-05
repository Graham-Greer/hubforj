"use server";

import { revalidatePath } from "next/cache";
import { assertActionHubIdMatches, requireHubOperatorActionAccess } from "@/lib/auth/action-access";
import {
  getEventBookingById,
  updateEventBookingAttendeeStatus,
  updateEventBookingPaymentState,
  updateEventBookingStatus,
} from "@/lib/data/event-bookings";
import {
  cancelEventBookingAttendeeWithRefundHandlingById,
  cancelEventBookingWithRefundHandling,
} from "@/lib/server/event-booking-cancellation";
import { getEventById } from "@/lib/data/events";
import {
  queueEventBookingCancellationNotification,
  queueEventBookingConfirmedAfterPayment,
} from "@/lib/server/booking-notification-outbox";

async function queueEventBookingConfirmedAfterPaymentSafely(args) {
  try {
    await queueEventBookingConfirmedAfterPayment(args);
  } catch (error) {
    console.error("[hub-platform] unable to queue event booking paid confirmation", error);
  }
}

async function queueEventBookingCancellationNotificationSafely(args) {
  try {
    await queueEventBookingCancellationNotification(args);
  } catch (error) {
    console.error("[hub-platform] unable to queue event booking cancellation notification", error);
  }
}

function revalidateEventPaths(hubSlug, eventId) {
  revalidatePath(`/${hubSlug}/admin`);
  revalidatePath(`/${hubSlug}/admin/events/${eventId}`);
  revalidatePath(`/${hubSlug}/admin/events/${eventId}/registrations`);
  revalidatePath(`/${hubSlug}/admin/events/${eventId}/attendance`);
}

export async function updateRegistrationStatusAction(_previousState, formData) {
  const hubId = String(formData.get("hubId") || "").trim();
  const hubSlug = String(formData.get("hubSlug") || "").trim();
  const eventId = String(formData.get("eventId") || "").trim();
  const bookingId = String(formData.get("bookingId") || "").trim();
  const attendeeId = String(formData.get("attendeeId") || "").trim();
  const status = String(formData.get("status") || "").trim();

  try {
    const { hub, actorId } = await requireHubOperatorActionAccess(hubSlug);
    assertActionHubIdMatches(hub, hubId, { allowEmpty: false });
    const event = status === "cancelled" ? await getEventById(hub.id, eventId) : null;

    if (attendeeId && status === "cancelled") {
      const result = await cancelEventBookingAttendeeWithRefundHandlingById({
        hubId: hub.id,
        eventId,
        bookingId,
        attendeeId,
        actorId,
      });

      if (hub && event) {
        await queueEventBookingCancellationNotificationSafely({
          hub,
          event,
          booking: result.booking,
          attendee: result.attendee,
          actorId,
          cancellation: {
            scope: String(result?.booking?.status || "").trim() === "cancelled" ? "booking" : "attendee",
            refunded: result.refunded,
            refundState: result.refundState,
          },
        });
      }
    } else if (attendeeId) {
      await updateEventBookingAttendeeStatus(hub.id, eventId, bookingId, attendeeId, status, actorId);
    } else if (status === "cancelled") {
      const booking = await getEventBookingById(hub.id, eventId, bookingId);

      if (!hub || !event || !booking) {
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
        actorId,
        cancellation: {
          scope: "booking",
          refundSummary: result.message,
          refunded: result.refunded,
          refundState: result.refundEvaluation,
        },
      });
    } else {
      await updateEventBookingStatus(hub.id, eventId, bookingId, status, actorId);
    }
  } catch (error) {
    return {
      error: String(error?.message || "Unable to update registration status."),
    };
  }

  revalidateEventPaths(hubSlug, eventId);

  return {
    error: "",
  };
}

export async function updateRegistrationPaymentStatusAction(_previousState, formData) {
  const hubId = String(formData.get("hubId") || "").trim();
  const hubSlug = String(formData.get("hubSlug") || "").trim();
  const eventId = String(formData.get("eventId") || "").trim();
  const bookingId = String(formData.get("bookingId") || "").trim();
  const paymentStatus = String(formData.get("paymentStatus") || "").trim();

  try {
    const { hub, actorId } = await requireHubOperatorActionAccess(hubSlug);
    assertActionHubIdMatches(hub, hubId, { allowEmpty: false });
    const previousBooking = await getEventBookingById(hub.id, eventId, bookingId);
    const updatedBooking = await updateEventBookingPaymentState(
      hub.id,
      eventId,
      bookingId,
      { paymentStatus },
      actorId
    );

    if (
      String(previousBooking?.paymentStatus || "").trim() !== "paid" &&
      String(updatedBooking?.paymentStatus || "").trim() === "paid"
    ) {
      const event = await getEventById(hub.id, eventId);

      if (hub && event) {
        await queueEventBookingConfirmedAfterPaymentSafely({
          hub,
          event,
          booking: updatedBooking,
          actorId,
        });
      }
    }
  } catch (error) {
    return {
      error: String(error?.message || "Unable to update payment status."),
    };
  }

  revalidateEventPaths(hubSlug, eventId);

  return {
    error: "",
  };
}
