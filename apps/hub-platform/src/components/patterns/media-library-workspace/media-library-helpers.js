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
