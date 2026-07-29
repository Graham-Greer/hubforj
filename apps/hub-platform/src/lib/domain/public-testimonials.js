function normalizeString(value) {
  return String(value || "").trim();
}

export function getDefaultTestimonialsPageHero(siteName) {
  const normalizedSiteName = normalizeString(siteName) || "this community";

  return {
    eyebrow: "Testimonials",
    title: `What people say about ${normalizedSiteName}`,
    description: `Read published testimonials from people who have experienced ${normalizedSiteName} and use their words to understand the community before you join.`,
  };
}
