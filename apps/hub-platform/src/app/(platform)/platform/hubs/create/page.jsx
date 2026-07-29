import Button from "@/components/ui/button/Button";
import WorkflowGuidance from "@/components/patterns/workflow-guidance/WorkflowGuidance";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import CreateHubForm from "./CreateHubForm";
import styles from "./page.module.css";

export default async function CreateHubPage() {
  return (
    <div className={styles.layout}>
      <WorkspaceSection
        eyebrow="Provisioning"
        title="Create a new hub"
        description="Create a hub by entering the core setup details first, then handle deeper configuration later."
      >
        <CreateHubForm />
      </WorkspaceSection>
      <WorkflowGuidance
        eyebrow="Provisioning notes"
        title="Before you create the hub"
        items={[
          {
            title: "Choose stable naming",
            body: "Hub name and slug become part of the public and admin identity. Avoid names that are likely to change immediately after onboarding.",
            icon: "drive_file_rename_outline",
          },
          {
            title: "Start with the minimum",
            body: "This first step is intentionally narrow. Branding, navigation, and public-site configuration belong in settings after the hub exists.",
            icon: "checklist",
          },
          {
            title: "Treat domain as an operational hint",
            body: "The initial domain value should help orientation. Full domain connection and verification remain a later operational step.",
            icon: "language",
          },
        ]}
      />
    </div>
  );
}
