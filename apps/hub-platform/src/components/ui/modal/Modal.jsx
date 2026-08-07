"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Button from "@/components/ui/button/Button";
import Icon from "@/components/ui/icon/Icon";
import styles from "./Modal.module.css";

export default function Modal({ title, children, onClose, width = "md", actions = null, variant = "default" }) {
  const originRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [themeContext, setThemeContext] = useState({
    theme: "",
    adminTheme: "",
  });

  useEffect(() => {
    const originNode = originRef.current;
    const themeNode = originNode?.closest?.("[data-theme]");
    const adminThemeNode = originNode?.closest?.("[data-admin-theme]");

    setThemeContext({
      theme: themeNode?.getAttribute("data-theme") || "",
      adminTheme: adminThemeNode?.getAttribute("data-admin-theme") || "",
    });
    setMounted(true);
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  if (!mounted) {
    return <span ref={originRef} hidden />;
  }

  return (
    <Fragment>
      <span ref={originRef} hidden />
      {createPortal(
        <div
          className={[styles.backdrop, variant === "sheetOnMobile" ? styles.variantSheetOnMobile : ""].join(" ")}
          role="presentation"
          onClick={onClose}
          data-theme={themeContext.theme || undefined}
          data-modal-theme-context={themeContext.theme ? "scoped" : undefined}
        >
          <div
            className={[styles.dialog, styles[`width_${width}`] || styles.width_md].join(" ")}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onClick={(event) => event.stopPropagation()}
            data-admin-theme={themeContext.adminTheme || undefined}
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
        </div>,
        document.body
      )}
    </Fragment>
  );
}
