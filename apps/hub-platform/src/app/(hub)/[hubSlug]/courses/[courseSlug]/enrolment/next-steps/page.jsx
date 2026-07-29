import { notFound, redirect } from "next/navigation";
import SectionContainer from "@/components/sections/section-container/SectionContainer";
import SectionShell from "@/components/sections/section-shell/SectionShell";
import OfferingNextStepsWorkspace from "@/components/patterns/offering-next-steps-workspace/OfferingNextStepsWorkspace";
import { requireCurrentMemberSessionForHub } from "@/lib/auth/member-session";
import { requireHubBySlug } from "@/lib/data/hubs";
import { getPublicCourseNextStepsData } from "@/lib/data/public-site";
import { buildPublicCourseNextStepsModel } from "@/lib/domain/public-offering-next-steps";

export default async function CourseEnrolmentNextStepsPage({ params }) {
  const { hubSlug, courseSlug } = await params;
  const hub = await requireHubBySlug(hubSlug);
  const nextStepsPath = `/${hub.slug}/courses/${courseSlug}/enrolment/next-steps`;
  const memberSession = await requireCurrentMemberSessionForHub(hub, nextStepsPath);
  const { course, currentRegistration } = await getPublicCourseNextStepsData(hub.slug, courseSlug, memberSession.user.id);

  if (!course) {
    notFound();
  }

  if (!currentRegistration) {
    redirect(`/${hub.slug}/courses/${course.slug}`);
  }

  return (
    <SectionShell surface="transparent" spacing="default">
      <SectionContainer width="default">
        <OfferingNextStepsWorkspace
          model={buildPublicCourseNextStepsModel({
            hub,
            course,
            registration: currentRegistration,
          })}
        />
      </SectionContainer>
    </SectionShell>
  );
}
