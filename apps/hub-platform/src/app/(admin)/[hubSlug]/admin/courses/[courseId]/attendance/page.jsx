import { Suspense } from "react";
import { AdminOperationalTableFallback } from "@/components/patterns/admin-route-fallbacks/AdminRouteFallbacks";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import CourseAttendanceWorkspace from "@/components/patterns/course-attendance-workspace/CourseAttendanceWorkspace";
import { getCourseById } from "@/lib/data/courses";
import { listCourseRegistrations } from "@/lib/data/course-registrations";
import { requireHubBySlug } from "@/lib/data/hubs";
import { notFound } from "next/navigation";

async function CourseAttendanceContent({ hubSlug, courseId }) {
  const hub = await requireHubBySlug(hubSlug);
  const course = await getCourseById(hub.id, courseId);

  if (!course) {
    notFound();
  }

  const registrations = await listCourseRegistrations(hub.id, course.id);
  return <CourseAttendanceWorkspace hub={hub} course={course} registrations={registrations} />;
}

export default async function CourseAttendancePage({ params }) {
  const { hubSlug, courseId } = await params;

  return (
    <Suspense
      fallback={
        <>
          <PageHeader
            eyebrow="Course attendance"
            title="Attendance"
            description="Update learner progression while keeping enrolment status visible."
          />
          <AdminOperationalTableFallback label="course attendance" />
        </>
      }
    >
      <CourseAttendanceContent hubSlug={hubSlug} courseId={courseId} />
    </Suspense>
  );
}
