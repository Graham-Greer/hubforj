import { Suspense } from "react";
import Button from "@/components/ui/button/Button";
import { AdminTestimonialFormFallback } from "@/components/patterns/admin-route-fallbacks/AdminRouteFallbacks";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import { requireHubBySlug, requireHubCoreBySlug } from "@/lib/data/hubs";
import { listMediaAssetsByHubId, listMediaFoldersByHubId } from "@/lib/data/media";
import CreateTestimonialForm from "./CreateTestimonialForm";
import styles from "./page.module.css";

async function CreateTestimonialWorkspace({ hubSlug }) {
  const hub = await requireHubBySlug(hubSlug);
  const [mediaAssets, mediaFolders] = await Promise.all([
    listMediaAssetsByHubId(hub.id),
    listMediaFoldersByHubId(hub.id),
  ]);

  return (
    <CreateTestimonialForm hubId={hub.id} hubSlug={hub.slug} mediaAssets={mediaAssets} mediaFolders={mediaFolders} />
  );
}

export default async function CreateTestimonialPage({ params }) {
  const { hubSlug } = await params;
  const hub = await requireHubCoreBySlug(hubSlug);

  return (
    <div className={styles.layout}>
      <WorkspaceSection
        eyebrow="Testimonials"
        title="New testimonial"
        description="Capture testimonial content as a structured record so it stays reusable and trustworthy wherever the public site needs it."
        actions={<Button href={`/${hub.slug}/admin/testimonials`} variant="secondary">Back to testimonials</Button>}
      >
        <Suspense fallback={<AdminTestimonialFormFallback />}>
          <CreateTestimonialWorkspace hubSlug={hubSlug} />
        </Suspense>
      </WorkspaceSection>
    </div>
  );
}
