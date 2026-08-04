"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AdminDiscardChangesButton from "@/components/patterns/admin-form-runtime/AdminDiscardChangesButton";
import AdminFormFooter from "@/components/patterns/admin-form-footer/AdminFormFooter";
import Button from "@/components/ui/button/Button";
import CourseFormFields from "@/components/patterns/course-form-fields/CourseFormFields";
import { courseFormSections } from "@/components/patterns/course-form-fields/course-form-config";
import FormSectionTabs from "@/components/patterns/form-section-tabs/FormSectionTabs";
import PackageUpgradeNotice from "@/components/patterns/package-upgrade-notice/PackageUpgradeNotice";
import SubmitButton from "@/components/ui/submit-button/SubmitButton";
import useDirtyFormState from "@/hooks/use-dirty-form-state";
import { getHubPaymentSetupState } from "@/lib/domain/hub-payment-configuration";
import { buildHubRuntimeHref } from "@/lib/domain/hub-runtime-paths";
import { parseSectionRichTextInput } from "@/lib/domain/section-rich-text";
import {
  createFormSnapshotFromKeys,
  createSavedSnapshotFromKeys,
} from "@/lib/forms/admin-form-snapshots";
import { initialEditCourseFormState } from "./form-state";
import { updateCourseAction } from "./actions";
import styles from "../create/page.module.css";

const fieldKeys = Object.keys(initialEditCourseFormState.values);
const editTabs = courseFormSections.map(({ id, label }) => ({ id, label }));

function createSavedValuesSnapshot(values) {
  return createSavedSnapshotFromKeys(
    fieldKeys,
    initialEditCourseFormState.values,
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

export default function EditCourseForm({ hub, course, mediaAssets, mediaFolders, paymentSetupState = null, routeMode = "path" }) {
  const router = useRouter();
  const [activeSectionId, setActiveSectionId] = useState(editTabs[0].id);
  const courseHref = buildHubRuntimeHref(hub.slug, `/admin/courses/${course.id}`, routeMode);
  const canUsePaidCourses = hub?.packageCapabilities?.paidCoursesEnabled === true;
  const paymentProcessingMode = hub?.packagePaymentProcessingMode || "none";
  const nativePaymentsBlocked =
    paymentProcessingMode === "internal" && (paymentSetupState?.key || getHubPaymentSetupState(hub, {}).key) !== "ready";
  const initialState = {
    ...initialEditCourseFormState,
    values: {
      ...initialEditCourseFormState.values,
      title: course.title,
      slug: course.slug,
      summary: course.summary,
      description: course.description,
      imageAssetId: course.imageAssetId || course.imageAsset?.id || "",
      imageAlt: course.imageAlt || course.imageAsset?.alt || "",
      courseType: course.courseType || "",
      subtypeLabel: course.subtypeLabel || "",
      courseLevel: course.courseLevel || "",
      customLevelLabel: course.customLevelLabel || "",
      format: course.format || "in-person",
      location: course.location || "",
      onlineMeetingLink: course.onlineMeetingLink || "",
      timezone: course.timezone || hub.timezone || "America/New_York",
      accessInstructions: course.accessInstructions || "",
      startDate: course.startDate,
      endDate: course.endDate,
      startTime: course.startTime,
      endTime: course.endTime,
      registrationOpenDate: course.registrationOpenDate || "",
      registrationCloseDate: course.registrationCloseDate || "",
      sessionCount: String(course.sessionCount || ""),
      capacity: String(course.capacity || ""),
      pricingMode: course.pricingMode,
      price: course.price,
      currency: course.currency || hub.defaultCurrency || "USD",
      externalPaymentUrl: course.externalPaymentUrl || "",
      paymentInstructions: course.paymentInstructions || "",
      requiresDeposit: String(course.requiresDeposit === true),
      depositAmount: course.depositAmount || "",
      paymentDeadline: course.paymentDeadline || "",
      refundWindowMode: course.refundWindowMode || "custom",
      refundWindowHours: String(course.refundWindowHours || 48),
      refundPolicy: course.refundPolicy || "full_refund_before_window",
      visibility: course.visibility,
      allowWaitlist: String(course.allowWaitlist !== false),
      status: course.status,
    },
  };
  const initialSavedSnapshot = createSavedValuesSnapshot(initialState.values);
  const [state, formAction] = useActionState(updateCourseAction, initialState);
  const initialValuesRef = useRef(initialState.values);
  const feedbackRef = useRef(null);
  const values = {
    ...initialState.values,
    ...(state?.values || {}),
  };
  const isLockedPaidCourse = !canUsePaidCourses && values.pricingMode === "paid";
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

    router.push(courseHref);
    router.refresh();
  }, [courseHref, router, state?.success]);

  const submitIdleLabel = state?.success && !isDirty ? "Course saved" : "Save course";

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
      <input type="hidden" name="courseId" value={course.id} />
      <input type="hidden" name="previousSlug" value={course.slug} />
      {!canUsePaidCourses ? (
        <PackageUpgradeNotice
          title={isLockedPaidCourse ? "This paid course pricing is protected on your current package" : "Paid courses start on Starter"}
          description={
            isLockedPaidCourse
              ? "This course remains paid and its pricing is preserved. Upgrade to Starter to manage paid course pricing again, or to Growth for built-in payments."
              : "You can still manage this course as a free course. Upgrade to Starter when you are ready to charge for enrolment."
          }
          currentUsage={0}
          limit={0}
          unlocks={[
            isLockedPaidCourse ? "Edit paid course pricing" : "Create paid courses",
            "Collect payments through an external checkout link",
            "Upgrade to Growth later for built-in payments",
          ]}
        />
      ) : paymentProcessingMode === "external" ? (
        <PackageUpgradeNotice
          title="External payments are active on Starter"
          description="This course can stay paid using your own checkout link. Upgrade to Growth when you want deposits and built-in payment handling inside the platform."
          currentUsage={0}
          limit={0}
          unlocks={[
            "Keep paid courses on an external checkout link",
            "Share payment instructions with learners",
            "Upgrade to Growth later for built-in payments",
          ]}
        />
      ) : nativePaymentsBlocked ? (
        <PackageUpgradeNotice
          title="Finish Stripe setup before charging for courses"
          description="Free course edits can continue, but Stripe setup must be completed before this Growth hub can use paid course enrolments."
          unlocks={[]}
        />
      ) : null}
      <FormSectionTabs
        tabs={editTabs}
        activeTabId={activeSectionId}
        onTabChange={setActiveSectionId}
      />
      <CourseFormFields
        hub={hub}
        mediaAssets={mediaAssets}
        mediaFolders={mediaFolders}
        values={values}
        activeSectionId={activeSectionId}
        onMediaAssetChange={scheduleDirtyStateUpdate}
        onMediaAltChange={scheduleDirtyStateUpdate}
        canUsePaidCourses={canUsePaidCourses}
        paymentProcessingMode={paymentProcessingMode}
        nativePaymentsBlocked={nativePaymentsBlocked}
      />
      <AdminFormFooter ref={feedbackRef} error={state?.error} success={state?.success}>
        {isDirty ? (
          <AdminDiscardChangesButton href={courseHref} label="Cancel" variant="secondary" />
        ) : (
          <Button href={courseHref} variant="secondary">
            Cancel
          </Button>
        )}
        <SubmitButton idleLabel={submitIdleLabel} pendingLabel="Saving course..." disabled={!isDirty} />
      </AdminFormFooter>
    </form>
  );
}
