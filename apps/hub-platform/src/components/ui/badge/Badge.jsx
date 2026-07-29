import styles from "./Badge.module.css";

const toneClassNames = {
  neutral: styles.toneNeutral,
  accent: styles.toneAccent,
  info: styles.toneInfo,
  success: styles.toneSuccess,
  warning: styles.toneWarning,
  danger: styles.toneDanger,
};

const sizeClassNames = {
  md: "",
  sm: styles.sizeSm,
};

export default function Badge({ children, tone = "neutral", size = "md", className = "" }) {
  const toneClassName = toneClassNames[tone] || toneClassNames.neutral;
  const sizeClassName = sizeClassNames[size] || "";

  return <span className={[styles.root, toneClassName, sizeClassName, className].filter(Boolean).join(" ")}>{children}</span>;
}
