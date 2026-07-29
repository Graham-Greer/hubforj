import { NextResponse } from "next/server";
import { createPlatformSessionFromIdToken } from "@/lib/auth/platform-auth";
import { buildSessionCookieOptions, sessionCookieName } from "@/lib/auth/session";
import { buildSupportModeCookieOptions, supportModeCookieName } from "@/lib/auth/support-mode";

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

  const idToken = normalizeString(body?.idToken);
  const nextPath = normalizeString(body?.nextPath) || "/platform";

  try {
    const session = await createPlatformSessionFromIdToken(idToken);
    const response = NextResponse.json({
      ok: true,
      redirectTo: nextPath.startsWith("/") ? nextPath : "/platform",
    });

    response.cookies.set(sessionCookieName, session.sessionValue, buildSessionCookieOptions());
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error: String(error?.message || "Unable to establish operator session."),
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
  response.cookies.set(supportModeCookieName, "", {
    ...buildSupportModeCookieOptions(),
    maxAge: 0,
  });

  return response;
}
