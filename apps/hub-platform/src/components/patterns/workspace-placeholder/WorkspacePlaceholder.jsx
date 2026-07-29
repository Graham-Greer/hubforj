import EmptyState from "@/components/patterns/empty-state/EmptyState";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import Surface from "@/components/primitives/surface/Surface";
import styles from "./WorkspacePlaceholder.module.css";

export default function WorkspacePlaceholder({
  eyebrow,
  title,
  description,
  highlights = [],
  primaryAction,
  secondaryAction,
}) {
  return (
    <div className={styles.layout}>
      <WorkspaceSection eyebrow={eyebrow} title={title} description={description}>
        {highlights.length ? (
          <div className={styles.highlights}>
            {highlights.map((highlight) => (
              <Surface key={highlight.title} padding="md" tone="muted" className={styles.card}>
                <h3 className={styles.cardTitle}>{highlight.title}</h3>
                <p className={styles.cardBody}>{highlight.body}</p>
              </Surface>
            ))}
          </div>
        ) : null}
      </WorkspaceSection>
      <EmptyState
        eyebrow="Planned workspace"
        title="Implementation continues from this route"
        description="The route authority is now locked in the app. The next passes should replace placeholders with real data flows and focused operational tools."
        primaryAction={primaryAction}
        secondaryAction={secondaryAction}
      />
    </div>
  );
}
