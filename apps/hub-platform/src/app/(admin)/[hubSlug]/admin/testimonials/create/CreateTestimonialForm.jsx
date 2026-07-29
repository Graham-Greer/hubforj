"use client";

import { useActionState, useEffect, useRef } from "react";
import AdminFormFooter from "@/components/patterns/admin-form-footer/AdminFormFooter";
import AdminSelect from "@/components/ui/admin-select/AdminSelect";
import Input from "@/components/ui/input/Input";
import SubmitButton from "@/components/ui/submit-button/SubmitButton";
import SwitchField from "@/components/ui/switch-field/SwitchField";
import Textarea from "@/components/ui/textarea/Textarea";
import MediaAssetField from "@/components/patterns/media-asset-field/MediaAssetField";
import useDirtyFormState from "@/hooks/use-dirty-form-state";
import {
  createFormSnapshotFromKeys,
  createSavedSnapshotFromKeys,
} from "@/lib/forms/admin-form-snapshots";
import { initialCreateTestimonialFormState } from "./form-state";
import { createTestimonialAction } from "./actions";
import styles from "./page.module.css";

const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

const fieldKeys = Object.keys(initialCreateTestimonialFormState.values);

function createSavedValuesSnapshot(values) {
  return createSavedSnapshotFromKeys(fieldKeys, initialCreateTestimonialFormState.values, values);
}

function createFormSnapshot(form) {
  return createFormSnapshotFromKeys(form, fieldKeys);
}

export default function CreateTestimonialForm({ hubId, hubSlug, mediaAssets, mediaFolders }) {
  const [state, formAction] = useActionState(createTestimonialAction, initialCreateTestimonialFormState);
  const feedbackRef = useRef(null);
  const values = {
    ...initialCreateTestimonialFormState.values,
    ...(state?.values || {}),
  };
  const {
    formRef,
    isDirty,
    updateDirtyState,
    scheduleDirtyStateUpdate,
  } = useDirtyFormState({
    initialSnapshot: createSavedValuesSnapshot(initialCreateTestimonialFormState.values),
    createFormSnapshot,
  });

  useEffect(() => {
    if (!feedbackRef.current || !state?.error) {
      return;
    }

    feedbackRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [state?.error]);

  function handleFeaturedChange() {
    requestAnimationFrame(updateDirtyState);
  }

  return (
    <form ref={formRef} className={styles.form} action={formAction} onInput={updateDirtyState} onChange={updateDirtyState}>
        <input type="hidden" name="hubSlug" value={hubSlug} />
        <Textarea
          name="quote"
          label="Quote"
          hint="Required testimonial quote used on public trust surfaces."
          requiredIndicator
          placeholder="This hub changed how we connect with the community."
          defaultValue={values.quote}
        />
        <div className={styles.grid}>
          <Input
            name="authorName"
            label="Author name"
            hint="Required attribution shown with the testimonial."
            requiredIndicator
            placeholder="Priya Shah"
            defaultValue={values.authorName}
          />
          <Input
            name="authorRole"
            label="Author role"
            hint="Optional role, title, or relationship to the community."
            placeholder="Volunteer lead"
            defaultValue={values.authorRole}
          />
          <Input
            name="authorOrganization"
            label="Author organization"
            hint="Optional organization, studio, or business name."
            placeholder="Oak Hill Community"
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
          hubId={hubId}
          hubSlug={hubSlug}
          libraryHref={`/${hubSlug}/admin/media`}
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
      <AdminFormFooter ref={feedbackRef} error={state?.error}>
        <SubmitButton idleLabel="Create testimonial" pendingLabel="Creating testimonial" disabled={!isDirty} />
      </AdminFormFooter>
      </form>
  );
}
