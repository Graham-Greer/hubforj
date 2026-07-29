"use client";

import CompactMenu from "@/components/ui/compact-menu/CompactMenu";
import Icon from "@/components/ui/icon/Icon";
import { getJourneyDefinition } from "@/lib/admin-onboarding/routing";
import { useAdminOnboarding } from "./AdminOnboardingProvider";
import styles from "./AdminOnboardingHelpLauncher.module.css";

export default function AdminOnboardingHelpLauncher() {
  const onboarding = useAdminOnboarding();

  if (!onboarding || onboarding.loading || !onboarding.state || onboarding.currentJourney) {
    return null;
  }

  const currentRouteJourney = onboarding.routeJourneyKey
    ? getJourneyDefinition(onboarding.routeJourneyKey)
    : null;

  const items = [];

  if (currentRouteJourney && onboarding.routeJourneyKey !== "welcome_overview") {
    items.push({
      label: "Restart this guide",
      value: "restart_route",
      onSelect: () => onboarding.restartJourney(currentRouteJourney.key),
    });
  }

  if (onboarding.routeJourneyKey === "welcome_overview") {
    items.push({
      label: "Restart welcome guide",
      value: "restart_welcome",
      onSelect: () => onboarding.restartJourney("welcome_overview"),
    });
  }

  items.push({
    label: "View setup checklist",
    value: "view_checklist",
    onSelect: () => onboarding.revealChecklist(),
  });

  return (
    <div className={styles.root}>
      <CompactMenu
        items={items}
        triggerAriaLabel="Open onboarding help"
        triggerTooltip="Help"
        triggerVariant="secondary"
        triggerSize="md"
        triggerClassName={styles.trigger}
        triggerProps={{ "data-onboarding-help-trigger": "true" }}
        menuClassName={styles.menu}
      >
        <Icon name="help" decorative size="sm" />
      </CompactMenu>
    </div>
  );
}
