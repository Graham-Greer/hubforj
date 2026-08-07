import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { listMediaFoldersByHubId } from "@/lib/data/media";
import { requireHubBySlug } from "@/lib/data/hubs";
import { getEventSeriesById, listEventSeriesOccurrences } from "@/lib/data/event-series";
import { getRequestHostFromHeaders, resolveHubRuntimeRouteMode } from "@/lib/domain/hub-hosts";
import EventSeriesWorkspace from "@/components/patterns/event-series-workspace/EventSeriesWorkspace";
import EditEventSeriesForm from "./EditEventSeriesForm";

export default async function EventSeriesDetailPage({ params, searchParams }) {
  const { hubSlug, seriesId } = await params;
  const query = await searchParams;
  const headerStore = await headers();
  const routeMode = resolveHubRuntimeRouteMode(getRequestHostFromHeaders(headerStore));
  const eventsSearchParams = new URLSearchParams();

  ["q", "status", "pricing", "visibility", "view"].forEach((key) => {
    const value = query?.[key];

    if (typeof value === "string" && value && (key !== "view" || value === "history")) {
      eventsSearchParams.set(key, value);
    }
  });

  const occurrencesQuery = eventsSearchParams.toString();
  const hub = await requireHubBySlug(hubSlug);
  const [series, occurrences] = await Promise.all([
    getEventSeriesById(hub.id, seriesId),
    listEventSeriesOccurrences(hub.id, seriesId),
  ]);
  const isEditing = String(query?.mode || "") === "edit";

  if (!series) {
    notFound();
  }

  const enhancedSeries = {
    ...series,
    imageAsset: series.imageAsset || null,
  };
  const editForm = isEditing
    ? (
        <EditEventSeriesForm
          hub={hub}
          series={enhancedSeries}
          mediaAssets={enhancedSeries.imageAsset ? [enhancedSeries.imageAsset] : []}
          mediaFolders={await listMediaFoldersByHubId(hub.id)}
          routeMode={routeMode}
        />
      )
    : null;

  return (
    <EventSeriesWorkspace
      hub={hub}
      series={enhancedSeries}
      occurrences={occurrences}
      occurrencesQuery={occurrencesQuery}
      isEditing={isEditing}
      editForm={editForm}
      routeMode={routeMode}
    />
  );
}
