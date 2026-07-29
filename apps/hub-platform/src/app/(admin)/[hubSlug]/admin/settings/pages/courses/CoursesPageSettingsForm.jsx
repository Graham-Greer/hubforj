"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import AdminDiscardChangesButton from "@/components/patterns/admin-form-runtime/AdminDiscardChangesButton";
import AdminFormFooter from "@/components/patterns/admin-form-footer/AdminFormFooter";
import AdminFormSection from "@/components/patterns/admin-form-section/AdminFormSection";
import PageHeroFieldGroup from "@/app/(admin)/[hubSlug]/admin/settings/PageHeroFieldGroup";
import SubmitButton from "@/components/ui/submit-button/SubmitButton";
import useDirtyFormState from "@/hooks/use-dirty-form-state";
import {
  createFormSnapshotFromKeys,
  createSavedSnapshotFromKeys,
} from "@/lib/forms/admin-form-snapshots";
import { initialCoursesPageSettingsState } from "../../form-state";
import { updateCoursesPageSettingsAction } from "../../actions";
import styles from "../../settings.module.css";

const fieldKeys = Object.keys(initialCoursesPageSettingsState.values);

function createSavedValuesSnapshot(values) {
  return createSavedSnapshotFromKeys(
    fieldKeys,
    initialCoursesPageSettingsState.values,
    values
  );
}

function createFormSnapshot(form) {
  return createFormSnapshotFromKeys(form, fieldKeys);
}

export default function CoursesPageSettingsForm({
  hub,
  initialValues,
  mediaAssets = [],
  mediaFolders = [],
}) {
  const router = useRouter();
  const initialState = {
    ...initialCoursesPageSettingsState,
    values: {
      ...initialCoursesPageSettingsState.values,
      ...initialValues,
    },
  };
  const initialSavedSnapshot = createSavedValuesSnapshot(initialState.values);
  const [state, formAction] = useActionState(updateCoursesPageSettingsAction, initialState);
  const initialValuesRef = useRef(initialState.values);
  const feedbackRef = useRef(null);
  const values = {
    ...initialState.values,
    ...(state?.values || {}),
  };
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

    router.push(`/${hub.slug}/admin/settings/pages`);
    router.refresh();
  }, [hub.slug, router, state?.success]);

  const submitIdleLabel =
    state?.success && !isDirty ? "Courses page saved" : "Save courses page";

  return (
    <form
      ref={formRef}
      className={styles.form}
      action={formAction}
      onInput={updateDirtyState}
      onChange={updateDirtyState}
    >
      <input type="hidden" name="hubSlug" value={hub.slug} />

      <AdminFormSection title="Hero">
        <PageHeroFieldGroup
          hub={hub}
          values={values}
          mediaAssets={mediaAssets}
          mediaFolders={mediaFolders}
          gridClassName={styles.grid}
          onMediaAssetChange={scheduleDirtyStateUpdate}
          onMediaAltChange={scheduleDirtyStateUpdate}
          prefix="hero"
          title="Hero"
          titleRequiredIndicator
          mediaHint="Select media via upload or using existing media."
          eyebrowHint="Optional short label above the courses hero title."
          titleHint="Required main public-facing title for the courses route hero."
          descriptionHint="Optional supporting sentence beneath the courses hero title. Leave blank to use the system default."
          mediaLabel="Hero media"
          eyebrowLabel="Hero eyebrow"
          titleLabel="Hero title"
          descriptionLabel="Hero description"
          uploadLabel="Upload hero media"
        />
      </AdminFormSection>

      <AdminFormFooter ref={feedbackRef} error={state?.error} success={state?.success}>
        <AdminDiscardChangesButton href={`/${hub.slug}/admin/settings/pages`} />
        <SubmitButton
          idleLabel={submitIdleLabel}
          pendingLabel="Saving courses page"
          disabled={!isDirty}
        />
      </AdminFormFooter>
    </form>
  );
}
