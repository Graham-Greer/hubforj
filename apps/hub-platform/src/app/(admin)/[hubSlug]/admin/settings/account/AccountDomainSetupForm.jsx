"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import FormMessage from "@/components/ui/form-message/FormMessage";
import Input from "@/components/ui/input/Input";
import SubmitButton from "@/components/ui/submit-button/SubmitButton";
import { requestCustomDomainAction } from "../actions";
import styles from "./page.module.css";

const initialState = {
  error: "",
  success: "",
  values: {
    hostname: "",
  },
};

export default function AccountDomainSetupForm({ hubSlug, domainState, initialHostname = "" }) {
  const router = useRouter();
  const seededState = {
    ...initialState,
    values: {
      hostname: initialHostname || "",
    },
  };
  const [state, formAction] = useActionState(requestCustomDomainAction, seededState);
  const values = {
    ...seededState.values,
    ...(state?.values || {}),
  };
  const isPendingState = domainState?.status === "pending_verification" || domainState?.status === "verifying";

  useEffect(() => {
    if (!state?.success) {
      return;
    }

    router.refresh();
  }, [router, state?.success]);

  return (
    <form action={formAction} className={styles.domainSetupForm}>
      <input type="hidden" name="hubSlug" value={hubSlug} />
      <div className={styles.domainSetupGrid}>
        <Input
          name="hostname"
          label="Primary custom domain"
          placeholder="community.example.org"
          hint={
            isPendingState
              ? "This hostname is currently stored in pending verification. You can still update it before the connection is finalized."
              : "Use the client-owned hostname that should replace the Hubforj-hosted subdomain for public, member, and admin access."
          }
          defaultValue={values.hostname}
        />
      </div>

      {state?.error ? <FormMessage tone="danger">{state.error}</FormMessage> : null}
      {state?.success ? <FormMessage tone="success">{state.success}</FormMessage> : null}

      <div className={styles.formActions}>
        <SubmitButton
          idleLabel={isPendingState ? "Update domain request" : "Start domain setup"}
          pendingLabel={isPendingState ? "Updating domain request" : "Starting domain setup"}
        />
      </div>
    </form>
  );
}
