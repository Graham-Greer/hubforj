import { notFound } from "next/navigation";
import { listMediaAssetsByHubId, listMediaFoldersByHubId } from "@/lib/data/media";
import { requireHubBySlug } from "@/lib/data/hubs";
import { getEventSeriesById, listEventSeriesOccurrences } from "@/lib/data/event-series";
import EventSeriesWorkspace from "@/components/patterns/event-series-workspace/EventSeriesWorkspace";
import EditEventSeriesForm from "./EditEventSeriesForm";

export default async function EventSeriesDetailPage({ params, searchParams }) {
  const { hubSlug, seriesId } = await params;
  const query = await searchParams;
  const eventsSearchParams = new URLSearchParams();

  ["q", "status", "pricing", "visibility"].forEach((key) => {
    const value = query?.[key];

    if (typeof value === "string" && value) {
      eventsSearchParams.set(key, value);
    }
  });

  const occurrencesQuery = eventsSearchParams.toString();
  const hub = await requireHubBySlug(hubSlug);
  const [series, occurrences, mediaAssets, mediaFolders] = await Promise.all([
    getEventSeriesById(hub.id, seriesId),
    listEventSeriesOccurrences(hub.id, seriesId),
    listMediaAssetsByHubId(hub.id),
    listMediaFoldersByHubId(hub.id),
  ]);
  const isEditing = String(query?.mode || "") === "edit";

  if (!series) {
    notFound();
  }

  const enhancedSeries = {
    ...series,
    imageAsset: series.imageAssetId ? mediaAssets.find((asset) => asset.id === series.imageAssetId) || null : null,
  };

  return (
    <EventSeriesWorkspace
      hub={hub}
      series={enhancedSeries}
      occurrences={occurrences}
      occurrencesQuery={occurrencesQuery}
      isEditing={isEditing}
      editForm={<EditEventSeriesForm hub={hub} series={enhancedSeries} mediaAssets={mediaAssets} mediaFolders={mediaFolders} />}
    />
  );
}
