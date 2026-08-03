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
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  buildFilterStateFromSearchParams,
  buildOfferingQuery,
  filterOfferingItems,
} from "./offering-admin-list-helpers";
import styles from "./OfferingAdminListWorkspace.module.css";

const initialDeleteActionState = {
  error: "",
};

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

function OfferingRow({ item, offeringQuery = "", deleteAction = null, deleteConfirmLabel = "Delete item" }) {
  const router = useRouter();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
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
              {item.badges?.map((badge) => (
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
  showHeader = true,
}) {
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
    const nextQuery = buildOfferingQuery(debouncedSearchTerm, activeFilters, filterDefinitions);
    const nextHref = `${pathname}${nextQuery}`;
    const currentHref = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

    if (nextHref !== currentHref) {
      router.replace(nextHref, { scroll: false });
    }
  }, [activeFilters, debouncedSearchTerm, filterDefinitions, pathname, router, searchParams]);

  const filteredItems = useMemo(
    () =>
      filterOfferingItems(items, deferredSearchTerm, activeFilters, filterDefinitions, {
        dateFrom: activeFilters.dateFrom,
        dateTo: activeFilters.dateTo,
      }),
    [activeFilters, deferredSearchTerm, filterDefinitions, items]
  );
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedItems = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return filteredItems.slice(startIndex, startIndex + pageSize);
  }, [filteredItems, pageSize, safeCurrentPage]);
  const offeringQuery = buildOfferingQuery(debouncedSearchTerm, activeFilters, filterDefinitions);

  const hasRecords = items.length > 0;
  const hasActiveFilters = filterDefinitions.some((filter) => (activeFilters[filter.key] || "all") !== "all");
  if (!hasRecords) {
    return <EmptyState {...emptyState} />;
  }

  return (
    <div className={styles.root} data-onboarding={onboardingKey || undefined}>
      {showHeader ? <PageHeader eyebrow={eyebrow} title={title} description={description} actions={actions} /> : null}

      <div className={styles.toolbar}>
        <div className={styles.toolbarControls}>
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

      {filteredItems.length ? (
        <div className={styles.listSection}>
          <PaginationControls
            totalCount={filteredItems.length}
            currentPage={safeCurrentPage}
            pageSize={pageSize}
            pageSizeOptions={[5, 10, 20]}
            itemLabel="records"
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
              />
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          eyebrow="No matching records"
          title={`No ${title.toLowerCase()} match the current view`}
          description={
            hasActiveFilters || deferredSearchTerm
              ? "Try a different search term or reset one of the filters to widen the results."
              : "There are no records to display right now."
          }
        />
      )}
    </div>
  );
}
