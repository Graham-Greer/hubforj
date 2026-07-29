import Button from "@/components/ui/button/Button";
import Surface from "@/components/primitives/surface/Surface";
import styles from "./EmptyState.module.css";

export default function EmptyState({ eyebrow, title, description, primaryAction, secondaryAction }) {
  return (
    <Surface tone="muted" className={styles.root}>
      {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.description}>{description}</p>
      {(primaryAction || secondaryAction) ? (
        <div className={styles.actions}>
          {primaryAction ? (
            <Button
              href={primaryAction.href}
              target={primaryAction.external ? "_blank" : undefined}
              rel={primaryAction.external ? "noreferrer" : undefined}
            >
              {primaryAction.label}
            </Button>
          ) : null}
          {secondaryAction ? (
            <Button
              href={secondaryAction.href}
              variant="secondary"
              target={secondaryAction.external ? "_blank" : undefined}
              rel={secondaryAction.external ? "noreferrer" : undefined}
            >
              {secondaryAction.label}
            </Button>
          ) : null}
        </div>
      ) : null}
    </Surface>
  );
}
