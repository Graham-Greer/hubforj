import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createSessionCookieFromIdToken, setSessionCookie, clearSession } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

function buildRateLimitKey(ip) {
  return `auth-session:${ip || "unknown"}`;
}

function getRequestIp(headerStore) {
  const forwardedFor = String(headerStore.get("x-forwarded-for") || "");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return String(headerStore.get("x-real-ip") || "").trim();
}

export async function POST(request) {
  const headerStore = await headers();
  const ip = getRequestIp(headerStore);
  const limit = checkRateLimit({
    key: buildRateLimitKey(ip),
    windowMs: 60_000,
    maxRequests: 20,
  });

  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, code: "RATE_LIMITED", message: "Too many sign-in attempts. Please retry shortly." },
      {
        status: 429,
        headers: {
          "Retry-After": String(limit.retryAfterSeconds),
        },
      }
    );
  }

  try {
    const body = await request.json();
    const idToken = String(body?.idToken || "").trim();
    if (!idToken) {
      return NextResponse.json(
        { ok: false, code: "INVALID_REQUEST", message: "Missing idToken." },
        { status: 400 }
      );
    }

    const sessionCookie = await createSessionCookieFromIdToken(idToken);
    await setSessionCookie(sessionCookie);

    return NextResponse.json({ ok: true });
  } catch {
    await clearSession();
    return NextResponse.json(
      { ok: false, code: "UNAUTHORIZED", message: "Unable to establish a valid session." },
      { status: 401 }
    );
  }
}

export async function DELETE() {
  await clearSession();
  return NextResponse.json({ ok: true });
}
