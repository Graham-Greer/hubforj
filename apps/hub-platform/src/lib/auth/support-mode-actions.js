"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { buildSupportModeCookieOptions, supportModeCookieName } from "@/lib/auth/support-mode";

function normalizeString(value) {
  return String(value || "").trim();
}

export async function exitSupportModeAction(hubId = "") {
  const cookieStore = await cookies();
  cookieStore.set(supportModeCookieName, "", {
    ...buildSupportModeCookieOptions(),
    maxAge: 0,
  });

  const normalizedHubId = normalizeString(hubId);
  redirect(normalizedHubId ? `/platform/hubs/${normalizedHubId}?support=exited` : "/platform/hubs?support=exited");
}
