"use client";

import { useId, useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Icon from "@/components/primitives/icon/Icon";
import styles from "./DraggableAccordionItem.module.css";

export default function DraggableAccordionItem({
  title,
  subtitle = "",
  statusLabel = "",
  statusTone = "success",
  defaultOpen = false,
  dragHandleLabel = "Drag item",
  dragAttributes,
  dragListeners,
  dragDisabled = false,
  actionItems = [],
  children,
}) {
  const panelId = useId();
  const [open, setOpen] = useState(defaultOpen);
  const handleProps = dragDisabled ? {} : { ...dragAttributes, ...dragListeners };

  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <button
          type="button"
          className={styles.handle}
          aria-label={dragHandleLabel}
          disabled={dragDisabled}
          {...handleProps}
        >
          <Icon name="drag_indicator" size="md" tone="muted" decorative />
        </button>

        <button
          type="button"
          className={styles.trigger}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((prev) => !prev)}
        >
          <span className={styles.titleWrap}>
            <span className={styles.title}>{title}</span>
            {subtitle ? <span className={styles.subtitle}> - {subtitle}</span> : null}
          </span>
        </button>

        <div className={styles.meta}>
          {statusLabel ? (
            <Badge className={styles.statusBadge} size="sm" tone={statusTone}>
              {statusLabel}
            </Badge>
          ) : null}
          {actionItems.map((action) => (
            <Button
              key={action.key || action.icon}
              type="button"
              size="sm"
              variant={action.variant || "tertiary"}
              intent={action.intent || "neutral"}
              icon={action.icon}
              ariaLabel={action.ariaLabel}
              onClick={(event) => {
                event.stopPropagation();
                action.onClick?.();
              }}
            />
          ))}
          <Button
            type="button"
            size="sm"
            variant="tertiary"
            icon={open ? "expand_less" : "expand_more"}
            ariaLabel={open ? "Collapse item" : "Expand item"}
            onClick={() => setOpen((prev) => !prev)}
          />
        </div>
      </div>

      {open ? (
        <div id={panelId} className={styles.panel}>
          {children}
        </div>
      ) : null}
    </section>
  );
}
