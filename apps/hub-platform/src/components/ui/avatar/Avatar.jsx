import styles from "./Avatar.module.css";

export default function Avatar({
  initials = "",
  imageUrl = "",
  alt = "",
  size = "md",
  shape = "template",
  tone = "default",
  className = "",
}) {
  const label = String(alt || initials || "User").trim();
  const classes = [
    styles.root,
    imageUrl ? styles.hasImage : "",
    size === "sm" ? styles.sizeSm : "",
    size === "lg" ? styles.sizeLg : "",
    size === "xl" ? styles.sizeXl : "",
    shape === "rounded" ? styles.shapeRounded : "",
    shape === "pill" ? styles.shapePill : "",
    shape === "circle" ? styles.shapeCircle : "",
    tone === "accent" ? styles.toneAccent : "",
    className,
  ].filter(Boolean).join(" ");

  if (imageUrl) {
    return (
      <span className={classes} aria-label={label}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={label} className={styles.image} />
      </span>
    );
  }

  return (
    <span className={classes} aria-label={label}>
      <span className={styles.initials} aria-hidden="true">
        {String(initials || "U").trim().slice(0, 2)}
      </span>
    </span>
  );
}
