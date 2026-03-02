import Heading from "@/components/primitives/heading/Heading";
import Text from "@/components/primitives/text/Text";
import Card from "@/components/ui/card/Card";
import styles from "./PricingSection.module.css";

function parseTiers(value) {
  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [name, price, description] = line.split("|");
      return {
        id: `tier-${index}`,
        name: String(name || "").trim() || `Tier ${index + 1}`,
        price: String(price || "").trim(),
        description: String(description || "").trim(),
      };
    });
}

export default function PricingSection({ title, tiersText, variant = "3tier" }) {
  const tiers = parseTiers(tiersText);

  return (
    <section className={styles.root}>
      {title ? <Heading as="h2" size="md">{title}</Heading> : null}
      <div className={[styles.grid, styles[`variant_${variant}`] || ""].join(" ")}>
        {tiers.map((tier) => (
          <Card key={tier.id} className={styles.card}>
            <Heading as="h3" size="sm">{tier.name}</Heading>
            {tier.price ? <Text weight="semibold">{tier.price}</Text> : null}
            {tier.description ? <Text tone="secondary">{tier.description}</Text> : null}
          </Card>
        ))}
      </div>
    </section>
  );
}
