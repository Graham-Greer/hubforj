import Icon from "@/components/ui/icon/Icon";
import styles from "./Notice.module.css";

const toneClassNames = {
  neutral: styles.toneNeutral,
  info: styles.toneInfo,
  success: styles.toneSuccess,
  warning: styles.toneWarning,
  danger: styles.toneDanger,
};

const defaultIcons = {
  neutral: "info",
  info: "info",
  success: "task_alt",
  warning: "warning",
  danger: "warning",
};

export default function Notice({
  tone = "neutral",
  icon,
  title,
  children,
  className = "",
  role,
}) {
  const normalizedTone = toneClassNames[tone] ? tone : "neutral";
  const classes = [
    styles.root,
    toneClassNames[normalizedTone],
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const iconName = icon || defaultIcons[normalizedTone] || defaultIcons.neutral;

  return (
    <aside className={classes} role={role}>
      <span className={styles.icon} aria-hidden="true">
        <Icon name={iconName} size="sm" decorative />
      </span>
      <div className={styles.copy}>
        {title ? <strong className={styles.title}>{title}</strong> : null}
        {children ? <div className={styles.body}>{children}</div> : null}
      </div>
    </aside>
  );
}
