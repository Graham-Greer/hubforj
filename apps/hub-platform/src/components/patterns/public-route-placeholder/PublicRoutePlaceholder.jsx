import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import Surface from "@/components/primitives/surface/Surface";
import styles from "./PublicRoutePlaceholder.module.css";

export default function PublicRoutePlaceholder({ eyebrow, title, description, highlights = [] }) {
  return (
    <main className={styles.root}>
      <WorkspaceSection eyebrow={eyebrow} title={title} description={description} tone="accent" className={styles.hero}>
        {highlights.length ? (
          <div className={styles.highlights}>
            {highlights.map((highlight) => (
              <Surface key={highlight.title} padding="md" className={styles.card}>
                <h2 className={styles.cardTitle}>{highlight.title}</h2>
                <p className={styles.cardBody}>{highlight.body}</p>
              </Surface>
            ))}
          </div>
        ) : null}
      </WorkspaceSection>
    </main>
  );
}
