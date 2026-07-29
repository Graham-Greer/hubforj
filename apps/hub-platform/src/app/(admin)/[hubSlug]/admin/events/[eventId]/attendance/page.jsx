import EventAttendanceWorkspace from "@/components/patterns/event-attendance-workspace/EventAttendanceWorkspace";
import { getEventById } from "@/lib/data/events";
import { listEventAdminAttendanceRows } from "@/lib/data/event-bookings";
import { requireHubBySlug } from "@/lib/data/hubs";
import { notFound } from "next/navigation";

export default async function EventAttendancePage({ params }) {
  const { hubSlug, eventId } = await params;
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
