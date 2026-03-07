import SectionHeader from "@/components/patterns/section-header/SectionHeader";
import Section from "@/components/patterns/section/Section";
import Button from "@/components/ui/button/Button";
import AppImage from "@/components/ui/image/AppImage";
import styles from "./CTASection.module.css";

export default function CTASection({
  variant = "centered",
  title,
  body,
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
    <Section className={[styles.root, styles[`variant_${variant}`] || ""].join(" ")}>
      <div className={styles.content}>
        <SectionHeader
          title={title}
          description={body}
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
      {media?.publicUrl ? <AppImage src={media.publicUrl} alt={media.alt || title || "CTA image"} width={1000} height={560} sizes="(max-width:960px) 100vw, 40vw" /> : null}
    </Section>
  );
}
