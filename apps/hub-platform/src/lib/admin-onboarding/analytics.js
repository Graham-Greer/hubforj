function normalizeString(value) {
  return String(value || "").trim();
}

export function trackAdminOnboardingEvent(eventName, detail = {}) {
  if (typeof window === "undefined") {
    return;
  }

  const payload = {
    event: normalizeString(eventName),
    timestamp: new Date().toISOString(),
    ...detail,
  };

  window.dispatchEvent(
    new CustomEvent("hubforj:admin-onboarding", {
      detail: payload,
    })
  );

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({
      event: "hubforj_admin_onboarding",
      ...payload,
    });
  }
}
