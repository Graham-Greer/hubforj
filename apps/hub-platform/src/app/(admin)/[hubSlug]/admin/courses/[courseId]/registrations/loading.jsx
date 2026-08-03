import { AdminOperationalTableFallback } from "@/components/patterns/admin-route-fallbacks/AdminRouteFallbacks";
import PageHeader from "@/components/patterns/page-header/PageHeader";

export default function CourseRegistrationsLoading() {
  return (
    <>
      <PageHeader
        eyebrow="Course registrations"
        title="Registrations"
        description="Review enrolments, resolve payment follow-up, and keep progression work moving."
      />
      <AdminOperationalTableFallback label="course registrations" />
    </>
  );
}
