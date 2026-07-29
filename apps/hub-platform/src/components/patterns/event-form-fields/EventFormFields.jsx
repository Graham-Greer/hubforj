"use client";

import { useEffect, useState } from "react";
import AdminFormSection from "@/components/patterns/admin-form-section/AdminFormSection";
import MediaAssetField from "@/components/patterns/media-asset-field/MediaAssetField";
import SectionRichTextField from "@/components/patterns/section-rich-text-field/SectionRichTextField";
import AdminSelect from "@/components/ui/admin-select/AdminSelect";
import Input from "@/components/ui/input/Input";
import SwitchField from "@/components/ui/switch-field/SwitchField";
import Textarea from "@/components/ui/textarea/Textarea";
import useAutoSlugField from "@/hooks/use-auto-slug-field";
import {
  buildEventSeriesSchedulePreview,
  recurringEventFrequencyOptions,
  recurringEventWeekdayOptions,
} from "@/lib/domain/event-series";
import {
  getHubCurrencySelectOptions,
  resolveHubCurrencyValue,
} from "@/lib/domain/currency-options";
import { normalizeEventSlug } from "@/lib/domain/events";
import {
  eventBookingModeOptions,
  eventCategoryFieldOptions,
  eventFormSections,
  eventGuestDetailsModeOptions,
  eventMaxAttendeesPerBookingOptions,
  eventPricingOptions,
  eventRefundPolicyOptions,
  eventRegistrationEligibilityOptions,
  eventScheduleModeOptions,
  eventStatusOptions,
  eventVisibilityOptions,
} from "./event-form-config";
import styles from "./EventFormFields.module.css";

export default function EventFormFields({
  hub,
  mediaAssets = [],
  mediaFolders = [],
  values,
  activeSectionId,
  onMediaAssetChange,
  onMediaAltChange,
  canUsePaidEvents = false,
  canUseGroupBookings = false,
  canUseRecurringEvents = false,
  lockScheduleModeToRecurring = false,
  paymentProcessingMode = "none",
  publishLocked = false,
  publishLockedHint = "",
}) {
  const isLockedPaidEvent = !canUsePaidEvents && values.pricingMode === "paid";
  const isExternalPayments = paymentProcessingMode === "external";
  const currencyValue = resolveHubCurrencyValue(hub, values.currency);
  const currencyOptions = getHubCurrencySelectOptions(hub, values.currency);
  const initialPricingMode =
    isLockedPaidEvent ? "paid" : canUsePaidEvents || values.pricingMode === "free" ? values.pricingMode : "free";
  const [pricingMode, setPricingMode] = useState(initialPricingMode);
  const [registrationEligibility, setRegistrationEligibility] = useState(
    values.registrationEligibility || "members-only"
  );
  const [bookingMode, setBookingMode] = useState(values.bookingMode || "single_attendee");
  const {
    titleValue,
    slugValue,
    handleTitleChange,
    handleSlugChange,
    handleSlugBlur,
  } = useAutoSlugField({
    title: values.title,
    slug: values.slug,
    normalizeSlug: normalizeEventSlug,
  });
  const [scheduleMode, setScheduleMode] = useState(values.scheduleMode || "single");

  return (
    <div className={styles.root}>
      {eventFormSections.map((section) => {
        const isActive = section.id === activeSectionId;

        return (
          <section
            key={section.id}
            id={`form-section-panel-${section.id}`}
            role="tabpanel"
            aria-labelledby={`form-section-tab-${section.id}`}
            hidden={!isActive}
            className={[styles.panel, !isActive ? styles.panelHidden : ""].filter(Boolean).join(" ")}
          >
            {section.id === "core" ? (
              <CoreDetailsSection
                hub={hub}
                mediaAssets={mediaAssets}
                mediaFolders={mediaFolders}
                values={values}
                isActive={isActive}
                onMediaAssetChange={onMediaAssetChange}
                onMediaAltChange={onMediaAltChange}
                titleValue={titleValue}
                slugValue={slugValue}
                onTitleChange={handleTitleChange}
                onSlugChange={handleSlugChange}
                onSlugBlur={handleSlugBlur}
              />
            ) : null}
            {section.id === "schedule" ? (
              <ScheduleSection
                values={values}
                isActive={isActive}
                scheduleMode={scheduleMode}
                onScheduleModeChange={setScheduleMode}
                canUseRecurringEvents={canUseRecurringEvents}
                lockScheduleModeToRecurring={lockScheduleModeToRecurring}
              />
            ) : null}
            {section.id === "registration-payment" ? (
              <RegistrationPaymentSection
                values={values}
                pricingMode={pricingMode}
                isActive={isActive}
                onPricingModeChange={setPricingMode}
                canUsePaidEvents={canUsePaidEvents}
                canUseGroupBookings={canUseGroupBookings}
                isLockedPaidEvent={isLockedPaidEvent}
                paymentProcessingMode={paymentProcessingMode}
                isExternalPayments={isExternalPayments}
                registrationEligibility={registrationEligibility}
                onRegistrationEligibilityChange={setRegistrationEligibility}
                bookingMode={bookingMode}
                onBookingModeChange={setBookingMode}
                currencyOptions={currencyOptions}
                currencyValue={currencyValue}
              />
            ) : null}
            {section.id === "publishing" ? (
              <PublishingSection values={values} isActive={isActive} publishLocked={publishLocked} publishLockedHint={publishLockedHint} />
            ) : null}
          </section>
        );
      })}
    </div>
  );
}

function CoreDetailsSection({
  hub,
  mediaAssets,
  mediaFolders,
  values,
  isActive,
  onMediaAssetChange,
  onMediaAltChange,
  titleValue,
  slugValue,
  onTitleChange,
  onSlugChange,
  onSlugBlur,
}) {
  return (
    <AdminFormSection
      title="Core details"
      description="Give the event a clear public identity before people see timing, registration, or pricing."
    >
      <MediaAssetField
        key={`${values.imageAssetId}:${values.imageAlt}`}
        label="Event image"
        hint="Select media via upload or using existing media."
        hubId={hub.id}
        hubSlug={hub.slug}
        libraryHref={`/${hub.slug}/admin/media`}
        assets={mediaAssets}
        folders={mediaFolders}
        assetId={values.imageAssetId}
        assetAlt={values.imageAlt}
        assetFieldName="imageAssetId"
        altFieldName="imageAlt"
        onAssetChange={onMediaAssetChange}
        onAltChange={onMediaAltChange}
        uploadLabel="Upload event image"
        emptyTitle="Select media"
      />

      <div className={styles.grid}>
        <Input
          name="title"
          label="Event title"
          placeholder="Community welcome evening"
          hint="Public-facing title for discovery and registrations."
          value={titleValue}
          onChange={onTitleChange}
          required={isActive}
          requiredIndicator
        />
        <Input
          name="slug"
          label="Event slug"
          placeholder="community-welcome-evening"
          hint="Leave aligned to the title or set a custom URL slug."
          value={slugValue}
          onChange={onSlugChange}
          onBlur={onSlugBlur}
          required={isActive}
          requiredIndicator
        />
        <Input
          name="location"
          label="Location"
          placeholder="Oak Hall, Main Street"
          hint="Physical venue or joining instructions."
          defaultValue={values.location}
          required={isActive}
          requiredIndicator
        />
        <AdminSelect
          name="category"
          label="Category"
          options={eventCategoryFieldOptions}
          defaultValue={values.category}
          hint="Used for public event filtering and discovery."
          required={isActive}
          requiredIndicator
        />
        <Input
          name="summary"
          label="Summary"
          placeholder="A short public-facing summary used in event listing cards."
          hint="Keep this concise so it scans well in event cards and admin lists."
          defaultValue={values.summary}
          className={styles.fullWidth}
          required={isActive}
          requiredIndicator
        />
      </div>

      <SectionRichTextField
        name="description"
        label="Description"
        hint="Main event body for the event details page. Use paragraphs and bullet lists to keep it structured and readable."
        defaultValue={values.description}
        requiredIndicator
        className={styles.sectionRichText}
      />
    </AdminFormSection>
  );
}

function ScheduleSection({
  values,
  isActive,
  scheduleMode,
  onScheduleModeChange,
  canUseRecurringEvents = false,
  lockScheduleModeToRecurring = false,
}) {
  const [startDate, setStartDate] = useState(values.startDate || "");
  const [endDate, setEndDate] = useState(values.endDate || "");
  const [startTime, setStartTime] = useState(values.startTime || "");
  const [endTime, setEndTime] = useState(values.endTime || "");
  const [recurrenceFrequency, setRecurrenceFrequency] = useState(values.recurrenceFrequency || "weekly");
  const [recurrenceInterval, setRecurrenceInterval] = useState(values.recurrenceInterval || "1");
  const [recurrenceUntilDate, setRecurrenceUntilDate] = useState(values.recurrenceUntilDate || "");
  const [recurrenceDaysOfWeek, setRecurrenceDaysOfWeek] = useState(parseRecurringWeekdayValues(values.recurrenceDaysOfWeek));
  const [recurrenceDayOfMonth, setRecurrenceDayOfMonth] = useState(
    values.recurrenceDayOfMonth || deriveDayOfMonthFromDate(values.startDate)
  );
  const isRecurring = scheduleMode === "recurring";
  const scheduleOptions = lockScheduleModeToRecurring
    ? eventScheduleModeOptions.filter((option) => option.value === "recurring")
    : canUseRecurringEvents
      ? eventScheduleModeOptions
      : eventScheduleModeOptions.filter((option) => option.value === "single");
  const preview = isRecurring
    ? buildEventSeriesSchedulePreview({
        startDate,
        startTime,
        endTime,
        recurrenceFrequency,
        recurrenceInterval,
        recurrenceStartDate: startDate,
        recurrenceUntilDate,
        recurrenceDaysOfWeek,
        recurrenceDayOfMonth,
      })
    : null;
  const resolvedEndDate = isRecurring ? startDate : (endDate || startDate);
  const hasInvalidSingleDayTimeRange =
    Boolean(startDate)
    && Boolean(startTime)
    && Boolean(endTime)
    && resolvedEndDate === startDate
    && endTime <= startTime;
  const endTimeHint = hasInvalidSingleDayTimeRange
    ? "End time must be after the start time for a single-day event."
    : "Optional end time. Requires a start time if set.";

  useEffect(() => {
    const endTimeInput = document.querySelector('input[name="endTime"]');

    if (!(endTimeInput instanceof HTMLInputElement)) {
      return;
    }

    endTimeInput.setCustomValidity(
      hasInvalidSingleDayTimeRange ? endTimeHint : ""
    );
  }, [endTimeHint, hasInvalidSingleDayTimeRange]);

  function handleStartDateChange(event) {
    const nextValue = event.target.value;
    setStartDate(nextValue);

    if ((!values.recurrenceDayOfMonth && recurrenceFrequency === "monthly") || !recurrenceDayOfMonth) {
      setRecurrenceDayOfMonth(deriveDayOfMonthFromDate(nextValue));
    }
  }

  return (
    <AdminFormSection
      title="Schedule"
      description="Set whether this is a one-off event or a repeating series, then define the timing clearly."
    >
      <div className={styles.grid}>
        <AdminSelect
          name="scheduleMode"
          label="Schedule type"
          options={scheduleOptions}
          value={lockScheduleModeToRecurring ? "recurring" : canUseRecurringEvents ? scheduleMode : "single"}
          onChange={!lockScheduleModeToRecurring && canUseRecurringEvents ? (event) => onScheduleModeChange(event.target.value) : undefined}
          disabled={!canUseRecurringEvents || lockScheduleModeToRecurring}
          hint={
            lockScheduleModeToRecurring
              ? "This workspace edits a recurring event series. Change future occurrences here rather than editing generated occurrences individually."
              : canUseRecurringEvents
              ? "Choose a one-off event or generate repeating occurrences for up to 6 months."
              : "Repeating events are available on Starter and Growth."
          }
          required={isActive}
          requiredIndicator
        />
        <Input
          name="startDate"
          label={isRecurring ? "Starts on" : "Start date"}
          type="date"
          hint={isRecurring ? "First occurrence date for the repeating schedule." : "Required first day of the event."}
          value={startDate}
          onChange={handleStartDateChange}
          required={isActive}
          requiredIndicator
        />
        {isRecurring ? (
          <Input
            name="recurrenceUntilDate"
            label="Repeat until"
            type="date"
            hint="Create occurrences up to this date, with a maximum window of 6 months."
            value={recurrenceUntilDate}
            onChange={(event) => setRecurrenceUntilDate(event.target.value)}
            required={isActive}
            requiredIndicator
          />
        ) : (
          <Input
            name="endDate"
            label="End date"
            type="date"
            hint="Optional last day of the event. Leave blank for a one-day event."
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
        )}
        <Input
          name="startTime"
          label="Start time"
          type="time"
          hint="Optional start time for the event."
          value={startTime}
          onChange={(event) => setStartTime(event.target.value)}
        />
        <Input
          name="endTime"
          label="End time"
          type="time"
          hint={endTimeHint}
          hintTone={hasInvalidSingleDayTimeRange ? "danger" : "neutral"}
          aria-invalid={hasInvalidSingleDayTimeRange ? "true" : undefined}
          value={endTime}
          onChange={(event) => {
            event.target.setCustomValidity("");
            setEndTime(event.target.value);
          }}
        />
        {isRecurring ? (
          <>
            <AdminSelect
              name="recurrenceFrequency"
              label="Repeats"
              options={recurringEventFrequencyOptions}
              value={recurrenceFrequency}
              onChange={(event) => {
                const nextValue = event.target.value;
                setRecurrenceFrequency(nextValue);

                if (nextValue === "monthly" && !values.recurrenceDayOfMonth) {
                  setRecurrenceDayOfMonth(deriveDayOfMonthFromDate(startDate));
                }
              }}
              required={isActive}
              requiredIndicator
            />
            <Input
              name="recurrenceInterval"
              label="Every"
              type="number"
              min="1"
              step="1"
              hint="Use 1 for every day, week, or month. Use 2 for every other interval."
              value={recurrenceInterval}
              onChange={(event) => setRecurrenceInterval(event.target.value)}
              required={isActive}
              requiredIndicator
            />
            {recurrenceFrequency === "weekly" ? (
              <div className={[styles.fullWidth, styles.recurrenceCard].join(" ")}>
                <div className={styles.recurrenceHeader}>
                  <strong>Days of the week</strong>
                  <span>Select the weekdays this event should repeat on.</span>
                </div>
                <div className={styles.weekdayGrid}>
                  {recurringEventWeekdayOptions.map((option) => {
                    const isSelected = recurrenceDaysOfWeek.includes(option.value);

                    return (
                      <button
                        key={option.value}
                        type="button"
                        className={[styles.weekdayButton, isSelected ? styles.weekdayButtonActive : ""].filter(Boolean).join(" ")}
                        aria-pressed={isSelected}
                        onClick={() =>
                          setRecurrenceDaysOfWeek((current) =>
                            current.includes(option.value)
                              ? current.filter((value) => value !== option.value)
                              : [...current, option.value].sort()
                          )
                        }
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
                <input type="hidden" name="recurrenceDaysOfWeek" value={recurrenceDaysOfWeek.join(",")} />
              </div>
            ) : null}
            {recurrenceFrequency === "monthly" ? (
              <Input
                name="recurrenceDayOfMonth"
                label="Day of month"
                type="number"
                min="1"
                max="31"
                hint="Months without this date will be skipped."
                value={recurrenceDayOfMonth}
                onChange={(event) => setRecurrenceDayOfMonth(event.target.value)}
                required={isActive}
                requiredIndicator
              />
            ) : null}
            <div className={[styles.fullWidth, styles.recurrenceCard].join(" ")}>
              <div className={styles.recurrenceHeader}>
                <strong>Occurrence preview</strong>
                <span>Each occurrence will be created as a separate operational event for bookings and attendance.</span>
              </div>
              {preview?.previewDates?.length ? (
                <>
                  <p className={styles.previewSummary}>
                    {preview.totalOccurrences} occurrence{preview.totalOccurrences === 1 ? "" : "s"} planned from {preview.firstOccurrenceDate} to{" "}
                    {preview.lastOccurrenceDate}.
                  </p>
                  <ul className={styles.previewList}>
                    {preview.previewDates.map((date) => (
                      <li key={date}>{date}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className={styles.previewSummary}>Choose the start date, repeat rule, and until date to generate a preview.</p>
              )}
            </div>
            <input type="hidden" name="endDate" value={startDate} />
            {recurrenceFrequency !== "weekly" ? <input type="hidden" name="recurrenceDaysOfWeek" value="" /> : null}
            {recurrenceFrequency !== "monthly" ? (
              <input type="hidden" name="recurrenceDayOfMonth" value={recurrenceDayOfMonth || deriveDayOfMonthFromDate(startDate)} />
            ) : null}
          </>
        ) : (
          <>
            <input type="hidden" name="recurrenceUntilDate" value="" />
            <input type="hidden" name="recurrenceFrequency" value={recurrenceFrequency} />
            <input type="hidden" name="recurrenceInterval" value={recurrenceInterval} />
            <input type="hidden" name="recurrenceDaysOfWeek" value="" />
            <input type="hidden" name="recurrenceDayOfMonth" value={recurrenceDayOfMonth || deriveDayOfMonthFromDate(startDate)} />
          </>
        )}
      </div>
    </AdminFormSection>
  );
}

function parseRecurringWeekdayValues(value) {
  return String(value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function deriveDayOfMonthFromDate(value) {
  const normalized = String(value || "").trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return "1";
  }

  return String(Number.parseInt(normalized.slice(-2), 10) || 1);
}

function RegistrationPaymentSection({
  values,
  pricingMode,
  isActive,
  onPricingModeChange,
  canUsePaidEvents = false,
  canUseGroupBookings = false,
  isLockedPaidEvent = false,
  paymentProcessingMode = "none",
  isExternalPayments = false,
  registrationEligibility = "members-only",
  onRegistrationEligibilityChange = () => {},
  bookingMode = "single_attendee",
  onBookingModeChange = () => {},
  currencyOptions = [],
  currencyValue = "USD",
}) {
  const isPaid = pricingMode === "paid";
  const allowsGuests = registrationEligibility === "guests-allowed";
  const pricingOptions = canUsePaidEvents
    ? eventPricingOptions
    : eventPricingOptions.filter((option) => (isLockedPaidEvent ? option.value === "paid" : option.value === "free"));

  return (
    <AdminFormSection
      title="Registration and payment"
      description="Set who can register, whether places are limited, how waitlist behavior should work, and whether payment is required."
    >
      <div className={styles.grid}>
        <Input
          name="capacity"
          label="Capacity"
          type="number"
          min="0"
          placeholder="50"
          hint="Maximum number of bookable places. Leave blank or zero for open registration."
          defaultValue={values.capacity}
        />
        <AdminSelect
          name="registrationEligibility"
          label="Eligibility"
          options={eventRegistrationEligibilityOptions}
          value={canUseGroupBookings ? registrationEligibility : "members-only"}
          onChange={(event) => {
            const nextEligibility = event.target.value;
            onRegistrationEligibilityChange(nextEligibility);

            if (nextEligibility !== "guests-allowed") {
              onBookingModeChange("single_attendee");
            }
          }}
          disabled={!canUseGroupBookings}
          hint={
            canUseGroupBookings
              ? "Members-only events allow only the booker. Growth hubs can enable guest bookings for group attendance."
              : "Guest and group bookings are available on the Growth package tier only."
          }
          required={isActive}
          requiredIndicator
        />
        {!canUseGroupBookings ? <input type="hidden" name="registrationEligibility" value="members-only" /> : null}
        {canUseGroupBookings && allowsGuests ? (
          <>
            <AdminSelect
              name="bookingMode"
              label="Booking mode"
              options={eventBookingModeOptions}
              value={bookingMode}
              onChange={(event) => onBookingModeChange(event.target.value)}
              hint="Choose whether members can book one attendee or a group in a single booking."
              required={isActive}
              requiredIndicator
            />
            {bookingMode === "group_booking" ? (
              <>
                <AdminSelect
                  name="maxAttendeesPerBooking"
                  label="Max attendees per booking"
                  options={eventMaxAttendeesPerBookingOptions}
                  defaultValue={values.maxAttendeesPerBooking || "2"}
                  hint="This includes the booking member if they are attending."
                  required={isActive}
                  requiredIndicator
                />
                <AdminSelect
                  name="guestDetailsMode"
                  label="Guest details"
                  options={eventGuestDetailsModeOptions}
                  defaultValue="name_only"
                  disabled
                  hint="V1 stores guest first and last name for attendance and reporting."
                  required={isActive}
                  requiredIndicator
                />
                <input type="hidden" name="guestDetailsMode" value="name_only" />
              </>
            ) : (
              <>
                <input type="hidden" name="maxAttendeesPerBooking" value="1" />
                <input type="hidden" name="guestDetailsMode" value="name_only" />
              </>
            )}
          </>
        ) : (
          <>
            <input type="hidden" name="bookingMode" value="single_attendee" />
            <input type="hidden" name="maxAttendeesPerBooking" value="1" />
            <input type="hidden" name="guestDetailsMode" value="name_only" />
          </>
        )}
        <AdminSelect
          name="visibility"
          label="Visibility"
          options={eventVisibilityOptions}
          defaultValue={values.visibility}
          required={isActive}
          requiredIndicator
        />
        <SwitchField
          name="allowWaitlist"
          label="Allow waitlist"
          hint="If capacity is reached, new registrations should join the waitlist instead of seeing the event as sold out."
          defaultChecked={values.allowWaitlist === true || values.allowWaitlist === "true"}
        />
        <AdminSelect
          name="pricingMode"
          label="Pricing"
          options={pricingOptions}
          defaultValue={initialPricingModeOrFallback(values.pricingMode, canUsePaidEvents, isLockedPaidEvent)}
          onChange={isLockedPaidEvent ? undefined : (event) => onPricingModeChange(event.target.value)}
          disabled={isLockedPaidEvent}
          hint={isLockedPaidEvent ? "This event stays paid, but pricing is locked until the hub is back on Starter or above." : undefined}
          required={isActive}
          requiredIndicator
        />
        {isLockedPaidEvent ? <input type="hidden" name="pricingMode" value="paid" /> : null}
        {isPaid ? (
          <>
            <Input
              name={isLockedPaidEvent ? "price_display" : "price"}
              label="Price"
              type="number"
              min="0"
              step="0.01"
              placeholder="12.00"
              hint={isLockedPaidEvent ? "Upgrade to Starter to change paid event pricing." : "Required when the event is paid."}
              defaultValue={values.price}
              disabled={isLockedPaidEvent}
              required={isActive}
              requiredIndicator
            />
            <AdminSelect
              name={isLockedPaidEvent ? "currency_display" : "currency"}
              label="Currency"
              defaultValue={currencyValue}
              options={currencyOptions}
              hint={isLockedPaidEvent ? "Paid-event currency is preserved while this hub is below Starter." : "Defaults to your hub regional settings."}
              disabled={isLockedPaidEvent}
              required={isActive}
              requiredIndicator
            />
            {isLockedPaidEvent ? <input type="hidden" name="price" value={values.price} /> : null}
            {isLockedPaidEvent ? <input type="hidden" name="currency" value={currencyValue} /> : null}
            {isExternalPayments && !isLockedPaidEvent ? (
              <>
                <Input
                  name="externalPaymentUrl"
                  label="External payment link"
                  type="url"
                  placeholder="https://payments.example.com/event"
                  hint="Optional if you are collecting payment by bank transfer or manual reference instead. Use a checkout link, payment instructions, or both."
                  defaultValue={values.externalPaymentUrl}
                  className={styles.fullWidth}
                />
                <Textarea
                  name="paymentInstructions"
                  label="Payment instructions"
                  placeholder="Explain how to pay, for example with bank transfer details, a payment reference, or what happens after checkout."
                  hint="Required only if you do not provide an external payment link. Useful for manual payment steps, confirmation timing, or support guidance."
                  defaultValue={values.paymentInstructions}
                  className={styles.fullWidth}
                  rows={3}
                />
              </>
            ) : null}
            {paymentProcessingMode === "internal" ? (
              <>
                <input type="hidden" name="refundWindowMode" value="custom" />
                <p className={styles.fullWidth}>
                  Built-in payments are active on Growth. Registrants will complete payment inside the platform when they reserve a place.
                </p>
                <Input
                  name="refundWindowHours"
                  label="Refund cutoff hours"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="48"
                  hint="Members can receive a full refund only if they cancel at least this many hours before the event start."
                  defaultValue={values.refundWindowHours || "48"}
                />
                <AdminSelect
                  name="refundPolicy"
                  label="Refund policy"
                  defaultValue={values.refundPolicy || "full_refund_before_window"}
                  hint="Choose whether this event gives a full refund before the cutoff or stays non-refundable."
                  options={eventRefundPolicyOptions}
                />
              </>
            ) : null}
          </>
        ) : (
          <>
            <input type="hidden" name="price" value="" />
            <input type="hidden" name="currency" value={currencyValue} />
            <input type="hidden" name="externalPaymentUrl" value="" />
            <input type="hidden" name="paymentInstructions" value="" />
            <input type="hidden" name="refundWindowMode" value="default" />
            <input type="hidden" name="refundWindowHours" value="48" />
            <input type="hidden" name="refundPolicy" value="full_refund_before_window" />
          </>
        )}
      </div>
    </AdminFormSection>
  );
}

function initialPricingModeOrFallback(pricingMode, canUsePaidEvents, isLockedPaidEvent) {
  if (isLockedPaidEvent) {
    return "paid";
  }

  return canUsePaidEvents || pricingMode === "free" ? pricingMode : "free";
}

function PublishingSection({ values, isActive, publishLocked = false, publishLockedHint = "" }) {
  const statusOptions = publishLocked
    ? eventStatusOptions.filter((option) => option.value !== "published")
    : eventStatusOptions;

  return (
    <AdminFormSection
      title="Publishing"
      description="Control whether the event stays in draft, goes live, or is cancelled."
    >
      <div className={styles.grid}>
        <AdminSelect
          name="status"
          label="Status"
          options={statusOptions}
          defaultValue={values.status}
          hint={publishLocked ? publishLockedHint : undefined}
          required={isActive}
          requiredIndicator
        />
      </div>
    </AdminFormSection>
  );
}
