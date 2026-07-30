import Image from "next/image";
import Icon from "@/components/ui/icon/Icon";
import SectionContainer from "@/components/sections/section-container/SectionContainer";
import SectionShell from "@/components/sections/section-shell/SectionShell";
import SectionHeader from "@/components/sections/primitives/section-header/SectionHeader";
import SectionCard from "@/components/sections/primitives/section-card/SectionCard";
import SectionItemsGrid from "@/components/sections/primitives/section-items-grid/SectionItemsGrid";
import styles from "./TestimonialsSection.module.css";

function formatAttribution(testimonial) {
  return [testimonial.authorRole, testimonial.authorOrganization].filter(Boolean).join(" • ");
}

function TestimonialAttribution({ testimonial }) {
  const meta = formatAttribution(testimonial);
  const hasImage = Boolean(testimonial.authorImageAsset?.publicUrl);

  return (
    <div className={styles.attribution}>
      {hasImage ? (
        <div className={styles.avatarWrap}>
          <Image
            src={testimonial.authorImageAsset.publicUrl}
            alt={testimonial.authorImageAlt || testimonial.authorImageAsset.alt || testimonial.authorName}
            className={styles.avatar}
            fill
            sizes="3.5rem"
          />
        </div>
      ) : null}
      <div className={styles.identity}>
        <p className={styles.authorName}>{testimonial.authorName}</p>
        {meta ? <p className={styles.authorMeta}>{meta}</p> : null}
      </div>
    </div>
  );
}

function TestimonialCardItem({ testimonial, spotlight = false }) {
  return (
    <SectionCard className={[styles.card, spotlight ? styles.cardSpotlight : ""].filter(Boolean).join(" ")}>
      <div className={[styles.quoteMark, spotlight ? styles.quoteMarkSpotlight : ""].filter(Boolean).join(" ")}>
        <Icon name="format_quote" size={spotlight ? "xl" : "lg"} tone="accent" decorative />
      </div>
      <blockquote className={[styles.quote, spotlight ? styles.quoteSpotlight : ""].filter(Boolean).join(" ")}>
        “{testimonial.quote}”
      </blockquote>
      <TestimonialAttribution testimonial={testimonial} />
    </SectionCard>
  );
}

export default function TestimonialsSection({
  id,
  eyebrow,
  title,
  description,
  testimonials = [],
  variant = "cards",
  maxItems = 3,
  containerWidth = "default",
  headingLevel = 2,
  className = "",
}) {
  const visibleTestimonials = Array.isArray(testimonials)
    ? (typeof maxItems === "number" ? testimonials.slice(0, maxItems) : testimonials)
    : [];

  if (!visibleTestimonials.length) {
    return null;
  }

  const resolvedVariant =
    variant === "spotlight-plus-rail" || variant === "showcase" ? variant : "cards";
  const [spotlight, ...railItems] = visibleTestimonials;

  return (
    <SectionShell
      id={id}
      spacing="spacious"
      surface="transparent"
      className={[
        styles.root,
        resolvedVariant === "spotlight-plus-rail" ? styles.variantSpotlight : "",
        resolvedVariant === "showcase" ? styles.variantShowcase : styles.variantCards,
        className,
      ].filter(Boolean).join(" ")}
    >
      <SectionContainer width={containerWidth}>
        <div className={styles.inner}>
          <SectionHeader
            eyebrow={eyebrow}
            title={title}
            description={description}
            align="start"
            width="default"
            headingLevel={headingLevel}
          />

          {resolvedVariant === "spotlight-plus-rail" ? (
            <div className={styles.spotlightLayout}>
              <TestimonialCardItem testimonial={spotlight} spotlight />
              <SectionItemsGrid maxColumns={2} className={styles.rail}>
                {railItems.map((testimonial) => (
                  <TestimonialCardItem key={testimonial.id} testimonial={testimonial} />
                ))}
              </SectionItemsGrid>
            </div>
          ) : resolvedVariant === "showcase" ? (
            <div className={styles.showcaseLayout}>
              {visibleTestimonials.map((testimonial, index) => (
                <TestimonialCardItem
                  key={testimonial.id}
                  testimonial={testimonial}
                  spotlight={index === 0}
                />
              ))}
            </div>
          ) : (
            <SectionItemsGrid maxColumns={3} className={styles.grid}>
              {visibleTestimonials.map((testimonial) => (
                <TestimonialCardItem key={testimonial.id} testimonial={testimonial} />
              ))}
            </SectionItemsGrid>
          )}
        </div>
      </SectionContainer>
    </SectionShell>
  );
}
