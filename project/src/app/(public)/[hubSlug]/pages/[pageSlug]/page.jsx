import { notFound } from "next/navigation";
import Heading from "@/components/primitives/heading/Heading";
import Text from "@/components/primitives/text/Text";
import { getHubBySlug } from "@/lib/data/hubs/hub-repository";
import { listPublishedEventsByHub } from "@/lib/data/events/event-repository";
import { getMediaByIds } from "@/lib/data/media/media-repository";
import { collectMediaIdsForPage, getPublishedPageBySlug } from "@/lib/data/pages/page-repository";
import PageCompositionRenderer from "@/app/_shared/PageCompositionRenderer";
import styles from "./page.module.css";

export const revalidate = 120;

export default async function PublicCustomPage({ params }) {
  const hub = await getHubBySlug(params.hubSlug);
  if (!hub) notFound();

  const page = await getPublishedPageBySlug(hub.id, params.pageSlug);
  if (!page) notFound();

  const mediaIds = collectMediaIdsForPage(page);
  const [media, events] = await Promise.all([
    getMediaByIds(hub.id, mediaIds),
    listPublishedEventsByHub(hub.id),
  ]);

  return (
    <main className={styles.root}>
      <header className={styles.header}>
        <Heading as="h1" size="lg">{page.title}</Heading>
        {page.seo?.description ? <Text tone="secondary">{page.seo.description}</Text> : null}
      </header>
      <PageCompositionRenderer composition={page.publishedComposition} media={media} events={events} />
    </main>
  );
}
