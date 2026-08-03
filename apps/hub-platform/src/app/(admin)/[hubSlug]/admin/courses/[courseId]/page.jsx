import { Suspense } from "react";
import CourseDetailWorkspace from "@/components/patterns/course-detail-workspace/CourseDetailWorkspace";
import { AdminProgrammeDetailFallback } from "@/components/patterns/admin-route-fallbacks/AdminRouteFallbacks";
import EditCourseForm from "./EditCourseForm";
import { requireHubBySlug } from "@/lib/data/hubs";
import { getCourseById } from "@/lib/data/courses";
import { getHubPaymentConfigurationByHubId } from "@/lib/data/hub-payment-configurations";
import { listCourseRegistrations } from "@/lib/data/course-registrations";
import { resolveHubPackageEntitlements } from "@/lib/domain/hub-package";
import { getHubPaymentSetupState } from "@/lib/domain/hub-payment-configuration";
import { listMediaAssetsByHubId, listMediaFoldersByHubId } from "@/lib/data/media";
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
  const [course, mediaAssets, mediaFolders, registrations, paymentConfiguration] = await Promise.all([
    getCourseById(hub.id, courseId),
    listMediaAssetsByHubId(hub.id),
    listMediaFoldersByHubId(hub.id),
    entitlements.capabilities?.coursesEnabled ? listCourseRegistrations(hub.id, courseId) : Promise.resolve([]),
    getHubPaymentConfigurationByHubId(hub.id),
  ]);
  const paymentSetupState = getHubPaymentSetupState(hub, paymentConfiguration);
  const isEditing = String(query?.mode || "") === "edit";

  if (!course) {
    notFound();
  }

  const attendanceCount = registrations.filter((registration) =>
    ["in_progress", "completed"].includes(String(registration.attendanceStatus || ""))
  ).length;
  const registrationCount = registrations.filter((registration) => registration.status === "enrolled").length;

  return (
    <CourseDetailWorkspace
      hub={hub}
      course={course}
      coursesQuery={coursesQuery}
      isEditing={isEditing}
      attendanceCount={attendanceCount}
      registrationCount={registrationCount}
      canExportAttendanceReport={entitlements.capabilities?.reportingEnabled === true}
      hasAttendanceRegistrations={registrations.length > 0}
      editForm={<EditCourseForm hub={hub} course={course} mediaAssets={mediaAssets} mediaFolders={mediaFolders} paymentSetupState={paymentSetupState} />}
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
