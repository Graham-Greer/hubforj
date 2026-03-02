import HeroSection from "@/components/sections/hero/HeroSection";
import RichTextSection from "@/components/sections/rich-text/RichTextSection";
import CTASection from "@/components/sections/cta/CTASection";
import FeatureGridSection from "@/components/sections/feature-grid/FeatureGridSection";
import FAQSection from "@/components/sections/faq/FAQSection";
import EventListSection from "@/components/sections/event-list/EventListSection";
import ContactSection from "@/components/sections/contact/ContactSection";
import LogoMarqueeSection from "@/components/sections/logo-marquee/LogoMarqueeSection";
import PricingSection from "@/components/sections/pricing/PricingSection";
import StatsSection from "@/components/sections/stats/StatsSection";
import TeamSection from "@/components/sections/team/TeamSection";
import TestimonialsSection from "@/components/sections/testimonials/TestimonialsSection";
import LegalDocumentSection from "@/components/sections/legal/LegalDocumentSection";
import SectionRenderFallback from "@/components/sections/fallback/SectionRenderFallback";

const SECTION_MAP = {
  HeroSection,
  RichTextSection,
  CTASection,
  FeatureGridSection,
  FAQSection,
  EventListSection,
  ContactSection,
  LogoMarqueeSection,
  PricingSection,
  StatsSection,
  TeamSection,
  TestimonialsSection,
  LegalDocumentSection,
};

export default function PageCompositionRenderer({ composition = [], media = [], events = [] }) {
  const mediaById = new Map((media || []).map((item) => [item.id, item]));

  return (
    <>
      {(composition || []).map((block, index) => {
        const Component = SECTION_MAP[block?.type];
        if (!Component) {
          return <SectionRenderFallback key={block?.id || `blk-${index}`} type={block?.type} />;
        }

        return (
          <Component
            key={block?.id || `blk-${index}`}
            variant={block?.variant}
            mediaById={mediaById}
            events={events}
            {...(block?.props || {})}
          />
        );
      })}
    </>
  );
}
