"use client";

import { useId, useMemo, useRef, useState } from "react";
import fieldStyles from "@/components/ui/field-control/FieldControl.module.css";
import styles from "./SwitchField.module.css";

export default function SwitchField({
  label,
  hint,
  reserveHintSpace = false,
  name,
  id,
  checked,
  defaultChecked = false,
  onChange,
  className = "",
}) {
  const generatedId = useId();
  const switchId = id || name || generatedId;
  const isControlled = typeof checked === "boolean";
  const [internalChecked, setInternalChecked] = useState(Boolean(defaultChecked));
  const hiddenInputRef = useRef(null);
  const currentChecked = isControlled ? checked : internalChecked;
  const shouldRenderHint = Boolean(hint) || reserveHintSpace;
  const hintId = hint ? `${switchId}-hint` : undefined;
  const labelId = label ? `${switchId}-label` : undefined;

  const value = useMemo(() => (currentChecked ? "true" : "false"), [currentChecked]);

  function update(nextChecked) {
    if (!isControlled) {
      setInternalChecked(nextChecked);
    }

    onChange?.(nextChecked);

    requestAnimationFrame(() => {
      if (!hiddenInputRef.current) {
        return;
      }

      hiddenInputRef.current.dispatchEvent(new Event("input", { bubbles: true }));
      hiddenInputRef.current.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  return (
    <div className={[fieldStyles.root, styles.root, className].filter(Boolean).join(" ")}>
      <div className={styles.header}>
        {label ? <span id={labelId} className={fieldStyles.label}>{label}</span> : null}
      </div>
      {name ? <input ref={hiddenInputRef} type="hidden" name={name} value={value} /> : null}
      <div className={styles.controlRow}>
        <button
          id={switchId}
          type="button"
          role="switch"
          aria-checked={currentChecked}
          aria-labelledby={labelId}
          aria-describedby={hintId}
          className={[styles.control, currentChecked ? styles.controlActive : ""].filter(Boolean).join(" ")}
          onClick={() => update(!currentChecked)}
        >
          <span className={[styles.thumb, currentChecked ? styles.thumbActive : ""].filter(Boolean).join(" ")} />
        </button>
      </div>
      <div className={styles.copy}>
        {shouldRenderHint ? <span id={hintId} className={fieldStyles.hint} aria-hidden={!hint}>{hint || "\u00A0"}</span> : null}
      </div>
    </div>
  );
}
