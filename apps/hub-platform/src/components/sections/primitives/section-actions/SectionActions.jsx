import Button from "@/components/ui/button/Button";
import Icon from "@/components/ui/icon/Icon";
import styles from "./SectionActions.module.css";

const alignClassNames = {
  start: styles.alignStart,
  center: styles.alignCenter,
  end: styles.alignEnd,
};

export default function SectionActions({ actions = [], align = "start", size = "md", className = "" }) {
  const resolvedActions = actions.filter(Boolean).slice(0, 2);

  if (resolvedActions.length === 0) {
    return null;
  }

  return (
    <div className={[styles.root, alignClassNames[align] || alignClassNames.start, className].filter(Boolean).join(" ")}>
      {resolvedActions.map((action) => (
        <Button
          key={`${action.label}-${action.href || action.onClick || ""}`}
          href={action.href}
          prefetch={action.href && !action.external ? false : undefined}
          onClick={action.onClick}
          variant={action.variant || "primary"}
          size={size}
          className={styles.action}
          target={action.external ? "_blank" : undefined}
          rel={action.external ? "noreferrer" : undefined}
        >
          {action.icon ? <Icon name={action.icon} size="md" /> : null}
          <span>{action.label}</span>
        </Button>
      ))}
    </div>
  );
}
