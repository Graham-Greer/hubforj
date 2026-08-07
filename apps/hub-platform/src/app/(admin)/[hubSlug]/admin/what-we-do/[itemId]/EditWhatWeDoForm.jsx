"use client";

import { useActionState, useEffect, useRef } from "react";
import AdminDiscardChangesButton from "@/components/patterns/admin-form-runtime/AdminDiscardChangesButton";
import AdminFormFooter from "@/components/patterns/admin-form-footer/AdminFormFooter";
import AdminSelect from "@/components/ui/admin-select/AdminSelect";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import SubmitButton from "@/components/ui/submit-button/SubmitButton";
import Textarea from "@/components/ui/textarea/Textarea";
import useDirtyFormState from "@/hooks/use-dirty-form-state";
import {
  createFormSnapshotFromKeys,
  createSavedSnapshotFromKeys,
} from "@/lib/forms/admin-form-snapshots";
import { initialUpdateWhatWeDoFormState } from "./form-state";
import { updateWhatWeDoAction } from "./actions";
import styles from "./page.module.css";

const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

const fieldKeys = Object.keys(initialUpdateWhatWeDoFormState.values);

function createSavedValuesSnapshot(values) {
  return createSavedSnapshotFromKeys(fieldKeys, initialUpdateWhatWeDoFormState.values, values);
}

function createFormSnapshot(form) {
  return createFormSnapshotFromKeys(form, fieldKeys);
}

export default function EditWhatWeDoForm({ hub, item, initialSuccessMessage = "", returnContext = null }) {
  const cancelHref = returnContext?.returnTo ? returnContext.href : `/${hub.slug}/admin/what-we-do`;
  const initialState = {
    ...initialUpdateWhatWeDoFormState,
    success: initialSuccessMessage,
    values: {
      ...initialUpdateWhatWeDoFormState.values,
      title: item?.title || "",
      description: item?.description || "",
      status: item?.status || initialUpdateWhatWeDoFormState.values.status,
      sortOrder: String(item?.sortOrder || 0),
    },
  };
  const initialSavedSnapshot = createSavedValuesSnapshot(initialState.values);
  const [state, formAction] = useActionState(updateWhatWeDoAction, initialState);
  const initialValuesRef = useRef(initialState.values);
  const feedbackRef = useRef(null);
  const values = {
    ...initialUpdateWhatWeDoFormState.values,
    ...initialState.values,
    ...(state?.values || {}),
  };
  const { formRef, isDirty, updateDirtyState, markSaved } = useDirtyFormState({
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

  const submitIdleLabel = state?.success && !isDirty ? "Item saved" : "Save item";

  return (
    <form ref={formRef} className={styles.form} action={formAction} onInput={updateDirtyState} onChange={updateDirtyState}>
      <input type="hidden" name="hubId" value={hub.id} />
      <input type="hidden" name="hubSlug" value={hub.slug} />
      <input type="hidden" name="itemId" value={item.id} />
      {returnContext?.returnTo ? <input type="hidden" name="returnTo" value={returnContext.returnTo} /> : null}
      {returnContext?.returnSection ? <input type="hidden" name="returnSection" value={returnContext.returnSection} /> : null}
      <div className={styles.grid}>
        <Input
          name="title"
          label="Title"
          hint="Required short heading shown on the public grid card."
          requiredIndicator
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
        defaultValue={values.description}
      />
      <AdminFormFooter ref={feedbackRef} error={state?.error} success={state?.success}>
        <div className={styles.footerActionStart}>
          {isDirty ? (
            <AdminDiscardChangesButton
              href={cancelHref}
              label="Cancel"
              variant="secondary"
            />
          ) : (
            <Button href={cancelHref} variant="secondary">
              Cancel
            </Button>
          )}
        </div>
        <div className={styles.footerActionEnd}>
          <SubmitButton idleLabel={submitIdleLabel} pendingLabel="Saving item" disabled={!isDirty} />
        </div>
      </AdminFormFooter>
    </form>
  );
}
