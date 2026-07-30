import Image from "next/image";
import SectionCard from "@/components/sections/primitives/section-card/SectionCard";
import SectionCardBody from "@/components/sections/primitives/section-card-body/SectionCardBody";
import SectionCardMedia from "@/components/sections/primitives/section-card-media/SectionCardMedia";
import SectionContainer from "@/components/sections/section-container/SectionContainer";
import SectionItemsGrid from "@/components/sections/primitives/section-items-grid/SectionItemsGrid";
import SectionShell from "@/components/sections/section-shell/SectionShell";
import PublicBreadcrumbs from "@/components/patterns/public-breadcrumbs/PublicBreadcrumbs";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Icon from "@/components/ui/icon/Icon";
import { formatPublicEventListingDateTime } from "@/lib/domain/public-events";
import { getFallbackRegionalMarket } from "@/lib/domain/regional-markets";
import styles from "./EventSeriesSelectionSection.module.css";

const fallbackRegionalMarket = getFallbackRegionalMarket();

function normalizeString(value) {
  return String(value || "").trim();
}

function SeriesSummaryCard({ series, summary, occurrenceCount }) {
  const hasMedia = Boolean(series?.imageAsset?.publicUrl);

  return (
    <SectionCard as="div" padding="none" className={styles.summaryCard}>
      <div className={styles.summaryCardLayout}>
        {hasMedia ? (
          <SectionCardMedia bleed="flush" className={styles.summaryMedia}>
            <Image
              src={series.imageAsset.publicUrl}
              alt={series.imageAlt || series.imageAsset.alt || series.title}
              fill
              sizes="(max-width: 48rem) 100vw, 12rem"
              className={styles.summaryMediaImage}
            />
          </SectionCardMedia>
        ) : (
          <SectionCardMedia bleed="flush" className={[styles.summaryMedia, styles.summaryMediaPlaceholder].join(" ")}>
            <span className={styles.summaryMediaPlaceholderText}>{series.category || "Event"}</span>
          </SectionCardMedia>
        )}

        <SectionCardBody padding="compact" className={styles.summaryCardBody}>
          <div className={styles.badgeRow}>
            <Badge tone="neutral">Recurring event</Badge>
            <Badge tone="info">{occurrenceCount} {occurrenceCount === 1 ? "occurrence" : "occurrences"}</Badge>
          </div>
          <h1 className={styles.title}>{series.title}</h1>
          {summary ? <p className={styles.summary}>{summary}</p> : null}
        </SectionCardBody>
      </div>
    </SectionCard>
  );
}

function OccurrenceCard({ hubSlug, locale, occurrence }) {
  const hasCurrentBooking = Boolean(occurrence?.currentBooking);
  const actionHref = hasCurrentBooking
    ? `/${hubSlug}/events/${occurrence.slug}/booking/next-steps`
    : `/${hubSlug}/events/${occurrence.slug}`;
  const actionLabel = hasCurrentBooking ? "Manage booking" : "View";

  return (
    <SectionCard as="div" padding="none" className={styles.card}>
      <SectionCardBody padding="compact" className={styles.cardBody}>
        <div className={styles.occurrenceRow}>
          <h2 className={styles.cardTitle}>{formatPublicEventListingDateTime(occurrence, locale)}</h2>
          <Button href={actionHref} variant="ghost" className={styles.viewAction}>
            <Icon name="visibility" size="sm" />
            <span>{actionLabel}</span>
          </Button>
        </div>
      </SectionCardBody>
    </SectionCard>
  );
}

export default function EventSeriesSelectionSection({
  hubSlug,
  locale = fallbackRegionalMarket.defaultLocale,
  series,
  occurrences = [],
  variant = "default",
  containerWidth = "default",
  className = "",
}) {
  const summary = normalizeString(series?.summary);
  const resolvedVariant = ["editorial", "studio"].includes(variant) ? variant : "default";
  const breadcrumbItems = [
    { label: "Events", href: `/${hubSlug}/events` },
    { label: series.title },
  ];

  return (
    <SectionShell spacing="compact" surface="transparent" className={className}>
      <SectionContainer width={containerWidth}>
        <div
          className={[
            styles.root,
            resolvedVariant === "editorial" ? styles.variantEditorial : "",
            resolvedVariant === "studio" ? styles.variantStudio : "",
          ].filter(Boolean).join(" ")}
          data-variant={resolvedVariant}
        >
          <div className={styles.header}>
            <PublicBreadcrumbs items={breadcrumbItems} className={styles.breadcrumbs} />
            <div className={styles.headerCopy}>
              <SeriesSummaryCard series={series} summary={summary} occurrenceCount={occurrences.length} />
            </div>
          </div>

          <div className={styles.listingIntro}>
            <h2 className={styles.sectionTitle}>Choose an occurrence</h2>
            <p className={styles.sectionDescription}>
              Pick the date and time that works for you. Each occurrence keeps its own booking availability and details.
            </p>
          </div>

          {occurrences.length ? (
            <SectionItemsGrid
              maxColumns={resolvedVariant === "studio" ? 2 : 3}
              singleItemLayout="compact"
              className={styles.grid}
            >
              {occurrences.map((occurrence) => (
                <OccurrenceCard
                  key={occurrence.id}
                  hubSlug={hubSlug}
                  locale={locale}
                  occurrence={occurrence}
                />
              ))}
            </SectionItemsGrid>
          ) : (
            <SectionCard as="div" className={styles.emptyState}>
              <h2 className={styles.emptyTitle}>No upcoming occurrences are currently available</h2>
              <p className={styles.emptyDescription}>
                This recurring event exists, but there are no published upcoming occurrences available to book right now.
              </p>
            </SectionCard>
          )}
        </div>
      </SectionContainer>
    </SectionShell>
  );
}
