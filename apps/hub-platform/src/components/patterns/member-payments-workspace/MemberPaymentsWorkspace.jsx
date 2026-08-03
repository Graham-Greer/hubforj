"use client";

import { useMemo, useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import EmptyState from "@/components/patterns/empty-state/EmptyState";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import SectionSearchFilters from "@/components/sections/primitives/section-search-filters/SectionSearchFilters";
import Surface from "@/components/primitives/surface/Surface";
import StatCard from "@/components/ui/stat-card/StatCard";
import { buildHubRuntimeHref } from "@/lib/domain/hub-runtime-paths";
import styles from "./MemberPaymentsWorkspace.module.css";

const filterOptions = [
  { value: "all", label: "All" },
  { value: "membership", label: "Membership" },
  { value: "event", label: "Events" },
  { value: "course", label: "Courses" },
];

function filterItems(items, searchValue, activeFilter) {
  const query = String(searchValue || "").trim().toLowerCase();

  return items.filter((item) => {
    if (activeFilter !== "all" && item.kind !== activeFilter) {
      return false;
    }

    if (!query) {
      return true;
    }

    const haystack = [item.title, item.typeLabel, item.detail, item.amountLabel, item.dateLabelPrefix, item.dateLabel].join(" ").toLowerCase();
    return haystack.includes(query);
  });
}

export default function MemberPaymentsWorkspace({ hub, items, showHeader = true }) {
  const routeMode = hub?.routeMode || "path";
  const [searchValue, setSearchValue] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const filteredItems = useMemo(
    () => filterItems(items, searchValue, activeFilter),
    [activeFilter, items, searchValue]
  );
  const summary = useMemo(() => {
    const actionRequired = filteredItems.filter((item) =>
      ["unpaid", "overdue", "failed", "pending"].includes(String(item.status || ""))
    ).length;
    const settled = filteredItems.filter((item) =>
      ["paid", "not_required"].includes(String(item.status || ""))
    ).length;

    return {
      total: filteredItems.length,
      actionRequired,
      settled,
    };
  }, [filteredItems]);

  if (!items.length) {
    return (
      <div className={styles.root}>
        {showHeader ? (
          <PageHeader
            eyebrow="Member account"
            title="Billing"
            description="Review membership, event, and course payment activity in one place."
          />
        ) : null}
        <EmptyState
          eyebrow="Payments"
          title="No payment activity yet"
          description="As soon as membership renewals or paid bookings exist for this account, they will appear here."
          primaryAction={{ href: buildHubRuntimeHref(hub.slug, "/events", routeMode), label: "Browse events" }}
          secondaryAction={{ href: buildHubRuntimeHref(hub.slug, "/account", routeMode), label: "Back to account" }}
        />
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {showHeader ? (
        <PageHeader
          eyebrow="Member account"
          title="Billing"
          description="Review membership, event, and course payment activity in one place."
        />
      ) : null}

      <div className={styles.stats}>
        <StatCard tone="default" label="Payment items" value={String(summary.total)} detail="Visible billing records on your account." />
        <StatCard tone="default" label="Action required" value={String(summary.actionRequired)} detail="Items still unpaid or needing follow-up." />
        <StatCard tone="default" label="Settled" value={String(summary.settled)} detail="Items already paid or not requiring payment." />
      </div>

      <div className={styles.toolbar}>
        <SectionSearchFilters
          searchName="member-billing-search"
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          searchPlaceholder="Search billing"
          searchLabel="Search billing"
          filterOptions={filterOptions}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          filterTriggerLabel="Filter billing"
          filterMenuLabel="Billing filters"
          className={styles.searchFilters}
        />
      </div>

      <p className={styles.resultsCount}>
        {`${filteredItems.length} billing item${filteredItems.length === 1 ? "" : "s"} shown`}
      </p>

      {!filteredItems.length ? (
        <Surface className={styles.emptySurface}>
          <div className={styles.emptyBlock}>
            <h2 className={styles.emptyTitle}>No matching billing items</h2>
            <p className={styles.emptyDescription}>Try a different search or reset the type filter.</p>
          </div>
        </Surface>
      ) : (
        <div className={styles.list}>
          {filteredItems.map((item) => (
            <Surface key={item.id} as="article" padding="md" className={styles.card}>
              <div className={styles.itemHeader}>
                <div className={styles.itemCopy}>
                  <h2 className={styles.itemTitle}>{item.title}</h2>
                  <p className={styles.itemMeta}>
                    {item.dateLabelPrefix ? `${item.dateLabelPrefix}: ` : ""}
                    {item.dateLabel}
                  </p>
                  <p className={styles.itemMeta}>{item.amountLabel}</p>
                </div>
                <div className={styles.itemHeaderBadges}>
                  <Badge tone="neutral">{item.typeLabel}</Badge>
                  <Badge tone={item.statusTone}>{item.statusLabel}</Badge>
                </div>
              </div>

              {item.detail ? <p className={styles.itemMeta}>{item.detail}</p> : null}

              <div className={styles.itemActions}>
                <Button href={item.primaryAction.href} variant="secondary">
                  {item.primaryAction.label}
                </Button>
              </div>
            </Surface>
          ))}
        </div>
      )}
    </div>
  );
}
