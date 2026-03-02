"use client";

import styles from "./WysiwygEditor.module.css";

export default function WysiwygEditor({ value = "", onChange, disabled = false }) {
  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <span className={styles.tool}>Bold</span>
        <span className={styles.tool}>Italic</span>
        <span className={styles.tool}>Underline</span>
        <span className={styles.tool}>List</span>
        <span className={styles.tool}>Link</span>
      </div>
      <textarea
        className={styles.area}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        disabled={disabled}
        rows={8}
      />
    </div>
  );
}
