import SectionHeader from "@/components/patterns/section-header/SectionHeader";
import Section from "@/components/patterns/section/Section";
import Button from "@/components/ui/button/Button";
import AppImage from "@/components/ui/image/AppImage";
import styles from "./HeroSection.module.css";

export default function HeroSection({
  variant = "centered",
  eyebrow,
  title,
  description,
  ctas = [],
  media,
  backgroundTone = "surface",
  textAlign = "center",
  mediaPosition = "right",
  splitRatio = "50-50",
  contentAlign = "left",
  heading,
  subheading,
  ctaText,
  ctaHref,
  imageMediaId,
  mediaById,
}) {
  const normalizedTitle = String(title || heading || "").trim();
  const normalizedDescription = String(description || subheading || "").trim();
  const normalizedEyebrow = String(eyebrow || "").trim();
  const normalizedCtas = Array.isArray(ctas) && ctas.length
    ? ctas
    : (ctaText && ctaHref ? [{ label: ctaText, href: ctaHref }] : []);
  const mediaRef = media && typeof media === "object" ? media : {};
  const mediaId = String(mediaRef.mediaId || imageMediaId || "").trim();
  const selectedMedia = mediaId ? mediaById?.get(mediaId) : null;
  const kind = String(mediaRef.kind || "image").trim() || "image";
  const alt = String(mediaRef.alt || selectedMedia?.alt || normalizedTitle || "Hero media").trim();
  const posterMediaId = String(mediaRef.posterMediaId || "").trim();
  const posterMedia = posterMediaId ? mediaById?.get(posterMediaId) : null;
  const mediaUrl = selectedMedia?.publicUrl || "";
  const posterUrl = posterMedia?.publicUrl || "";
  const mediaAvailable = Boolean(mediaUrl);
  const align = variant === "split" ? contentAlign : textAlign;

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
      {variant === "centered" && mediaAvailable ? (
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
          titleAs="h1"
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
      {variant === "split" && mediaAvailable ? (
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
              sizes="(max-width: 960px) 100vw, 50vw"
            />
          )}
        </div>
      ) : null}
    </Section>
  );
}
