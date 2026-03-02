"use client";

import Button from "../button/Button";
import styles from "./Pagination.module.css";

export default function Pagination({ page = 1, pageSize = 10, total = 0, onChange, variant = "full" }) {
  const pages = Math.max(Math.ceil(total / pageSize), 1);

  return (
    <nav className={styles.root} aria-label="Pagination">
      <Button variant="secondary" onClick={() => onChange?.(Math.max(page - 1, 1))} disabled={page <= 1}>
        Previous
      </Button>
      {variant === "full" ? <span className={styles.meta}>Page {page} of {pages}</span> : null}
      <Button variant="secondary" onClick={() => onChange?.(Math.min(page + 1, pages))} disabled={page >= pages}>
        Next
      </Button>
    </nav>
  );
}
