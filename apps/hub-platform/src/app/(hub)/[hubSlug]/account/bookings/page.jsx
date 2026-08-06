import { Suspense } from "react";
import { headers } from "next/headers";
import MemberBookingsWorkspace from "@/components/patterns/member-bookings-workspace/MemberBookingsWorkspace";
import { MemberBookingsFallback } from "@/components/patterns/member-account-fallbacks";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import { requireCurrentMemberSessionForHub } from "@/lib/auth/member-session";
import { listCourseRegistrationsByUser } from "@/lib/data/course-registrations";
import { listEventBookingsByBooker } from "@/lib/data/event-bookings";
import { requireHubBySlug } from "@/lib/data/hubs";
import { isMemberActivityReadModelEnabled, listMemberActivityBookingSources } from "@/lib/data/member-activity";
import { buildUnifiedBookingItems } from "@/lib/domain/member-account";
import { getRequestHostFromHeaders, resolveHubRuntimeRouteMode } from "@/lib/domain/hub-hosts";
import styles from "../accountRoute.module.css";

async function BookingsContent({ hub, routeMode }) {
  const memberSession = await requireCurrentMemberSessionForHub(hub, `/${hub.slug}/account/bookings`);
  const projectedActivity = isMemberActivityReadModelEnabled()
    ? await listMemberActivityBookingSources(hub.id, memberSession.user.id, { limit: 500 }).catch((error) => {
        console.warn("Falling back to collection-group member account activity for bookings.", {
          hubId: hub.id,
          userId: memberSession.user.id,
          error: String(error?.message || "Unable to read member activity projection."),
        });
        return null;
      })
    : null;
  const [eventBookings, courseRegistrations] = projectedActivity
    ? [projectedActivity.eventBookings, projectedActivity.courseRegistrations]
    : await Promise.all([
        listEventBookingsByBooker(hub.id, memberSession.user.id, { limit: 500 }),
        listCourseRegistrationsByUser(hub.id, memberSession.user.id, { limit: 500 }),
      ]);
  const items = buildUnifiedBookingItems({
    hub,
    eventBookings,
    courseRegistrations,
    routeMode,
  });

  return <MemberBookingsWorkspace hub={hub} items={items} showHeader={false} />;
}

export default async function BookingsPage({ params }) {
  const { hubSlug } = await params;
  const hubRecord = await requireHubBySlug(hubSlug);
  const requestHeaders = await headers();
  const routeMode = resolveHubRuntimeRouteMode(getRequestHostFromHeaders(requestHeaders));
  const hub = { ...hubRecord, routeMode };

  return (
    <div className={styles.routeStack}>
      <PageHeader
        eyebrow="Member account"
        title="My Bookings"
        description="Review your event and course bookings, check current status, and cancel a booking when needed."
      />
      <Suspense fallback={<MemberBookingsFallback />}>
        <BookingsContent hub={hub} routeMode={routeMode} />
      </Suspense>
    </div>
  );
}
