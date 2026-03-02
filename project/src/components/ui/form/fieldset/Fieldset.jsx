import Legend from "./Legend";
import styles from "./Fieldset.module.css";

export default function Fieldset({ legend, hint, children }) {
  return (
    <fieldset className={styles.root}>
      {legend ? <Legend>{legend}</Legend> : null}
      {hint ? <p className={styles.hint}>{hint}</p> : null}
      <div className={styles.content}>{children}</div>
    </fieldset>
  );
}
