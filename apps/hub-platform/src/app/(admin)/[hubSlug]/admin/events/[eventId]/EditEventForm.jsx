"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AdminDiscardChangesButton from "@/components/patterns/admin-form-runtime/AdminDiscardChangesButton";
import AdminFormFooter from "@/components/patterns/admin-form-footer/AdminFormFooter";
import Button from "@/components/ui/button/Button";
import EventFormFields from "@/components/patterns/event-form-fields/EventFormFields";
import { eventFormSections } from "@/components/patterns/event-form-fields/event-form-config";
import FormSectionTabs from "@/components/patterns/form-section-tabs/FormSectionTabs";
import PackageUpgradeNotice from "@/components/patterns/package-upgrade-notice/PackageUpgradeNotice";
import SubmitButton from "@/components/ui/submit-button/SubmitButton";
import useDirtyFormState from "@/hooks/use-dirty-form-state";
import { getHubPaymentSetupState } from "@/lib/domain/hub-payment-configuration";
import { parseSectionRichTextInput } from "@/lib/domain/section-rich-text";
import {
  createFormSnapshotFromKeys,
  createSavedSnapshotFromKeys,
} from "@/lib/forms/admin-form-snapshots";
import { initialEditEventFormState } from "./form-state";
import { updateEventAction } from "./actions";
import styles from "../create/page.module.css";

const fieldKeys = Object.keys(initialEditEventFormState.values);
const editTabs = eventFormSections.map(({ id, label }) => ({ id, label }));

function createSavedValuesSnapshot(values) {
  return createSavedSnapshotFromKeys(
    fieldKeys,
    initialEditEventFormState.values,
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

export default function EditEventForm({
  hub,
  event,
  mediaAssets,
  mediaFolders,
  paymentSetupState = null,
  publishLocked = false,
  publishUpgradeNotice = null,
}) {
  const router = useRouter();
  const [activeSectionId, setActiveSectionId] = useState(editTabs[0].id);
  const canUsePaidEvents = hub?.packageCapabilities?.paidEventsEnabled === true;
  const canUseGroupBookings = hub?.packageCapabilities?.groupBookingsEnabled === true;
  const paymentProcessingMode = hub?.packagePaymentProcessingMode || "none";
  const nativePaymentsBlocked =
    paymentProcessingMode === "internal" && (paymentSetupState?.key || getHubPaymentSetupState(hub, {}).key) !== "ready";
  const initialState = {
    ...initialEditEventFormState,
    values: {
      ...initialEditEventFormState.values,
      title: event.title,
      slug: event.slug,
      summary: event.summary,
      description: event.description,
      imageAssetId: event.imageAssetId || event.imageAsset?.id || "",
      imageAlt: event.imageAlt || event.imageAsset?.alt || "",
      location: event.location,
      startDate: event.startDate,
      endDate: event.endDate,
      startTime: event.startTime,
      endTime: event.endTime,
      capacity: String(event.capacity || ""),
      pricingMode: event.pricingMode,
      price: event.price,
      currency: event.currency || hub.defaultCurrency || "USD",
      externalPaymentUrl: event.externalPaymentUrl || "",
      paymentInstructions: event.paymentInstructions || "",
      refundWindowMode: event.refundWindowMode || "default",
      refundWindowHours: String(event.refundWindowHours || 48),
      refundPolicy: event.refundPolicy || "full_refund_before_window",
      registrationEligibility: event.registrationEligibility,
      bookingMode: event.bookingMode || "single_attendee",
      maxAttendeesPerBooking: String(event.maxAttendeesPerBooking || 2),
      guestDetailsMode: event.guestDetailsMode || "name_only",
      visibility: event.visibility,
      allowWaitlist: String(event.allowWaitlist !== false),
      category: event.category,
      status: event.status,
    },
  };
  const initialSavedSnapshot = createSavedValuesSnapshot(initialState.values);
  const [state, formAction] = useActionState(updateEventAction, initialState);
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

  useEffect(() => {
    if (!state?.success) {
      return;
    }

    router.push(`/${hub.slug}/admin/events/${event.id}`);
    router.refresh();
  }, [event.id, hub.slug, router, state?.success]);

  const submitIdleLabel = state?.success && !isDirty ? "Event saved" : "Save event";

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
      <input type="hidden" name="eventId" value={event.id} />
      <input type="hidden" name="previousSlug" value={event.slug} />
      {!canUsePaidEvents ? (
        <PackageUpgradeNotice
          title={isLockedPaidEvent ? "This paid event pricing is protected on your current package" : "Paid events start on Starter"}
          description={
            isLockedPaidEvent
              ? "This event remains paid and its pricing is preserved. Upgrade to Starter to manage paid event pricing again, or to Growth for built-in payments."
              : "You can still manage this event as a free event. Upgrade to Starter when you are ready to charge for event registrations."
          }
          currentUsage={0}
          limit={0}
          unlocks={[
            isLockedPaidEvent ? "Edit paid event pricing" : "Create paid events",
            "Collect payments through an external checkout link",
            "Upgrade to Growth later for built-in payments",
          ]}
        />
      ) : paymentProcessingMode === "external" ? (
        <PackageUpgradeNotice
          title="External payments are active on Starter"
          description="This event can stay paid using your own checkout link. Upgrade to Growth when you want payment handling to stay inside the platform."
          currentUsage={0}
          limit={0}
          unlocks={[
            "Keep paid events on an external checkout link",
            "Share payment instructions with registrants",
            "Upgrade to Growth later for built-in payments",
          ]}
        />
      ) : nativePaymentsBlocked ? (
        <PackageUpgradeNotice
          title="Finish Stripe setup before charging for events"
          description="Free event edits can continue, but Stripe setup must be completed before this Growth hub can use paid event registrations."
          unlocks={[]}
        />
      ) : null}
      <FormSectionTabs
        tabs={editTabs}
        activeTabId={activeSectionId}
        onTabChange={setActiveSectionId}
      />
      {publishUpgradeNotice ? (
        <PackageUpgradeNotice
          title={publishUpgradeNotice.title}
          description={publishUpgradeNotice.description}
          currentUsage={publishUpgradeNotice.currentUsage}
          limit={publishUpgradeNotice.limit}
          unlocks={publishUpgradeNotice.unlocks}
        />
      ) : null}
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
        paymentProcessingMode={paymentProcessingMode}
        nativePaymentsBlocked={nativePaymentsBlocked}
        publishLocked={publishLocked}
        publishLockedHint={
          publishLocked ? "Published is unavailable until this hub has room for another active upcoming event." : ""
        }
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
          <AdminDiscardChangesButton href={`/${hub.slug}/admin/events/${event.id}`} label="Cancel" variant="secondary" />
        ) : (
          <Button href={`/${hub.slug}/admin/events/${event.id}`} variant="secondary">
            Cancel
          </Button>
        )}
        <SubmitButton idleLabel={submitIdleLabel} pendingLabel="Saving event..." disabled={!isDirty} />
      </AdminFormFooter>
    </form>
  );
}
