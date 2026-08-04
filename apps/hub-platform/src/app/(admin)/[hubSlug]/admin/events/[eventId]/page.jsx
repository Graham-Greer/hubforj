import { Suspense } from "react";
import EventDetailWorkspace from "@/components/patterns/event-detail-workspace/EventDetailWorkspace";
import { AdminProgrammeDetailFallback } from "@/components/patterns/admin-route-fallbacks/AdminRouteFallbacks";
import EditEventForm from "./EditEventForm";
import { countActiveUpcomingPublishedEventsByHub, getEventById } from "@/lib/data/events";
import { listEventAdminAttendanceRows } from "@/lib/data/event-bookings";
import { requireHubBySlug } from "@/lib/data/hubs";
import { isActiveUpcomingPublishedEvent } from "@/lib/domain/events";
import { resolveHubPackageEntitlements } from "@/lib/domain/hub-package";
import { getHubPaymentConfigurationByHubId } from "@/lib/data/hub-payment-configurations";
import { getHubPaymentSetupState } from "@/lib/domain/hub-payment-configuration";
import { listMediaFoldersByHubId } from "@/lib/data/media";
import { notFound } from "next/navigation";

async function EventDetailContent({ hubSlug, eventId, query }) {
  const eventsSearchParams = new URLSearchParams();

  ["q", "status", "pricing", "visibility"].forEach((key) => {
    const value = query?.[key];

    if (typeof value === "string" && value) {
      eventsSearchParams.set(key, value);
    }
  });

  const eventsQuery = eventsSearchParams.toString();
  const hub = await requireHubBySlug(hubSlug);
  const entitlements = resolveHubPackageEntitlements(hub);
  const [event, mediaFolders, attendanceRows, paymentConfiguration] = await Promise.all([
    getEventById(hub.id, eventId),
    listMediaFoldersByHubId(hub.id),
    entitlements.capabilities?.eventsEnabled ? listEventAdminAttendanceRows(hub.id, eventId) : Promise.resolve([]),
    getHubPaymentConfigurationByHubId(hub.id),
  ]);
  const paymentSetupState = getHubPaymentSetupState(hub, paymentConfiguration);
  const canEditEvent = event?.eventKind !== "series_occurrence";
  const isEditing = String(query?.mode || "") === "edit" && canEditEvent;

  if (!event) {
    notFound();
  }

  let publishLocked = false;
  let publishUpgradeNotice = null;

  if (isEditing) {
    const activeUpcomingEventsLimit = entitlements.limits?.activeUpcomingEvents;
    const activeUpcomingPublishedEventCount = await countActiveUpcomingPublishedEventsByHub(hub.id, {
      excludeEventId: event.id,
    });

    publishLocked =
      !isActiveUpcomingPublishedEvent(event) &&
      Number.isFinite(activeUpcomingEventsLimit) &&
      activeUpcomingPublishedEventCount >= activeUpcomingEventsLimit;

    if (publishLocked) {
      publishUpgradeNotice = {
        title: "Active event limit reached",
        description:
          "This hub has filled its active upcoming event allowance. You can keep editing this event as a draft, but publishing it is locked until another active event passes or the hub upgrades.",
        currentUsage: activeUpcomingPublishedEventCount,
        limit: activeUpcomingEventsLimit,
        unlocks: [
          "Unlimited active upcoming events",
          "Paid event capability",
          "Access to broader monetisation features",
        ],
      };
    }
  }

  const attendanceCount = attendanceRows.filter((attendee) => attendee.attendanceStatus === "present").length;
  const liveRegisteredCount = attendanceRows.filter((attendee) => attendee.status === "registered").length;
  const liveWaitlistedCount = attendanceRows.filter((attendee) => attendee.status === "waitlisted").length;
  const liveCancelledCount = attendanceRows.filter((attendee) => attendee.status === "cancelled").length;
  const hasLiveAttendanceRows = attendanceRows.length > 0;
  const registrationCount = hasLiveAttendanceRows ? liveRegisteredCount : Number(event.registeredAttendeeCount || 0);
  const hasAttendanceRegistrations = hasLiveAttendanceRows
    ? liveRegisteredCount + liveWaitlistedCount + liveCancelledCount > 0
    : Number(event.registeredAttendeeCount || 0) +
        Number(event.waitlistedAttendeeCount || 0) +
        Number(event.cancelledAttendeeCount || 0) >
      0;

  return (
    <EventDetailWorkspace
      hub={hub}
      event={event}
      eventsQuery={eventsQuery}
      isEditing={isEditing}
      attendanceCount={attendanceCount}
      registrationCount={registrationCount}
      canExportAttendanceReport={entitlements.capabilities?.reportingEnabled === true}
      hasAttendanceRegistrations={hasAttendanceRegistrations}
      seriesWorkspaceHref={event.seriesId ? `/${hub.slug}/admin/events/series/${event.seriesId}` : ""}
      canEditEvent={canEditEvent}
      editForm={
        <EditEventForm
          hub={hub}
          event={event}
          mediaAssets={event.imageAsset ? [event.imageAsset] : []}
          mediaFolders={mediaFolders}
          paymentSetupState={paymentSetupState}
          publishLocked={publishLocked}
          publishUpgradeNotice={publishUpgradeNotice}
        />
      }
    />
  );
}

export default async function EventDetailPage({ params, searchParams }) {
  const { hubSlug, eventId } = await params;
  const query = await searchParams;

  return (
    <Suspense fallback={<AdminProgrammeDetailFallback kind="event" />}>
      <EventDetailContent hubSlug={hubSlug} eventId={eventId} query={query} />
    </Suspense>
  );
}
