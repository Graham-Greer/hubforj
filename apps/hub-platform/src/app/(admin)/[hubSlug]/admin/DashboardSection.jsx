import Link from "next/link";
import Surface from "@/components/primitives/surface/Surface";
import styles from "./DashboardSection.module.css";

export default function DashboardSection({ title, href = "", children }) {
  return (
    <Surface tone="default" padding="lg" className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {href ? (
          <Link href={href} prefetch={false} className={styles.link}>
            View all
          </Link>
        ) : null}
      </div>
      {children}
    </Surface>
  );
}
