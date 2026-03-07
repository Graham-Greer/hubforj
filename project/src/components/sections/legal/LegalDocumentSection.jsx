import Text from "@/components/primitives/text/Text";
import SectionHeader from "@/components/patterns/section-header/SectionHeader";
import Section from "@/components/patterns/section/Section";
import styles from "./LegalDocumentSection.module.css";

export default function LegalDocumentSection({ content }) {
  return (
    <Section className={styles.root}>
      <SectionHeader title="Legal" />
      <Text>{content || "Add legal document content."}</Text>
    </Section>
  );
}
