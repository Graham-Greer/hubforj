import HeroSection from "@/components/sections/hero/HeroSection";
import FeatureSection from "@/components/sections/feature/FeatureSection";
import GridSection from "@/components/sections/grid/GridSection";
import AccordionSection from "@/components/sections/accordion/AccordionSection";
import PricingSection from "@/components/sections/pricing/PricingSection";
import StatsSection from "@/components/sections/stats/StatsSection";
import TeamSection from "@/components/sections/team/TeamSection";
import TestimonialsSection from "@/components/sections/testimonials/TestimonialsSection";
import SectionRenderFallback from "@/components/sections/fallback/SectionRenderFallback";
import styles from "./PageCompositionRenderer.module.css";

const SECTION_MAP = {
  HeroSection,
  FeatureSection,
  GridSection,
  AccordionSection,
  PricingSection,
  StatsSection,
  TeamSection,
  TestimonialsSection,
};

export default function PageCompositionRenderer({ composition = [], media = [], events = [] }) {
  const mediaById = new Map((media || []).map((item) => [item.id, item]));

  return (
    <div className={styles.root}>
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
    </div>
  );
}
