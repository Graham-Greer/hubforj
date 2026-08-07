import AdminDirtyAwareBackButton from "@/components/patterns/admin-form-runtime/AdminDirtyAwareBackButton";
import { AdminFormRuntimeProvider } from "@/components/patterns/admin-form-runtime/AdminFormRuntime";
import Badge from "@/components/ui/badge/Badge";
import SectionRichText from "@/components/sections/primitives/section-rich-text/SectionRichText";
import Button from "@/components/ui/button/Button";
import Icon from "@/components/ui/icon/Icon";
import OfferingAdminSummaryPanel from "@/components/patterns/offering-admin-summary-panel/OfferingAdminSummaryPanel";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import { buildHubRuntimeHref } from "@/lib/domain/hub-runtime-paths";
import {
  formatCourseCapacity,
  formatCourseDateRange,
  formatCoursePrice,
  formatCourseSessionCount,
  getCourseFormatLabel,
  getCourseLevelLabel,
  getCourseStatusLabel,
  getCourseStatusTone,
  getCourseTypeLabel,
  getCourseVisibilityLabel,
} from "@/lib/domain/courses";
import styles from "./CourseDetailWorkspace.module.css";

function hasCourseHappened(course) {
  const endValue = String(course?.endAt || course?.startAt || course?.endDate || course?.startDate || "").trim();

  if (!endValue) {
    return false;
  }

  const date = new Date(endValue);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  return date.getTime() < today.getTime();
}

export default function CourseDetailWorkspace({
  hub,
  course,
  coursesQuery = "",
  isEditing = false,
  editForm = null,
  routeMode = "path",
  attendanceCount = 0,
  registrationCount = 0,
  canExportAttendanceReport = false,
  hasAttendanceRegistrations = false,
}) {
  const coursesListHref = buildHubRuntimeHref(hub.slug, `/admin/courses${coursesQuery ? `?${coursesQuery}` : ""}`, routeMode);
  const registrationsHref = buildHubRuntimeHref(hub.slug, `/admin/courses/${course.id}/registrations`, routeMode);
  const attendanceHref = buildHubRuntimeHref(hub.slug, `/admin/courses/${course.id}/attendance`, routeMode);
  const attendanceExportHref = buildHubRuntimeHref(hub.slug, `/admin/courses/${course.id}/attendance/export`, routeMode);
  const editHref = buildHubRuntimeHref(hub.slug, `/admin/courses/${course.id}?${new URLSearchParams({
    ...(coursesQuery ? Object.fromEntries(new URLSearchParams(coursesQuery)) : {}),
    mode: "edit",
  }).toString()}#edit-course-details`, routeMode);
  const shouldShowVerifiedAttendance = hasCourseHappened(course);
  const attendanceLabel = shouldShowVerifiedAttendance ? "Completed" : "Enrolled";
  const badges = (
    <>
      <Badge tone={getCourseStatusTone(course.status)}>{getCourseStatusLabel(course.status)}</Badge>
      <Badge tone="neutral">{getCourseTypeLabel(course)}</Badge>
    </>
  );
  const summaryActions = !isEditing ? (
    <>
      <Button href={registrationsHref} prefetch={false} variant="secondary">
        Manage enrollments
      </Button>
      <Button href={attendanceHref} prefetch={false} variant="secondary">
        Manage attendance
      </Button>
      {canExportAttendanceReport && hasAttendanceRegistrations ? (
        <Button href={attendanceExportHref} prefetch={false} variant="secondary">
          Export attendance CSV
        </Button>
      ) : null}
      <Button href={editHref} prefetch={false} variant="ghost">
        <Icon name="edit" />
        <span>Edit course</span>
      </Button>
    </>
  ) : null;
  const primaryFacts = [
    { label: "Schedule", value: formatCourseDateRange(course, hub.locale) },
    { label: "Delivery", value: getCourseFormatLabel(course.format) },
    { label: "Pricing", value: formatCoursePrice(course, hub.locale) },
    { label: "Capacity", value: formatCourseCapacity(course.capacity, registrationCount) },
  ];
  const secondaryFacts = [
    { label: "Sessions", value: formatCourseSessionCount(course.sessionCount) },
    { label: "Level", value: getCourseLevelLabel(course) },
    { label: "Visibility", value: getCourseVisibilityLabel(course.visibility) },
    {
      label: "Attendance",
      value: `${shouldShowVerifiedAttendance ? attendanceCount : registrationCount} ${attendanceLabel}`,
    },
    { label: "Waitlist", value: course.allowWaitlist ? "Enabled" : "Disabled" },
    { label: "Timezone", value: course.timezone || "To be confirmed" },
  ];
  const description = course.description ? <SectionRichText content={course.description} className={styles.description} /> : null;

  return (
    <AdminFormRuntimeProvider>
      <div className={styles.root}>
        <PageHeader
          eyebrow="Courses"
          title={course.title}
          description="Review the course at a glance, then move into editing, enrolments, or attendance without losing context."
          actions={
            <div className={styles.headerActions}>
              <AdminDirtyAwareBackButton
                href={coursesListHref}
                label="Back to courses"
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
            course.imageAsset?.publicUrl
              ? {
                  src: course.imageAsset.publicUrl,
                  alt: course.imageAlt || course.imageAsset.alt || course.title,
                }
              : null
          }
          primaryFacts={primaryFacts}
          secondaryFacts={secondaryFacts}
          summary={course.summary}
          description={description}
        />

        {isEditing ? (
          <WorkspaceSection
            id="edit-course-details"
            title="Edit course details"
            description="Keep editing inside the canonical course workspace so enrolment and attendance stay grounded in the same record."
          >
            {editForm}
          </WorkspaceSection>
        ) : null}
      </div>
    </AdminFormRuntimeProvider>
  );
}
