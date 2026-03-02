import { notFound } from "next/navigation";
import HubHeaderFooterFrame from "@/app/_shared/HubHeaderFooterFrame";
import { getRequestHost, resolveHubByHost } from "@/lib/data/hubs/domain-resolution";
import { getPublishedPageBySlug } from "@/lib/data/pages/page-repository";
import { buildThemeScope } from "@/lib/theming/hub-theme";

export const revalidate = 120;

export default async function CustomDomainPageLayout({ children, params }) {
  const host = await getRequestHost();
  const context = await resolveHubByHost(host);
  if (!context.hub) notFound();

  const page = await getPublishedPageBySlug(context.hub.id, params.pageSlug);
  if (!page) notFound();
  const theme = buildThemeScope(context.hub);

  return (
    <div data-template={theme["data-template"]} data-hub-theme={theme["data-hub-theme"]}>
      {theme.stylesheetHref ? <link rel="stylesheet" href={theme.stylesheetHref} /> : null}
      <HubHeaderFooterFrame hub={context.hub} page={page} basePath="">
        {children}
      </HubHeaderFooterFrame>
    </div>
  );
}
