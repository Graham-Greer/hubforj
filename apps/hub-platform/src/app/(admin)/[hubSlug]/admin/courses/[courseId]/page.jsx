import { Suspense } from "react";
import { headers } from "next/headers";
import CourseDetailWorkspace from "@/components/patterns/course-detail-workspace/CourseDetailWorkspace";
import { AdminProgrammeDetailFallback } from "@/components/patterns/admin-route-fallbacks/AdminRouteFallbacks";
import EditCourseForm from "./EditCourseForm";
import { requireHubBySlug } from "@/lib/data/hubs";
import { getCourseById } from "@/lib/data/courses";
import { getHubPaymentConfigurationByHubId } from "@/lib/data/hub-payment-configurations";
import { resolveCourseRegistrationSummary } from "@/lib/data/course-registrations";
import { resolveHubPackageEntitlements } from "@/lib/domain/hub-package";
import { getHubPaymentSetupState } from "@/lib/domain/hub-payment-configuration";
import { getRequestHostFromHeaders, resolveHubRuntimeRouteMode } from "@/lib/domain/hub-hosts";
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
  const headerStore = await headers();
  const routeMode = resolveHubRuntimeRouteMode(getRequestHostFromHeaders(headerStore));
  const hub = await requireHubBySlug(hubSlug);
  const entitlements = resolveHubPackageEntitlements(hub);
  const course = await getCourseById(hub.id, courseId);
  const isEditing = String(query?.mode || "") === "edit";

  if (!course) {
    notFound();
  }

  const registrationSummary = await resolveCourseRegistrationSummary(hub.id, course, {
    repairProjection: entitlements.capabilities?.coursesEnabled === true,
    actorId: "course-detail-summary-repair",
  });
  const attendanceCount = Number(registrationSummary.attendanceActiveCount || 0);
  const registrationCount = Number(registrationSummary.enrolledRegistrationCount || 0);
  const hasAttendanceRegistrations = Number(registrationSummary.registrationCount || 0) > 0;
  const editForm = isEditing
    ? await (async () => {
        const [mediaFolders, paymentConfiguration] = await Promise.all([
          listMediaFoldersByHubId(hub.id),
          getHubPaymentConfigurationByHubId(hub.id),
        ]);
        const paymentSetupState = getHubPaymentSetupState(hub, paymentConfiguration);

        return (
          <EditCourseForm
            hub={hub}
            course={course}
            mediaAssets={course.imageAsset ? [course.imageAsset] : []}
            mediaFolders={mediaFolders}
            paymentSetupState={paymentSetupState}
            routeMode={routeMode}
          />
        );
      })()
    : null;

  return (
    <CourseDetailWorkspace
      hub={hub}
      course={course}
      coursesQuery={coursesQuery}
      isEditing={isEditing}
      routeMode={routeMode}
      attendanceCount={attendanceCount}
      registrationCount={registrationCount}
      canExportAttendanceReport={entitlements.capabilities?.reportingEnabled === true}
      hasAttendanceRegistrations={hasAttendanceRegistrations}
      editForm={editForm}
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
