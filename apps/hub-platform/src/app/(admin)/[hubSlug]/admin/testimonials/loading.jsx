import PageHeader from "@/components/patterns/page-header/PageHeader";
import {
  AdminRouteStack,
  AdminStatsListFallback,
} from "@/components/patterns/admin-route-fallbacks/AdminRouteFallbacks";

export default function TestimonialsLoading() {
  return (
    <AdminRouteStack>
      <PageHeader
        eyebrow="Testimonials"
        title="Manage your testimonials"
        description="Review testimonial quality, control publication, and keep social proof ready for the website."
      />
      <AdminStatsListFallback rows={4} withAvatar />
    </AdminRouteStack>
  );
}
