import PageHeader from "@/components/patterns/page-header/PageHeader";
import Surface from "@/components/primitives/surface/Surface";
import styles from "./PublicStaticPage.module.css";

export default function PublicStaticPage({ eyebrow, title, description, body, variant = "standard" }) {
  return (
    <main className={styles.root} data-variant={variant}>
      <Surface padding="xl" className={styles.hero}>
        <PageHeader
          eyebrow={eyebrow}
          title={title}
          description={description}
        />
      </Surface>

      <Surface padding="xl" className={styles.body}>
        {body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </Surface>
    </main>
  );
}
