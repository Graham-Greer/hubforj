"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import Button from "@/components/ui/button/Button";
import Icon from "@/components/ui/icon/Icon";
import styles from "./CompactMenu.module.css";

export default function CompactMenu({
  items = [],
  align = "end",
  children,
  triggerAriaLabel,
  triggerTooltip = "",
  className = "",
  menuClassName = "",
  triggerClassName = "",
  triggerVariant = "ghost",
  triggerSize = "sm",
  triggerProps = {},
}) {
  const [open, setOpen] = useState(false);
  const [resolvedAlign, setResolvedAlign] = useState(align === "start" ? "start" : "end");
  const [verticalDirection, setVerticalDirection] = useState("down");
  const rootRef = useRef(null);
  const menuRef = useRef(null);
  const tooltipId = useId();
  const hasSelectableItems = items.some((item) => typeof item.active === "boolean");

  useLayoutEffect(() => {
    if (!open) {
      return undefined;
    }

    let frameId = 0;

    function updatePlacement() {
      const root = rootRef.current;
      const menu = menuRef.current;
      if (!root || !menu) {
        return;
      }

      const rootRect = root.getBoundingClientRect();
      const menuWidth = menu.offsetWidth;
      const menuHeight = menu.offsetHeight;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const gap = 8;

      const spaceBelow = viewportHeight - rootRect.bottom - gap;
      const spaceAbove = rootRect.top - gap;
      const shouldOpenUp = spaceBelow < menuHeight && spaceAbove >= menuHeight;

      const preferredAlign = align === "start" ? "start" : "end";
      const startLeft = rootRect.left;
      const endLeft = rootRect.right - menuWidth;
      const startRight = startLeft + menuWidth;
      const endRight = rootRect.right;

      const startFits = startLeft >= gap && startRight <= viewportWidth - gap;
      const endFits = endLeft >= gap && endRight <= viewportWidth - gap;

      setVerticalDirection(shouldOpenUp ? "up" : "down");

      if (preferredAlign === "start") {
        if (startFits || !endFits) {
          setResolvedAlign("start");
        } else {
          setResolvedAlign("end");
        }
      } else {
        if (endFits || !startFits) {
          setResolvedAlign("end");
        } else {
          setResolvedAlign("start");
        }
      }
    }

    frameId = window.requestAnimationFrame(updatePlacement);
    window.addEventListener("resize", updatePlacement);
    window.addEventListener("scroll", updatePlacement, true);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", updatePlacement);
      window.removeEventListener("scroll", updatePlacement, true);
    };
  }, [align, open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={[styles.root, className].filter(Boolean).join(" ")}>
      <Button
        type="button"
        variant={triggerVariant}
        size={triggerSize}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={triggerAriaLabel}
        aria-describedby={triggerTooltip ? tooltipId : undefined}
        className={[styles.trigger, triggerClassName].filter(Boolean).join(" ")}
        onClick={() => {
          if (!open) {
            setResolvedAlign(align === "start" ? "start" : "end");
            setVerticalDirection("down");
          }

          setOpen((current) => !current);
        }}
        {...triggerProps}
      >
        {children}
      </Button>

      {triggerTooltip ? (
        <div id={tooltipId} role="tooltip" className={styles.tooltip}>
          {triggerTooltip}
        </div>
      ) : null}

      {open ? (
        <div
          ref={menuRef}
          className={[
            styles.menu,
            resolvedAlign === "start" ? styles.alignStart : styles.alignEnd,
            verticalDirection === "up" ? styles.openUp : styles.openDown,
            menuClassName,
          ].filter(Boolean).join(" ")}
          role="menu"
        >
          <div className={styles.list}>
            {items.map((item) => (
              <button
                key={item.value || item.href || item.label}
                type="button"
                role={hasSelectableItems ? "menuitemradio" : "menuitem"}
                aria-checked={hasSelectableItems ? item.active : undefined}
                className={item.active ? styles.itemActive : styles.item}
                onClick={() => {
                  item.onSelect?.(item.value);
                  setOpen(false);
                }}
                disabled={item.disabled}
              >
                <span>{item.label}</span>
                {hasSelectableItems && item.active ? <Icon name="check" size="sm" tone="accent" decorative /> : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
