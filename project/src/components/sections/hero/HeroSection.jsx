import Heading from "@/components/primitives/heading/Heading";
import Text from "@/components/primitives/text/Text";
import Button from "@/components/ui/button/Button";
import AppImage from "@/components/ui/image/AppImage";
import styles from "./HeroSection.module.css";

export default function HeroSection({
  variant = "centered",
  heading,
  subheading,
  ctas = [],
  ctaText,
  ctaHref,
  imageMediaId,
  mediaById,
}) {
  const media = imageMediaId ? mediaById?.get(imageMediaId) : null;
  const normalizedCtas = Array.isArray(ctas) && ctas.length
    ? ctas
    : (ctaText && ctaHref ? [{ label: ctaText, href: ctaHref }] : []);

  return (
    <section className={[styles.root, styles[`variant_${variant}`] || ""].join(" ")}>
      <div className={styles.content}>
        {heading ? <Heading as="h1" size="lg">{heading}</Heading> : null}
        {subheading ? <Text tone="secondary">{subheading}</Text> : null}
        {normalizedCtas.length ? (
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
