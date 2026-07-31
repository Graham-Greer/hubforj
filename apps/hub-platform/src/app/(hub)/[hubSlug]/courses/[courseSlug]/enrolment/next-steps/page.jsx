import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import SectionContainer from "@/components/sections/section-container/SectionContainer";
import SectionShell from "@/components/sections/section-shell/SectionShell";
import OfferingNextStepsWorkspace from "@/components/patterns/offering-next-steps-workspace/OfferingNextStepsWorkspace";
import { requireCurrentMemberSessionForHub } from "@/lib/auth/member-session";
import { requireHubBySlug } from "@/lib/data/hubs";
import { getPublicCourseNextStepsData } from "@/lib/data/public-site";
import { getRequestHostFromHeaders, resolveHubRuntimeRouteMode } from "@/lib/domain/hub-hosts";
import { buildHubRuntimeHref } from "@/lib/domain/hub-runtime-paths";
import { buildPublicCourseNextStepsModel } from "@/lib/domain/public-offering-next-steps";

export default async function CourseEnrolmentNextStepsPage({ params }) {
  const { hubSlug, courseSlug } = await params;
  const hub = await requireHubBySlug(hubSlug);
  const requestHeaders = await headers();
  const routeMode = resolveHubRuntimeRouteMode(getRequestHostFromHeaders(requestHeaders));
  const runtimeHub = { ...hub, routeMode };
  const nextStepsPath = buildHubRuntimeHref(runtimeHub.slug, `/courses/${courseSlug}/enrolment/next-steps`, runtimeHub.routeMode);
  const memberSession = await requireCurrentMemberSessionForHub(runtimeHub, nextStepsPath);
  const { course, currentRegistration } = await getPublicCourseNextStepsData(hub.slug, courseSlug, memberSession.user.id);

  if (!course) {
    notFound();
  }

  if (!currentRegistration) {
    redirect(buildHubRuntimeHref(runtimeHub.slug, `/courses/${course.slug}`, runtimeHub.routeMode));
  }

  return (
    <SectionShell surface="transparent" spacing="default">
      <SectionContainer width="default">
        <OfferingNextStepsWorkspace
          model={buildPublicCourseNextStepsModel({
            hub: runtimeHub,
            course,
            registration: currentRegistration,
          })}
        />
      </SectionContainer>
    </SectionShell>
  );
}
