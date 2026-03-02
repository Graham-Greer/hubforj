"use client";

import styles from "./Textarea.module.css";

export default function Textarea({ id, rows = 5, resize = "vertical", className = "", ...rest }) {
  return <textarea id={id} rows={rows} className={[styles.root, styles[`resize_${resize}`], className].filter(Boolean).join(" ")} {...rest} />;
}
