"use client";

import { useId, useState } from "react";
import Icon from "@/components/ui/icon/Icon";
import styles from "./Accordion.module.css";

function normalizeOpenIds(defaultOpenIds = [], allowMultiple = false, items = []) {
  const allowedIds = new Set(items.map((item) => item.id).filter(Boolean));
  const initialIds = defaultOpenIds.filter((id) => allowedIds.has(id));

  if (allowMultiple) {
    return initialIds;
  }

  return initialIds.length ? [initialIds[0]] : [];
}

export default function Accordion({
  items = [],
  allowMultiple = false,
  defaultOpenIds = [],
  className = "",
}) {
  const instanceId = useId();
  const visibleItems = Array.isArray(items)
    ? items.filter((item) => item?.id && item?.title && item?.content)
    : [];
  const [openIds, setOpenIds] = useState(() => normalizeOpenIds(defaultOpenIds, allowMultiple, visibleItems));

  if (!visibleItems.length) {
    return null;
  }

  return (
    <div className={[styles.root, className].filter(Boolean).join(" ")}>
      {visibleItems.map((item, index) => {
        const triggerId = `${instanceId}-trigger-${item.id || index}`;
        const panelId = `${instanceId}-panel-${item.id || index}`;
        const isOpen = openIds.includes(item.id);

        return (
          <article key={item.id || index} className={styles.item}>
            <h3 className={styles.heading}>
              <button
                type="button"
                id={triggerId}
                className={styles.trigger}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => {
                  setOpenIds((current) => {
                    if (allowMultiple) {
                      return current.includes(item.id)
                        ? current.filter((value) => value !== item.id)
                        : [...current, item.id];
                    }

                    return current.includes(item.id) ? [] : [item.id];
                  });
                }}
              >
                <span className={styles.title}>{item.title}</span>
                <span
                  className={[styles.iconWrap, isOpen ? styles.iconWrapOpen : ""].filter(Boolean).join(" ")}
                  aria-hidden="true"
                >
                  <Icon name="expand_more" size="md" className={styles.icon} />
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={triggerId}
              hidden={!isOpen}
              className={styles.panel}
            >
              <div className={styles.panelInner}>{item.content}</div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
