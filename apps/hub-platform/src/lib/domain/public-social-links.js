function normalizeString(value) {
  return String(value || "").trim();
}

export const publicSocialNetworkMeta = {
  facebook: { label: "Facebook" },
  instagram: { label: "Instagram" },
  x: { label: "X" },
  linkedin: { label: "LinkedIn" },
  youtube: { label: "YouTube" },
};

export function buildPublicSocialItems(socialLinks = {}) {
  return Object.entries(socialLinks)
    .map(([key, href]) => ({
      key,
      href: normalizeString(href),
      label: publicSocialNetworkMeta[key]?.label || key,
    }))
    .filter((item) => item.href);
}
