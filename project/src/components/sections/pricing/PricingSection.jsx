import Heading from "@/components/primitives/heading/Heading";
import Text from "@/components/primitives/text/Text";
import SectionHeader from "@/components/patterns/section-header/SectionHeader";
import Section from "@/components/patterns/section/Section";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Card from "@/components/ui/card/Card";
import styles from "./PricingSection.module.css";

function normalizeItems(items = []) {
  const source = Array.isArray(items) ? items : [];
  return source
    .map((item) => (item && typeof item === "object" ? item : {}))
    .map((item, index) => ({
      id: String(item.id || `tier_${index + 1}`).trim(),
      name: String(item.name || "").trim(),
      description: String(item.description || "").trim(),
      isFree: Boolean(item.isFree),
      price: item.price && typeof item.price === "object"
        ? {
          amountMinor: Number(item.price.amountMinor || 0),
          currency: String(item.price.currency || "GBP").trim().toUpperCase(),
        }
        : null,
      interval: String(item.interval || "").trim(),
      features: Array.isArray(item.features)
        ? item.features
          .map((feature, featureIndex) => ({
            id: String(feature?.id || `feature_${featureIndex + 1}`).trim(),
            text: String(feature?.text || "").trim(),
          }))
          .filter((feature) => feature.text)
        : [],
      highlight: Boolean(item.highlight),
      badge: item.badge && typeof item.badge === "object"
        ? {
          text: String(item.badge.text || "").trim(),
          tone: String(item.badge.tone || "neutral").trim() || "neutral",
        }
        : null,
      cta: item.cta && typeof item.cta === "object"
        ? {
          label: String(item.cta.label || "").trim(),
          href: String(item.cta.href || "").trim(),
        }
        : null,
    }));
}

function formatPrice(tier = {}) {
  if (tier.isFree) return "Free";
  const amountMinor = Number(tier.price?.amountMinor || 0);
  const currency = tier.price?.currency || "GBP";
  const formatter = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(Math.max(0, amountMinor) / 100);
}

function TierCard({ tier, align = "left", density = "comfortable" }) {
  const hasCta = tier.cta?.label && tier.cta?.href;
  const ctaExternal = /^https?:\/\//i.test(tier.cta?.href || "");

  return (
    <Card
      className={[
        styles.card,
        tier.highlight ? styles.highlight : "",
        styles[`align_${align}`] || "",
        styles[`density_${density}`] || "",
      ].join(" ")}
    >
      <div className={styles.cardHeader}>
        {tier.name ? <Heading as="h3" size="sm">{tier.name}</Heading> : null}
        {tier.badge?.text ? <Badge tone={tier.badge.tone || "neutral"} size="sm">{tier.badge.text}</Badge> : null}
      </div>

      <Text className={styles.priceText} weight="semibold">{formatPrice(tier)}</Text>
      {tier.interval && !tier.isFree ? <Text tone="secondary">per {tier.interval}</Text> : null}
      {tier.description ? <Text tone="secondary">{tier.description}</Text> : null}

      {tier.features.length ? (
        <ul className={styles.featureList}>
          {tier.features.map((feature) => (
            <li key={feature.id} className={styles.featureItem}>
              <Text>{feature.text}</Text>
            </li>
          ))}
        </ul>
      ) : null}

      {hasCta ? (
        <div className={styles.actionRow}>
          <Button href={tier.cta.href} external={ctaExternal} variant="primary">
            {tier.cta.label}
          </Button>
        </div>
      ) : null}
    </Card>
  );
}

export default function PricingSection({
  eyebrow,
  title,
  description,
  columns = "3",
  align = "left",
  density = "comfortable",
  items = [],
}) {
  const tiers = normalizeItems(items);
  const normalizedColumns = ["1", "2", "3", "4"].includes(String(columns))
    ? String(Math.min(Number(columns), Math.max(1, tiers.length || 1)))
    : "3";
  const normalizedAlign = align === "center" ? "center" : "left";
  const normalizedDensity = density === "compact" ? "compact" : "comfortable";

  return (
    <Section className={styles.root}>
      <SectionHeader eyebrow={eyebrow} title={title} description={description} />

      <div className={[styles.grid, styles[`columns_${normalizedColumns}`] || ""].join(" ")}>
        {tiers.map((tier) => (
          <TierCard
            key={tier.id}
            tier={tier}
            align={normalizedAlign}
            density={normalizedDensity}
          />
        ))}
      </div>
    </Section>
  );
}
