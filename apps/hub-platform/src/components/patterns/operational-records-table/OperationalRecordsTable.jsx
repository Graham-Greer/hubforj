"use client";

import { useDeferredValue, useMemo, useState } from "react";
import CompactMenu from "@/components/ui/compact-menu/CompactMenu";
import EmptyState from "@/components/patterns/empty-state/EmptyState";
import PaginationControls from "@/components/patterns/pagination-controls/PaginationControls";
import Surface from "@/components/primitives/surface/Surface";
import Icon from "@/components/ui/icon/Icon";
import SearchField from "@/components/ui/search-field/SearchField";
import { filterOperationalRecords } from "./operational-records-helpers";
import styles from "./OperationalRecordsTable.module.css";

export default function OperationalRecordsTable({
  records = [],
  columns = [],
  searchFields = [],
  searchLabel = "Search records",
  searchPlaceholder = "Search",
  filters = [],
  emptyState,
  gridTemplateColumns,
  getRecordKey,
  pagination = null,
  rowTone = "muted",
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [activeFilters, setActiveFilters] = useState(() =>
    Object.fromEntries(filters.map((filter) => [filter.key, filter.options[0]?.value || "all"]))
  );
  const [pageSize, setPageSize] = useState(Number(pagination?.defaultPageSize) || 10);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredRecords = filterOperationalRecords(records, deferredSearchTerm, searchFields, activeFilters, filters);
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedRecords = useMemo(() => {
    if (!pagination) {
      return filteredRecords;
    }

    const startIndex = (safeCurrentPage - 1) * pageSize;
    return filteredRecords.slice(startIndex, startIndex + pageSize);
  }, [filteredRecords, pageSize, pagination, safeCurrentPage]);
  function buildFilterMenuItems(filter) {
    return filter.options.map((option) => ({
      value: option.value,
      label: option.label,
      active: activeFilters[filter.key] === option.value,
      onSelect: (value) => {
        setActiveFilters((current) => ({
          ...current,
          [filter.key]: value,
        }));
        setCurrentPage(1);
      },
    }));
  }

  function getActiveFilterLabel(filter) {
    return filter.options.find((option) => option.value === activeFilters[filter.key])?.label || filter.options[0]?.label || "All";
  }

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarControls}>
          <SearchField
            label={searchLabel}
            labelVisibility="hidden"
            size="sm"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setCurrentPage(1);
            }}
            className={styles.search}
          />

          {filters.length ? (
            <div className={styles.filterMenus}>
              {filters.map((filter) => (
                <CompactMenu
                  key={filter.key}
                  triggerAriaLabel={`Filter records by ${filter.label.toLowerCase()}`}
                  triggerTooltip={filter.label}
                  items={buildFilterMenuItems(filter)}
                >
                  <Icon name={filter.icon || "filter_alt"} size="sm" decorative />
                  <span>{getActiveFilterLabel(filter)}</span>
                </CompactMenu>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {filteredRecords.length ? (
        <>
          {pagination ? (
            <PaginationControls
              totalCount={filteredRecords.length}
              currentPage={safeCurrentPage}
              pageSize={pageSize}
              pageSizeOptions={pagination.pageSizeOptions || [5, 10, 20]}
              itemLabel={pagination.itemLabel || "items"}
              onPageChange={setCurrentPage}
              onPageSizeChange={(value) => {
                setPageSize(value);
                setCurrentPage(1);
              }}
            />
          ) : null}
        <div className={styles.tableWrap} style={{ "--records-grid-columns": gridTemplateColumns }}>
          <div className={styles.tableHeader} role="row">
            {columns.map((column) => (
              <span key={column.key}>{column.label}</span>
            ))}
          </div>

          <div className={styles.tableBody}>
            {paginatedRecords.map((record) => (
              <Surface key={getRecordKey(record)} as="div" tone={rowTone} padding="none" className={styles.tableRow} role="row">
                {columns.map((column) => (
                  <div
                    key={column.key}
                    className={`${styles.cell} ${column.isActions && column.align !== "start" ? styles.actionsCell : ""} ${column.align === "end" ? styles.cellAlignEnd : ""} ${column.align === "start" ? styles.cellAlignStart : ""}`.trim()}
                  >
                    <span className={styles.mobileLabel}>{column.label}</span>
                    {column.render(record, { primaryClassName: styles.primaryValue, secondaryClassName: styles.secondaryValue })}
                  </div>
                ))}
              </Surface>
            ))}
          </div>
        </div>
        </>
      ) : (
        <EmptyState {...emptyState} />
      )}
    </div>
  );
}
