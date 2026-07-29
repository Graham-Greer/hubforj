import TestimonialAdminList from "@/components/patterns/testimonial-admin-list/TestimonialAdminList";
import { requireHubBySlug } from "@/lib/data/hubs";
import { listTestimonialsByHubSlug } from "@/lib/data/testimonials";
import { deleteTestimonialAction } from "./actions";

export default async function TestimonialsPage({ params }) {
  const { hubSlug } = await params;
  const hub = await requireHubBySlug(hubSlug);
  const testimonials = await listTestimonialsByHubSlug(hub.slug);

  return <TestimonialAdminList hub={hub} testimonials={testimonials} deleteTestimonialAction={deleteTestimonialAction} />;
}
