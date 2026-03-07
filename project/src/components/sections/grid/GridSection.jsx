import Heading from "@/components/primitives/heading/Heading";
import Text from "@/components/primitives/text/Text";
import SectionHeader from "@/components/patterns/section-header/SectionHeader";
import Section from "@/components/patterns/section/Section";
import Card from "@/components/ui/card/Card";
import Badge from "@/components/ui/badge/Badge";
import AppImage from "@/components/ui/image/AppImage";
import styles from "./GridSection.module.css";

function normalizeItems(items) {
  const source = Array.isArray(items) ? items : [];
  return source
    .map((item) => (item && typeof item === "object" ? item : {}))
    .map((item, index) => ({
      id: String(item.id || `grid_item_${index + 1}`).trim(),
      title: String(item.title || "").trim(),
      description: String(item.description || "").trim(),
      media: item.media && typeof item.media === "object"
        ? {
          imageMediaId: String(item.media.imageMediaId || "").trim(),
          alt: String(item.media.alt || "").trim(),
        }
        : { imageMediaId: "", alt: "" },
      badge: item.badge && typeof item.badge === "object"
        ? {
          text: String(item.badge.text || "").trim(),
          tone: String(item.badge.tone || "neutral").trim() || "neutral",
        }
        : null,
    }));
}

function GridCard({ item, mediaById, lead = false, align = "left", density = "comfortable" }) {
  const selectedMedia = item.media.imageMediaId ? mediaById?.get(item.media.imageMediaId) : null;
  const mediaUrl = selectedMedia?.publicUrl || "";
  const mediaAlt = item.media.alt || selectedMedia?.alt || item.title || "Grid card image";
  const hasBadge = item.badge?.text;

  return (
    <Card className={[styles.card, styles[`density_${density}`] || "", lead ? styles.cardLead : ""].join(" ")}>
      {mediaUrl ? (
        <div className={styles.cardMedia}>
          <AppImage
            src={mediaUrl}
            alt={mediaAlt}
            width={800}
            height={500}
            sizes={lead ? "(max-width: 960px) 100vw, 40vw" : "(max-width: 960px) 100vw, 25vw"}
          />
        </div>
      ) : null}
      <div className={[styles.cardBody, styles[`align_${align}`] || ""].join(" ")}>
        {hasBadge ? <Badge tone={item.badge.tone || "neutral"} size="sm">{item.badge.text}</Badge> : null}
        {item.title ? <Heading as="h3" size={lead ? "md" : "sm"}>{item.title}</Heading> : null}
        {item.description ? <Text tone="secondary">{item.description}</Text> : null}
      </div>
    </Card>
  );
}

export default function GridSection({
  eyebrow,
  title,
  description,
  layout = "grid",
  columns = "3",
  align = "left",
  density = "comfortable",
  items = [],
  mediaById,
}) {
  const normalizedLayout = layout === "lead" ? "lead" : "grid";
  const normalizedColumns = ["2", "3", "4"].includes(String(columns)) ? String(columns) : "3";
  const normalizedAlign = align === "center" ? "center" : "left";
  const normalizedDensity = density === "compact" ? "compact" : "comfortable";
  const normalizedItems = normalizeItems(items);

  const leadItem = normalizedLayout === "lead" ? normalizedItems[0] || null : null;
  const gridItems = normalizedLayout === "lead" ? normalizedItems.slice(leadItem ? 1 : 0) : normalizedItems;

  return (
    <Section className={styles.root}>
      <SectionHeader eyebrow={eyebrow} title={title} description={description} />

      {leadItem ? (
        <div className={styles.leadWrap}>
          <GridCard
            item={leadItem}
            mediaById={mediaById}
            lead
            align={normalizedAlign}
            density={normalizedDensity}
          />
        </div>
      ) : null}

      <div className={[styles.grid, styles[`columns_${normalizedColumns}`] || ""].join(" ")}>
        {gridItems.map((item) => (
          <GridCard
            key={item.id}
            item={item}
            mediaById={mediaById}
            align={normalizedAlign}
            density={normalizedDensity}
          />
        ))}
      </div>
    </Section>
  );
}
