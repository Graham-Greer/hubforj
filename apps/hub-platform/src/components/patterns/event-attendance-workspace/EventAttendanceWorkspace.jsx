"use client";

import Button from "@/components/ui/button/Button";
import StatCard from "@/components/ui/stat-card/StatCard";
import EmptyState from "@/components/patterns/empty-state/EmptyState";
import OperationalRecordsTable from "@/components/patterns/operational-records-table/OperationalRecordsTable";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import {
  canUpdateEventBookingAttendance,
  summarizeEventAdminAttendees,
} from "@/lib/domain/event-bookings";
import RegistrationStatusMenu from "@/components/patterns/event-registration-workspace/RegistrationStatusMenu";
import AttendanceStatusMenu from "./AttendanceStatusMenu";
import styles from "./EventAttendanceWorkspace.module.css";

export default function EventAttendanceWorkspace({ hub, event, attendees }) {
  const summary = summarizeEventAdminAttendees(attendees);
  const filters = [
    {
      key: "attendeeStatus",
      label: "Status",
      icon: "event_available",
      options: [
        { value: "all", label: "All" },
        { value: "registered", label: "Registered" },
        { value: "waitlisted", label: "Waitlisted" },
        { value: "cancelled", label: "Cancelled" },
      ],
      getValue: (attendee) => attendee.status,
    },
    {
      key: "attendanceStatus",
      label: "Attendance",
      icon: "fact_check",
      options: [
        { value: "all", label: "All" },
        { value: "pending", label: "Unmarked" },
        { value: "present", label: "Attended" },
        { value: "absent", label: "Absent" },
      ],
      getValue: (attendee) => attendee.attendanceStatus,
    },
  ];
  const columns = [
    {
      key: "attendee",
      label: "Attendee",
      render: (attendee, classes) => (
        <>
          <p className={classes.primaryClassName}>
            {attendee.userName || attendee.userEmail || attendee.userId}
          </p>
          <p className={classes.secondaryClassName}>{attendee.userEmail || "No email on record"}</p>
        </>
      ),
    },
    {
      key: "booker",
      label: "Booker",
      render: (attendee, classes) => (
        <>
          <p className={classes.primaryClassName}>{attendee.bookerName || attendee.bookerEmail || "Unknown booker"}</p>
          <p className={classes.secondaryClassName}>{attendee.bookerEmail || "No email on record"}</p>
        </>
      ),
    },
    {
      key: "attendeeStatus",
      label: "Attendee status",
      render: (attendee) => (
        <RegistrationStatusMenu
          hubId={hub.id}
          hubSlug={hub.slug}
          eventId={event.id}
          bookingId={attendee.bookingId}
          attendeeId={attendee.attendeeId}
          currentStatus={attendee.status}
        />
      ),
    },
    {
      key: "attendance",
      label: "Attendance",
      render: (attendee) => (
        <AttendanceStatusMenu
          hubId={hub.id}
          hubSlug={hub.slug}
          eventId={event.id}
          bookingId={attendee.bookingId}
          attendeeId={attendee.attendeeId}
          currentAttendanceStatus={attendee.attendanceStatus}
          disabled={!canUpdateEventBookingAttendance(attendee.status)}
        />
      ),
    },
    {
      key: "bookedOn",
      label: "Booked on",
      render: (attendee, classes) => (
        <p className={classes.primaryClassName}>
          {attendee.createdAt ? attendee.createdAt.slice(0, 10) : "Recently added"}
        </p>
      ),
    },
  ];

  return (
    <div className={styles.root}>
      <PageHeader
        eyebrow="Event attendance"
        title="Attendance"
        description={`Mark attendance for ${event.title} and keep attendee status close by while you work through the list.`}
      />

      <div className={styles.stats}>
        <StatCard label="Registered" value={String(summary.registered)} detail="Attendance-eligible attendees." />
        <StatCard label="Attended" value={String(summary.present)} detail="Marked as attended." />
        <StatCard label="Absent" value={String(summary.absent)} detail="Explicitly not attended." />
        <StatCard label="Unmarked" value={String(summary.total - summary.present - summary.absent)} detail="Attendance not marked yet." />
      </div>

      {!attendees.length ? (
        <EmptyState
          eyebrow="No attendance activity yet"
          title="Attendance depends on bookings"
          description="Bookings need to exist before you can mark attendance for this event."
          primaryAction={{ href: `/${hub.slug}/admin/events/${event.id}/registrations`, label: "View bookings" }}
          secondaryAction={{ href: `/${hub.slug}/admin/events/${event.id}`, label: "Back to event" }}
        />
      ) : (
        <WorkspaceSection
          eyebrow="Attendance"
          title="Attendance list"
          description="Work through attendance quickly, filter the queue, and update attendee status when needed."
          actions={
            <>
              <Button href={`/${hub.slug}/admin/events/${event.id}/registrations`} variant="secondary">
                Open bookings
              </Button>
              <Button href={`/${hub.slug}/admin/events/${event.id}`} variant="ghost">
                Back to event
              </Button>
            </>
          }
        >
          <OperationalRecordsTable
            records={attendees}
            columns={columns}
            searchFields={["userName", "userEmail", "userId", "bookerName", "bookerEmail"]}
            searchLabel="Search attendance records"
            searchPlaceholder="Search attendee or booker name"
            filters={filters}
            getRecordKey={(attendee) => `${attendee.bookingId}:${attendee.attendeeId}`}
            pagination={{
              itemLabel: "attendance records",
              pageSizeOptions: [5, 10, 20],
              defaultPageSize: 10,
            }}
            rowTone="accent"
            gridTemplateColumns="minmax(0, 1.2fr) minmax(0, 1.2fr) minmax(0, 0.95fr) minmax(0, 0.95fr) minmax(0, 0.8fr)"
            emptyState={{
              eyebrow: "No matching attendance records",
              title: "No attendance records match the current filters",
              description: "Adjust the search or filters to focus the attendance queue.",
            }}
          />
        </WorkspaceSection>
      )}
    </div>
  );
}
