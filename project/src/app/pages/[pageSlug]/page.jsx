import { notFound } from "next/navigation";
import Heading from "@/components/primitives/heading/Heading";
import Text from "@/components/primitives/text/Text";
import { getRequestHost, resolveHubByHost } from "@/lib/data/hubs/domain-resolution";
import { listPublishedEventsByHub } from "@/lib/data/events/event-repository";
import { getMediaByIds } from "@/lib/data/media/media-repository";
import { collectMediaIdsForPage, getPublishedPageBySlug } from "@/lib/data/pages/page-repository";
import PageCompositionRenderer from "@/app/_shared/PageCompositionRenderer";
import styles from "../../custom-domain-shell.module.css";

export const revalidate = 120;

export default async function CustomDomainCmsPage({ params }) {
  const host = await getRequestHost();
  const context = await resolveHubByHost(host);
  if (!context.hub) notFound();

  const page = await getPublishedPageBySlug(context.hub.id, params.pageSlug);
  if (!page) notFound();

  const mediaIds = collectMediaIdsForPage(page);
  const [media, events] = await Promise.all([
    getMediaByIds(context.hub.id, mediaIds),
    listPublishedEventsByHub(context.hub.id),
  ]);

  return (
    <main className={styles.shell}>
      <Heading as="h1" size="md">{page.title}</Heading>
      {page.seo?.description ? <Text tone="secondary">{page.seo.description}</Text> : null}
      <PageCompositionRenderer composition={page.publishedComposition} media={media} events={events} />
    </main>
  );
}
