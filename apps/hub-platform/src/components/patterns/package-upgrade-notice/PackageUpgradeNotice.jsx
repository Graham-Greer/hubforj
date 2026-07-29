import Badge from "@/components/ui/badge/Badge";
import Surface from "@/components/primitives/surface/Surface";
import styles from "./PackageUpgradeNotice.module.css";

export default function PackageUpgradeNotice({ title, description, currentUsage = 0, limit = 0, unlocks = [] }) {
  const shouldShowUsage = Number.isFinite(Number(limit)) && Number(limit) > 0;

  return (
    <Surface tone="muted" className={styles.root}>
      <div className={styles.header}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>Upgrade moment</p>
          <h3 className={styles.title}>{title}</h3>
          {description ? <p className={styles.description}>{description}</p> : null}
        </div>
        {shouldShowUsage ? <Badge tone="warning">{`${currentUsage}/${limit}`}</Badge> : null}
      </div>
      {unlocks.length ? (
        <div className={styles.unlocks}>
          <p className={styles.unlocksTitle}>Growth unlocks</p>
          <ul className={styles.unlocksList}>
            {unlocks.map((item) => (
              <li key={item} className={styles.unlockItem}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Surface>
  );
}
