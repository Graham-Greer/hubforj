import Heading from "@/components/primitives/heading/Heading";
import Text from "@/components/primitives/text/Text";
import Button from "@/components/ui/button/Button";
import AppImage from "@/components/ui/image/AppImage";
import styles from "./CTASection.module.css";

export default function CTASection({ variant = "centered", title, body, ctaText, ctaHref, imageMediaId, mediaById }) {
  const media = imageMediaId ? mediaById?.get(imageMediaId) : null;

  return (
    <section className={[styles.root, styles[`variant_${variant}`] || ""].join(" ")}>
      <div className={styles.content}>
        {title ? <Heading as="h2" size="md">{title}</Heading> : null}
        {body ? <Text tone="secondary">{body}</Text> : null}
        {ctaText && ctaHref ? <Button href={ctaHref}>{ctaText}</Button> : null}
      </div>
      {media?.publicUrl ? <AppImage src={media.publicUrl} alt={media.alt || title || "CTA image"} width={1000} height={560} sizes="(max-width:960px) 100vw, 40vw" /> : null}
    </section>
  );
}
