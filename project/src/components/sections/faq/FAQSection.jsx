import Heading from "@/components/primitives/heading/Heading";
import Text from "@/components/primitives/text/Text";
import Accordion from "@/components/ui/accordion/Accordion";
import styles from "./FAQSection.module.css";

function parseFaq(itemsText) {
  return String(itemsText || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [question, answer] = line.split("|");
      return {
        value: `faq-${index}`,
        label: String(question || "").trim() || `Question ${index + 1}`,
        content: <Text tone="secondary">{String(answer || "").trim() || "Add an answer."}</Text>,
      };
    });
}

export default function FAQSection({ variant = "compact", title, itemsText }) {
  const items = parseFaq(itemsText);

  return (
    <section className={styles.root}>
      {title ? <Heading as="h2" size="md">{title}</Heading> : null}
      <Accordion items={items} variant={variant === "detailed" ? "separated" : "compact"} type="single" />
    </section>
  );
}
