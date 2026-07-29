import { notFound } from "next/navigation";
import EventDetailsSection from "@/components/sections/event-details-section/EventDetailsSection";
import EventSeriesSelectionSection from "@/components/sections/event-series-selection-section/EventSeriesSelectionSection";
import { bookPublicEventAction, bookPublicEventWithAttendeesAction } from "./actions";
import { getPublicEventDetailData } from "@/lib/data/public-site";
import { getTemplateContentWidth, getTemplateEventDetailPageConfig } from "@/lib/templates/template-registry";

export default async function EventDetailPage({ params }) {
  const { hubSlug, eventSlug } = await params;
  const {
    hub,
    event,
    series,
    occurrences,
    registeredCount,
    currentMemberSession,
    currentBooking,
    detailAccessMode,
  } = await getPublicEventDetailData(hubSlug, eventSlug);

  if (!event && !series) {
    notFound();
  }

  const pageTemplate = getTemplateEventDetailPageConfig(hub.template);
  const contentWidth = getTemplateContentWidth(hub.template);

  if (series) {
    return (
      <EventSeriesSelectionSection
        hubSlug={hub.slug}
        locale={hub.locale}
        series={series}
        occurrences={occurrences}
        variant={pageTemplate.detail.variant}
        containerWidth={contentWidth}
      />
    );
  }

  return (
    <EventDetailsSection
      hubSlug={hub.slug}
      routeMode={hub.routeMode}
      locale={hub.locale}
      event={event}
      registeredCount={registeredCount}
      currentMemberSession={currentMemberSession}
      currentBooking={currentBooking}
      detailAccessMode={detailAccessMode}
      bookingAction={bookPublicEventAction}
      bookingFormAction={bookPublicEventWithAttendeesAction}
      variant={pageTemplate.detail.variant}
      containerWidth={contentWidth}
    />
  );
}
