import AdminDirtyAwareBackButton from "@/components/patterns/admin-form-runtime/AdminDirtyAwareBackButton";
import LegalSettingsWorkspace from "@/components/patterns/legal-settings/LegalSettingsWorkspace";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import { getCurrentHubOperatorAccess } from "@/lib/auth/hub-access";
import { getLegacyLegalMigrationValuesByHub } from "@/lib/data/site-settings";
import { getLegalSettingsByHubId, regenerateHubLegalDataUseSummary } from "@/lib/legal/legalRepository";
import { requireHubBySlug } from "@/lib/data/hubs";
import styles from "../settings.module.css";

export default async function LegalSettingsPage({ params }) {
  const { hubSlug } = await params;
  const hub = await requireHubBySlug(hubSlug);
  const access = await getCurrentHubOperatorAccess(hub);
  let legalSettings = await getLegalSettingsByHubId(hub.id);
  const legacyUsefulLinksValues = await getLegacyLegalMigrationValuesByHub(hub);

  if (!legalSettings.dataUseSummary?.generatedAt) {
    legalSettings = await regenerateHubLegalDataUseSummary(hub.id, access?.actorId || "system");
  }

  const canEdit = access?.actorRole === "owner" && access?.mode === "admin";
  const canSupportOverride = access?.actorRole === "superadmin" && access?.mode === "support";

  return (
    <div className={styles.layout}>
      <WorkspaceSection
        eyebrow="Settings"
        title="Legal pages"
        description="Edit the public Terms of Service and Privacy Policy for this hub. The platform explains system data use, but your organisation is responsible for the content you publish."
        actions={
          <AdminDirtyAwareBackButton
            href={`/${hub.slug}/admin/settings`}
            label="Back to settings"
          />
        }
      >
        <LegalSettingsWorkspace
          hubSlug={hub.slug}
          legalSettings={legalSettings}
          legacyUsefulLinksValues={legacyUsefulLinksValues}
          canEdit={canEdit}
          canSupportOverride={canSupportOverride}
        />
      </WorkspaceSection>
    </div>
  );
}
