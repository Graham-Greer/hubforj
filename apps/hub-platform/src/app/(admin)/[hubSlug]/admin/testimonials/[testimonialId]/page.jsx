import TestimonialDetailWorkspace from "@/components/patterns/testimonial-detail-workspace/TestimonialDetailWorkspace";
import EditTestimonialForm from "./EditTestimonialForm";
import { requireHubBySlug } from "@/lib/data/hubs";
import { listMediaFoldersByHubId } from "@/lib/data/media";
import { getTestimonialById } from "@/lib/data/testimonials";
import { notFound } from "next/navigation";

export default async function TestimonialDetailPage({ params }) {
  const { hubSlug, testimonialId } = await params;
  const hub = await requireHubBySlug(hubSlug);
  const [testimonial, mediaFolders] = await Promise.all([
    getTestimonialById(hub.id, testimonialId),
    listMediaFoldersByHubId(hub.id),
  ]);

  if (!testimonial) {
    notFound();
  }

  return (
    <TestimonialDetailWorkspace
      hub={hub}
      testimonial={testimonial}
      form={
        <EditTestimonialForm
          key={`${testimonial.id}:${testimonial.updatedAt || ""}`}
          hub={hub}
          testimonial={testimonial}
          mediaAssets={testimonial.authorImageAsset ? [testimonial.authorImageAsset] : []}
          mediaFolders={mediaFolders}
        />
      }
    />
  );
}
