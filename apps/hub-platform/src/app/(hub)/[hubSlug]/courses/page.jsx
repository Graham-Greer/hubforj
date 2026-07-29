import HeroSection from "@/components/sections/hero-section/HeroSection";
import CoursesListingSection from "@/components/sections/courses-listing-section/CoursesListingSection";
import { getPublicCoursesData } from "@/lib/data/public-site";
import FAQSection from "@/components/sections/faq-section/FAQSection";
import { buildPublicCourseFaqItems } from "@/lib/domain/public-offering-faqs";
import { getDefaultCoursesPageHero } from "@/lib/domain/public-courses";
import { getTemplateContentWidth, getTemplateCoursesPageConfig } from "@/lib/templates/template-registry";

export default async function CoursesPage({ params }) {
  const { hubSlug } = await params;
  const { hub, siteSettings, courses } = await getPublicCoursesData(hubSlug);
  const pageTemplate = getTemplateCoursesPageConfig(hub.template);
  const contentWidth = getTemplateContentWidth(hub.template);
  const siteName = siteSettings.siteName || hub.name;
  const defaultHero = getDefaultCoursesPageHero(siteName);
  const faqItems = buildPublicCourseFaqItems({ hub });
  const hero = {
    mediaAsset: siteSettings.pages?.courses?.hero?.mediaAsset || null,
    mediaAlt: siteSettings.pages?.courses?.hero?.mediaAlt || "",
    eyebrow: siteSettings.pages?.courses?.hero?.eyebrow || defaultHero.eyebrow,
    title: siteSettings.pages?.courses?.hero?.title || defaultHero.title,
    description: siteSettings.pages?.courses?.hero?.description || defaultHero.description,
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
      <CoursesListingSection hubSlug={hub.slug} locale={hub.locale} courses={courses} variant={pageTemplate.listing.variant} containerWidth={contentWidth} />
      <FAQSection
        eyebrow="Course enrolment FAQs"
        title="Frequently asked questions"
        description="Understand how course enrolment, waitlists, payment, and enrolment updates work before you continue."
        items={faqItems}
        containerWidth={contentWidth}
      />
    </>
  );
}
