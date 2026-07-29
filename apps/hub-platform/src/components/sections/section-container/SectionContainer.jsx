import styles from "./SectionContainer.module.css";

const widthClassNames = {
  full: styles.widthFull,
  wide: styles.widthWide,
  default: styles.widthDefault,
  narrow: styles.widthNarrow,
};

export default function SectionContainer({ width = "default", className = "", children }) {
  return (
    <div className={[styles.root, widthClassNames[width] || widthClassNames.default, className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}
