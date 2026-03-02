import styles from "./FieldError.module.css";

export default function FieldError({ children }) {
  if (!children) return null;
  return <p className={styles.root} role="alert">{children}</p>;
}
