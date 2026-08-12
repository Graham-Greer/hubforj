"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import FormMessage from "@/components/ui/form-message/FormMessage";
import Icon from "@/components/ui/icon/Icon";
import Input from "@/components/ui/input/Input";
import Notice from "@/components/ui/notice/Notice";
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
        Disconnecting your custom domain will stop it from working with your hub.
      </p>
      <Notice
        tone="warning"
        icon="warning"
        title="Disconnecting will make your domain inactive"
        className={styles.disconnectWarningNotice}
      >
        <p>Your domain ({hostname}) will no longer work with this hub.</p>
        <p>Visitors will not be able to access your site using this domain.</p>
      </Notice>

      <div className={styles.disconnectConfirmationPanel}>
        <p className={styles.capabilityDetail}>To confirm, type your domain below:</p>
        <Input
          name="confirmation"
          label=""
          aria-label="Confirm custom domain"
          placeholder={hostname}
          defaultValue={state?.confirmation || ""}
          autoComplete="off"
        />
        {state?.error ? <FormMessage tone="danger">{state.error}</FormMessage> : null}
        {state?.success ? <FormMessage tone="success">{state.success}</FormMessage> : null}
        <div className={styles.disconnectDangerLine}>
          <Icon name="warning" size="sm" tone="danger" decorative />
          <strong>This action cannot be undone.</strong>
        </div>
        <div className={styles.formActions}>
          <SubmitButton
            idleLabel={(
              <>
                <Icon name="cancel" size="sm" decorative />
                <span>Disconnect domain</span>
              </>
            )}
            pendingLabel="Disconnecting domain"
            variant="secondary"
            className={styles.disconnectSubmit}
          />
        </div>
      </div>
    </form>
  );
}
