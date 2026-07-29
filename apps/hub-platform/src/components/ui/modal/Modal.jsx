"use client";

import { useEffect } from "react";
import Button from "@/components/ui/button/Button";
import Icon from "@/components/ui/icon/Icon";
import styles from "./Modal.module.css";

export default function Modal({ title, children, onClose, width = "md", actions = null, variant = "default" }) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div
      className={[styles.backdrop, variant === "sheetOnMobile" ? styles.variantSheetOnMobile : ""].join(" ")}
      role="presentation"
      onClick={onClose}
    >
      <div
        className={[styles.dialog, styles[`width_${width}`] || styles.width_md].join(" ")}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <Button
            variant="secondary"
            iconOnly
            aria-label="Close dialog"
            title="Close dialog"
            className={styles.closeButton}
            onClick={onClose}
          >
            <Icon name="close" decorative />
          </Button>
        </div>
        <div className={styles.content}>{children}</div>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </div>
    </div>
  );
}
