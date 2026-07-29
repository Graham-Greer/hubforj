import styles from "./AdminFormSection.module.css";

export default function AdminFormSection({
  title,
  description = "",
  children,
  divider = false,
  className = "",
}) {
  return (
    <section
      className={[
        styles.root,
        divider ? styles.divider : "",
        className,
      ].filter(Boolean).join(" ")}
    >
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {description ? <p className={styles.description}>{description}</p> : null}
      </div>
      <div className={styles.body}>{children}</div>
    </section>
  );
}
