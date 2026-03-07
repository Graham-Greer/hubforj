import Heading from "@/components/primitives/heading/Heading";
import Text from "@/components/primitives/text/Text";
import SectionHeader from "@/components/patterns/section-header/SectionHeader";
import Section from "@/components/patterns/section/Section";
import Badge from "@/components/ui/badge/Badge";
import Card from "@/components/ui/card/Card";
import AppImage from "@/components/ui/image/AppImage";
import styles from "./TestimonialsSection.module.css";

function normalizeItems(items = []) {
  const source = Array.isArray(items) ? items : [];
  return source
    .map((item) => (item && typeof item === "object" ? item : {}))
    .map((item, index) => ({
      id: String(item.id || `testimonial_${index + 1}`).trim(),
      quote: String(item.quote || "").trim(),
      authorName: String(item.authorName || "").trim(),
      authorRole: String(item.authorRole || "").trim(),
      authorOrg: String(item.authorOrg || "").trim(),
      avatar: item.avatar && typeof item.avatar === "object"
        ? {
          imageMediaId: String(item.avatar.imageMediaId || "").trim(),
          alt: String(item.avatar.alt || "").trim(),
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

function buildAuthorMeta(item = {}) {
  const segments = [item.authorRole, item.authorOrg].filter(Boolean);
  return segments.join(", ");
}

function TestimonialCard({ item, mediaById, lead = false, align = "left", density = "comfortable" }) {
  const avatarMedia = item.avatar.imageMediaId ? mediaById?.get(item.avatar.imageMediaId) : null;
  const avatarUrl = avatarMedia?.publicUrl || "";
  const avatarAlt = item.avatar.alt || avatarMedia?.alt || item.authorName || "Testimonial author";
  const authorMeta = buildAuthorMeta(item);

  return (
    <Card
      className={[
        styles.card,
        lead ? styles.cardLead : "",
        styles[`align_${align}`] || "",
        styles[`density_${density}`] || "",
      ].join(" ")}
    >
      {avatarUrl ? (
        <div className={styles.avatarWrap}>
          <AppImage
            src={avatarUrl}
            alt={avatarAlt}
            width={360}
            height={360}
            sizes={lead ? "(max-width: 960px) 100vw, 16rem" : "(max-width: 960px) 100vw, 6rem"}
          />
        </div>
      ) : null}
      <div className={styles.cardBody}>
        {item.quote ? <Text>&quot;{item.quote}&quot;</Text> : null}
        {item.authorName ? <Text weight="semibold">{item.authorName}</Text> : null}
        {authorMeta ? <Text tone="secondary">{authorMeta}</Text> : null}
        {item.badge?.text ? (
          <div className={styles.badgeRow}>
            <Badge tone={item.badge.tone || "neutral"} size="sm">{item.badge.text}</Badge>
          </div>
        ) : null}
      </div>
    </Card>
  );
}

export default function TestimonialsSection({
  variant = "grid",
  eyebrow,
  title,
  description,
  columns = "3",
  align = "left",
  density = "comfortable",
  items = [],
  mediaById,
}) {
  const normalizedItems = normalizeItems(items);
  const normalizedVariant = variant === "lead" ? "lead" : "grid";
  const normalizedColumns = ["2", "3", "4"].includes(String(columns)) ? String(columns) : "3";
  const normalizedAlign = align === "center" ? "center" : "left";
  const normalizedDensity = density === "compact" ? "compact" : "comfortable";
  const leadItem = normalizedVariant === "lead" ? normalizedItems[0] : null;
  const supportingItems = normalizedVariant === "lead" ? normalizedItems.slice(1) : normalizedItems;

  return (
    <Section className={styles.root}>
      <SectionHeader eyebrow={eyebrow} title={title} description={description} />

      {leadItem ? (
        <TestimonialCard
          item={leadItem}
          mediaById={mediaById}
          lead
          align={normalizedAlign}
          density={normalizedDensity}
        />
      ) : null}

      <div className={[styles.grid, styles[`columns_${normalizedColumns}`] || ""].join(" ")}>
        {supportingItems.map((item) => (
          <TestimonialCard
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
