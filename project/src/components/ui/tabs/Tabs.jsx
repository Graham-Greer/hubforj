"use client";

import { useId, useMemo, useState } from "react";
import styles from "./Tabs.module.css";

export default function Tabs({ tabs = [], value, onChange, orientation = "horizontal" }) {
  const baseId = useId();
  const [internal, setInternal] = useState(() => value ?? tabs[0]?.value);
  const isControlled = value !== undefined;
  const active = isControlled ? value : internal;
  const activeIndex = useMemo(() => tabs.findIndex((tab) => tab.value === active), [active, tabs]);

  const activateAt = (index) => {
    if (index < 0 || index >= tabs.length) return;
    const next = tabs[index]?.value;
    if (next === undefined) return;
    if (!isControlled) setInternal(next);
    onChange?.(next);
  };

  const onTabKeyDown = (event, index) => {
    const isHorizontal = orientation !== "vertical";
    const key = event.key;
    let nextIndex = index;

    if ((isHorizontal && key === "ArrowRight") || (!isHorizontal && key === "ArrowDown")) {
      nextIndex = (index + 1) % tabs.length;
    } else if ((isHorizontal && key === "ArrowLeft") || (!isHorizontal && key === "ArrowUp")) {
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (key === "Home") {
      nextIndex = 0;
    } else if (key === "End") {
      nextIndex = tabs.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    activateAt(nextIndex);
  };

  return (
    <div
      className={[styles.root, styles[`orientation_${orientation}`]].join(" ")}
      role="tablist"
      aria-orientation={orientation === "vertical" ? "vertical" : "horizontal"}
    >
      {tabs.map((tab, index) => (
        // Render tab + panel pairing so aria-controls/labelledby are deterministic.
        <div key={tab.value} className={styles.item}>
          <button
            id={`${baseId}-tab-${tab.value}`}
            type="button"
            role="tab"
            aria-selected={active === tab.value}
            aria-controls={`${baseId}-panel-${tab.value}`}
            tabIndex={active === tab.value || (activeIndex === -1 && index === 0) ? 0 : -1}
            className={[styles.tab, active === tab.value ? styles.active : ""].join(" ")}
            onClick={() => activateAt(index)}
            onKeyDown={(event) => onTabKeyDown(event, index)}
          >
            {tab.label}
          </button>
          <div
            id={`${baseId}-panel-${tab.value}`}
            role="tabpanel"
            aria-labelledby={`${baseId}-tab-${tab.value}`}
            hidden={active !== tab.value}
            className={styles.panel}
          >
            {tab.content}
          </div>
        </div>
      ))}
    </div>
  );
}
