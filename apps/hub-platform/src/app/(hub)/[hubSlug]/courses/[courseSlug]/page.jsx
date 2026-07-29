import { notFound } from "next/navigation";
import CourseDetailsSection from "@/components/sections/course-details-section/CourseDetailsSection";
import { getPublicCourseDetailData } from "@/lib/data/public-site";
import { enrolPublicCourseAction } from "./actions";
import { getTemplateContentWidth, getTemplateCourseDetailPageConfig } from "@/lib/templates/template-registry";

export default async function CourseDetailPage({ params }) {
  const { hubSlug, courseSlug } = await params;
  const {
    hub,
    course,
    enrolledCount,
    currentMemberSession,
    currentRegistration,
    detailAccessMode,
  } = await getPublicCourseDetailData(hubSlug, courseSlug);

  if (!course) {
    notFound();
  }

  const pageTemplate = getTemplateCourseDetailPageConfig(hub.template);
  const contentWidth = getTemplateContentWidth(hub.template);

  return (
    <CourseDetailsSection
      hubSlug={hub.slug}
      routeMode={hub.routeMode}
      locale={hub.locale}
      course={course}
      enrolledCount={enrolledCount}
      currentMemberSession={currentMemberSession}
      currentRegistration={currentRegistration}
      detailAccessMode={detailAccessMode}
      enrolmentAction={enrolPublicCourseAction}
      variant={pageTemplate.detail.variant}
      containerWidth={contentWidth}
    />
  );
}
