import Badge from "@/components/ui/badge/Badge";
import styles from "./RegistrationRecordCell.module.css";

export default function RegistrationRecordCell({ display, primaryClassName }) {
  if (!display?.asBadge) {
    return <p className={primaryClassName}>{display?.label || "Unknown"}</p>;
  }

  return (
    <div className={styles.badgeWrap}>
      <Badge tone={display.tone} size="sm">{display.label}</Badge>
    </div>
  );
}
