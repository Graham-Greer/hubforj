import PageHeader from "@/components/patterns/page-header/PageHeader";
import SectionContainer from "@/components/sections/section-container/SectionContainer";
import SectionShell from "@/components/sections/section-shell/SectionShell";
import SectionRichText from "@/components/sections/primitives/section-rich-text/SectionRichText";
import Surface from "@/components/primitives/surface/Surface";
import styles from "./PublicLegalPage.module.css";

export default function PublicLegalPage({
  eyebrow,
  title,
  description,
  sections = [],
  variant = "standard",
}) {
  return (
    <main className={styles.root} data-variant={variant}>
      <SectionShell surface="transparent" spacing="default">
        <SectionContainer width="default">
          <Surface padding="xl" className={styles.hero}>
            <PageHeader
              eyebrow={eyebrow}
              title={title}
              description={description}
            />
          </Surface>
        </SectionContainer>
      </SectionShell>

      <SectionShell surface="transparent" spacing="compact">
        <SectionContainer width="default">
          <div className={styles.sections}>
            {sections.map((section) => (
              <Surface key={section.title || "legal-section"} padding="xl" className={styles.section}>
                <div className={styles.sectionInner}>
                  {section.title ? <h2 className={styles.sectionTitle}>{section.title}</h2> : null}
                  <SectionRichText content={section.body} className={styles.sectionBody} profile="legal" />
                </div>
              </Surface>
            ))}
          </div>
        </SectionContainer>
      </SectionShell>
    </main>
  );
}
