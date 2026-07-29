"use client";

import Button from "@/components/ui/button/Button";
import StatCard from "@/components/ui/stat-card/StatCard";
import EmptyState from "@/components/patterns/empty-state/EmptyState";
import OperationalRecordsTable from "@/components/patterns/operational-records-table/OperationalRecordsTable";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import {
  canUpdateCourseAttendance,
  summarizeCourseRegistrations,
} from "@/lib/domain/course-registrations";
import AttendanceStatusMenu from "./AttendanceStatusMenu";
import RegistrationStatusMenu from "@/components/patterns/course-registration-workspace/RegistrationStatusMenu";
import styles from "./CourseAttendanceWorkspace.module.css";

export default function CourseAttendanceWorkspace({ hub, course, registrations }) {
  const summary = summarizeCourseRegistrations(registrations);
  const filters = [
    {
      key: "registrationStatus",
      label: "Status",
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
      key: "registeredOn",
      label: "Registered on",
      render: (registration, classes) => (
        <p className={classes.primaryClassName}>
          {registration.createdAt ? registration.createdAt.slice(0, 10) : "Recently added"}
        </p>
      ),
    },
    {
      key: "actions",
      label: "Mark progress",
      isActions: true,
      align: "start",
      render: (registration) => (
        <AttendanceStatusMenu
          hubId={hub.id}
          hubSlug={hub.slug}
          courseId={course.id}
          registrationId={registration.id}
          currentAttendanceStatus={registration.attendanceStatus}
          disabled={!canUpdateCourseAttendance(registration.status)}
        />
      ),
    },
  ];

  return (
    <div className={styles.root}>
      <PageHeader
        eyebrow="Course attendance"
        title="Attendance"
        description={`Update learner progression for ${course.title} while keeping enrolment status visible.`}
      />

      <div className={styles.stats}>
        <StatCard label="Enrolled" value={String(summary.enrolled)} detail="Attendance-eligible enrolments." />
        <StatCard label="Completed" value={String(summary.completed)} detail="Learners marked complete." />
        <StatCard label="Withdrawn" value={String(summary.withdrawn)} detail="Learners no longer progressing." />
        <StatCard label="Unmarked" value={String(summary.total - summary.completed - summary.withdrawn)} detail="Progress not marked yet." />
      </div>

      {!registrations.length ? (
        <EmptyState
          eyebrow="No attendance activity yet"
          title="Attendance depends on enrolments"
          description="Enrolments need to exist before you can track progression for this course."
          primaryAction={{ href: `/${hub.slug}/admin/courses/${course.id}/registrations`, label: "View registrations" }}
          secondaryAction={{ href: `/${hub.slug}/admin/courses/${course.id}`, label: "Back to course" }}
        />
      ) : (
        <WorkspaceSection
          eyebrow="Attendance"
          title="Attendance list"
          description="Work through progression updates quickly and keep enrolment context close by."
          actions={
            <>
              <Button href={`/${hub.slug}/admin/courses/${course.id}/registrations`} variant="secondary">
                Open registrations
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
            searchLabel="Search attendance records"
            searchPlaceholder="Search learner name or email"
            filters={filters}
            getRecordKey={(registration) => registration.id}
            pagination={{
              itemLabel: "attendance records",
              pageSizeOptions: [5, 10, 20],
              defaultPageSize: 10,
            }}
            rowTone="accent"
            gridTemplateColumns="minmax(0, 1.6fr) minmax(0, 0.9fr) minmax(0, 0.8fr) 11rem"
            emptyState={{
              eyebrow: "No matching attendance records",
              title: "No attendance records match the current filters",
              description: "Try adjusting the progress or registration filters to focus the marking queue.",
            }}
          />
        </WorkspaceSection>
      )}
    </div>
  );
}
