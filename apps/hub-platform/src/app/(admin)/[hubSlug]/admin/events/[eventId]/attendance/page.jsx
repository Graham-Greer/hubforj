import { Suspense } from "react";
import { AdminOperationalTableFallback } from "@/components/patterns/admin-route-fallbacks/AdminRouteFallbacks";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import EventAttendanceWorkspace from "@/components/patterns/event-attendance-workspace/EventAttendanceWorkspace";
import { getEventById } from "@/lib/data/events";
import { listEventAdminAttendanceRows } from "@/lib/data/event-bookings";
import { requireHubBySlug } from "@/lib/data/hubs";
import { notFound } from "next/navigation";

async function EventAttendanceContent({ hubSlug, eventId }) {
  const hub = await requireHubBySlug(hubSlug);
  const [event, attendees] = await Promise.all([
    getEventById(hub.id, eventId),
    listEventAdminAttendanceRows(hub.id, eventId),
  ]);

  if (!event) {
    notFound();
  }

  return <EventAttendanceWorkspace hub={hub} event={event} attendees={attendees} />;
}

export default async function EventAttendancePage({ params }) {
  const { hubSlug, eventId } = await params;

  return (
    <Suspense
      fallback={
        <>
          <PageHeader
            eyebrow="Event attendance"
            title="Attendance"
            description="Mark attendance and keep attendee status close by while you work through the list."
          />
          <AdminOperationalTableFallback label="event attendance" />
        </>
      }
    >
      <EventAttendanceContent hubSlug={hubSlug} eventId={eventId} />
    </Suspense>
  );
}
