import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import EmptyState from "@/components/patterns/empty-state/EmptyState";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import Surface from "@/components/primitives/surface/Surface";
import { buildHubRuntimeHref } from "@/lib/domain/hub-runtime-paths";
import {
  getCourseAttendanceStatusLabel,
  getCourseAttendanceStatusTone,
  getCoursePaymentStatusLabel,
  getCoursePaymentStatusTone,
  getCourseRegistrationStatusLabel,
  getCourseRegistrationStatusTone,
  splitCourseRegistrationsByTimeline,
} from "@/lib/domain/course-registrations";
import { formatCourseDateRange, formatCoursePrice } from "@/lib/domain/courses";
import styles from "./MemberCourseWorkspace.module.css";

function CourseList({ courses, hub }) {
  const routeMode = hub?.routeMode || "path";
  return (
    <div className={styles.list}>
      {courses.map((registration) => (
        <Surface key={registration.id} padding="md" className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>{registration.courseTitle || "Course enrolment"}</h2>
              <p className={styles.cardMeta}>{formatCourseDateRange(registration.courseStartAt, registration.courseEndAt, hub.locale)}</p>
            </div>
            <div className={styles.badges}>
              <Badge tone={getCourseRegistrationStatusTone(registration.status)}>{getCourseRegistrationStatusLabel(registration.status)}</Badge>
              <Badge tone={getCoursePaymentStatusTone(registration.paymentStatus)}>{getCoursePaymentStatusLabel(registration.paymentStatus)}</Badge>
              <Badge tone={getCourseAttendanceStatusTone(registration.attendanceStatus)}>{getCourseAttendanceStatusLabel(registration.attendanceStatus)}</Badge>
            </div>
          </div>
          <p className={styles.cardMeta}>{registration.courseScheduleSummary || "Schedule to be confirmed"}</p>
          <div className={styles.cardFooter}>
            <span>{formatCoursePrice({ pricingMode: registration.price ? "paid" : "free", price: registration.price, currency: registration.currency }, hub.locale)}</span>
            {registration.courseSlug ? <Button href={buildHubRuntimeHref(hub.slug, `/courses/${registration.courseSlug}`, routeMode)} variant="ghost">View course</Button> : null}
          </div>
        </Surface>
      ))}
    </div>
  );
}

export default function MemberCourseWorkspace({ hub, registrations, memberName = "" }) {
  const routeMode = hub?.routeMode || "path";
  const timeline = splitCourseRegistrationsByTimeline(registrations);

  if (!registrations.length) {
    return (
      <EmptyState
        eyebrow="Courses"
        title="No course enrolments yet"
        description="As soon as you join a course, this page should make your current commitment and progression easy to review."
        primaryAction={{ href: buildHubRuntimeHref(hub.slug, "/courses", routeMode), label: "Browse courses" }}
        secondaryAction={{ href: buildHubRuntimeHref(hub.slug, "/account", routeMode), label: "Back to account" }}
      />
    );
  }

  return (
    <div className={styles.root}>
      <PageHeader
        eyebrow="Courses"
        title="Courses"
        description="Keep current course participation front and center so members can understand their next commitment quickly."
        actions={
          <div className={styles.headerActions}>
            <Button href={buildHubRuntimeHref(hub.slug, "/courses", routeMode)} variant="secondary">Browse courses</Button>
            <Button href={buildHubRuntimeHref(hub.slug, "/account", routeMode)} variant="ghost">Back to account</Button>
          </div>
        }
      />

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Current courses</h2>
          <p className={styles.sectionDescription}>Active enrolments and in-progress participation.</p>
        </div>
        {timeline.upcoming.length ? (
          <CourseList courses={timeline.upcoming} hub={hub} />
        ) : (
          <EmptyState
            eyebrow="Current courses"
            title="No active course enrolments"
            description="As soon as you enrol in a course that is still upcoming or in progress, it will appear here."
            primaryAction={{ href: buildHubRuntimeHref(hub.slug, "/courses", routeMode), label: "Browse courses" }}
          />
        )}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Course history</h2>
          <p className={styles.sectionDescription}>Completed, withdrawn, or otherwise finished course records.</p>
        </div>
        {timeline.history.length ? (
          <CourseList courses={timeline.history} hub={hub} />
        ) : (
          <EmptyState
            eyebrow="Course history"
            title="No historical course records yet"
            description="Completed and withdrawn courses remain visible here once your course history begins to build."
          />
        )}
      </section>
    </div>
  );
}
