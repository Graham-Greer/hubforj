import PageHeader from "@/components/patterns/page-header/PageHeader";
import {
  AdminMediaLibraryFallback,
  AdminRouteStack,
} from "@/components/patterns/admin-route-fallbacks/AdminRouteFallbacks";

export default function MediaLoading() {
  return (
    <AdminRouteStack>
      <PageHeader
        eyebrow="Media"
        title="Media library"
        description="Manage hub assets, organize them into folders, and reuse them safely across branding and content records."
      />
      <AdminMediaLibraryFallback />
    </AdminRouteStack>
  );
}
