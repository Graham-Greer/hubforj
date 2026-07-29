import SectionContainer from "@/components/sections/section-container/SectionContainer";
import SectionShell from "@/components/sections/section-shell/SectionShell";
import SectionHeader from "@/components/sections/primitives/section-header/SectionHeader";
import Accordion from "@/components/ui/accordion/Accordion";
import styles from "./FAQSection.module.css";

function FAQAnswer({ answer }) {
  return <p className={styles.answer}>{answer}</p>;
}

export default function FAQSection({
  id,
  eyebrow,
  title,
  description,
  items = [],
  containerWidth = "default",
  headingLevel = 2,
  className = "",
}) {
  const visibleItems = Array.isArray(items)
    ? items
        .filter((item) => item?.question && item?.answer)
        .map((item, index) => ({
          id: item.id || `faq-${index + 1}`,
          title: item.question,
          content: <FAQAnswer answer={item.answer} />,
        }))
    : [];

  if (!visibleItems.length) {
    return null;
  }

  return (
    <SectionShell
      id={id}
      spacing="spacious"
      surface="transparent"
      className={[styles.root, className].filter(Boolean).join(" ")}
    >
      <SectionContainer width={containerWidth}>
        <div className={styles.inner}>
          <SectionHeader
            eyebrow={eyebrow}
            title={title}
            description={description}
            align="start"
            width="default"
            headingLevel={headingLevel}
          />
          <Accordion items={visibleItems} />
        </div>
      </SectionContainer>
    </SectionShell>
  );
}
