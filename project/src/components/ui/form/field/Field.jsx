import FieldLabel from "./FieldLabel";
import FieldHint from "./FieldHint";
import FieldError from "./FieldError";
import styles from "./Field.module.css";

export default function Field({ id, label, hint, error, required = false, children }) {
  return (
    <div className={styles.root}>
      {label ? <FieldLabel htmlFor={id} required={required}>{label}</FieldLabel> : null}
      {children}
      <FieldHint>{hint}</FieldHint>
      <FieldError>{error}</FieldError>
    </div>
  );
}
