import { NextResponse } from "next/server";
import { requireCurrentMemberSessionForHub } from "@/lib/auth/member-session";
import { requireHubBySlug } from "@/lib/data/hubs";
import { getCourseBySlug } from "@/lib/data/courses";
import { getCourseRegistrationByUser } from "@/lib/data/course-registrations";
import { resolveHubRuntimeRouteMode } from "@/lib/domain/hub-hosts";
import { buildHubRuntimeHref } from "@/lib/domain/hub-runtime-paths";
import { startCourseRegistrationCheckout } from "@/lib/server/course-registration-checkout";

function normalizeString(value) {
  return String(value || "").trim();
}

export async function GET(request, { params }) {
  const { hubSlug, courseSlug } = await params;
  const hub = await requireHubBySlug(hubSlug);
  const requestHost = normalizeString(request.headers.get("x-forwarded-host") || request.headers.get("host"));
  const routeMode = resolveHubRuntimeRouteMode(requestHost);
  const detailPath = buildHubRuntimeHref(hub.slug, `/courses/${courseSlug}`, routeMode);
  const coursesPath = buildHubRuntimeHref(hub.slug, "/courses", routeMode);
  const nextStepsPath = buildHubRuntimeHref(hub.slug, `/courses/${courseSlug}/enrolment/next-steps`, routeMode);
  const memberSession = await requireCurrentMemberSessionForHub(hub, detailPath);
  const course = await getCourseBySlug(hub.slug, courseSlug);

  if (!course) {
    return NextResponse.redirect(new URL(coursesPath, request.url));
  }

  const registration = await getCourseRegistrationByUser(hub.id, course.id, memberSession.user.id);

  if (!registration) {
    return NextResponse.redirect(new URL(detailPath, request.url));
  }

  try {
    const checkout = await startCourseRegistrationCheckout({
      hub,
      course,
      registration,
      memberSession,
      actorId: memberSession.user.id,
      requestHost,
      routeMode,
    });

    return NextResponse.redirect(checkout.checkoutUrl);
  } catch {
    return NextResponse.redirect(new URL(nextStepsPath, request.url));
  }
}
