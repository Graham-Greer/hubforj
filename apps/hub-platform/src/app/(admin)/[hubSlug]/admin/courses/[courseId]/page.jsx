import { Suspense } from "react";
import CourseDetailWorkspace from "@/components/patterns/course-detail-workspace/CourseDetailWorkspace";
import { AdminProgrammeDetailFallback } from "@/components/patterns/admin-route-fallbacks/AdminRouteFallbacks";
import EditCourseForm from "./EditCourseForm";
import { requireHubBySlug } from "@/lib/data/hubs";
import { getCourseById } from "@/lib/data/courses";
import { getHubPaymentConfigurationByHubId } from "@/lib/data/hub-payment-configurations";
import { getCourseRegistrationSummary } from "@/lib/data/course-registrations";
import { resolveHubPackageEntitlements } from "@/lib/domain/hub-package";
import { getHubPaymentSetupState } from "@/lib/domain/hub-payment-configuration";
import { listMediaFoldersByHubId } from "@/lib/data/media";
import { notFound } from "next/navigation";

async function CourseDetailContent({ hubSlug, courseId, query }) {
  const coursesSearchParams = new URLSearchParams();

  ["q", "status", "pricing", "format"].forEach((key) => {
    const value = query?.[key];

    if (typeof value === "string" && value) {
      coursesSearchParams.set(key, value);
    }
  });

  const coursesQuery = coursesSearchParams.toString();
  const hub = await requireHubBySlug(hubSlug);
  const entitlements = resolveHubPackageEntitlements(hub);
  const [course, mediaFolders, paymentConfiguration] = await Promise.all([
    getCourseById(hub.id, courseId),
    listMediaFoldersByHubId(hub.id),
    getHubPaymentConfigurationByHubId(hub.id),
  ]);
  const paymentSetupState = getHubPaymentSetupState(hub, paymentConfiguration);
  const isEditing = String(query?.mode || "") === "edit";

  if (!course) {
    notFound();
  }

  const registrationSummary = course.registrationSummaryUpdatedAt
    ? {
        registrationCount: course.registrationCount,
        enrolledRegistrationCount: course.enrolledRegistrationCount,
        waitlistedRegistrationCount: course.waitlistedRegistrationCount,
        cancelledRegistrationCount: course.cancelledRegistrationCount,
        attendanceActiveCount: course.attendanceActiveCount,
      }
    : await getCourseRegistrationSummary(hub.id, course.id, {
        repairProjection: entitlements.capabilities?.coursesEnabled === true,
        actorId: "course-detail-summary-repair",
      });
  const attendanceCount = Number(registrationSummary.attendanceActiveCount || 0);
  const registrationCount = Number(registrationSummary.enrolledRegistrationCount || 0);
  const hasAttendanceRegistrations = Number(registrationSummary.registrationCount || 0) > 0;

  return (
    <CourseDetailWorkspace
      hub={hub}
      course={course}
      coursesQuery={coursesQuery}
      isEditing={isEditing}
      attendanceCount={attendanceCount}
      registrationCount={registrationCount}
      canExportAttendanceReport={entitlements.capabilities?.reportingEnabled === true}
      hasAttendanceRegistrations={hasAttendanceRegistrations}
      editForm={
        <EditCourseForm
          hub={hub}
          course={course}
          mediaAssets={course.imageAsset ? [course.imageAsset] : []}
          mediaFolders={mediaFolders}
          paymentSetupState={paymentSetupState}
        />
      }
    />
  );
}

export default async function CourseDetailPage({ params, searchParams }) {
  const { hubSlug, courseId } = await params;
  const query = await searchParams;

  return (
    <Suspense fallback={<AdminProgrammeDetailFallback kind="course" />}>
      <CourseDetailContent hubSlug={hubSlug} courseId={courseId} query={query} />
    </Suspense>
  );
}
