"use server";

import { revalidatePath } from "next/cache";
import { assertActionHubIdMatches, requireHubOperatorActionAccess } from "@/lib/auth/action-access";
import { updateEventBookingAttendeeAttendanceStatus } from "@/lib/data/event-bookings";

function revalidateEventPaths(hubSlug, eventId) {
  revalidatePath(`/${hubSlug}/admin/events/${eventId}`);
  revalidatePath(`/${hubSlug}/admin/events/${eventId}/registrations`);
  revalidatePath(`/${hubSlug}/admin/events/${eventId}/attendance`);
}

export async function updateAttendanceStatusAction(_previousState, formData) {
  const hubId = String(formData.get("hubId") || "").trim();
  const hubSlug = String(formData.get("hubSlug") || "").trim();
  const eventId = String(formData.get("eventId") || "").trim();
  const bookingId = String(formData.get("bookingId") || "").trim();
  const attendeeId = String(formData.get("attendeeId") || "").trim();
  const attendanceStatus = String(formData.get("attendanceStatus") || "").trim();

  try {
    const { hub, actorId } = await requireHubOperatorActionAccess(hubSlug);
    assertActionHubIdMatches(hub, hubId, { allowEmpty: false });
    await updateEventBookingAttendeeAttendanceStatus(
      hub.id,
      eventId,
      bookingId,
      attendeeId,
      attendanceStatus,
      actorId
    );
  } catch (error) {
    return {
      error: String(error?.message || "Unable to update attendance status."),
    };
  }

  revalidateEventPaths(hubSlug, eventId);

  return {
    error: "",
  };
}
