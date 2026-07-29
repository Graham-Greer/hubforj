import Button from "@/components/ui/button/Button";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import styles from "./page.module.css";

export default function RootPage() {
  return (
    <main className={styles.root}>
      <WorkspaceSection
        eyebrow="Greenfield foundation"
        title="Hub Platform"
        description="The new application boundary is live with a production-grade token system, shell primitives, and route families ready for real domain implementation."
        tone="accent"
        actions={
          <div className={styles.actions}>
            <Button href="/platform">Open platform</Button>
            <Button href="/oak-hill/admin" variant="secondary">
              View hub admin shell
            </Button>
          </div>
        }
      >
        <p className={styles.lead}>
          This foundation is intentionally biased toward clarity: durable tokens, low-noise shells, and reusable building blocks that can support real product growth without a rewrite.
        </p>
      </WorkspaceSection>
    </main>
  );
}
