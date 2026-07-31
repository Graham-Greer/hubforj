import SectionArticleLayout from "@/components/sections/primitives/section-article-layout/SectionArticleLayout";
import SectionCard from "@/components/sections/primitives/section-card/SectionCard";
import SectionContainer from "@/components/sections/section-container/SectionContainer";
import SectionMedia from "@/components/sections/primitives/section-media/SectionMedia";
import SectionRichText from "@/components/sections/primitives/section-rich-text/SectionRichText";
import SectionShell from "@/components/sections/section-shell/SectionShell";
import PublicBreadcrumbs from "@/components/patterns/public-breadcrumbs/PublicBreadcrumbs";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Icon from "@/components/ui/icon/Icon";
import { formatEventDateRange } from "@/lib/domain/events";
import { buildHubRuntimeHref } from "@/lib/domain/hub-runtime-paths";
import { getFallbackRegionalMarket } from "@/lib/domain/regional-markets";
import {
  buildPublicEventBookingCta,
  formatPublicEventPriceLabel,
  formatPublicEventSpacesLeft,
} from "@/lib/domain/public-events";
import EventBookingForm from "./EventBookingForm";
import styles from "./EventDetailsSection.module.css";

const fallbackRegionalMarket = getFallbackRegionalMarket();

function normalizeString(value) {
  return String(value || "").trim();
}

function EventMetaItem({ icon, value }) {
  return (
    <div className={styles.metaItem}>
      <Icon name={icon} size="sm" tone="muted" decorative />
      <span className={styles.metaValue}>{value}</span>
    </div>
  );
}

function BookingCard({
  hubSlug,
  routeMode = "path",
  locale,
  event,
  registeredCount,
  currentMemberSession,
  currentBooking,
  detailAccessMode,
  bookingAction,
  bookingFormAction,
}) {
  const cta = buildPublicEventBookingCta({
    event,
    hubSlug,
    routeMode,
    registeredCount,
    currentMemberSession,
    currentBooking,
    detailAccessMode,
  });
  const priceLabel = formatPublicEventPriceLabel(event, locale);
  const spacesLabel = formatPublicEventSpacesLeft(event, registeredCount);
  const requiresAttendeeForm = String(event?.registrationEligibility || "members-only") !== "members-only";

  return (
    <SectionCard className={styles.bookingCard}>
      <div className={styles.bookingHeader}>
        <h2 className={styles.bookingTitle}>{cta.heading}</h2>
        {cta.supportingText ? <p className={styles.bookingText}>{cta.supportingText}</p> : null}
      </div>

      <div
        className={[
          styles.bookingActionRow,
          requiresAttendeeForm ? styles.bookingActionRowStack : "",
        ].filter(Boolean).join(" ")}
      >
        <div className={styles.bookingSummary}>
          <div className={styles.bookingSummaryItem}>
            <span className={styles.bookingSummaryValue}>{priceLabel}</span>
          </div>
          <div className={styles.bookingSummaryItem}>
            <span className={styles.bookingSummaryValue}>{spacesLabel}</span>
          </div>
        </div>

        {cta.disabled ? (
          <Button type="button" size="lg" className={styles.bookingButton} disabled>
            {cta.buttonLabel}
          </Button>
        ) : cta.requiresForm ? (
          requiresAttendeeForm ? (
            <EventBookingForm
              action={bookingFormAction}
              hubSlug={hubSlug}
              event={event}
              buttonLabel={cta.buttonLabel}
              availabilityHint={spacesLabel}
              locale={locale}
            />
          ) : (
            <form action={bookingAction} className={styles.bookingForm}>
              <input type="hidden" name="hubSlug" value={hubSlug} />
              <input type="hidden" name="eventId" value={event.id} />
              <input type="hidden" name="eventSlug" value={event.slug} />
              <Button type="submit" size="lg" className={styles.bookingButton}>
                {cta.buttonLabel}
              </Button>
            </form>
          )
        ) : (
          <Button
            href={cta.href}
            prefetch={false}
            size="lg"
            className={styles.bookingButton}
            target={cta.external ? "_blank" : undefined}
            rel={cta.external ? "noreferrer" : undefined}
          >
            {cta.buttonLabel}
          </Button>
        )}
      </div>
    </SectionCard>
  );
}

function EventMediaLead({ event }) {
  if (event.imageAsset?.publicUrl) {
    return (
      <SectionMedia
        media={{
          src: event.imageAsset.publicUrl,
          type: "image",
        }}
        alt={event.imageAlt || event.imageAsset.alt || event.title}
        ratio="16:9"
        radius="xl"
        chrome="default"
        elevation="lg"
        priority
        sizes="(max-width: 72rem) 100vw, 72rem"
        className={styles.mediaLead}
      />
    );
  }

  return (
    <div className={[styles.mediaLead, styles.mediaLeadPlaceholder].join(" ")}>
      <span className={styles.mediaLeadPlaceholderText}>{event.category || "Event"}</span>
    </div>
  );
}

export default function EventDetailsSection({
  id,
  hubSlug,
  routeMode = "path",
  locale = fallbackRegionalMarket.defaultLocale,
  event,
  registeredCount = 0,
  currentMemberSession = null,
  currentBooking = null,
  detailAccessMode = "public",
  bookingAction,
  bookingFormAction,
  variant = "default",
  containerWidth = "default",
  className = "",
}) {
  const summary = normalizeString(event?.summary);
  const resolvedVariant = ["editorial", "studio"].includes(variant) ? variant : "default";
  const priceLabel = formatPublicEventPriceLabel(event, locale);
  const spacesLabel = formatPublicEventSpacesLeft(event, registeredCount);
  const isRecurringOccurrence = normalizeString(event?.eventKind) === "series_occurrence";
  const occurrenceDateLabel = normalizeString(event?.occurrenceDate) || normalizeString(event?.startDate) || event.title;
  const breadcrumbItems = isRecurringOccurrence && normalizeString(event?.seriesSlugBase)
    ? [
        { label: "Events", href: buildHubRuntimeHref(hubSlug, "/events", routeMode) },
        { label: event.title, href: buildHubRuntimeHref(hubSlug, `/events/${event.seriesSlugBase}`, routeMode) },
        { label: occurrenceDateLabel },
      ]
    : [
        { label: "Events", href: buildHubRuntimeHref(hubSlug, "/events", routeMode) },
        { label: event.title },
      ];

  return (
    <SectionShell
      id={id}
      spacing="compact"
      surface="transparent"
      className={className}
    >
      <SectionContainer width={containerWidth}>
        <div
          className={[
            styles.root,
            resolvedVariant === "editorial" ? styles.variantEditorial : "",
            resolvedVariant === "studio" ? styles.variantStudio : "",
          ].filter(Boolean).join(" ")}
          data-variant={resolvedVariant}
        >
          <PublicBreadcrumbs items={breadcrumbItems} className={styles.breadcrumbs} />
          <EventMediaLead event={event} />

          <SectionArticleLayout stickyAside className={styles.articleLayout}>
            <SectionArticleLayout.Main className={styles.main}>
              <div className={styles.headerBlock}>
                {isRecurringOccurrence || detailAccessMode === "history_member" ? (
                  <div className={styles.badgeRow}>
                    {isRecurringOccurrence ? <Badge tone="neutral">Recurring event</Badge> : null}
                    {detailAccessMode === "history_member" ? <Badge tone="info">Booking history access</Badge> : null}
                  </div>
                ) : null}
                {resolvedVariant !== "default" ? (
                  <div className={styles.kickerRow}>
                    {event.category ? <span className={styles.kicker}>{event.category}</span> : null}
                    <span className={styles.kickerSecondary}>{priceLabel}</span>
                    <span className={styles.kickerSecondary}>{spacesLabel}</span>
                  </div>
                ) : null}
                <h1 className={styles.title}>{event.title}</h1>
                {summary ? <p className={styles.summary}>{summary}</p> : null}
                {detailAccessMode === "history_member" ? (
                  <p className={styles.historyAccessNote}>
                    This event is no longer publicly listed, but you can still review this occurrence here because you
                    have booking history for it.
                  </p>
                ) : null}
              </div>

              <div className={styles.metaGroup}>
                <EventMetaItem
                  icon="location_on"
                  value={event.location || "Location to be confirmed"}
                />
                <EventMetaItem
                  icon="event"
                  value={formatEventDateRange(event, locale)}
                />
              </div>

              <SectionRichText content={event.description} className={styles.description} />
            </SectionArticleLayout.Main>

            <SectionArticleLayout.Aside>
              <BookingCard
                hubSlug={hubSlug}
                locale={locale}
                event={event}
                registeredCount={registeredCount}
                currentMemberSession={currentMemberSession}
                currentBooking={currentBooking}
                detailAccessMode={detailAccessMode}
                routeMode={routeMode}
                bookingAction={bookingAction}
                bookingFormAction={bookingFormAction}
              />
            </SectionArticleLayout.Aside>
          </SectionArticleLayout>
        </div>
      </SectionContainer>
    </SectionShell>
  );
}
