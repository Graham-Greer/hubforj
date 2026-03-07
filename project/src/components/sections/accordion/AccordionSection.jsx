import Text from "@/components/primitives/text/Text";
import SectionHeader from "@/components/patterns/section-header/SectionHeader";
import Section from "@/components/patterns/section/Section";
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
    <Section className={styles.root}>
      <SectionHeader eyebrow={eyebrow} title={title} description={description} />
      {accordionItems.length ? (
        <Accordion items={accordionItems} type="single" defaultOpen={defaultOpen} variant="compact" />
      ) : (
        <Text tone="secondary">Add at least one accordion item.</Text>
      )}
    </Section>
  );
}
