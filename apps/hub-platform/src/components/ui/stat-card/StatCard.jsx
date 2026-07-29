import Surface from "@/components/primitives/surface/Surface";
import styles from "./StatCard.module.css";

function joinClassNames(...values) {
  return values.filter(Boolean).join(" ");
}

export default function StatCard({ label, value, detail, className = "" }) {
  return (
    <Surface tone="muted" padding="md" className={joinClassNames(styles.root, className)}>
      <span className={styles.label}>{label}</span>
      <strong className={styles.value}>{value}</strong>
      {detail ? <span className={styles.detail}>{detail}</span> : null}
    </Surface>
  );
}
