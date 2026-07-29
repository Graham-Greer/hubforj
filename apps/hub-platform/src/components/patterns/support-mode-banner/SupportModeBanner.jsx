import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Icon from "@/components/ui/icon/Icon";
import { buildSupportModeBanner } from "@/lib/auth/support-mode";
import { exitSupportModeAction } from "@/lib/auth/support-mode-actions";
import styles from "./SupportModeBanner.module.css";

export default function SupportModeBanner({ hub, supportMode }) {
  const exitAction = exitSupportModeAction.bind(null, hub.id);

  return (
    <div className={styles.root}>
      <div className={styles.copy}>
        <div className={styles.header}>
          <Badge tone="warning">Support mode</Badge>
          <span className={styles.meta}>Operator session active</span>
        </div>
        <p className={styles.body}>{buildSupportModeBanner(hub)}. Entered at {new Date(supportMode.startedAt * 1000).toLocaleString()}.</p>
      </div>
      <div className={styles.actions}>
        <form action={exitAction}>
          <Button type="submit" variant="secondary">
            <Icon name="close" size="md" />
            <span>Exit support mode</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
