"use client";

import Image from "next/image";
import { useActionState, useDeferredValue, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import CompactMenu from "@/components/ui/compact-menu/CompactMenu";
import FormMessage from "@/components/ui/form-message/FormMessage";
import fieldStyles from "@/components/ui/field-control/FieldControl.module.css";
import Icon from "@/components/ui/icon/Icon";
import Modal from "@/components/ui/modal/Modal";
import EmptyState from "@/components/patterns/empty-state/EmptyState";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import PaginationControls from "@/components/patterns/pagination-controls/PaginationControls";
import Surface from "@/components/primitives/surface/Surface";
import SearchField from "@/components/ui/search-field/SearchField";
import SegmentedToggle from "@/components/ui/segmented-toggle/SegmentedToggle";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  buildFilterStateFromSearchParams,
  buildOfferingQuery,
  filterOfferingItems,
  filterOfferingItemsByTemporalView,
  normalizeTemporalView,
  sortOfferingItemsForTemporalView,
} from "./offering-admin-list-helpers";
import styles from "./OfferingAdminListWorkspace.module.css";

const initialDeleteActionState = {
  error: "",
};

const defaultTemporalViewOptions = [
  { value: "current", label: "Current" },
  { value: "history", label: "History" },
];

function appendOfferingQuery(href, offeringQuery) {
  if (!offeringQuery) {
    return href;
  }

  return `${href}${href.includes("?") ? offeringQuery.replace("?", "&") : offeringQuery}`;
}

function DeleteOfferingModal({ item, deleteAction, deleteConfirmLabel, onClose }) {
  const [state, formAction] = useActionState(deleteAction, initialDeleteActionState);

  return (
    <Modal
      title={item.deleteTitle || "Delete item"}
      onClose={onClose}
      actions={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <form action={formAction}>
            {Object.entries(item.deleteValues || {}).map(([key, value]) => (
              <input key={key} type="hidden" name={key} value={value} />
            ))}
            <Button type="submit" variant="secondary">
              {deleteConfirmLabel}
            </Button>
          </form>
        </>
      }
    >
      <div className={styles.deleteModalBody}>
        <p className={styles.deleteModalText}>{item.deleteDescription}</p>
        {item.deleteBlockedNote ? <p className={styles.deleteModalText}>{item.deleteBlockedNote}</p> : null}
        {state?.error ? <FormMessage tone="danger">{state.error}</FormMessage> : null}
      </div>
    </Modal>
  );
}

function OfferingRow({ item, offeringQuery = "", deleteAction = null, deleteConfirmLabel = "Delete item", temporalView = "current" }) {
  const router = useRouter();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const badges = temporalView === "history" && Array.isArray(item.historyBadges)
    ? item.historyBadges
    : temporalView === "current" && Array.isArray(item.currentBadges)
      ? item.currentBadges
      : item.badges;
  const menuItems = [
    item.primaryAction
      ? {
          value: "open",
          label: item.primaryAction.label,
          onSelect: () => router.push(appendOfferingQuery(item.primaryAction.href, offeringQuery)),
        }
      : null,
    item.secondaryAction
      ? {
          value: "edit",
          label: item.secondaryAction.label,
          onSelect: () => router.push(appendOfferingQuery(item.secondaryAction.href, offeringQuery)),
        }
      : null,
    deleteAction && item.deleteValues
      ? {
          value: "delete",
          label: item.deleteMenuLabel || deleteConfirmLabel,
          onSelect: () => setIsDeleteOpen(true),
        }
      : null,
  ].filter(Boolean);

  return (
    <>
      <Surface padding="md" className={styles.row}>
        <div className={styles.rowHeader}>
          <div className={styles.rowTitleWrap}>
            <h2 className={styles.rowTitle}>{item.title}</h2>
          </div>
          <div className={styles.rowHeaderActions}>
            <div className={styles.rowBadges}>
              {badges?.map((badge) => (
                <Badge key={`${item.id}:${badge.label}`} tone={badge.tone || "neutral"}>
                  {badge.label}
                </Badge>
              ))}
            </div>
            {menuItems.length ? (
              <CompactMenu
                triggerAriaLabel={`Open actions for ${item.title}`}
                triggerTooltip="Item actions"
                items={menuItems}
              >
                <Icon name="more_vert" size="sm" decorative />
              </CompactMenu>
            ) : null}
          </div>
        </div>

        <div className={styles.bodyLayout}>
          {item.imageUrl ? (
            <div className={styles.mediaFrame}>
              <Image
                src={item.imageUrl}
                alt={item.imageAlt || item.title}
                fill
                sizes="(max-width: 56rem) 100vw, 12rem"
                className={styles.mediaImage}
                unoptimized
              />
            </div>
          ) : null}

          <div className={styles.content}>
            <p className={styles.schedule}>{item.scheduleLabel}</p>
            {item.meta?.length ? (
              <div className={styles.meta}>
                {item.meta.map((value) => (
                  <span key={`${item.id}:${value}`}>{value}</span>
                ))}
              </div>
            ) : null}
            {item.summary ? <p className={styles.summary}>{item.summary}</p> : null}
          </div>
        </div>
      </Surface>
      {isDeleteOpen && deleteAction && item.deleteValues ? (
        <DeleteOfferingModal
          item={item}
          deleteAction={deleteAction}
          deleteConfirmLabel={deleteConfirmLabel}
          onClose={() => setIsDeleteOpen(false)}
        />
      ) : null}
    </>
  );
}

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

export default function OfferingAdminListWorkspace({
  eyebrow,
  title,
  description,
  actions = null,
  items = [],
  filterDefinitions = [],
  emptyState,
  deleteAction = null,
  deleteConfirmLabel = "Delete item",
  onboardingKey = "",
  enableDateRangeFilter = false,
  enableTemporalView = false,
  temporalViewParam = "view",
  temporalViewOptions = defaultTemporalViewOptions,
  defaultTemporalView = "current",
  itemNounSingular = "record",
  itemNounPlural = "records",
  showHeader = true,
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const allowedTemporalViews = useMemo(
    () => temporalViewOptions.map((option) => option.value),
    [temporalViewOptions]
  );
  const normalizedDefaultTemporalView = normalizeTemporalView(defaultTemporalView, allowedTemporalViews, "current");
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get("q") || "");
  const [activeFilters, setActiveFilters] = useState(() => buildFilterStateFromSearchParams(filterDefinitions, searchParams));
  const [activeTemporalView, setActiveTemporalView] = useState(() =>
    normalizeTemporalView(searchParams.get(temporalViewParam), allowedTemporalViews, normalizedDefaultTemporalView)
  );
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);

  useEffect(() => {
    const nextQuery = buildOfferingQuery(
      debouncedSearchTerm,
      {
        ...activeFilters,
        [temporalViewParam]: activeTemporalView,
      },
      filterDefinitions,
      {
        enableTemporalView,
        temporalViewParam,
        allowedTemporalViews,
        defaultTemporalView: normalizedDefaultTemporalView,
      }
    );
    const nextHref = `${pathname}${nextQuery}`;
    const currentHref = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

    if (nextHref !== currentHref) {
      router.replace(nextHref, { scroll: false });
    }
  }, [
    activeFilters,
    activeTemporalView,
    allowedTemporalViews,
    debouncedSearchTerm,
    defaultTemporalView,
    enableTemporalView,
    filterDefinitions,
    normalizedDefaultTemporalView,
    pathname,
    router,
    searchParams,
    temporalViewParam,
  ]);

  const filteredItems = useMemo(
    () =>
      filterOfferingItems(items, deferredSearchTerm, activeFilters, filterDefinitions, {
        dateFrom: activeFilters.dateFrom,
        dateTo: activeFilters.dateTo,
      }),
    [activeFilters, deferredSearchTerm, filterDefinitions, items]
  );
  const visibleItems = useMemo(() => {
    const temporalItems = enableTemporalView
      ? filterOfferingItemsByTemporalView(filteredItems, activeTemporalView)
      : filteredItems;

    return enableTemporalView
      ? sortOfferingItemsForTemporalView(temporalItems, activeTemporalView)
      : temporalItems;
  }, [activeTemporalView, enableTemporalView, filteredItems]);
  const totalPages = Math.max(1, Math.ceil(visibleItems.length / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedItems = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return visibleItems.slice(startIndex, startIndex + pageSize);
  }, [visibleItems, pageSize, safeCurrentPage]);
  const offeringQuery = buildOfferingQuery(
    debouncedSearchTerm,
    {
      ...activeFilters,
      [temporalViewParam]: activeTemporalView,
    },
    filterDefinitions,
    {
      enableTemporalView,
      temporalViewParam,
      allowedTemporalViews,
      defaultTemporalView: normalizedDefaultTemporalView,
    }
  );

  const hasRecords = items.length > 0;
  const hasActiveFilters = filterDefinitions.some((filter) => (activeFilters[filter.key] || "all") !== "all");
  const paginationItemLabel = enableTemporalView
    ? activeTemporalView === "history"
      ? `${itemNounSingular} history records`
      : `current ${itemNounPlural}`
    : "records";

  if (!hasRecords) {
    return <EmptyState {...emptyState} />;
  }

  return (
    <div className={styles.root} data-onboarding={onboardingKey || undefined}>
      {showHeader ? <PageHeader eyebrow={eyebrow} title={title} description={description} actions={actions} /> : null}

      <div className={styles.toolbar}>
        <div className={styles.toolbarControls}>
          {enableTemporalView ? (
            <SegmentedToggle
              label={`${itemNounSingular} view`}
              labelVisibility="hidden"
              name={`${itemNounSingular}-view`}
              value={activeTemporalView}
              onChange={(value) => {
                setActiveTemporalView(normalizeTemporalView(value, allowedTemporalViews, normalizedDefaultTemporalView));
                setCurrentPage(1);
              }}
              options={temporalViewOptions}
              className={styles.viewToggle}
            />
          ) : null}

          <div className={styles.searchCluster}>
            <SearchField
              name="admin-offerings-search"
              label={`Search ${title.toLowerCase()}`}
              labelVisibility="hidden"
              size="sm"
              placeholder={`Search ${title.toLowerCase()}`}
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setCurrentPage(1);
              }}
              className={styles.search}
            />
          </div>

          {enableDateRangeFilter ? (
            <div className={styles.dateFilters}>
              <label className={styles.dateField}>
                <span className={fieldStyles.label}>From</span>
                <input
                  type="date"
                  className={`${fieldStyles.control} ${fieldStyles.compactControl}`}
                  value={activeFilters.dateFrom || ""}
                  onChange={(event) => {
                    setActiveFilters((current) => ({
                      ...current,
                      dateFrom: event.target.value,
                    }));
                    setCurrentPage(1);
                  }}
                />
              </label>
              <label className={styles.dateField}>
                <span className={fieldStyles.label}>To</span>
                <input
                  type="date"
                  className={`${fieldStyles.control} ${fieldStyles.compactControl}`}
                  value={activeFilters.dateTo || ""}
                  onChange={(event) => {
                    setActiveFilters((current) => ({
                      ...current,
                      dateTo: event.target.value,
                    }));
                    setCurrentPage(1);
                  }}
                />
              </label>
            </div>
          ) : null}

          {filterDefinitions.length ? (
            <div className={styles.toolbarMenus}>
              {filterDefinitions.map((filter) => (
                <CompactMenu
                  key={filter.key}
                  triggerAriaLabel={`Filter ${title.toLowerCase()} by ${filter.label.toLowerCase()}`}
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
            </div>
          ) : null}
        </div>
      </div>

      {visibleItems.length ? (
        <div className={styles.listSection}>
          <PaginationControls
            totalCount={visibleItems.length}
            currentPage={safeCurrentPage}
            pageSize={pageSize}
            pageSizeOptions={[5, 10, 20]}
            itemLabel={paginationItemLabel}
            onPageChange={setCurrentPage}
            onPageSizeChange={(value) => {
              setPageSize(value);
              setCurrentPage(1);
            }}
          />

          <div className={styles.list}>
            {paginatedItems.map((item) => (
              <OfferingRow
                key={item.id}
                item={item}
                offeringQuery={offeringQuery}
                deleteAction={deleteAction}
                deleteConfirmLabel={deleteConfirmLabel}
                temporalView={activeTemporalView}
              />
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          eyebrow="No matching records"
          title={
            enableTemporalView && filteredItems.length
              ? `No ${activeTemporalView === "history" ? `${itemNounSingular} history` : `current ${itemNounPlural}`}`
              : `No ${title.toLowerCase()} match the current view`
          }
          description={
            enableTemporalView && filteredItems.length
              ? activeTemporalView === "history"
                ? `Past and cancelled ${itemNounPlural} will appear here once history begins to build.`
                : `Upcoming, in-progress, and undated ${itemNounPlural} will appear here.`
              : hasActiveFilters || deferredSearchTerm
              ? "Try a different search term or reset one of the filters to widen the results."
              : "There are no records to display right now."
          }
        />
      )}
    </div>
  );
}
