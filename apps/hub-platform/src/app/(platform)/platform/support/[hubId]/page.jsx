import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import { getHubById } from "@/lib/data/hubs";
import { buildSupportRedirectPath } from "@/lib/navigation/support-mode";
import { getCurrentSupportModeSession, getSupportModeForHub } from "@/lib/auth/support-mode";
import { enterSupportModeAction } from "./actions";
import styles from "./page.module.css";

export default async function SupportModePage({ params }) {
  const { hubId } = await params;
  const hub = await getHubById(hubId);

  if (!hub) {
    return (
      <WorkspaceSection
        eyebrow="Support mode"
        title="Hub not found"
        description="A support session cannot be started because the requested hub does not exist."
        actions={<Button href="/platform/hubs">Back to hubs</Button>}
      />
    );
  }

  const currentSupportMode = await getCurrentSupportModeSession();
  const activeSupportMode = await getSupportModeForHub(hub);
  const enterLabel = activeSupportMode ? "Continue in hub admin" : "Confirm support mode";

  return (
    <div className={styles.layout}>
      <WorkspaceSection
        eyebrow="Support mode"
        title={`Enter support mode for ${hub.name}`}
        description="Confirm support mode here before entering the hub admin so the operator boundary stays clear and reversible."
        actions={
          <div className={styles.actions}>
            <form action={enterSupportModeAction}>
              <input type="hidden" name="hubId" value={hub.id} />
              <Button type="submit">{enterLabel}</Button>
            </form>
            <Button href={`/platform/hubs/${hub.id}`} variant="secondary">
              Back to hub detail
            </Button>
          </div>
        }
      >
        <div className={styles.meta}>
          <Badge tone="warning">Support mode</Badge>
          <span className={styles.metaItem}>Target hub: {hub.slug}</span>
          <span className={styles.metaItem}>Redirect: {buildSupportRedirectPath(hub)}</span>
          {activeSupportMode ? <span className={styles.metaItem}>Status: already active for this hub</span> : null}
        </div>
        <p className={styles.bannerPreview}>Support mode active for {hub.name}</p>
        {currentSupportMode && !activeSupportMode ? (
          <p className={styles.replacementNotice}>
            Support mode is currently active for {currentSupportMode.hubName}. Entering this hub will replace that operator context.
          </p>
        ) : null}
      </WorkspaceSection>
    </div>
  );
}
