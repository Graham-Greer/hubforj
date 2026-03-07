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
        title: hub.name,
        description: "Welcome to your community hub.",
        ctas: [{ label: "Explore events", href: `/${hub.slug}/events` }],
        media: {
          mediaId: "",
          kind: "image",
          alt: "",
          posterMediaId: "",
          aspect: "auto",
        },
      },
    },
    {
      id: "blk_fallback_grid",
      type: "GridSection",
      variant: "default",
      props: {
        title: "Featured highlights",
        description: "Explore key updates from this hub.",
        layout: "grid",
        columns: "3",
        align: "left",
        density: "comfortable",
        items: [
          {
            id: "grid_item_1",
            title: "Upcoming events",
            description: "Browse workshops and gatherings in your area.",
            media: { imageMediaId: "", alt: "" },
            badge: null,
          },
          {
            id: "grid_item_2",
            title: "Programs",
            description: "Discover activities designed for members.",
            media: { imageMediaId: "", alt: "" },
            badge: null,
          },
          {
            id: "grid_item_3",
            title: "Resources",
            description: "Access useful guides and updates.",
            media: { imageMediaId: "", alt: "" },
            badge: null,
          },
        ],
      },
    },
    {
      id: "blk_fallback_accordion",
      type: "AccordionSection",
      variant: "default",
      props: {
        eyebrow: "Need help?",
        title: "Frequently asked questions",
        description: "Quick answers for common visitor questions.",
        items: [
          {
            id: "faq_1",
            title: "How do I join?",
            content: "<p>Use the join button to begin your membership application.</p>",
          },
          {
            id: "faq_2",
            title: "Where are events listed?",
            content: "<p>Visit the events page to see all upcoming sessions.</p>",
          },
        ],
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
