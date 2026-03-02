import styles from "./Stack.module.css";

export default function Stack({
  as: Tag = "div",
  gap = "4",
  align = "stretch",
  justify = "flex-start",
  wrap = false,
  className = "",
  children,
  ...rest
}) {
  const alignKey = `align_${String(align).replaceAll("-", "_")}`;
  const justifyKey = `justify_${String(justify).replaceAll("-", "_")}`;
  const classes = [
    styles.root,
    styles[`gap_${gap}`] || styles.gap_4,
    styles[alignKey] || styles.align_stretch,
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
