import SectionContainer from "@/components/sections/section-container/SectionContainer";
import SectionShell from "@/components/sections/section-shell/SectionShell";
import SectionCard from "@/components/sections/primitives/section-card/SectionCard";
import SectionItemsGrid from "@/components/sections/primitives/section-items-grid/SectionItemsGrid";
import styles from "./PublicTestimonialFallbacks.module.css";

function SkeletonBlock({ className = "" }) {
  return <span className={[styles.block, className].filter(Boolean).join(" ")} aria-hidden="true" />;
}

function SectionHeadingFallback() {
  return (
    <div className={styles.heading}>
      <SkeletonBlock className={styles.eyebrow} />
      <SkeletonBlock className={styles.headingTitle} />
      <SkeletonBlock className={styles.headingLine} />
      <SkeletonBlock className={styles.headingLineShort} />
    </div>
  );
}

function TestimonialCardFallback({ spotlight = false }) {
  return (
    <SectionCard className={[styles.card, spotlight ? styles.cardSpotlight : ""].filter(Boolean).join(" ")}>
      <SkeletonBlock className={styles.quoteMark} />
      <div className={styles.quoteStack}>
        <SkeletonBlock className={styles.quoteLine} />
        <SkeletonBlock className={styles.quoteLineWide} />
        <SkeletonBlock className={styles.quoteLineShort} />
      </div>
      <div className={styles.attribution}>
        <SkeletonBlock className={styles.avatar} />
        <div className={styles.identity}>
          <SkeletonBlock className={styles.author} />
          <SkeletonBlock className={styles.authorMeta} />
        </div>
      </div>
    </SectionCard>
  );
}

export function PublicTestimonialsSectionFallback({
  variant = "cards",
  containerWidth = "default",
}) {
  const resolvedVariant =
    variant === "spotlight-plus-rail" || variant === "showcase" ? variant : "cards";

  return (
    <SectionShell spacing="spacious" surface="transparent">
      <SectionContainer width={containerWidth}>
        <section
          className={[
            styles.root,
            resolvedVariant === "spotlight-plus-rail" ? styles.variantSpotlight : "",
            resolvedVariant === "showcase" ? styles.variantShowcase : styles.variantCards,
          ].filter(Boolean).join(" ")}
          aria-busy="true"
          aria-label="Loading testimonials"
        >
          <SectionHeadingFallback />
          {resolvedVariant === "spotlight-plus-rail" ? (
            <div className={styles.spotlightLayout}>
              <TestimonialCardFallback spotlight />
              <SectionItemsGrid maxColumns={2} className={styles.rail}>
                <TestimonialCardFallback />
                <TestimonialCardFallback />
              </SectionItemsGrid>
            </div>
          ) : resolvedVariant === "showcase" ? (
            <div className={styles.showcaseLayout}>
              <TestimonialCardFallback spotlight />
              <TestimonialCardFallback />
            </div>
          ) : (
            <SectionItemsGrid maxColumns={3} className={styles.grid}>
              <TestimonialCardFallback />
              <TestimonialCardFallback />
              <TestimonialCardFallback />
            </SectionItemsGrid>
          )}
        </section>
      </SectionContainer>
    </SectionShell>
  );
}
