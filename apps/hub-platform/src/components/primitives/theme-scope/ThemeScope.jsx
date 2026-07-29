import { normalizeTemplate, normalizeTheme } from "@/lib/theme/default-theme";

export default function ThemeScope({ theme, template, scopeName, variables, children }) {
  return (
    <div
      data-theme={normalizeTheme(theme)}
      data-template={template ? normalizeTemplate(template) : undefined}
      data-workspace-theme-scope={scopeName || undefined}
      style={variables && Object.keys(variables).length > 0 ? variables : undefined}
    >
      {children}
    </div>
  );
}
