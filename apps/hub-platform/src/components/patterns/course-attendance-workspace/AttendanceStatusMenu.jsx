"use client";

import { initialCourseAttendanceStatusFormState } from "@/app/(admin)/[hubSlug]/admin/courses/[courseId]/attendance/form-state";
import { updateCourseAttendanceStatusAction } from "@/app/(admin)/[hubSlug]/admin/courses/[courseId]/attendance/actions";
import OperationalStatusMenu from "@/components/patterns/operational-status-menu/OperationalStatusMenu";
import {
  courseAttendanceTransitionRequiresConfirmation,
  getAllowedCourseAttendanceTransitions,
  getCourseAttendanceStatusLabel,
} from "@/lib/domain/course-registrations";

export default function AttendanceStatusMenu({
  hubId,
  hubSlug,
  courseId,
  registrationId,
  currentAttendanceStatus,
  disabled = false,
}) {
  const options = getAllowedCourseAttendanceTransitions(currentAttendanceStatus).map((value) => ({
    value,
    label: getCourseAttendanceStatusLabel(value),
    active: false,
    disabled,
    confirmation: courseAttendanceTransitionRequiresConfirmation(currentAttendanceStatus, value)
      ? {
          title: "Mark learner as withdrawn?",
          body: [
            "This will mark the learner as withdrawn and show them as no longer progressing on this course.",
            "Use this only when you are confident the learner should not remain active on the course.",
          ],
          confirmLabel: "Confirm withdrawal",
        }
      : null,
  }));

  return (
    <OperationalStatusMenu
      action={updateCourseAttendanceStatusAction}
      initialState={initialCourseAttendanceStatusFormState}
      currentLabel={getCourseAttendanceStatusLabel(currentAttendanceStatus)}
      triggerAriaLabel="Update course attendance status"
      options={options}
      buildFormData={(nextValue) => {
        const formData = new FormData();
        formData.set("hubId", hubId);
        formData.set("hubSlug", hubSlug);
        formData.set("courseId", courseId);
        formData.set("registrationId", registrationId);
        formData.set("attendanceStatus", nextValue);
        return formData;
      }}
    />
  );
}
