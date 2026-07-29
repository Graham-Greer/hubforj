import ThemeScope from "@/components/primitives/theme-scope/ThemeScope";
import HubAdminShell from "@/components/patterns/hub-admin-shell/HubAdminShell";
import AdminOnboardingProvider from "@/components/patterns/admin-onboarding/AdminOnboardingProvider";
import { requireHubBySlug } from "@/lib/data/hubs";
import { getHubAdminNavGroups } from "@/lib/navigation/hub-admin-nav";
import { cookies } from "next/headers";
import { normalizeOperatorTheme, operatorThemeCookieName } from "@/lib/theme/operator-theme";
import { getCurrentSuperadminSession } from "@/lib/auth/platform-session";
import { getSupportModeForHub } from "@/lib/auth/support-mode";
import { getCurrentAdminSessionForHub, requireCurrentAdminSessionForHub } from "@/lib/auth/member-session";
import { notFound, redirect } from "next/navigation";

export default async function HubAdminLayout({ children, params }) {
  const { hubSlug } = await params;
  const cookieStore = await cookies();
  const operatorTheme = normalizeOperatorTheme(cookieStore.get(operatorThemeCookieName)?.value);
  const operatorSession = await getCurrentSuperadminSession();
  let hub;

  try {
    hub = await requireHubBySlug(hubSlug);
  } catch {
    notFound();
  }

  const supportMode = operatorSession ? await getSupportModeForHub(hub) : null;
  const adminSession = operatorSession ? null : await getCurrentAdminSessionForHub(hub);

  if (operatorSession && !supportMode) {
    redirect(`/platform/support/${hub.id}`);
  }

  if (!operatorSession && !adminSession) {
    await requireCurrentAdminSessionForHub(hub, `/${hub.slug}/admin`);
  }

  return (
    <ThemeScope theme={operatorTheme} scopeName="operator">
      <HubAdminShell
        hub={hub}
        navGroups={getHubAdminNavGroups(hub)}
        operatorTheme={operatorTheme}
        operatorSession={operatorSession}
        adminSession={adminSession}
        supportMode={supportMode}
      >
        {adminSession ? (
          <AdminOnboardingProvider
            hub={hub}
            actorUserId={adminSession.user.id}
            actorRole={adminSession.user.role}
            operatorTheme={operatorTheme}
          >
            {children}
          </AdminOnboardingProvider>
        ) : (
          children
        )}
      </HubAdminShell>
    </ThemeScope>
  );
}
