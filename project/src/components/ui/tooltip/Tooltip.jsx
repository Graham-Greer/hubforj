"use client";

import { useId, useState } from "react";
import styles from "./Tooltip.module.css";

export default function Tooltip({ content, children, placement = "top" }) {
  const tooltipId = useId();
  const [open, setOpen] = useState(false);

  return (
    <span
      className={styles.root}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpen(false);
      }}
      aria-describedby={open ? tooltipId : undefined}
    >
      {children}
      {open ? (
        <span id={tooltipId} role="tooltip" className={[styles.tip, styles[`placement_${placement}`]].join(" ")}>
          {content}
        </span>
      ) : null}
    </span>
  );
}
