"use client";

import Button from "@/components/ui/button/Button";
import StatCard from "@/components/ui/stat-card/StatCard";
import EmptyState from "@/components/patterns/empty-state/EmptyState";
import OperationalRecordsTable from "@/components/patterns/operational-records-table/OperationalRecordsTable";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import RegistrationRecordCell from "@/components/patterns/registration-records/RegistrationRecordCell";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import {
  summarizeEventAdminBookings,
} from "@/lib/domain/event-bookings";
import { normalizeEventBookingPaymentState } from "./event-registration-helpers";
import RegistrationPaymentMenu from "./RegistrationPaymentMenu";
import RegistrationStatusMenu from "./RegistrationStatusMenu";
import styles from "./EventRegistrationWorkspace.module.css";

export default function EventRegistrationWorkspace({ hub, event, bookings }) {
  const summary = summarizeEventAdminBookings(bookings);
  const filters = [
    {
      key: "bookingStatus",
      label: "Status",
      icon: "event_available",
      options: [
        { value: "all", label: "All" },
        { value: "active", label: "Active" },
        { value: "waitlisted", label: "Waitlisted" },
        { value: "cancelled", label: "Cancelled" },
      ],
      getValue: (booking) => booking.status,
    },
  ];

  if (event.pricingMode === "paid") {
    filters.push({
      key: "paymentStatus",
      label: "Payment",
      icon: "payments",
      options: [
        { value: "all", label: "All" },
        { value: "pending", label: "Pending" },
        { value: "paid", label: "Paid" },
        { value: "failed", label: "Failed" },
        { value: "partially_refunded", label: "Partially refunded" },
        { value: "refunded", label: "Refunded" },
      ],
      getValue: (booking) => normalizeEventBookingPaymentState(booking, event.pricingMode),
    });
  }

  const columns = [
    {
      key: "booker",
      label: "Booker",
      render: (booking, classes) => (
        <>
          <p className={classes.primaryClassName}>
            {booking.userName || booking.userEmail || booking.userId}
          </p>
          <p className={classes.secondaryClassName}>{booking.userEmail || "No email on record"}</p>
        </>
      ),
    },
    {
      key: "attendees",
      label: "Attendees",
      render: (booking, classes) => (
        <>
          <p className={classes.primaryClassName}>
            {booking.attendeeCount || 0} attendee{booking.attendeeCount === 1 ? "" : "s"}
          </p>
          <p className={classes.secondaryClassName}>
            {booking.attendeePreview || "Attendee names will appear here"}
          </p>
        </>
      ),
    },
    {
      key: "booking",
      label: "Booking",
      render: (booking) => (
        <RegistrationStatusMenu
          hubId={hub.id}
          hubSlug={hub.slug}
          eventId={event.id}
          bookingId={booking.id}
          currentStatus={booking.status}
        />
      ),
    },
    {
      key: "payment",
      label: "Payment",
      render: (booking, classes) =>
        event.pricingMode === "paid" ? (
          <RegistrationPaymentMenu
            hubId={hub.id}
            hubSlug={hub.slug}
            eventId={event.id}
            bookingId={booking.id}
            currentPaymentStatus={booking.paymentStatus}
            pricingMode={event.pricingMode}
          />
        ) : (
          <RegistrationRecordCell
            display={{ label: "Free", asBadge: false }}
            primaryClassName={classes.primaryClassName}
          />
        ),
    },
    {
      key: "createdOn",
      label: "Booked on",
      render: (booking, classes) => (
        <p className={classes.primaryClassName}>
          {booking.createdAt ? booking.createdAt.slice(0, 10) : "Recently added"}
        </p>
      ),
    },
  ];

  return (
    <div className={styles.root}>
      <PageHeader
        eyebrow="Event bookings"
        title="Bookings"
        description={`Review bookings for ${event.title}, resolve payment follow-up, and move people toward attendance readiness.`}
      />

      <div className={styles.stats}>
        <StatCard label="Total" value={String(summary.total)} detail="Booking records for this event." />
        <StatCard label="Waitlisted" value={String(summary.waitlisted)} detail="Bookings waiting for capacity." />
        <StatCard label="Cancelled" value={String(summary.cancelled)} detail="Bookings that were cancelled." />
        {event.pricingMode === "paid" ? (
          <StatCard label="Payment attention" value={String(summary.paymentAttention)} detail="Bookings still awaiting payment follow-up." />
        ) : null}
      </div>

      {!bookings.length ? (
        <EmptyState
          eyebrow="No bookings yet"
          title="Booking activity will appear here"
          description="Bookings will appear here as soon as members start booking places for this event."
          primaryAction={{ href: `/${hub.slug}/admin/events/${event.id}`, label: "Back to event" }}
          secondaryAction={{ href: `/${hub.slug}/admin/events`, label: "Back to events" }}
        />
      ) : (
        <WorkspaceSection
          eyebrow="Bookings"
          title="Booking activity"
          description="Check who booked, review attendee groups, and resolve payment follow-up from one place."
          actions={
            <>
              <Button href={`/${hub.slug}/admin/events/${event.id}/attendance`} variant="secondary">
                Manage attendance
              </Button>
              <Button href={`/${hub.slug}/admin/events/${event.id}`} variant="ghost">
                Back to event
              </Button>
            </>
          }
        >
          <OperationalRecordsTable
            records={bookings}
            columns={columns}
            searchFields={["userName", "userEmail", "userId", "attendeeNames", "attendeePreview"]}
            searchLabel="Search bookings"
            searchPlaceholder="Search booker or attendee name"
            filters={filters}
            getRecordKey={(booking) => booking.id}
            pagination={{
              itemLabel: "bookings",
              pageSizeOptions: [5, 10, 20],
              defaultPageSize: 10,
            }}
            rowTone="accent"
            gridTemplateColumns="minmax(0, 1.3fr) minmax(0, 1.4fr) minmax(0, 0.9fr) minmax(0, 0.9fr) minmax(0, 0.8fr)"
            emptyState={{
              eyebrow: "No matching bookings",
              title: "No bookings match the current filters",
              description: "Adjust the search or filters to review a different slice of bookings.",
            }}
          />
        </WorkspaceSection>
      )}
    </div>
  );
}
