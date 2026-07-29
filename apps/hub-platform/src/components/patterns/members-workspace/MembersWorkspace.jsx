"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import CompactMenu from "@/components/ui/compact-menu/CompactMenu";
import EmptyState from "@/components/patterns/empty-state/EmptyState";
import Icon from "@/components/ui/icon/Icon";
import PaginationControls from "@/components/patterns/pagination-controls/PaginationControls";
import SearchField from "@/components/ui/search-field/SearchField";
import Surface from "@/components/primitives/surface/Surface";
import StatCard from "@/components/ui/stat-card/StatCard";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  buildFilterStateFromSearchParams,
  buildMembersQuery,
  filterMembers,
} from "./members-workspace-helpers";
import styles from "./MembersWorkspace.module.css";

function buildFilterMenuItems(filter, currentValue, onSelect) {
  return filter.options.map((option) => ({
    value: option.value,
    label: option.label,
    active: currentValue === option.value,
    onSelect,
  }));
}

function getActiveFilterLabel(filter, currentValue) {
  return filter.options.find((option) => option.value === currentValue)?.label || filter.options[0]?.label || "All";
}

function escapeCsvValue(value) {
  const normalizedValue = String(value ?? "");
  return `"${normalizedValue.replace(/"/g, '""')}"`;
}

function formatLastSignedInForCsv(value) {
  const normalizedValue = String(value || "").trim();

  if (!normalizedValue) {
    return "";
  }

  const date = new Date(normalizedValue);

  if (Number.isNaN(date.getTime())) {
    return normalizedValue;
  }

  return date.toISOString().slice(0, 10);
}

function MemberRow({ item, membersQuery = "" }) {
  return (
    <Link href={`${item.href}${membersQuery}`} className={styles.rowLink}>
      <Surface padding="md" className={styles.row}>
        <div className={styles.rowMain}>
          <div className={styles.identity}>
            <span className={styles.name}>{item.name}</span>
            <span className={styles.summary}>{item.membershipSummary}</span>
          </div>
          <div className={styles.rowMeta}>
            <div className={styles.badges}>
              {item.badges?.map((badge) => (
                <Badge key={`${item.id}:${badge.label}`} tone={badge.tone} size="sm">
                  {badge.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </Surface>
    </Link>
  );
}

export default function MembersWorkspace({ items = [], summary, filterDefinitions = [], hubSlug = "" }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get("q") || "");
  const [activeFilters, setActiveFilters] = useState(() => buildFilterStateFromSearchParams(filterDefinitions, searchParams));
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);

  useEffect(() => {
    const nextQuery = buildMembersQuery(debouncedSearchTerm, activeFilters, filterDefinitions);
    const nextHref = `${pathname}${nextQuery}`;
    const currentHref = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

    if (nextHref !== currentHref) {
      router.replace(nextHref, { scroll: false });
    }
  }, [activeFilters, debouncedSearchTerm, filterDefinitions, pathname, router, searchParams]);

  const filteredItems = useMemo(
    () => filterMembers(items, deferredSearchTerm, activeFilters, filterDefinitions),
    [activeFilters, deferredSearchTerm, filterDefinitions, items]
  );
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedItems = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return filteredItems.slice(startIndex, startIndex + pageSize);
  }, [filteredItems, pageSize, safeCurrentPage]);
  const membersQuery = buildMembersQuery(debouncedSearchTerm, activeFilters, filterDefinitions);

  const hasActiveFilters = filterDefinitions.some((filter) => (activeFilters[filter.key] || "all") !== "all");

  function handleExportCsv() {
    const rows = [
      ["Name", "Email", "Membership", "Last sign in date"],
      ...filteredItems.map((item) => [
        item.name || "",
        item.email || "",
        item.membershipSummary || "",
        formatLastSignedInForCsv(item.lastSignedInAt),
      ]),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map(escapeCsvValue).join(",")).join("\n")}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = objectUrl;
    link.download = `${hubSlug || "members"}-members.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(objectUrl);
  }

  return (
    <div className={styles.root}>
      <div className={styles.stats}>
        <StatCard label="Members" value={String(summary.total)} detail="Member records in this hub." />
        <StatCard label="Suspended" value={String(summary.suspended)} detail="Members currently blocked from normal access." />
        <StatCard label="Upgrade requests" value={String(summary.upgradeRequests)} detail="Pending plan changes awaiting review." />
        <StatCard label="Payment attention" value={String(summary.paymentAttention)} detail="Members with unpaid or overdue obligations." />
      </div>

      <div className={styles.toolbar} data-onboarding="members-list-toolbar">
        <div className={styles.toolbarControls}>
          <SearchField
            name="admin-members-search"
            label="Search members"
            labelVisibility="hidden"
            size="sm"
            placeholder="Search members"
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setCurrentPage(1);
            }}
            className={styles.search}
          />

          <div className={styles.toolbarMenus}>
            {filterDefinitions.map((filter) => (
              <CompactMenu
                key={filter.key}
                triggerAriaLabel={`Filter members by ${filter.label.toLowerCase()}`}
                triggerTooltip={filter.label}
                items={buildFilterMenuItems(filter, activeFilters[filter.key], (value) =>
                  {
                    setActiveFilters((current) => ({
                      ...current,
                      [filter.key]: value,
                    }));
                    setCurrentPage(1);
                  }
                )}
              >
                <Icon name={filter.icon || "filter_alt"} size="sm" decorative />
                <span>{getActiveFilterLabel(filter, activeFilters[filter.key])}</span>
              </CompactMenu>
            ))}
            <Button type="button" variant="secondary" size="sm" onClick={handleExportCsv} disabled={!filteredItems.length}>
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {filteredItems.length ? (
        <div className={styles.listSection}>
          <PaginationControls
            totalCount={filteredItems.length}
            currentPage={safeCurrentPage}
            pageSize={pageSize}
            pageSizeOptions={[5, 10, 20]}
            itemLabel="members"
            onPageChange={setCurrentPage}
            onPageSizeChange={(value) => {
              setPageSize(value);
              setCurrentPage(1);
            }}
          />

          <div className={styles.list} data-onboarding="members-list-records">
            {paginatedItems.map((item) => (
              <MemberRow key={item.id} item={item} membersQuery={membersQuery} />
            ))}
          </div>
        </div>
      ) : (
        <div data-onboarding="members-list-records">
          <EmptyState
            eyebrow="No matching members"
            title="No members match the current view"
            description={
              hasActiveFilters || deferredSearchTerm
                ? "Try a different search term or widen one of the filters."
                : "There are no member records to show right now."
            }
          />
        </div>
      )}
    </div>
  );
}
