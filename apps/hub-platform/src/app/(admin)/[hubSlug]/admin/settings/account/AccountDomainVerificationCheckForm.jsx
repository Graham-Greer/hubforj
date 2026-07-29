"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import FormMessage from "@/components/ui/form-message/FormMessage";
import SubmitButton from "@/components/ui/submit-button/SubmitButton";
import { checkCustomDomainVerificationAction } from "../actions";
import styles from "./page.module.css";

const initialState = {
  error: "",
  success: "",
};

export default function AccountDomainVerificationCheckForm({ hubSlug }) {
  const router = useRouter();
  const [state, formAction] = useActionState(checkCustomDomainVerificationAction, initialState);

  useEffect(() => {
    if (!state?.success) {
      return;
    }

    router.refresh();
  }, [router, state?.success]);

  return (
    <form action={formAction} className={styles.formActions}>
      <input type="hidden" name="hubSlug" value={hubSlug} />
      {state?.error ? <FormMessage tone="danger">{state.error}</FormMessage> : null}
      {state?.success ? <FormMessage tone="success">{state.success}</FormMessage> : null}
      <SubmitButton idleLabel="Check again" pendingLabel="Checking verification" variant="secondary" />
    </form>
  );
}
