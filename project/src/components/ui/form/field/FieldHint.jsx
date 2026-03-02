import styles from "./FieldHint.module.css";

export default function FieldHint({ children }) {
  if (!children) return null;
  return <p className={styles.root}>{children}</p>;
}
