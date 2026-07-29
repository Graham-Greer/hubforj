import styles from "./SectionCard.module.css";

export default function SectionCard({
  as: Component = "article",
  className = "",
  padding = "default",
  children,
  ...props
}) {
  const paddingClassName = {
    default: styles.paddingDefault,
    compact: styles.paddingCompact,
    roomy: styles.paddingRoomy,
    none: styles.paddingNone,
  }[padding] || styles.paddingDefault;

  return (
    <Component className={[styles.root, paddingClassName, className].filter(Boolean).join(" ")} {...props}>
      {children}
    </Component>
  );
}
