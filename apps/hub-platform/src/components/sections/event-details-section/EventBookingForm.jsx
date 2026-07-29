"use client";

import { useActionState, useMemo, useState } from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Modal from "@/components/ui/modal/Modal";
import Select from "@/components/ui/select/Select";
import { formatEventDateRange } from "@/lib/domain/events";
import { formatMoneyFromMinor } from "@/lib/domain/memberships";
import { getFallbackRegionalMarket } from "@/lib/domain/regional-markets";
import styles from "./EventDetailsSection.module.css";

const initialState = {
  error: "",
};

function buildAttendeeCountOptions(maxAttendeesPerBooking) {
  const limit = Math.max(1, Number(maxAttendeesPerBooking) || 1);

  return Array.from({ length: limit }, (_, index) => {
    const value = String(index + 1);
    return {
      value,
      label: `${value} attendee${value === "1" ? "" : "s"}`,
    };
  });
}

export default function EventBookingForm({
  action,
  hubSlug,
  event,
  buttonLabel,
  availabilityHint = "",
  locale = getFallbackRegionalMarket().defaultLocale,
}) {
  const [state, formAction] = useActionState(action, initialState);
  const attendeeCountOptions = useMemo(
    () => buildAttendeeCountOptions(event?.maxAttendeesPerBooking),
    [event?.maxAttendeesPerBooking]
  );
  const [isOpen, setIsOpen] = useState(false);
  const [includePrimaryBooker, setIncludePrimaryBooker] = useState(true);
  const [attendeeCount, setAttendeeCount] = useState(attendeeCountOptions[0]?.value || "1");
  const guestCount = Math.max(0, (Number(attendeeCount) || 1) - (includePrimaryBooker ? 1 : 0));
  const eventDateLabel = useMemo(() => formatEventDateRange(event, locale), [event, locale]);
  const unitAmountMinor =
    normalizeString(event?.pricingMode) === "paid"
      ? Math.max(0, Math.round((Number.parseFloat(String(event?.price || "")) || 0) * 100))
      : 0;
  const totalAmountMinor = unitAmountMinor * Math.max(1, Number(attendeeCount) || 1);
  const totalPriceLabel =
    normalizeString(event?.pricingMode) === "paid"
      ? formatMoneyFromMinor(
          totalAmountMinor,
          normalizeString(event?.currency).toUpperCase() || getFallbackRegionalMarket().defaultCurrency,
          locale
        )
      : "Free";

  return (
    <>
      <Button type="button" size="lg" className={styles.bookingButton} onClick={() => setIsOpen(true)}>
        {buttonLabel}
      </Button>

      {isOpen ? (
        <Modal
          title="Book event"
          onClose={() => setIsOpen(false)}
          width="lg"
          variant="sheetOnMobile"
        >
          <form action={formAction} className={styles.bookingModalForm}>
            <input type="hidden" name="hubSlug" value={hubSlug} />
            <input type="hidden" name="eventId" value={event.id} />
            <input type="hidden" name="eventSlug" value={event.slug} />

            <div className={styles.bookingModalHeader}>
              <h3 className={styles.bookingModalTitle}>{event.title}</h3>
              <p className={styles.bookingModalMeta}>{eventDateLabel}</p>
            </div>

            <div className={styles.bookingFields}>
              <Select
                name="attendeeCount"
                label="How many attendees?"
                options={attendeeCountOptions}
                value={attendeeCount}
                onChange={(event) => setAttendeeCount(event.target.value)}
                hint={availabilityHint || "Each booking stays under one member account."}
                required
                requiredIndicator
              />

              <label className={styles.bookingCheckboxRow}>
                <input
                  type="checkbox"
                  name="includePrimaryBooker"
                  checked={includePrimaryBooker}
                  onChange={(event) => setIncludePrimaryBooker(event.target.checked)}
                />
                <span className={styles.bookingCheckboxLabel}>I am attending this event</span>
              </label>

              {guestCount > 0 ? (
                <div className={styles.guestFieldset}>
                  <p className={styles.guestFieldsetTitle}>Guest attendee details</p>
                  <div className={styles.guestGrid}>
                    {Array.from({ length: guestCount }, (_, index) => (
                      <div key={`guest-${index}`} className={styles.guestCard}>
                        <Input
                          name={`attendeeFullName_${index}`}
                          label={`Guest ${index + 1}`}
                          placeholder="Full name"
                          required
                          requiredIndicator
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className={styles.bookingModalSummary}>
              <div className={styles.bookingModalSummaryRow}>
                <span className={styles.bookingModalSummaryLabel}>Total price</span>
                <span className={styles.bookingModalSummaryValue}>{totalPriceLabel}</span>
              </div>
            </div>

            {state?.error ? <p className={styles.bookingError}>{state.error}</p> : null}

            <div className={styles.bookingModalActions}>
              <Button type="submit" size="lg" className={styles.bookingButton}>
                {buttonLabel}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
                Close
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </>
  );
}

function normalizeString(value) {
  return String(value || "").trim();
}
