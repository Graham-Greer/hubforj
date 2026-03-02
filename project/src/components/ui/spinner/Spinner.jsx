import styles from "./Spinner.module.css";

export default function Spinner({ size = "md", tone = "default", ariaLabel = "Loading", className = "" }) {
  const classes = [styles.root, styles[`size_${size}`], styles[`tone_${tone}`], className]
    .filter(Boolean)
    .join(" ");

  return <span className={classes} role="status" aria-label={ariaLabel} />;
}
