import { NextResponse } from "next/server";
import { requireCurrentMemberSessionForHub } from "@/lib/auth/member-session";
import { requireHubBySlug } from "@/lib/data/hubs";
import { getCourseBySlug } from "@/lib/data/courses";
import { resolveHubRuntimeRouteMode } from "@/lib/domain/hub-hosts";
import { buildHubRuntimeHref } from "@/lib/domain/hub-runtime-paths";
import { finalizeCourseRegistrationCheckoutReturn } from "@/lib/server/course-registration-checkout";

function normalizeString(value) {
  return String(value || "").trim();
}

export async function GET(request, { params }) {
  const { hubSlug, courseSlug } = await params;
  const url = new URL(request.url);
  const transactionId = normalizeString(url.searchParams.get("transaction"));
  const sessionId = normalizeString(url.searchParams.get("session_id"));
  const state = normalizeString(url.searchParams.get("state"));
  const hub = await requireHubBySlug(hubSlug);
  const requestHost = normalizeString(request.headers.get("x-forwarded-host") || request.headers.get("host"));
  const routeMode = resolveHubRuntimeRouteMode(requestHost);
  const course = await getCourseBySlug(hub.slug, courseSlug);

  if (!course) {
    return NextResponse.redirect(new URL(buildHubRuntimeHref(hub.slug, "/courses", routeMode), request.url));
  }

  const nextStepsPath = buildHubRuntimeHref(hub.slug, `/courses/${course.slug}/enrolment/next-steps`, routeMode);

  if (state === "cancelled") {
    return NextResponse.redirect(new URL(`${nextStepsPath}?success=checkoutCancelled`, request.url));
  }

  try {
    const memberSession = await requireCurrentMemberSessionForHub(hub, nextStepsPath);
    const result = await finalizeCourseRegistrationCheckoutReturn({
      hub,
      course,
      memberSession,
      transactionId,
      sessionId,
      actorId: memberSession.user.id,
    });

    return NextResponse.redirect(
      new URL(
        `${nextStepsPath}?success=${result.paid ? "checkoutSubmitted" : "checkoutCompleted"}`,
        request.url
      )
    );
  } catch {
    return NextResponse.redirect(new URL(`${nextStepsPath}?success=checkoutCompleted`, request.url));
  }
}
