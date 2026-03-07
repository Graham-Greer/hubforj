import Heading from "@/components/primitives/heading/Heading";
import Text from "@/components/primitives/text/Text";
import SectionHeader from "@/components/patterns/section-header/SectionHeader";
import Section from "@/components/patterns/section/Section";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Card from "@/components/ui/card/Card";
import AppImage from "@/components/ui/image/AppImage";
import styles from "./TeamSection.module.css";

const SOCIAL_ICON_BY_PLATFORM = {
  x: "alternate_email",
  linkedin: "business_center",
  facebook: "thumb_up",
};

function normalizeItems(items = []) {
  const source = Array.isArray(items) ? items : [];
  return source
    .map((item) => (item && typeof item === "object" ? item : {}))
    .map((item, index) => ({
      id: String(item.id || `person_${index + 1}`).trim(),
      name: String(item.name || "").trim(),
      role: String(item.role || "").trim(),
      bio: String(item.bio || "").trim(),
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
      socialLinks: Array.isArray(item.socialLinks)
        ? item.socialLinks
          .map((link) => (link && typeof link === "object" ? link : {}))
          .map((link, linkIndex) => ({
            id: String(link.id || `social_${linkIndex + 1}`).trim(),
            platform: String(link.platform || "x").trim() || "x",
            href: String(link.href || "").trim(),
          }))
          .filter((link) => link.href)
        : [],
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

function TeamCard({ item, mediaById, align = "left", density = "comfortable" }) {
  const selectedMedia = item.avatar.imageMediaId ? mediaById?.get(item.avatar.imageMediaId) : null;
  const avatarUrl = selectedMedia?.publicUrl || "";
  const avatarAlt = item.avatar.alt || selectedMedia?.alt || item.name || "Team member avatar";

  return (
    <Card className={[styles.card, styles[`align_${align}`] || "", styles[`density_${density}`] || ""].join(" ")}>
      {avatarUrl ? (
        <div className={styles.avatarWrap}>
          <AppImage
            src={avatarUrl}
            alt={avatarAlt}
            width={420}
            height={420}
            sizes="(max-width: 960px) 100vw, 25vw"
          />
        </div>
      ) : null}

      <div className={styles.cardBody}>
        {item.name ? <Heading as="h3" size="sm">{item.name}</Heading> : null}
        {item.role ? <Text weight="semibold">{item.role}</Text> : null}
        {item.bio ? <Text tone="secondary">{item.bio}</Text> : null}

        {item.badge?.text ? (
          <div className={styles.badgeRow}>
            <Badge tone={item.badge.tone || "neutral"} size="sm">{item.badge.text}</Badge>
          </div>
        ) : null}

        {item.socialLinks.length ? (
          <div className={styles.socialRow}>
            {item.socialLinks.map((link, index) => {
              const iconName = SOCIAL_ICON_BY_PLATFORM[link.platform] || "link";
              const label = `${link.platform} profile for ${item.name || "team member"}`;
              return (
                <Button
                  key={`${link.id}-${index}`}
                  href={link.href}
                  external
                  variant="tertiary"
                  size="sm"
                  icon={iconName}
                  ariaLabel={label}
                />
              );
            })}
          </div>
        ) : null}
      </div>
    </Card>
  );
}

export default function TeamSection({
  eyebrow,
  title,
  description,
  ctas = [],
  columns = "3",
  align = "left",
  density = "comfortable",
  items = [],
  mediaById,
}) {
  const normalizedColumns = ["2", "3", "4"].includes(String(columns)) ? String(columns) : "3";
  const normalizedAlign = align === "center" ? "center" : "left";
  const normalizedDensity = density === "compact" ? "compact" : "comfortable";
  const normalizedItems = normalizeItems(items);
  const normalizedCtas = normalizeCtas(ctas);

  return (
    <Section className={styles.root}>
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

      <div className={[styles.grid, styles[`columns_${normalizedColumns}`] || ""].join(" ")}>
        {normalizedItems.map((item) => (
          <TeamCard
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
