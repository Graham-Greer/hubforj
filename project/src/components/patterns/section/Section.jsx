import Surface from "../../primitives/surface/Surface";
import styles from "./Section.module.css";

/**
 * Semantic wrapper for top-level page sections.
 * Visual styling controls (tone, border, radius, elevation, padding) are owned
 * by the Surface primitive and UI components, not by Section.
 */
export default function Section({
  as = "section",
  maxWidth = "none",
  children,
  className = "",
  ...rest
}) {
  const widthClass = maxWidth === "none" ? "" : styles.maxWidth;

  return (
    <Surface
      as={as}
      tone="none"
      border={false}
      elevation="none"
      radius="lg"
      padding="0"
      className={[widthClass, className].filter(Boolean).join(" ")}
      {...rest}
    >
      {children}
    </Surface>
  );
}
