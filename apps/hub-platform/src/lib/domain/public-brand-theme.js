import { normalizeTheme } from "@/lib/theme/default-theme";

const defaultBrandingColors = {
  primary: "#256EF1",
  secondary: "#9C6E35",
};

const themeTextCandidates = {
  light: {
    primary: { token: "var(--text-primary)", hex: "#171D24" },
    inverse: { token: "var(--text-inverse)", hex: "#F6F8FB" },
  },
  dark: {
    primary: { token: "var(--text-primary)", hex: "#F6F8FB" },
    inverse: { token: "var(--text-inverse)", hex: "#0D1117" },
  },
};

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeHexColor(value, fallback) {
  const normalizedValue = normalizeString(value).toUpperCase();
  return /^#[0-9A-F]{6}$/.test(normalizedValue) ? normalizedValue : fallback;
}

function hexToRgb(hex) {
  const normalized = normalizeHexColor(hex, "#000000").slice(1);
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function toLinearChannel(channel) {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function getRelativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  return (0.2126 * toLinearChannel(r)) + (0.7152 * toLinearChannel(g)) + (0.0722 * toLinearChannel(b));
}

function getContrastRatio(foregroundHex, backgroundHex) {
  const foreground = getRelativeLuminance(foregroundHex);
  const background = getRelativeLuminance(backgroundHex);
  const lighter = Math.max(foreground, background);
  const darker = Math.min(foreground, background);
  return (lighter + 0.05) / (darker + 0.05);
}

function resolveReadableTextToken(backgroundHex, theme) {
  const candidates = themeTextCandidates[theme] || themeTextCandidates.light;
  const primaryContrast = getContrastRatio(candidates.primary.hex, backgroundHex);
  const inverseContrast = getContrastRatio(candidates.inverse.hex, backgroundHex);
  return primaryContrast >= inverseContrast ? candidates.primary.token : candidates.inverse.token;
}

function mixHexColors(baseHex, mixHex, ratio) {
  const base = hexToRgb(baseHex);
  const mix = hexToRgb(mixHex);
  const clampedRatio = Math.max(0, Math.min(1, ratio));
  const mixed = {
    r: Math.round((base.r * (1 - clampedRatio)) + (mix.r * clampedRatio)),
    g: Math.round((base.g * (1 - clampedRatio)) + (mix.g * clampedRatio)),
    b: Math.round((base.b * (1 - clampedRatio)) + (mix.b * clampedRatio)),
  };

  return `#${[mixed.r, mixed.g, mixed.b].map((value) => value.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

function resolveHoverColor(backgroundHex) {
  return getRelativeLuminance(backgroundHex) > 0.35
    ? mixHexColors(backgroundHex, "#000000", 0.14)
    : mixHexColors(backgroundHex, "#FFFFFF", 0.14);
}

export function resolvePublicBrandThemeTokens({ theme, branding } = {}) {
  const resolvedTheme = normalizeTheme(theme);
  const accentPrimary = normalizeHexColor(branding?.primary, defaultBrandingColors.primary);
  const accentSecondary = normalizeHexColor(branding?.secondary, defaultBrandingColors.secondary);
  const accentPrimaryHover = resolveHoverColor(accentPrimary);
  const accentSecondaryHover = resolveHoverColor(accentSecondary);
  const accentPrimaryText = resolveReadableTextToken(accentPrimary, resolvedTheme);
  const accentSecondaryText = resolveReadableTextToken(accentSecondary, resolvedTheme);

  return {
    "--accent-primary": accentPrimary,
    "--accent-primary-hover": accentPrimaryHover,
    "--accent-primary-text": accentPrimaryText,
    "--accent-secondary": accentSecondary,
    "--accent-secondary-hover": accentSecondaryHover,
    "--accent-secondary-text": accentSecondaryText,
  };
}
