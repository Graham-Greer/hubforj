function normalizeString(value) {
  return String(value || "").trim();
}

export const testimonialStatusLabels = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

export const testimonialStatusTones = {
  draft: "warning",
  published: "success",
  archived: "neutral",
};

export function getTestimonialStatusLabel(status) {
  return testimonialStatusLabels[normalizeString(status)] || "Unknown";
}

export function getTestimonialStatusTone(status) {
  return testimonialStatusTones[normalizeString(status)] || "neutral";
}

export function normalizeTestimonialInteger(value, fallback = 0) {
  const next = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(next) ? next : fallback;
}

export function normalizeCreateTestimonialPayload(payload) {
  const quote = normalizeString(payload.quote);
  const authorName = normalizeString(payload.authorName);
  const authorRole = normalizeString(payload.authorRole);
  const authorOrganization = normalizeString(payload.authorOrganization);
  const authorImageAssetId = normalizeString(payload.authorImageAssetId);
  const authorImageAlt = normalizeString(payload.authorImageAlt);
  const status = normalizeString(payload.status) || "draft";
  const featured = String(payload.featured || "") === "true" || payload.featured === true;
  const sortOrder = normalizeTestimonialInteger(payload.sortOrder, 0);

  if (!quote) {
    throw new Error("Testimonial quote is required.");
  }

  if (!authorName) {
    throw new Error("Author name is required.");
  }

  if (!testimonialStatusLabels[status]) {
    throw new Error("Unsupported testimonial status.");
  }

  return {
    quote,
    authorName,
    authorRole,
    authorOrganization,
    authorImageAssetId,
    authorImageAlt,
    status,
    featured,
    sortOrder,
  };
}

export function summarizeTestimonials(testimonials) {
  return testimonials.reduce(
    (summary, testimonial) => {
      summary.total += 1;
      if (testimonial.status === "published") summary.published += 1;
      if (testimonial.status === "draft") summary.drafts += 1;
      if (testimonial.featured) summary.featured += 1;
      return summary;
    },
    { total: 0, published: 0, drafts: 0, featured: 0 }
  );
}
