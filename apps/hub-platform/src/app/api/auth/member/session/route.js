import { after, NextResponse } from "next/server";
import { resolveHubAuthRedirect } from "@/lib/auth/hub-auth-redirects";
import {
  createHubUserSessionFromIdToken,
  rebuildSignedInMemberDirectoryBestEffort,
  updateMemberLastSignedInBestEffort,
} from "@/lib/auth/member-auth";
import { buildSessionCookieOptions, sessionCookieName } from "@/lib/auth/session";
import { createPerformanceTimer } from "@/lib/observability/performance-timing";

function normalizeString(value) {
  return String(value || "").trim();
}

function buildPublicViewerPayload(user) {
  const role = normalizeString(user?.role);

  return {
    viewerState: role === "member" ? "member" : "admin",
    user: {
      name: normalizeString(user?.name),
      email: normalizeString(user?.email),
      avatarAsset: user?.avatarAsset || null,
    },
  };
}

export async function POST(request) {
  const timer = createPerformanceTimer("member-session-route");
  let body;

  try {
    body = await request.json();
    timer.log("request-json-parsed");
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const hubSlug = normalizeString(body?.hubSlug);
  const idToken = normalizeString(body?.idToken);
  const nextPath = normalizeString(body?.nextPath);
  const routeMode = normalizeString(body?.routeMode);

  try {
    const session = await createHubUserSessionFromIdToken(hubSlug, idToken);
    timer.log("session-created", {
      hubId: session.hub.id,
      userId: session.user.id,
      role: session.user.role,
    });
    const response = NextResponse.json({
      ok: true,
      redirectTo: resolveHubAuthRedirect(session.hub.slug, session.user.role, nextPath, routeMode),
      viewer: buildPublicViewerPayload(session.user),
    });

    response.cookies.set(sessionCookieName, session.sessionValue, buildSessionCookieOptions());
    timer.log("response-prepared", {
      hubId: session.hub.id,
      userId: session.user.id,
    });
    after(async () => {
      const afterTimer = createPerformanceTimer("member-session-route-after", {
        hubId: session.hub.id,
        userId: session.user.id,
      });
      await Promise.all([
        updateMemberLastSignedInBestEffort(session.hub, session.user).then((updatedAt) => {
          afterTimer.log("last-sign-in-updated", {
            updated: Boolean(updatedAt),
          });
          return updatedAt;
        }),
        rebuildSignedInMemberDirectoryBestEffort(session.hub, session.user).then((result) => {
          afterTimer.log("member-directory-refreshed", {
            refreshed: Boolean(result),
          });
          return result;
        }),
      ]);
      afterTimer.end();
    });
    timer.end({
      hubId: session.hub.id,
      userId: session.user.id,
    });
    return response;
  } catch (error) {
    timer.end({
      status: "error",
      error: String(error?.message || "Unable to establish member session."),
    });
    return NextResponse.json(
      {
        error: String(error?.message || "Unable to establish member session."),
      },
      { status: 400 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });

  response.cookies.set(sessionCookieName, "", {
    ...buildSessionCookieOptions(),
    maxAge: 0,
  });

  return response;
}
