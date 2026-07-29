import Button from "@/components/ui/button/Button";
import HubSummaryCard from "@/components/patterns/hub-summary-card/HubSummaryCard";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import { listHubs } from "@/lib/data/hubs";
import styles from "./page.module.css";

export default async function PlatformHubsPage() {
  const hubs = await listHubs();

  return (
    <div className={styles.layout}>
      <WorkspaceSection
        eyebrow="Hub index"
        title="Provision and support hubs from one place"
        description="Create hubs, review readiness, and enter support mode from one operator surface."
        actions={<Button href="/platform/hubs/create">Create hub</Button>}
      />
      <div className={styles.list}>
        {hubs.map((hub) => (
          <HubSummaryCard key={hub.id} hub={hub} />
        ))}
      </div>
    </div>
  );
}
