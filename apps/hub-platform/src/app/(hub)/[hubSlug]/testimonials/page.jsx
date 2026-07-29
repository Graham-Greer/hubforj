import CTASection from "@/components/sections/cta-section/CTASection";
import HeroSection from "@/components/sections/hero-section/HeroSection";
import TestimonialsSection from "@/components/sections/testimonials-section/TestimonialsSection";
import { getPublicTestimonialsData } from "@/lib/data/public-site";
import { getDefaultTestimonialsPageHero } from "@/lib/domain/public-testimonials";
import {
  getTemplateLandingPageConfig,
  getTemplateContentWidth,
  getTemplateTestimonialsPageConfig,
} from "@/lib/templates/template-registry";

export default async function TestimonialsPage({ params }) {
  const { hubSlug } = await params;
  const { hub, siteSettings, testimonials } = await getPublicTestimonialsData(hubSlug);
  const pageTemplate = getTemplateTestimonialsPageConfig(hub.template);
  const landingPageTemplate = getTemplateLandingPageConfig(hub.template);
  const contentWidth = getTemplateContentWidth(hub.template);
  const siteName = siteSettings.siteName || hub.name;
  const defaultHero = getDefaultTestimonialsPageHero(siteName);
  const ctaSettings = siteSettings.pages?.testimonials?.cta || {};
  const testimonialsSettings = siteSettings.homePage?.testimonials || {};
  const hasTestimonialsConfig = Boolean(
    testimonialsSettings.eyebrow ||
    testimonialsSettings.title ||
    testimonialsSettings.description
  );
  const hasCtaConfig = Boolean(
    ctaSettings.eyebrow ||
    ctaSettings.title ||
    ctaSettings.description ||
    ctaSettings.actions?.length
  );
  const hero = {
    mediaAsset: siteSettings.pages?.testimonials?.hero?.mediaAsset || null,
    mediaAlt: siteSettings.pages?.testimonials?.hero?.mediaAlt || "",
    eyebrow: siteSettings.pages?.testimonials?.hero?.eyebrow || defaultHero.eyebrow,
    title: siteSettings.pages?.testimonials?.hero?.title || defaultHero.title,
    description: siteSettings.pages?.testimonials?.hero?.description || defaultHero.description,
  };
  const testimonialsEyebrow = hasTestimonialsConfig ? testimonialsSettings.eyebrow || "" : "Testimonials";
  const testimonialsTitle = hasTestimonialsConfig
    ? testimonialsSettings.title || "Hear from people in the community"
    : "Hear from people in the community";
  const testimonialsDescription = hasTestimonialsConfig
    ? testimonialsSettings.description || ""
    : "Published testimonials help visitors understand the experience of the community and feel more confident about joining.";
  const resolvedCtaActions = (!hasCtaConfig
    ? [
        { label: "Join the hub", href: `/${hub.slug}/join`, variant: "primary" },
        { label: "Member sign in", href: `/${hub.slug}/sign-in`, variant: "secondary" },
      ]
    : ctaSettings.actions || []
  ).map((action, index) => ({
    ...action,
    variant: action.variant || (index === 0 ? "primary" : "secondary"),
  }));

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
      <TestimonialsSection
        eyebrow={testimonialsEyebrow}
        title={testimonialsTitle}
        description={testimonialsDescription}
        testimonials={testimonials}
        variant={pageTemplate.listing.variant}
        maxItems={null}
        containerWidth={contentWidth}
      />
      <CTASection
        eyebrow={hasCtaConfig ? ctaSettings.eyebrow || "" : ""}
        title={
          hasCtaConfig
            ? ctaSettings.title || "Ready to join the community?"
            : "Ready to join the community?"
        }
        description={
          hasCtaConfig
            ? ctaSettings.description || ""
            : "Take the next step, explore upcoming events and courses, or become a member today."
        }
        actions={resolvedCtaActions}
        variant={landingPageTemplate.cta.variant}
        surface={landingPageTemplate.cta.surface}
        containerWidth={contentWidth}
      />
    </>
  );
}
