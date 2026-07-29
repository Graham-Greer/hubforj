import CourseAttendanceWorkspace from "@/components/patterns/course-attendance-workspace/CourseAttendanceWorkspace";
import { getCourseById } from "@/lib/data/courses";
import { listCourseRegistrations } from "@/lib/data/course-registrations";
import { requireHubBySlug } from "@/lib/data/hubs";
import { notFound } from "next/navigation";

export default async function CourseAttendancePage({ params }) {
  const { hubSlug, courseId } = await params;
  const hub = await requireHubBySlug(hubSlug);
  const course = await getCourseById(hub.id, courseId);

  if (!course) {
    notFound();
  }

  const registrations = await listCourseRegistrations(hub.id, course.id);
  return <CourseAttendanceWorkspace hub={hub} course={course} registrations={registrations} />;
}
