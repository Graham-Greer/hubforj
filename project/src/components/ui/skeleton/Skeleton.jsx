import styles from "./Skeleton.module.css";

export default function Skeleton({ variant = "pulse", radius = "md", inline = false, className = "" }) {
  const classes = [
    styles.root,
    styles[`variant_${variant}`],
    styles[`radius_${radius}`],
    inline ? styles.inline : styles.block,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <span className={classes} aria-hidden="true" />;
}
