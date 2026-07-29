"use client";

import { updateRegistrationStatusAction } from "@/app/(admin)/[hubSlug]/admin/events/[eventId]/registrations/actions";
import { initialRegistrationActionState } from "@/app/(admin)/[hubSlug]/admin/events/[eventId]/registrations/form-state";
import {
  getEventBookingAttendeeStatusLabel,
  getEventBookingStatusLabel,
} from "@/lib/domain/event-bookings";
import OperationalStatusMenu from "@/components/patterns/operational-status-menu/OperationalStatusMenu";

const bookingStatusOptions = ["active", "waitlisted", "cancelled"];
const attendeeStatusOptions = ["registered", "waitlisted", "cancelled"];

export default function RegistrationStatusMenu({
  hubId,
  hubSlug,
  eventId,
  bookingId,
  attendeeId = "",
  currentStatus,
}) {
  const isAttendeeMenu = Boolean(attendeeId);
  const options = (isAttendeeMenu ? attendeeStatusOptions : bookingStatusOptions).map((value) => ({
    value,
    label: isAttendeeMenu ? getEventBookingAttendeeStatusLabel(value) : getEventBookingStatusLabel(value),
    active: currentStatus === value,
  }));

  return (
    <OperationalStatusMenu
      action={updateRegistrationStatusAction}
      initialState={initialRegistrationActionState}
      currentLabel={
        isAttendeeMenu
          ? getEventBookingAttendeeStatusLabel(currentStatus)
          : getEventBookingStatusLabel(currentStatus)
      }
      triggerAriaLabel={isAttendeeMenu ? "Update attendee status" : "Update booking status"}
      options={options}
      buildFormData={(nextValue) => {
        const formData = new FormData();
        formData.set("hubId", hubId);
        formData.set("hubSlug", hubSlug);
        formData.set("eventId", eventId);
        formData.set("bookingId", bookingId);
        if (attendeeId) {
          formData.set("attendeeId", attendeeId);
        }
        formData.set("status", nextValue);
        return formData;
      }}
    />
  );
}
