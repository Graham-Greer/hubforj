import Button from "@/components/ui/button/Button";
import Surface from "@/components/primitives/surface/Surface";
import { getHubRegionalOnboardingHref } from "@/lib/domain/hub-regional-setup";
import styles from "./RegionalSetupRequiredState.module.css";

export default function RegionalSetupRequiredState({ hub, title = "Complete regional setup first", description = "" }) {
  return (
    <Surface className={styles.root}>
      <div className={styles.copy}>
        <p className={styles.eyebrow}>Regional onboarding</p>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.description}>
          {description || "This area stays locked until the hub country, timezone, community currency, and English formatting locale are confirmed."}
        </p>
      </div>
      <div className={styles.actions}>
        <Button href={getHubRegionalOnboardingHref(hub)}>Open regional setup</Button>
      </div>
    </Surface>
  );
}

