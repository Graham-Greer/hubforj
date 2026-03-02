import Heading from "@/components/primitives/heading/Heading";
import Text from "@/components/primitives/text/Text";
import HubHeaderFooterFrame from "@/app/_shared/HubHeaderFooterFrame";
import PageCompositionRenderer from "@/app/_shared/PageCompositionRenderer";
import { getRequestHost, resolveHubByHost } from "@/lib/data/hubs/domain-resolution";
import { listPublishedEventsByHub } from "@/lib/data/events/event-repository";
import { getMediaByIds } from "@/lib/data/media/media-repository";
import { collectMediaIdsForPage, getPublishedLandingPage } from "@/lib/data/pages/page-repository";
import { buildThemeScope } from "@/lib/theming/hub-theme";
import styles from "./custom-domain-shell.module.css";

export const revalidate = 120;

function buildFallbackLandingComposition() {
  return [
    {
      id: "blk_fallback_hero",
      type: "HeroSection",
      variant: "centered",
      props: {
        heading: "Welcome",
        subheading: "Explore our latest updates and events.",
        ctaText: "Explore events",
        ctaHref: "/events",
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
        email: "hello@communityhub.local",
      },
    },
  ];
}

export default async function RootPage() {
  const host = await getRequestHost();
  const context = await resolveHubByHost(host);

  if (!context.hub) {
    return (
      <main className={styles.shell}>
        <Heading as="h1" size="md">Platform Home</Heading>
        <Text tone="secondary">Use `/platform` for superadmin operations or /{"{hubSlug}"} routes on the platform domain.</Text>
      </main>
    );
  }

  const [landingPage, events] = await Promise.all([
    getPublishedLandingPage(context.hub.id),
    listPublishedEventsByHub(context.hub.id),
  ]);
  const composition = landingPage?.publishedComposition?.length
    ? landingPage.publishedComposition
    : buildFallbackLandingComposition();
  const mediaIds = landingPage ? collectMediaIdsForPage(landingPage) : [];
  const media = mediaIds.length ? await getMediaByIds(context.hub.id, mediaIds) : [];

  const theme = buildThemeScope(context.hub);
  return (
    <div
      data-template={theme["data-template"]}
      data-hub-theme={theme["data-hub-theme"]}
    >
      {theme.stylesheetHref ? <link rel="stylesheet" href={theme.stylesheetHref} /> : null}
      <HubHeaderFooterFrame hub={context.hub} page={landingPage} basePath="">
        <main className={styles.shell}>
          {!landingPage ? (
            <>
              <Heading as="h1" size="md">{context.hub.name}</Heading>
              <Text tone="secondary">No published landing page yet. Showing fallback composition.</Text>
            </>
          ) : null}
          <PageCompositionRenderer composition={composition} media={media} events={events} />
        </main>
      </HubHeaderFooterFrame>
    </div>
  );
}
