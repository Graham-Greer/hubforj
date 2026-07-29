import Link from "next/link";
import styles from "./PublicBreadcrumbs.module.css";

export default function PublicBreadcrumbs({ items = [], className = "" }) {
  const visibleItems = Array.isArray(items) ? items.filter(Boolean) : [];

  if (!visibleItems.length) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className={[styles.root, className].filter(Boolean).join(" ")}>
      <ol className={styles.list}>
        {visibleItems.map((item, index) => {
          const isCurrent = index === visibleItems.length - 1;

          return (
            <li key={`${item.label}-${index}`} className={styles.item}>
              {item.href && !isCurrent ? (
                <Link href={item.href} className={styles.link}>
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isCurrent ? "page" : undefined} className={styles.current}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
