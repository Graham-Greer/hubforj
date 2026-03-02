import styles from "./FormGrid.module.css";

export default function FormGrid({ columns = 2, gap = "3", children }) {
  const colClass = styles[`cols_${columns}`] || styles.cols_2;
  const gapClass = styles[`gap_${gap}`] || styles.gap_3;

  return <div className={[styles.root, colClass, gapClass].join(" ")}>{children}</div>;
}
