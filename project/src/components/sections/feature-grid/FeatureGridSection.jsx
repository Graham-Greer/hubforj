import Heading from "@/components/primitives/heading/Heading";
import Text from "@/components/primitives/text/Text";
import Card from "@/components/ui/card/Card";
import styles from "./FeatureGridSection.module.css";

function parseItems(itemsText) {
  return String(itemsText || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title, description] = line.split("|");
      return { title: String(title || "").trim(), description: String(description || "").trim() };
    });
}

export default function FeatureGridSection({ variant = "3col", title, itemsText }) {
  const items = parseItems(itemsText);

  return (
    <section className={styles.root}>
      {title ? <Heading as="h2" size="md">{title}</Heading> : null}
      <div className={[styles.grid, styles[`variant_${variant}`] || ""].join(" ")}>
        {items.map((item, index) => (
          <Card key={`${item.title}-${index}`} className={styles.card}>
            <Heading as="h3" size="sm">{item.title || `Feature ${index + 1}`}</Heading>
            {item.description ? <Text tone="secondary">{item.description}</Text> : null}
          </Card>
        ))}
      </div>
    </section>
  );
}
