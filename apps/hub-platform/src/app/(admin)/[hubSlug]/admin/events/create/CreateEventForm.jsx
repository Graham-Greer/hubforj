"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import AdminFormFooter from "@/components/patterns/admin-form-footer/AdminFormFooter";
import EventFormFields from "@/components/patterns/event-form-fields/EventFormFields";
import { eventFormSections } from "@/components/patterns/event-form-fields/event-form-config";
import FormStepProgress from "@/components/patterns/form-step-progress/FormStepProgress";
import PackageUpgradeNotice from "@/components/patterns/package-upgrade-notice/PackageUpgradeNotice";
import Button from "@/components/ui/button/Button";
import SubmitButton from "@/components/ui/submit-button/SubmitButton";
import useDirtyFormState from "@/hooks/use-dirty-form-state";
import { getHubPaymentSetupState } from "@/lib/domain/hub-payment-configuration";
import { parseSectionRichTextInput } from "@/lib/domain/section-rich-text";
import {
  createFormSnapshotFromKeys,
  createSavedSnapshotFromKeys,
} from "@/lib/forms/admin-form-snapshots";
import { initialCreateEventFormState } from "./form-state";
import { createEventAction } from "./actions";
import styles from "./page.module.css";

const fieldKeys = Object.keys(initialCreateEventFormState.values);
const createSteps = eventFormSections.map(({ id, label }) => ({ id, label }));

function createSavedValuesSnapshot(values) {
  return createSavedSnapshotFromKeys(
    fieldKeys,
    initialCreateEventFormState.values,
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

export default function CreateEventForm({ hub, mediaAssets, mediaFolders, paymentSetupState = null }) {
  const seededState = {
    ...initialCreateEventFormState,
    values: {
      ...initialCreateEventFormState.values,
      currency: hub.defaultCurrency || initialCreateEventFormState.values.currency || "USD",
    },
  };
  const [state, formAction] = useActionState(createEventAction, seededState);
  const feedbackRef = useRef(null);
  const [activeStepId, setActiveStepId] = useState(createSteps[0].id);
  const canUsePaidEvents = hub?.packageCapabilities?.paidEventsEnabled === true;
  const canUseGroupBookings = hub?.packageCapabilities?.groupBookingsEnabled === true;
  const canUseRecurringEvents = hub?.packageCapabilities?.recurringEventsEnabled === true;
  const paymentProcessingMode = hub?.packagePaymentProcessingMode || "none";
  const nativePaymentsBlocked =
    paymentProcessingMode === "internal" && (paymentSetupState?.key || getHubPaymentSetupState(hub, {}).key) !== "ready";
  const initialValues = seededState.values;
  const values = {
    ...initialValues,
    ...(state?.values || {}),
    pricingMode:
      canUsePaidEvents || (state?.values?.pricingMode || initialValues.pricingMode) === "free"
        ? (state?.values?.pricingMode || initialValues.pricingMode)
        : "free",
  };
  const {
    formRef,
    isDirty,
    updateDirtyState,
    scheduleDirtyStateUpdate,
  } = useDirtyFormState({
    initialSnapshot: createSavedValuesSnapshot(initialValues),
    createFormSnapshot,
  });
  const currentStepIndex = useMemo(
    () => Math.max(0, eventFormSections.findIndex((section) => section.id === activeStepId)),
    [activeStepId]
  );
  const isFinalStep = currentStepIndex === eventFormSections.length - 1;

  useEffect(() => {
    if (!feedbackRef.current || !state?.error) {
      return;
    }

    feedbackRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [state?.error]);

  function focusFirstInvalidControl(panel) {
    const controls = panel.querySelectorAll("input, select, textarea");

    for (const control of controls) {
      if (control.type === "hidden" || control.disabled || !control.willValidate) {
        continue;
      }

      if (!control.checkValidity()) {
        control.reportValidity();
        control.focus();
        return false;
      }
    }

    return true;
  }

  function goToNextStep() {
    if (!formRef.current) {
      return;
    }

    const activePanel = formRef.current.querySelector(`#form-section-panel-${activeStepId}`);

    if (activePanel && !focusFirstInvalidControl(activePanel)) {
      return;
    }

    const nextStep = eventFormSections[currentStepIndex + 1];

    if (nextStep) {
      setActiveStepId(nextStep.id);
    }
  }

  function goToPreviousStep() {
    const previousStep = eventFormSections[currentStepIndex - 1];

    if (previousStep) {
      setActiveStepId(previousStep.id);
    }
  }

  return (
    <form
      ref={formRef}
      className={styles.form}
      action={formAction}
      onInput={updateDirtyState}
      onChange={updateDirtyState}
    >
      <input type="hidden" name="hubSlug" value={hub.slug} />
      {!canUsePaidEvents ? (
        <PackageUpgradeNotice
          title="Paid events start on Starter"
          description="You can still create and manage free events here. Upgrade to Starter when you are ready to charge for event registrations."
          currentUsage={0}
          limit={0}
          unlocks={[
            "Create paid events",
            "Collect payments through an external checkout link",
            "Upgrade to Growth later for built-in payments",
          ]}
        />
      ) : paymentProcessingMode === "external" ? (
        <PackageUpgradeNotice
          title="External payments are active on Starter"
          description="You can charge for registrations now using your own checkout link on Starter. Upgrade to Growth when you want the full event payments experience to stay inside the platform."
          currentUsage={0}
          limit={0}
          unlocks={[
            "Native payment system for event bookings",
            "Built-in payment reporting and reconciliation",
            "Custom domain support",
            "Remove Hubforj branding from your website",
          ]}
        />
      ) : nativePaymentsBlocked ? (
        <PackageUpgradeNotice
          title="Finish Stripe setup before charging for events"
          description="You can keep building free events now. Complete Stripe setup in Payments before switching an event to paid on Growth."
          unlocks={[]}
        />
      ) : null}
      {!canUseRecurringEvents ? (
        <PackageUpgradeNotice
          title="Recurring events start on Starter"
          description="You can still create a one-off event here. Upgrade to Starter or Growth when you want repeating event schedules."
          currentUsage={0}
          limit={0}
          unlocks={[
            "Create daily, weekly, and monthly repeating events",
            "Generate bookable occurrences for up to 6 months",
            "Keep registrations and attendance separate for each occurrence",
          ]}
        />
      ) : null}
      <FormStepProgress
        steps={createSteps}
        currentStepId={activeStepId}
        onStepSelect={setActiveStepId}
        interactive
      />
      <EventFormFields
        hub={hub}
        mediaAssets={mediaAssets}
        mediaFolders={mediaFolders}
        values={values}
        activeSectionId={activeStepId}
        onMediaAssetChange={scheduleDirtyStateUpdate}
        onMediaAltChange={scheduleDirtyStateUpdate}
        canUsePaidEvents={canUsePaidEvents}
        canUseGroupBookings={canUseGroupBookings}
        canUseRecurringEvents={canUseRecurringEvents}
        paymentProcessingMode={paymentProcessingMode}
        nativePaymentsBlocked={nativePaymentsBlocked}
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
      <AdminFormFooter ref={feedbackRef} error={state?.error}>
        {currentStepIndex > 0 ? (
          <Button type="button" variant="ghost" onClick={goToPreviousStep}>
            Back
          </Button>
        ) : null}
        {isFinalStep ? (
          <SubmitButton idleLabel="Create event" pendingLabel="Creating event..." disabled={!isDirty} />
        ) : (
          <Button type="button" variant="primary" onClick={goToNextStep}>
            Continue
          </Button>
        )}
      </AdminFormFooter>
    </form>
  );
}
