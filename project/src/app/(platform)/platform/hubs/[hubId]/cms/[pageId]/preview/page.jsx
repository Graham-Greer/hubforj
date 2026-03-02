import { notFound } from "next/navigation";
import HubHeaderFooterFrame from "@/app/_shared/HubHeaderFooterFrame";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import Text from "@/components/primitives/text/Text";
import { requireSessionRole } from "@/lib/auth/guards";
import { getHubById } from "@/lib/data/hubs/hub-repository";
import { listEventsByHub } from "@/lib/data/events/event-repository";
import { listMediaByHub } from "@/lib/data/media/media-repository";
import { getPageById } from "@/lib/data/pages/page-repository";
import { buildThemeScope } from "@/lib/theming/hub-theme";
import PageCompositionRenderer from "@/app/_shared/PageCompositionRenderer";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function HubCmsDraftPreviewPage({ params }) {
  await requireSessionRole("superadmin", "/platform/sign-in");
  const resolvedParams = await params;

  const hub = await getHubById(resolvedParams?.hubId);
  if (!hub) notFound();

  const page = await getPageById(hub.id, resolvedParams?.pageId);
  if (!page) notFound();

  const [media, events] = await Promise.all([
    listMediaByHub(hub.id),
    listEventsByHub(hub.id),
  ]);
  const theme = buildThemeScope(hub);

  return (
    <main className={styles.root}>
      <PageHeader title={`Preview draft: ${page.title}`} subtitle="Draft preview (no-store)" />
      <Text tone="secondary">Slug: /{hub.slug}/pages/{page.slug}</Text>
      <div data-template={theme["data-template"]} data-hub-theme={theme["data-hub-theme"]}>
        {theme.stylesheetHref ? <link rel="stylesheet" href={theme.stylesheetHref} /> : null}
        <HubHeaderFooterFrame hub={hub} page={page} basePath={`/${hub.slug}`}>
          <PageCompositionRenderer composition={page.draftComposition} media={media} events={events} />
        </HubHeaderFooterFrame>
      </div>
    </main>
  );
}
