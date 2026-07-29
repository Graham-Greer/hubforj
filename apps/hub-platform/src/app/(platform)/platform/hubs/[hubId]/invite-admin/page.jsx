import Button from "@/components/ui/button/Button";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import { getHubById } from "@/lib/data/hubs";
import PlatformInviteAdminForm from "./PlatformInviteAdminForm";
import styles from "./page.module.css";

export default async function InviteAdminPage({ params }) {
  const { hubId } = await params;
  const hub = await getHubById(hubId);

  return (
    <div className={styles.layout}>
      <WorkspaceSection
        eyebrow="Admin invite"
        title="Invite admin"
        description="Invite a hub admin here and keep access changes explicit, narrow, and auditable."
        actions={
          hub ? (
            <Button href={`/platform/hubs/${hub.id}`} variant="secondary">
              Back to hub
            </Button>
          ) : null
        }
      >
        <PlatformInviteAdminForm hubId={hubId} />
      </WorkspaceSection>
    </div>
  );
}
