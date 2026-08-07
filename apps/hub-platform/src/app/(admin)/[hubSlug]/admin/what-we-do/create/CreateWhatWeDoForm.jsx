"use client";

import { useActionState, useEffect, useRef } from "react";
import AdminFormFooter from "@/components/patterns/admin-form-footer/AdminFormFooter";
import AdminSelect from "@/components/ui/admin-select/AdminSelect";
import Input from "@/components/ui/input/Input";
import SubmitButton from "@/components/ui/submit-button/SubmitButton";
import Textarea from "@/components/ui/textarea/Textarea";
import useDirtyFormState from "@/hooks/use-dirty-form-state";
import {
  createFormSnapshotFromKeys,
  createSavedSnapshotFromKeys,
} from "@/lib/forms/admin-form-snapshots";
import { initialCreateWhatWeDoFormState } from "./form-state";
import { createWhatWeDoAction } from "./actions";
import styles from "./page.module.css";

const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

const fieldKeys = Object.keys(initialCreateWhatWeDoFormState.values);

function createSavedValuesSnapshot(values) {
  return createSavedSnapshotFromKeys(fieldKeys, initialCreateWhatWeDoFormState.values, values);
}

function createFormSnapshot(form) {
  return createFormSnapshotFromKeys(form, fieldKeys);
}

export default function CreateWhatWeDoForm({ hubSlug, returnContext = null }) {
  const [state, formAction] = useActionState(createWhatWeDoAction, initialCreateWhatWeDoFormState);
  const feedbackRef = useRef(null);
  const values = {
    ...initialCreateWhatWeDoFormState.values,
    ...(state?.values || {}),
  };
  const { formRef, isDirty, updateDirtyState } = useDirtyFormState({
    initialSnapshot: createSavedValuesSnapshot(initialCreateWhatWeDoFormState.values),
    createFormSnapshot,
  });

  useEffect(() => {
    if (!feedbackRef.current || !state?.error) {
      return;
    }

    feedbackRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [state?.error]);

  return (
    <form ref={formRef} className={styles.form} action={formAction} onInput={updateDirtyState} onChange={updateDirtyState}>
      <input type="hidden" name="hubSlug" value={hubSlug} />
      {returnContext?.returnTo ? <input type="hidden" name="returnTo" value={returnContext.returnTo} /> : null}
      {returnContext?.returnSection ? <input type="hidden" name="returnSection" value={returnContext.returnSection} /> : null}
      <div className={styles.grid}>
        <Input
          name="title"
          label="Title"
          hint="Required short heading shown on the public grid card."
          requiredIndicator
          placeholder="Weekly classes and gatherings"
          defaultValue={values.title}
        />
        <Input
          name="sortOrder"
          label="Sort order"
          hint="Lower numbers appear earlier on public surfaces."
          type="number"
          min="0"
          defaultValue={values.sortOrder}
        />
        <AdminSelect
          name="status"
          label="Status"
          hint="Only published items appear on public surfaces."
          options={statusOptions}
          defaultValue={values.status}
        />
      </div>
      <Textarea
        name="description"
        label="Description"
        hint="Required supporting copy for the grid card."
        requiredIndicator
        placeholder="Explain the offering or experience point clearly and concisely."
        defaultValue={values.description}
      />
      <AdminFormFooter ref={feedbackRef} error={state?.error}>
        <SubmitButton idleLabel="Create item" pendingLabel="Creating item" disabled={!isDirty} />
      </AdminFormFooter>
    </form>
  );
}
