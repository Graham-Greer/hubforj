import { notFound } from "next/navigation";
import HubHeaderFooterFrame from "@/app/_shared/HubHeaderFooterFrame";
import { getHubBySlug } from "@/lib/data/hubs/hub-repository";
import { getPublishedPageBySlug } from "@/lib/data/pages/page-repository";

export const revalidate = 120;

export default async function PublicPageLayout({ children, params }) {
  const hub = await getHubBySlug(params.hubSlug);
  if (!hub) notFound();

  const page = await getPublishedPageBySlug(hub.id, params.pageSlug);
  if (!page) notFound();

  return (
    <HubHeaderFooterFrame hub={hub} page={page} basePath={`/${hub.slug}`}>
      {children}
    </HubHeaderFooterFrame>
  );
}
