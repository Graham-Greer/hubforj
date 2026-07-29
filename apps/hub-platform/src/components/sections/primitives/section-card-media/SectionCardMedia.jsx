import styles from "./SectionCardMedia.module.css";

export default function SectionCardMedia({
  as: Component = "div",
  className = "",
  bleed = "inset",
  children,
  ...props
}) {
  const bleedClassName = bleed === "flush" ? styles.bleedFlush : styles.bleedInset;

  return (
    <Component className={[styles.root, bleedClassName, className].filter(Boolean).join(" ")} {...props}>
      {children}
    </Component>
  );
}
