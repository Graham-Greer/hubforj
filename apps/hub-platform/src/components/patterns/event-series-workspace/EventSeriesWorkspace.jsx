"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminDirtyAwareBackButton from "@/components/patterns/admin-form-runtime/AdminDirtyAwareBackButton";
import { AdminFormRuntimeProvider } from "@/components/patterns/admin-form-runtime/AdminFormRuntime";
import CompactMenu from "@/components/ui/compact-menu/CompactMenu";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import fieldStyles from "@/components/ui/field-control/FieldControl.module.css";
import Icon from "@/components/ui/icon/Icon";
import OfferingAdminSummaryPanel from "@/components/patterns/offering-admin-summary-panel/OfferingAdminSummaryPanel";
import PaginationControls from "@/components/patterns/pagination-controls/PaginationControls";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import Surface from "@/components/primitives/surface/Surface";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import SectionRichText from "@/components/sections/primitives/section-rich-text/SectionRichText";
import { formatEventPrice, getEventStatusLabel, getEventStatusTone } from "@/lib/domain/events";
import { buildHubRuntimeHref } from "@/lib/domain/hub-runtime-paths";
import styles from "./EventSeriesWorkspace.module.css";

function formatWeekdayList(values = []) {
  const labels = {
    1: "Mon",
    2: "Tue",
    3: "Wed",
    4: "Thu",
    5: "Fri",
    6: "Sat",
    7: "Sun",
  };

  return values.map((value) => labels[value] || "").filter(Boolean).join(", ");
}

function getRecurrenceSummary(series) {
  if (series.recurrenceFrequency === "daily") {
    return `Every ${series.recurrenceInterval === 1 ? "day" : `${series.recurrenceInterval} days`}`;
  }

  if (series.recurrenceFrequency === "weekly") {
    const days = formatWeekdayList(series.recurrenceDaysOfWeek);
    const intervalLabel = series.recurrenceInterval === 1 ? "Every week" : `Every ${series.recurrenceInterval} weeks`;
    return days ? `${intervalLabel} on ${days}` : intervalLabel;
  }

  if (series.recurrenceFrequency === "monthly") {
    return `Every ${series.recurrenceInterval === 1 ? "month" : `${series.recurrenceInterval} months`} on day ${series.recurrenceDayOfMonth}`;
  }

  return "Recurring schedule";
}

function getOccurrenceStatusBadge(occurrence) {
  return {
    label: getEventStatusLabel(occurrence.status),
    tone: getEventStatusTone(occurrence.status),
  };
}

function getOccurrencePreservedLabel(reason) {
  if (reason === "pricing_locked_from_series_change") {
    return "Pricing preserved after bookings";
  }

  if (reason === "refund_policy_preserved_due_to_existing_bookings") {
    return "Refund policy preserved after bookings";
  }

  if (reason === "occurrence_retained_after_schedule_change") {
    return "Retained after schedule change";
  }

  return "Preserved occurrence";
}

function normalizeDateFilterValue(value) {
  const normalized = String(value || "").trim();

  if (!normalized) {
    return "";
  }

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function getOccurrenceBookingState(occurrence) {
  const registeredAttendeeCount = Number.parseInt(String(occurrence?.registeredAttendeeCount || ""), 10) || 0;
  const waitlistedAttendeeCount = Number.parseInt(String(occurrence?.waitlistedAttendeeCount || ""), 10) || 0;
  const activeBookingCount = Number.parseInt(String(occurrence?.activeBookingCount || ""), 10) || 0;

  return registeredAttendeeCount > 0 || waitlistedAttendeeCount > 0 || activeBookingCount > 0
    ? "has_bookings"
    : "no_bookings";
}

export default function EventSeriesWorkspace({
  hub,
  series,
  occurrences = [],
  occurrencesQuery = "",
  isEditing = false,
  editForm = null,
  routeMode = "path",
}) {
  const router = useRouter();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [bookingFilter, setBookingFilter] = useState("all");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const eventsListHref = buildHubRuntimeHref(hub.slug, `/admin/events${occurrencesQuery ? `?${occurrencesQuery}` : ""}`, routeMode);
  const editHref = buildHubRuntimeHref(hub.slug, `/admin/events/series/${series.id}?mode=edit`, routeMode);
  const recurrenceSummary = getRecurrenceSummary(series);
  const upcomingOccurrences = occurrences.filter((occurrence) => occurrence.status !== "cancelled").length;
  const preservedOccurrences = occurrences.filter((occurrence) => occurrence.isSeriesPreserved).length;
  const badges = (
    <>
      <Badge tone={getEventStatusTone(series.status)}>{getEventStatusLabel(series.status)}</Badge>
      <Badge tone="accent">Recurring series</Badge>
    </>
  );
  const summaryActions = !isEditing ? (
    <>
      <Button href={editHref} variant="ghost">
        <Icon name="edit" />
        <span>Edit recurring event</span>
      </Button>
    </>
  ) : null;
  const primaryFacts = [
    { label: "Repeats", value: recurrenceSummary },
    { label: "Runs from", value: `${series.recurrenceStartDate} to ${series.recurrenceUntilDate}` },
    { label: "Pricing", value: formatEventPrice(series, hub.locale) },
    { label: "Capacity", value: series.capacity > 0 ? `${series.capacity} places` : "Open registration" },
  ];
  const secondaryFacts = [
    { label: "Occurrences", value: `${occurrences.length} generated` },
    { label: "Upcoming", value: `${upcomingOccurrences}` },
    { label: "Preserved", value: `${preservedOccurrences}` },
    { label: "Visibility", value: series.visibility || "public" },
    { label: "Timezone", value: series.timezone || hub.timezone || "America/New_York" },
  ];
  const description = series.description ? <SectionRichText content={series.description} /> : null;
  const filteredOccurrences = useMemo(() => {
    const normalizedDateFrom = normalizeDateFilterValue(dateFrom);
    const normalizedDateTo = normalizeDateFilterValue(dateTo);

    return occurrences.filter((occurrence) => {
      const occurrenceDate = normalizeDateFilterValue(occurrence.occurrenceDate || occurrence.startDate);
      const occurrenceBookingState = getOccurrenceBookingState(occurrence);

      if (normalizedDateFrom && (!occurrenceDate || occurrenceDate < normalizedDateFrom)) {
        return false;
      }

      if (normalizedDateTo && (!occurrenceDate || occurrenceDate > normalizedDateTo)) {
        return false;
      }

      if (bookingFilter !== "all" && occurrenceBookingState !== bookingFilter) {
        return false;
      }

      return true;
    });
  }, [bookingFilter, dateFrom, dateTo, occurrences]);
  const totalPages = Math.max(1, Math.ceil(filteredOccurrences.length / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedOccurrences = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return filteredOccurrences.slice(startIndex, startIndex + pageSize);
  }, [filteredOccurrences, pageSize, safeCurrentPage]);

  return (
    <AdminFormRuntimeProvider>
      <div className={styles.root}>
        <PageHeader
          eyebrow="Recurring events"
          title={series.title}
          description="Edit the shared recurring-event settings here. Each generated occurrence stays operationally separate for bookings and attendance."
          actions={
            <div className={styles.headerActions}>
              <AdminDirtyAwareBackButton
                href={eventsListHref}
                label="Back to events"
                variant="ghost"
                hideWhenDirty={isEditing}
              />
            </div>
          }
        />

        <OfferingAdminSummaryPanel
          badges={badges}
          actions={summaryActions}
          media={
            series.imageAsset?.publicUrl
              ? {
                  src: series.imageAsset.publicUrl,
                  alt: series.imageAlt || series.imageAsset.alt || series.title,
                }
              : null
          }
          primaryFacts={primaryFacts}
          secondaryFacts={secondaryFacts}
          summary={series.summary}
          description={description}
        />

        {isEditing ? (
          <WorkspaceSection
            id="edit-recurring-event"
            title="Edit recurring event"
            description="Saving here updates the recurring settings and syncs future occurrences."
          >
            {editForm}
          </WorkspaceSection>
        ) : null}

        <section className={styles.occurrencesSection} aria-labelledby="event-series-occurrences-title">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionCopy}>
              <h2 id="event-series-occurrences-title" className={styles.sectionTitle}>Occurrences</h2>
              <p className={styles.sectionDescription}>
                Open any occurrence to manage bookings and attendance without changing the parent recurring settings.
              </p>
            </div>
          </div>

          {occurrences.length ? (
            <>
              <div className={styles.toolbar}>
                <div className={styles.toolbarControls}>
                  <div className={styles.dateFilters}>
                    <label className={styles.dateField}>
                      <span className={fieldStyles.label}>From</span>
                      <input
                        type="date"
                        className={`${fieldStyles.control} ${fieldStyles.compactControl}`}
                        value={dateFrom}
                        onChange={(event) => {
                          setDateFrom(event.target.value);
                          setCurrentPage(1);
                        }}
                      />
                    </label>
                    <label className={styles.dateField}>
                      <span className={fieldStyles.label}>To</span>
                      <input
                        type="date"
                        className={`${fieldStyles.control} ${fieldStyles.compactControl}`}
                        value={dateTo}
                        onChange={(event) => {
                          setDateTo(event.target.value);
                          setCurrentPage(1);
                        }}
                      />
                    </label>
                  </div>
                  <CompactMenu
                    triggerAriaLabel="Filter occurrences by booking state"
                    triggerTooltip="Bookings"
                    items={[
                      {
                        value: "all",
                        label: "All bookings",
                        onSelect: () => {
                          setBookingFilter("all");
                          setCurrentPage(1);
                        },
                      },
                      {
                        value: "has_bookings",
                        label: "Has bookings",
                        onSelect: () => {
                          setBookingFilter("has_bookings");
                          setCurrentPage(1);
                        },
                      },
                    ]}
                  >
                    <Icon name="filter_alt" size="sm" decorative />
                    <span>{bookingFilter === "has_bookings" ? "Has bookings" : "All bookings"}</span>
                  </CompactMenu>
                </div>
              </div>

              {filteredOccurrences.length ? (
                <>
                  <PaginationControls
                    totalCount={filteredOccurrences.length}
                    currentPage={safeCurrentPage}
                    pageSize={pageSize}
                    pageSizeOptions={[5, 10, 20]}
                    itemLabel="occurrences"
                    onPageChange={setCurrentPage}
                    onPageSizeChange={(value) => {
                      setPageSize(value);
                      setCurrentPage(1);
                    }}
                  />

                  <div className={styles.occurrenceList}>
                    {paginatedOccurrences.map((occurrence) => {
                      const statusBadge = getOccurrenceStatusBadge(occurrence);

                      return (
                        <Surface key={occurrence.id} padding="md" className={styles.occurrenceRow}>
                          <div className={styles.occurrenceHeader}>
                            <div className={styles.occurrenceTitleWrap}>
                              <h3 className={styles.occurrenceTitle}>{occurrence.title}</h3>
                              <p className={styles.occurrenceMeta}>
                                {occurrence.startDate}
                                {occurrence.startTime ? ` at ${occurrence.startTime}` : ""}
                              </p>
                            </div>
                            <div className={styles.occurrenceControls}>
                              <div className={styles.occurrenceBadges}>
                                <Badge tone={statusBadge.tone}>{statusBadge.label}</Badge>
                                <Badge tone="accent">{`${Number(occurrence.registeredAttendeeCount || 0)} Attending`}</Badge>
                                {occurrence.isSeriesPreserved ? <Badge tone="warning">Preserved</Badge> : null}
                              </div>
                              <CompactMenu
                                triggerAriaLabel={`Open actions for ${occurrence.title}`}
                                triggerTooltip="Occurrence actions"
                                items={[
                                  {
                                    value: "open",
                                    label: "Open occurrence",
                                    onSelect: () => router.push(buildHubRuntimeHref(hub.slug, `/admin/events/${occurrence.id}`, routeMode)),
                                  },
                                  {
                                    value: "bookings",
                                    label: "Manage bookings",
                                    onSelect: () =>
                                      router.push(buildHubRuntimeHref(hub.slug, `/admin/events/${occurrence.id}/registrations`, routeMode)),
                                  },
                                  {
                                    value: "attendance",
                                    label: "Manage attendance",
                                    onSelect: () =>
                                      router.push(buildHubRuntimeHref(hub.slug, `/admin/events/${occurrence.id}/attendance`, routeMode)),
                                  },
                                ]}
                              >
                                <Icon name="more_vert" size="sm" decorative />
                              </CompactMenu>
                            </div>
                          </div>
                          {occurrence.isSeriesPreserved && occurrence.preservedReasons?.length ? (
                            <p className={styles.occurrenceHint}>
                              {occurrence.preservedReasons.map(getOccurrencePreservedLabel).join(" • ")}
                            </p>
                          ) : null}
                        </Surface>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className={styles.emptyText}>No occurrences match the current filters.</p>
              )}
            </>
          ) : (
            <p className={styles.emptyText}>No generated occurrences were found for this recurring event yet.</p>
          )}
        </section>
      </div>
    </AdminFormRuntimeProvider>
  );
}
