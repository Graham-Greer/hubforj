import { AdminFormRuntimeProvider } from "@/components/patterns/admin-form-runtime/AdminFormRuntime";
import Image from "next/image";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import { getTestimonialStatusLabel, getTestimonialStatusTone } from "@/lib/domain/testimonials";
import styles from "./TestimonialDetailWorkspace.module.css";

export default function TestimonialDetailWorkspace({ hub, testimonial, form }) {
  return (
    <AdminFormRuntimeProvider>
      <div className={styles.root}>
        <PageHeader
          eyebrow="Testimonials"
          title={testimonial.authorName || "Testimonial"}
          description="Keep testimonial editing focused on quality, attribution, and publication state."
          actions={
            <div className={styles.headerActions}>
              <Badge tone={getTestimonialStatusTone(testimonial.status)}>{getTestimonialStatusLabel(testimonial.status)}</Badge>
              {testimonial.featured ? <Badge tone="accent">Featured</Badge> : null}
              <Button href={`/${hub.slug}/admin/testimonials`} variant="ghost">Back to testimonials</Button>
            </div>
          }
        />

        <WorkspaceSection
          title="Testimonial content"
          description="Testimonials are structured content. Keep the model tight so public sections can trust the data."
        >
          {testimonial.authorImageAsset?.publicUrl ? (
            <div className={styles.mediaPreview}>
              <Image
                src={testimonial.authorImageAsset.publicUrl}
                alt={testimonial.authorImageAlt || testimonial.authorImageAsset.alt || testimonial.authorName}
                className={styles.mediaPreviewImage}
                fill
                sizes="6rem"
                unoptimized
              />
            </div>
          ) : null}
          {form}
        </WorkspaceSection>
      </div>
    </AdminFormRuntimeProvider>
  );
}
