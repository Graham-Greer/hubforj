import styles from "./FormMessage.module.css";

const toneClassNames = {
  danger: styles.toneDanger,
  success: styles.toneSuccess,
  info: styles.toneInfo,
};

export default function FormMessage({ tone = "info", children, className = "" }) {
  const toneClassName = toneClassNames[tone] || toneClassNames.info;
  const role = tone === "danger" ? "alert" : "status";
  const ariaLive = tone === "danger" ? "assertive" : "polite";

  return (
    <p
      className={[styles.root, toneClassName, className].filter(Boolean).join(" ")}
      role={role}
      aria-live={ariaLive}
    >
      {children}
    </p>
  );
}
