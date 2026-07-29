try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getCurrentSuperadminSession } from "@/lib/auth/platform-session";
import { getCurrentAdminSessionForHub } from "@/lib/auth/member-session";
import { getSupportModeForHub } from "@/lib/auth/support-mode";

export async function getCurrentHubOperatorAccess(hub) {
  const operatorSession = await getCurrentSuperadminSession();

  if (operatorSession) {
    const supportMode = await getSupportModeForHub(hub);
    if (supportMode) {
      return {
        actorId: operatorSession.user.id,
        actorRole: "superadmin",
        mode: "support",
        operatorSession,
        supportMode,
      };
    }
  }

  const adminSession = await getCurrentAdminSessionForHub(hub);
  if (adminSession) {
    return {
      actorId: adminSession.user.id,
      actorRole: adminSession.user.role,
      mode: "admin",
      adminSession,
    };
  }

  return null;
}
