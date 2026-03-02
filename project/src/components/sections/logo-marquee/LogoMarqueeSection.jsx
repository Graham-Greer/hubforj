import AppImage from "@/components/ui/image/AppImage";
import styles from "./LogoMarqueeSection.module.css";

function parseIds(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function LogoMarqueeSection({ variant = "grid", logosMediaIds, mediaById }) {
  const ids = parseIds(logosMediaIds);

  return (
    <section className={[styles.root, styles[`variant_${variant}`] || ""].join(" ")}>
      {ids.map((id) => {
        const media = mediaById?.get(id);
        if (!media?.publicUrl) return null;

        return (
          <div key={id} className={styles.logoItem}>
            <AppImage src={media.publicUrl} alt={media.alt || "Partner logo"} width={240} height={120} sizes="180px" variant="square" />
          </div>
        );
      })}
    </section>
  );
}
