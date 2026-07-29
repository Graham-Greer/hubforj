import styles from "./SectionHeader.module.css";

const headingTagNames = {
  1: "h1",
  2: "h2",
  3: "h3",
};

const headingLevelClassNames = {
  1: styles.headingLevel1,
  2: styles.headingLevel2,
  3: styles.headingLevel3,
};

const alignClassNames = {
  start: styles.alignStart,
  center: styles.alignCenter,
};

const widthClassNames = {
  default: styles.widthDefault,
  narrow: styles.widthNarrow,
  wide: styles.widthWide,
};

export default function SectionHeader({
  eyebrow,
  title,
  description,
  align = "start",
  width = "default",
  headingLevel = 2,
  id,
  className = "",
  eyebrowClassName = "",
  titleClassName = "",
  descriptionClassName = "",
}) {
  const HeadingTag = headingTagNames[headingLevel] || "h2";

  return (
    <div
      id={id}
      className={[
        styles.root,
        alignClassNames[align] || alignClassNames.start,
        widthClassNames[width] || widthClassNames.default,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {eyebrow ? <p className={[styles.eyebrow, eyebrowClassName].filter(Boolean).join(" ")}>{eyebrow}</p> : null}
      <HeadingTag
        className={[
          styles.title,
          headingLevelClassNames[headingLevel] || headingLevelClassNames[2],
          titleClassName,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {title}
      </HeadingTag>
      {description ? <p className={[styles.description, descriptionClassName].filter(Boolean).join(" ")}>{description}</p> : null}
    </div>
  );
}
