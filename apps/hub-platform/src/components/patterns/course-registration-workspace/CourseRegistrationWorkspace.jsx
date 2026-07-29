"use client";

import Button from "@/components/ui/button/Button";
import StatCard from "@/components/ui/stat-card/StatCard";
import EmptyState from "@/components/patterns/empty-state/EmptyState";
import OperationalRecordsTable from "@/components/patterns/operational-records-table/OperationalRecordsTable";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import RegistrationRecordCell from "@/components/patterns/registration-records/RegistrationRecordCell";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import {
  summarizeCourseRegistrations,
} from "@/lib/domain/course-registrations";
import {
  getCourseAttendanceDisplay,
} from "@/components/patterns/registration-records/registration-records-helpers";
import RegistrationPaymentMenu from "./RegistrationPaymentMenu";
import RegistrationStatusMenu from "./RegistrationStatusMenu";
import styles from "./CourseRegistrationWorkspace.module.css";

export default function CourseRegistrationWorkspace({ hub, course, registrations }) {
  const summary = summarizeCourseRegistrations(registrations);
  const filters = [
    {
      key: "registrationStatus",
      label: "Registration",
      icon: "event_available",
      options: [
        { value: "all", label: "All" },
        { value: "enrolled", label: "Enrolled" },
        { value: "waitlisted", label: "Waitlisted" },
        { value: "cancelled", label: "Cancelled" },
      ],
      getValue: (registration) => registration.status,
    },
    {
      key: "attendanceStatus",
      label: "Progress",
      icon: "school",
      options: [
        { value: "all", label: "All" },
        { value: "pending", label: "Unmarked" },
        { value: "in_progress", label: "In progress" },
        { value: "completed", label: "Completed" },
        { value: "withdrawn", label: "Withdrawn" },
      ],
      getValue: (registration) => registration.attendanceStatus,
    },
  ];

  if (course.pricingMode === "paid") {
    filters.splice(1, 0, {
      key: "paymentStatus",
      label: "Payment",
      icon: "payments",
      options: [
        { value: "all", label: "All" },
        { value: "paid", label: "Paid" },
        { value: "unpaid", label: "Unpaid" },
        { value: "overdue", label: "Overdue" },
        { value: "failed", label: "Failed" },
        { value: "not_required", label: "Not required" },
      ],
      getValue: (registration) => registration.paymentStatus,
    });
  }

  const columns = [
    {
      key: "member",
      label: "Member",
      render: (registration, classes) => (
        <>
          <p className={classes.primaryClassName}>
            {registration.userName || registration.userEmail || registration.userId}
          </p>
          <p className={classes.secondaryClassName}>{registration.userEmail || "No email on record"}</p>
        </>
      ),
    },
    {
      key: "registration",
      label: "Registration",
      render: (registration) => (
        <RegistrationStatusMenu
          hubId={hub.id}
          hubSlug={hub.slug}
          courseId={course.id}
          registrationId={registration.id}
          currentStatus={registration.status}
        />
      ),
    },
    {
      key: "payment",
      label: "Payment",
      render: (registration) => (
        <RegistrationPaymentMenu
          hubId={hub.id}
          hubSlug={hub.slug}
          courseId={course.id}
          registrationId={registration.id}
          currentPaymentStatus={registration.paymentStatus}
          pricingMode={course.pricingMode}
        />
      ),
    },
    {
      key: "progress",
      label: "Progress",
      render: (registration, classes) => (
        <RegistrationRecordCell
          display={getCourseAttendanceDisplay(registration.attendanceStatus)}
          primaryClassName={classes.primaryClassName}
        />
      ),
    },
    {
      key: "registeredOn",
      label: "Registered on",
      render: (registration, classes) => (
        <p className={classes.primaryClassName}>
          {registration.createdAt ? registration.createdAt.slice(0, 10) : "Recently added"}
        </p>
      ),
    },
  ];

  return (
    <div className={styles.root}>
      <PageHeader
        eyebrow="Course registrations"
        title="Registrations"
        description={`Review enrolments for ${course.title}, resolve payment follow-up, and keep progression work moving.`}
      />

      <div className={styles.stats}>
        <StatCard label="Total" value={String(summary.total)} detail="Enrolment records for this course." />
        <StatCard label="Enrolled" value={String(summary.enrolled)} detail="Active learners." />
        <StatCard label="Waitlisted" value={String(summary.waitlisted)} detail="People waiting for a place." />
        {course.pricingMode === "paid" ? (
          <StatCard label="Payment attention" value={String(summary.paymentAttention)} detail="Enrolments still unpaid." />
        ) : null}
      </div>

      {!registrations.length ? (
        <EmptyState
          eyebrow="No registrations yet"
          title="Enrolment activity will appear here"
          description="Enrolments will appear here as soon as members start joining this course."
          primaryAction={{ href: `/${hub.slug}/admin/courses/${course.id}`, label: "Back to course" }}
          secondaryAction={{ href: `/${hub.slug}/admin/courses/create`, label: "Create another course" }}
        />
      ) : (
        <WorkspaceSection
          eyebrow="Registrations"
          title="Enrolment activity"
          description="Check who joined, resolve payment status, and keep progression work organised from one place."
          actions={
            <>
              <Button href={`/${hub.slug}/admin/courses/${course.id}/attendance`} variant="secondary">
                Manage attendance
              </Button>
              <Button href={`/${hub.slug}/admin/courses/${course.id}`} variant="ghost">
                Back to course
              </Button>
            </>
          }
        >
          <OperationalRecordsTable
            records={registrations}
            columns={columns}
            searchFields={["userName", "userEmail", "userId"]}
            searchLabel="Search enrolments"
            searchPlaceholder="Search learner name or email"
            filters={filters}
            getRecordKey={(registration) => registration.id}
            pagination={{
              itemLabel: "enrolments",
              pageSizeOptions: [5, 10, 20],
              defaultPageSize: 10,
            }}
            rowTone="accent"
            gridTemplateColumns="minmax(0, 1.5fr) minmax(0, 0.9fr) minmax(0, 0.8fr) minmax(0, 1fr) minmax(0, 0.8fr)"
            emptyState={{
              eyebrow: "No matching enrolments",
              title: "No enrolments match the current filters",
              description: "Try adjusting the registration, payment, or progress filters to see a different operational slice.",
            }}
          />
        </WorkspaceSection>
      )}
    </div>
  );
}
