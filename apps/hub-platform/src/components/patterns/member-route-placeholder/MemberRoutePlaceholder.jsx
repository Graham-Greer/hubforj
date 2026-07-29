import EmptyState from "@/components/patterns/empty-state/EmptyState";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import Surface from "@/components/primitives/surface/Surface";
import styles from "./MemberRoutePlaceholder.module.css";

export default function MemberRoutePlaceholder({
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
                <h2 className={styles.cardTitle}>{highlight.title}</h2>
                <p className={styles.cardBody}>{highlight.body}</p>
              </Surface>
            ))}
          </div>
        ) : null}
      </WorkspaceSection>
      <EmptyState
        eyebrow="Account workspace"
        title="This route is ready for the next implementation pass"
        description="The member route authority is now present. The next steps should replace placeholders with calm, task-focused self-service flows."
        primaryAction={primaryAction}
        secondaryAction={secondaryAction}
      />
    </div>
  );
}
