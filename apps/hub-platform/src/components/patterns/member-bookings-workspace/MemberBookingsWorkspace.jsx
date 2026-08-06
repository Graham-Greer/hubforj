"use client";

import Image from "next/image";
import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import FormMessage from "@/components/ui/form-message/FormMessage";
import Modal from "@/components/ui/modal/Modal";
import SegmentedToggle from "@/components/ui/segmented-toggle/SegmentedToggle";
import EmptyState from "@/components/patterns/empty-state/EmptyState";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import SectionSearchFilters from "@/components/sections/primitives/section-search-filters/SectionSearchFilters";
import Surface from "@/components/primitives/surface/Surface";
import { cancelMemberBookingAction } from "@/app/(hub)/[hubSlug]/account/bookings/actions";
import { initialMemberBookingCancellationState } from "@/app/(hub)/[hubSlug]/account/bookings/form-state";
import { buildHubRuntimeHref } from "@/lib/domain/hub-runtime-paths";
import { resolveSiteSettingsCapabilities } from "@/lib/domain/site-settings-capabilities";
import styles from "./MemberBookingsWorkspace.module.css";

const filterOptions = [
  { value: "all", label: "All" },
  { value: "event", label: "Events" },
  { value: "course", label: "Courses" },
];

const viewOptions = [
  { value: "current", label: "Current" },
  { value: "history", label: "History" },
];

function isUpcomingBooking(item) {
  if (item.status === "cancelled") {
    return false;
  }

  const endTimestamp = Date.parse(String(item.endSortValue || ""));

  if (!Number.isNaN(endTimestamp)) {
    return endTimestamp >= Date.now();
  }

  const timestamp = Date.parse(String(item.dateSortValue || ""));

  if (Number.isNaN(timestamp)) {
    return true;
  }

  return timestamp >= Date.now();
}

function filterItems(items, searchValue, activeFilter) {
  const query = String(searchValue || "").trim().toLowerCase();

  return items.filter((item) => {
    if (activeFilter !== "all" && item.kind !== activeFilter) {
      return false;
    }

    if (!query) {
      return true;
    }

    const haystack = [item.title, item.typeLabel, item.dateLabel, item.locationLabel].join(" ").toLowerCase();
    return haystack.includes(query);
  });
}

function sortUpcoming(items) {
  return [...items].sort((left, right) => String(left.dateSortValue || "").localeCompare(String(right.dateSortValue || "")));
}

function sortHistory(items) {
  return [...items].sort((left, right) => String(right.dateSortValue || "").localeCompare(String(left.dateSortValue || "")));
}

function getBrowseActions(hub, capabilities) {
  const routeMode = hub?.routeMode || "path";
  if (capabilities.eventsEnabled && capabilities.coursesEnabled) {
    return {
      primaryAction: { href: buildHubRuntimeHref(hub.slug, "/events", routeMode), label: "Browse events", prefetch: false },
      secondaryAction: { href: buildHubRuntimeHref(hub.slug, "/courses", routeMode), label: "Browse courses", prefetch: false },
    };
  }

  if (capabilities.coursesEnabled) {
    return {
      primaryAction: { href: buildHubRuntimeHref(hub.slug, "/courses", routeMode), label: "Browse courses", prefetch: false },
      secondaryAction: { href: buildHubRuntimeHref(hub.slug, "/account", routeMode), label: "Back to overview", prefetch: false },
    };
  }

  return {
    primaryAction: { href: buildHubRuntimeHref(hub.slug, "/events", routeMode), label: "Browse events", prefetch: false },
    secondaryAction: { href: buildHubRuntimeHref(hub.slug, "/account", routeMode), label: "Back to overview", prefetch: false },
  };
}

function BookingCancelModal({ hubSlug, item, onClose, onSuccess }) {
  const [state, formAction] = useActionState(cancelMemberBookingAction, initialMemberBookingCancellationState);

  useEffect(() => {
    if (!state?.success) {
      return;
    }

    onSuccess();
  }, [onSuccess, state?.success]);

  return (
    <Modal
      title="Cancel booking?"
      onClose={onClose}
      actions={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            Keep booking
          </Button>
          <form action={formAction}>
            <input type="hidden" name="hubSlug" value={hubSlug} />
            <input type="hidden" name="kind" value={item.kind} />
            <input type="hidden" name="parentId" value={item.parentId} />
            <input type="hidden" name="registrationId" value={item.recordId} />
            <input type="hidden" name="bookingHref" value={item.primaryAction?.href || ""} />
            <Button type="submit">Cancel booking</Button>
          </form>
        </>
      }
    >
      <div className={styles.modalBody}>
        <p className={styles.modalCopy}>
          {`This will cancel your ${item.kind === "course" ? "course place" : "event booking"} for ${item.title}.`}
        </p>
        {item.kind === "event" && Number(item.attendeeCount || 0) > 1 ? (
          <p className={styles.modalCopy}>
            This will cancel the full booking for everyone included. If you only need to remove one attendee, please
            contact your community admin for help.
          </p>
        ) : null}
        {item.cancellationPolicySummary ? <p className={styles.modalCopy}>{item.cancellationPolicySummary}</p> : null}
        {state?.error ? <FormMessage tone="danger">{state.error}</FormMessage> : null}
      </div>
    </Modal>
  );
}

function BookingCancelAction({ hubSlug, item }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  if (!item.canCancel) {
    return null;
  }

  function handleSuccess() {
    setIsOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button type="button" variant="ghost" onClick={() => setIsOpen(true)}>
        Cancel booking
      </Button>

      {isOpen ? (
        <BookingCancelModal
          hubSlug={hubSlug}
          item={item}
          onClose={() => setIsOpen(false)}
          onSuccess={handleSuccess}
        />
      ) : null}
    </>
  );
}

function BookingRow({ hubSlug, item }) {
  return (
    <Surface padding="md" className={styles.itemCard}>
      <div className={styles.itemHeader}>
        <div className={styles.itemLead}>
          {item.imageUrl ? (
            <div className={styles.itemImageWrap}>
              <Image
                src={item.imageUrl}
                alt={item.imageAlt || item.title}
                fill
                sizes="88px"
                className={styles.itemImage}
              />
            </div>
          ) : null}

          <div className={styles.itemCopy}>
            <h2 className={styles.itemTitle}>{item.title}</h2>
            <p className={styles.itemMeta}>{item.dateLabel}</p>
            <p className={styles.itemMeta}>{item.locationLabel}</p>
            {item.amountLabel ? <p className={styles.itemMeta}>{item.amountLabel}</p> : null}
          </div>
        </div>
        <div className={styles.itemHeaderBadges}>
          <Badge tone="neutral">{item.typeLabel}</Badge>
          <Badge tone={item.statusTone}>{item.statusLabel}</Badge>
          {item.showPaymentBadge ? (
            <Badge tone={item.paymentStatusTone}>{item.paymentStatusLabel}</Badge>
          ) : null}
          {item.showAttendanceBadge ? (
            <Badge tone={item.attendanceStatusTone}>{item.attendanceStatusLabel}</Badge>
          ) : null}
        </div>
      </div>

      {item.statusHelpText ? <p className={styles.statusHelpText}>{item.statusHelpText}</p> : null}

      <div className={styles.itemActions}>
        <Button href={item.primaryAction.href} prefetch={false} variant="secondary">
          {item.primaryAction.label}
        </Button>
        <BookingCancelAction hubSlug={hubSlug} item={item} />
      </div>
    </Surface>
  );
}

export default function MemberBookingsWorkspace({ hub, items, showHeader = true }) {
  const [searchValue, setSearchValue] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeView, setActiveView] = useState("current");
  const capabilities = useMemo(() => resolveSiteSettingsCapabilities(hub), [hub]);
  const browseActions = useMemo(() => getBrowseActions(hub, capabilities), [capabilities, hub]);

  const filteredItems = useMemo(
    () => filterItems(items, searchValue, activeFilter),
    [activeFilter, items, searchValue]
  );
  const upcomingItems = useMemo(
    () => sortUpcoming(filteredItems.filter((item) => isUpcomingBooking(item))),
    [filteredItems]
  );
  const historyItems = useMemo(
    () => sortHistory(filteredItems.filter((item) => !isUpcomingBooking(item))),
    [filteredItems]
  );

  if (!items.length) {
    return (
      <div className={styles.root}>
        {showHeader ? (
          <PageHeader
            eyebrow="Member account"
            title="My Bookings"
            description="Review your event and course bookings, check current status, and cancel a booking when needed."
          />
        ) : null}
        <EmptyState
          eyebrow="My Bookings"
          title="No bookings yet"
          description="Once you book an event or enrol on a course, it will appear here with status, payment, and attendance details."
          primaryAction={browseActions.primaryAction}
          secondaryAction={browseActions.secondaryAction}
        />
      </div>
    );
  }

  const visibleItems = activeView === "current" ? upcomingItems : historyItems;
  const resultsLabel =
    activeView === "current"
      ? `${visibleItems.length} current booking${visibleItems.length === 1 ? "" : "s"}`
      : `${visibleItems.length} booking history item${visibleItems.length === 1 ? "" : "s"}`;
  const emptyState =
    activeView === "current"
      ? {
          title: "No current bookings",
          description: "Your active event and course bookings will appear here when you have something scheduled.",
          ...browseActions,
        }
      : {
          title: "No booking history yet",
          description: "Completed, cancelled, and earlier bookings will appear here once your account history begins to build.",
          primaryAction: { href: `/${hub.slug}/account`, label: "Back to overview", prefetch: false },
          secondaryAction: null,
        };

  return (
    <div className={styles.root}>
      {showHeader ? (
        <PageHeader
          eyebrow="Member account"
          title="My Bookings"
          description="Review your event and course bookings, check current status, and cancel a booking when needed."
        />
      ) : null}

      <div className={styles.toolbar}>
        <SegmentedToggle
          label="Booking view"
          labelVisibility="hidden"
          name="booking-view"
          value={activeView}
          onChange={setActiveView}
          options={viewOptions}
          className={styles.viewToggle}
        />
        <SectionSearchFilters
          searchName="member-bookings-search"
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          searchPlaceholder="Search bookings"
          searchLabel="Search bookings"
          filterOptions={filterOptions}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          filterTriggerLabel="Filter bookings"
          filterMenuLabel="Booking filters"
          className={styles.searchFilters}
        />
      </div>

      <p className={styles.resultsCount}>
        {resultsLabel}
      </p>

      {!filteredItems.length ? (
        <Surface className={styles.emptySurface}>
          <div className={styles.emptyBlock}>
            <h2 className={styles.emptyTitle}>No matching bookings</h2>
            <p className={styles.emptyDescription}>Try a different search or reset the type filter.</p>
          </div>
        </Surface>
      ) : !visibleItems.length ? (
        <Surface className={styles.emptySurface}>
          <div className={styles.emptyBlock}>
            <h2 className={styles.emptyTitle}>{emptyState.title}</h2>
            <p className={styles.emptyDescription}>{emptyState.description}</p>
            <div className={styles.emptyActions}>
              {emptyState.primaryAction ? (
                <Button href={emptyState.primaryAction.href} prefetch={false} variant="primary">
                  {emptyState.primaryAction.label}
                </Button>
              ) : null}
              {emptyState.secondaryAction ? (
                <Button href={emptyState.secondaryAction.href} prefetch={false} variant="secondary">
                  {emptyState.secondaryAction.label}
                </Button>
              ) : null}
            </div>
          </div>
        </Surface>
      ) : (
        <div className={styles.list}>
          {visibleItems.map((item) => (
            <BookingRow key={item.id} hubSlug={hub.slug} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
