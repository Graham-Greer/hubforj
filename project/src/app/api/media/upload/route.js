import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth/session";
import { getHubById } from "@/lib/data/hubs/hub-repository";
import { uploadMediaAssets } from "@/lib/data/media/media-repository";
import { checkRateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

function getRequestIp(headerStore) {
  const forwardedFor = String(headerStore.get("x-forwarded-for") || "");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return String(headerStore.get("x-real-ip") || "").trim();
}

export async function POST(request) {
  const session = await getSession();
  if (!session || !["admin", "superadmin"].includes(session.role)) {
    return NextResponse.json(
      { ok: false, code: "FORBIDDEN", message: "Not authorized to upload media." },
      { status: 403 }
    );
  }

  const formData = await request.formData();
  const hubId = String(formData.get("hubId") || "").trim();
  const folderId = String(formData.get("folderId") || "").trim() || "all-assets";
  const files = formData.getAll("files").filter((entry) => entry && typeof entry === "object");

  if (!hubId || !files.length) {
    return NextResponse.json(
      { ok: false, code: "INVALID_REQUEST", message: "hubId and files are required." },
      { status: 400 }
    );
  }

  const hub = await getHubById(hubId);
  if (!hub) {
    return NextResponse.json(
      { ok: false, code: "NOT_FOUND", message: "Hub not found." },
      { status: 404 }
    );
  }

  if (session.role !== "superadmin" && session.hubId !== hubId) {
    return NextResponse.json(
      { ok: false, code: "FORBIDDEN", message: "You cannot upload media for this hub." },
      { status: 403 }
    );
  }

  const headerStore = await headers();
  const ip = getRequestIp(headerStore);
  const limit = checkRateLimit({
    key: `media-upload:${session.uid}:${ip || "unknown"}`,
    windowMs: 60_000,
    maxRequests: 40,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, code: "RATE_LIMITED", message: "Too many uploads. Please retry shortly." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  try {
    const created = await uploadMediaAssets(hubId, files, { folderId }, session.uid);
    return NextResponse.json({ ok: true, items: created });
  } catch (error) {
    return NextResponse.json(
      { ok: false, code: "UPLOAD_FAILED", message: error?.message || "Unable to upload files." },
      { status: 400 }
    );
  }
}
