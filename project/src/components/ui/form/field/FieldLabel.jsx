import styles from "./FieldLabel.module.css";

export default function FieldLabel({ htmlFor, required = false, children }) {
  return (
    <label htmlFor={htmlFor} className={styles.root}>
      {children}
      {required ? <span className={styles.required}>*</span> : null}
    </label>
  );
}
