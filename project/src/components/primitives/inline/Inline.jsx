import styles from "./Inline.module.css";

export default function Inline({
  as: Tag = "div",
  gap = "3",
  align = "center",
  justify = "flex-start",
  wrap = true,
  className = "",
  children,
  ...rest
}) {
  const alignKey = `align_${String(align).replaceAll("-", "_")}`;
  const justifyKey = `justify_${String(justify).replaceAll("-", "_")}`;
  const classes = [
    styles.root,
    styles[`gap_${gap}`] || styles.gap_3,
    styles[alignKey] || styles.align_center,
    styles[justifyKey] || styles.justify_flex_start,
    wrap ? styles.wrap : styles.noWrap,
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
