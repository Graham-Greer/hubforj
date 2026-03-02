import styles from "./Text.module.css";

export default function Text({
  as: Tag = "p",
  size = "base",
  tone = "primary",
  weight = "normal",
  align = "left",
  truncate = false,
  className = "",
  children,
  ...rest
}) {
  const classes = [
    styles.root,
    styles[`size_${size}`],
    styles[`tone_${tone}`],
    styles[`weight_${weight}`],
    styles[`align_${align}`],
    truncate ? styles.truncate : "",
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
