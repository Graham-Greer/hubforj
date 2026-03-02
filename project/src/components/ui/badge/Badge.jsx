import styles from "./Badge.module.css";

export default function Badge({ variant = "soft", tone = "neutral", size = "md", className = "", children }) {
  const classes = [styles.root, styles[`variant_${variant}`], styles[`tone_${tone}`], styles[`size_${size}`], className]
    .filter(Boolean)
    .join(" ");

  return <span className={classes}>{children}</span>;
}
