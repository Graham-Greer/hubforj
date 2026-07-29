"use client";

import styles from "./NavToggleButton.module.css";

export default function NavToggleButton({
  open = false,
  onClick,
  label = "Toggle navigation",
  variant = "default",
  className = "",
  ...props
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-expanded={open}
      className={[
        styles.root,
        variant === "secondary" ? styles.variantSecondary : "",
        open ? styles.open : "",
        className,
      ].filter(Boolean).join(" ")}
      onClick={onClick}
      {...props}
    >
      <span className={styles.line} />
      <span className={styles.line} />
      <span className={styles.line} />
    </button>
  );
}
