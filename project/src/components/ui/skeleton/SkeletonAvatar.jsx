import Skeleton from "./Skeleton";
import styles from "./SkeletonAvatar.module.css";

export default function SkeletonAvatar({ size = "md", shape = "circle", className = "" }) {
  const classes = [styles.root, styles[`size_${size}`], shape === "circle" ? styles.circle : styles.rounded, className]
    .filter(Boolean)
    .join(" ");

  return <Skeleton className={classes} radius="full" />;
}
