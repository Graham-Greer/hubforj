import Badge from "../../../ui/badge/Badge";
import Button from "../../../ui/button/Button";
import styles from "./PublishBar.module.css";

export default function PublishBar({ status = "draft", onPublish, onUnpublish }) {
  return (
    <footer className={styles.root}>
      <Badge tone={status === "published" ? "brand" : "neutral"}>{status}</Badge>
      <div className={styles.actions}>
        {status === "published" ? (
          <Button variant="secondary" onClick={onUnpublish}>Unpublish</Button>
        ) : (
          <Button intent="brand" onClick={onPublish}>Publish</Button>
        )}
      </div>
    </footer>
  );
}
