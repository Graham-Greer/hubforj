"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ActionLinkField from "../../ActionLinkField";
import AdminDiscardChangesButton from "@/components/patterns/admin-form-runtime/AdminDiscardChangesButton";
import AdminFormFooter from "@/components/patterns/admin-form-footer/AdminFormFooter";
import AdminFormSection from "@/components/patterns/admin-form-section/AdminFormSection";
import FormSectionTabs from "@/components/patterns/form-section-tabs/FormSectionTabs";
import PageHeroFieldGroup from "@/app/(admin)/[hubSlug]/admin/settings/PageHeroFieldGroup";
import Input from "@/components/ui/input/Input";
import SubmitButton from "@/components/ui/submit-button/SubmitButton";
import Textarea from "@/components/ui/textarea/Textarea";
import useDirtyFormState from "@/hooks/use-dirty-form-state";
import {
  createFormSnapshotFromKeys,
  createSavedSnapshotFromKeys,
} from "@/lib/forms/admin-form-snapshots";
import { publicInternalActionOptions } from "@/lib/domain/public-action-links";
import { initialTestimonialsPageSettingsState } from "../../form-state";
import { updateTestimonialsPageSettingsAction } from "../../actions";
import styles from "../../settings.module.css";

const fieldKeys = Object.keys(initialTestimonialsPageSettingsState.values);
const testimonialsPageSections = [
  {
    id: "hero",
    label: "Hero",
    description: "Headline media and introductory copy for the page.",
  },
  {
    id: "cta",
    label: "Call to action",
    description: "Closing conversion message and actions.",
  },
];

function createSavedValuesSnapshot(values) {
  return createSavedSnapshotFromKeys(
    fieldKeys,
    initialTestimonialsPageSettingsState.values,
    values
  );
}

function createFormSnapshot(form) {
  return createFormSnapshotFromKeys(form, fieldKeys);
}

export default function TestimonialsPageSettingsForm({
  hub,
  initialValues,
  mediaAssets = [],
  mediaFolders = [],
}) {
  const router = useRouter();
  const [activeSectionId, setActiveSectionId] = useState(testimonialsPageSections[0].id);
  const initialState = {
    ...initialTestimonialsPageSettingsState,
    values: {
      ...initialTestimonialsPageSettingsState.values,
      ...initialValues,
    },
  };
  const initialSavedSnapshot = createSavedValuesSnapshot(initialState.values);
  const [state, formAction] = useActionState(updateTestimonialsPageSettingsAction, initialState);
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
    state?.success && !isDirty ? "Testimonials page saved" : "Save testimonials page";

  return (
    <form
      ref={formRef}
      className={styles.form}
      action={formAction}
      onInput={updateDirtyState}
      onChange={updateDirtyState}
    >
      <input type="hidden" name="hubSlug" value={hub.slug} />
      <FormSectionTabs
        tabs={testimonialsPageSections}
        activeTabId={activeSectionId}
        onTabChange={setActiveSectionId}
        showDescriptions={false}
      />

      <section
        id="form-section-panel-hero"
        role="tabpanel"
        aria-labelledby="form-section-tab-hero"
        hidden={activeSectionId !== "hero"}
        className={[styles.panel, activeSectionId !== "hero" ? styles.panelHidden : ""]
          .filter(Boolean)
          .join(" ")}
      >
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
            eyebrowHint="Optional short label above the testimonials hero title."
            titleHint="Required main public-facing title for the testimonials route hero."
            descriptionHint="Optional supporting sentence beneath the testimonials hero title. Leave blank to use the system default."
            mediaLabel="Hero media"
            eyebrowLabel="Hero eyebrow"
            titleLabel="Hero title"
            descriptionLabel="Hero description"
            uploadLabel="Upload hero media"
          />
        </AdminFormSection>
      </section>

      <section
        id="form-section-panel-cta"
        role="tabpanel"
        aria-labelledby="form-section-tab-cta"
        hidden={activeSectionId !== "cta"}
        className={[styles.panel, activeSectionId !== "cta" ? styles.panelHidden : ""]
          .filter(Boolean)
          .join(" ")}
      >
        <AdminFormSection title="Call to action">
          <div className={styles.grid}>
            <Input
              name="ctaEyebrow"
              label="CTA eyebrow"
              hint="Optional short label above the closing call to action."
              defaultValue={values.ctaEyebrow}
            />
            <Input
              name="ctaTitle"
              label="CTA title"
              hint="Required closing headline for the testimonials page CTA section."
              defaultValue={values.ctaTitle}
              required
            />
          </div>
          <Textarea
            name="ctaDescription"
            label="CTA description"
            hint="Optional supporting copy beneath the CTA title."
            defaultValue={values.ctaDescription}
            rows={4}
          />
          <div className={styles.actionGroup}>
            <ActionLinkField
              key={`testimonials-cta-primary-${values.ctaPrimaryActionLabel}-${values.ctaPrimaryActionDestination}`}
              title="Primary action"
              prefix="ctaPrimaryAction"
              values={values}
              internalOptions={publicInternalActionOptions}
            />
            <ActionLinkField
              key={`testimonials-cta-secondary-${values.ctaSecondaryActionLabel}-${values.ctaSecondaryActionDestination}`}
              title="Secondary action"
              prefix="ctaSecondaryAction"
              values={values}
              internalOptions={publicInternalActionOptions}
            />
          </div>
        </AdminFormSection>
      </section>

      <AdminFormFooter ref={feedbackRef} error={state?.error} success={state?.success}>
        <AdminDiscardChangesButton href={`/${hub.slug}/admin/settings/pages`} />
        <SubmitButton
          idleLabel={submitIdleLabel}
          pendingLabel="Saving testimonials page"
          disabled={!isDirty}
        />
      </AdminFormFooter>
    </form>
  );
}
