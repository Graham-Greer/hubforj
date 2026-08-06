import { getFallbackRegionalMarket } from "@/lib/domain/regional-markets";

export const filterTabs = [
  { value: "all", label: "All" },
  { value: "image", label: "Images" },
  { value: "video", label: "Videos" },
  { value: "doc", label: "Docs" },
];

export function normalizeString(value) {
  return String(value || "").trim();
}

const fallbackRegionalMarket = getFallbackRegionalMarket();

export function formatDate(value) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(fallbackRegionalMarket.defaultLocale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function getAssetKindLabel(asset) {
  if (asset.type === "image") {
    return "Image";
  }

  if (asset.type === "video") {
    return "Video";
  }

  return "Document";
}

export function getAssetIconName(asset) {
  if (asset.type === "image") {
    return "imagesmode";
  }

  if (asset.type === "video") {
    return "videocam";
  }

  return "description";
}

export function getUsageHref(hubSlug, usage) {
  if (usage.entityType === "branding") {
    return `/${hubSlug}/admin/settings/branding`;
  }

  if (usage.entityType === "page") {
    const pageRoutes = {
      home: "home",
      events: "events",
      courses: "courses",
      testimonials: "testimonials",
    };
    const pageRoute = pageRoutes[usage.entityId];

    return pageRoute ? `/${hubSlug}/admin/settings/pages/${pageRoute}` : `/${hubSlug}/admin/settings/pages`;
  }

  if (usage.entityType === "testimonial") {
    return `/${hubSlug}/admin/testimonials/${usage.entityId}`;
  }

  if (usage.entityType === "event") {
    return `/${hubSlug}/admin/events/${usage.entityId}`;
  }

  if (usage.entityType === "eventSeries") {
    return `/${hubSlug}/admin/events/series/${usage.entityId}`;
  }

  if (usage.entityType === "course") {
    return `/${hubSlug}/admin/courses/${usage.entityId}`;
  }

  return "";
}

function createUsageDisplayGroup(usage, entries = [usage]) {
  return {
    key: entries.map((entry) => `${entry.entityType}-${entry.entityId}-${entry.field}`).join(":"),
    label: usage.label,
    field: usage.field,
    primaryUsage: usage,
    references: entries,
    count: entries.length,
    kind: usage.entityType,
    detail: usage.field,
  };
}

function getSeriesGroupingKey(usage) {
  const label = normalizeString(usage?.label).toLowerCase();
  const field = normalizeString(usage?.field);

  return label && field === "image" ? `${field}:${label}` : "";
}

export function buildUsageDisplayGroups(usageRefs = []) {
  const refs = Array.isArray(usageRefs) ? usageRefs : [];
  const usedIndexes = new Set();
  const seriesCandidateIndexesByKey = new Map();

  refs.forEach((usage, index) => {
    const key = getSeriesGroupingKey(usage);

    if (!key || (usage.entityType !== "event" && usage.entityType !== "eventSeries")) {
      return;
    }

    const indexes = seriesCandidateIndexesByKey.get(key) || [];
    indexes.push(index);
    seriesCandidateIndexesByKey.set(key, indexes);
  });

  const groups = [];

  seriesCandidateIndexesByKey.forEach((indexes) => {
    const entries = indexes.map((index) => refs[index]);
    const seriesEntry = entries.find((usage) => usage.entityType === "eventSeries");

    if (!seriesEntry) {
      return;
    }

    indexes.forEach((index) => usedIndexes.add(index));
    groups.push({
      key: `series:${getSeriesGroupingKey(seriesEntry || entries[0])}`,
      label: seriesEntry?.label || entries[0]?.label || "Event series image",
      field: "image",
      primaryUsage: seriesEntry || entries[0],
      references: entries,
      count: entries.length,
      kind: "eventSeries",
      detail: entries.length === 1
        ? "Used by this event series"
        : `Used by this event series and ${entries.length - 1} generated event${entries.length - 1 === 1 ? "" : "s"}`,
    });
  });

  refs.forEach((usage, index) => {
    if (usedIndexes.has(index)) {
      return;
    }

    groups.push(createUsageDisplayGroup(usage));
  });

  return groups;
}
