import { Children } from "react";
import styles from "./SectionItemsGrid.module.css";

const maxColumnClassNames = {
  2: styles.maxColumns2,
  3: styles.maxColumns3,
};

const itemCountClassNames = {
  1: styles.itemCount1,
  2: styles.itemCount2,
  4: styles.itemCount4,
};

export default function SectionItemsGrid({
  as: Component = "div",
  children,
  className = "",
  maxColumns = 3,
  singleItemLayout = "full",
  ...props
}) {
  const items = Children.toArray(children);
  const normalizedMaxColumns = maxColumns === 2 ? 2 : 3;
  const itemCount = items.length;

  return (
    <Component
      className={[
        styles.root,
        maxColumnClassNames[normalizedMaxColumns],
        itemCountClassNames[itemCount] || "",
        singleItemLayout === "compact" ? styles.singleItemCompact : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {items}
    </Component>
  );
}
