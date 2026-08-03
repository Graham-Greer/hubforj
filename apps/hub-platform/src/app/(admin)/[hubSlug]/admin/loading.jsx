import styles from "./loading.module.css";

function SkeletonLine({ width = "100%" }) {
  return <span className={styles.line} style={{ inlineSize: width }} aria-hidden="true" />;
}

function SkeletonCard({ compact = false }) {
  return (
    <article className={compact ? styles.cardCompact : styles.card}>
      <SkeletonLine width="42%" />
      <SkeletonLine width="88%" />
      <SkeletonLine width="72%" />
    </article>
  );
}

export default function HubAdminLoading() {
  return (
    <div className={styles.layout} role="status" aria-live="polite">
      <header className={styles.header}>
        <SkeletonLine width="8rem" />
        <SkeletonLine width="min(34rem, 88%)" />
        <SkeletonLine width="min(42rem, 96%)" />
      </header>
      <section className={styles.summary} aria-hidden="true">
        <SkeletonCard compact />
        <SkeletonCard compact />
        <SkeletonCard compact />
      </section>
      <section className={styles.workspace} aria-hidden="true">
        <SkeletonCard />
        <SkeletonCard />
      </section>
      <span className={styles.statusText}>Loading admin workspace</span>
    </div>
  );
}
