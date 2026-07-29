"use client";

import { initialCourseRegistrationStatusFormState } from "@/app/(admin)/[hubSlug]/admin/courses/[courseId]/registrations/form-state";
import { updateCourseRegistrationStatusAction } from "@/app/(admin)/[hubSlug]/admin/courses/[courseId]/registrations/actions";
import OperationalStatusMenu from "@/components/patterns/operational-status-menu/OperationalStatusMenu";
import { getCourseRegistrationStatusLabel } from "@/lib/domain/course-registrations";

const statusOptions = ["enrolled", "waitlisted", "cancelled"];

export default function RegistrationStatusMenu({ hubId, hubSlug, courseId, registrationId, currentStatus }) {
  const options = statusOptions.map((value) => ({
    value,
    label: getCourseRegistrationStatusLabel(value),
    active: currentStatus === value,
  }));

  return (
    <OperationalStatusMenu
      action={updateCourseRegistrationStatusAction}
      initialState={initialCourseRegistrationStatusFormState}
      currentLabel={getCourseRegistrationStatusLabel(currentStatus)}
      triggerAriaLabel="Update course registration status"
      options={options}
      buildFormData={(nextValue) => {
        const formData = new FormData();
        formData.set("hubId", hubId);
        formData.set("hubSlug", hubSlug);
        formData.set("courseId", courseId);
        formData.set("registrationId", registrationId);
        formData.set("status", nextValue);
        return formData;
      }}
    />
  );
}
