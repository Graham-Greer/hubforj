import SectionContainer from "@/components/sections/section-container/SectionContainer";
import SectionShell from "@/components/sections/section-shell/SectionShell";
import SectionHeader from "@/components/sections/primitives/section-header/SectionHeader";
import SectionActions from "@/components/sections/primitives/section-actions/SectionActions";
import SectionMedia from "@/components/sections/primitives/section-media/SectionMedia";
import styles from "./HeroSection.module.css";

const alignClassNames = {
  start: styles.alignStart,
  center: styles.alignCenter,
};

export default function HeroSection({
  id,
  eyebrow,
  title,
  description,
  actions = [],
  media = null,
  variant = "centered",
  height = "content",
  containerWidth,
  align,
  headingLevel = 1,
  className = "",
}) {
  const resolvedAlign = align || (variant === "centered" ? "center" : "start");
  const actionSize = variant === "centered" || variant === "narrative" || variant === "panel" ? "lg" : "md";
  const isScreenHeight = height === "screen";
  const hasMedia = Boolean(media?.src);
  const isNarrative = variant === "narrative";
  const isSplit = variant === "split";
  const isPanel = variant === "panel";
  const shouldRenderSplit = isSplit && hasMedia;
  const shouldRenderPanel = isPanel;
  const resolvedContainerWidth = containerWidth || (shouldRenderPanel || shouldRenderSplit ? "wide" : isNarrative ? "default" : "full");
  const resolvedVariantClassName = shouldRenderPanel
    ? styles.variantPanel
    : isNarrative
      ? styles.variantNarrative
    : shouldRenderSplit
      ? styles.variantSplit
      : styles.variantCentered;

  return (
    <SectionShell
      id={id}
      spacing={shouldRenderSplit || shouldRenderPanel ? "spacious" : "none"}
      spacingTop={shouldRenderSplit || shouldRenderPanel ? undefined : "none"}
      spacingBottom={shouldRenderSplit || shouldRenderPanel ? undefined : "spacious"}
      surface="transparent"
      className={[
        styles.root,
        resolvedVariantClassName,
        isScreenHeight ? styles.heightScreen : styles.heightContent,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {shouldRenderPanel ? (
        <SectionContainer width={resolvedContainerWidth} className={styles.shellContent}>
          <div className={styles.panelFrame}>
            <div className={[styles.panelCopy, alignClassNames[resolvedAlign] || alignClassNames.center].join(" ")}>
              <SectionHeader
                eyebrow={eyebrow}
                title={title}
                description={description}
                align={resolvedAlign}
                width="wide"
                headingLevel={headingLevel}
              />
              <SectionActions actions={actions} size={actionSize} align={resolvedAlign} className={styles.actions} />
            </div>

            {hasMedia ? (
              <SectionMedia
                media={media}
                decorative={media.decorative}
                alt={media.alt}
                ratio={media.ratio || "4:3"}
                radius={media.radius || "xl"}
                chrome={media.chrome || "default"}
                elevation={media.elevation || "lg"}
                priority
                className={styles.panelMedia}
              />
            ) : (
              <div className={styles.panelAccent} aria-hidden="true" />
            )}
          </div>
        </SectionContainer>
      ) : shouldRenderSplit ? (
        <SectionContainer width={resolvedContainerWidth} className={styles.shellContent}>
          <div className={[styles.inner, alignClassNames[resolvedAlign] || alignClassNames.center].join(" ")}>
            <div className={styles.copy}>
              <SectionHeader
                eyebrow={eyebrow}
                title={title}
                description={description}
                align={resolvedAlign}
                width="default"
                headingLevel={headingLevel}
              />
              <SectionActions actions={actions} size={actionSize} align={resolvedAlign} className={styles.actions} />
            </div>

            <SectionMedia
              media={media}
              decorative={media.decorative}
              alt={media.alt}
              ratio={media.ratio || "4:3"}
              radius={media.radius || "xl"}
              chrome={media.chrome || "default"}
              elevation={media.elevation || "lg"}
              priority
              className={styles.inlineMedia}
            />
          </div>
        </SectionContainer>
      ) : (
        <>
          {hasMedia ? (
            <SectionMedia
              media={media}
              decorative={media.decorative ?? true}
              ratio="auto"
              radius="none"
              chrome="none"
              elevation="none"
              priority
              className={styles.backgroundMedia}
            />
          ) : null}

          {hasMedia ? <div className={styles.overlay} /> : null}

          <SectionContainer width={resolvedContainerWidth} className={styles.shellContent}>
            <div className={[styles.inner, alignClassNames[resolvedAlign] || alignClassNames.center].join(" ")}>
              <div className={styles.copy}>
                <SectionHeader
                  eyebrow={eyebrow}
                  title={title}
                  description={description}
                  align={resolvedAlign}
                  width="wide"
                  headingLevel={headingLevel}
                  eyebrowClassName={hasMedia ? styles.inverseEyebrow : ""}
                  titleClassName={hasMedia ? styles.inverseTitle : ""}
                  descriptionClassName={hasMedia ? styles.inverseDescription : ""}
                />
                <SectionActions actions={actions} size={actionSize} align={resolvedAlign} className={styles.actions} />
              </div>
            </div>
          </SectionContainer>
        </>
      )}
    </SectionShell>
  );
}
