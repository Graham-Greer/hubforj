"use client";

import { useId } from "react";
import Button from "@/components/ui/button/Button";
import FormMessage from "@/components/ui/form-message/FormMessage";
import Modal from "@/components/ui/modal/Modal";
import styles from "./LegalSettingsWorkspace.module.css";

function renderList(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  return (
    <ul className={styles.bulletList}>
      {items.map((item) => (
        <li key={item.key || item.title || item}>{item.title || item}</li>
      ))}
    </ul>
  );
}

export default function LegalSaveConfirmationModal({
  title,
  documentLabel,
  reviewItems = [],
  hasAcknowledged = false,
  onAcknowledgementChange,
  onClose,
  error = "",
}) {
  const checkboxId = useId();

  return (
    <Modal
      title="Confirm legal page update"
      onClose={onClose}
      width="lg"
      actions={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!hasAcknowledged}>
            Confirm and save
          </Button>
        </>
      }
    >
      <div className={styles.modalBody}>
        <p className={styles.mutedBody}>
          {`This will immediately update the public ${documentLabel} page shown on your community website.`}
        </p>
        <p className={styles.mutedBody}>
          The platform provides factual guidance about system behaviour, but your organisation is responsible for the
          accuracy and suitability of the legal content you publish.
        </p>

        {reviewItems.length ? (
          <div className={styles.modalPanel}>
            <h3 className={styles.subheading}>{title}</h3>
            {renderList(reviewItems)}
          </div>
        ) : null}

        <label className={styles.checkboxField} htmlFor={checkboxId}>
          <input
            id={checkboxId}
            type="checkbox"
            checked={hasAcknowledged}
            onChange={(event) => onAcknowledgementChange(event.target.checked)}
          />
          <span>
            I confirm that I am authorised to update this legal page for this hub, and that the hub owner is
            responsible for the accuracy and suitability of this content.
          </span>
        </label>

        {error ? <FormMessage tone="danger">{error}</FormMessage> : null}
      </div>
    </Modal>
  );
}
