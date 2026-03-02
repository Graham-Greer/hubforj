"use client";

import styles from "./Checkbox.module.css";

export default function Checkbox({ checked, onChange, label, ...rest }) {
  const inputProps = {};
  if (checked !== undefined) {
    inputProps.checked = checked;
  }

  return (
    <label className={styles.root}>
      <input
        type="checkbox"
        className={styles.input}
        onChange={(event) => onChange?.(event.target.checked)}
        {...inputProps}
        {...rest}
      />
      <span className={styles.control} aria-hidden="true">
        <span className={styles.check} />
      </span>
      <span className={styles.label}>{label}</span>
    </label>
  );
}
