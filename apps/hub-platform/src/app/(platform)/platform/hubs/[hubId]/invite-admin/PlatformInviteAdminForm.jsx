"use client";

import { useActionState } from "react";
import FormMessage from "@/components/ui/form-message/FormMessage";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/select/Select";
import SubmitButton from "@/components/ui/submit-button/SubmitButton";
import { initialPlatformInviteFormState } from "./form-state";
import { createAdminInviteAction } from "./actions";
import styles from "./page.module.css";

const roleOptions = [{ value: "admin", label: "Admin" }];

export default function PlatformInviteAdminForm({ hubId }) {
  const [state, formAction] = useActionState(createAdminInviteAction, initialPlatformInviteFormState);
  const values = {
    ...initialPlatformInviteFormState.values,
    ...(state?.values || {}),
  };

  return (
    <>
      {state?.error ? <FormMessage tone="danger">{state.error}</FormMessage> : null}
      <form className={styles.form} action={formAction}>
        <input type="hidden" name="hubId" value={hubId} />
        <Input
          name="email"
          label="Email address"
          type="email"
          placeholder="alex@example.com"
          hint="We will email the invite to this address, and the same email will be used for sign-in."
          defaultValue={values.email}
        />
        <Select
          name="role"
          label="Role"
          options={roleOptions}
          hint="Keep access intentional and easy to reason about."
          defaultValue={values.role}
        />
        <div className={styles.actions}>
          <SubmitButton idleLabel="Send invite email" pendingLabel="Sending invite email" />
        </div>
      </form>
    </>
  );
}
