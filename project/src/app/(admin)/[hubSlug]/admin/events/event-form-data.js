export function toDateTimeInput(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.includes("T")) {
    return raw.replace("Z", "").slice(0, 16);
  }
  return raw;
}

export function toEventFormDefaults(event = null) {
  if (!event) {
    return {
      title: "",
      slug: "",
      status: "draft",
      description: "",
      imageMediaIds: [],
      startAtInput: "",
      endAtInput: "",
      location: "",
      capacity: 50,
      category: "Workshop",
      tagsInput: "",
      pricingMode: "free",
      priceInput: "",
      registrationEligibility: "members-only",
      visibility: "public",
    };
  }

  return {
    title: event.title || "",
    slug: event.slug || "",
    status: event.status || "draft",
    description: event.description || "",
    imageMediaIds: Array.isArray(event.imageMediaIds) ? event.imageMediaIds : [],
    startAtInput: toDateTimeInput(event.startAt),
    endAtInput: toDateTimeInput(event.endAt),
    location: event.location || "",
    capacity: Number(event.capacity || 50),
    category: event.category || "Workshop",
    tagsInput: Array.isArray(event.tags) ? event.tags.join(", ") : "",
    pricingMode: event.pricingMode || "free",
    priceInput: event.price === null || event.price === undefined ? "" : String(event.price),
    registrationEligibility: event.registrationEligibility || "members-only",
    visibility: event.visibility || "public",
  };
}

export function formatEventDateRange(startAt, endAt) {
  const start = startAt ? new Date(startAt) : null;
  const end = endAt ? new Date(endAt) : null;
  if (!start || Number.isNaN(start.getTime()) || !end || Number.isNaN(end.getTime())) {
    return "-";
  }

  return `${start.toLocaleString()} - ${end.toLocaleString()}`;
}
