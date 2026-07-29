import CourseRegistrationWorkspace from "@/components/patterns/course-registration-workspace/CourseRegistrationWorkspace";
import { getCourseById } from "@/lib/data/courses";
import { listCourseRegistrations } from "@/lib/data/course-registrations";
import { requireHubBySlug } from "@/lib/data/hubs";
import { notFound } from "next/navigation";

export default async function CourseRegistrationsPage({ params }) {
  const { hubSlug, courseId } = await params;
  const hub = await requireHubBySlug(hubSlug);
  const course = await getCourseById(hub.id, courseId);

  if (!course) {
    notFound();
  }

  const registrations = await listCourseRegistrations(hub.id, course.id);
  return <CourseRegistrationWorkspace hub={hub} course={course} registrations={registrations} />;
}
