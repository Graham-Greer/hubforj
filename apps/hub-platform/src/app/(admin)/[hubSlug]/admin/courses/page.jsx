import { Suspense } from "react";
import { headers } from "next/headers";
import Button from "@/components/ui/button/Button";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import {
  AdminProgrammeListFallback,
  AdminRouteStack,
} from "@/components/patterns/admin-route-fallbacks/AdminRouteFallbacks";
import OfferingAdminListWorkspace from "@/components/patterns/offering-admin-list-workspace/OfferingAdminListWorkspace";
import { deleteCourseAction } from "./[courseId]/actions";
import {
  getCourseRegistrationSummaryFromCourse,
  isCourseRegistrationSummaryProjectionCurrent,
} from "@/lib/data/course-registration-shared";
import {
  formatCourseDateRange,
  getCourseFormatLabel,
  getCourseLevelLabel,
  getCourseStatusLabel,
  getCourseStatusTone,
  getCourseTypeLabel,
  getCourseVisibilityLabel,
} from "@/lib/domain/courses";
import { getSectionRichTextPlainText } from "@/lib/domain/section-rich-text";
import { getRequestHostFromHeaders, resolveHubRuntimeRouteMode } from "@/lib/domain/hub-hosts";
import { buildHubRuntimeHref } from "@/lib/domain/hub-runtime-paths";
import { listCoursesByHubSlug } from "@/lib/data/courses";
import { requireHubCoreBySlug } from "@/lib/data/hubs";

const filterDefinitions = [
  {
    key: "status",
    label: "Status",
    icon: "event_available",
    options: [
      { value: "all", label: "All" },
      { value: "draft", label: "Draft" },
      { value: "published", label: "Published" },
      { value: "cancelled", label: "Cancelled" },
    ],
  },
  {
    key: "pricing",
    label: "Pricing",
    icon: "payments",
    options: [
      { value: "all", label: "All" },
      { value: "free", label: "Free" },
      { value: "paid", label: "Paid" },
    ],
  },
  {
    key: "format",
    label: "Delivery",
    icon: "school",
    options: [
      { value: "all", label: "All" },
      { value: "in-person", label: "In person" },
      { value: "online", label: "Online" },
      { value: "hybrid", label: "Hybrid" },
    ],
  },
];

function buildAdminHref(hubSlug, pathname, routeMode) {
  return buildHubRuntimeHref(hubSlug, pathname, routeMode);
}

async function CoursesWorkspace({ hub, routeMode }) {
  const courses = await listCoursesByHubSlug(hub.slug);

  const items = courses.map((course) => {
    const scheduleLabel = formatCourseDateRange(course, hub.locale);
    const typeLabel = getCourseTypeLabel(course);
    const levelLabel = getCourseLevelLabel(course);
    const formatLabel = getCourseFormatLabel(course.format);
    const registrationSummary = getCourseRegistrationSummaryFromCourse(course);
    const enrolmentCount = Number(registrationSummary.enrolledRegistrationCount || 0);
    const completedCount = Number(registrationSummary.attendanceCompletedCount || 0);
    const inProgressCount = Number(registrationSummary.attendanceInProgressCount || 0);
    const unmarkedCount = Math.max(0, enrolmentCount - Number(registrationSummary.attendanceActiveCount || 0));
    const registrationProjectionCurrent = isCourseRegistrationSummaryProjectionCurrent(course);
    const statusBadge = { label: getCourseStatusLabel(course.status), tone: getCourseStatusTone(course.status) };
    const visibilityLabel = getCourseVisibilityLabel(course.visibility);
    const summary = course.summary || getSectionRichTextPlainText(course.description);

    return {
      id: course.id,
      status: course.status,
      title: course.title,
      scheduleLabel,
      temporalStartValue: course.startDate || "",
      temporalEndValue: course.endDate || course.startDate || "",
      dateSortValue: course.startDate || "",
      dateFilterValue: course.startDate || "",
      meta: [],
      summary,
      imageUrl: course.imageAsset?.publicUrl || "",
      imageAlt: course.imageAlt || course.imageAsset?.alt || course.title,
      badges: [statusBadge, { label: `${enrolmentCount} Enrolled`, tone: "accent" }],
      currentBadges: [statusBadge, { label: `${enrolmentCount} Enrolled`, tone: "accent" }],
      historyBadges: [
        statusBadge,
        registrationProjectionCurrent
          ? { label: `${completedCount} Completed`, tone: "accent" }
          : { label: "Attendance not synced", tone: "neutral" },
        registrationProjectionCurrent && unmarkedCount > 0
          ? { label: `${unmarkedCount} Unmarked`, tone: "warning" }
          : null,
        registrationProjectionCurrent && inProgressCount > 0
          ? { label: `${inProgressCount} In progress`, tone: "neutral" }
          : null,
      ].filter(Boolean),
      searchTerms: [typeLabel, levelLabel, formatLabel, visibilityLabel, summary],
      filterValues: {
        status: course.status,
        pricing: course.pricingMode || "free",
        format: course.format || "in-person",
      },
      primaryAction: {
        href: buildAdminHref(hub.slug, `/admin/courses/${course.id}`, routeMode),
        label: "Open course",
      },
      secondaryAction: {
        href: buildAdminHref(hub.slug, `/admin/courses/${course.id}?mode=edit`, routeMode),
        label: "Edit course",
      },
      deleteMenuLabel: "Delete course",
      deleteTitle: "Delete course",
      deleteDescription: `Delete ${course.title}? This cannot be undone.`,
      deleteBlockedNote: "Courses with existing registrations cannot be deleted.",
      deleteValues: {
        hubId: hub.id,
        hubSlug: hub.slug,
        courseId: course.id,
      },
    };
  });

  return (
    <OfferingAdminListWorkspace
      eyebrow="Courses"
      title="Manage courses"
      description="Review published and draft courses, filter the list quickly, and open the one you need to edit or manage."
      actions={<Button href={buildAdminHref(hub.slug, "/admin/courses/create", routeMode)} prefetch={false} data-onboarding="courses-create-button">Create course</Button>}
      items={items}
      showHeader={false}
      onboardingKey="courses-list"
      deleteAction={deleteCourseAction}
      deleteConfirmLabel="Delete course"
      filterDefinitions={filterDefinitions}
      enableTemporalView
      itemNounSingular="course"
      itemNounPlural="courses"
      emptyState={{
        eyebrow: "Courses",
        title: "No courses yet",
        description: "Create the first course when you are ready to manage structure, pricing, and enrolments.",
        primaryAction: { href: buildAdminHref(hub.slug, "/admin/courses/create", routeMode), label: "Create a course" },
        secondaryAction: { href: buildAdminHref(hub.slug, "/admin", routeMode), label: "Back to overview" },
      }}
    />
  );
}

export default async function CoursesPage({ params }) {
  const { hubSlug } = await params;
  const headerStore = await headers();
  const routeMode = resolveHubRuntimeRouteMode(getRequestHostFromHeaders(headerStore));
  const hub = await requireHubCoreBySlug(hubSlug);

  return (
    <AdminRouteStack>
      <PageHeader
        eyebrow="Courses"
        title="Manage courses"
        description="Review published and draft courses, filter the list quickly, and open the one you need to edit or manage."
        actions={<Button href={buildAdminHref(hub.slug, "/admin/courses/create", routeMode)} prefetch={false} data-onboarding="courses-create-button">Create course</Button>}
      />
      <Suspense fallback={<AdminProgrammeListFallback rows={2} filters={3} />}>
        <CoursesWorkspace hub={hub} routeMode={routeMode} />
      </Suspense>
    </AdminRouteStack>
  );
}
