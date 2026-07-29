export const operatorThemeCookieName = "hub_platform_operator_theme";
export const operatorThemeDefault = "dark";
export const supportedOperatorThemes = ["light", "dark"];

export function normalizeOperatorTheme(value) {
  return supportedOperatorThemes.includes(value) ? value : operatorThemeDefault;
}
