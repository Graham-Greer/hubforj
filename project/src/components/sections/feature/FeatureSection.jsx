import SectionHeader from "@/components/patterns/section-header/SectionHeader";
import Section from "@/components/patterns/section/Section";
import Button from "@/components/ui/button/Button";
import AppImage from "@/components/ui/image/AppImage";
import styles from "./FeatureSection.module.css";

export default function FeatureSection({
  variant = "centered",
  eyebrow,
  title,
  description,
  ctas = [],
  media,
  centeredMediaMode = "none",
  backgroundTone = "surface",
  textAlign = "left",
  mediaPosition = "right",
  splitRatio = "50-50",
  contentAlign = "left",
  mediaById,
}) {
  const normalizedTitle = String(title || "").trim();
  const normalizedDescription = String(description || "").trim();
  const normalizedEyebrow = String(eyebrow || "").trim();
  const normalizedCtas = Array.isArray(ctas) ? ctas : [];
  const mediaRef = media && typeof media === "object" ? media : {};
  const mediaId = String(mediaRef.mediaId || "").trim();
  const selectedMedia = mediaId ? mediaById?.get(mediaId) : null;
  const kind = String(mediaRef.kind || "image").trim() || "image";
  const alt = String(mediaRef.alt || selectedMedia?.alt || normalizedTitle || "Feature media").trim();
  const posterMediaId = String(mediaRef.posterMediaId || "").trim();
  const posterMedia = posterMediaId ? mediaById?.get(posterMediaId) : null;
  const mediaUrl = selectedMedia?.publicUrl || "";
  const posterUrl = posterMedia?.publicUrl || "";
  const mediaAvailable = Boolean(mediaUrl);
  const align = variant === "split" ? contentAlign : textAlign;
  const normalizedCenteredMode =
    centeredMediaMode === "background" || centeredMediaMode === "inline"
      ? centeredMediaMode
      : "none";
  const showBackgroundMedia =
    variant === "centered" &&
    normalizedCenteredMode === "background" &&
    mediaAvailable;
  const showInlineMedia =
    variant === "centered" &&
    normalizedCenteredMode === "inline" &&
    mediaAvailable;
  const showSplitMedia = variant === "split" && mediaAvailable;

  return (
    <Section
      className={[
        styles.root,
        styles[`variant_${variant}`] || "",
        styles[`tone_${backgroundTone}`] || "",
        styles[`align_${align}`] || "",
        styles[`position_${mediaPosition}`] || "",
        styles[`ratio_${splitRatio}`] || "",
      ].join(" ")}
    >
      {showBackgroundMedia ? (
        <div className={styles.backgroundMedia} aria-hidden="true">
          {kind === "video" ? (
            <video
              className={styles.video}
              src={mediaUrl}
              poster={posterUrl || undefined}
              controls
              preload="metadata"
            />
          ) : (
            <AppImage
              src={mediaUrl}
              alt={alt}
              width={1600}
              height={900}
              sizes="100vw"
            />
          )}
          <div className={styles.backgroundOverlay} />
        </div>
      ) : null}
      <div className={styles.content}>
        <SectionHeader
          eyebrow={normalizedEyebrow}
          title={normalizedTitle}
          description={normalizedDescription}
          titleAs="h2"
          titleSize="lg"
          align={align}
          actions={normalizedCtas.length ? (
            <div className={styles.actions}>
              {normalizedCtas.slice(0, 2).map((cta, index) => {
                const href = String(cta?.href || "").trim();
                const label = String(cta?.label || "").trim();
                if (!href || !label) return null;
                const external = /^https?:\/\//i.test(href);
                return (
                  <Button
                    key={`${label}-${href}-${index}`}
                    href={href}
                    external={external}
                    variant={index === 0 ? "primary" : "secondary"}
                  >
                    {label}
                  </Button>
                );
              })}
            </div>
          ) : null}
        />
      </div>
      {showInlineMedia || showSplitMedia ? (
        <div className={styles.mediaWrap}>
          {kind === "video" ? (
            <video
              className={styles.video}
              src={mediaUrl}
              poster={posterUrl || undefined}
              controls
              preload="metadata"
            />
          ) : (
            <AppImage
              src={mediaUrl}
              alt={alt}
              width={1200}
              height={700}
              sizes={showSplitMedia ? "(max-width: 960px) 100vw, 50vw" : "100vw"}
            />
          )}
        </div>
      ) : null}
    </Section>
  );
}
