import PageHeader from "@/components/patterns/page-header/PageHeader";
import {
  SkeletonButtonRow,
  SkeletonList,
  SkeletonMetricGrid,
} from "@/components/patterns/loading-skeleton";
import styles from "./page.module.css";

export default function MembersLoading() {
  return (
    <div className={styles.layout} role="status" aria-live="polite" aria-label="Loading member directory">
      <PageHeader
        eyebrow="Members"
        title="Member directory"
        description="Review members, check their status and payment context, and open the right record for follow-up."
      />
      <section className={styles.workspaceFallback} aria-hidden="true">
        <SkeletonMetricGrid count={4} columns={4} />
        <SkeletonButtonRow count={4} />
        <SkeletonList rows={8} withBadges />
      </section>
    </div>
  );
}
