import Heading from "../../primitives/heading/Heading";
import Text from "../../primitives/text/Text";
import styles from "./SectionHeader.module.css";

export default function SectionHeader({
  eyebrow,
  title,
  description,
  subtitle,
  actions,
  titleAs = "h2",
  titleSize = "md",
  align = "left",
  className = "",
}) {
  const resolvedEyebrow = String(eyebrow || "").trim();
  const resolvedTitle = String(title || "").trim();
  const resolvedDescription = String(description || subtitle || "").trim();
  const resolvedAlign = align === "center" ? "center" : "left";

  if (!resolvedEyebrow && !resolvedTitle && !resolvedDescription && !actions) {
    return null;
  }

  return (
    <header className={[styles.root, styles[`align_${resolvedAlign}`] || "", className].filter(Boolean).join(" ")}>
      <div className={styles.copy}>
        {resolvedEyebrow ? <Text as="p" className={styles.eyebrow}>{resolvedEyebrow}</Text> : null}
        {resolvedTitle ? <Heading as={titleAs} size={titleSize}>{resolvedTitle}</Heading> : null}
        {resolvedDescription ? <Text tone="secondary">{resolvedDescription}</Text> : null}
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </header>
  );
}
