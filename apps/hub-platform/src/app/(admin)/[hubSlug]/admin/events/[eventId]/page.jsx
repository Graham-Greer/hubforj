import { Suspense } from "react";
import { headers } from "next/headers";
import EventDetailWorkspace from "@/components/patterns/event-detail-workspace/EventDetailWorkspace";
import { AdminProgrammeDetailFallback } from "@/components/patterns/admin-route-fallbacks/AdminRouteFallbacks";
import EditEventForm from "./EditEventForm";
import { countActiveUpcomingPublishedEventsByHub, getEventById } from "@/lib/data/events";
import { requireHubBySlug } from "@/lib/data/hubs";
import { isActiveUpcomingPublishedEvent } from "@/lib/domain/events";
import { resolveHubPackageEntitlements } from "@/lib/domain/hub-package";
import { getHubPaymentConfigurationByHubId } from "@/lib/data/hub-payment-configurations";
import { getHubPaymentSetupState } from "@/lib/domain/hub-payment-configuration";
import { getRequestHostFromHeaders, resolveHubRuntimeRouteMode } from "@/lib/domain/hub-hosts";
import { buildHubRuntimeHref } from "@/lib/domain/hub-runtime-paths";
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
  const headerStore = await headers();
  const routeMode = resolveHubRuntimeRouteMode(getRequestHostFromHeaders(headerStore));
  const hub = await requireHubBySlug(hubSlug);
  const entitlements = resolveHubPackageEntitlements(hub);
  const event = await getEventById(hub.id, eventId);
  const canEditEvent = event?.eventKind !== "series_occurrence";
  const isEditing = String(query?.mode || "") === "edit" && canEditEvent;

  if (!event) {
    notFound();
  }

  let publishLocked = false;
  let publishUpgradeNotice = null;

  if (isEditing && !isActiveUpcomingPublishedEvent(event)) {
    const activeUpcomingEventsLimit = entitlements.limits?.activeUpcomingEvents;

    if (Number.isFinite(activeUpcomingEventsLimit)) {
      const activeUpcomingPublishedEventCount = await countActiveUpcomingPublishedEventsByHub(hub.id);

      publishLocked = activeUpcomingPublishedEventCount >= activeUpcomingEventsLimit;

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
  }

  const registrationCount = Number(event.registeredAttendeeCount || 0);
  const hasAttendanceRegistrations =
    registrationCount + Number(event.waitlistedAttendeeCount || 0) + Number(event.cancelledAttendeeCount || 0) > 0;
  const editForm = isEditing
    ? await (async () => {
        const [mediaFolders, paymentConfiguration] = await Promise.all([
          listMediaFoldersByHubId(hub.id),
          getHubPaymentConfigurationByHubId(hub.id),
        ]);
        const paymentSetupState = getHubPaymentSetupState(hub, paymentConfiguration);

        return (
          <EditEventForm
            hub={hub}
            event={event}
            mediaAssets={event.imageAsset ? [event.imageAsset] : []}
            mediaFolders={mediaFolders}
            paymentSetupState={paymentSetupState}
            publishLocked={publishLocked}
            publishUpgradeNotice={publishUpgradeNotice}
            routeMode={routeMode}
          />
        );
      })()
    : null;

  return (
    <EventDetailWorkspace
      hub={hub}
      event={event}
      eventsQuery={eventsQuery}
      isEditing={isEditing}
      routeMode={routeMode}
      registrationCount={registrationCount}
      attendanceCountVerified={false}
      canExportAttendanceReport={entitlements.capabilities?.reportingEnabled === true}
      hasAttendanceRegistrations={hasAttendanceRegistrations}
      seriesWorkspaceHref={event.seriesId ? buildHubRuntimeHref(hub.slug, `/admin/events/series/${event.seriesId}`, routeMode) : ""}
      canEditEvent={canEditEvent}
      editForm={editForm}
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
