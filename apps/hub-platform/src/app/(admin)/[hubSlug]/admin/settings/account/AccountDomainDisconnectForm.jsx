"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import FormMessage from "@/components/ui/form-message/FormMessage";
import Input from "@/components/ui/input/Input";
import SubmitButton from "@/components/ui/submit-button/SubmitButton";
import { disconnectCustomDomainAction } from "../actions";
import styles from "./page.module.css";

const initialState = {
  error: "",
  success: "",
  confirmation: "",
};

export default function AccountDomainDisconnectForm({ hubSlug, hostname }) {
  const router = useRouter();
  const [state, formAction] = useActionState(disconnectCustomDomainAction, initialState);

  useEffect(() => {
    if (!state?.success) {
      return;
    }

    router.refresh();
  }, [router, state?.success]);

  return (
    <form action={formAction} className={styles.disconnectForm}>
      <input type="hidden" name="hubSlug" value={hubSlug} />
      <p className={styles.capabilityDetail}>
        Disconnecting the current custom domain is destructive. The hub will return to its Hubforj-hosted address
        and the custom domain will stop serving this hub once the disconnect executes.
      </p>
      <Input
        name="confirmation"
        label="Confirm current custom domain"
        placeholder={hostname}
        defaultValue={state?.confirmation || ""}
        autoComplete="off"
        hint="Type the current custom domain exactly to confirm removal."
      />
      {state?.error ? <FormMessage tone="danger">{state.error}</FormMessage> : null}
      {state?.success ? <FormMessage tone="success">{state.success}</FormMessage> : null}
      <div className={styles.formActions}>
        <SubmitButton idleLabel="Disconnect custom domain" pendingLabel="Scheduling disconnect" variant="secondary" />
      </div>
    </form>
  );
}
