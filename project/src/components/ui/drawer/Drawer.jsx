"use client";

import { useEffect, useId, useRef } from "react";
import styles from "./Drawer.module.css";

function getFocusableElements(container) {
  if (!container) return [];
  return Array.from(
    container.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  );
}

export default function Drawer({ open, onClose, title, side = "right", size = "md", children }) {
  const titleId = useId();
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement;

    const onKey = (event) => {
      if (event.key === "Escape") {
        onClose?.();
        return;
      }
      if (event.key !== "Tab") return;
      const focusables = getFocusableElements(panelRef.current);
      if (!focusables.length) {
        event.preventDefault();
        panelRef.current?.focus();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const current = document.activeElement;

      if (event.shiftKey && current === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && current === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const focusables = getFocusableElements(panelRef.current);
    if (focusables.length) focusables[0].focus();
    else panelRef.current?.focus();

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (previouslyFocused && typeof previouslyFocused.focus === "function") {
        previouslyFocused.focus();
      }
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <aside
        ref={panelRef}
        className={[styles.panel, styles[`side_${side}`], styles[`size_${size}`]].join(" ")}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <h3 id={titleId}>{title}</h3>
          <button type="button" onClick={onClose} className={styles.closeButton}>
            Close
          </button>
        </header>
        <div className={styles.content}>{children}</div>
      </aside>
    </div>
  );
}
