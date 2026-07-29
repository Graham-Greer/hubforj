import Button from "@/components/ui/button/Button";
import Icon from "@/components/ui/icon/Icon";
import Surface from "@/components/primitives/surface/Surface";
import styles from "./LockedFeatureState.module.css";

export default function LockedFeatureState({
  eyebrow = "Upgrade required",
  title,
  description,
  unlocks = [],
  secondaryAction,
  rootOnboardingKey = "",
  unlocksOnboardingKey = "",
  secondaryActionOnboardingKey = "",
}) {
  return (
    <Surface className={styles.root} data-onboarding={rootOnboardingKey || undefined}>
      <div className={styles.identity}>
        <span className={styles.iconWrap} aria-hidden="true">
          <Icon name="lock" />
        </span>
        <div className={styles.copy}>
          {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
          <h1 className={styles.title}>{title}</h1>
          {description ? <p className={styles.description}>{description}</p> : null}
        </div>
      </div>
      {unlocks.length ? (
        <div className={styles.unlocks} data-onboarding={unlocksOnboardingKey || undefined}>
          <p className={styles.unlocksTitle}>Upgrade to unlock</p>
          <ul className={styles.unlocksList}>
            {unlocks.map((item) => (
              <li key={item} className={styles.unlockItem}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <p className={styles.footer}>
        Package upgrades are managed outside the hub app right now. Use this locked state to understand what becomes
        available on Growth.
      </p>
      {secondaryAction ? (
        <div className={styles.actions}>
          <Button
            href={secondaryAction.href}
            variant="secondary"
            target={secondaryAction.external ? "_blank" : undefined}
            rel={secondaryAction.external ? "noreferrer" : undefined}
            data-onboarding={secondaryActionOnboardingKey || undefined}
          >
            {secondaryAction.label}
          </Button>
        </div>
      ) : null}
    </Surface>
  );
}
