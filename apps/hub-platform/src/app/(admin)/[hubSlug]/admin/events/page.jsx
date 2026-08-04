import { Suspense } from "react";
import { headers } from "next/headers";
import Button from "@/components/ui/button/Button";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import {
  AdminProgrammeListFallback,
  AdminRouteStack,
} from "@/components/patterns/admin-route-fallbacks/AdminRouteFallbacks";
import OfferingAdminListWorkspace from "@/components/patterns/offering-admin-list-workspace/OfferingAdminListWorkspace";
import { deleteEventAction } from "./[eventId]/actions";
import { listEventsByHubSlug } from "@/lib/data/events";
import { listEventSeriesByHubSlug } from "@/lib/data/event-series";
import { requireHubCoreBySlug } from "@/lib/data/hubs";
import {
  formatEventDateRange,
  getEventStatusLabel,
  getEventStatusTone,
} from "@/lib/domain/events";
import { getRequestHostFromHeaders, resolveHubRuntimeRouteMode } from "@/lib/domain/hub-hosts";
import { buildHubRuntimeHref } from "@/lib/domain/hub-runtime-paths";
import { getPublicEventSummary } from "@/lib/domain/public-events";

const filterDefinitions = [
  {
    key: "status",
    label: "Status",
    icon: "event_available",
    options: [
      { value: "all", label: "All" },
      { value: "draft", label: "Draft" },
      { value: "published", label: "Published" },
      { value: "cancelled", label: "Cancelled" },
    ],
  },
  {
    key: "pricing",
    label: "Pricing",
    icon: "payments",
    options: [
      { value: "all", label: "All" },
      { value: "free", label: "Free" },
      { value: "paid", label: "Paid" },
    ],
  },
  {
    key: "visibility",
    label: "Visibility",
    icon: "visibility",
    options: [
      { value: "all", label: "All" },
      { value: "public", label: "Public" },
      { value: "members-only", label: "Members only" },
    ],
  },
];

function buildAdminHref(hubSlug, pathname, routeMode) {
  return buildHubRuntimeHref(hubSlug, pathname, routeMode);
}

async function EventsWorkspace({ hub, routeMode }) {
  const [events, eventSeries] = await Promise.all([
    listEventsByHubSlug(hub.slug),
    listEventSeriesByHubSlug(hub.slug),
  ]);

  const eventItems = events
    .filter((event) => event.eventKind !== "series_occurrence")
    .map((event) => {
      const summary = getPublicEventSummary(event);
      const scheduleLabel = formatEventDateRange(event, hub.locale);
      const registrationCount = Number(event.registeredAttendeeCount || 0);

      return {
        id: event.id,
        title: event.title,
        scheduleLabel,
        dateSortValue: event.startAt || event.startDate || "",
        dateFilterValue: event.startAt || event.startDate || "",
        meta: [],
        summary,
        imageUrl: event.imageAsset?.publicUrl || "",
        imageAlt: event.imageAlt || event.imageAsset?.alt || event.title,
        badges: [
          { label: getEventStatusLabel(event.status), tone: getEventStatusTone(event.status) },
          { label: `${registrationCount} Attending`, tone: "accent" },
        ],
        searchTerms: [event.category, event.location, summary],
        filterValues: {
          status: event.status,
          pricing: event.pricingMode || "free",
          visibility: event.visibility || "public",
        },
        primaryAction: {
          href: buildAdminHref(hub.slug, `/admin/events/${event.id}`, routeMode),
          label: "Open event",
        },
        secondaryAction: {
          href: buildAdminHref(hub.slug, `/admin/events/${event.id}?mode=edit`, routeMode),
          label: "Edit event",
        },
        deleteMenuLabel: "Delete event",
        deleteTitle: "Delete event",
        deleteDescription: `Delete ${event.title}? This cannot be undone.`,
        deleteBlockedNote: "Events with existing registrations or bookings cannot be deleted.",
        deleteValues: {
          hubId: hub.id,
          hubSlug: hub.slug,
          eventId: event.id,
        },
      };
    });

  const seriesItems = eventSeries.map((series) => {
    const previewCount = series.schedulePreview?.totalOccurrences || 0;
    const previewLabel = previewCount === 1 ? "1 occurrence" : `${previewCount} occurrences`;
    const scheduleLabel = `${series.recurrenceStartDate} to ${series.recurrenceUntilDate}`;

    return {
      id: series.id,
      title: series.title,
      scheduleLabel,
      dateSortValue: series.recurrenceStartDate || "",
      dateFilterValue: series.recurrenceStartDate || "",
      meta: [],
      summary: series.summary,
      imageUrl: series.imageAsset?.publicUrl || "",
      imageAlt: series.imageAlt || series.imageAsset?.alt || series.title,
      badges: [
        { label: getEventStatusLabel(series.status), tone: getEventStatusTone(series.status) },
        { label: "Recurring series", tone: "accent" },
        { label: previewLabel, tone: "neutral" },
      ],
      searchTerms: [series.category, series.location, series.summary, series.slugBase],
      filterValues: {
        status: series.status,
        pricing: series.pricingMode || "free",
        visibility: series.visibility || "public",
      },
      primaryAction: {
        href: buildAdminHref(hub.slug, `/admin/events/series/${series.id}`, routeMode),
        label: "Open series",
      },
      secondaryAction: null,
      deleteValues: null,
    };
  });

  const items = [...seriesItems, ...eventItems].sort((left, right) =>
    String(left.dateSortValue || "").localeCompare(String(right.dateSortValue || ""))
  );

  return (
    <div>
      <OfferingAdminListWorkspace
        eyebrow="Events"
        title="Manage events"
        description="Review upcoming and draft events, filter the list quickly, and open the one you need to edit, publish, or manage."
        actions={<Button href={buildAdminHref(hub.slug, "/admin/events/create", routeMode)} data-onboarding="events-create-button">Create event</Button>}
        items={items}
        showHeader={false}
        onboardingKey="events-list"
        deleteAction={deleteEventAction}
        deleteConfirmLabel="Delete event"
        filterDefinitions={filterDefinitions}
        emptyState={{
          eyebrow: "No events yet",
          title: "Create the first event",
          description: "Create the first event to start managing registrations, capacity, and attendance.",
          primaryAction: { href: buildAdminHref(hub.slug, "/admin/events/create", routeMode), label: "Create event" },
          secondaryAction: { href: buildAdminHref(hub.slug, "/admin", routeMode), label: "Back to overview" },
        }}
      />
    </div>
  );
}

export default async function EventsPage({ params }) {
  const { hubSlug } = await params;
  const headerStore = await headers();
  const routeMode = resolveHubRuntimeRouteMode(getRequestHostFromHeaders(headerStore));
  const hub = await requireHubCoreBySlug(hubSlug);

  return (
    <AdminRouteStack>
      <PageHeader
        eyebrow="Events"
        title="Manage events"
        description="Review upcoming and draft events, filter the list quickly, and open the one you need to edit, publish, or manage."
        actions={<Button href={buildAdminHref(hub.slug, "/admin/events/create", routeMode)} data-onboarding="events-create-button">Create event</Button>}
      />
      <Suspense fallback={<AdminProgrammeListFallback rows={3} filters={3} />}>
        <EventsWorkspace hub={hub} routeMode={routeMode} />
      </Suspense>
    </AdminRouteStack>
  );
}
