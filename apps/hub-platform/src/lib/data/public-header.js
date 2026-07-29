try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { headers } from "next/headers";
import { getCurrentAdminSessionForHub, getCurrentMemberSessionForHub } from "@/lib/auth/member-session";
import { resolvePublicHeaderModel } from "@/lib/domain/public-header";
import { getRequestHostFromHeaders, resolveHubRuntimeRouteMode } from "@/lib/domain/hub-hosts";

export async function getPublicHeaderModel(hub, siteSettings) {
  const [memberSession, adminSession] = await Promise.all([
    getCurrentMemberSessionForHub(hub),
    getCurrentAdminSessionForHub(hub),
  ]);
  const requestHeaders = await headers();
  const routeMode = resolveHubRuntimeRouteMode(getRequestHostFromHeaders(requestHeaders));

  return resolvePublicHeaderModel({
    hub,
    siteSettings,
    memberSession,
    adminSession,
    routeMode,
  });
}
