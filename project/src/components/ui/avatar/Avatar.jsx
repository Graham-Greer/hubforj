import AppImage from "../image/AppImage";
import styles from "./Avatar.module.css";

function initialsFromName(name = "") {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function Avatar({ src, name = "", size = "md", shape = "circle", fallback, className = "" }) {
  const classes = [styles.root, styles[`size_${size}`], shape === "circle" ? styles.circle : styles.rounded, className]
    .filter(Boolean)
    .join(" ");

  if (src) {
    return (
      <div className={classes}>
        <AppImage src={src} alt={name || "Avatar"} fill sizes="64px" variant={shape === "circle" ? "circle" : "rounded"} />
      </div>
    );
  }

  return <span className={classes}>{fallback || initialsFromName(name) || "?"}</span>;
}
