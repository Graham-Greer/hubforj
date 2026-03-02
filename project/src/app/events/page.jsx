import { notFound } from "next/navigation";
import Heading from "@/components/primitives/heading/Heading";
import Text from "@/components/primitives/text/Text";
import Link from "@/components/ui/link/Link";
import Card from "@/components/ui/card/Card";
import AppImage from "@/components/ui/image/AppImage";
import ErrorState from "@/components/ui/error-state/ErrorState";
import HubHeaderFooterFrame from "@/app/_shared/HubHeaderFooterFrame";
import { canAccessHubMember } from "@/lib/auth/guards";
import { getSession } from "@/lib/auth/session";
import { getRequestHost, resolveHubByHost } from "@/lib/data/hubs/domain-resolution";
import { listPublishedEventsByHub } from "@/lib/data/events/event-repository";
import { getMediaByIds } from "@/lib/data/media/media-repository";
import { buildThemeScope } from "@/lib/theming/hub-theme";
import styles from "../custom-domain-shell.module.css";

export const revalidate = 120;

function collectEventMediaIds(events) {
  return Array.from(
    new Set(
      (events || []).flatMap((event) =>
        Array.isArray(event.imageMediaIds)
          ? event.imageMediaIds.map((id) => String(id || "").trim()).filter(Boolean)
          : []
      )
    )
  );
}

function toDateLabel(value) {
  if (!value) return "Date TBD";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Date TBD";
  return parsed.toLocaleString();
}

export default async function CustomDomainEventsPage() {
  const host = await getRequestHost();
  const context = await resolveHubByHost(host);
  if (!context.hub) notFound();

  const session = await getSession();
  const canViewMembersOnly = canAccessHubMember(session, context.hub.slug);
  const events = await listPublishedEventsByHub(context.hub.id);
  const visibleEvents = events.filter((event) => event.visibility !== "members-only" || canViewMembersOnly);
  const hiddenCount = events.length - visibleEvents.length;
  const media = await getMediaByIds(context.hub.id, collectEventMediaIds(visibleEvents));
  const mediaById = new Map(media.map((item) => [item.id, item]));

  const theme = buildThemeScope(context.hub);
  return (
    <div data-template={theme["data-template"]} data-hub-theme={theme["data-hub-theme"]}>
      {theme.stylesheetHref ? <link rel="stylesheet" href={theme.stylesheetHref} /> : null}
      <HubHeaderFooterFrame hub={context.hub} basePath="">
        <main className={styles.shell}>
          <header>
            <Heading as="h1" size="md">Events</Heading>
            <Text tone="secondary">Browse upcoming events for {context.hub.name}.</Text>
          </header>

          {!canViewMembersOnly && hiddenCount > 0 ? (
            <ErrorState
              title="Members-only events are hidden"
              body={`Sign in to view ${hiddenCount} additional member event${hiddenCount === 1 ? "" : "s"}.`}
              variant="compact"
            />
          ) : null}

          <section className={styles.grid}>
            {visibleEvents.length ? visibleEvents.map((event) => {
              const imageId = Array.isArray(event.imageMediaIds) ? event.imageMediaIds[0] : "";
              const image = imageId ? mediaById.get(imageId) : null;

              return (
                <Card key={event.id} className={styles.card}>
                  {image?.publicUrl ? (
                    <AppImage
                      src={image.publicUrl}
                      alt={image.alt || event.title}
                      width={1200}
                      height={700}
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  ) : null}
                  <div className={styles.cardBody}>
                    <Heading as="h2" size="sm">{event.title}</Heading>
                    <Text tone="secondary">{toDateLabel(event.startAt)}</Text>
                    <Text tone="secondary">{event.location || "Location TBD"}</Text>
                    <Link href={`/events/${event.slug}`}>View event</Link>
                  </div>
                </Card>
              );
            }) : <Text tone="secondary">No published events are available yet.</Text>}
          </section>
        </main>
      </HubHeaderFooterFrame>
    </div>
  );
}
