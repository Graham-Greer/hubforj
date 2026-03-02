import ErrorState from "@/components/ui/error-state/ErrorState";
import styles from "./SectionRenderFallback.module.css";

export default function SectionRenderFallback({ type }) {
  return (
    <div className={styles.root}>
      <ErrorState
        title="Unknown section block"
        body={`This page includes an unsupported block type: ${type || "unknown"}.`}
        variant="compact"
      />
    </div>
  );
}
