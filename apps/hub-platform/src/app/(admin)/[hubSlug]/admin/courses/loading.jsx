import PageHeader from "@/components/patterns/page-header/PageHeader";
import {
  AdminProgrammeListFallback,
  AdminRouteStack,
} from "@/components/patterns/admin-route-fallbacks/AdminRouteFallbacks";

export default function CoursesLoading() {
  return (
    <AdminRouteStack>
      <PageHeader
        eyebrow="Courses"
        title="Manage courses"
        description="Review published and draft courses, filter the list quickly, and open the one you need to edit or manage."
      />
      <AdminProgrammeListFallback rows={2} filters={3} />
    </AdminRouteStack>
  );
}
