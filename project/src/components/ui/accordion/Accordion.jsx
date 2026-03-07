"use client";

import { useId, useState } from "react";
import Icon from "../../primitives/icon/Icon";
import styles from "./Accordion.module.css";

export default function Accordion({ items = [], type = "single", defaultOpen = [], variant = "compact" }) {
  const baseId = useId();
  const initialOpenKeys = (() => {
    const normalized = Array.isArray(defaultOpen) ? defaultOpen : [defaultOpen];
    const filtered = normalized.filter(Boolean);
    if (type === "single") {
      return new Set(filtered.slice(0, 1));
    }
    return new Set(filtered);
  })();
  const [openKeys, setOpenKeys] = useState(initialOpenKeys);

  const toggle = (key) => {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
        return next;
      }
      if (type === "single") return new Set([key]);
      next.add(key);
      return next;
    });
  };

  const onTriggerKeyDown = (event, index) => {
    const key = event.key;
    let nextIndex = index;
    if (key === "ArrowDown") nextIndex = (index + 1) % items.length;
    else if (key === "ArrowUp") nextIndex = (index - 1 + items.length) % items.length;
    else if (key === "Home") nextIndex = 0;
    else if (key === "End") nextIndex = items.length - 1;
    else return;

    event.preventDefault();
    const nextId = `${baseId}-trigger-${items[nextIndex]?.value}`;
    const target = document.getElementById(nextId);
    target?.focus();
  };

  return (
    <div className={[styles.root, styles[`variant_${variant}`]].join(" ")}>
      {items.map((item, index) => {
        const triggerId = `${baseId}-trigger-${item.value}`;
        const panelId = `${baseId}-panel-${item.value}`;
        const open = openKeys.has(item.value);
        return (
          <section key={item.value} className={styles.item}>
            <button
              id={triggerId}
              type="button"
              className={styles.trigger}
              onClick={() => toggle(item.value)}
              onKeyDown={(event) => onTriggerKeyDown(event, index)}
              aria-expanded={open}
              aria-controls={panelId}
            >
              <span>{item.label}</span>
              <Icon name={open ? "expand_less" : "expand_more"} decorative />
            </button>
            {open ? (
              <div id={panelId} className={styles.content} role="region" aria-labelledby={triggerId}>
                {item.content}
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
