import SectionContainer from "@/components/sections/section-container/SectionContainer";
import SectionShell from "@/components/sections/section-shell/SectionShell";
import SectionHeader from "@/components/sections/primitives/section-header/SectionHeader";
import SectionCard from "@/components/sections/primitives/section-card/SectionCard";
import SectionItemsGrid from "@/components/sections/primitives/section-items-grid/SectionItemsGrid";
import styles from "./GridSection.module.css";

function GridSectionCard({ item, index, variant }) {
  return (
    <SectionCard
      className={[
        styles.card,
        variant === "step" ? styles.cardStep : "",
        variant === "showcase" ? styles.cardShowcase : styles.cardDefault,
      ].filter(Boolean).join(" ")}
    >
      {variant === "step" ? (
        <div className={styles.stepMarker} aria-hidden="true">
          {String(index + 1).padStart(2, "0")}
        </div>
      ) : variant === "showcase" ? (
        <div className={styles.showcaseMarker} aria-hidden="true">
          <span className={styles.showcaseMarkerInner}>{String(index + 1).padStart(2, "0")}</span>
        </div>
      ) : (
        <div className={styles.defaultMarker} aria-hidden="true" />
      )}
      <div className={styles.cardCopy}>
        <h3 className={styles.cardTitle}>{item.title}</h3>
        <p className={styles.cardDescription}>{item.description}</p>
      </div>
    </SectionCard>
  );
}

export default function GridSection({
  id,
  eyebrow,
  title,
  description,
  items = [],
  variant = "default",
  containerWidth = "default",
  headingLevel = 2,
  className = "",
}) {
  const visibleItems = Array.isArray(items)
    ? items.filter((item) => item?.title && item?.description).slice(0, 6)
    : [];

  if (!visibleItems.length) {
    return null;
  }

  const resolvedVariant = ["step", "showcase"].includes(variant) ? variant : "default";

  return (
    <SectionShell
      id={id}
      spacing="spacious"
      surface="transparent"
      className={[
        styles.root,
        resolvedVariant === "step" ? styles.variantStep : "",
        resolvedVariant === "showcase" ? styles.variantShowcase : styles.variantDefault,
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
          <SectionItemsGrid maxColumns={3} singleItemLayout="compact" className={styles.grid}>
            {visibleItems.map((item, index) => (
              <GridSectionCard key={item.id || `${item.title}-${index}`} item={item} index={index} variant={resolvedVariant} />
            ))}
          </SectionItemsGrid>
        </div>
      </SectionContainer>
    </SectionShell>
  );
}
