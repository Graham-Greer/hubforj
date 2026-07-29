import CTASection from "@/components/sections/cta-section/CTASection";
import GridSection from "@/components/sections/grid-section/GridSection";
import HeroSection from "@/components/sections/hero-section/HeroSection";
import InfoSection from "@/components/sections/info-section/InfoSection";
import TestimonialsSection from "@/components/sections/testimonials-section/TestimonialsSection";
import { hasSectionRichTextContent } from "@/lib/domain/section-rich-text";
import { getTemplateContentWidth, getTemplateLandingPageConfig } from "@/lib/templates/template-registry";
import styles from "./PublicLandingPage.module.css";

const defaultInfoBody = [
  {
    type: "paragraph",
    children: [
      { text: "Use this section to explain what your community is about, who it is for, and what new visitors should expect when they get involved." },
    ],
  },
  {
    type: "unordered-list",
    items: [
      { children: [{ text: "Describe the main activities, gatherings, or services you provide." }] },
      { children: [{ text: "Reassure visitors about the atmosphere, values, or experience they can expect." }] },
      { children: [{ text: "Guide people toward the next step, such as joining, exploring events, or getting in touch." }] },
    ],
  },
];

function createInfoPlaceholderMedia(hubName) {
  return {
    type: "image",
    src: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="%23f0ece5"/><stop offset="100%" stop-color="%23d9dfeb"/></linearGradient><linearGradient id="card" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="%23ffffff" stop-opacity="0.92"/><stop offset="100%" stop-color="%23ffffff" stop-opacity="0.72"/></linearGradient></defs><rect width="1200" height="900" fill="url(%23g)"/><circle cx="935" cy="180" r="150" fill="%23ffffff" fill-opacity="0.3"/><circle cx="215" cy="760" r="190" fill="%23ffffff" fill-opacity="0.18"/><rect x="120" y="165" width="960" height="570" rx="40" fill="url(%23card)"/><rect x="200" y="245" width="430" height="24" rx="12" fill="%2317202a" fill-opacity="0.14"/><rect x="200" y="295" width="510" height="64" rx="20" fill="%2317202a" fill-opacity="0.08"/><rect x="200" y="390" width="460" height="18" rx="9" fill="%2317202a" fill-opacity="0.12"/><rect x="200" y="428" width="400" height="18" rx="9" fill="%2317202a" fill-opacity="0.12"/><rect x="200" y="466" width="350" height="18" rx="9" fill="%2317202a" fill-opacity="0.12"/><rect x="200" y="540" width="180" height="52" rx="26" fill="%2317202a" fill-opacity="0.1"/><rect x="735" y="245" width="210" height="300" rx="32" fill="%23ffffff" fill-opacity="0.88"/><circle cx="840" cy="360" r="68" fill="%23d9dfeb"/><path d="M780 482c21-33 55-50 101-50 46 0 80 17 101 50" fill="none" stroke="%2317202a" stroke-opacity="0.12" stroke-width="26" stroke-linecap="round"/><rect x="730" y="586" width="220" height="22" rx="11" fill="%2317202a" fill-opacity="0.1"/></svg>`,
    alt: hubName ? `${hubName} placeholder media` : "Placeholder media",
  };
}

export default function PublicLandingPage({ hub, siteSettings, testimonials, whatWeDoItems = [] }) {
  const sectionTemplate = getTemplateLandingPageConfig(hub.template);
  const contentWidth = getTemplateContentWidth(hub.template);
  const heroSettings = siteSettings.homePage?.hero || {};
  const infoSettings = siteSettings.homePage?.info || {};
  const whatWeDoSettings = siteSettings.homePage?.whatWeDo || {};
  const testimonialsSettings = siteSettings.homePage?.testimonials || {};
  const ctaSettings = siteSettings.homePage?.cta || {};
  const heroMediaAsset = heroSettings.mediaAsset || null;
  const hasHeroConfig = Boolean(
    heroMediaAsset ||
    heroSettings.eyebrow ||
    heroSettings.title ||
    heroSettings.description ||
    heroSettings.actions?.length
  );
  const heroMedia = heroMediaAsset
    ? {
        type: heroMediaAsset.type === "video" ? "video" : "image",
        src: heroMediaAsset.publicUrl,
        alt: heroSettings.mediaAlt || heroMediaAsset.alt || heroMediaAsset.displayName || heroMediaAsset.filename || "",
        autoplay: heroMediaAsset.type === "video",
        muted: heroMediaAsset.type === "video",
        loop: heroMediaAsset.type === "video",
        playsInline: heroMediaAsset.type === "video",
        controls: false,
      }
    : null;
  const heroTitle = heroSettings.title || siteSettings.siteName || hub.name;
  const heroDescription =
    !hasHeroConfig
      ? siteSettings.tagline || "A calm, trustworthy public surface for discovering events, courses, and community participation."
      : heroSettings.description || "";
  const heroActions = (!hasHeroConfig ? [
    { label: "Join the hub", href: `/${hub.slug}/join`, variant: "secondary" },
    { label: "Member sign in", href: `/${hub.slug}/sign-in`, variant: "primary" },
  ] : heroSettings.actions || []).map((action, index) => ({
    ...action,
    variant: action.variant || (index === 0 ? "secondary" : "primary"),
  }));
  const heroEyebrow = hasHeroConfig ? heroSettings.eyebrow || "" : "";
  const hasCtaConfig = Boolean(
    ctaSettings.eyebrow ||
    ctaSettings.title ||
    ctaSettings.description ||
    ctaSettings.actions?.length
  );
  const resolvedCtaActions = (!hasCtaConfig ? [
    { label: "Join the hub", href: `/${hub.slug}/join`, variant: "primary" },
    { label: "Member sign in", href: `/${hub.slug}/sign-in`, variant: "secondary" },
  ] : ctaSettings.actions || []).map((action, index) => ({
    ...action,
    variant: action.variant || (index === 0 ? "primary" : "secondary"),
  }));
  const infoMediaAsset = infoSettings.mediaAsset || null;
  const infoMedia = infoMediaAsset
    ? {
        type: infoMediaAsset.type === "video" ? "video" : "image",
        src: infoMediaAsset.publicUrl,
        alt: infoSettings.mediaAlt || infoMediaAsset.alt || infoMediaAsset.displayName || infoMediaAsset.filename || "",
        autoplay: infoMediaAsset.type === "video",
        muted: infoMediaAsset.type === "video",
        loop: infoMediaAsset.type === "video",
        playsInline: infoMediaAsset.type === "video",
        controls: false,
      }
    : createInfoPlaceholderMedia(siteSettings.siteName || hub.name);
  const infoAction = infoSettings.action
    ? {
        ...infoSettings.action,
        variant: "primary",
      }
    : null;
  const hasInfoConfig = Boolean(
    infoSettings.mediaAsset ||
    infoSettings.mediaAssetId ||
    infoSettings.eyebrow ||
    infoSettings.title ||
    infoSettings.description ||
    hasSectionRichTextContent(infoSettings.body) ||
    infoSettings.action
  );
  const infoEyebrow = hasInfoConfig ? infoSettings.eyebrow || "" : "";
  const infoTitle = hasInfoConfig ? infoSettings.title || "Tell visitors what your community is about" : "Tell visitors what your community is about";
  const infoDescription = hasInfoConfig
    ? infoSettings.description || ""
    : "Use this section to explain who you are, what you offer, and why somebody should feel confident taking the next step.";
  const infoBody = hasSectionRichTextContent(infoSettings.body) ? infoSettings.body : defaultInfoBody;
  const shouldRenderInfoSection =
    Boolean(infoMedia?.src);
  const hasWhatWeDoConfig = Boolean(
    whatWeDoSettings.eyebrow ||
    whatWeDoSettings.title ||
    whatWeDoSettings.description
  );
  const whatWeDoEyebrow = hasWhatWeDoConfig ? whatWeDoSettings.eyebrow || "" : "What we do";
  const whatWeDoTitle = hasWhatWeDoConfig
    ? whatWeDoSettings.title || "What you can expect from this community"
    : "What you can expect from this community";
  const whatWeDoDescription = hasWhatWeDoConfig
    ? whatWeDoSettings.description || ""
    : "Use this section to highlight the kinds of experiences, support, or activities that help visitors understand what the community offers.";
  const shouldRenderWhatWeDoSection = Array.isArray(whatWeDoItems) && whatWeDoItems.length > 0;
  const hasTestimonialsConfig = Boolean(
    testimonialsSettings.eyebrow ||
    testimonialsSettings.title ||
    testimonialsSettings.description
  );
  const testimonialsEyebrow = hasTestimonialsConfig ? testimonialsSettings.eyebrow || "" : "Testimonials";
  const testimonialsTitle = hasTestimonialsConfig
    ? testimonialsSettings.title || "Hear from people in the community"
    : "Hear from people in the community";
  const testimonialsDescription = hasTestimonialsConfig
    ? testimonialsSettings.description || ""
    : "Published testimonials help new visitors understand the experience of the community and feel more confident about joining.";
  const shouldRenderTestimonialsSection = Array.isArray(testimonials) && testimonials.length > 0;
  return (
    <main className={styles.root}>
      <HeroSection
        eyebrow={heroEyebrow}
        title={heroTitle}
        description={heroDescription}
        actions={heroActions}
        media={heroMedia}
        variant={sectionTemplate.hero.variant}
        height={sectionTemplate.hero.height}
        containerWidth={sectionTemplate.hero.containerWidth}
      />

      {shouldRenderInfoSection ? (
        <InfoSection
          eyebrow={infoEyebrow}
          title={infoTitle}
          description={infoDescription}
          body={infoBody}
          media={infoMedia}
          action={infoAction}
          mediaPosition={sectionTemplate.info.mediaPosition}
          variant={sectionTemplate.info.variant}
          containerWidth={contentWidth}
        />
      ) : null}

      {shouldRenderWhatWeDoSection ? (
        <GridSection
          eyebrow={whatWeDoEyebrow}
          title={whatWeDoTitle}
          description={whatWeDoDescription}
          items={whatWeDoItems}
          variant={sectionTemplate.whatWeDo.variant}
          containerWidth={contentWidth}
        />
      ) : null}

      {shouldRenderTestimonialsSection ? (
        <TestimonialsSection
          eyebrow={testimonialsEyebrow}
          title={testimonialsTitle}
          description={testimonialsDescription}
          testimonials={testimonials}
          variant={sectionTemplate.testimonials.variant}
          containerWidth={contentWidth}
        />
      ) : null}

      <CTASection
        eyebrow={hasCtaConfig ? ctaSettings.eyebrow || "" : ""}
        title={hasCtaConfig ? ctaSettings.title || "Join our community today" : "Join our community today"}
        description={
          hasCtaConfig
            ? ctaSettings.description || ""
            : "Take the next step, become part of the community, and stay connected with upcoming events, courses, and announcements."
        }
        actions={resolvedCtaActions}
        variant={sectionTemplate.cta.variant}
        surface={sectionTemplate.cta.surface}
        containerWidth={contentWidth}
      />
    </main>
  );
}
