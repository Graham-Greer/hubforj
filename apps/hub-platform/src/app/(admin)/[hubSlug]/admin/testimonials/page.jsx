import { Suspense } from "react";
import Button from "@/components/ui/button/Button";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import {
  AdminRouteStack,
  AdminStatsListFallback,
} from "@/components/patterns/admin-route-fallbacks/AdminRouteFallbacks";
import TestimonialAdminList from "@/components/patterns/testimonial-admin-list/TestimonialAdminList";
import { requireHubCoreBySlug } from "@/lib/data/hubs";
import { listTestimonialsByHubSlug } from "@/lib/data/testimonials";
import { deleteTestimonialAction } from "./actions";

async function TestimonialsWorkspace({ hub }) {
  const testimonials = await listTestimonialsByHubSlug(hub.slug);

  return (
    <TestimonialAdminList
      hub={hub}
      testimonials={testimonials}
      deleteTestimonialAction={deleteTestimonialAction}
      showHeader={false}
    />
  );
}

export default async function TestimonialsPage({ params }) {
  const { hubSlug } = await params;
  const hub = await requireHubCoreBySlug(hubSlug);

  return (
    <AdminRouteStack>
      <PageHeader
        eyebrow="Testimonials"
        title="Manage your testimonials"
        description="Review testimonial quality, control publication, and keep social proof ready for the website."
        actions={<Button href={`/${hub.slug}/admin/testimonials/create`}>Create testimonial</Button>}
      />
      <Suspense fallback={<AdminStatsListFallback rows={4} withAvatar />}>
        <TestimonialsWorkspace hub={hub} />
      </Suspense>
    </AdminRouteStack>
  );
}
