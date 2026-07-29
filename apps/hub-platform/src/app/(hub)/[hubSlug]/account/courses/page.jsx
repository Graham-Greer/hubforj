import { headers } from "next/headers";
import MemberCourseWorkspace from "@/components/patterns/member-course-workspace/MemberCourseWorkspace";
import { requireCurrentMemberSessionForHub } from "@/lib/auth/member-session";
import { listCourseRegistrationsByUser } from "@/lib/data/course-registrations";
import { requireHubBySlug } from "@/lib/data/hubs";
import { getRequestHostFromHeaders, resolveHubRuntimeRouteMode } from "@/lib/domain/hub-hosts";

export default async function MemberCoursesPage({ params }) {
  const { hubSlug } = await params;
  const hubRecord = await requireHubBySlug(hubSlug);
  const requestHeaders = await headers();
  const routeMode = resolveHubRuntimeRouteMode(getRequestHostFromHeaders(requestHeaders));
  const hub = { ...hubRecord, routeMode };
  const memberSession = await requireCurrentMemberSessionForHub(hub, `/${hub.slug}/account/courses`);
  const registrations = await listCourseRegistrationsByUser(hub.id, memberSession.user.id);

  return <MemberCourseWorkspace hub={hub} registrations={registrations} memberName={memberSession.user.name} />;
}
