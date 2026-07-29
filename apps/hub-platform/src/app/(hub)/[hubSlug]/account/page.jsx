import { headers } from "next/headers";
import MemberAccountOverview from "@/components/patterns/member-account-overview/MemberAccountOverview";
import { requireCurrentMemberSessionForHub } from "@/lib/auth/member-session";
import { listCourseRegistrationsByUser } from "@/lib/data/course-registrations";
import { listEventBookingsByBooker } from "@/lib/data/event-bookings";
import { requireHubBySlug } from "@/lib/data/hubs";
import { getCurrentMembershipByUser } from "@/lib/data/memberships";
import { listMemberPaymentItems } from "@/lib/data/member-payments";
import { buildMemberOverviewModel } from "@/lib/domain/member-account";
import { getRequestHostFromHeaders, resolveHubRuntimeRouteMode } from "@/lib/domain/hub-hosts";

export default async function MemberAccountPage({ params }) {
  const { hubSlug } = await params;
  const hubRecord = await requireHubBySlug(hubSlug);
  const requestHeaders = await headers();
  const routeMode = resolveHubRuntimeRouteMode(getRequestHostFromHeaders(requestHeaders));
  const hub = { ...hubRecord, routeMode };
  const memberSession = await requireCurrentMemberSessionForHub(hub, `/${hub.slug}/account`);
  const [membership, eventBookings, courseRegistrations, paymentItems] = await Promise.all([
    getCurrentMembershipByUser(hub.id, memberSession.user.id),
    listEventBookingsByBooker(hub.id, memberSession.user.id),
    listCourseRegistrationsByUser(hub.id, memberSession.user.id),
    listMemberPaymentItems(hub.id, memberSession.user.id),
  ]);
  const overview = buildMemberOverviewModel({
    hub,
    membership,
    eventBookings,
    courseRegistrations,
    paymentItems,
    routeMode,
  });

  return (
    <MemberAccountOverview
      hub={hub}
      overview={overview}
    />
  );
}
