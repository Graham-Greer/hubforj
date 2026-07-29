import Button from "@/components/ui/button/Button";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import { requireHubBySlug } from "@/lib/data/hubs";
import { listMediaAssetsByHubId, listMediaFoldersByHubId } from "@/lib/data/media";
import CreateTestimonialForm from "./CreateTestimonialForm";
import styles from "./page.module.css";

export default async function CreateTestimonialPage({ params }) {
  const { hubSlug } = await params;
  const hub = await requireHubBySlug(hubSlug);
  const [mediaAssets, mediaFolders] = await Promise.all([
    listMediaAssetsByHubId(hub.id),
    listMediaFoldersByHubId(hub.id),
  ]);

  return (
    <div className={styles.layout}>
      <WorkspaceSection
        eyebrow="Testimonials"
        title="New testimonial"
        description="Capture testimonial content as a structured record so it stays reusable and trustworthy wherever the public site needs it."
        actions={<Button href={`/${hub.slug}/admin/testimonials`} variant="secondary">Back to testimonials</Button>}
      >
        <CreateTestimonialForm hubId={hub.id} hubSlug={hub.slug} mediaAssets={mediaAssets} mediaFolders={mediaFolders} />
      </WorkspaceSection>
    </div>
  );
}
