import EventRegistrationWorkspace from "@/components/patterns/event-registration-workspace/EventRegistrationWorkspace";
import { getEventById } from "@/lib/data/events";
import { listEventAdminBookingRows } from "@/lib/data/event-bookings";
import { requireHubBySlug } from "@/lib/data/hubs";
import { notFound } from "next/navigation";

export default async function EventRegistrationsPage({ params }) {
  const { hubSlug, eventId } = await params;
  const hub = await requireHubBySlug(hubSlug);
  const [event, bookings] = await Promise.all([
    getEventById(hub.id, eventId),
    listEventAdminBookingRows(hub.id, eventId),
  ]);

  if (!event) {
    notFound();
  }

  return <EventRegistrationWorkspace hub={hub} event={event} bookings={bookings} />;
}
