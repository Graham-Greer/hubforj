function asRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function sanitizeScope(value) {
  return String(value || "default")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "default";
}

function sanitizeCssVarName(value) {
  const key = String(value || "").trim();
  if (!/^--[a-z0-9_-]+$/i.test(key)) {
    return null;
  }
  return key;
}

function sanitizeCssValue(value) {
  return String(value ?? "")
    .replace(/[{}<>]/g, "")
    .trim()
    .slice(0, 200);
}

function normalizeBucketName(value) {
  return String(value || "")
    .trim()
    .replace(/^gs:\/\//, "")
    .replace(/\/+$/, "");
}

function sanitizeTemplateKey(value) {
  return String(value || "templateA")
    .trim()
    .replace(/"/g, "")
    .replace(/[^\w-]/g, "") || "templateA";
}

function getRevision(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
}

export function getThemeCssPath(hubId) {
  return `hubs/${String(hubId || "").trim()}/theme/theme-overrides.css`;
}

export function getThemeStylesheetHref(hub) {
  const bucket = normalizeBucketName(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
  if (!bucket || !hub?.id) return "";

  const path = String(hub.themeCssPath || getThemeCssPath(hub.id));
  const encodedPath = path
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
  const revision = getRevision(hub.themeRevision);
  return `https://storage.googleapis.com/${bucket}/${encodedPath}?v=${revision}`;
}

export function getScopedTokenOverrides(tokenOverrides, templateKey) {
  const source = asRecord(tokenOverrides);
  const scoped = {};

  for (const [key, value] of Object.entries(source)) {
    if (key.startsWith("--")) {
      scoped[key] = String(value);
    }
  }

  const templateScoped = asRecord(source[templateKey]);
  for (const [key, value] of Object.entries(templateScoped)) {
    if (key.startsWith("--")) {
      scoped[key] = String(value);
    }
  }

  return scoped;
}

export function buildThemeCssText(hub) {
  const templateKey = sanitizeTemplateKey(hub?.templateKey);
  const tokenOverrides = getScopedTokenOverrides(hub?.tokenOverrides, templateKey);
  const declarations = Object.entries(tokenOverrides)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => {
      const cssVar = sanitizeCssVarName(key);
      if (!cssVar) return "";
      const cssValue = sanitizeCssValue(value);
      if (!cssValue) return "";
      return `  ${cssVar}: ${cssValue};`;
    })
    .filter(Boolean)
    .join("\n");

  const header = `/* Generated hub theme overrides. Hub: ${String(hub?.id || "unknown")} */`;
  if (!declarations) {
    return `${header}\n:root[data-template="${templateKey}"] {\n}\n`;
  }

  return `${header}\n:root[data-template="${templateKey}"] {\n${declarations}\n}\n`;
}

export function buildThemeScope(hub) {
  const templateKey = String(hub?.templateKey || "templateA");
  const scopeId = sanitizeScope(hub?.id || templateKey);

  return {
    "data-template": templateKey,
    "data-hub-theme": scopeId,
    stylesheetHref: getThemeStylesheetHref(hub),
  };
}
