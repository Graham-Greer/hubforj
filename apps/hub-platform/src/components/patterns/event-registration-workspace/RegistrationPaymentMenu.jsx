"use client";

import { updateRegistrationPaymentStatusAction } from "@/app/(admin)/[hubSlug]/admin/events/[eventId]/registrations/actions";
import { initialRegistrationActionState } from "@/app/(admin)/[hubSlug]/admin/events/[eventId]/registrations/form-state";
import OperationalStatusMenu from "@/components/patterns/operational-status-menu/OperationalStatusMenu";
import {
  getEventBookingPaymentLabel,
  normalizeEventBookingPaymentState,
} from "./event-registration-helpers";
import styles from "@/components/patterns/operational-status-menu/OperationalStatusMenu.module.css";

export default function RegistrationPaymentMenu({
  hubId,
  hubSlug,
  eventId,
  bookingId,
  currentPaymentStatus,
  pricingMode,
}) {
  if (pricingMode !== "paid") {
    return <span className={styles.statusValue}>Free</span>;
  }

  return (
    <PaidRegistrationPaymentMenu
      hubId={hubId}
      hubSlug={hubSlug}
      eventId={eventId}
      bookingId={bookingId}
      currentPaymentStatus={currentPaymentStatus}
      pricingMode={pricingMode}
    />
  );
}

function PaidRegistrationPaymentMenu({
  hubId,
  hubSlug,
  eventId,
  bookingId,
  currentPaymentStatus,
  pricingMode,
}) {
  const currentValue = normalizeEventBookingPaymentState({ paymentStatus: currentPaymentStatus }, pricingMode);
  const options = [
    {
      value: "pending",
      label: "Pending",
      active: currentValue === "pending",
    },
    {
      value: "paid",
      label: "Paid",
      active: currentValue === "paid",
    },
    {
      value: "failed",
      label: "Failed",
      active: currentValue === "failed",
    },
    {
      value: "partially_refunded",
      label: "Partially refunded",
      active: currentValue === "partially_refunded",
    },
    {
      value: "refunded",
      label: "Refunded",
      active: currentValue === "refunded",
    },
  ];

  return (
    <OperationalStatusMenu
      action={updateRegistrationPaymentStatusAction}
      initialState={initialRegistrationActionState}
      currentLabel={getEventBookingPaymentLabel({ paymentStatus: currentPaymentStatus }, pricingMode)}
      triggerAriaLabel="Update payment status"
      options={options}
      buildFormData={(nextValue) => {
        const formData = new FormData();
        formData.set("hubId", hubId);
        formData.set("hubSlug", hubSlug);
        formData.set("eventId", eventId);
        formData.set("bookingId", bookingId);
        formData.set("paymentStatus", nextValue);
        return formData;
      }}
    />
  );
}
