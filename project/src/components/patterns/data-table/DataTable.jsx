import EmptyState from "../../ui/empty-state/EmptyState";
import ErrorState from "../../ui/error-state/ErrorState";
import SkeletonText from "../../ui/skeleton/SkeletonText";
import Pagination from "../../ui/pagination/Pagination";
import styles from "./DataTable.module.css";

export default function DataTable({
  columns = [],
  rows = [],
  loading = false,
  error,
  empty,
  page,
  pageSize,
  total,
  onPageChange,
  variant = "default",
}) {
  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <SkeletonText lines={6} />
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Could not load table" body={error} onRetry={() => onPageChange?.(page || 1)} />;
  }

  if (!rows.length) {
    return empty || <EmptyState title="No records" body="Try adjusting your filters." variant="compact" />;
  }

  return (
    <div className={[styles.root, styles[`variant_${variant}`]].join(" ")}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id || index}>
              {columns.map((column) => (
                <td key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {typeof page === "number" && typeof pageSize === "number" && typeof total === "number" ? (
        <Pagination page={page} pageSize={pageSize} total={total} onChange={onPageChange} />
      ) : null}
    </div>
  );
}
