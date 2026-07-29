import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Surface from "@/components/primitives/surface/Surface";
import styles from "./SettingsPanelCard.module.css";

export default function SettingsPanelCard({ title, body, href = "", meta = "", actionLabel = "", status = null, onboardingKey = "" }) {
  return (
    <Surface padding="md" className={styles.card} data-onboarding={onboardingKey || undefined}>
      <div className={styles.copy}>
        <div className={styles.titleRow}>
          <h2 className={styles.cardTitle}>{title}</h2>
          {status ? <Badge tone={status.tone}>{status.label}</Badge> : null}
        </div>
        <p className={styles.cardBody}>{body}</p>
        {meta ? <p className={styles.cardMeta}>{meta}</p> : null}
      </div>
      {href && actionLabel ? (
        <div className={styles.actions}>
          <Button href={href} variant="secondary">{actionLabel}</Button>
        </div>
      ) : null}
    </Surface>
  );
}
