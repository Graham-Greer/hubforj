import { AdminOperationalTableFallback } from "@/components/patterns/admin-route-fallbacks/AdminRouteFallbacks";
import PageHeader from "@/components/patterns/page-header/PageHeader";

export default function EventRegistrationsLoading() {
  return (
    <>
      <PageHeader
        eyebrow="Event bookings"
        title="Bookings"
        description="Review bookings, resolve payment follow-up, and move people toward attendance readiness."
      />
      <AdminOperationalTableFallback label="event bookings" />
    </>
  );
}
