"use client";

import styles from "./Radio.module.css";

export default function Radio({ checked, onChange, label, name, value, ...rest }) {
  const inputProps = {};
  if (checked !== undefined) {
    inputProps.checked = checked;
  }

  return (
    <label className={styles.root}>
      <input
        type="radio"
        className={styles.input}
        onChange={(event) => onChange?.(event.target.checked)}
        name={name}
        value={value}
        {...inputProps}
        {...rest}
      />
      <span className={styles.control} aria-hidden="true">
        <span className={styles.dot} />
      </span>
      <span className={styles.label}>{label}</span>
    </label>
  );
}
