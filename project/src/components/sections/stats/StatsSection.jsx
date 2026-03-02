import Heading from "@/components/primitives/heading/Heading";
import Text from "@/components/primitives/text/Text";
import Card from "@/components/ui/card/Card";
import styles from "./StatsSection.module.css";

function parseItems(value) {
  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [valuePart, label] = line.split("|");
      return {
        id: `stat-${index}`,
        value: String(valuePart || "").trim(),
        label: String(label || "").trim(),
      };
    });
}

export default function StatsSection({ itemsText, variant = "row" }) {
  const items = parseItems(itemsText);

  return (
    <section className={[styles.root, styles[`variant_${variant}`] || ""].join(" ")}>
      {items.map((item) => (
        <Card key={item.id} className={styles.item}>
          <Heading as="h3" size="md">{item.value}</Heading>
          <Text tone="secondary">{item.label}</Text>
        </Card>
      ))}
    </section>
  );
}
