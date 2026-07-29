import Button from "@/components/ui/button/Button";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import { requireHubBySlug } from "@/lib/data/hubs";
import CreateWhatWeDoForm from "./CreateWhatWeDoForm";
import styles from "./page.module.css";

export default async function CreateWhatWeDoPage({ params }) {
  const { hubSlug } = await params;
  const hub = await requireHubBySlug(hubSlug);

  return (
    <div className={styles.layout}>
      <WorkspaceSection
        eyebrow="What we do"
        title="New item"
        description="Capture What we do content as a structured record so it stays reusable and easy to surface on the public site."
        actions={<Button href={`/${hub.slug}/admin/what-we-do`} variant="secondary">Back to What we do</Button>}
      >
        <CreateWhatWeDoForm hubSlug={hub.slug} />
      </WorkspaceSection>
    </div>
  );
}
