import Button from "@/components/ui/button/Button";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import { getCurrentHubOperatorAccess } from "@/lib/auth/hub-access";
import { canManageHubAdmins } from "@/lib/domain/users";
import { getHubBySlug } from "@/lib/data/hubs";
import AdminInviteForm from "./AdminInviteForm";
import styles from "./page.module.css";

export default async function AdminInvitePage({ params }) {
  const { hubSlug } = await params;
  const hub = await getHubBySlug(hubSlug);
  const access = hub ? await getCurrentHubOperatorAccess(hub) : null;
  const canInviteAdmins = Boolean(access && canManageHubAdmins(access.actorRole));

  return (
    <div className={styles.layout}>
      <WorkspaceSection
        eyebrow="Admins"
        title="Invite admin"
        description={
          canInviteAdmins
            ? "Invite a new admin here and keep access changes explicit and auditable."
            : "Only the owner can invite new admins to this hub."
        }
        actions={
          <Button href={`/${hubSlug}/admin/admins`} variant="secondary">
            Back to admins
          </Button>
        }
      >
        {canInviteAdmins ? <AdminInviteForm hubSlug={hubSlug} /> : null}
      </WorkspaceSection>
    </div>
  );
}
