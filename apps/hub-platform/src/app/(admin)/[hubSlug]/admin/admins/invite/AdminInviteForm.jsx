"use client";

import { useActionState, useEffect, useRef } from "react";
import AdminFormFooter from "@/components/patterns/admin-form-footer/AdminFormFooter";
import AdminSelect from "@/components/ui/admin-select/AdminSelect";
import Input from "@/components/ui/input/Input";
import SubmitButton from "@/components/ui/submit-button/SubmitButton";
import useDirtyFormState from "@/hooks/use-dirty-form-state";
import {
  createFormSnapshotFromKeys,
  createSavedSnapshotFromKeys,
} from "@/lib/forms/admin-form-snapshots";
import { initialAdminInviteFormState } from "./form-state";
import { createHubAdminInviteAction } from "./actions";
import styles from "./page.module.css";

const roleOptions = [{ value: "admin", label: "Admin" }];
const fieldKeys = Object.keys(initialAdminInviteFormState.values);

function createSavedValuesSnapshot(values) {
  return createSavedSnapshotFromKeys(fieldKeys, initialAdminInviteFormState.values, values);
}

function createFormSnapshot(form) {
  return createFormSnapshotFromKeys(form, fieldKeys);
}

export default function AdminInviteForm({ hubSlug }) {
  const [state, formAction] = useActionState(createHubAdminInviteAction, initialAdminInviteFormState);
  const feedbackRef = useRef(null);
  const values = {
    ...initialAdminInviteFormState.values,
    ...(state?.values || {}),
  };
  const { formRef, isDirty, updateDirtyState } = useDirtyFormState({
    initialSnapshot: createSavedValuesSnapshot(initialAdminInviteFormState.values),
    createFormSnapshot,
  });

  useEffect(() => {
    if (!feedbackRef.current || !state?.error) {
      return;
    }

    feedbackRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [state?.error]);

  return (
      <form
        ref={formRef}
        className={styles.form}
        action={formAction}
        onInput={updateDirtyState}
        onChange={updateDirtyState}
      >
        <input type="hidden" name="hubSlug" value={hubSlug} />
        <Input
          name="email"
          label="Email address"
          type="email"
          placeholder="alex@example.com"
          hint="We will email the invite to this address, and the same email will be used for future sign-in."
          defaultValue={values.email}
          requiredIndicator
        />
        <AdminSelect
          name="role"
          label="Role"
          options={roleOptions}
          hint="Role assignment stays intentionally constrained to admin access for now."
          defaultValue={values.role}
        />
        <AdminFormFooter ref={feedbackRef} error={state?.error}>
          <SubmitButton idleLabel="Send invite email" pendingLabel="Sending invite email" disabled={!isDirty} />
        </AdminFormFooter>
      </form>
  );
}
