import SectionContainer from "@/components/sections/section-container/SectionContainer";
import SectionShell from "@/components/sections/section-shell/SectionShell";
import SectionActions from "@/components/sections/primitives/section-actions/SectionActions";
import SectionHeader from "@/components/sections/primitives/section-header/SectionHeader";
import SectionMedia from "@/components/sections/primitives/section-media/SectionMedia";
import SectionRichText from "@/components/sections/primitives/section-rich-text/SectionRichText";
import { hasSectionRichTextContent } from "@/lib/domain/section-rich-text";
import styles from "./InfoSection.module.css";

const mediaPositionClassNames = {
  start: styles.mediaStart,
  end: styles.mediaEnd,
};

const variantClassNames = {
  default: styles.variantDefault,
  story: styles.variantStory,
  feature: styles.variantFeature,
};

export default function InfoSection({
  id,
  eyebrow,
  title,
  description,
  body,
  media,
  action = null,
  mediaPosition = "end",
  variant = "default",
  containerWidth = "default",
  headingLevel = 2,
  className = "",
}) {
  if (!media?.src) {
    throw new Error("InfoSection requires media.");
  }

  if (!hasSectionRichTextContent(body)) {
    throw new Error("InfoSection requires body content.");
  }

  const actions = action ? [action] : [];
  const resolvedMediaPosition = mediaPositionClassNames[mediaPosition] ? mediaPosition : "end";
  const resolvedVariant = variantClassNames[variant] ? variant : "default";

  return (
    <SectionShell
      id={id}
      spacing="spacious"
      surface="transparent"
      className={[
        styles.root,
        mediaPositionClassNames[resolvedMediaPosition],
        variantClassNames[resolvedVariant],
        className,
      ].filter(Boolean).join(" ")}
    >
      <SectionContainer width={containerWidth}>
        <div className={styles.inner}>
          <div className={styles.copy}>
            <SectionHeader
              eyebrow={eyebrow}
              title={title}
              description={description}
              align="start"
              width="default"
              headingLevel={headingLevel}
            />
            <SectionRichText content={body} />
            {actions.length ? <SectionActions actions={actions} align="start" size="lg" className={styles.actions} /> : null}
          </div>

          <SectionMedia
            media={media}
            decorative={media.decorative}
            alt={media.alt}
            ratio={media.ratio || "4:3"}
            radius={media.radius || "xl"}
            chrome={media.chrome || "default"}
            elevation={media.elevation || "md"}
            className={styles.media}
          />
        </div>
      </SectionContainer>
    </SectionShell>
  );
}
