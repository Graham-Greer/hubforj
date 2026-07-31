"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/ui/icon/Icon";
import SectionContainer from "@/components/sections/section-container/SectionContainer";
import SectionShell from "@/components/sections/section-shell/SectionShell";
import SectionCard from "@/components/sections/primitives/section-card/SectionCard";
import SectionCardBody from "@/components/sections/primitives/section-card-body/SectionCardBody";
import SectionCardMedia from "@/components/sections/primitives/section-card-media/SectionCardMedia";
import SectionItemsGrid from "@/components/sections/primitives/section-items-grid/SectionItemsGrid";
import SectionSearchFilters from "@/components/sections/primitives/section-search-filters/SectionSearchFilters";
import {
  ALL_EVENTS_FILTER,
  buildPublicEventsContextText,
  filterPublicEvents,
  formatPublicEventListingDateTime,
  formatPublicEventPriceLabel,
  getFeaturedPublicEvent,
  getPublicEventCategoryOptions,
  getPublicEventSummary,
} from "@/lib/domain/public-events";
import { buildHubRuntimeHref } from "@/lib/domain/hub-runtime-paths";
import { getFallbackRegionalMarket } from "@/lib/domain/regional-markets";
import styles from "./EventsListingSection.module.css";

const fallbackRegionalMarket = getFallbackRegionalMarket();

function EventMedia({ event, featured = false }) {
  const hasMedia = Boolean(event.imageAsset?.publicUrl);

  if (hasMedia) {
    return (
      <SectionCardMedia
        bleed="flush"
        className={[styles.mediaWrap, featured ? styles.mediaWrapFeatured : ""].filter(Boolean).join(" ")}
      >
        <Image
          src={event.imageAsset.publicUrl}
          alt={event.imageAlt || event.imageAsset.alt || event.title}
          fill
          sizes={featured ? "(max-width: 48rem) 100vw, 18rem" : "(max-width: 48rem) 100vw, 24rem"}
          className={styles.media}
        />
      </SectionCardMedia>
    );
  }

  return (
    <SectionCardMedia
      bleed="flush"
      className={[styles.mediaWrap, styles.mediaPlaceholder, featured ? styles.mediaWrapFeatured : ""].filter(Boolean).join(" ")}
    >
      <span className={styles.mediaPlaceholderText}>{event.category || "Event"}</span>
    </SectionCardMedia>
  );
}

function EventMetaRow({ icon, value }) {
  return (
    <div className={styles.metaRow}>
      <Icon name={icon} size="sm" tone="muted" decorative />
      <span>{value}</span>
    </div>
  );
}

function EventCard({ event, hubSlug, routeMode = "path", locale, featured = false, variant = "default" }) {
  const description = getPublicEventSummary(event);
  const listingDateTime = event.displayDateLabel || formatPublicEventListingDateTime(event, locale);
  const isRecurringSeries = event.eventKind === "public_recurring_series";
  const cardClassName = [
    styles.card,
    featured ? styles.cardFeatured : styles.cardDefault,
    variant === "editorial" ? styles.cardEditorial : "",
    variant === "studio" ? styles.cardStudio : "",
  ].filter(Boolean).join(" ");

  return (
    <SectionCard
      as={Link}
      href={buildHubRuntimeHref(hubSlug, `/events/${event.slug}`, routeMode)}
      prefetch={false}
      padding="none"
      className={cardClassName}
    >
      <EventMedia event={event} featured={featured} />

      <SectionCardBody className={styles.cardCopy}>
        <div className={styles.titleBlock}>
          {featured ? (
            <span className={styles.nextBadge}>
              {variant === "editorial" ? "Featured event" : variant === "studio" ? "Highlight" : "Next event"}
            </span>
          ) : null}
          {isRecurringSeries && !featured ? <span className={styles.nextBadge}>Recurring event</span> : null}
          {variant !== "default" ? <p className={styles.kicker}>{listingDateTime}</p> : null}
          <h3 className={styles.cardTitle}>{event.title}</h3>
        </div>

        {description ? <p className={styles.cardDescription}>{description}</p> : null}

        <div className={styles.metaList}>
          <EventMetaRow
            icon="event"
            value={listingDateTime}
          />
          <EventMetaRow
            icon="location_on"
            value={event.location || "Location to be confirmed"}
          />
          <EventMetaRow
            icon={event.pricingMode === "paid" ? "payments" : "sell"}
            value={formatPublicEventPriceLabel(event, locale)}
          />
        </div>
      </SectionCardBody>
    </SectionCard>
  );
}

function EmptyStateCard({ title, description }) {
  return (
    <SectionCard as="div" className={styles.emptyState}>
      <h2 className={styles.emptyTitle}>{title}</h2>
      <p className={styles.emptyDescription}>{description}</p>
    </SectionCard>
  );
}

export default function EventsListingSection({
  id,
  hubSlug,
  routeMode = "path",
  locale = fallbackRegionalMarket.defaultLocale,
  events = [],
  variant = "default",
  containerWidth = "default",
  className = "",
}) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(ALL_EVENTS_FILTER);

  const resolvedVariant = ["editorial", "studio"].includes(variant) ? variant : "default";
  const filterOptions = useMemo(() => getPublicEventCategoryOptions(events), [events]);
  const visibleEvents = useMemo(
    () => filterPublicEvents(events, { query, category: activeCategory }),
    [activeCategory, events, query]
  );
  const featuredEvent = useMemo(() => getFeaturedPublicEvent(visibleEvents), [visibleEvents]);
  const gridEvents = featuredEvent
    ? visibleEvents.filter((event) => event.id !== featuredEvent.id)
    : visibleEvents;
  const activeCategoryLabel =
    filterOptions.find((option) => option.value === activeCategory)?.label || "All";
  const contextText = buildPublicEventsContextText({
    totalCount: events.length,
    resultCount: visibleEvents.length,
    activeCategoryLabel,
    query,
  });

  if (!events.length) {
    return (
      <SectionShell id={id} spacing="spacious" surface="transparent" className={className}>
        <SectionContainer width={containerWidth}>
          <EmptyStateCard
            title="There are currently no planned events."
            description="Check back soon for upcoming community sessions, workshops, and gatherings."
          />
        </SectionContainer>
      </SectionShell>
    );
  }

  return (
    <SectionShell id={id} spacing="spacious" surface="transparent" className={className}>
      <SectionContainer width={containerWidth}>
        <div className={styles.inner} data-variant={resolvedVariant}>
          <SectionSearchFilters
            searchName="events-search"
            searchValue={query}
            onSearchChange={setQuery}
            searchPlaceholder="Search events"
            searchLabel="Search events"
            filterOptions={filterOptions}
            activeFilter={activeCategory}
            onFilterChange={setActiveCategory}
            filterTriggerLabel="Filter events by category"
            filterMenuLabel="Event category filters"
            contextText={contextText}
          />

          {visibleEvents.length ? (
            <>
              {resolvedVariant === "editorial" && featuredEvent ? (
                <div className={styles.editorialLayout}>
                  <EventCard event={featuredEvent} hubSlug={hubSlug} routeMode={routeMode} locale={locale} featured variant="editorial" />
                  {gridEvents.length ? (
                    <div className={styles.editorialRail}>
                      {gridEvents.map((event) => (
                        <EventCard key={event.id} event={event} hubSlug={hubSlug} routeMode={routeMode} locale={locale} variant="editorial" />
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : resolvedVariant === "studio" && featuredEvent ? (
                <div className={styles.studioLayout}>
                  <EventCard event={featuredEvent} hubSlug={hubSlug} routeMode={routeMode} locale={locale} featured variant="studio" />
                  {gridEvents.length ? (
                    <SectionItemsGrid maxColumns={2} singleItemLayout="compact" className={styles.studioGrid}>
                      {gridEvents.map((event) => (
                        <EventCard key={event.id} event={event} hubSlug={hubSlug} routeMode={routeMode} locale={locale} variant="studio" />
                      ))}
                    </SectionItemsGrid>
                  ) : null}
                </div>
              ) : featuredEvent ? (
                <div className={styles.featuredLayout}>
                  <EventCard event={featuredEvent} hubSlug={hubSlug} routeMode={routeMode} locale={locale} featured />
                  {gridEvents.length ? (
                    <SectionItemsGrid maxColumns={3} singleItemLayout="compact" className={styles.grid}>
                      {gridEvents.map((event) => (
                        <EventCard key={event.id} event={event} hubSlug={hubSlug} routeMode={routeMode} locale={locale} />
                      ))}
                    </SectionItemsGrid>
                  ) : null}
                </div>
              ) : (
                <SectionItemsGrid
                  maxColumns={resolvedVariant === "studio" ? 2 : 3}
                  singleItemLayout="compact"
                  className={resolvedVariant === "studio" ? styles.studioGrid : styles.grid}
                >
                  {visibleEvents.map((event) => (
                    <EventCard key={event.id} event={event} hubSlug={hubSlug} routeMode={routeMode} locale={locale} variant={resolvedVariant} />
                  ))}
                </SectionItemsGrid>
              )}
            </>
          ) : (
            <EmptyStateCard
              title="No events match your current search or filter."
              description="Try another category or search term to explore more upcoming events."
            />
          )}
        </div>
      </SectionContainer>
    </SectionShell>
  );
}
