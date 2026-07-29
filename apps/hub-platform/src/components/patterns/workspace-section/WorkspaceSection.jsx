import Surface from "@/components/primitives/surface/Surface";
import styles from "./WorkspaceSection.module.css";

export default function WorkspaceSection({
  eyebrow,
  title,
  description,
  actions = null,
  children,
  tone = "default",
  className = "",
  ...rest
}) {
  return (
    <Surface tone={tone} className={[styles.root, className].filter(Boolean).join(" ")} {...rest}>
      <div className={styles.header}>
        <div className={styles.copy}>
          {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
          {title ? <h2 className={styles.title}>{title}</h2> : null}
          {description ? <p className={styles.description}>{description}</p> : null}
        </div>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </div>
      {children ? <div className={styles.body}>{children}</div> : null}
    </Surface>
  );
}
