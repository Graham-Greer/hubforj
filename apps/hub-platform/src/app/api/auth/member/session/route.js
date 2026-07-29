import { NextResponse } from "next/server";
import { resolveHubAuthRedirect } from "@/lib/auth/hub-auth-redirects";
import { createHubUserSessionFromIdToken } from "@/lib/auth/member-auth";
import { buildSessionCookieOptions, sessionCookieName } from "@/lib/auth/session";

function normalizeString(value) {
  return String(value || "").trim();
}

export async function POST(request) {
  let body;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const hubSlug = normalizeString(body?.hubSlug);
  const idToken = normalizeString(body?.idToken);
  const nextPath = normalizeString(body?.nextPath);
  const routeMode = normalizeString(body?.routeMode);

  try {
    const session = await createHubUserSessionFromIdToken(hubSlug, idToken);
    const response = NextResponse.json({
      ok: true,
      redirectTo: resolveHubAuthRedirect(session.hub.slug, session.user.role, nextPath, routeMode),
    });

    response.cookies.set(sessionCookieName, session.sessionValue, buildSessionCookieOptions());
    return response;
  } catch (error) {
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
