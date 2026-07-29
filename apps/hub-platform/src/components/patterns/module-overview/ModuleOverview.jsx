import EmptyState from "@/components/patterns/empty-state/EmptyState";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import StatCard from "@/components/ui/stat-card/StatCard";
import styles from "./ModuleOverview.module.css";

export default function ModuleOverview({ eyebrow, title, description, stats, emptyState }) {
  return (
    <div className={styles.layout}>
      <WorkspaceSection eyebrow={eyebrow} title={title} description={description}>
        <div className={styles.stats}>
          {stats.map((stat) => (
            <StatCard key={stat.label} label={stat.label} value={stat.value} detail={stat.detail} />
          ))}
        </div>
      </WorkspaceSection>
      <EmptyState {...emptyState} />
    </div>
  );
}
