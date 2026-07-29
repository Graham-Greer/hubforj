import HeroSection from "@/components/sections/hero-section/HeroSection";
import EventsListingSection from "@/components/sections/events-listing-section/EventsListingSection";
import FAQSection from "@/components/sections/faq-section/FAQSection";
import { getPublicEventsData } from "@/lib/data/public-site";
import { buildPublicEventFaqItems } from "@/lib/domain/public-offering-faqs";
import { getDefaultEventsPageHero } from "@/lib/domain/public-events";
import { getTemplateContentWidth, getTemplateEventsPageConfig } from "@/lib/templates/template-registry";

export default async function EventsPage({ params }) {
  const { hubSlug } = await params;
  const { hub, siteSettings, events } = await getPublicEventsData(hubSlug);
  const pageTemplate = getTemplateEventsPageConfig(hub.template);
  const contentWidth = getTemplateContentWidth(hub.template);
  const siteName = siteSettings.siteName || hub.name;
  const defaultHero = getDefaultEventsPageHero(siteName);
  const faqItems = buildPublicEventFaqItems({ hub });
  const hero = {
    mediaAsset: siteSettings.pages?.events?.hero?.mediaAsset || null,
    mediaAlt: siteSettings.pages?.events?.hero?.mediaAlt || "",
    eyebrow: siteSettings.pages?.events?.hero?.eyebrow || defaultHero.eyebrow,
    title: siteSettings.pages?.events?.hero?.title || defaultHero.title,
    description: siteSettings.pages?.events?.hero?.description || defaultHero.description,
  };

  return (
    <>
      <HeroSection
        eyebrow={hero.eyebrow}
        title={hero.title}
        description={hero.description}
        media={hero.mediaAsset?.publicUrl ? {
          src: hero.mediaAsset.publicUrl,
          alt: hero.mediaAlt || hero.mediaAsset.alt || hero.title,
          decorative: false,
        } : null}
        variant={pageTemplate.hero.variant}
        height={pageTemplate.hero.height}
        containerWidth={pageTemplate.hero.containerWidth}
      />
      <EventsListingSection hubSlug={hub.slug} locale={hub.locale} events={events} variant={pageTemplate.listing.variant} containerWidth={contentWidth} />
      <FAQSection
        eyebrow="Booking FAQs"
        title="Frequently asked questions"
        description="Understand how event booking, waitlists, payment, and booking updates work before you continue."
        items={faqItems}
        containerWidth={contentWidth}
      />
    </>
  );
}
