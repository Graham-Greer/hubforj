import PageHeader from "@/components/patterns/page-header/PageHeader";
import {
  AdminProgrammeListFallback,
  AdminRouteStack,
} from "@/components/patterns/admin-route-fallbacks/AdminRouteFallbacks";

export default function EventsLoading() {
  return (
    <AdminRouteStack>
      <PageHeader
        eyebrow="Events"
        title="Manage events"
        description="Review upcoming and draft events, filter the list quickly, and open the one you need to edit, publish, or manage."
      />
      <AdminProgrammeListFallback rows={3} filters={3} />
    </AdminRouteStack>
  );
}
