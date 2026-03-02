try {
  await import("server-only");
} catch {
  // Unit tests run in plain Node where this package may not be installed.
}
import { getFirebaseAdminStorage } from "../firebase/admin.js";
import { buildThemeCssText, getThemeCssPath } from "./hub-theme.js";

function shouldRefreshThemeCss(patch = {}) {
  return Object.hasOwn(patch, "tokenOverrides") || Object.hasOwn(patch, "templateKey");
}

function getNextThemeRevision(currentRevision, patch = {}) {
  const base = Number.isFinite(Number(currentRevision)) && Number(currentRevision) > 0
    ? Math.floor(Number(currentRevision))
    : 1;
  return shouldRefreshThemeCss(patch) ? base + 1 : base;
}

function mapThemeWriteError(error) {
  const mapped = new Error("Unable to update generated theme stylesheet.");
  mapped.code = "THEME_CSS_WRITE_FAILED";
  mapped.cause = error;
  return mapped;
}

async function writeThemeCssToStorage(hub) {
  const cssText = buildThemeCssText(hub);
  const storagePath = getThemeCssPath(hub.id);
  const storage = getFirebaseAdminStorage();
  const bucket = storage.bucket();
  const file = bucket.file(storagePath);

  try {
    await file.save(cssText, {
      contentType: "text/css; charset=utf-8",
      resumable: false,
      public: true,
      metadata: {
        cacheControl: "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    throw mapThemeWriteError(error);
  }

  return storagePath;
}

export async function ensureHubThemeCssForCreate(hub) {
  const revision = Number.isFinite(Number(hub?.themeRevision)) && Number(hub.themeRevision) > 0
    ? Math.floor(Number(hub.themeRevision))
    : 1;
  const nextHub = {
    ...hub,
    themeRevision: revision,
    themeCssPath: getThemeCssPath(hub.id),
  };

  await writeThemeCssToStorage(nextHub);
  return {
    themeRevision: nextHub.themeRevision,
    themeCssPath: nextHub.themeCssPath,
  };
}

export async function ensureHubThemeCssForUpdate(currentHub, patch = {}) {
  const nextRevision = getNextThemeRevision(currentHub?.themeRevision, patch);
  const nextHub = {
    ...currentHub,
    ...patch,
    id: currentHub.id,
    themeRevision: nextRevision,
    themeCssPath: getThemeCssPath(currentHub.id),
  };

  if (shouldRefreshThemeCss(patch)) {
    await writeThemeCssToStorage(nextHub);
  }

  return {
    themeRevision: nextHub.themeRevision,
    themeCssPath: nextHub.themeCssPath,
    changed: shouldRefreshThemeCss(patch),
  };
}

export { getNextThemeRevision, shouldRefreshThemeCss };
