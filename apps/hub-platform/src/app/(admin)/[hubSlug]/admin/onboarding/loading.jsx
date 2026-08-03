import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import { SkeletonForm } from "@/components/patterns/loading-skeleton";
import styles from "../settings/settings.module.css";

export default function RegionalOnboardingLoading() {
  return (
    <div className={styles.layout} role="status" aria-live="polite" aria-label="Loading regional setup">
      <WorkspaceSection
        eyebrow="Onboarding"
        title="Set up your community region"
        description="Before you create events, courses, or payment plans, confirm the country, timezone, community currency, and English date format your hub should operate with."
      >
        <SkeletonForm fields={4} columns={2} actions={1} />
      </WorkspaceSection>
    </div>
  );
}
