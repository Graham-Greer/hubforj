import Image from "next/image";
import styles from "./SectionMedia.module.css";

const ratioClassNames = {
  "16:9": styles.ratio16x9,
  "4:3": styles.ratio4x3,
  "1:1": styles.ratio1x1,
  "3:4": styles.ratio3x4,
  auto: styles.ratioAuto,
};

const radiusClassNames = {
  none: styles.radiusNone,
  lg: styles.radiusLg,
  xl: styles.radiusXl,
};

const chromeClassNames = {
  none: styles.chromeNone,
  subtle: styles.chromeSubtle,
  default: styles.chromeDefault,
};

const elevationClassNames = {
  none: styles.elevationNone,
  sm: styles.elevationSm,
  md: styles.elevationMd,
  lg: styles.elevationLg,
};

export default function SectionMedia({
  media,
  alt,
  ratio = "16:9",
  radius = "xl",
  chrome = "default",
  elevation = "lg",
  sizes = "(max-width: 48rem) 100vw, 50vw",
  priority = false,
  decorative = false,
  className = "",
}) {
  if (!media?.src) {
    return null;
  }

  const resolvedAlt = decorative ? "" : alt || media.alt || "";
  const rootClassName = [
    styles.root,
    ratioClassNames[ratio] || ratioClassNames["16:9"],
    radiusClassNames[radius] || radiusClassNames.xl,
    chromeClassNames[chrome] || chromeClassNames.default,
    elevationClassNames[elevation] || elevationClassNames.lg,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (media.type === "video") {
    return (
      <div className={rootClassName} aria-hidden={decorative || undefined}>
        <video
          key={media.src}
          className={styles.video}
          src={media.src}
          poster={media.poster || undefined}
          autoPlay={media.autoplay}
          muted={media.muted ?? media.autoplay}
          loop={media.loop}
          playsInline={media.playsInline ?? media.autoplay}
          controls={media.controls}
        />
      </div>
    );
  }

  return (
    <div className={rootClassName} aria-hidden={decorative || undefined}>
      <Image
        key={media.src}
        src={media.src}
        alt={resolvedAlt}
        fill
        priority={priority}
        sizes={sizes}
        className={styles.image}
      />
    </div>
  );
}
