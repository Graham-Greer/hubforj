import Text from "@/components/primitives/text/Text";
import styles from "./RichTextSection.module.css";

export default function RichTextSection({ content }) {
  return (
    <section className={styles.root}>
      <Text>{content || "Add rich text content."}</Text>
    </section>
  );
}
