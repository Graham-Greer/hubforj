import Icon from "../../primitives/icon/Icon";
import styles from "./Toast.module.css";

export default function Toast({ variant = "info", title, body, action, onClose }) {
  return (
    <article className={[styles.root, styles[`variant_${variant}`]].join(" ")} role="status">
      <div className={styles.headerRow}>
        <Icon name="notifications" decorative />
        <strong>{title}</strong>
      </div>
      {body ? <p className={styles.body}>{body}</p> : null}
      <div className={styles.actions}>
        {action}
        {onClose ? (
          <button type="button" onClick={onClose} className={styles.closeButton}>
            Dismiss
          </button>
        ) : null}
      </div>
    </article>
  );
}
