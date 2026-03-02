import Surface from "../../primitives/surface/Surface";
import styles from "./Section.module.css";

export default function Section({ tone = "default", padding = "4", maxWidth = "layout", children, className = "" }) {
  const widthClass = maxWidth === "none" ? "" : styles.maxWidth;
  return (
    <Surface tone={tone} padding={padding} className={[widthClass, className].filter(Boolean).join(" ")}>
      {children}
    </Surface>
  );
}
