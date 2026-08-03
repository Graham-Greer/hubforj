import { NextResponse } from "next/server";
import { buildSessionCookieOptions, sessionCookieName } from "@/lib/auth/session";
import { consumeOwnerAdminHandoff } from "@/lib/auth/owner-admin-handoff";
import { buildHubAuthHref } from "@/lib/auth/hub-auth-redirects";
import { getRequestHostFromHeaders, resolveHubRuntimeRouteMode } from "@/lib/domain/hub-hosts";
import { buildHubRuntimeHref } from "@/lib/domain/hub-runtime-paths";

export const dynamic = "force-dynamic";

function normalizeString(value) {
  return String(value || "").trim();
}

function buildRedirectResponse(request, pathname) {
  return NextResponse.redirect(new URL(pathname, request.url));
}

export async function GET(request) {
  const url = new URL(request.url);
  const hubSlug = normalizeString(url.searchParams.get("hub"));
  const handoffId = normalizeString(url.searchParams.get("handoff"));
  const token = normalizeString(url.searchParams.get("token"));
  const requestHost = getRequestHostFromHeaders(request.headers);
  const routeMode = resolveHubRuntimeRouteMode(requestHost);

  try {
    const session = await consumeOwnerAdminHandoff({
      handoffId,
      token,
      requestHost,
    });
    const redirectPath = buildHubRuntimeHref(session.hubSlug, "/admin", routeMode);
    const response = buildRedirectResponse(request, redirectPath);

    response.cookies.set(sessionCookieName, session.sessionValue, buildSessionCookieOptions());
    return response;
  } catch (error) {
    console.warn("Owner admin handoff failed", {
      handoffId,
      hubSlug,
      host: requestHost,
      error: String(error?.message || error || "Unknown owner admin handoff error"),
    });

    const fallbackPath = hubSlug
      ? `${buildHubAuthHref(hubSlug, "sign-in", "", routeMode)}?handoff=expired`
      : "/sign-in?handoff=expired";

    return buildRedirectResponse(request, fallbackPath);
  }
}
