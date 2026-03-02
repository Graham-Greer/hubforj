import { notFound } from "next/navigation";
import Heading from "@/components/primitives/heading/Heading";
import Text from "@/components/primitives/text/Text";
import HubHeaderFooterFrame from "@/app/_shared/HubHeaderFooterFrame";
import PageCompositionRenderer from "@/app/_shared/PageCompositionRenderer";
import { getHubBySlug } from "@/lib/data/hubs/hub-repository";
import { listPublishedEventsByHub } from "@/lib/data/events/event-repository";
import { getMediaByIds } from "@/lib/data/media/media-repository";
import { collectMediaIdsForPage, getPublishedLandingPage } from "@/lib/data/pages/page-repository";
import styles from "./page.module.css";

export const revalidate = 120;

function buildFallbackLandingComposition(hub) {
  return [
    {
      id: "blk_fallback_hero",
      type: "HeroSection",
      variant: "centered",
      props: {
        heading: hub.name,
        subheading: "Welcome to your community hub.",
        ctaText: "Explore events",
        ctaHref: `/${hub.slug}/events`,
      },
    },
    {
      id: "blk_fallback_events",
      type: "EventListSection",
      variant: "featured",
      props: {
        title: "Featured events",
        limit: "3",
      },
    },
    {
      id: "blk_fallback_contact",
      type: "ContactSection",
      variant: "card",
      props: {
        email: `hello@${hub.slug}.local`,
      },
    },
  ];
}

export default async function PublicHubPage({ params }) {
  const hub = await getHubBySlug(params.hubSlug);
  if (!hub) notFound();

  const [landingPage, events] = await Promise.all([
    getPublishedLandingPage(hub.id),
    listPublishedEventsByHub(hub.id),
  ]);

  const composition = landingPage?.publishedComposition?.length
    ? landingPage.publishedComposition
    : buildFallbackLandingComposition(hub);

  const mediaIds = landingPage ? collectMediaIdsForPage(landingPage) : [];
  const media = mediaIds.length ? await getMediaByIds(hub.id, mediaIds) : [];

  return (
    <HubHeaderFooterFrame hub={hub} page={landingPage} basePath={`/${hub.slug}`}>
      <main className={styles.root}>
        {!landingPage ? (
          <header className={styles.header}>
            <Heading as="h1" size="lg">{hub.name}</Heading>
            <Text tone="secondary">No published landing page yet. Showing fallback composition.</Text>
          </header>
        ) : null}
        <PageCompositionRenderer composition={composition} media={media} events={events} />
      </main>
    </HubHeaderFooterFrame>
  );
}
