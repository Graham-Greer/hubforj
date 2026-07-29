"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import AdminFormFooter from "@/components/patterns/admin-form-footer/AdminFormFooter";
import CourseFormFields from "@/components/patterns/course-form-fields/CourseFormFields";
import { courseFormSections } from "@/components/patterns/course-form-fields/course-form-config";
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
import { initialCreateCourseFormState } from "./form-state";
import { createCourseAction } from "./actions";
import styles from "./page.module.css";

const fieldKeys = Object.keys(initialCreateCourseFormState.values);
const createSteps = courseFormSections.map(({ id, label }) => ({ id, label }));

function createSavedValuesSnapshot(values) {
  return createSavedSnapshotFromKeys(
    fieldKeys,
    initialCreateCourseFormState.values,
    values,
    (base) =>
      fieldKeys.reduce((snapshot, key) => {
        if (key === "description" || key === "accessInstructions") {
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

export default function CreateCourseForm({ hub, mediaAssets, mediaFolders, paymentSetupState = null }) {
  const seededState = {
    ...initialCreateCourseFormState,
    values: {
      ...initialCreateCourseFormState.values,
      timezone: initialCreateCourseFormState.values.timezone || hub.timezone || "America/New_York",
      currency: hub.defaultCurrency || initialCreateCourseFormState.values.currency || "USD",
    },
  };
  const [state, formAction] = useActionState(createCourseAction, seededState);
  const feedbackRef = useRef(null);
  const [activeStepId, setActiveStepId] = useState(createSteps[0].id);
  const canUsePaidCourses = hub?.packageCapabilities?.paidCoursesEnabled === true;
  const paymentProcessingMode = hub?.packagePaymentProcessingMode || "none";
  const nativePaymentsBlocked =
    paymentProcessingMode === "internal" && (paymentSetupState?.key || getHubPaymentSetupState(hub, {}).key) !== "ready";
  const initialValues = seededState.values;
  const values = {
    ...initialValues,
    ...(state?.values || {}),
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
    () => Math.max(
      0,
      courseFormSections.findIndex((section) => section.id === activeStepId)
    ),
    [activeStepId]
  );
  const isFinalStep = currentStepIndex === courseFormSections.length - 1;

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

    const nextStep = courseFormSections[currentStepIndex + 1];

    if (nextStep) {
      setActiveStepId(nextStep.id);
    }
  }

  function goToPreviousStep() {
    const previousStep = courseFormSections[currentStepIndex - 1];

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
      {!canUsePaidCourses ? (
        <PackageUpgradeNotice
          title="Paid courses start on Starter"
          description="Courses are already unlocked on your package. Upgrade to Starter when you are ready to charge for enrolment, or keep courses free for now."
          currentUsage={0}
          limit={0}
          unlocks={[
            "Create paid courses",
            "Collect payment through an external checkout link",
            "Upgrade to Growth later for built-in payments",
          ]}
        />
      ) : paymentProcessingMode === "external" ? (
        <PackageUpgradeNotice
          title="External payments are active on Starter"
          description="You can charge for courses now using your own checkout link. Upgrade to Growth when you want deposits, payment handling, and confirmations to stay inside the platform."
          currentUsage={0}
          limit={0}
          unlocks={[
            "Add an external checkout link to paid courses",
            "Share payment instructions with learners",
            "Upgrade to Growth later for built-in payments",
          ]}
        />
      ) : nativePaymentsBlocked ? (
        <PackageUpgradeNotice
          title="Finish Stripe setup before charging for courses"
          description="You can keep building free courses now. Complete Stripe setup in Payments before switching a course to paid on Growth."
          unlocks={[]}
        />
      ) : null}
      <FormStepProgress
        steps={createSteps}
        currentStepId={activeStepId}
        onStepSelect={setActiveStepId}
        interactive
      />
      <CourseFormFields
        hub={hub}
        mediaAssets={mediaAssets}
        mediaFolders={mediaFolders}
        values={values}
        activeSectionId={activeStepId}
        onMediaAssetChange={scheduleDirtyStateUpdate}
        onMediaAltChange={scheduleDirtyStateUpdate}
        canUsePaidCourses={canUsePaidCourses}
        paymentProcessingMode={paymentProcessingMode}
        nativePaymentsBlocked={nativePaymentsBlocked}
      />
      <AdminFormFooter ref={feedbackRef} error={state?.error}>
        {currentStepIndex > 0 ? (
          <Button type="button" variant="ghost" onClick={goToPreviousStep}>
            Back
          </Button>
        ) : null}
        {isFinalStep ? (
          <SubmitButton idleLabel="Create course" pendingLabel="Creating course..." disabled={!isDirty} />
        ) : (
          <Button type="button" variant="primary" onClick={goToNextStep}>
            Continue
          </Button>
        )}
      </AdminFormFooter>
    </form>
  );
}
