import StatCard from "@/components/ui/stat-card/StatCard";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import { getPlatformSummary } from "@/lib/data/hubs";
import styles from "./page.module.css";

export default async function PlatformPage() {
  const summary = await getPlatformSummary();

  return (
    <div className={styles.grid}>
      <WorkspaceSection
        eyebrow="Platform overview"
        title="Operate hubs without noise"
        description="Use this overview to provision hubs, triage work, and enter support mode without unnecessary noise."
      >
        <p className={styles.lead}>
          The shell is now ready for real superadmin workflows. The next layer should focus on provisioning queues, support mode entry, and hub lifecycle visibility.
        </p>
      </WorkspaceSection>
      <div className={styles.stats}>
        <StatCard label="Hubs" value={summary.hubCount} detail="Tracked multi-hub estate." />
        <StatCard label="Provisioning" value={summary.provisioningCount} detail="Hubs still moving through setup." />
        <StatCard label="Support attention" value={summary.supportAttentionCount} detail="Items likely to require operator action." />
      </div>
    </div>
  );
}
