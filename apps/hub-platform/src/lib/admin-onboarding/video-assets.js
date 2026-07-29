function normalizeString(value) {
  return String(value || "").trim();
}

export const adminOnboardingVideoAssets = {
  "branding-settings-overview": {
    light: "/onboarding/branding-settings-overview-light.mp4",
    dark: "/onboarding/branding-settings-overview-dark.mp4",
  },
  "homepage-hero-editing": {
    light: "/onboarding/homepage-hero-editing-light.mp4",
    dark: "/onboarding/homepage-hero-editing-dark.mp4",
  },
  "media-upload-first-assets": {
    light: "/onboarding/media-upload-first-assets-light.mp4",
    dark: "/onboarding/media-upload-first-assets-dark.mp4",
  },
  "events-list-and-lifecycle": {
    light: "/onboarding/events-list-and-lifecycle-light.mp4",
    dark: "/onboarding/events-list-and-lifecycle-dark.mp4",
  },
  "courses-list-and-lifecycle": {
    light: "/onboarding/courses-list-and-lifecycle-light.mp4",
    dark: "/onboarding/courses-list-and-lifecycle-dark.mp4",
  },
};

export function resolveAdminOnboardingVideoAsset(assetKey, theme = "light") {
  const normalizedAssetKey = normalizeString(assetKey);
  const themeKey = normalizeString(theme) === "dark" ? "dark" : "light";
  return adminOnboardingVideoAssets[normalizedAssetKey]?.[themeKey] || "";
}
