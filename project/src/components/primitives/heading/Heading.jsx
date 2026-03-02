import styles from "./Heading.module.css";

export default function Heading({
  as: Tag = "h2",
  size = "md",
  tone = "primary",
  weight = "bold",
  className = "",
  children,
  ...rest
}) {
  const classes = [
    styles.root,
    styles[`size_${size}`],
    styles[`tone_${tone}`],
    styles[`weight_${weight}`],
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
