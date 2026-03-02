import Heading from "@/components/primitives/heading/Heading";
import Text from "@/components/primitives/text/Text";
import styles from "./LegalDocumentSection.module.css";

export default function LegalDocumentSection({ content }) {
  return (
    <section className={styles.root}>
      <Heading as="h2" size="md">Legal</Heading>
      <Text>{content || "Add legal document content."}</Text>
    </section>
  );
}
