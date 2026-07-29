import ThemeScope from "@/components/primitives/theme-scope/ThemeScope";
import PlatformShell from "@/components/patterns/platform-shell/PlatformShell";
import { platformNavGroups } from "@/lib/navigation/platform-nav";
import { cookies } from "next/headers";
import { normalizeOperatorTheme, operatorThemeCookieName } from "@/lib/theme/operator-theme";
import { requireCurrentSuperadminSession } from "@/lib/auth/platform-session";

export default async function PlatformLayout({ children }) {
  const cookieStore = await cookies();
  const operatorTheme = normalizeOperatorTheme(cookieStore.get(operatorThemeCookieName)?.value);
  const operatorSession = await requireCurrentSuperadminSession();

  return (
    <ThemeScope theme={operatorTheme} scopeName="operator">
      <PlatformShell
        shellTitle="Hub Platform"
        shellAudience="Superadmin"
        shellSubject="Provisioning and support"
        navGroups={platformNavGroups}
        operatorTheme={operatorTheme}
        operatorSession={operatorSession}
      >
        {children}
      </PlatformShell>
    </ThemeScope>
  );
}
