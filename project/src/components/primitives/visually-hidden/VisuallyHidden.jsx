import styles from "./VisuallyHidden.module.css";

export default function VisuallyHidden({ as: Tag = "span", children, className = "", ...rest }) {
  const classes = [styles.root, className].filter(Boolean).join(" ");

  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  );
}
