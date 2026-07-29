"use client";

import { startTransition, useActionState, useState } from "react";
import Button from "@/components/ui/button/Button";
import CompactMenu from "@/components/ui/compact-menu/CompactMenu";
import FormMessage from "@/components/ui/form-message/FormMessage";
import Icon from "@/components/ui/icon/Icon";
import Modal from "@/components/ui/modal/Modal";
import styles from "./OperationalStatusMenu.module.css";

export default function OperationalStatusMenu({
  action,
  initialState,
  currentLabel,
  triggerAriaLabel,
  options = [],
  buildFormData,
}) {
  const [state, formAction] = useActionState(action, initialState);
  const [pendingConfirmation, setPendingConfirmation] = useState(null);

  function submitValue(nextValue) {
    const formData = buildFormData(nextValue);
    startTransition(() => formAction(formData));
  }

  const items = options.map((option) => ({
    value: option.value,
    label: option.label,
    active: Boolean(option.active),
    disabled: Boolean(option.disabled),
    onSelect: (nextValue) => {
      if (option.confirmation) {
        setPendingConfirmation({
          value: nextValue,
          title: option.confirmation.title,
          body: option.confirmation.body || [],
          confirmLabel: option.confirmation.confirmLabel || "Confirm",
        });
        return;
      }

      submitValue(nextValue);
    },
  }));

  return (
    <>
      <div className={styles.statusCell}>
        <span className={styles.statusValue}>{currentLabel}</span>
        {items.length ? (
          <CompactMenu triggerAriaLabel={triggerAriaLabel} items={items}>
            <Icon name="more_vert" size="sm" decorative />
          </CompactMenu>
        ) : null}
        {state?.error ? <FormMessage tone="danger" className={styles.message}>{state.error}</FormMessage> : null}
      </div>

      {pendingConfirmation ? (
        <Modal
          title={pendingConfirmation.title}
          onClose={() => setPendingConfirmation(null)}
          actions={
            <>
              <Button type="button" variant="ghost" onClick={() => setPendingConfirmation(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  const nextValue = pendingConfirmation.value;
                  setPendingConfirmation(null);
                  submitValue(nextValue);
                }}
              >
                {pendingConfirmation.confirmLabel}
              </Button>
            </>
          }
        >
          <div className={styles.modalBody}>
            {pendingConfirmation.body.map((copy) => (
              <p key={copy} className={styles.modalCopy}>
                {copy}
              </p>
            ))}
          </div>
        </Modal>
      ) : null}
    </>
  );
}
