import AdminDirtyAwareBackButton from "@/components/patterns/admin-form-runtime/AdminDirtyAwareBackButton";
import { AdminFormRuntimeProvider } from "@/components/patterns/admin-form-runtime/AdminFormRuntime";
import Badge from "@/components/ui/badge/Badge";
import SectionRichText from "@/components/sections/primitives/section-rich-text/SectionRichText";
import Button from "@/components/ui/button/Button";
import Icon from "@/components/ui/icon/Icon";
import OfferingAdminSummaryPanel from "@/components/patterns/offering-admin-summary-panel/OfferingAdminSummaryPanel";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import {
  formatEventCapacity,
  formatEventDateRange,
  formatEventPrice,
  getEventEligibilityLabel,
  getEventStatusLabel,
  getEventStatusTone,
  getEventVisibilityLabel,
} from "@/lib/domain/events";
import styles from "./EventDetailWorkspace.module.css";

function hasEventHappened(event) {
  const endValue = String(event?.endAt || event?.startAt || "").trim();

  if (!endValue) {
    return false;
  }

  const date = new Date(endValue);
  return !Number.isNaN(date.getTime()) && date.getTime() < Date.now();
}

export default function EventDetailWorkspace({
  hub,
  event,
  eventsQuery = "",
  isEditing = false,
  editForm = null,
  attendanceCount = 0,
  attendanceCountVerified = true,
  registrationCount = 0,
  canExportAttendanceReport = false,
  hasAttendanceRegistrations = false,
  seriesWorkspaceHref = "",
  canEditEvent = true,
}) {
  const eventsListHref = `/${hub.slug}/admin/events${eventsQuery ? `?${eventsQuery}` : ""}`;
  const registrationsHref = `/${hub.slug}/admin/events/${event.id}/registrations`;
  const attendanceHref = `/${hub.slug}/admin/events/${event.id}/attendance`;
  const attendanceExportHref = `/${hub.slug}/admin/events/${event.id}/attendance/export`;
  const editHref = `/${hub.slug}/admin/events/${event.id}?${new URLSearchParams({
    ...(eventsQuery ? Object.fromEntries(new URLSearchParams(eventsQuery)) : {}),
    mode: "edit",
  }).toString()}#edit-event-details`;
  const shouldShowVerifiedAttendance = attendanceCountVerified && hasEventHappened(event);
  const attendanceLabel = shouldShowVerifiedAttendance ? "Attended" : "Attending";
  const badges = (
    <>
      <Badge tone={getEventStatusTone(event.status)}>{getEventStatusLabel(event.status)}</Badge>
      {event.eventKind === "series_occurrence" ? <Badge tone="accent">Recurring occurrence</Badge> : null}
      {event.isSeriesPreserved ? <Badge tone="warning">Preserved</Badge> : null}
    </>
  );
  const summaryActions = !isEditing ? (
    <>
      {seriesWorkspaceHref ? (
        <Button href={seriesWorkspaceHref} prefetch={false} variant="secondary">
          Open recurring series
        </Button>
      ) : null}
      <Button href={registrationsHref} prefetch={false} variant="secondary">
        Manage bookings
      </Button>
      <Button href={attendanceHref} prefetch={false} variant="secondary">
        Manage attendance
      </Button>
      {canExportAttendanceReport && hasAttendanceRegistrations ? (
        <Button href={attendanceExportHref} prefetch={false} variant="secondary">
          Export attendance CSV
        </Button>
      ) : null}
      {canEditEvent ? (
        <Button href={editHref} prefetch={false} variant="ghost">
          <Icon name="edit" />
          <span>Edit event</span>
        </Button>
      ) : null}
    </>
  ) : null;
  const primaryFacts = [
    { label: "Schedule", value: formatEventDateRange(event, hub.locale) },
    { label: "Location", value: event.location || "Location to be confirmed" },
    { label: "Pricing", value: formatEventPrice(event, hub.locale) },
    { label: "Capacity", value: formatEventCapacity(event.capacity, registrationCount) },
  ];
  const secondaryFacts = [
    { label: "Visibility", value: getEventVisibilityLabel(event.visibility) },
    { label: "Eligibility", value: getEventEligibilityLabel(event.registrationEligibility) },
    { label: "Waitlist", value: event.allowWaitlist ? "Enabled" : "Disabled" },
    ...(event.eventKind === "series_occurrence" ? [{ label: "Series", value: "Managed by recurring series" }] : []),
    {
      label: "Attendance",
      value: `${shouldShowVerifiedAttendance ? attendanceCount : registrationCount} ${attendanceLabel}`,
    },
    { label: "Category", value: event.category || "Event" },
  ];
  const description = event.description ? <SectionRichText content={event.description} className={styles.description} /> : null;

  return (
    <AdminFormRuntimeProvider>
      <div className={styles.root}>
        <PageHeader
          eyebrow="Events"
          title={event.title}
          description="Review the event at a glance, then move straight into editing, registrations, or attendance without losing context."
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
            event.imageAsset?.publicUrl
              ? {
                  src: event.imageAsset.publicUrl,
                  alt: event.imageAlt || event.imageAsset.alt || event.title,
                }
              : null
          }
          primaryFacts={primaryFacts}
          secondaryFacts={secondaryFacts}
          summary={event.summary}
          description={description}
        />

        {isEditing ? (
          <WorkspaceSection
            id="edit-event-details"
            title="Edit event details"
            description="Update the event here while keeping the current operational context in view."
          >
            {editForm}
          </WorkspaceSection>
        ) : null}
      </div>
    </AdminFormRuntimeProvider>
  );
}
