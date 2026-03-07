import styles from "./Surface.module.css";

/**
 * Primitive visual container.
 * Use this for low-level box styling (tone, border, radius, elevation, padding).
 * Do not use for section semantics; use patterns/section/Section for that.
 */
export default function Surface({
  as: Tag = "div",
  tone = "default",
  border = true,
  elevation = "sm",
  radius = "lg",
  padding = "4",
  className = "",
  children,
  ...rest
}) {
  const toneClass =
    tone === "muted"
      ? styles.toneMuted
      : tone === "none"
        ? ""
        : styles.toneDefault;

  const classes = [
    styles.root,
    toneClass,
    border ? styles.withBorder : "",
    elevation === "none" ? styles.elevationNone : styles.elevationSm,
    styles[`radius_${radius}`] || styles.radius_lg,
    styles[`padding_${padding}`] || styles.padding_4,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  );
}
