"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import AdminDiscardChangesButton from "@/components/patterns/admin-form-runtime/AdminDiscardChangesButton";
import AdminFormFooter from "@/components/patterns/admin-form-footer/AdminFormFooter";
import Button from "@/components/ui/button/Button";
import EventFormFields from "@/components/patterns/event-form-fields/EventFormFields";
import { eventFormSections } from "@/components/patterns/event-form-fields/event-form-config";
import FormSectionTabs from "@/components/patterns/form-section-tabs/FormSectionTabs";
import PackageUpgradeNotice from "@/components/patterns/package-upgrade-notice/PackageUpgradeNotice";
import SubmitButton from "@/components/ui/submit-button/SubmitButton";
import useDirtyFormState from "@/hooks/use-dirty-form-state";
import { parseSectionRichTextInput } from "@/lib/domain/section-rich-text";
import {
  createFormSnapshotFromKeys,
  createSavedSnapshotFromKeys,
} from "@/lib/forms/admin-form-snapshots";
import { initialEditEventSeriesFormState } from "./form-state";
import { updateEventSeriesAction } from "./actions";
import styles from "../../create/page.module.css";

const fieldKeys = Object.keys(initialEditEventSeriesFormState.values);
const editTabs = eventFormSections.map(({ id, label }) => ({ id, label }));

function createSavedValuesSnapshot(values) {
  return createSavedSnapshotFromKeys(
    fieldKeys,
    initialEditEventSeriesFormState.values,
    values,
    (base) =>
      fieldKeys.reduce((snapshot, key) => {
        if (key === "description") {
          snapshot[key] = JSON.stringify(parseSectionRichTextInput(base[key]));
          return snapshot;
        }

        snapshot[key] = String(base[key] || "");
        return snapshot;
      }, {})
  );
}

function createFormSnapshot(form) {
  return createFormSnapshotFromKeys(form, fieldKeys);
}

function mapSeriesToFormValues(series) {
  return {
    scheduleMode: "recurring",
    title: series.title,
    slug: series.slugBase,
    summary: series.summary,
    description: series.description,
    imageAssetId: series.imageAssetId || series.imageAsset?.id || "",
    imageAlt: series.imageAlt || series.imageAsset?.alt || "",
    location: series.location,
    startDate: series.recurrenceStartDate,
    endDate: series.recurrenceStartDate,
    startTime: series.startTime,
    endTime: series.endTime,
    recurrenceUntilDate: series.recurrenceUntilDate,
    recurrenceFrequency: series.recurrenceFrequency || "weekly",
    recurrenceInterval: String(series.recurrenceInterval || 1),
    recurrenceDaysOfWeek: Array.isArray(series.recurrenceDaysOfWeek) ? series.recurrenceDaysOfWeek.join(",") : "",
    recurrenceDayOfMonth: String(series.recurrenceDayOfMonth || 1),
    capacity: String(series.capacity || ""),
    pricingMode: series.pricingMode,
    price: series.price,
    currency: series.currency,
    externalPaymentUrl: series.externalPaymentUrl || "",
    paymentInstructions: series.paymentInstructions || "",
    refundWindowMode: series.refundWindowMode || "default",
    refundWindowHours: String(series.refundWindowHours || 48),
    refundPolicy: series.refundPolicy || "full_refund_before_window",
    registrationEligibility: series.registrationEligibility,
    bookingMode: series.bookingMode || "single_attendee",
    maxAttendeesPerBooking: String(series.maxAttendeesPerBooking || 2),
    guestDetailsMode: series.guestDetailsMode || "name_only",
    visibility: series.visibility,
    allowWaitlist: String(series.allowWaitlist !== false),
    category: series.category,
    status: series.status,
  };
}

export default function EditEventSeriesForm({ hub, series, mediaAssets, mediaFolders }) {
  const [activeSectionId, setActiveSectionId] = useState(editTabs[0].id);
  const canUsePaidEvents = hub?.packageCapabilities?.paidEventsEnabled === true;
  const canUseGroupBookings = hub?.packageCapabilities?.groupBookingsEnabled === true;
  const canUseRecurringEvents = hub?.packageCapabilities?.recurringEventsEnabled === true;
  const paymentProcessingMode = hub?.packagePaymentProcessingMode || "none";
  const initialState = {
    ...initialEditEventSeriesFormState,
    values: {
      ...initialEditEventSeriesFormState.values,
      ...mapSeriesToFormValues(series),
    },
  };
  const initialSavedSnapshot = createSavedValuesSnapshot(initialState.values);
  const [state, formAction] = useActionState(updateEventSeriesAction, initialState);
  const initialValuesRef = useRef(initialState.values);
  const feedbackRef = useRef(null);
  const values = {
    ...initialState.values,
    ...(state?.values || {}),
  };
  const isLockedPaidEvent = !canUsePaidEvents && values.pricingMode === "paid";
  const {
    formRef,
    isDirty,
    updateDirtyState,
    scheduleDirtyStateUpdate,
    markSaved,
  } = useDirtyFormState({
    initialSnapshot: initialSavedSnapshot,
    createFormSnapshot,
  });

  useEffect(() => {
    if (!feedbackRef.current || (!state?.error && !state?.success)) {
      return;
    }

    feedbackRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [state?.error, state?.success]);

  useEffect(() => {
    if (!state?.success || !state?.values) {
      return;
    }

    const nextSnapshot = createSavedValuesSnapshot({
      ...initialValuesRef.current,
      ...state.values,
    });
    initialValuesRef.current = nextSnapshot;
    markSaved(nextSnapshot);
  }, [markSaved, state?.success, state?.values]);

  const submitIdleLabel = state?.success && !isDirty ? "Recurring event saved" : "Save recurring event";

  return (
    <form
      ref={formRef}
      className={styles.form}
      action={formAction}
      onInput={updateDirtyState}
      onChange={updateDirtyState}
    >
      <input type="hidden" name="hubId" value={hub.id} />
      <input type="hidden" name="hubSlug" value={hub.slug} />
      <input type="hidden" name="seriesId" value={series.id} />
      {!canUsePaidEvents ? (
        <PackageUpgradeNotice
          title={isLockedPaidEvent ? "This paid recurring event pricing is protected on your current package" : "Paid events start on Starter"}
          description={
            isLockedPaidEvent
              ? "This recurring event remains paid and its pricing is preserved. Upgrade to Starter to manage paid pricing again, or to Growth for built-in payments."
              : "You can still manage this recurring event as a free event. Upgrade to Starter when you are ready to charge for event registrations."
          }
          currentUsage={0}
          limit={0}
          unlocks={[
            isLockedPaidEvent ? "Edit paid recurring event pricing" : "Create paid recurring events",
            "Collect payments through an external checkout link",
            "Upgrade to Growth later for built-in payments",
          ]}
        />
      ) : paymentProcessingMode === "external" ? (
        <PackageUpgradeNotice
          title="External payments are active on Starter"
          description="This recurring event can stay paid using your own checkout link. Upgrade to Growth when you want payment handling to stay inside the platform."
          currentUsage={0}
          limit={0}
          unlocks={[
            "Keep paid recurring events on an external checkout link",
            "Share payment instructions with registrants",
            "Upgrade to Growth later for built-in payments",
          ]}
        />
      ) : null}
      <FormSectionTabs tabs={editTabs} activeTabId={activeSectionId} onTabChange={setActiveSectionId} />
      <EventFormFields
        hub={hub}
        mediaAssets={mediaAssets}
        mediaFolders={mediaFolders}
        values={values}
        activeSectionId={activeSectionId}
        onMediaAssetChange={scheduleDirtyStateUpdate}
        onMediaAltChange={scheduleDirtyStateUpdate}
        canUsePaidEvents={canUsePaidEvents}
        canUseGroupBookings={canUseGroupBookings}
        canUseRecurringEvents={canUseRecurringEvents}
        lockScheduleModeToRecurring
        paymentProcessingMode={paymentProcessingMode}
      />
      {state?.upgradeNotice ? (
        <PackageUpgradeNotice
          title={state.upgradeNotice.title}
          description={state.upgradeNotice.description}
          currentUsage={state.upgradeNotice.currentUsage}
          limit={state.upgradeNotice.limit}
          unlocks={state.upgradeNotice.unlocks}
        />
      ) : null}
      <AdminFormFooter ref={feedbackRef} error={state?.error} success={state?.success}>
        {isDirty ? (
          <AdminDiscardChangesButton href={`/${hub.slug}/admin/events/series/${series.id}`} label="Cancel" variant="secondary" />
        ) : (
          <Button href={`/${hub.slug}/admin/events/series/${series.id}`} variant="secondary">
            Cancel
          </Button>
        )}
        <SubmitButton idleLabel={submitIdleLabel} pendingLabel="Saving recurring event..." disabled={!isDirty} />
      </AdminFormFooter>
    </form>
  );
}
