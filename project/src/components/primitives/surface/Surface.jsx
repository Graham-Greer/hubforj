import styles from "./Surface.module.css";

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
  const classes = [
    styles.root,
    tone === "muted" ? styles.toneMuted : styles.toneDefault,
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
