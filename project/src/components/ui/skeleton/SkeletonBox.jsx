import Skeleton from "./Skeleton";
import styles from "./SkeletonBox.module.css";

export default function SkeletonBox({ className = "", radius = "lg" }) {
  return <Skeleton className={[styles.root, className].filter(Boolean).join(" ")} radius={radius} />;
}
