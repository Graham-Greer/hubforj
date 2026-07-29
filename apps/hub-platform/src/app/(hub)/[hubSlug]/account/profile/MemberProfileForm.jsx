"use client";

import { useActionState, useEffect, useState } from "react";
import FormMessage from "@/components/ui/form-message/FormMessage";
import Input from "@/components/ui/input/Input";
import SubmitButton from "@/components/ui/submit-button/SubmitButton";
import { initialMemberProfileFormState } from "./form-state";
import { updateMemberProfileAction } from "./actions";
import styles from "./page.module.css";

export default function MemberProfileForm({ hubSlug, member }) {
  const [dismissedSuccess, setDismissedSuccess] = useState("");
  const seededState = {
    ...initialMemberProfileFormState,
    values: {
      name: member.name || "",
    },
  };

  const [state, formAction] = useActionState(updateMemberProfileAction, seededState);
  const values = {
    ...seededState.values,
    ...(state?.values || {}),
  };
  const visibleSuccess = state?.success && state.success !== dismissedSuccess ? state.success : "";

  useEffect(() => {
    if (!visibleSuccess) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setDismissedSuccess(visibleSuccess);
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [visibleSuccess]);

  return (
    <>
      {state?.error ? <FormMessage tone="danger">{state.error}</FormMessage> : null}
      {visibleSuccess ? <FormMessage tone="success">{visibleSuccess}</FormMessage> : null}
      <form className={styles.form} action={formAction}>
        <input type="hidden" name="hubSlug" value={hubSlug} />
        <Input
          name="name"
          label="Full name"
          placeholder="Your full name"
          hint="This is the name shown across your account, bookings, and member-facing records."
          defaultValue={values.name}
        />
        <div className={styles.actions}>
          <SubmitButton idleLabel="Save profile" pendingLabel="Saving profile..." />
        </div>
      </form>
    </>
  );
}
