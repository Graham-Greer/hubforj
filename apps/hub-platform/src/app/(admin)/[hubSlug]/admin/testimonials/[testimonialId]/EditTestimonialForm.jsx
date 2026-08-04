"use client";

import { useActionState, useEffect, useRef } from "react";
import AdminDiscardChangesButton from "@/components/patterns/admin-form-runtime/AdminDiscardChangesButton";
import AdminFormFooter from "@/components/patterns/admin-form-footer/AdminFormFooter";
import AdminSelect from "@/components/ui/admin-select/AdminSelect";
import Input from "@/components/ui/input/Input";
import Button from "@/components/ui/button/Button";
import SubmitButton from "@/components/ui/submit-button/SubmitButton";
import SwitchField from "@/components/ui/switch-field/SwitchField";
import Textarea from "@/components/ui/textarea/Textarea";
import MediaAssetField from "@/components/patterns/media-asset-field/MediaAssetField";
import useDirtyFormState from "@/hooks/use-dirty-form-state";
import {
  createFormSnapshotFromKeys,
  createSavedSnapshotFromKeys,
} from "@/lib/forms/admin-form-snapshots";
import { initialUpdateTestimonialFormState } from "./form-state";
import { updateTestimonialAction } from "./actions";
import styles from "./page.module.css";

const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

const fieldKeys = Object.keys(initialUpdateTestimonialFormState.values);

function createSavedValuesSnapshot(values) {
  return createSavedSnapshotFromKeys(fieldKeys, initialUpdateTestimonialFormState.values, values);
}

function createFormSnapshot(form) {
  return createFormSnapshotFromKeys(form, fieldKeys);
}

export default function EditTestimonialForm({ hub, testimonial, mediaAssets, mediaFolders }) {
  const initialState = {
    ...initialUpdateTestimonialFormState,
    values: {
      ...initialUpdateTestimonialFormState.values,
      quote: testimonial?.quote || "",
      authorName: testimonial?.authorName || "",
      authorRole: testimonial?.authorRole || "",
      authorOrganization: testimonial?.authorOrganization || "",
      authorImageAssetId: testimonial?.authorImageAssetId || testimonial?.authorImageAsset?.id || "",
      authorImageAlt: testimonial?.authorImageAlt || testimonial?.authorImageAsset?.alt || "",
      status: testimonial?.status || initialUpdateTestimonialFormState.values.status,
      featured: testimonial?.featured ? "true" : "false",
      sortOrder: String(testimonial?.sortOrder || 0),
    },
  };
  const initialSavedSnapshot = createSavedValuesSnapshot(initialState.values);
  const [state, formAction] = useActionState(updateTestimonialAction, initialState);
  const initialValuesRef = useRef(initialState.values);
  const feedbackRef = useRef(null);
  const values = {
    ...initialUpdateTestimonialFormState.values,
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

  const submitIdleLabel = state?.success && !isDirty ? "Testimonial saved" : "Save testimonial";

  function handleFeaturedChange() {
    requestAnimationFrame(updateDirtyState);
  }

  return (
    <form ref={formRef} className={styles.form} action={formAction} onInput={updateDirtyState} onChange={updateDirtyState}>
      <input type="hidden" name="hubId" value={hub.id} />
      <input type="hidden" name="hubSlug" value={hub.slug} />
      <input type="hidden" name="testimonialId" value={testimonial.id} />
      <Textarea
        name="quote"
        label="Quote"
        hint="Required testimonial quote used on public trust surfaces."
        requiredIndicator
        defaultValue={values.quote}
      />
      <div className={styles.grid}>
        <Input
          name="authorName"
          label="Author name"
          hint="Required attribution shown with the testimonial."
          requiredIndicator
          defaultValue={values.authorName}
        />
        <Input
          name="authorRole"
          label="Author role"
          hint="Optional role, title, or relationship to the community."
          defaultValue={values.authorRole}
        />
        <Input
          name="authorOrganization"
          label="Author organization"
          hint="Optional organization, studio, or business name."
          defaultValue={values.authorOrganization}
        />
        <Input
          name="sortOrder"
          label="Sort order"
          hint="Lower numbers appear earlier within the same featured state."
          type="number"
          min="0"
          defaultValue={values.sortOrder}
        />
        <AdminSelect
          name="status"
          label="Status"
          hint="Only published testimonials appear on public surfaces."
          options={statusOptions}
          defaultValue={values.status}
        />
        <SwitchField
          name="featured"
          label="Featured"
          hint="Featured testimonials are prioritized in highlighted public sections."
          defaultChecked={values.featured === "true"}
          onChange={handleFeaturedChange}
        />
      </div>
      <MediaAssetField
        key={`${values.authorImageAssetId}:${values.authorImageAlt}`}
        label="Author image"
        hint="Select media via upload or using existing media."
        hubId={hub.id}
        hubSlug={hub.slug}
        libraryHref={`/${hub.slug}/admin/media`}
        assets={mediaAssets}
        folders={mediaFolders}
        assetId={values.authorImageAssetId}
        assetAlt={values.authorImageAlt}
        assetFieldName="authorImageAssetId"
        altFieldName="authorImageAlt"
        onAssetChange={scheduleDirtyStateUpdate}
        onAltChange={scheduleDirtyStateUpdate}
        uploadLabel="Upload author image"
        emptyTitle="Select media"
      />
      <AdminFormFooter ref={feedbackRef} error={state?.error} success={state?.success}>
        <div className={styles.footerActionStart}>
          {isDirty ? (
            <AdminDiscardChangesButton
              href={`/${hub.slug}/admin/testimonials`}
              label="Cancel"
              variant="secondary"
            />
          ) : (
            <Button href={`/${hub.slug}/admin/testimonials`} variant="secondary">
              Cancel
            </Button>
          )}
        </div>
        <div className={styles.footerActionEnd}>
          <SubmitButton idleLabel={submitIdleLabel} pendingLabel="Saving testimonial" disabled={!isDirty} />
        </div>
      </AdminFormFooter>
    </form>
  );
}
