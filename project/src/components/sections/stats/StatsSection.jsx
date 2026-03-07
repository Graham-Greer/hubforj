import Heading from "@/components/primitives/heading/Heading";
import Icon from "@/components/primitives/icon/Icon";
import Text from "@/components/primitives/text/Text";
import SectionHeader from "@/components/patterns/section-header/SectionHeader";
import Section from "@/components/patterns/section/Section";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Card from "@/components/ui/card/Card";
import styles from "./StatsSection.module.css";

function normalizeItems(items = []) {
  const source = Array.isArray(items) ? items : [];

  return source
    .map((item) => (item && typeof item === "object" ? item : {}))
    .map((item, index) => ({
      id: String(item.id || `stat_item_${index + 1}`).trim(),
      label: String(item.label || "").trim(),
      value: String(item.value || "").trim(),
      subtext: String(item.subtext || "").trim(),
      badge: item.badge && typeof item.badge === "object"
        ? {
          text: String(item.badge.text || "").trim(),
          tone: String(item.badge.tone || "neutral").trim() || "neutral",
        }
        : null,
      icon: item.icon && typeof item.icon === "object"
        ? {
          name: String(item.icon.name || "").trim(),
          tone: String(item.icon.tone || "neutral").trim() || "neutral",
        }
        : null,
    }));
}

function normalizeCtas(ctas = []) {
  const source = Array.isArray(ctas) ? ctas : [];
  return source
    .map((cta) => (cta && typeof cta === "object" ? cta : {}))
    .map((cta) => ({
      label: String(cta.label || "").trim(),
      href: String(cta.href || "").trim(),
    }))
    .filter((cta) => cta.label && cta.href)
    .slice(0, 2);
}

function StatCard({ item, align = "left", density = "comfortable" }) {
  const hasBadge = Boolean(item.badge?.text);
  const hasIcon = Boolean(item.icon?.name);

  const iconTone = item.icon?.tone === "danger" ? "danger" : "default";

  return (
    <Card className={[styles.item, styles[`density_${density}`] || "", styles[`align_${align}`] || ""].join(" ")}>
      <div className={styles.valueRow}>
        {hasIcon ? (
          <span className={styles.iconWrap}>
            <Icon name={item.icon.name} size="sm" tone={iconTone} />
          </span>
        ) : null}
        {item.value ? <Heading as="h3" size="md">{item.value}</Heading> : null}
      </div>

      {item.label ? <Text>{item.label}</Text> : null}
      {item.subtext ? <Text tone="secondary">{item.subtext}</Text> : null}
      {hasBadge ? (
        <div className={styles.badgeRow}>
          <Badge tone={item.badge.tone || "neutral"} size="sm">{item.badge.text}</Badge>
        </div>
      ) : null}
    </Card>
  );
}

export default function StatsSection({
  variant = "cards",
  eyebrow,
  title,
  description,
  ctas = [],
  columns = "3",
  align = "left",
  density = "comfortable",
  items = [],
}) {
  const normalizedVariant = variant === "split" ? "split" : "cards";
  const normalizedColumns = ["2", "3", "4"].includes(String(columns)) ? String(columns) : "3";
  const normalizedAlign = align === "center" ? "center" : "left";
  const normalizedDensity = density === "compact" ? "compact" : "comfortable";
  const normalizedItems = normalizeItems(items);
  const normalizedCtas = normalizeCtas(ctas);

  return (
    <Section className={[styles.root, styles[`variant_${normalizedVariant}`] || ""].join(" ")}>
      <div className={styles.content}>
        <SectionHeader
          eyebrow={eyebrow}
          title={title}
          description={description}
          actions={normalizedCtas.length ? (
            <div className={styles.actions}>
              {normalizedCtas.map((cta, index) => {
                const external = /^https?:\/\//i.test(cta.href);
                return (
                  <Button
                    key={`${cta.label}-${cta.href}-${index}`}
                    href={cta.href}
                    external={external}
                    variant={index === 0 ? "primary" : "secondary"}
                  >
                    {cta.label}
                  </Button>
                );
              })}
            </div>
          ) : null}
        />
      </div>

      <div className={[styles.grid, styles[`columns_${normalizedColumns}`] || ""].join(" ")}>
        {normalizedItems.map((item) => (
          <StatCard
            key={item.id}
            item={item}
            align={normalizedAlign}
            density={normalizedDensity}
          />
        ))}
      </div>
    </Section>
  );
}
