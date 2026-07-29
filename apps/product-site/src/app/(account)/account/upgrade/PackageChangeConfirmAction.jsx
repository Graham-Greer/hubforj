"use client";

import { useEffect, useId, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

function normalizeString(value) {
  return String(value || "").trim();
}

export default function PackageChangeConfirmAction({
  action,
  targetTier,
  triggerLabel,
  confirmLabel,
  eyebrow = "Confirm change",
  currentLabel = "Current package",
  currentTitle,
  currentPriceLabel,
  targetLabel = "New package",
  targetTitle,
  targetPriceLabel,
  title,
  description,
  effectiveTiming,
  note = "",
}) {
  const dialogId = useId();
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      document.body.style.removeProperty("overflow");
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <button type="button" className="button-link" data-variant="primary" onClick={() => setIsOpen(true)}>
        {triggerLabel}
      </button>
      {isMounted && isOpen
        ? createPortal(
            <div className="confirm-modal-root" role="presentation">
              <div className="confirm-modal-overlay" onClick={() => setIsOpen(false)} />
              <div
                id={dialogId}
                className="confirm-modal-card"
                role="dialog"
                aria-modal="true"
                aria-labelledby={`${dialogId}-title`}
              >
                <div className="confirm-modal-header">
                  <div className="subsection-heading">
                    <span className="eyebrow">{eyebrow}</span>
                    <h2 id={`${dialogId}-title`} className="section-title">
                      {title}
                    </h2>
                    <p className="section-copy">{description}</p>
                  </div>
                </div>
                <div className="confirm-modal-body">
                  <div className="confirm-modal-compare">
                    <div className="confirm-modal-package">
                      <span className="stat-label">{currentLabel}</span>
                      <strong>{currentTitle}</strong>
                      <span>{currentPriceLabel}/month</span>
                    </div>
                    <div className="confirm-modal-arrow" aria-hidden="true">
                      <span className="material-symbols-outlined">arrow_forward</span>
                    </div>
                    <div className="confirm-modal-package">
                      <span className="stat-label">{targetLabel}</span>
                      <strong>{targetTitle}</strong>
                      <span>{targetPriceLabel}/month</span>
                    </div>
                  </div>
                  <div className="confirm-modal-meta">
                    <div>
                      <span className="stat-label">When it takes effect</span>
                      <strong>{effectiveTiming}</strong>
                    </div>
                    {normalizeString(note) ? (
                      <div>
                        <span className="stat-label">Billing note</span>
                        <strong>{note}</strong>
                      </div>
                    ) : null}
                  </div>
                </div>
                <form action={action} className="confirm-modal-actions">
                  <input type="hidden" name="targetTier" value={targetTier} />
                  <button type="submit" className="button-link" data-variant="primary">
                    {confirmLabel}
                  </button>
                  <button type="button" className="button-link" data-variant="secondary" onClick={() => setIsOpen(false)}>
                    Cancel
                  </button>
                </form>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
