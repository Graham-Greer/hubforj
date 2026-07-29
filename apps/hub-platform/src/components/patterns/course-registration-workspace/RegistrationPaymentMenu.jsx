"use client";

import { initialCourseRegistrationStatusFormState } from "@/app/(admin)/[hubSlug]/admin/courses/[courseId]/registrations/form-state";
import { updateCourseRegistrationPaymentStatusAction } from "@/app/(admin)/[hubSlug]/admin/courses/[courseId]/registrations/actions";
import OperationalStatusMenu from "@/components/patterns/operational-status-menu/OperationalStatusMenu";
import { getCoursePaymentStatusLabel } from "@/lib/domain/course-registrations";
import styles from "@/components/patterns/operational-status-menu/OperationalStatusMenu.module.css";

export default function RegistrationPaymentMenu({
  hubId,
  hubSlug,
  courseId,
  registrationId,
  currentPaymentStatus,
  pricingMode,
}) {
  if (pricingMode !== "paid") {
    return <span className={styles.statusValue}>Free</span>;
  }

  const options = [
    {
      value: "paid",
      label: "Paid",
      active: currentPaymentStatus === "paid",
    },
    {
      value: "unpaid",
      label: "Unpaid",
      active: currentPaymentStatus !== "paid",
    },
  ];

  return (
    <OperationalStatusMenu
      action={updateCourseRegistrationPaymentStatusAction}
      initialState={initialCourseRegistrationStatusFormState}
      currentLabel={getCoursePaymentStatusLabel(currentPaymentStatus)}
      triggerAriaLabel="Update course registration payment status"
      options={options}
      buildFormData={(nextValue) => {
        const formData = new FormData();
        formData.set("hubId", hubId);
        formData.set("hubSlug", hubSlug);
        formData.set("courseId", courseId);
        formData.set("registrationId", registrationId);
        formData.set("paymentStatus", nextValue);
        return formData;
      }}
    />
  );
}
