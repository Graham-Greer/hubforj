import styles from "./Surface.module.css";

const toneClassNames = {
  default: styles.toneDefault,
  accent: styles.toneAccent,
  muted: styles.toneMuted,
};

const paddingClassNames = {
  none: styles.paddingNone,
  sm: styles.paddingSm,
  md: styles.paddingMd,
  lg: styles.paddingLg,
  xl: styles.paddingXl,
};

export default function Surface({
  as: Tag = "section",
  tone = "default",
  padding = "lg",
  className = "",
  children,
  ...props
}) {
  const toneClassName = toneClassNames[tone] || toneClassNames.default;
  const paddingClassName = paddingClassNames[padding] || paddingClassNames.lg;
  const classes = [styles.root, toneClassName, paddingClassName, className].filter(Boolean).join(" ");

  return (
    <Tag className={classes} {...props}>
      {children}
    </Tag>
  );
}
