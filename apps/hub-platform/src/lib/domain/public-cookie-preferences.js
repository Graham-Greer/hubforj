function normalizeString(value) {
  return String(value || "").trim();
}

export const publicCookiePreferencesCookieName = "hub_public_cookie_preferences";
export const publicCookiePreferencesVersion = "2026-05-21";

export function createDefaultPublicCookiePreferences() {
  return {
    version: publicCookiePreferencesVersion,
    acknowledged: false,
    categories: {
      necessary: true,
    },
    savedAt: "",
  };
}

export function normalizePublicCookiePreferences(value) {
  const next = {
    ...createDefaultPublicCookiePreferences(),
    ...(value && typeof value === "object" ? value : {}),
  };

  return {
    version: normalizeString(next.version) || publicCookiePreferencesVersion,
    acknowledged: Boolean(next.acknowledged),
    categories: {
      necessary: true,
    },
    savedAt: normalizeString(next.savedAt),
  };
}

