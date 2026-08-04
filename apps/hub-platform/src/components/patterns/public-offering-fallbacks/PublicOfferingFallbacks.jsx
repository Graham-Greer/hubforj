import SectionContainer from "@/components/sections/section-container/SectionContainer";
import SectionShell from "@/components/sections/section-shell/SectionShell";
import SectionCard from "@/components/sections/primitives/section-card/SectionCard";
import SectionCardBody from "@/components/sections/primitives/section-card-body/SectionCardBody";
import SectionItemsGrid from "@/components/sections/primitives/section-items-grid/SectionItemsGrid";
import styles from "./PublicOfferingFallbacks.module.css";

function SkeletonBlock({ className = "" }) {
  return <span className={[styles.block, className].filter(Boolean).join(" ")} />;
}

function ToolbarFallback({ kind = "events" }) {
  const filters = kind === "courses" ? 3 : 4;

  return (
    <div className={styles.toolbar}>
      <SkeletonBlock className={styles.search} />
      <div className={styles.filters}>
        {Array.from({ length: filters }).map((_, index) => (
          <SkeletonBlock key={index} className={styles.filter} />
        ))}
      </div>
      <SkeletonBlock className={styles.context} />
    </div>
  );
}

function CardFallback({ featured = false, variant = "default" }) {
  return (
    <SectionCard
      as="div"
      padding="none"
      className={[styles.card, featured ? styles.cardFeatured : "", styles[`variant_${variant}`] || ""]
        .filter(Boolean)
        .join(" ")}
    >
      <div className={[styles.media, featured ? styles.mediaFeatured : ""].filter(Boolean).join(" ")} />
      <SectionCardBody className={styles.copy}>
        <div className={styles.titleStack}>
          <SkeletonBlock className={styles.pill} />
          <SkeletonBlock className={styles.title} />
        </div>
        <div className={styles.descriptionStack}>
          <SkeletonBlock className={styles.lineWide} />
          <SkeletonBlock className={styles.lineMedium} />
        </div>
        <div className={styles.metaStack}>
          <SkeletonBlock className={styles.metaLine} />
          <SkeletonBlock className={styles.metaLine} />
          <SkeletonBlock className={styles.metaLineShort} />
        </div>
      </SectionCardBody>
    </SectionCard>
  );
}

export function PublicOfferingListingFallback({
  kind = "events",
  variant = "default",
  containerWidth = "default",
}) {
  const resolvedVariant = ["editorial", "studio"].includes(variant) ? variant : "default";
  const gridColumns = resolvedVariant === "studio" ? 2 : 3;

  return (
    <SectionShell spacing="spacious" surface="transparent">
      <SectionContainer width={containerWidth}>
        <section className={styles.root} aria-busy="true" aria-label={`Loading ${kind}`}>
          <ToolbarFallback kind={kind} />
          {resolvedVariant === "default" ? (
            <div className={styles.featuredLayout}>
              <CardFallback featured variant={resolvedVariant} />
              <SectionItemsGrid maxColumns={3} singleItemLayout="compact" className={styles.grid}>
                <CardFallback variant={resolvedVariant} />
                <CardFallback variant={resolvedVariant} />
                <CardFallback variant={resolvedVariant} />
              </SectionItemsGrid>
            </div>
          ) : resolvedVariant === "studio" ? (
            <div className={styles.studioLayout}>
              <CardFallback featured variant={resolvedVariant} />
              <SectionItemsGrid maxColumns={2} singleItemLayout="compact" className={styles.grid}>
                <CardFallback variant={resolvedVariant} />
                <CardFallback variant={resolvedVariant} />
              </SectionItemsGrid>
            </div>
          ) : (
            <SectionItemsGrid maxColumns={gridColumns} singleItemLayout="compact" className={styles.grid}>
              <CardFallback variant={resolvedVariant} />
              <CardFallback variant={resolvedVariant} />
              <CardFallback variant={resolvedVariant} />
            </SectionItemsGrid>
          )}
        </section>
      </SectionContainer>
    </SectionShell>
  );
}
