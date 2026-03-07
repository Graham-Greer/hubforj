import Text from "@/components/primitives/text/Text";
import Section from "@/components/patterns/section/Section";
import styles from "./RichTextSection.module.css";

export default function RichTextSection({ content }) {
  return (
    <Section className={styles.root}>
      <Text>{content || "Add rich text content."}</Text>
    </Section>
  );
}
