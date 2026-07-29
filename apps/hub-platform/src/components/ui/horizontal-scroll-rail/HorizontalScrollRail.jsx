"use client";

import { useEffect, useRef } from "react";
import styles from "./HorizontalScrollRail.module.css";

export default function HorizontalScrollRail({
  children,
  className = "",
  activeItemSelector = '[data-active="true"]',
  activeItemKey = "",
}) {
  const viewportRef = useRef(null);

  useEffect(() => {
    if (!activeItemSelector) {
      return;
    }

    const viewport = viewportRef.current;
    const activeItem = viewport?.querySelector(activeItemSelector);

    if (!viewport || !activeItem) {
      return;
    }

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    activeItem.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }, [activeItemKey, activeItemSelector]);

  return (
    <div ref={viewportRef} className={[styles.viewport, className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}
