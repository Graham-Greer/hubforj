import Heading from "@/components/primitives/heading/Heading";
import Text from "@/components/primitives/text/Text";
import Button from "@/components/ui/button/Button";
import AppImage from "@/components/ui/image/AppImage";
import styles from "./HeroSection.module.css";

export default function HeroSection({
  variant = "centered",
  heading,
  subheading,
  ctaText,
  ctaHref,
  imageMediaId,
  mediaById,
}) {
  const media = imageMediaId ? mediaById?.get(imageMediaId) : null;

  return (
    <section className={[styles.root, styles[`variant_${variant}`] || ""].join(" ")}>
      <div className={styles.content}>
        {heading ? <Heading as="h1" size="lg">{heading}</Heading> : null}
        {subheading ? <Text tone="secondary">{subheading}</Text> : null}
        {ctaText && ctaHref ? <Button href={ctaHref}>{ctaText}</Button> : null}
      </div>
      {media?.publicUrl ? (
        <div className={styles.mediaWrap}>
          <AppImage
            src={media.publicUrl}
            alt={media.alt || heading || "Hero image"}
            width={1200}
            height={700}
            sizes="(max-width: 960px) 100vw, 50vw"
          />
        </div>
      ) : null}
    </section>
  );
}
