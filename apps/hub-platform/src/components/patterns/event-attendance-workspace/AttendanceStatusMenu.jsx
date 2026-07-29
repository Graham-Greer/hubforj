"use client";

import { updateAttendanceStatusAction } from "@/app/(admin)/[hubSlug]/admin/events/[eventId]/attendance/actions";
import { initialAttendanceActionState } from "@/app/(admin)/[hubSlug]/admin/events/[eventId]/attendance/form-state";
import OperationalStatusMenu from "@/components/patterns/operational-status-menu/OperationalStatusMenu";
import { getEventAttendanceLabel } from "./event-attendance-helpers";

const attendanceOptions = ["pending", "present", "absent"];

export default function AttendanceStatusMenu({
  hubId,
  hubSlug,
  eventId,
  bookingId,
  attendeeId,
  currentAttendanceStatus,
  disabled = false,
}) {
  const options = attendanceOptions.map((value) => ({
    value,
    label: getEventAttendanceLabel(value),
    active: currentAttendanceStatus === value,
    disabled,
  }));

  return (
    <OperationalStatusMenu
      action={updateAttendanceStatusAction}
      initialState={initialAttendanceActionState}
      currentLabel={getEventAttendanceLabel(currentAttendanceStatus)}
      triggerAriaLabel="Update attendance status"
      options={options}
      buildFormData={(nextValue) => {
        const formData = new FormData();
        formData.set("hubId", hubId);
        formData.set("hubSlug", hubSlug);
        formData.set("eventId", eventId);
        formData.set("bookingId", bookingId);
        formData.set("attendeeId", attendeeId);
        formData.set("attendanceStatus", nextValue);
        return formData;
      }}
    />
  );
}
