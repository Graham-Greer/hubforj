import Skeleton from "./Skeleton";
import styles from "./SkeletonText.module.css";

export default function SkeletonText({ lines = 3, className = "" }) {
  const rows = Array.from({ length: lines }, (_, index) => index);

  return (
    <div className={[styles.root, className].filter(Boolean).join(" ")} aria-hidden="true">
      {rows.map((row) => (
        <Skeleton key={row} className={styles.line} />
      ))}
    </div>
  );
}
