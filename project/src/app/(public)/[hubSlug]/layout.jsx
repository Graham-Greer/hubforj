import { notFound } from "next/navigation";
import { buildThemeScope } from "@/lib/theming/hub-theme";
import { getHubBySlug } from "@/lib/data/hubs/hub-repository";

export const revalidate = 120;

export default async function PublicHubLayout({ children, params }) {
  const hub = await getHubBySlug(params.hubSlug);
  if (!hub) {
    notFound();
  }

  const theme = buildThemeScope(hub);

  return (
    <div data-template={theme["data-template"]} data-hub-theme={theme["data-hub-theme"]}>
      {theme.stylesheetHref ? <link rel="stylesheet" href={theme.stylesheetHref} /> : null}
      {children}
    </div>
  );
}
