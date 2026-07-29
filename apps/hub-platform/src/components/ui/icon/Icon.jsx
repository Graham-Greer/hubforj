import styles from "./Icon.module.css";

export default function Icon({
  name,
  filled = false,
  decorative = true,
  ariaLabel,
  size = "md",
  tone = "default",
  className = "",
  ...rest
}) {
  const classes = [
    styles.root,
    styles[`size_${size}`] || styles.size_md,
    filled ? styles.filled : styles.outlined,
    tone === "default" ? styles.toneDefault : "",
    tone === "accent" ? styles.toneAccent : "",
    tone === "success" ? styles.toneSuccess : "",
    tone === "warning" ? styles.toneWarning : "",
    tone === "muted" ? styles.toneMuted : "",
    tone === "danger" ? styles.toneDanger : "",
    tone === "inverse" ? styles.toneInverse : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      className={classes}
      aria-hidden={decorative}
      aria-label={!decorative ? ariaLabel : undefined}
      {...rest}
    >
      {name}
    </span>
  );
}
