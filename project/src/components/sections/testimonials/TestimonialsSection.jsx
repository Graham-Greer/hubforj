import Heading from "@/components/primitives/heading/Heading";
import Text from "@/components/primitives/text/Text";
import Card from "@/components/ui/card/Card";
import styles from "./TestimonialsSection.module.css";

function parseItems(value) {
  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [quote, name] = line.split("|");
      return {
        id: `testimonial-${index}`,
        quote: String(quote || "").trim(),
        name: String(name || "").trim(),
      };
    });
}

export default function TestimonialsSection({ title, itemsText, variant = "grid" }) {
  const items = parseItems(itemsText);

  return (
    <section className={styles.root}>
      {title ? <Heading as="h2" size="md">{title}</Heading> : null}
      <div className={[styles.grid, styles[`variant_${variant}`] || ""].join(" ")}>
        {items.map((item) => (
          <Card key={item.id} className={styles.card}>
            <Text>&quot;{item.quote}&quot;</Text>
            {item.name ? <Text tone="secondary">- {item.name}</Text> : null}
          </Card>
        ))}
      </div>
    </section>
  );
}
