import styles from "./FormRow.module.css";

export default function FormRow({ gap = "3", align = "end", children }) {
  const gapClass = styles[`gap_${gap}`] || styles.gap_3;
  const alignClass = styles[`align_${String(align).replaceAll("-", "_")}`] || styles.align_end;

  return <div className={[styles.root, gapClass, alignClass].join(" ")}>{children}</div>;
}
