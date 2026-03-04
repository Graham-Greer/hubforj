import Heading from "@/components/primitives/heading/Heading";
import Text from "@/components/primitives/text/Text";
import Accordion from "@/components/ui/accordion/Accordion";
import { normalizeAccordionItems } from "@/lib/data/pages/accordion-section";
import styles from "./AccordionSection.module.css";

export default function AccordionSection({ eyebrow, title, description, items = [] }) {
  const normalizedItems = normalizeAccordionItems(items);

  const accordionItems = normalizedItems.map((item, index) => ({
    value: item.id || `acc-${index + 1}`,
    label: item.title || `Item ${index + 1}`,
    content: <Text tone="secondary">{item.content || "Add content."}</Text>,
  }));

  const defaultOpen = accordionItems.length ? [accordionItems[0].value] : [];

  return (
    <section className={styles.root}>
      {eyebrow ? <Text className={styles.eyebrow} tone="secondary">{eyebrow}</Text> : null}
      {title ? <Heading as="h2" size="md">{title}</Heading> : null}
      {description ? <Text tone="secondary">{description}</Text> : null}
      {accordionItems.length ? (
        <Accordion items={accordionItems} type="single" defaultOpen={defaultOpen} variant="compact" />
      ) : (
        <Text tone="secondary">Add at least one accordion item.</Text>
      )}
    </section>
  );
}
