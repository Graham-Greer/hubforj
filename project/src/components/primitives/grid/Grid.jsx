import styles from "./Grid.module.css";

export default function Grid({
  as: Tag = "div",
  columns = "auto",
  gap = "4",
  className = "",
  children,
  ...rest
}) {
  const classes = [
    styles.root,
    styles[`gap_${gap}`] || styles.gap_4,
    styles[`cols_${columns}`] || styles.cols_auto,
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
