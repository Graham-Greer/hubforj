"use client";

import styles from "./Switch.module.css";

export default function Switch({ checked, onChange, label }) {
  return (
    <label className={styles.root}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange?.(event.target.checked)} className={styles.input} />
      <span className={styles.track} aria-hidden="true"><span className={styles.thumb} /></span>
      <span>{label}</span>
    </label>
  );
}
