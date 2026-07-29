"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requirePlatformOperatorActionAccess } from "@/lib/auth/action-access";
import { getHubById } from "@/lib/data/hubs";
import {
  buildSupportModeCookieOptions,
  buildSupportModeSession,
  createSupportModeValue,
  supportModeCookieName,
} from "@/lib/auth/support-mode";
import { getServerEnv } from "@/lib/config/env";
import { buildSupportRedirectPath } from "@/lib/navigation/support-mode";

export async function enterSupportModeAction(formData) {
  const hubId = String(formData.get("hubId") || "").trim();
  const { operatorSession } = await requirePlatformOperatorActionAccess(`/platform/support/${hubId}`);
  const hub = await getHubById(hubId);

  if (!hub) {
    redirect("/platform/hubs?error=hubNotFound");
  }

  const cookieStore = await cookies();
  const supportSession = buildSupportModeSession(operatorSession, hub);
  const supportValue = createSupportModeValue(supportSession, getServerEnv().sessionHmacSecret);

  cookieStore.set(supportModeCookieName, supportValue, buildSupportModeCookieOptions());
  redirect(`${buildSupportRedirectPath(hub)}?support=active`);
}
