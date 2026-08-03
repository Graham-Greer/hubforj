"use client";

import Button from "@/components/ui/button/Button";
import Surface from "@/components/primitives/surface/Surface";
import {
  SkeletonBlock,
  SkeletonButtonRow,
  SkeletonText,
} from "@/components/patterns/loading-skeleton";
import { useAdminOnboarding } from "./AdminOnboardingProvider";
import styles from "./AdminOnboardingChecklist.module.css";

function getProgress(checklistItems) {
  if (!checklistItems.length) {
    return { completedCount: 0, totalCount: 0, percentage: 0 };
  }

  const completedCount = checklistItems.filter((item) => item.status === "completed").length;
  return {
    completedCount,
    totalCount: checklistItems.length,
    percentage: Math.round((completedCount / checklistItems.length) * 100),
  };
}

function ChecklistSkeleton() {
  return (
    <Surface padding="md" className={styles.card} aria-hidden="true">
      <div className={styles.header}>
        <div className={styles.copy}>
          <SkeletonBlock variant="eyebrow" width="7rem" />
          <SkeletonBlock variant="heading" width="min(100%, 24rem)" />
          <SkeletonText lines={1} widths={["min(100%, 34rem)"]} compact />
        </div>
        <div className={styles.progress}>
          <SkeletonBlock variant="heading" width="3.5rem" />
          <SkeletonBlock variant="eyebrow" width="5rem" />
        </div>
      </div>
      <SkeletonBlock height="0.5rem" />
      <div className={styles.items}>
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className={styles.item}>
            <div className={styles.itemCopy}>
              <SkeletonBlock variant="heading" width={index % 2 === 0 ? "18rem" : "14rem"} />
              <SkeletonBlock variant="eyebrow" width="6rem" />
            </div>
            <SkeletonBlock variant="button" width="5.5rem" />
          </div>
        ))}
      </div>
      <SkeletonButtonRow count={2} />
    </Surface>
  );
}

export default function AdminOnboardingChecklist() {
  const onboarding = useAdminOnboarding();

  if (onboarding?.checklistHydrating) {
    return <ChecklistSkeleton />;
  }

  if (!onboarding || onboarding.loading || !onboarding.state || onboarding.state.checklist?.dismissed) {
    return null;
  }

  const progress = getProgress(onboarding.checklistItems);

  return (
    <Surface padding="md" className={styles.card}>
      <div className={styles.header}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>Setup checklist</p>
          <h2 className={styles.title}>Get your hub ready without doing everything at once.</h2>
          <p className={styles.body}>
            Work through the core setup tasks first, then come back to the deeper operational areas when you need them.
          </p>
        </div>
        <div className={styles.progress}>
          <span className={styles.progressValue}>
            {progress.completedCount}/{progress.totalCount}
          </span>
          <span className={styles.progressLabel}>completed</span>
        </div>
      </div>
      <div
        className={styles.progressBar}
        role="progressbar"
        aria-label="Setup checklist completion"
        aria-valuemin={0}
        aria-valuemax={progress.totalCount}
        aria-valuenow={progress.completedCount}
        aria-valuetext={`${progress.completedCount} of ${progress.totalCount} checklist items completed`}
      >
        <div className={styles.progressFill} style={{ inlineSize: `${progress.percentage}%` }} />
      </div>
      <div className={styles.items}>
        {onboarding.checklistItems.map((item) => (
          <div key={item.key} className={styles.item}>
            <div className={styles.itemCopy}>
              <p className={styles.itemTitle}>{item.label}</p>
              <p className={styles.itemStatus} data-status={item.status}>
                {item.status === "completed"
                  ? "Completed"
                  : item.status === "in_progress"
                    ? "In progress"
                    : "Not started"}
              </p>
            </div>
            <Button href={item.href} prefetch={false} variant="secondary">
              Open
            </Button>
          </div>
        ))}
      </div>
      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={onboarding.dismissChecklist}>
          Hide checklist
        </Button>
        <Button type="button" variant="primary" onClick={() => onboarding.restartJourney("welcome_overview")}>
          Restart welcome guide
        </Button>
      </div>
    </Surface>
  );
}
