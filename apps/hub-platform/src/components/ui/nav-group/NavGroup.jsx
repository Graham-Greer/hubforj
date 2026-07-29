import styles from "./NavGroup.module.css";

export default function NavGroup({ title, children }) {
  return (
    <section className={styles.root}>
      {title ? <p className={styles.title}>{title}</p> : null}
      <div className={styles.items}>{children}</div>
    </section>
  );
}
