"use client";

import Button from "@/components/ui/button/Button";
import CompactMenu from "@/components/ui/compact-menu/CompactMenu";
import Icon from "@/components/ui/icon/Icon";
import styles from "./PaginationControls.module.css";

export default function PaginationControls({
  totalCount = 0,
  currentPage = 1,
  pageSize = 5,
  pageSizeOptions = [5, 10],
  onPageChange,
  onPageSizeChange,
  itemLabel = "items",
  className = "",
}) {
  const safePageSize = Math.max(1, Number(pageSize) || 1);
  const safeTotalCount = Math.max(0, Number(totalCount) || 0);
  const totalPages = Math.max(1, Math.ceil(safeTotalCount / safePageSize));
  const safeCurrentPage = Math.min(Math.max(1, Number(currentPage) || 1), totalPages);
  const startItem = safeTotalCount ? (safeCurrentPage - 1) * safePageSize + 1 : 0;
  const endItem = safeTotalCount ? Math.min(safeCurrentPage * safePageSize, safeTotalCount) : 0;
  const classes = [styles.root, className].filter(Boolean).join(" ");
  const menuItems = pageSizeOptions.map((value) => ({
    value: String(value),
    label: `${value} per page`,
    active: safePageSize === value,
    onSelect: (nextValue) => onPageSizeChange?.(Number.parseInt(nextValue, 10) || safePageSize),
  }));

  return (
    <div className={classes}>
      <div className={styles.summary}>
        <p className={styles.summaryText}>
          {safeTotalCount
            ? `Showing ${startItem}-${endItem} of ${safeTotalCount} ${itemLabel}`
            : `No ${itemLabel} to show`}
        </p>
      </div>

      <div className={styles.controls}>
        <CompactMenu
          triggerAriaLabel="Change items per page"
          items={menuItems}
          className={styles.pageSizeMenu}
          triggerVariant="secondary"
          triggerSize="sm"
        >
          <Icon name="expand_more" size="sm" decorative />
          <span>{safePageSize} per page</span>
        </CompactMenu>

        <div className={styles.nav}>
          <span className={styles.pageText}>
            Page {safeCurrentPage} of {totalPages}
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onPageChange?.(safeCurrentPage - 1)}
            disabled={safeCurrentPage <= 1}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onPageChange?.(safeCurrentPage + 1)}
            disabled={safeCurrentPage >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
