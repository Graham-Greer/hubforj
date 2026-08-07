import Button from "@/components/ui/button/Button";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import { requireHubCoreBySlug } from "@/lib/data/hubs";
import { normalizeAdminReturnContext } from "@/lib/navigation/admin-return-context";
import CreateWhatWeDoForm from "./CreateWhatWeDoForm";
import styles from "./page.module.css";

export default async function CreateWhatWeDoPage({ params, searchParams }) {
  const { hubSlug } = await params;
  const resolvedSearchParams = await searchParams;
  const hub = await requireHubCoreBySlug(hubSlug);
  const returnContext = normalizeAdminReturnContext({
    hubSlug: hub.slug,
    returnTo: resolvedSearchParams?.returnTo,
    returnSection: resolvedSearchParams?.returnSection || resolvedSearchParams?.section,
  });
  const backHref = returnContext.returnTo ? returnContext.href : `/${hub.slug}/admin/what-we-do`;

  return (
    <div className={styles.layout}>
      <WorkspaceSection
        eyebrow="What we do"
        title="New item"
        description="Capture What we do content as a structured record so it stays reusable and easy to surface on the public site."
        actions={<Button href={backHref} variant="secondary">Back to What we do</Button>}
      >
        <CreateWhatWeDoForm hubSlug={hub.slug} returnContext={returnContext} />
      </WorkspaceSection>
    </div>
  );
}
