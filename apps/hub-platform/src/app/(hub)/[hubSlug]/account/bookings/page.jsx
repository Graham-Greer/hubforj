import { headers } from "next/headers";
import MemberBookingsWorkspace from "@/components/patterns/member-bookings-workspace/MemberBookingsWorkspace";
import { requireCurrentMemberSessionForHub } from "@/lib/auth/member-session";
import { listCourseRegistrationsByUser } from "@/lib/data/course-registrations";
import { listEventBookingsByBooker } from "@/lib/data/event-bookings";
import { requireHubBySlug } from "@/lib/data/hubs";
import { buildUnifiedBookingItems } from "@/lib/domain/member-account";
import { getRequestHostFromHeaders, resolveHubRuntimeRouteMode } from "@/lib/domain/hub-hosts";

export default async function BookingsPage({ params }) {
  const { hubSlug } = await params;
  const hubRecord = await requireHubBySlug(hubSlug);
  const requestHeaders = await headers();
  const routeMode = resolveHubRuntimeRouteMode(getRequestHostFromHeaders(requestHeaders));
  const hub = { ...hubRecord, routeMode };
  const memberSession = await requireCurrentMemberSessionForHub(hub, `/${hub.slug}/account/bookings`);
  const [eventBookings, courseRegistrations] = await Promise.all([
    listEventBookingsByBooker(hub.id, memberSession.user.id),
    listCourseRegistrationsByUser(hub.id, memberSession.user.id),
  ]);
  const items = buildUnifiedBookingItems({
    hub,
    eventBookings,
    courseRegistrations,
    routeMode,
  });

  return <MemberBookingsWorkspace hub={hub} items={items} />;
}
